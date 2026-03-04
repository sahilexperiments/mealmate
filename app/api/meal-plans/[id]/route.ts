import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const userId = request.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Missing x-user-id header' }, { status: 400 });

  const plan = await prisma.mealPlan.findFirst({ where: { id: params.id, userId } });
  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

  const parsed = {
    ...plan,
    breakfast: plan.breakfast ? JSON.parse(plan.breakfast) : null,
    lunch: plan.lunch ? JSON.parse(plan.lunch) : null,
    dinner: plan.dinner ? JSON.parse(plan.dinner) : null,
    preferences: plan.preferences ? JSON.parse(plan.preferences) : null,
    createdAt: plan.createdAt instanceof Date ? plan.createdAt.toISOString() : plan.createdAt,
    updatedAt: plan.updatedAt instanceof Date ? plan.updatedAt.toISOString() : plan.updatedAt,
  };
  return NextResponse.json(parsed);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const userId = request.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Missing x-user-id header' }, { status: 400 });

  await prisma.mealPlan.deleteMany({ where: { id: params.id, userId } });
  return NextResponse.json({ success: true });
}
