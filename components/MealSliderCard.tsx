'use client';

import type { MealType, MealDietType } from '@/types/meal';

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
  onHealthChange: (v: number) => void;
  onComplexityChange: (v: number) => void;
  onDietTypeChange: (d: MealDietType) => void;
  onSkipToggle: () => void;
}

export function MealSliderCard({
  mealType,
  health,
  complexity,
  dietType,
  skipped,
  onHealthChange,
  onComplexityChange,
  onDietTypeChange,
  onSkipToggle,
}: MealSliderCardProps) {
  const config = MEAL_CONFIG[mealType];

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
          {/* Health */}
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

          {/* Complexity */}
          <div className="flex items-center gap-2">
            <span className="text-base leading-none" title="Easy">⚡</span>
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
            <span className="text-base leading-none" title="Cumbersome">👨‍🍳</span>
          </div>
        </div>
      )}
    </div>
  );
}
