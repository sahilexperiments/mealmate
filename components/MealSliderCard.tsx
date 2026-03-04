'use client';

import { useState } from 'react';
import { Pencil, ListPlus, X, Heart, ThumbsUp, ThumbsDown, Trash2, Plus } from 'lucide-react';
import type { MealType, MealDietType, CustomDish } from '@/types/meal';

const MEAL_CONFIG = {
  breakfast: {
    emoji: '🌅',
    label: 'Breakfast',
    gradient: 'from-orange-50 to-amber-50',
    accent: '#FF6B35',
    border: 'border-orange-200',
  },
  lunch: {
    emoji: '☀️',
    label: 'Lunch',
    gradient: 'from-yellow-50 to-lime-50',
    accent: '#F59E0B',
    border: 'border-yellow-200',
  },
  dinner: {
    emoji: '🌙',
    label: 'Dinner',
    gradient: 'from-purple-50 to-indigo-50',
    accent: '#8B5CF6',
    border: 'border-purple-200',
  },
} as const;

const DIET_OPTIONS: { value: MealDietType; emoji: string; label: string }[] = [
  { value: 'vegetarian',     emoji: '🌿', label: 'Veg'     },
  { value: 'eggetarian',     emoji: '🥚', label: 'Egg'     },
  { value: 'non-vegetarian', emoji: '🍗', label: 'Non-Veg' },
];

interface MealSliderCardProps {
  mealType: MealType;
  health: number;
  complexity: number;
  dietType: MealDietType;
  skipped: boolean;
  customNotes: string;
  servings: number;
  customDishes: CustomDish[];
  onHealthChange: (v: number) => void;
  onComplexityChange: (v: number) => void;
  onDietTypeChange: (d: MealDietType) => void;
  onSkipToggle: () => void;
  onCustomNotesChange: (v: string) => void;
  onServingsChange: (v: number) => void;
  onCustomDishesChange: (dishes: CustomDish[]) => void;
}

