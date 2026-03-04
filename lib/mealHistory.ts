/**
 * Client-side helpers for meal history, recent tracking, and feedback.
 * All data lives in localStorage — server-safe (returns [] on SSR).
 */

import type { MealType } from '@/types/meal';

// ── Keys ─────────────────────────────────────────────────────────────────────

export const LIKES_KEY = 'mealmate-likes';
export const MORE_KEY  = 'mealmate-more';
export const LESS_KEY  = 'mealmate-less';
const RECENT_KEY       = 'mealmate-recent';

// ── Low-level list helpers ────────────────────────────────────────────────────

function readList(key: string): string[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(key) ?? '[]'); } catch { return []; }
}

function writeList(key: string, items: string[]): void {
  localStorage.setItem(key, JSON.stringify(items));
}

/** Toggle a meal name in a list. Returns the new active state. */
export function toggleFeedback(key: string, name: string): boolean {
  const list = readList(key);
  const exists = list.includes(name);
  writeList(key, exists ? list.filter((n) => n !== name) : [name, ...list].slice(0, 40));
  return !exists;
}

export function removeFromFeedbackList(key: string, name: string): void {
  writeList(key, readList(key).filter((n) => n !== name));
}

export function isInFeedbackList(key: string, name: string): boolean {
  return readList(key).includes(name);
}

// ── Feedback getters (for passing to API) ────────────────────────────────────

/** Meals the user has down-voted ("less of this") */
export function getLessOfThese(limit = 6): string[] {
  return readList(LESS_KEY).slice(0, limit);
}

/**
 * Meals the user has up-voted ("more of this").
 * Used as a taste-profile signal sent to Claude.
 */
export function getMoreOfThese(limit = 8): string[] {
  return readList(MORE_KEY).slice(0, limit);
}

/**
 * Liked meals (saves).
 * Top items sent as extra taste-profile signal.
 */
export function getLikedMeals(limit = 8): string[] {
  return readList(LIKES_KEY).slice(0, limit);
}

// ── Recent-meal tracking ──────────────────────────────────────────────────────

interface RecentEntry { type: MealType; name: string; ts: number; }

function readRecent(): RecentEntry[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]'); } catch { return []; }
}

/** Call after a meal is successfully generated to build the recency list. */
export function addRecentMeal(type: MealType, name: string): void {
  const list = readRecent().filter((e) => !(e.type === type && e.name === name));
  localStorage.setItem(
    RECENT_KEY,
    JSON.stringify([{ type, name, ts: Date.now() }, ...list].slice(0, 30)),
  );
}

/**
 * Return the most recently generated meal names for a given type.
 * Passed to Claude as an "avoid repeating" list.
 */
export function getRecentMeals(type: MealType, limit = 7): string[] {
  return readRecent()
    .filter((e) => e.type === type)
    .slice(0, limit)
    .map((e) => e.name);
}
