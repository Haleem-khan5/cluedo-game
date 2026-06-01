import type { Card, Room, Suspect, Weapon } from "./constants";
import { ROOMS, SUSPECTS, WEAPONS } from "./constants";
import type { GameState, GameSolution, PlayerState, PendingSuggestion } from "./engine";
import { getMatchingCards, getCurrentPlayer } from "./engine";

export interface BotBrain {
  /** Cards proven NOT in the murder solution. */
  ruledOut: Set<Card>;
  /** Cards privately shown to this bot. */
  seenProof: Set<Card>;
  /** playerId → cards they definitely hold (observed via reveal). */
  knownHeld: Map<string, Set<Card>>;
  /** playerId → cards they definitely do NOT hold. */
  knownNotHeld: Map<string, Set<Card>>;
  turnCount: number;
}

export function createBotBrain(hand: Card[]): BotBrain {
  return {
    ruledOut: new Set(hand),
    seenProof: new Set(),
    knownHeld: new Map(),
    knownNotHeld: new Map(),
    turnCount: 0,
  };
}

export function recordRevealedCard(brain: BotBrain, card: Card, fromPlayerId?: string): void {
  brain.ruledOut.add(card);
  brain.seenProof.add(card);
  if (fromPlayerId) {
    if (!brain.knownHeld.has(fromPlayerId)) brain.knownHeld.set(fromPlayerId, new Set());
    brain.knownHeld.get(fromPlayerId)!.add(card);
  }
}

export function observeInterrogation(
  brain: BotBrain,
  pending: PendingSuggestion,
  disproverId: string,
  revealedCard: Card | null,
  allPlayerIds: string[]
): void {
  if (revealedCard) {
    brain.ruledOut.add(revealedCard);
    if (!brain.knownHeld.has(disproverId)) brain.knownHeld.set(disproverId, new Set());
    brain.knownHeld.get(disproverId)!.add(revealedCard);
    return;
  }

  // Disprover had no match — they hold none of the three
  if (!brain.knownNotHeld.has(disproverId)) brain.knownNotHeld.set(disproverId, new Set());
  const notHeld = brain.knownNotHeld.get(disproverId)!;
  notHeld.add(pending.suspect);
  notHeld.add(pending.weapon);
  notHeld.add(pending.room);
}

export function observeNoDisprove(brain: BotBrain, pending: PendingSuggestion): void {
  // Nobody could disprove — all three might be the solution; don't rule them out
  void brain;
  void pending;
}

function cardsNotInHand<T extends Card>(hand: Card[], pool: readonly T[]): T[] {
  return pool.filter((c) => !hand.includes(c));
}

function pickBest<T extends Card>(candidates: T[], brain: BotBrain): T {
  if (candidates.length === 0) throw new Error("No candidates");
  if (candidates.length === 1) return candidates[0];
  // Prefer cards with most uncertainty (not ruled out, not seen)
  const scored = candidates.map((c) => ({
    card: c,
    score: (brain.ruledOut.has(c) ? 0 : 2) + (brain.seenProof.has(c) ? 0 : 1),
  }));
  scored.sort((a, b) => b.score - a.score);
  const topScore = scored[0].score;
  const top = scored.filter((s) => s.score === topScore).map((s) => s.card);
  return top[Math.floor(Math.random() * top.length)];
}

export function chooseInterrogation(
  player: PlayerState,
  brain: BotBrain,
  allPlayers: PlayerState[]
): { suspect: Suspect; weapon: Weapon; room: Room } {
  brain.turnCount += 1;

  const unknownSuspects = cardsNotInHand(player.hand, SUSPECTS).filter((s) => !brain.ruledOut.has(s));
  const unknownWeapons = cardsNotInHand(player.hand, WEAPONS).filter((w) => !brain.ruledOut.has(w));
  const unknownRooms = cardsNotInHand(player.hand, ROOMS).filter((r) => !brain.ruledOut.has(r));

  // Target the player we know least about
  const others = allPlayers.filter((p) => p.id !== player.id && !p.isEliminated);
  let targetId = others[0]?.id;
  let minKnown = Infinity;
  for (const p of others) {
    const known = brain.knownHeld.get(p.userId)?.size ?? 0;
    if (known < minKnown) {
      minKnown = known;
      targetId = p.id;
    }
  }

  // Pick cards the target might hold (not in our knownNotHeld for them)
  const targetNotHeld = targetId
    ? brain.knownNotHeld.get(allPlayers.find((p) => p.id === targetId)?.userId ?? "") ?? new Set()
    : new Set<Card>();

  const pickFrom = <T extends Card>(pool: T[], unknown: T[]): T => {
    const preferred = unknown.filter((c) => !targetNotHeld.has(c));
    const pool2 = preferred.length ? preferred : unknown.length ? unknown : pool;
    return pickBest(pool2, brain);
  };

  return {
    suspect: pickFrom([...SUSPECTS], unknownSuspects),
    weapon: pickFrom([...WEAPONS], unknownWeapons),
    room: pickFrom([...ROOMS], unknownRooms),
  };
}

