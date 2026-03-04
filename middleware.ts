import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

// Only enforce auth if NEXTAUTH_SECRET is configured (allows local dev without auth)
export default withAuth(
  function middleware() {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ token }) {
        // If no secret is set, allow all (dev mode without auth)
        if (!process.env.NEXTAUTH_SECRET) return true;
        return !!token;
      },
    },
    pages: {
      signIn: '/login',
    },
  },
);

export const config = {
  // Protect all routes except login, static assets, and API auth routes
  matcher: ['/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)'],
};
