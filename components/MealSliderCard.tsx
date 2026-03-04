'use client';

import type { MealType } from '@/types/meal';

const MEAL_CONFIG = {
  breakfast: {
    emoji: '🌅',
    label: 'Breakfast',
    gradient: 'from-orange-50 to-amber-50',
    accent: '#FF6B35',
    border: 'border-orange-200',
    ring: 'ring-orange-300',
  },
  lunch: {
    emoji: '☀️',
    label: 'Lunch',
    gradient: 'from-yellow-50 to-lime-50',
    accent: '#F59E0B',
    border: 'border-yellow-200',
    ring: 'ring-yellow-300',
  },
  dinner: {
    emoji: '🌙',
    label: 'Dinner',
    gradient: 'from-purple-50 to-indigo-50',
    accent: '#8B5CF6',
    border: 'border-purple-200',
    ring: 'ring-purple-300',
  },
} as const;

interface SliderRowProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  leftEmoji: string;
  leftLabel: string;
  rightEmoji: string;
  rightLabel: string;
  accent: string;
}

function SliderRow({ label, value, onChange, leftEmoji, leftLabel, rightEmoji, rightLabel, accent }: SliderRowProps) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
      <div className="flex items-center gap-3">
        <span className="text-2xl leading-none" title={leftLabel}>
          {leftEmoji}
        </span>
        <div className="flex-1">
          <input
            type="range"
            min={0}
            max={100}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="mm-slider w-full h-2 rounded-full appearance-none cursor-pointer focus:outline-none"
            style={{
              background: `linear-gradient(to right, ${accent} 0%, ${accent} ${value}%, #E5E7EB ${value}%, #E5E7EB 100%)`,
            }}
          />
        </div>
        <span className="text-2xl leading-none" title={rightLabel}>
          {rightEmoji}
        </span>
      </div>
      <div className="flex justify-between text-[11px] font-medium text-gray-400 px-8">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}

interface MealSliderCardProps {
  mealType: MealType;
  health: number;
  complexity: number;
  onHealthChange: (v: number) => void;
  onComplexityChange: (v: number) => void;
}

export function MealSliderCard({
  mealType,
  health,
  complexity,
  onHealthChange,
  onComplexityChange,
}: MealSliderCardProps) {
  const config = MEAL_CONFIG[mealType];

  return (
    <div
      className={`bg-gradient-to-br ${config.gradient} rounded-2xl p-6 border ${config.border} shadow-sm hover:shadow-md transition-shadow duration-200`}
    >
      <div className="flex items-center gap-3 mb-5">
        <span className="text-4xl leading-none">{config.emoji}</span>
        <h3 className="text-xl font-black text-gray-800 tracking-tight">{config.label}</h3>
      </div>
      <div className="space-y-5">
        <SliderRow
          label="How healthy?"
          value={health}
          onChange={onHealthChange}
          leftEmoji="🥗"
          leftLabel="Healthy"
          rightEmoji="🍰"
          rightLabel="Indulgent"
          accent={config.accent}
        />
        <SliderRow
          label="How much effort?"
          value={complexity}
          onChange={onComplexityChange}
          leftEmoji="⚡"
          leftLabel="Easy"
          rightEmoji="👨‍🍳"
          rightLabel="Cumbersome"
          accent={config.accent}
        />
      </div>
    </div>
  );
}
