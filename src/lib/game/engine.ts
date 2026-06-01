import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  ROOMS,
  SUSPECTS,
  SUSPECT_TOKENS,
  WEAPONS,
  START_POSITIONS,
  type Card,
  type Room,
  type Suspect,
  type Weapon,
} from "./constants";

export type TurnPhase = "turn" | "disprove";

export interface GameSolution {
  suspect: Suspect;
  weapon: Weapon;
  room: Room;
}

export interface PlayerState {
  id: string;
  userId: string;
  displayName: string;
  color: string;
  position: { x: number; y: number };
  currentRoom: Room | null;
  hand: Card[];
  canAccuse: boolean;
  isEliminated: boolean;
  turnOrder: number;
  isConnected: boolean;
  isBot?: boolean;
}

export interface SuspectTokenState {
  suspect: Suspect;
  room: Room;
}

export interface PendingSuggestion {
  suspect: Suspect;
  weapon: Weapon;
  room: Room;
  suggesterId: string;
  disproveIndex: number;
}

/** Public record of an interrogation — visible to all players (never reveals which card was shown). */
export interface InterrogationLogEntry {
  id: string;
  suggesterId: string;
  suggesterName: string;
  suspect: Suspect;
  weapon: Weapon;
  room: Room;
  outcome: "pending" | "disproved" | "unrefuted";
  /** Name of the player who disproved (card stays private to the interrogator). */
  disprovedByName?: string;
}

export interface GameState {
  id: string;
  lobbyCode: string;
  status: "playing" | "finished";
  phase: TurnPhase;
  turnIndex: number;
  diceRoll: number | null;
  hasMoved: boolean;
  hasSuggested: boolean;
  players: PlayerState[];
  suspectTokens: SuspectTokenState[];
  pendingSuggestion: PendingSuggestion | null;
  winnerId: string | null;
  lastAction: string | null;
  movedViaSecretPassage: boolean;
  /** Chronological record of every interrogation this game. */
  interrogationLog: InterrogationLogEntry[];
}

