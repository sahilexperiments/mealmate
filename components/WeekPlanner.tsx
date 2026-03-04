'use client';

import { useState, useCallback } from 'react';
import { Sparkles, ChevronDown, ChevronUp, Loader2, Check } from 'lucide-react';
import { MealSuggestionCard } from './MealSuggestionCard';
import { addRecentMeal, getRecentMeals, getLessOfThese, getMoreOfThese, getLikedMeals } from '@/lib/mealHistory';
import type { MealType, DietType, MealDietType, CookLanguage, MealSuggestion, UserProfile } from '@/types/meal';

// ── types ─────────────────────────────────────────────────────────────────────

type SuggestionState = MealSuggestion | null | 'loading';

type DayPlan = {
  date: string;
  breakfast: SuggestionState;
  lunch: SuggestionState;
  dinner: SuggestionState;
  saved: boolean;
};

// ── constants ─────────────────────────────────────────────────────────────────

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner'];

const MEAL_CONFIG = {
  breakfast: { emoji: '🌅', label: 'Breakfast' },
  lunch:     { emoji: '☀️', label: 'Lunch'      },
  dinner:    { emoji: '🌙', label: 'Dinner'     },
} as const;

const DIET_OPTIONS: { value: MealDietType; emoji: string; label: string }[] = [
  { value: 'vegetarian',     emoji: '🌿', label: 'Veg'     },
  { value: 'eggetarian',     emoji: '🥚', label: 'Egg'     },
  { value: 'non-vegetarian', emoji: '🍗', label: 'Non-Veg' },
];

const SAFFRON = '#FF6B35';

// ── helpers ───────────────────────────────────────────────────────────────────

function getNextNDates(n: number): string[] {
  const now = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() + i + 1);
    return d.toISOString().split('T')[0];
  });
}

function formatDayLabel(isoDate: string): string {
  const [y, m, day] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, day).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

