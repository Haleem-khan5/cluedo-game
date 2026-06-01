import type { Card } from "./constants";
import { SUSPECTS, WEAPONS, ROOMS } from "./constants";

export const CARD_EMOJI: Record<Card, string> = {
  "Professor Gray": "🎓",
  "Lady Violet": "💜",
  "Colonel Stone": "🎖️",
  "Doctor Rose": "🌹",
  "Captain Black": "⚓",
  "Miss Amber": "✨",
  "Silver Dagger": "🗡️",
  "Poison Bottle": "☠️",
  "Old Revolver": "🔫",
  Rope: "🪢",
  "Candle Stand": "🕯️",
  "Iron Wrench": "🔧",
  Library: "📚",
  Kitchen: "🍳",
  Ballroom: "💃",
  Study: "📖",
  "Dining Room": "🍽️",
  Conservatory: "🌿",
  Lounge: "🛋️",
  Gallery: "🖼️",
  Basement: "🏚️",
};

export type CardCategory = "suspect" | "room" | "weapon";

export function getCardCategory(card: Card): CardCategory {
  if ((SUSPECTS as readonly string[]).includes(card)) return "suspect";
  if ((WEAPONS as readonly string[]).includes(card)) return "weapon";
  return "room";
}

export const CATEGORY_ROW_CLASS: Record<CardCategory, string> = {
  suspect: "bg-emerald-50 border-emerald-200 text-emerald-900",
  room: "bg-emerald-50 border-emerald-200 text-emerald-900",
  weapon: "bg-sky-50 border-sky-200 text-sky-900",
};

export const CATEGORY_SELECTED_CLASS: Record<CardCategory, string> = {
  suspect: "ring-2 ring-purple-500 bg-purple-50",
  room: "ring-2 ring-purple-500 bg-purple-50",
  weapon: "ring-2 ring-purple-500 bg-sky-100",
};

/** Dark mansion-themed gradient + border per category (used by mini cards/panels). */
export const CATEGORY_CARD_CLASS: Record<CardCategory, string> = {
  suspect: "bg-gradient-to-br from-violet-800/70 to-violet-950 border-violet-400/30",
  room: "bg-gradient-to-br from-emerald-800/70 to-emerald-950 border-emerald-400/30",
  weapon: "bg-gradient-to-br from-rose-800/70 to-rose-950 border-rose-400/30",
};

export const CATEGORY_LABEL: Record<CardCategory, string> = {
  suspect: "Suspect",
  room: "Location",
  weapon: "Weapon",
};

export const CATEGORY_ACCENT_TEXT: Record<CardCategory, string> = {
  suspect: "text-violet-200",
  room: "text-emerald-200",
  weapon: "text-rose-200",
};