function updateLastLog(
  log: InterrogationLogEntry[],
  patch: Partial<InterrogationLogEntry>
): InterrogationLogEntry[] {
  if (log.length === 0) return log;
  return log.map((entry, i) =>
    i === log.length - 1 ? { ...entry, ...patch } : entry
  );
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createSolution(): GameSolution {
  const allCards: Card[] = [...SUSPECTS, ...WEAPONS, ...ROOMS];
  const shuffled = shuffle(allCards);
  return {
    suspect: shuffled.find((c) => SUSPECTS.includes(c as Suspect)) as Suspect,
    weapon: shuffled.find((c) => WEAPONS.includes(c as Weapon)) as Weapon,
    room: shuffled.find((c) => ROOMS.includes(c as Room)) as Room,
  };
}

export function dealCards(solution: GameSolution, playerCount: number): Card[][] {
  const remaining: Card[] = [...SUSPECTS, ...WEAPONS, ...ROOMS].filter(
    (c) => c !== solution.suspect && c !== solution.weapon && c !== solution.room
  );
  const shuffled = shuffle(remaining);
  const hands: Card[][] = Array.from({ length: playerCount }, () => []);
  shuffled.forEach((card, i) => {
    hands[i % playerCount].push(card);
  });
  return hands;
}

export function initializeGame(
  sessionId: string,
  lobbyCode: string,
  players: Omit<PlayerState, "hand" | "position" | "currentRoom">[],
  solution: GameSolution
): { state: GameState; solution: GameSolution } {
  const hands = dealCards(solution, players.length);
  const sorted = [...players].sort((a, b) => a.turnOrder - b.turnOrder);

  const playerStates: PlayerState[] = sorted.map((p, i) => ({
    ...p,
    hand: hands[i],
    position: { ...START_POSITIONS[i] },
    currentRoom: null,
  }));

  const suspectTokens: SuspectTokenState[] = SUSPECTS.map((s) => ({
    suspect: s,
    room: SUSPECT_TOKENS[s].room!,
  }));

  const firstPlayer = playerStates[0];

  const state: GameState = {
    id: sessionId,
    lobbyCode,
    status: "playing",
    phase: "turn",
    turnIndex: 0,
    diceRoll: null,
    hasMoved: false,
    hasSuggested: false,
    players: playerStates,
    suspectTokens,
    pendingSuggestion: null,
    winnerId: null,
    lastAction: `${firstPlayer.displayName}'s turn — interrogate or accuse.`,
    movedViaSecretPassage: false,
    interrogationLog: [],
  };

  return { state, solution };
}

export function getCurrentPlayer(state: GameState): PlayerState {
  return state.players[state.turnIndex];
}

function advanceToNextPlayer(state: GameState, lastAction: string): GameState {
  let nextIndex = (state.turnIndex + 1) % state.players.length;
  let attempts = 0;
  while (state.players[nextIndex].isEliminated && attempts < state.players.length) {
    nextIndex = (nextIndex + 1) % state.players.length;
    attempts++;
  }

  const nextPlayer = state.players[nextIndex];
  return {
    ...state,
    turnIndex: nextIndex,
    phase: "turn",
    pendingSuggestion: null,
    hasMoved: false,
    hasSuggested: false,
    movedViaSecretPassage: false,
    diceRoll: null,
    lastAction: lastAction || `${nextPlayer.displayName}'s turn — interrogate or accuse.`,
  };
}

export function makeInterrogation(
  state: GameState,
  playerId: string,
  suspect: Suspect,
  weapon: Weapon,
  room: Room
): { state: GameState; error?: string } {
  if (state.phase !== "turn") return { state, error: "Not your turn to act" };

  const current = getCurrentPlayer(state);
  if (current.id !== playerId) return { state, error: "Not your turn" };

  const nextPlayerIndex = (state.turnIndex + 1) % state.players.length;

  const suspectTokens = state.suspectTokens.map((t) =>
    t.suspect === suspect ? { ...t, room } : t
  );

  const pending: PendingSuggestion = {
    suspect,
    weapon,
    room,
    suggesterId: playerId,
    disproveIndex: nextPlayerIndex,
  };

  const logEntry: InterrogationLogEntry = {
    id: `il_${state.interrogationLog.length}`,
    suggesterId: playerId,
    suggesterName: current.displayName,
    suspect,
    weapon,
    room,
    outcome: "pending",
  };

  return {
    state: {
      ...state,
      suspectTokens,
      pendingSuggestion: pending,
      hasSuggested: true,
      phase: "disprove",
      lastAction: `${current.displayName} interrogates: ${suspect}, ${room}, ${weapon}.`,
      interrogationLog: [...state.interrogationLog, logEntry],
    },
  };
}

export function makeSuggestion(
  state: GameState,
  playerId: string,
  suspect: Suspect,
  weapon: Weapon,
  room?: Room
): { state: GameState; error?: string } {
  return makeInterrogation(state, playerId, suspect, weapon, room ?? ROOMS[0]);
}

export function getMatchingCards(hand: Card[], suggestion: PendingSuggestion): Card[] {
  const matches: Card[] = [];
  if (hand.includes(suggestion.suspect)) matches.push(suggestion.suspect);
  if (hand.includes(suggestion.weapon)) matches.push(suggestion.weapon);
  if (hand.includes(suggestion.room)) matches.push(suggestion.room);
  return matches;
}

function finishInterrogationRound(state: GameState, message: string): GameState {
  return advanceToNextPlayer({ ...state, pendingSuggestion: null }, message);
}

export function disproveSuggestion(
  state: GameState,
  playerId: string,
  card: Card
): { state: GameState; error?: string; revealedTo?: string } {
  if (state.phase !== "disprove" || !state.pendingSuggestion) {
    return { state, error: "No pending interrogation" };
  }

  const pending = state.pendingSuggestion;
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return { state, error: "Player not found" };

  const expectedPlayer = state.players[pending.disproveIndex];
  if (expectedPlayer.id !== playerId) {
    return { state, error: "Not your turn to reveal" };
  }

  const matches = getMatchingCards(player.hand, pending);
  if (matches.length === 0) return { state, error: "You have no matching cards" };
  if (!matches.includes(card)) return { state, error: "That card does not match" };

  const suggester = state.players.find((p) => p.id === pending.suggesterId);

  const stateWithLog: GameState = {
    ...state,
    interrogationLog: updateLastLog(state.interrogationLog, {
      outcome: "disproved",
      disprovedByName: player.displayName,
    }),
  };

  return {
    state: finishInterrogationRound(
      stateWithLog,
      `${player.displayName} revealed a card to ${suggester?.displayName ?? "the interrogator"}.`
    ),
    revealedTo: pending.suggesterId,
  };
}

export function passDisprove(
  state: GameState,
  playerId: string
): { state: GameState; error?: string } {
  if (state.phase !== "disprove" || !state.pendingSuggestion) {
    return { state, error: "No pending interrogation" };
  }

  const pending = state.pendingSuggestion;
  const expectedPlayer = state.players[pending.disproveIndex];
  if (expectedPlayer.id !== playerId) {
    return { state, error: "Not your turn to reveal" };
  }

  const matches = getMatchingCards(expectedPlayer.hand, pending);
  if (matches.length > 0) {
    return { state, error: "You must reveal a matching card" };
  }

  let nextIndex = (pending.disproveIndex + 1) % state.players.length;
  while (nextIndex !== state.turnIndex && state.players[nextIndex].isEliminated) {
    nextIndex = (nextIndex + 1) % state.players.length;
  }

  if (nextIndex === state.turnIndex) {
    const stateWithLog: GameState = {
      ...state,
      interrogationLog: updateLastLog(state.interrogationLog, {
        outcome: "unrefuted",
      }),
    };
    return {
      state: finishInterrogationRound(
        stateWithLog,
        "No one could disprove the interrogation."
      ),
    };
  }

  return {
    state: {
      ...state,
      pendingSuggestion: { ...pending, disproveIndex: nextIndex },
      lastAction: `${expectedPlayer.displayName} has no matching cards.`,
    },
  };
}

export function makeAccusation(
  state: GameState,
  playerId: string,
  suspect: Suspect,
  weapon: Weapon,
  room: Room,
  solution: GameSolution
): { state: GameState; error?: string } {
  if (state.phase !== "turn") {
    return { state, error: "Cannot accuse now" };
  }

  const current = getCurrentPlayer(state);
  if (current.id !== playerId) return { state, error: "Not your turn" };
  if (!current.canAccuse) return { state, error: "You cannot accuse" };

  const correct =
    suspect === solution.suspect &&
    weapon === solution.weapon &&
    room === solution.room;

  if (correct) {
    return {
      state: {
        ...state,
        status: "finished",
        winnerId: playerId,
        pendingSuggestion: null,
        lastAction: `${current.displayName} accused correctly and wins!`,
      },
    };
  }

  const players = state.players.map((p) =>
    p.id === playerId ? { ...p, canAccuse: false, isEliminated: true } : p
  );

  const activePlayers = players.filter((p) => !p.isEliminated);
  if (activePlayers.length === 0) {
    return {
      state: {
        ...state,
        players,
        status: "finished",
        winnerId: null,
        pendingSuggestion: null,
        lastAction: `${current.displayName} accused wrongly. No one wins!`,
      },
    };
  }

  return {
    state: advanceToNextPlayer(
      { ...state, players, pendingSuggestion: null },
      `${current.displayName} accused wrongly and is out.`
    ),
  };
}

export function endTurn(state: GameState, playerId: string): { state: GameState; error?: string } {
  if (state.phase !== "turn") {
    return { state, error: "Cannot skip during interrogation" };
  }
  const current = getCurrentPlayer(state);
  if (current.id !== playerId) return { state, error: "Not your turn" };
  return {
    state: advanceToNextPlayer(state, `${current.displayName} passed.`),
  };
}

export function sanitizeStateForPlayer(state: GameState, _playerId: string) {
  return {
    ...state,
    players: state.players.map((p) => {
      const { hand, ...rest } = p;
      return rest;
    }),
  };
}

export function validatePlayerCount(count: number): string | null {
  if (count < MIN_PLAYERS) return `Need at least ${MIN_PLAYERS} players`;
  if (count > MAX_PLAYERS) return `Maximum ${MAX_PLAYERS} players`;
  return null;
}
