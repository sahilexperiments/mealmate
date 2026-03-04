'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, Trash2, Loader2, CalendarDays } from 'lucide-react';
import { MealSuggestionCard } from '@/components/MealSuggestionCard';
import type { SavedMealPlan, CookLanguage } from '@/types/meal';

function getUserId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('mealmate-user-id');
  if (!id) {
    id = `u-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem('mealmate-user-id', id);
  }
  return id;
}

function getCookLanguage(): CookLanguage {
  if (typeof window === 'undefined') return 'hindi';
  try {
    const p = JSON.parse(localStorage.getItem('mealmate-profile') ?? '{}');
    return (p.cookLanguage as CookLanguage) ?? 'hindi';
  } catch {
    return 'hindi';
  }
}

function formatDate(isoDate: string): string {
  const [y, m, day] = isoDate.split('-').map(Number);
  const d = new Date(y, m - 1, day);
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export default function HistoryPage() {
  const [plans, setPlans] = useState<SavedMealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [cookLanguage, setCookLanguage] = useState<CookLanguage>('hindi');

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/meal-plans', { headers: { 'x-user-id': getUserId() } });
      const data = await res.json();
      setPlans(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setCookLanguage(getCookLanguage());
    fetchPlans();
  }, [fetchPlans]);

  const handleDelete = async (id: string) => {
    await fetch(`/api/meal-plans/${id}`, {
      method: 'DELETE',
      headers: { 'x-user-id': getUserId() },
    });
    setPlans((p) => p.filter((pl) => pl.id !== id));
    if (expanded === id) setExpanded(null);
  };

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
          <span className="text-lg font-black text-gray-900 tracking-tight">Past Plans</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-saffron animate-spin" />
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <span className="text-5xl">🍽️</span>
            <p className="text-gray-500 font-medium">No saved plans yet.</p>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-saffron hover:underline"
            >
              Generate your first plan →
            </Link>
          </div>
        ) : (
          plans.map((plan) => (
            <div key={plan.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Plan header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <button
                  onClick={() => setExpanded(expanded === plan.id ? null : plan.id)}
                  className="flex items-center gap-2 flex-1 text-left"
                >
                  <CalendarDays className="w-4 h-4 text-saffron" />
                  <span className="text-sm font-bold text-gray-800">{formatDate(plan.date)}</span>
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-medium">
                    {[plan.breakfast, plan.lunch, plan.dinner].filter(Boolean).length} meals
                  </span>
                  <button
                    onClick={() => handleDelete(plan.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors p-1"
                    title="Delete plan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Meal names summary */}
              {expanded !== plan.id && (
                <div className="px-5 py-3 flex flex-col gap-1">
                  {plan.breakfast && (
                    <p className="text-sm text-gray-600">
                      <span className="mr-1.5">🌅</span>
                      <span className="font-semibold">{plan.breakfast.name}</span>
                    </p>
                  )}
                  {plan.lunch && (
                    <p className="text-sm text-gray-600">
                      <span className="mr-1.5">☀️</span>
                      <span className="font-semibold">{plan.lunch.name}</span>
                    </p>
                  )}
                  {plan.dinner && (
                    <p className="text-sm text-gray-600">
                      <span className="mr-1.5">🌙</span>
                      <span className="font-semibold">{plan.dinner.name}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Expanded detail */}
              {expanded === plan.id && (
                <div className="p-4 space-y-4 animate-fade-in">
                  {plan.breakfast && (
                    <MealSuggestionCard
                      suggestion={plan.breakfast}
                      mealType="breakfast"
                      cookLanguage={cookLanguage}
                      onNewSuggestion={() => {}}
                      isRegenerating={false}
                    />
                  )}
                  {plan.lunch && (
                    <MealSuggestionCard
                      suggestion={plan.lunch}
                      mealType="lunch"
                      cookLanguage={cookLanguage}
                      onNewSuggestion={() => {}}
                      isRegenerating={false}
                    />
                  )}
                  {plan.dinner && (
                    <MealSuggestionCard
                      suggestion={plan.dinner}
                      mealType="dinner"
                      cookLanguage={cookLanguage}
                      onNewSuggestion={() => {}}
                      isRegenerating={false}
                    />
                  )}
                </div>
              )}
            </div>
          ))
        )}
        <div className="pb-8" />
      </main>
    </div>
  );
}
