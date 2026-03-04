'use client';

import { useState, useCallback, useEffect } from 'react';
import { Sparkles, Save, Check, Settings, X, History, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { MealSliderCard } from './MealSliderCard';
import { MealSuggestionCard } from './MealSuggestionCard';
import { WeekPlanner } from './WeekPlanner';
import { Onboarding } from './Onboarding';
import { getLessOfThese, getMoreOfThese, getLikedMeals, addRecentMeal, getRecentMeals } from '@/lib/mealHistory';
import type {
  MealType,
  MealDietType,
  DietType,
  CookLanguage,
  MealSuggestion,
  PlanPreferences,
  UserProfile,
} from '@/types/meal';

// ─── loading messages ────────────────────────────────────────────────────────

const LOADING_MESSAGES = [
  { emoji: '🍳', text: 'Whipping up delicious meal ideas' },
  { emoji: '🤤', text: 'Thinking of mouth-watering meals' },
  { emoji: '🙏', text: 'Pehle Pet-Pooja, baad mein sab dooja' },
  { emoji: '🧿', text: 'Consulting the kitchen gods' },
  { emoji: '🌶️', text: 'Asking the masala what it wants to be' },
  { emoji: '✨', text: 'Your hunger is valid, hold on' },
  { emoji: '🗺️', text: 'Summoning flavours from across India' },
  { emoji: '🍲', text: "Making sure the dal isn't too thin" },
  { emoji: '🔥', text: 'Spice levels under negotiation' },
  { emoji: '🧂', text: 'Just seasoning the data' },
  { emoji: '🥦', text: "Checking what's fresh at the sabzi mandi" },
  { emoji: '🤔', text: 'The chef is in deep thought' },
  { emoji: '⚖️', text: 'Balancing macros and masalas' },
  { emoji: '🫶', text: 'Finding the dish your tummy deserves' },
  { emoji: '🤌', text: 'Khana is coming, promise' },
  { emoji: '🔍', text: "So you don't have to Google what to eat" },
  { emoji: '🤖', text: 'Teaching Claude to cook' },
  { emoji: '🎯', text: 'Plotting the perfect plate' },
  { emoji: '😇', text: 'Flavours incoming, patience loading' },
  { emoji: '⏳', text: 'Unlike your hunger, good food takes time' },
];

function LoadingCard({ mealType }: { mealType: MealType }) {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * LOADING_MESSAGES.length));
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % LOADING_MESSAGES.length);
        setVisible(true);
      }, 350);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const { emoji, text } = LOADING_MESSAGES[idx];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col items-center gap-2 min-h-[130px] justify-center">
      <span
        className={`text-4xl transition-all duration-300 ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
      >
        {emoji}
      </span>
      <p
        className={`text-sm text-gray-500 font-medium text-center max-w-[220px] transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}
      >
        {text}…
      </p>
      <p className="text-xs text-gray-300 font-medium capitalize mt-1">{mealType} on its way</p>
    </div>
  );
}

// ─── helpers ────────────────────────────────────────────────────────────────

