import Anthropic from '@anthropic-ai/sdk';
import type { MealType, DietType, CookLanguage, MealSuggestion } from '@/types/meal';

const DIET_DESCRIPTIONS: Record<DietType, string> = {
  vegetarian: 'strictly vegetarian (no meat, poultry, fish, or eggs)',
  'non-vegetarian': 'non-vegetarian (can include meat, poultry, fish, and eggs)',
  eggetarian: 'eggetarian (vegetarian but eggs allowed)',
  jain: 'Jain (no meat, eggs, or root vegetables such as onion, garlic, potato, carrot, radish)',
};

const LANGUAGE_NAMES: Record<CookLanguage, string> = {
  english: 'English',
  hindi: 'Hindi (Devanagari script)',
  tamil: 'Tamil (Tamil script)',
  telugu: 'Telugu (Telugu script)',
  kannada: 'Kannada (Kannada script)',
  marathi: 'Marathi (Devanagari script)',
  bengali: 'Bengali (Bengali script)',
  gujarati: 'Gujarati (Gujarati script)',
};

export async function generateMealSuggestion(params: {
  mealType: MealType;
  healthLevel: number;
  complexityLevel: number;
  dietType: DietType;
  cookLanguage: CookLanguage;
  servings: number;
  previousMealName?: string;
  allergens?: string[];
  gutFriendly?: boolean;
  lessOfThese?: string[];
}): Promise<MealSuggestion> {
  const { mealType, healthLevel, complexityLevel, dietType, cookLanguage, servings, previousMealName, allergens, gutFriendly, lessOfThese } = params;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured. Add it to .env.local');

  const client = new Anthropic({ apiKey });

  const healthDesc =
    healthLevel < 25 ? 'very healthy and nutritious (maximum nutrition focus)' :
    healthLevel < 50 ? 'mostly healthy with slight indulgence' :
    healthLevel < 75 ? 'moderately indulgent (comfort food with some nutrition)' :
                       'fully indulgent and comfort-food style';

  const complexityDesc =
    complexityLevel < 25 ? 'very quick and easy — under 15 minutes, no special skills needed' :
    complexityLevel < 50 ? 'easy — 15–25 minutes, basic cooking skills' :
    complexityLevel < 75 ? 'moderate — 25–40 minutes, some cooking experience needed' :
                           'elaborate — 40+ minutes, skilled home cook';

  const avoidClause = previousMealName
    ? `\nIMPORTANT: Do NOT suggest "${previousMealName}". Suggest a completely different dish.\n`
    : '';

  const allergenClause = allergens && allergens.length > 0
    ? `\nCRITICAL — ALLERGEN RESTRICTIONS: The user is allergic to the following. NEVER include these or any derivative in any ingredient: ${allergens.join(', ')}.\n`
    : '';

  const gutClause = gutFriendly
    ? `\nGUT-FRIENDLY MODE: Prioritise probiotic-rich foods (yogurt, idli, dosa, kanji, fermented items), anti-inflammatory ingredients (turmeric, ginger, cumin), and easy-to-digest options. Avoid deep-fried preparations, excessive chilli, heavy cream-based gravies, and ultra-processed ingredients.\n`
    : '';

  const lessClause = lessOfThese && lessOfThese.length > 0
    ? `\nUSER TASTE FEEDBACK — The user has previously said they want LESS of these: ${lessOfThese.join(', ')}. Avoid suggesting these dishes or closely similar styles/cuisines.\n`
    : '';

  const prompt = `You are a culinary expert and nutritionist specialising in Indian cuisine for busy working professionals in Tier-1 Indian cities (Mumbai, Delhi, Bengaluru, Hyderabad, Chennai, Kolkata, Pune).

Generate a ${mealType} meal suggestion with these parameters:
- Diet type: ${DIET_DESCRIPTIONS[dietType]}
- Health preference: ${healthDesc}
- Complexity preference: ${complexityDesc}
- Number of servings: ${servings}
${avoidClause}${allergenClause}${gutClause}${lessClause}
Requirements:
1. Use ingredients easily available in Indian supermarkets and apps (BigBasket, Blinkit, Swiggy Instamart, Nature's Basket, D-Mart).
2. Where relevant, recommend clean-label or organic brands available in India: Organic India, True Elements, 24 Mantra Organic, Tata Organic, Slurrp Farm, Farmley, The Whole Truth, Epigamia, Wingreens, Pristine, DiSano.
3. Nutritional values must be per serving.
4. The voiceNoteText will be read aloud to a home cook — write it in ${LANGUAGE_NAMES[cookLanguage]}, keep it 3–5 simple sentences, max 30 seconds when spoken aloud. Use natural, conversational language.
5. Ingredient costs should reflect current Indian market prices (in INR).

Return ONLY valid JSON — no markdown, no code fences, no explanation before or after:
{
  "name": "Dish name in English",
  "description": "2–3 engaging sentences: key flavours, why it works for ${mealType}, what makes it special",
  "cuisine": "Regional Indian cuisine (e.g. North Indian, South Indian, Bengali, Maharashtrian, etc.)",
  "nutritionalValue": {
    "calories": <number per serving>,
    "protein": <grams per serving>,
    "carbs": <grams per serving>,
    "fat": <grams per serving>,
    "fiber": <grams per serving>
  },
  "ingredients": [
    {
      "name": "ingredient name",
      "quantity": "amount for ${servings} serving${servings > 1 ? 's' : ''}",
      "estimatedCostInr": <number>,
      "isCleanLabel": <true if organic or clean-label option recommended>,
      "brandRecommendation": "specific brand name, or empty string if none"
    }
  ],
  "totalCostInr": <total estimated cost in INR>,
  "prepTimeMinutes": <number>,
  "complexityLabel": "Easy",
  "voiceNoteText": "Cooking instructions in ${LANGUAGE_NAMES[cookLanguage]}, 3–5 sentences, simple and clear",
  "tags": ["vegetarian", "high-protein", "quick", "gluten-free"]
}`;

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  const block = response.content[0];
  if (block.type !== 'text') throw new Error('Unexpected response type from Claude');

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(block.text.trim());
  } catch {
    const match = block.text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Failed to parse Claude response as JSON');
    data = JSON.parse(match[0]);
  }

  return {
    id: `${mealType}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    mealType,
    ...(data as Omit<MealSuggestion, 'id' | 'mealType'>),
  };
}
