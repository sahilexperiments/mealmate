import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { prisma } from './db';

export const authOptions: NextAuthOptions = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(prisma) as any,

  providers: [
    // ── Email + Password ────────────────────────────────────────────────────
    CredentialsProvider({
      id: 'credentials',
      name: 'Email',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),

    // ── Phone OTP ───────────────────────────────────────────────────────────
    // After OTP is verified via /api/auth/verify-otp, we call signIn('phone')
    // with the phone + a short-lived token returned from the verify endpoint.
    CredentialsProvider({
      id: 'phone',
      name: 'Phone',
      credentials: {
        phone: { label: 'Phone', type: 'text' },
        token: { label: 'Token', type: 'text' }, // one-time server-issued token
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.token) return null;

        // Verify the one-time token stored against the OTP record
        const otp = await prisma.otpCode.findFirst({
          where: {
            phone: credentials.phone,
            code: credentials.token,
            used: false,
            expires: { gte: new Date() },
          },
        });

        if (!otp) return null;

        // Mark used
        await prisma.otpCode.update({ where: { id: otp.id }, data: { used: true } });

        // Upsert user by phone
        const user = await prisma.user.upsert({
          where: { phone: credentials.phone },
          update: {},
          create: { phone: credentials.phone, name: credentials.phone },
        });

        return { id: user.id, email: user.email ?? undefined, name: user.name, image: user.image };
      },
    }),

    // ── Google SSO ──────────────────────────────────────────────────────────
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],

  session: {
    strategy: 'jwt',
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token.id && session.user) {
        (session.user as { id: string }).id = token.id as string;
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
  },

  secret: process.env.NEXTAUTH_SECRET,
};