function getUserId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('mealmate-user-id');
  if (!id) {
    id = `u-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem('mealmate-user-id', id);
  }
  return id;
}

// ─── constants ──────────────────────────────────────────────────────────────

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner'];

const DEFAULT_PREFS: PlanPreferences = {
  breakfast: { health: 20, complexity: 20, dietType: 'vegetarian' },
  lunch:     { health: 40, complexity: 60, dietType: 'vegetarian' },
  dinner:    { health: 50, complexity: 30, dietType: 'vegetarian' },
};

const DEFAULT_PROFILE: UserProfile = {
  dietType: 'vegetarian',
  cookLanguage: 'hindi',
  servings: 2,
  allergens: [],
  gutFriendly: false,
  onboardingComplete: false,
  myMeals: [],
};

const ALLERGEN_OPTIONS = [
  { id: 'peanuts',   emoji: '🥜', label: 'Peanuts'      },
  { id: 'wheat',     emoji: '🌾', label: 'Wheat/Gluten' },
  { id: 'dairy',     emoji: '🥛', label: 'Dairy'        },
  { id: 'eggs',      emoji: '🥚', label: 'Eggs'         },
  { id: 'fish',      emoji: '🐟', label: 'Fish'         },
  { id: 'shellfish', emoji: '🍤', label: 'Shellfish'    },
  { id: 'soy',       emoji: '🫘', label: 'Soy'          },
  { id: 'tree_nuts', emoji: '🌰', label: 'Tree Nuts'    },
  { id: 'sesame',    emoji: '🫚', label: 'Sesame'       },
  { id: 'coconut',   emoji: '🥥', label: 'Coconut'      },
];

const DIET_LABELS: Record<DietType, string> = {
  vegetarian: '🥦 Vegetarian',
  'non-vegetarian': '🍗 Non-Veg',
  eggetarian: '🥚 Eggetarian',
  jain: '🙏 Jain',
};

const LANG_LABELS: Record<CookLanguage, string> = {
  english: 'English',
  hindi: 'हिंदी',
  tamil: 'Tamil',
  telugu: 'Telugu',
  kannada: 'Kannada',
  marathi: 'Marathi',
  bengali: 'Bengali',
  gujarati: 'Gujarati',
};

// ─── types ───────────────────────────────────────────────────────────────────

type PlanMode = 'today' | 'week' | 'fortnight';
type SuggestionState = MealSuggestion | null | 'loading';
type SkippedState = Record<MealType, boolean>;

// ─── component ───────────────────────────────────────────────────────────────

export function MealPlanner() {
  const [planMode, setPlanMode] = useState<PlanMode>('today');
  const [preferences, setPreferences] = useState<PlanPreferences>(DEFAULT_PREFS);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [skipped, setSkipped] = useState<SkippedState>({ breakfast: false, lunch: false, dinner: false });
  const [suggestions, setSuggestions] = useState<Record<MealType, SuggestionState>>({
    breakfast: null,
    lunch: null,
    dinner: null,
  });
  const [customNotes, setCustomNotes] = useState<Record<MealType, string>>({ breakfast: '', lunch: '', dinner: '' });
  const [newMealInput, setNewMealInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  // Load profile from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('mealmate-profile');
    if (saved) {
      try { setProfile(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  // Persist profile to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('mealmate-profile', JSON.stringify(profile));
  }, [profile]);

  // ── generate a single meal ───────────────────────────────────────────────

  const generateMeal = useCallback(
    async (mealType: MealType, previousMealName?: string) => {
      setError(null);
      setSuggestions((prev) => ({ ...prev, [mealType]: 'loading' }));

      try {
        const res = await fetch('/api/generate-meal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mealType,
            healthLevel: preferences[mealType].health,
            complexityLevel: preferences[mealType].complexity,
            dietType: preferences[mealType].dietType,
            cookLanguage: profile.cookLanguage,
            servings: profile.servings,
            previousMealName,
            allergens:    profile.allergens ?? [],
            gutFriendly:  profile.gutFriendly ?? false,
            lessOfThese:  getLessOfThese(),
            recentMeals:  getRecentMeals(mealType),
            customNotes:  customNotes[mealType] || undefined,
            myMealPool:   profile.myMeals ?? [],
            moreOfThese:  [...getMoreOfThese(), ...getLikedMeals()],
          }),
        });

        if (!res.ok) {
          const { error: msg } = await res.json();
          throw new Error(msg || 'Failed to generate meal');
        }

        const suggestion: MealSuggestion = await res.json();
        setSuggestions((prev) => ({ ...prev, [mealType]: suggestion }));
        addRecentMeal(mealType, suggestion.name);
      } catch (err) {
        console.error(err);
        setSuggestions((prev) => ({ ...prev, [mealType]: null }));
        setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      }
    },
    [preferences, profile],
  );

  // ── generate active meals sequentially: breakfast → lunch → dinner ────────

  const generateAll = useCallback(async () => {
    setHasGenerated(true);
    setSavedId(null);
    const active = MEAL_TYPES.filter((mt) => !skipped[mt]);
    // Mark all active as loading upfront so the button stays disabled throughout
    setSuggestions((prev) => {
      const next = { ...prev };
      active.forEach((mt) => { next[mt] = 'loading'; });
      return next;
    });
    for (const mt of active) {
      await generateMeal(mt);
    }
  }, [generateMeal, skipped]);

  // ── regenerate one meal ──────────────────────────────────────────────────

  const handleNewSuggestion = useCallback(
    (mealType: MealType) => {
      const cur = suggestions[mealType];
      const prev = cur && cur !== 'loading' ? cur.name : undefined;
      generateMeal(mealType, prev);
    },
    [generateMeal, suggestions],
  );

  // ── save plan ────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!allReady) return;
    setSaving(true);
    try {
      const res = await fetch('/api/meal-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': getUserId() },
        body: JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          breakfast: skipped.breakfast ? undefined : suggestions.breakfast,
          lunch:     skipped.lunch     ? undefined : suggestions.lunch,
          dinner:    skipped.dinner    ? undefined : suggestions.dinner,
          preferences,
        }),
      });
      const plan = await res.json();
      setSavedId(plan.id);
    } catch (err) {
      console.error('Save failed', err);
    } finally {
      setSaving(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestions, preferences, skipped]);

  // ── pref helpers ─────────────────────────────────────────────────────────

  const updatePref = (meal: MealType, key: 'health' | 'complexity', value: number) =>
    setPreferences((p) => ({ ...p, [meal]: { ...p[meal], [key]: value } }));

  const updateMealDiet = (meal: MealType, d: MealDietType) =>
    setPreferences((p) => ({ ...p, [meal]: { ...p[meal], dietType: d } }));

  const toggleSkip = (meal: MealType) =>
    setSkipped((s) => ({ ...s, [meal]: !s[meal] }));

  // ── derived state ────────────────────────────────────────────────────────

  const activeMeals = MEAL_TYPES.filter((mt) => !skipped[mt]);
  const anyLoading  = activeMeals.some((mt) => suggestions[mt] === 'loading');
  const allReady    = activeMeals.length > 0 && activeMeals.every((mt) => {
    const s = suggestions[mt];
    return s && s !== 'loading';
  });
  const allSkipped  = activeMeals.length === 0;

  // ─────────────────────────────────────────────────────────────────────────

  // Show onboarding for new users
  if (!profile.onboardingComplete) {
    return (
      <Onboarding
        initialProfile={profile}
        onComplete={(completed) => setProfile(completed)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* ── TOP NAV ───────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-cream/80 backdrop-blur-md border-b border-orange-100">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl leading-none">🍛</span>
            <span className="text-xl font-black text-gray-900 tracking-tight">MealMate</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/history"
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded-full hover:bg-gray-100 transition-colors"
            >
              <History className="w-3.5 h-3.5" />
              History
            </Link>
            <button
              onClick={() => setShowSettings((p) => !p)}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              Settings
            </button>
          </div>
        </div>
        {/* Mode tabs */}
        <div className="max-w-2xl mx-auto px-4 pb-3">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {(['today', 'week', 'fortnight'] as PlanMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setPlanMode(mode)}
                className={`flex-1 text-xs font-bold py-1.5 rounded-lg transition-all ${
                  planMode === mode
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {mode === 'today' ? "Today's Plan" : mode === 'week' ? '1 Week' : '2 Weeks'}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── SETTINGS PANEL ───────────────────────────────────────────────── */}
      {showSettings && (
        <div className="max-w-2xl mx-auto px-4 pt-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 relative">
            <button
              onClick={() => setShowSettings(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-sm font-black text-gray-700 uppercase tracking-widest mb-4">Preferences</h2>
            <div className="space-y-4">
              {/* Cook language */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
                  Cook&apos;s Language
                </label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(LANG_LABELS) as CookLanguage[]).map((l) => (
                    <button
                      key={l}
                      onClick={() => setProfile((p) => ({ ...p, cookLanguage: l }))}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                        profile.cookLanguage === l
                          ? 'bg-indigo-500 text-white border-indigo-500'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-400'
                      }`}
                    >
                      {LANG_LABELS[l]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Servings */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
                  Default Servings
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setProfile((p) => ({ ...p, servings: Math.max(1, p.servings - 1) }))}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-lg flex items-center justify-center transition-colors"
                  >
                    −
                  </button>
                  <span className="text-xl font-black text-gray-800 w-6 text-center">{profile.servings}</span>
                  <button
                    onClick={() => setProfile((p) => ({ ...p, servings: Math.min(8, p.servings + 1) }))}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-lg flex items-center justify-center transition-colors"
                  >
                    +
                  </button>
                  <span className="text-sm text-gray-400">people</span>
                </div>
              </div>

              {/* Gut-friendly */}
              <div>
                <button
                  onClick={() => setProfile((p) => ({ ...p, gutFriendly: !p.gutFriendly }))}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                    profile.gutFriendly
                      ? 'border-emerald-400 bg-emerald-50'
                      : 'border-gray-200 bg-gray-50 hover:border-emerald-200'
                  }`}
                >
                  <span className="text-xl">🫀</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-800">Gut-Friendly Mode</p>
                    <p className="text-xs text-gray-400">Probiotic-rich, anti-inflammatory, easy-to-digest</p>
                  </div>
                  <div className={`w-9 h-5 rounded-full relative flex-shrink-0 transition-colors ${profile.gutFriendly ? 'bg-emerald-400' : 'bg-gray-300'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${profile.gutFriendly ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </div>
                </button>
              </div>

              {/* Allergens */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
                  Allergens to Avoid
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ALLERGEN_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setProfile((p) => ({
                        ...p,
                        allergens: (p.allergens ?? []).includes(opt.id)
                          ? (p.allergens ?? []).filter((a) => a !== opt.id)
                          : [...(p.allergens ?? []), opt.id],
                      }))}
                      className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl border transition-all ${
                        (profile.allergens ?? []).includes(opt.id)
                          ? 'bg-red-500 text-white border-red-500'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-red-300'
                      }`}
                    >
                      {opt.emoji} {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* My Meal Pool */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">
                  My Meal Pool
                </label>
                <p className="text-xs text-gray-400 mb-2">
                  Dishes you love — we&apos;ll suggest these (or similar) in your plans.
                </p>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newMealInput}
                    onChange={(e) => setNewMealInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newMealInput.trim()) {
                        setProfile((p) => ({ ...p, myMeals: [...(p.myMeals ?? []).filter((m) => m !== newMealInput.trim()), newMealInput.trim()] }));
                        setNewMealInput('');
                      }
                    }}
                    placeholder="e.g. Palak Paneer, Poha…"
                    className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-300"
                  />
                  <button
                    onClick={() => {
                      if (!newMealInput.trim()) return;
                      setProfile((p) => ({ ...p, myMeals: [...(p.myMeals ?? []).filter((m) => m !== newMealInput.trim()), newMealInput.trim()] }));
                      setNewMealInput('');
                    }}
                    disabled={!newMealInput.trim()}
                    className="px-3 py-2 bg-saffron hover:bg-orange-600 disabled:opacity-40 text-white text-sm font-bold rounded-xl transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(profile.myMeals ?? []).length === 0 ? (
                    <p className="text-xs text-gray-300">No meals added yet.</p>
                  ) : (
                    (profile.myMeals ?? []).map((meal) => (
                      <span key={meal} className="flex items-center gap-1.5 text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-1.5 rounded-xl">
                        {meal}
                        <button
                          onClick={() => setProfile((p) => ({ ...p, myMeals: (p.myMeals ?? []).filter((m) => m !== meal) }))}
                          className="text-orange-400 hover:text-orange-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <main className="max-w-2xl mx-auto px-4 pt-4 pb-6 space-y-3">

        {/* Servings row (always visible) */}
        <div className="flex justify-end">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-1.5">
            <span className="text-xs text-gray-400 font-medium">🍽️</span>
            <button
              onClick={() => setProfile((p) => ({ ...p, servings: Math.max(1, p.servings - 1) }))}
              className="w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-sm flex items-center justify-center transition-colors leading-none"
            >
              −
            </button>
            <span className="text-sm font-black text-gray-800 w-4 text-center tabular-nums">{profile.servings}</span>
            <button
              onClick={() => setProfile((p) => ({ ...p, servings: Math.min(8, p.servings + 1) }))}
              className="w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-sm flex items-center justify-center transition-colors leading-none"
            >
              +
            </button>
            <span className="text-xs text-gray-400 font-medium">
              {profile.servings === 1 ? 'serving' : 'servings'}
            </span>
          </div>
        </div>

        {/* ── WEEK / FORTNIGHT MODE ──────────────────────────────────────────── */}
        {planMode !== 'today' && (
          <WeekPlanner
            numDays={planMode === 'week' ? 7 : 14}
            profile={profile}
          />
        )}

        {/* ── TODAY MODE ────────────────────────────────────────────────────── */}
        {planMode === 'today' && (
          <>
            {/* Meal slider cards */}
            <div className="space-y-2">
              {MEAL_TYPES.map((mt) => (
                <MealSliderCard
                  key={mt}
                  mealType={mt}
                  health={preferences[mt].health}
                  complexity={preferences[mt].complexity}
                  dietType={preferences[mt].dietType}
                  skipped={skipped[mt]}
                  customNotes={customNotes[mt]}
                  onHealthChange={(v) => updatePref(mt, 'health', v)}
                  onComplexityChange={(v) => updatePref(mt, 'complexity', v)}
                  onDietTypeChange={(d) => updateMealDiet(mt, d)}
                  onSkipToggle={() => toggleSkip(mt)}
                  onCustomNotesChange={(v) => setCustomNotes((n) => ({ ...n, [mt]: v }))}
                />
              ))}
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium flex items-start gap-2 animate-fade-in">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Generate button */}
            <button
              onClick={generateAll}
              disabled={anyLoading || allSkipped}
              className="w-full flex items-center justify-center gap-2 bg-saffron hover:bg-orange-600 disabled:bg-orange-300 text-white font-black text-base py-4 rounded-2xl shadow-md shadow-orange-200 transition-all duration-200 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {anyLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Thinking up your meals…
                </>
              ) : allSkipped ? (
                <>
                  <Sparkles className="w-5 h-5 opacity-50" />
                  All meals skipped
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  {hasGenerated ? 'Regenerate All' : 'Generate My Meal Plan'}
                </>
              )}
            </button>

            {/* Results */}
            {hasGenerated && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-gray-800">Your Meal Plan</h2>
                  {allReady && (
                    <button
                      onClick={handleSave}
                      disabled={saving || !!savedId}
                      className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all ${
                        savedId
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-900 text-white hover:bg-gray-700'
                      } disabled:opacity-60`}
                    >
                      {saving ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : savedId ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      {savedId ? 'Saved!' : 'Save Plan'}
                    </button>
                  )}
                </div>

                {MEAL_TYPES.map((mt) => {
                  if (skipped[mt]) return null;
                  const s = suggestions[mt];
                  if (s === 'loading') {
                    return <LoadingCard key={`loading-${mt}`} mealType={mt} />;
                  }
                  if (!s) return null;
                  return (
                    <MealSuggestionCard
                      key={s.id}
                      suggestion={s}
                      mealType={mt}
                      cookLanguage={profile.cookLanguage}
                      onNewSuggestion={() => handleNewSuggestion(mt)}
                      isRegenerating={false}
                    />
                  );
                })}
              </div>
            )}

            <div className="pb-4" />
          </>
        )}
      </main>
    </div>
  );
}
