'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, Loader2, TrendingUp, Utensils, Flame, Star, Calendar, Award } from 'lucide-react';
import type { SavedMealPlan, MealSuggestion, CookLanguage } from '@/types/meal';

function getUserId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('mealmate-user-id');
  if (!id) {
    id = `u-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem('mealmate-user-id', id);
  }
  return id;
}

function getDietType(): string {
  if (typeof window === 'undefined') return 'vegetarian';
  try {
    const p = JSON.parse(localStorage.getItem('mealmate-profile') ?? '{}');
    return p.dietType ?? 'vegetarian';
  } catch { return 'vegetarian'; }
}

function getCookLanguage(): CookLanguage {
  if (typeof window === 'undefined') return 'hindi';
  try {
    const p = JSON.parse(localStorage.getItem('mealmate-profile') ?? '{}');
    return (p.cookLanguage as CookLanguage) ?? 'hindi';
  } catch { return 'hindi'; }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function allMeals(plans: SavedMealPlan[]): { meal: MealSuggestion; mealType: string; date: string }[] {
  const out: { meal: MealSuggestion; mealType: string; date: string }[] = [];
  for (const plan of plans) {
    if (plan.breakfast) out.push({ meal: plan.breakfast, mealType: 'Breakfast', date: plan.date });
    if (plan.lunch)     out.push({ meal: plan.lunch,     mealType: 'Lunch',     date: plan.date });
    if (plan.dinner)    out.push({ meal: plan.dinner,    mealType: 'Dinner',    date: plan.date });
  }
  return out;
}

function frequencyMap<T extends string>(arr: T[]): { key: T; count: number }[] {
  const map: Record<string, number> = {};
  for (const k of arr) map[k] = (map[k] ?? 0) + 1;
  return Object.entries(map)
    .map(([key, count]) => ({ key: key as T, count }))
    .sort((a, b) => b.count - a.count);
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ── Stat card ──────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 flex-shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-0.5">{label}</p>
        <p className="text-xl font-black text-gray-900 leading-none">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Horizontal bar ─────────────────────────────────────────────────────────────

function Bar({ label, count, max, color }: { label: string; count: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700 truncate max-w-[65%]">{label}</span>
        <span className="text-xs font-black text-gray-500 tabular-nums">{count}×</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ── Insight chip ───────────────────────────────────────────────────────────────

function Insight({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
      <span className="text-lg leading-none flex-shrink-0">{emoji}</span>
      <p className="text-sm text-amber-800 font-medium leading-snug">{text}</p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [plans, setPlans]     = useState<SavedMealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_lang, setLang]      = useState<CookLanguage>('hindi');

  useEffect(() => {
    setLang(getCookLanguage());
    fetch('/api/meal-plans', { headers: { 'x-user-id': getUserId() } })
      .then((r) => r.json())
      .then((d) => setPlans(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const meals = useMemo(() => allMeals(plans), [plans]);

  const dishFreq    = useMemo(() => frequencyMap(meals.map((m) => m.meal.name)), [meals]);
  const cuisineFreq = useMemo(() => frequencyMap(meals.map((m) => m.meal.cuisine)), [meals]);
  const mealTypeFreq = useMemo(() => frequencyMap(meals.map((m) => m.mealType)), [meals]);

  const avgCalories = useMemo(() => {
    if (!meals.length) return 0;
    const sum = meals.reduce((a, m) => a + (m.meal.nutritionalValue?.calories ?? 0), 0);
    return Math.round(sum / meals.length);
  }, [meals]);

  const avgProtein = useMemo(() => {
    if (!meals.length) return 0;
    const sum = meals.reduce((a, m) => a + (m.meal.nutritionalValue?.protein ?? 0), 0);
    return Math.round(sum / meals.length);
  }, [meals]);

  const uniqueDays = useMemo(() => new Set(plans.map((p) => p.date)).size, [plans]);

  // streak: count consecutive days (backwards from today) that have a plan
  const streak = useMemo(() => {
    const dates = new Set(plans.map((p) => p.date));
    let s = 0;
    const now = new Date();
    for (let i = 0; i < 60; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      if (dates.has(iso)) s++;
      else if (i > 0) break;
    }
    return s;
  }, [plans]);

  // insights text
  const insights = useMemo(() => {
    const out: { emoji: string; text: string }[] = [];

    if (dishFreq[0]) out.push({ emoji: '🏆', text: `Your most-planned dish is "${dishFreq[0].key}" — you've had it ${dishFreq[0].count} time${dishFreq[0].count > 1 ? 's' : ''}.` });
    if (cuisineFreq[0]) out.push({ emoji: '🗺️', text: `You gravitate towards ${cuisineFreq[0].key} food, featuring in ${cuisineFreq[0].count} of your meals.` });
    if (avgCalories > 0) out.push({ emoji: '⚖️', text: `Your average meal sits at ${avgCalories} kcal and ${avgProtein}g protein per serving.` });
    if (streak > 1)  out.push({ emoji: '🔥', text: `You're on a ${streak}-day planning streak — keep it going!` });
    if (meals.length >= 5) {
      const bkCount = meals.filter((m) => m.mealType === 'Breakfast').length;
      const pct = Math.round((bkCount / meals.length) * 100);
      if (pct < 30) out.push({ emoji: '🌅', text: `You tend to skip breakfast planning (only ${pct}% of your meals). A good morning fuel-up makes a difference!` });
    }
    const dietType = getDietType();
    if (dietType === 'vegetarian') out.push({ emoji: '🌿', text: 'You eat vegetarian — a great choice for both your health and the planet.' });

    if (!out.length) out.push({ emoji: '✨', text: 'Save a few meal plans and we\'ll surface personalised insights here.' });
    return out;
  }, [dishFreq, cuisineFreq, avgCalories, avgProtein, streak, meals]);

  const topDish    = dishFreq[0];
  const topCuisine = cuisineFreq[0];

  const dishMax    = dishFreq[0]?.count ?? 1;
  const cuisineMax = cuisineFreq[0]?.count ?? 1;

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-30 bg-cream/80 backdrop-blur-md border-b border-orange-100">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Link>
          <span className="text-lg font-black text-gray-900 tracking-tight">My Food Profile</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 text-saffron animate-spin" />
          </div>
        ) : meals.length === 0 ? (
          <div className="text-center py-24 space-y-3">
            <span className="text-5xl">🍽️</span>
            <p className="text-gray-500 font-medium">No saved plans yet.</p>
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-bold text-saffron hover:underline">
              Generate your first plan →
            </Link>
          </div>
        ) : (
          <>
            {/* ── Summary stats ─────────────────────────────────────────── */}
            <section className="grid grid-cols-2 gap-3">
              <StatCard icon={<Utensils className="w-5 h-5" />} label="Total Meals" value={meals.length} sub={`across ${uniqueDays} days`} />
              <StatCard icon={<Calendar className="w-5 h-5" />} label="Plans Saved" value={plans.length} sub="meal plans" />
              <StatCard icon={<Flame className="w-5 h-5" />} label="Avg Calories" value={`${avgCalories} kcal`} sub="per serving" />
              <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Streak" value={`${streak} day${streak !== 1 ? 's' : ''}`} sub={streak > 1 ? '🔥 keep going!' : 'plan today!'} />
            </section>

            {/* ── Top badges ────────────────────────────────────────────── */}
            {(topDish || topCuisine) && (
              <section className="flex gap-3 flex-wrap">
                {topDish && (
                  <div className="flex items-center gap-2 bg-white border border-yellow-200 rounded-xl px-3 py-2 shadow-sm">
                    <Award className="w-4 h-4 text-yellow-500" />
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Fave Dish</p>
                      <p className="text-sm font-black text-gray-800">{topDish.key}</p>
                    </div>
                  </div>
                )}
                {topCuisine && (
                  <div className="flex items-center gap-2 bg-white border border-orange-200 rounded-xl px-3 py-2 shadow-sm">
                    <Star className="w-4 h-4 text-orange-400" />
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Top Cuisine</p>
                      <p className="text-sm font-black text-gray-800">{topCuisine.key}</p>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* ── Insights ──────────────────────────────────────────────── */}
            <section className="space-y-2">
              <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest">Insights</h2>
              {insights.map((ins, i) => (
                <Insight key={i} emoji={ins.emoji} text={ins.text} />
              ))}
            </section>

            {/* ── Dish frequency ────────────────────────────────────────── */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest">Most Planned Dishes</h2>
              <div className="space-y-3">
                {dishFreq.slice(0, 10).map(({ key, count }) => (
                  <Bar key={key} label={key} count={count} max={dishMax} color="#FF6B35" />
                ))}
              </div>
            </section>

            {/* ── Cuisine breakdown ─────────────────────────────────────── */}
            {cuisineFreq.length > 0 && (
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest">Cuisine Breakdown</h2>
                <div className="space-y-3">
                  {cuisineFreq.slice(0, 8).map(({ key, count }) => (
                    <Bar key={key} label={key} count={count} max={cuisineMax} color="#8B5CF6" />
                  ))}
                </div>
              </section>
            )}

            {/* ── Meal type distribution ────────────────────────────────── */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest">Meal Type Split</h2>
              <div className="flex gap-3">
                {(['Breakfast', 'Lunch', 'Dinner'] as const).map((mt) => {
                  const entry = mealTypeFreq.find((f) => f.key === mt);
                  const count = entry?.count ?? 0;
                  const pct = meals.length ? Math.round((count / meals.length) * 100) : 0;
                  const emoji = mt === 'Breakfast' ? '🌅' : mt === 'Lunch' ? '☀️' : '🌙';
                  const color = mt === 'Breakfast' ? 'bg-orange-400' : mt === 'Lunch' ? 'bg-yellow-400' : 'bg-indigo-400';
                  return (
                    <div key={mt} className="flex-1 bg-gray-50 rounded-xl p-3 text-center space-y-1">
                      <span className="text-2xl">{emoji}</span>
                      <p className="text-xs font-bold text-gray-500">{mt}</p>
                      <p className="text-xl font-black text-gray-900">{count}</p>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1">
                        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-[10px] text-gray-400">{pct}%</p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ── Full history timeline ─────────────────────────────────── */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest">What You've Had</h2>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {plans.map((plan) => (
                  <div key={plan.id} className="border-l-2 border-orange-200 pl-3 py-1 space-y-1">
                    <p className="text-xs font-bold text-orange-500">{formatDate(plan.date)}</p>
                    {plan.breakfast && <p className="text-sm text-gray-700">🌅 <span className="font-semibold">{plan.breakfast.name}</span> <span className="text-gray-400 text-xs">· {plan.breakfast.cuisine}</span></p>}
                    {plan.lunch     && <p className="text-sm text-gray-700">☀️ <span className="font-semibold">{plan.lunch.name}</span> <span className="text-gray-400 text-xs">· {plan.lunch.cuisine}</span></p>}
                    {plan.dinner    && <p className="text-sm text-gray-700">🌙 <span className="font-semibold">{plan.dinner.name}</span> <span className="text-gray-400 text-xs">· {plan.dinner.cuisine}</span></p>}
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
        <div className="pb-8" />
      </main>
    </div>
  );
}
