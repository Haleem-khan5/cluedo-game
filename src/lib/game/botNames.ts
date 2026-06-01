/** Detective-style names for AI opponents. */
export const BOT_DETECTIVE_NAMES = [
  "Inspector Vale",
  "Agent Cross",
  "Chief Morales",
  "Detective Finch",
  "Sergeant Hale",
  "Officer Quinn",
  "Dr. Whitmore",
  "Prof. Ashford",
  "Lt. Mercer",
  "Analyst Brooks",
  "Investigator Shaw",
  "Constable Reed",
  "Detective Lang",
  "Captain Avery",
  "Inspector Crane",
  "Agent Sloane",
  "Chief Dalton",
  "Officer Pierce",
  "Detective Knox",
  "Sgt. Winters",
] as const;

export function pickRandomBotName(alreadyUsed: string[]): string {
  const used = new Set(alreadyUsed.map((n) => n.toLowerCase()));
  const available = BOT_DETECTIVE_NAMES.filter((n) => !used.has(n.toLowerCase()));
  const pool = available.length > 0 ? available : BOT_DETECTIVE_NAMES;
  return pool[Math.floor(Math.random() * pool.length)];
}
