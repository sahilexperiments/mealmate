export type MealType = 'breakfast' | 'lunch' | 'dinner';

export type DietType = 'vegetarian' | 'non-vegetarian' | 'eggetarian' | 'jain';

export type CookLanguage =
  | 'english'
  | 'hindi'
  | 'tamil'
  | 'telugu'
  | 'kannada'
  | 'marathi'
  | 'bengali'
  | 'gujarati';

export type MealDietType = 'vegetarian' | 'eggetarian' | 'non-vegetarian';

export interface MealPreferences {
  health: number;     // 0 = very healthy → 100 = very indulgent
  complexity: number; // 0 = very easy   → 100 = very cumbersome
  dietType: MealDietType;
}

export interface UserProfile {
  dietType: DietType;
  cookLanguage: CookLanguage;
  servings: number;
  allergens: string[];
  gutFriendly: boolean;
  onboardingComplete: boolean;
}

export interface Ingredient {
  name: string;
  quantity: string;
  estimatedCostInr: number;
  isCleanLabel: boolean;
  brandRecommendation?: string;
}

export interface NutritionalValue {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface MealSuggestion {
  id: string;
  mealType: MealType;
  name: string;
  description: string;
  cuisine: string;
  nutritionalValue: NutritionalValue;
  ingredients: Ingredient[];
  totalCostInr: number;
  prepTimeMinutes: number;
  complexityLabel: 'Easy' | 'Medium' | 'Complex';
  voiceNoteText: string;
  tags: string[];
}

export interface PlanPreferences {
  breakfast: MealPreferences;
  lunch: MealPreferences;
  dinner: MealPreferences;
}

export interface SavedMealPlan {
  id: string;
  userId: string;
  date: string;
  breakfast?: MealSuggestion;
  lunch?: MealSuggestion;
  dinner?: MealSuggestion;
  preferences?: PlanPreferences;
  createdAt: string;
  updatedAt: string;
}