export function MealSliderCard({
  mealType,
  health,
  complexity,
  dietType,
  skipped,
  customNotes,
  servings,
  customDishes,
  onHealthChange,
  onComplexityChange,
  onDietTypeChange,
  onSkipToggle,
  onCustomNotesChange,
  onServingsChange,
  onCustomDishesChange,
}: MealSliderCardProps) {
  const config = MEAL_CONFIG[mealType];
  const [showNotes, setShowNotes] = useState(false);
  const [showMyList, setShowMyList] = useState(false);
  const [newDishName, setNewDishName] = useState('');
  const [newDishDesc, setNewDishDesc] = useState('');
  const [addingDish, setAddingDish] = useState(false);

  function addDish() {
    if (!newDishName.trim()) return;
    const dish: CustomDish = {
      id: `dish-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: newDishName.trim(),
      description: newDishDesc.trim(),
      feedback: null,
    };
    onCustomDishesChange([...customDishes, dish]);
    setNewDishName('');
    setNewDishDesc('');
    setAddingDish(false);
  }

  function removeDish(id: string) {
    onCustomDishesChange(customDishes.filter((d) => d.id !== id));
  }

  function setFeedback(id: string, fb: CustomDish['feedback']) {
    onCustomDishesChange(
      customDishes.map((d) => d.id === id ? { ...d, feedback: d.feedback === fb ? null : fb } : d),
    );
  }

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 ${
        skipped
          ? 'bg-gray-50 border-gray-200 opacity-50'
          : `bg-gradient-to-br ${config.gradient} ${config.border} shadow-sm`
      }`}
    >
      {/* ── Header row ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-3">
        <span className="text-xl leading-none">{config.emoji}</span>
        <span className="text-sm font-black text-gray-800">{config.label}</span>

        {/* Diet type icon buttons */}
        <div className="flex items-center gap-0.5 ml-auto">
          {DIET_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onDietTypeChange(opt.value)}
              disabled={skipped}
              title={opt.label}
              className={`w-8 h-8 rounded-full text-base flex items-center justify-center transition-all ${
                dietType === opt.value && !skipped
                  ? 'bg-white shadow-sm ring-1 ring-gray-300 scale-110'
                  : 'opacity-40 hover:opacity-70'
              }`}
            >
              {opt.emoji}
            </button>
          ))}
        </div>

        {/* Skip toggle */}
        <button
          onClick={onSkipToggle}
          className="ml-3 flex items-center gap-1.5 group"
          title={skipped ? 'Include this meal' : 'Skip this meal'}
        >
          <span className="text-xs text-gray-400 group-hover:text-gray-600 font-medium select-none">
            {skipped ? 'Skipped' : 'Skip'}
          </span>
          <div
            className={`w-8 h-4 rounded-full relative transition-colors duration-200 ${
              skipped ? 'bg-gray-400' : 'bg-gray-200'
            }`}
          >
            <div
              className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all duration-200 ${
                skipped ? 'translate-x-[18px]' : 'translate-x-0.5'
              }`}
            />
          </div>
        </button>
      </div>

      {/* ── Sliders — hidden when skipped ──────────────────────────── */}
      {!skipped && (
        <div className="px-4 pb-3 space-y-3">

          {/* ── Three-column row: Servings | Sliders | My List ─────── */}
          <div className="flex items-stretch gap-3">

            {/* LEFT: Serving size */}
            <div className="flex flex-col items-center justify-center gap-0.5 pr-3 border-r border-gray-200/80 min-w-[44px]">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-0.5">Serves</span>
              <button
                onClick={() => onServingsChange(Math.min(8, servings + 1))}
                className="w-6 h-6 rounded-full bg-white/80 hover:bg-white shadow-sm text-gray-600 font-bold text-sm flex items-center justify-center transition-colors leading-none"
              >
                +
              </button>
              <span className="text-lg font-black text-gray-800 leading-none my-0.5">{servings}</span>
              <button
                onClick={() => onServingsChange(Math.max(1, servings - 1))}
                className="w-6 h-6 rounded-full bg-white/80 hover:bg-white shadow-sm text-gray-600 font-bold text-sm flex items-center justify-center transition-colors leading-none"
              >
                −
              </button>
            </div>

            {/* CENTER: Sliders */}
            <div className="flex-1 space-y-3">
              {/* Health */}
              <div>
                <p className="text-[10px] font-bold text-gray-400 text-center uppercase tracking-widest mb-1.5">Health Quotient</p>
                <div className="flex items-center gap-2">
                  <span className="text-base leading-none" title="Healthy">🥗</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={health}
                    onChange={(e) => onHealthChange(Number(e.target.value))}
                    className="mm-slider flex-1 h-2 rounded-full appearance-none cursor-pointer focus:outline-none"
                    style={{
                      background: `linear-gradient(to right, ${config.accent} 0%, ${config.accent} ${health}%, #E5E7EB ${health}%, #E5E7EB 100%)`,
                    }}
                  />
                  <span className="text-base leading-none" title="Indulgent">🍰</span>
                </div>
              </div>

              {/* Complexity */}
              <div>
                <p className="text-[10px] font-bold text-gray-400 text-center uppercase tracking-widest mb-1.5">Preparation Time</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-400 whitespace-nowrap">5 min</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={complexity}
                    onChange={(e) => onComplexityChange(Number(e.target.value))}
                    className="mm-slider flex-1 h-2 rounded-full appearance-none cursor-pointer focus:outline-none"
                    style={{
                      background: `linear-gradient(to right, ${config.accent} 0%, ${config.accent} ${complexity}%, #E5E7EB ${complexity}%, #E5E7EB 100%)`,
                    }}
                  />
                  <span className="text-xs font-semibold text-gray-400 whitespace-nowrap">60+ min</span>
                </div>
              </div>
            </div>

            {/* RIGHT: My List button */}
            <div className="flex flex-col items-center justify-center gap-0.5 pl-3 border-l border-gray-200/80 min-w-[44px]">
              <button
                onClick={() => setShowMyList((p) => !p)}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  showMyList
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-white/80 hover:bg-white shadow-sm text-gray-500 hover:text-orange-500'
                }`}
                title="My custom dish list"
              >
                <ListPlus className="w-4 h-4" />
              </button>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-0.5">My List</span>
              {customDishes.length > 0 && (
                <span className="text-[9px] font-black text-orange-500">{customDishes.length}</span>
              )}
            </div>
          </div>

          {/* ── My List panel ──────────────────────────────────────── */}
          {showMyList && (
            <div className="mt-1 bg-white/70 rounded-xl border border-gray-200 p-3 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-gray-700">My Dish List</p>
                <p className="text-[10px] text-gray-400">AI picks these up intermittently</p>
              </div>

              {/* Existing dishes */}
              {customDishes.length === 0 && !addingDish && (
                <p className="text-xs text-gray-400 text-center py-1">No dishes yet — add your favourites below.</p>
              )}
              <div className="space-y-2">
                {customDishes.map((dish) => (
                  <div key={dish.id} className="bg-white rounded-lg border border-gray-100 p-2.5 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 leading-snug">{dish.name}</p>
                        {dish.description && (
                          <p className="text-xs text-gray-500 leading-snug mt-0.5">{dish.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => removeDish(dish.id)}
                        className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {/* Feedback buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setFeedback(dish.id, 'like')}
                        className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg transition-all ${
                          dish.feedback === 'like'
                            ? 'bg-pink-100 text-pink-600 border border-pink-200'
                            : 'bg-gray-50 text-gray-400 border border-gray-100 hover:border-pink-200 hover:text-pink-400'
                        }`}
                      >
                        <Heart className="w-3 h-3" />
                        Love it
                      </button>
                      <button
                        onClick={() => setFeedback(dish.id, 'more')}
                        className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg transition-all ${
                          dish.feedback === 'more'
                            ? 'bg-green-100 text-green-600 border border-green-200'
                            : 'bg-gray-50 text-gray-400 border border-gray-100 hover:border-green-200 hover:text-green-500'
                        }`}
                      >
                        <ThumbsUp className="w-3 h-3" />
                        More
                      </button>
                      <button
                        onClick={() => setFeedback(dish.id, 'less')}
                        className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg transition-all ${
                          dish.feedback === 'less'
                            ? 'bg-red-100 text-red-500 border border-red-200'
                            : 'bg-gray-50 text-gray-400 border border-gray-100 hover:border-red-200 hover:text-red-400'
                        }`}
                      >
                        <ThumbsDown className="w-3 h-3" />
                        Less
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add dish form */}
              {addingDish ? (
                <div className="space-y-2 border-t border-gray-100 pt-2">
                  <input
                    autoFocus
                    type="text"
                    value={newDishName}
                    onChange={(e) => setNewDishName(e.target.value)}
                    placeholder="Dish name (e.g. Palak Paneer)"
                    className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-300"
                  />
                  <textarea
                    value={newDishDesc}
                    onChange={(e) => setNewDishDesc(e.target.value)}
                    placeholder="Optional: describe how you like it, special ingredients, style… (e.g. My mum's recipe — extra ginger, no cream)"
                    rows={2}
                    className="w-full text-sm text-gray-700 bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-300 resize-none placeholder:text-gray-400"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={addDish}
                      disabled={!newDishName.trim()}
                      className="flex-1 text-xs font-bold py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white rounded-xl transition-colors"
                    >
                      Add dish
                    </button>
                    <button
                      onClick={() => { setAddingDish(false); setNewDishName(''); setNewDishDesc(''); }}
                      className="text-xs font-bold py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingDish(true)}
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-orange-500 hover:text-orange-600 py-1.5 border border-dashed border-orange-200 hover:border-orange-400 rounded-xl transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add a dish
                </button>
              )}
            </div>
          )}

          {/* Custom notes */}
          <div className="pt-1">
            {!showNotes ? (
              <button
                onClick={() => setShowNotes(true)}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Pencil className="w-3 h-3" />
                {customNotes ? (
                  <span>Note: <em className="not-italic font-semibold text-gray-600">"{customNotes.slice(0, 30)}{customNotes.length > 30 ? '…' : ''}"</em></span>
                ) : (
                  <span>Add a custom request…</span>
                )}
              </button>
            ) : (
              <div className="space-y-1.5">
                <textarea
                  autoFocus
                  value={customNotes}
                  onChange={(e) => onCustomNotesChange(e.target.value)}
                  placeholder={`e.g. "Something with paneer" or "Quick South Indian today"`}
                  rows={2}
                  className="w-full text-sm text-gray-700 bg-white/70 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-300 resize-none placeholder:text-gray-400"
                />
                <button
                  onClick={() => setShowNotes(false)}
                  className="text-xs text-gray-400 hover:text-gray-600 font-medium"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
