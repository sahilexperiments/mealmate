import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// SQLite stores everything as strings — parse JSON back on read
function parsePlan(p: { breakfast: string | null; lunch: string | null; dinner: string | null; preferences: string | null; createdAt: Date; updatedAt: Date; [key: string]: unknown }) {
  return {
    ...p,
    breakfast: p.breakfast ? JSON.parse(p.breakfast) : null,
    lunch: p.lunch ? JSON.parse(p.lunch) : null,
    dinner: p.dinner ? JSON.parse(p.dinner) : null,
    preferences: p.preferences ? JSON.parse(p.preferences) : null,
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
    updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt,
  };
}

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Missing x-user-id header' }, { status: 400 });

  const plans = await prisma.mealPlan.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });

  return NextResponse.json(plans.map(parsePlan));
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Missing x-user-id header' }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { date, breakfast, lunch, dinner, preferences } = body;
  if (!date) return NextResponse.json({ error: 'Missing date' }, { status: 400 });

  const data = {
    breakfast: breakfast ? JSON.stringify(breakfast) : null,
    lunch: lunch ? JSON.stringify(lunch) : null,
    dinner: dinner ? JSON.stringify(dinner) : null,
    preferences: preferences ? JSON.stringify(preferences) : null,
  };

  const plan = await prisma.mealPlan.upsert({
    where: { userId_date: { userId, date: date as string } },
    update: data,
    create: { userId, date: date as string, ...data },
  });

  return NextResponse.json(parsePlan(plan));
}
