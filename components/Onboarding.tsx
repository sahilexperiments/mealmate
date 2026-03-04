'use client';

import { useState } from 'react';
import type { DietType, CookLanguage, UserProfile } from '@/types/meal';

const DIET_OPTIONS: { value: DietType; emoji: string; label: string; desc: string }[] = [
  { value: 'vegetarian',     emoji: '🌿', label: 'Vegetarian',  desc: 'No meat, poultry, fish, or eggs'         },
  { value: 'eggetarian',     emoji: '🥚', label: 'Eggetarian',  desc: 'Vegetarian + eggs'                       },
  { value: 'non-vegetarian', emoji: '🍗', label: 'Non-Veg',     desc: 'Everything including meat & fish'        },
  { value: 'jain',           emoji: '🙏', label: 'Jain',        desc: 'No root vegetables, meat, or eggs'      },
];

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

interface Props {
  initialProfile: UserProfile;
  onComplete: (profile: UserProfile) => void;
}

export function Onboarding({ initialProfile, onComplete }: Props) {
  const [dietType,    setDietType]    = useState<DietType>(initialProfile.dietType);
  const [allergens,   setAllergens]   = useState<string[]>(initialProfile.allergens ?? []);
  const [gutFriendly, setGutFriendly] = useState(initialProfile.gutFriendly ?? false);

  const toggleAllergen = (id: string) =>
    setAllergens((prev) => prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]);

  const handleSubmit = () => {
    onComplete({
      ...initialProfile,
      dietType,
      allergens,
      gutFriendly,
      onboardingComplete: true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-cream flex flex-col overflow-y-auto">
      <div className="max-w-lg mx-auto w-full px-5 py-10 space-y-8">

        {/* Header */}
        <div className="text-center space-y-2">
          <span className="text-5xl">🍛</span>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Welcome to MealMate</h1>
          <p className="text-sm text-gray-500 font-medium">
            Quick setup — takes 30 seconds. We&apos;ll personalise every meal to you.
          </p>
        </div>

        {/* Diet type */}
        <section className="space-y-3">
          <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest">What do you eat?</h2>
          <div className="grid grid-cols-2 gap-2">
            {DIET_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDietType(opt.value)}
                className={`flex items-start gap-3 p-3 rounded-2xl border-2 text-left transition-all ${
                  dietType === opt.value
                    ? 'border-saffron bg-orange-50'
                    : 'border-gray-200 bg-white hover:border-orange-200'
                }`}
              >
                <span className="text-2xl leading-none mt-0.5">{opt.emoji}</span>
                <div>
                  <p className="text-sm font-bold text-gray-900">{opt.label}</p>
                  <p className="text-[11px] text-gray-400 leading-snug mt-0.5">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Allergens */}
        <section className="space-y-3">
          <div>
            <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest">Any food allergies?</h2>
            <p className="text-xs text-gray-400 mt-0.5">We&apos;ll never include these in your meals.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {ALLERGEN_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => toggleAllergen(opt.id)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-all ${
                  allergens.includes(opt.id)
                    ? 'bg-red-500 text-white border-red-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-red-300'
                }`}
              >
                <span>{opt.emoji}</span>
                {opt.label}
              </button>
            ))}
          </div>
          {allergens.length === 0 && (
            <p className="text-xs text-gray-400">None selected — tap to add any you have.</p>
          )}
        </section>

        {/* Gut-friendly */}
        <section className="space-y-3">
          <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest">Gut-Friendly Mode</h2>
          <button
            onClick={() => setGutFriendly((p) => !p)}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
              gutFriendly
                ? 'border-emerald-400 bg-emerald-50'
                : 'border-gray-200 bg-white hover:border-emerald-200'
            }`}
          >
            <span className="text-3xl leading-none">🫀</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">Prioritise gut health</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-snug">
                Probiotic-rich, anti-inflammatory, easy-to-digest meals. Less fried, less heavy.
              </p>
            </div>
            <div className={`w-10 h-6 rounded-full relative transition-colors duration-200 flex-shrink-0 ${gutFriendly ? 'bg-emerald-400' : 'bg-gray-200'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200 ${gutFriendly ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
          </button>
        </section>

        {/* CTA */}
        <button
          onClick={handleSubmit}
          className="w-full bg-saffron hover:bg-orange-600 text-white font-black text-base py-4 rounded-2xl shadow-md shadow-orange-200 transition-all active:scale-[0.98]"
        >
          Let&apos;s Start Cooking 🍳
        </button>

      </div>
    </div>
  );
}