export function chooseDisproveCard(
  hand: Card[],
  suggestion: { suspect: Suspect; weapon: Weapon; room: Room }
): Card | null {
  const matches = getMatchingCards(hand, {
    ...suggestion,
    suggesterId: "",
    disproveIndex: 0,
  });
  if (matches.length === 0) return null;

  // Least informative: room first, then weapon, then suspect
  const priority: Card[] = [suggestion.room, suggestion.weapon, suggestion.suspect];
  for (const card of priority) {
    if (matches.includes(card)) return card;
  }
  return matches[0];
}

export function getSolutionCandidates(brain: BotBrain): {
  suspects: Suspect[];
  weapons: Weapon[];
  rooms: Room[];
} {
  return {
    suspects: SUSPECTS.filter((s) => !brain.ruledOut.has(s)),
    weapons: WEAPONS.filter((w) => !brain.ruledOut.has(w)),
    rooms: ROOMS.filter((r) => !brain.ruledOut.has(r)),
  };
}

export function chooseAccusation(
  player: PlayerState,
  brain: BotBrain,
  _solution: GameSolution
): { suspect: Suspect; weapon: Weapon; room: Room } | null {
  if (!player.canAccuse) return null;

  const { suspects, weapons, rooms } = getSolutionCandidates(brain);

  // Confident — exactly one option in each category
  if (suspects.length === 1 && weapons.length === 1 && rooms.length === 1) {
    return { suspect: suspects[0], weapon: weapons[0], room: rooms[0] };
  }

  // Strong deduction — very narrow, accuse best guess
  const totalOptions = suspects.length * weapons.length * rooms.length;
  if (totalOptions <= 4 && brain.turnCount >= 3) {
    return {
      suspect: suspects[0],
      weapon: weapons[0],
      room: rooms[0],
    };
  }

  // Late game educated guess
  if (brain.turnCount >= 6 && suspects.length <= 2 && weapons.length <= 2 && rooms.length <= 2) {
    return {
      suspect: suspects[Math.floor(Math.random() * suspects.length)],
      weapon: weapons[Math.floor(Math.random() * weapons.length)],
      room: rooms[Math.floor(Math.random() * rooms.length)],
    };
  }

  return null;
}

export function getDisprovingPlayer(state: GameState): PlayerState | null {
  if (state.phase !== "disprove" || !state.pendingSuggestion) return null;
  return state.players[state.pendingSuggestion.disproveIndex] ?? null;
}

export function isBotsTurnToAct(state: GameState, botUserIds: Set<string>): boolean {
  if (state.status === "finished") return false;

  if (state.phase === "disprove" && state.pendingSuggestion) {
    const disprover = state.players[state.pendingSuggestion.disproveIndex];
    return botUserIds.has(disprover.userId);
  }

  if (state.phase === "turn") {
    return botUserIds.has(getCurrentPlayer(state).userId);
  }

  return false;
}

/** Sync all bot brains after a public state change. */
export function syncBotObservations(
  game: { botBrains: Map<string, BotBrain>; botUserIds: Set<string>; state: GameState },
  lastRevealed?: { card: Card; fromUserId: string; toUserId: string }
): void {
  if (lastRevealed) {
    for (const userId of game.botUserIds) {
      const brain = game.botBrains.get(userId);
      if (!brain) continue;
      if (userId === lastRevealed.toUserId) {
        recordRevealedCard(brain, lastRevealed.card, lastRevealed.fromUserId);
      }
    }
  }
}
