export const SUSPECTS = [
  "Professor Gray",
  "Lady Violet",
  "Colonel Stone",
  "Doctor Rose",
  "Captain Black",
  "Miss Amber",
] as const;

export const WEAPONS = [
  "Silver Dagger",
  "Poison Bottle",
  "Old Revolver",
  "Rope",
  "Candle Stand",
  "Iron Wrench",
] as const;

export const ROOMS = [
  "Library",
  "Kitchen",
  "Ballroom",
  "Study",
  "Dining Room",
  "Conservatory",
  "Lounge",
  "Gallery",
  "Basement",
] as const;

export type Suspect = (typeof SUSPECTS)[number];
export type Weapon = (typeof WEAPONS)[number];
export type Room = (typeof ROOMS)[number];
export type Card = Suspect | Weapon | Room;

export const PLAYER_COLORS = [
  { id: "burgundy", name: "Burgundy", hex: "#8B2942" },
  { id: "gold", name: "Gold", hex: "#C9A227" },
  { id: "green", name: "Forest", hex: "#2D6A4F" },
  { id: "white", name: "Ivory", hex: "#F5F0E8" },
  { id: "blue", name: "Sapphire", hex: "#1E3A5F" },
  { id: "purple", name: "Amethyst", hex: "#6B3FA0" },
] as const;

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 6;

export const BOARD_WIDTH = 24;
export const BOARD_HEIGHT = 25;

export type CellType = "wall" | "corridor" | "room" | "door";

export interface RoomDef {
  id: Room;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  doors: { x: number; y: number }[];
}

export const ROOM_DEFINITIONS: RoomDef[] = [
  {
    id: "Study",
    x: 0,
    y: 0,
    w: 6,
    h: 6,
    color: "#4A3728",
    doors: [
      { x: 5, y: 3 },
      { x: 3, y: 5 },
    ],
  },
  {
    id: "Gallery",
    x: 9,
    y: 0,
    w: 6,
    h: 6,
    color: "#5C4033",
    doors: [
      { x: 11, y: 5 },
      { x: 9, y: 3 },
      { x: 14, y: 3 },
    ],
  },
  {
    id: "Library",
    x: 18,
    y: 0,
    w: 6,
    h: 6,
    color: "#3D2B1F",
    doors: [
      { x: 18, y: 3 },
      { x: 21, y: 5 },
    ],
  },
  {
    id: "Kitchen",
    x: 0,
    y: 9,
    w: 6,
    h: 6,
    color: "#6B4423",
    doors: [
      { x: 5, y: 11 },
      { x: 3, y: 9 },
    ],
  },
  {
    id: "Lounge",
    x: 9,
    y: 9,
    w: 6,
    h: 6,
    color: "#7D6B5D",
    doors: [
      { x: 11, y: 9 },
      { x: 14, y: 11 },
      { x: 9, y: 11 },
      { x: 11, y: 14 },
    ],
  },
  {
    id: "Ballroom",
    x: 18,
    y: 9,
    w: 6,
    h: 6,
    color: "#8B6914",
    doors: [
      { x: 18, y: 11 },
      { x: 21, y: 9 },
    ],
  },
  {
    id: "Dining Room",
    x: 0,
    y: 18,
    w: 6,
    h: 7,
    color: "#722F37",
    doors: [
      { x: 5, y: 20 },
      { x: 3, y: 18 },
    ],
  },
  {
    id: "Basement",
    x: 9,
    y: 18,
    w: 6,
    h: 7,
    color: "#2C2C2C",
    doors: [
      { x: 11, y: 18 },
      { x: 9, y: 20 },
      { x: 14, y: 20 },
    ],
  },
  {
    id: "Conservatory",
    x: 18,
    y: 18,
    w: 6,
    h: 7,
    color: "#2D5016",
    doors: [
      { x: 18, y: 20 },
      { x: 21, y: 18 },
    ],
  },
];

export const SECRET_PASSAGES: [Room, Room][] = [
  ["Study", "Kitchen"],
  ["Kitchen", "Study"],
  ["Library", "Conservatory"],
  ["Conservatory", "Library"],
  ["Gallery", "Lounge"],
  ["Lounge", "Gallery"],
];

export const START_POSITIONS = [
  { x: 7, y: 0, color: "burgundy" },
  { x: 11, y: 0, color: "gold" },
  { x: 15, y: 0, color: "green" },
  { x: 23, y: 7, color: "white" },
  { x: 0, y: 7, color: "blue" },
  { x: 23, y: 17, color: "purple" },
];

export const SUSPECT_TOKENS: Record<Suspect, { x: number; y: number; room: Room | null }> = {
  "Professor Gray": { x: 2, y: 2, room: "Study" },
  "Lady Violet": { x: 11, y: 2, room: "Gallery" },
  "Colonel Stone": { x: 20, y: 2, room: "Library" },
  "Doctor Rose": { x: 2, y: 11, room: "Kitchen" },
  "Captain Black": { x: 20, y: 11, room: "Ballroom" },
  "Miss Amber": { x: 11, y: 21, room: "Basement" },
};

export function getCardType(card: Card): "suspect" | "weapon" | "room" {
  if ((SUSPECTS as readonly string[]).includes(card)) return "suspect";
  if ((WEAPONS as readonly string[]).includes(card)) return "weapon";
  return "room";
}

export function getCardEmoji(card: Card): string {
  const type = getCardType(card);
  if (type === "suspect") {
    const map: Record<string, string> = {
      "Professor Gray": "🎓",
      "Lady Violet": "💜",
      "Colonel Stone": "🎖️",
      "Doctor Rose": "🌹",
      "Captain Black": "⚓",
      "Miss Amber": "✨",
    };
    return map[card] ?? "🕵️";
  }
  if (type === "weapon") {
    const map: Record<string, string> = {
      "Silver Dagger": "🗡️",
      "Poison Bottle": "☠️",
      "Old Revolver": "🔫",
      Rope: "🪢",
      "Candle Stand": "🕯️",
      "Iron Wrench": "🔧",
    };
    return map[card] ?? "🔪";
  }
  const map: Record<string, string> = {
    Library: "📚",
    Kitchen: "🍳",
    Ballroom: "💃",
    Study: "📜",
    "Dining Room": "🍽️",
    Conservatory: "🌿",
    Lounge: "🛋️",
    Gallery: "🖼️",
    Basement: "🏚️",
  };
  return map[card] ?? "🏠";
}
