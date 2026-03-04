'use client';

import { useState, useCallback } from 'react';
import { RefreshCw, ChevronDown, ChevronUp, Play, Square, Loader2, Leaf, ShoppingBag, Heart, ThumbsUp, ThumbsDown } from 'lucide-react';
import type { MealSuggestion, MealType, CookLanguage } from '@/types/meal';
import { toggleFeedback, removeFromFeedbackList, isInFeedbackList, LIKES_KEY, MORE_KEY, LESS_KEY } from '@/lib/mealHistory';

const MEAL_CONFIG = {
  breakfast: { emoji: '🌅', label: 'Breakfast', bg: 'bg-saffron', text: 'text-white' },
  lunch: { emoji: '☀️', label: 'Lunch', bg: 'bg-turmeric', text: 'text-white' },
  dinner: { emoji: '🌙', label: 'Dinner', bg: 'bg-purple-500', text: 'text-white' },
} as const;

const LANG_BCP47: Record<CookLanguage, string> = {
  english: 'en-IN',
  hindi: 'hi-IN',
  tamil: 'ta-IN',
  telugu: 'te-IN',
  kannada: 'kn-IN',
  marathi: 'mr-IN',
  bengali: 'bn-IN',
  gujarati: 'gu-IN',
};

const LANG_LABEL: Record<CookLanguage, string> = {
  english: 'EN',
  hindi: 'हिंदी',
  tamil: 'தமிழ்',
  telugu: 'తెలుగు',
  kannada: 'ಕನ್ನಡ',
  marathi: 'मराठी',
  bengali: 'বাং',
  gujarati: 'ગુ',
};

const COMPLEXITY_STYLE: Record<string, string> = {
  Easy: 'text-emerald-700 bg-emerald-50',
  Medium: 'text-amber-700 bg-amber-50',
  Complex: 'text-red-700 bg-red-50',
};

interface Props {
  suggestion: MealSuggestion;
  mealType: MealType;
  cookLanguage: CookLanguage;
  onNewSuggestion: () => void;
  isRegenerating: boolean;
}

