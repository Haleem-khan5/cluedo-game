/** Titles bots use as their first word — stripped so columns show a short, unique label. */
const TITLE_WORDS = new Set([
  "inspector",
  "agent",
  "chief",
  "detective",
  "sergeant",
  "sgt",
  "officer",
  "dr",
  "prof",
  "lt",
  "analyst",
  "investigator",
  "constable",
  "captain",
  "guest",
]);

/**
 * Short, identifying label for a player column.
 * "Investigator Shaw" → "Shaw", "Agent Cross" → "Cross", "Haleem Khan" → "Haleem", "Guest" → "Guest".
 */
export function shortPlayerName(displayName: string): string {
  const words = displayName.trim().split(/\s+/);
  if (words.length <= 1) return words[0] ?? displayName;
  const firstWord = words[0].replace(/\./g, "").toLowerCase();
  if (TITLE_WORDS.has(firstWord)) {
    return words.slice(1).join(" ");
  }
  return words[0];
}
