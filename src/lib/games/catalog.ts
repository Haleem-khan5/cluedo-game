export type GameStatus = "live" | "coming-soon";

export interface GameCatalogEntry {
  id: string;
  name: string;
  color: string;
  status: GameStatus;
  href?: string;
  tagline?: string;
}

export const PARTY_LINKS = [
  { id: "my-parties", label: "My Parties", href: "/parties", description: "Create or join a lobby" },
  { id: "public-parties", label: "Public Parties", href: "/parties/public", description: "Browse open games" },
] as const;

export const WEEKLY_GAMES: GameCatalogEntry[] = [
  {
    id: "brio",
    name: "Brio",
    color: "#c026d3",
    status: "coming-soon",
    tagline: "Weekly puzzle challenge",
  },
];

export const BOARD_GAMES: GameCatalogEntry[] = [
  { id: "picto", name: "Picto", color: "#ea580c", status: "coming-soon" },
  {
    id: "mini-clue",
    name: "Mini-Clue",
    color: "#65a30d",
    status: "live",
    href: "/lobby",
    tagline: "Deduction · 3–6 players",
  },
  { id: "bloco", name: "Bloco", color: "#2563eb", status: "coming-soon" },
  { id: "chicken-roll", name: "Chicken Roll", color: "#15803d", status: "coming-soon" },
  { id: "match-em", name: "Match 'Em!", color: "#991b1b", status: "coming-soon" },
  { id: "eggsplosion", name: "Eggsplosion", color: "#7c3aed", status: "coming-soon" },
  { id: "dudo", name: "Dudo", color: "#a16207", status: "coming-soon" },
];

export function getLiveGame(): GameCatalogEntry | undefined {
  return [...WEEKLY_GAMES, ...BOARD_GAMES].find((g) => g.status === "live");
}

export function isGameRoute(pathname: string): boolean {
  return pathname.startsWith("/game/");
}

export function shouldShowAppSidebar(pathname: string): boolean {
  return !pathname.startsWith("/auth");
}
