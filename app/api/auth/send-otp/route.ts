import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

function generateOtp(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    if (!phone || !/^\+?[0-9]{7,15}$/.test(phone.replace(/\s/g, ''))) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
    }

    const normalized = phone.replace(/\s/g, '');

    // Rate-limit: max 1 OTP per 60 seconds
    const recent = await prisma.otpCode.findFirst({
      where: { phone: normalized, createdAt: { gte: new Date(Date.now() - 60_000) } },
    });
    if (recent) {
      return NextResponse.json({ error: 'Please wait 60 seconds before requesting a new OTP' }, { status: 429 });
    }

    const code = generateOtp();
    const expires = new Date(Date.now() + 5 * 60_000); // 5 minutes

    await prisma.otpCode.create({ data: { phone: normalized, code, expires } });

    // ── SMS sending ────────────────────────────────────────────────────────
    // To enable real SMS, set SMS_PROVIDER=twilio and configure:
    //   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
    // For development, the OTP is returned in the response body.
    const isDev = process.env.NODE_ENV === 'development' || !process.env.SMS_PROVIDER;

    if (!isDev && process.env.SMS_PROVIDER === 'twilio') {
      // Install twilio package and set env vars to enable real SMS
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const twilio = require('twilio');
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      await client.messages.create({
        body: `Your MealMate OTP is: ${code}. Valid for 5 minutes.`,
        from: process.env.TWILIO_FROM_NUMBER,
        to: normalized,
      });
      return NextResponse.json({ sent: true });
    }

    // Dev mode — return OTP directly (remove in production)
    return NextResponse.json({ sent: true, devOtp: code });
  } catch (err) {
    console.error('[send-otp]', err);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