function getUserId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('mealmate-user-id');
  if (!id) {
    id = `u-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem('mealmate-user-id', id);
  }
  return id;
}

async function generateOneMeal(
  mealType: MealType,
  health: number,
  complexity: number,
  dietType: DietType,
  cookLanguage: CookLanguage,
  servings: number,
  allergens: string[],
  gutFriendly: boolean,
  myMealPool: string[],
  lessOfThese: string[],
  moreOfThese: string[],
  recentMeals: string[],
): Promise<MealSuggestion> {
  const res = await fetch('/api/generate-meal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mealType, healthLevel: health, complexityLevel: complexity,
      dietType, cookLanguage, servings, allergens, gutFriendly,
      myMealPool, lessOfThese, moreOfThese, recentMeals,
    }),
  });
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({ error: 'Failed' }));
    throw new Error(error || 'Failed to generate meal');
  }
  return res.json();
}

async function saveDayPlan(date: string, b: SuggestionState, l: SuggestionState, d: SuggestionState) {
  try {
    await fetch('/api/meal-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': getUserId() },
      body: JSON.stringify({
        date,
        breakfast: b && b !== 'loading' ? b : undefined,
        lunch:     l && l !== 'loading' ? l : undefined,
        dinner:    d && d !== 'loading' ? d : undefined,
      }),
    });
  } catch (e) {
    console.error('Failed to save day plan:', e);
  }
}

// ── DayCard ───────────────────────────────────────────────────────────────────

function DayCard({
  plan,
  dayIndex,
  cookLanguage,
  isQueued,
}: {
  plan: DayPlan;
  dayIndex: number;
  cookLanguage: CookLanguage;
  isQueued: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const anyLoading = MEAL_TYPES.some((mt) => plan[mt] === 'loading');
  const anyReady   = MEAL_TYPES.some((mt) => plan[mt] && plan[mt] !== 'loading');

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => anyReady && setExpanded((p) => !p)}
        className={`w-full flex items-center justify-between px-5 py-3.5 text-left border-b border-gray-100 transition-colors ${anyReady ? 'hover:bg-gray-50' : 'cursor-default'}`}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-black text-gray-800">Day {dayIndex + 1}</span>
          <span className="text-xs font-semibold text-gray-400">{formatDayLabel(plan.date)}</span>
          {plan.saved && <Check className="w-3.5 h-3.5 text-emerald-500" />}
        </div>
        <div className="flex items-center gap-2">
          {isQueued && <span className="text-xs text-gray-400 font-medium">Queued</span>}
          {anyLoading && !isQueued && (
            <span className="text-xs text-saffron font-medium flex items-center gap-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Generating…
            </span>
          )}
          {anyReady && !anyLoading && (
            expanded
              ? <ChevronUp className="w-4 h-4 text-gray-400" />
              : <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {/* Summary row */}
      <div className="px-5 py-3 space-y-1">
        {MEAL_TYPES.map((mt) => {
          const s = plan[mt];
          if (s === 'loading') {
            return (
              <p key={mt} className="text-xs text-gray-400 flex items-center gap-1.5 animate-pulse">
                <span>{MEAL_CONFIG[mt].emoji}</span>
                <span>Generating {MEAL_CONFIG[mt].label.toLowerCase()}…</span>
              </p>
            );
          }
          if (!s) return null;
          return (
            <p key={mt} className="text-sm text-gray-700">
              <span className="mr-1.5">{MEAL_CONFIG[mt].emoji}</span>
              <span className="font-semibold">{s.name}</span>
            </p>
          );
        })}
        {isQueued && (
          <p className="text-xs text-gray-300 font-medium">Will be generated shortly…</p>
        )}
      </div>

      {/* Expanded meal cards */}
      {expanded && anyReady && (
        <div className="border-t border-gray-100 p-4 space-y-4 animate-fade-in">
          {MEAL_TYPES.map((mt) => {
            const s = plan[mt];
            if (!s || s === 'loading') return null;
            return (
              <MealSuggestionCard
                key={mt}
                suggestion={s}
                mealType={mt}
                cookLanguage={cookLanguage}
                onNewSuggestion={() => {}}
                isRegenerating={false}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── WeekPlanner ───────────────────────────────────────────────────────────────

interface Props {
  numDays: 7 | 14;
  profile: UserProfile;
}

export function WeekPlanner({ numDays, profile }: Props) {
  const [health,     setHealth]     = useState(40);
  const [complexity, setComplexity] = useState(40);
  const [dietType,   setDietType]   = useState<MealDietType>('vegetarian');
  const [skipped,    setSkipped]    = useState<Record<MealType, boolean>>({ breakfast: false, lunch: false, dinner: false });

  const [dayPlans,     setDayPlans]     = useState<DayPlan[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentDay,   setCurrentDay]   = useState(-1);
  const [hasGenerated, setHasGenerated] = useState(false);

  const activeMeals = MEAL_TYPES.filter((mt) => !skipped[mt]);

  const generatePlan = useCallback(async () => {
    if (isGenerating || activeMeals.length === 0) return;

    setIsGenerating(true);
    setHasGenerated(true);

    const dates = getNextNDates(numDays);

    // Initialize all days with null (future) — we'll flip to loading as we go
    const initial: DayPlan[] = dates.map((date) => ({
      date, breakfast: null, lunch: null, dinner: null, saved: false,
    }));
    setDayPlans(initial);

    // Local copy to track results without stale closure
    const results: DayPlan[] = initial.map((p) => ({ ...p }));

    for (let d = 0; d < numDays; d++) {
      setCurrentDay(d);

      for (const mt of activeMeals) {
        setDayPlans((prev) => prev.map((p, i) => i === d ? { ...p, [mt]: 'loading' } : p));
        try {
          const meal = await generateOneMeal(
            mt, health, complexity, dietType as DietType,
            profile.cookLanguage, profile.servings,
            profile.allergens ?? [], profile.gutFriendly ?? false,
            profile.myMeals ?? [],
            getLessOfThese(),
            [...getMoreOfThese(), ...getLikedMeals()],
            getRecentMeals(mt),
          );
          addRecentMeal(mt, meal.name);
          results[d][mt] = meal;
          setDayPlans((prev) => prev.map((p, i) => i === d ? { ...p, [mt]: meal } : p));
        } catch {
          results[d][mt] = null;
          setDayPlans((prev) => prev.map((p, i) => i === d ? { ...p, [mt]: null } : p));
        }
      }

      // Auto-save the completed day
      await saveDayPlan(dates[d], results[d].breakfast, results[d].lunch, results[d].dinner);
      setDayPlans((prev) => prev.map((p, i) => i === d ? { ...p, saved: true } : p));
    }

    setIsGenerating(false);
    setCurrentDay(-1);
  }, [isGenerating, activeMeals, numDays, health, complexity, dietType, profile]);

  const progress = currentDay >= 0 ? Math.round(((currentDay + 1) / numDays) * 100) : 0;

  return (
    <div className="space-y-3">

      {/* ── Criteria panel ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
        <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Plan Criteria</h3>

        {/* Health */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-gray-400 mb-2">
            <span>🥗 Healthy</span><span>🍰 Indulgent</span>
          </div>
          <input
            type="range" min={0} max={100} value={health}
            onChange={(e) => setHealth(Number(e.target.value))}
            className="mm-slider w-full h-2 rounded-full appearance-none cursor-pointer focus:outline-none"
            style={{ background: `linear-gradient(to right, ${SAFFRON} 0%, ${SAFFRON} ${health}%, #E5E7EB ${health}%, #E5E7EB 100%)` }}
          />
        </div>

        {/* Complexity */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-gray-400 mb-2">
            <span>⚡ Quick &amp; Easy</span><span>👨‍🍳 Elaborate</span>
          </div>
          <input
            type="range" min={0} max={100} value={complexity}
            onChange={(e) => setComplexity(Number(e.target.value))}
            className="mm-slider w-full h-2 rounded-full appearance-none cursor-pointer focus:outline-none"
            style={{ background: `linear-gradient(to right, ${SAFFRON} 0%, ${SAFFRON} ${complexity}%, #E5E7EB ${complexity}%, #E5E7EB 100%)` }}
          />
        </div>

        {/* Diet type */}
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Diet</label>
          <div className="flex gap-2">
            {DIET_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDietType(opt.value)}
                className={`flex-1 text-xs font-semibold py-2 rounded-xl border transition-all ${
                  dietType === opt.value
                    ? 'bg-saffron text-white border-saffron'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
                }`}
              >
                {opt.emoji} {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Meal toggles */}
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Include Meals</label>
          <div className="flex gap-2">
            {MEAL_TYPES.map((mt) => (
              <button
                key={mt}
                onClick={() => setSkipped((s) => ({ ...s, [mt]: !s[mt] }))}
                className={`flex-1 text-xs font-semibold py-2 rounded-xl border transition-all capitalize ${
                  !skipped[mt]
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-300 border-gray-200 line-through'
                }`}
              >
                {MEAL_CONFIG[mt].emoji} {mt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Generate button ─────────────────────────────────────────── */}
      <button
        onClick={generatePlan}
        disabled={isGenerating || activeMeals.length === 0}
        className="w-full flex items-center justify-center gap-2 bg-saffron hover:bg-orange-600 disabled:bg-orange-300 text-white font-black text-base py-4 rounded-2xl shadow-md shadow-orange-200 transition-all duration-200 disabled:cursor-not-allowed active:scale-[0.98]"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Generating Day {currentDay + 1} of {numDays}…
          </>
        ) : activeMeals.length === 0 ? (
          <><Sparkles className="w-5 h-5 opacity-50" /> Select at least one meal</>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            {hasGenerated ? `Regenerate ${numDays}-Day Plan` : `Generate My ${numDays}-Day Plan`}
          </>
        )}
      </button>

      {/* Progress bar */}
      {isGenerating && (
        <div className="space-y-1">
          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-saffron h-1.5 rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 text-center">{progress}% complete — auto-saving each day ✓</p>
        </div>
      )}

      {/* ── Day cards ───────────────────────────────────────────────── */}
      {dayPlans.map((plan, i) => (
        <DayCard
          key={plan.date}
          plan={plan}
          dayIndex={i}
          cookLanguage={profile.cookLanguage}
          isQueued={isGenerating && i > currentDay}
        />
      ))}

      <div className="pb-4" />
    </div>
  );
}
