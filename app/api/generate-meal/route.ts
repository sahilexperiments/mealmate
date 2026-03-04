import { NextRequest, NextResponse } from 'next/server';
import { generateMealSuggestion } from '@/lib/claude';
import type { MealType, DietType, CookLanguage } from '@/types/meal';

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not configured. Copy .env.local.example to .env.local and add your key.' },
      { status: 500 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { mealType, healthLevel, complexityLevel, dietType, cookLanguage, servings, previousMealName, allergens, gutFriendly, lessOfThese } = body;

  if (!mealType || healthLevel == null || complexityLevel == null) {
    return NextResponse.json(
      { error: 'Missing required fields: mealType, healthLevel, complexityLevel' },
      { status: 400 },
    );
  }

  try {
    const suggestion = await generateMealSuggestion({
      mealType: mealType as MealType,
      healthLevel: Number(healthLevel),
      complexityLevel: Number(complexityLevel),
      dietType: ((dietType as string) ?? 'vegetarian') as DietType,
      cookLanguage: ((cookLanguage as string) ?? 'hindi') as CookLanguage,
      servings: Number(servings) || 2,
      previousMealName: previousMealName as string | undefined,
      allergens: Array.isArray(allergens) ? (allergens as string[]) : [],
      gutFriendly: Boolean(gutFriendly),
      lessOfThese: Array.isArray(lessOfThese) ? (lessOfThese as string[]) : [],
    });

    return NextResponse.json(suggestion);
  } catch (error) {
    console.error('Meal generation error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate meal suggestion';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