export function MealSuggestionCard({ suggestion, mealType, cookLanguage, onNewSuggestion, isRegenerating }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  // ── meal feedback (persisted in localStorage via mealHistory) ────────────
  const name = suggestion.name;
  const [liked,     setLiked]     = useState(() => isInFeedbackList(LIKES_KEY, name));
  const [votedMore, setVotedMore] = useState(() => isInFeedbackList(MORE_KEY,  name));
  const [votedLess, setVotedLess] = useState(() => isInFeedbackList(LESS_KEY,  name));

  const handleLike = () => setLiked(toggleFeedback(LIKES_KEY, name));

  const handleMore = () => {
    const nowActive = toggleFeedback(MORE_KEY, name);
    setVotedMore(nowActive);
    if (nowActive && votedLess) { removeFromFeedbackList(LESS_KEY, name); setVotedLess(false); }
  };

  const handleLess = () => {
    const nowActive = toggleFeedback(LESS_KEY, name);
    setVotedLess(nowActive);
    if (nowActive && votedMore) { removeFromFeedbackList(MORE_KEY, name); setVotedMore(false); }
  };
  const config = MEAL_CONFIG[mealType];
  const { nutritionalValue: n } = suggestion;

  const handleSpeak = useCallback(() => {
    if (!('speechSynthesis' in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(suggestion.voiceNoteText);
    utterance.lang = LANG_BCP47[cookLanguage];
    utterance.rate = 0.85;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }, [speaking, suggestion.voiceNoteText, cookLanguage]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-slide-up">
      {/* Coloured header bar */}
      <div className={`${config.bg} px-5 py-3 flex items-center justify-between`}>
        <span className="flex items-center gap-2 text-white font-bold text-sm">
          <span className="text-xl">{config.emoji}</span>
          {config.label}
        </span>
        <button
          onClick={onNewSuggestion}
          disabled={isRegenerating}
          className="flex items-center gap-1.5 bg-white/20 hover:bg-white/35 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRegenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          New Suggestion
        </button>
      </div>

      {/* Main body */}
      <div className="p-5">
        {/* Title + cost row */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight leading-tight">{suggestion.name}</h3>
            <p className="text-xs text-gray-400 mt-0.5 font-medium">{suggestion.cuisine}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-black text-gray-800">₹{suggestion.totalCostInr}</p>
            <p className="text-xs text-gray-400">{suggestion.prepTimeMinutes} min</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 mt-3 leading-relaxed">{suggestion.description}</p>

        {/* Stat chips */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
            🔥 {n.calories} kcal
          </span>
          <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
            💪 {n.protein}g protein
          </span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${COMPLEXITY_STYLE[suggestion.complexityLabel] ?? ''}`}>
            {suggestion.complexityLabel}
          </span>
          {suggestion.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full capitalize">
              {tag}
            </span>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setExpanded((p) => !p)}
            className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 px-4 py-2.5 rounded-xl transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {expanded ? 'Hide Details' : 'View Details'}
          </button>
          <button
            onClick={handleSpeak}
            className={`flex items-center justify-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors ${
              speaking
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-indigo-500 hover:bg-indigo-600 text-white'
            }`}
          >
            {speaking ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            Cook&apos;s Note
            <span className="text-xs opacity-80 ml-0.5">({LANG_LABEL[cookLanguage]})</span>
          </button>
        </div>

        {/* Feedback row */}
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-100">
          <span className="text-[11px] text-gray-400 font-medium mr-0.5">Rate this meal:</span>
          <button
            onClick={handleLike}
            title="Save to favourites"
            className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl border transition-all ${
              liked
                ? 'bg-pink-50 text-pink-500 border-pink-200'
                : 'bg-white text-gray-400 border-gray-200 hover:border-pink-300 hover:text-pink-400'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-pink-500' : ''}`} />
            {liked ? 'Saved' : 'Save'}
          </button>
          <button
            onClick={handleMore}
            title="Suggest more like this"
            className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl border transition-all ${
              votedMore
                ? 'bg-emerald-50 text-emerald-600 border-emerald-300'
                : 'bg-white text-gray-400 border-gray-200 hover:border-emerald-300 hover:text-emerald-500'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            More
          </button>
          <button
            onClick={handleLess}
            title="Suggest less like this"
            className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl border transition-all ${
              votedLess
                ? 'bg-red-50 text-red-500 border-red-300'
                : 'bg-white text-gray-400 border-gray-200 hover:border-red-300 hover:text-red-400'
            }`}
          >
            <ThumbsDown className="w-3.5 h-3.5" />
            Less
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-5 space-y-6 animate-fade-in">
          {/* Nutrition grid */}
          <section>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
              Nutrition per serving
            </h4>
            <div className="grid grid-cols-5 gap-2">
              {[
                { label: 'Cal', value: String(n.calories), color: 'text-orange-600', bg: 'bg-orange-50' },
                { label: 'Protein', value: `${n.protein}g`, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Carbs', value: `${n.carbs}g`, color: 'text-yellow-600', bg: 'bg-yellow-50' },
                { label: 'Fat', value: `${n.fat}g`, color: 'text-rose-500', bg: 'bg-rose-50' },
                { label: 'Fiber', value: `${n.fiber}g`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              ].map((item) => (
                <div key={item.label} className={`${item.bg} rounded-xl p-2.5 text-center`}>
                  <p className={`text-sm font-black ${item.color}`}>{item.value}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5 font-medium">{item.label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Ingredients */}
          <section>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5" />
              Ingredients
            </h4>
            <div className="space-y-2">
              {suggestion.ingredients.map((ing, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-white rounded-xl px-3.5 py-2.5 border border-gray-100"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{ing.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{ing.quantity}</p>
                    {ing.isCleanLabel && ing.brandRecommendation && (
                      <p className="text-xs text-emerald-600 flex items-center gap-0.5 mt-0.5 font-medium">
                        <Leaf className="w-3 h-3" />
                        {ing.brandRecommendation}
                      </p>
                    )}
                    <div className="flex gap-1 mt-1.5">
                      <a
                        href={`https://blinkit.com/s/?q=${encodeURIComponent(ing.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#F4F600] text-[#1a1a1a] hover:opacity-75 transition-opacity"
                      >
                        Blinkit
                      </a>
                      <a
                        href={`https://www.zeptonow.com/search?query=${encodeURIComponent(ing.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-600 text-white hover:opacity-75 transition-opacity"
                      >
                        Zepto
                      </a>
                      <a
                        href={`https://www.swiggy.com/instamart/search?query=${encodeURIComponent(ing.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#FC8019] text-white hover:opacity-75 transition-opacity"
                      >
                        Swiggy
                      </a>
                    </div>
                  </div>
                  <div className="text-right ml-3 shrink-0">
                    <p className="text-sm font-bold text-gray-800">₹{ing.estimatedCostInr}</p>
                    {ing.isCleanLabel && (
                      <p className="text-[10px] text-emerald-500 font-semibold">Clean ✓</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center mt-3 px-3.5 py-3 bg-white rounded-xl border-2 border-gray-200">
              <span className="text-sm font-bold text-gray-700">Total estimated cost</span>
              <span className="text-base font-black text-gray-900">₹{suggestion.totalCostInr}</span>
            </div>
          </section>

          {/* Voice note */}
          <section className="bg-indigo-50 rounded-xl p-4">
            <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              🎙️ Cook&apos;s Instructions ({LANG_LABEL[cookLanguage]})
            </h4>
            <p className="text-sm text-indigo-900 leading-relaxed">{suggestion.voiceNoteText}</p>
            <button
              onClick={handleSpeak}
              className={`mt-3 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                speaking
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
              }`}
            >
              {speaking ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {speaking ? 'Stop' : 'Play Voice Note'}
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
