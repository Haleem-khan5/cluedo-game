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
import {
  enterRoom,
  getRoomAt,
  getValidMoves,
  hasSecretPassage,
  type Position,
} from "./board";

export type TurnPhase = "roll" | "move" | "suggest" | "disprove" | "accuse" | "end";

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
  position: Position;
  currentRoom: Room | null;
  hand: Card[];
  canAccuse: boolean;
  isEliminated: boolean;
  turnOrder: number;
  isConnected: boolean;
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
}

export interface PrivateGameView {
  hand: Card[];
  solution?: GameSolution;
  revealedCard?: Card;
  disprovePrompt?: {
    suggestion: PendingSuggestion;
    matchingCards: Card[];
  };
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

export function dealCards(
  solution: GameSolution,
  playerCount: number
): Card[][] {
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

  const state: GameState = {
    id: sessionId,
    lobbyCode,
    status: "playing",
    phase: "roll",
    turnIndex: 0,
    diceRoll: null,
    hasMoved: false,
    hasSuggested: false,
    players: playerStates,
    suspectTokens,
    pendingSuggestion: null,
    winnerId: null,
    lastAction: "Game started! Roll the dice.",
    movedViaSecretPassage: false,
  };

  return { state, solution };
}

export function getCurrentPlayer(state: GameState): PlayerState {
  return state.players[state.turnIndex];
}

export function rollDice(state: GameState): { state: GameState; error?: string } {
  if (state.phase !== "roll") return { state, error: "Not roll phase" };
  if (state.status === "finished") return { state, error: "Game is finished" };

  const roll = Math.floor(Math.random() * 6) + 1;
  return {
    state: {
      ...state,
      diceRoll: roll,
      phase: "move",
      hasMoved: false,
      hasSuggested: false,
      movedViaSecretPassage: false,
      lastAction: `${getCurrentPlayer(state).displayName} rolled a ${roll}.`,
    },
  };
}

export function movePlayer(
  state: GameState,
  playerId: string,
  target: Position
): { state: GameState; error?: string } {
  if (state.phase !== "move") return { state, error: "Not move phase" };

  const current = getCurrentPlayer(state);
  if (current.id !== playerId) return { state, error: "Not your turn" };
  if (state.hasMoved) return { state, error: "Already moved this turn" };
  if (state.diceRoll === null) return { state, error: "Roll dice first" };

  const occupied = state.players
    .filter((p) => !p.isEliminated)
    .map((p) => p.position);

  const valid = getValidMoves(current.position, state.diceRoll, occupied);
  const isValid = valid.some((v) => v.x === target.x && v.y === target.y);

  if (!isValid) return { state, error: "Invalid move" };

  const roomAtTarget = getRoomAt(target.x, target.y);
  let newRoom: Room | null = current.currentRoom;
  let newPosition = target;

  if (roomAtTarget) {
    const entry = enterRoom(current.position, roomAtTarget);
    if (entry) {
      newPosition = entry;
      newRoom = roomAtTarget;
    }
  } else {
    newRoom = null;
  }

  const players = state.players.map((p) =>
    p.id === playerId
      ? { ...p, position: newPosition, currentRoom: newRoom }
      : p
  );

  const nextPhase: TurnPhase = newRoom ? "suggest" : "accuse";

  return {
    state: {
      ...state,
      players,
      hasMoved: true,
      phase: nextPhase,
      lastAction: `${current.displayName} moved to ${newRoom ?? `(${target.x}, ${target.y})`}.`,
    },
  };
}

export function useSecretPassage(
  state: GameState,
  playerId: string,
  targetRoom: Room
): { state: GameState; error?: string } {
  if (state.phase !== "move") return { state, error: "Not move phase" };

  const current = getCurrentPlayer(state);
  if (current.id !== playerId) return { state, error: "Not your turn" };
  if (state.hasMoved) return { state, error: "Already moved" };
  if (!current.currentRoom) return { state, error: "Must be in a room" };
  if (!hasSecretPassage(current.currentRoom, targetRoom)) {
    return { state, error: "No secret passage to that room" };
  }

  const entry = enterRoom(current.position, targetRoom);
  if (!entry) return { state, error: "Cannot enter room" };

  const players = state.players.map((p) =>
    p.id === playerId
      ? { ...p, position: entry, currentRoom: targetRoom }
      : p
  );

  return {
    state: {
      ...state,
      players,
      hasMoved: true,
      movedViaSecretPassage: true,
      phase: "suggest",
      lastAction: `${current.displayName} used a secret passage to ${targetRoom}!`,
    },
  };
}

export function makeSuggestion(
  state: GameState,
  playerId: string,
  suspect: Suspect,
  weapon: Weapon
): { state: GameState; error?: string } {
  if (state.phase !== "suggest") return { state, error: "Cannot suggest now" };

  const current = getCurrentPlayer(state);
  if (current.id !== playerId) return { state, error: "Not your turn" };
  if (!current.currentRoom) return { state, error: "Must be in a room" };
  if (state.hasSuggested) return { state, error: "Already suggested this turn" };

  const room = current.currentRoom;
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

  return {
    state: {
      ...state,
      suspectTokens,
      pendingSuggestion: pending,
      hasSuggested: true,
      phase: "disprove",
      lastAction: `${current.displayName} suggests ${suspect} with ${weapon} in ${room}.`,
    },
  };
}

export function getMatchingCards(hand: Card[], suggestion: PendingSuggestion): Card[] {
  const matches: Card[] = [];
  if (hand.includes(suggestion.suspect)) matches.push(suggestion.suspect);
  if (hand.includes(suggestion.weapon)) matches.push(suggestion.weapon);
  if (hand.includes(suggestion.room)) matches.push(suggestion.room);
  return matches;
}

export function disproveSuggestion(
  state: GameState,
  playerId: string,
  card: Card
): { state: GameState; error?: string; revealedTo?: string } {
  if (state.phase !== "disprove" || !state.pendingSuggestion) {
    return { state, error: "No pending suggestion" };
  }

  const pending = state.pendingSuggestion;
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return { state, error: "Player not found" };

  const expectedIndex = pending.disproveIndex;
  const expectedPlayer = state.players[expectedIndex];
  if (expectedPlayer.id !== playerId) {
    return { state, error: "Not your turn to disprove" };
  }

  const matches = getMatchingCards(player.hand, pending);
  if (matches.length === 0) return { state, error: "You have no matching cards" };
  if (!matches.includes(card)) return { state, error: "That card does not match" };

  return {
    state: {
      ...state,
      pendingSuggestion: null,
      phase: "accuse",
      lastAction: `${player.displayName} disproved the suggestion.`,
    },
    revealedTo: pending.suggesterId,
  };
}

export function passDisprove(
  state: GameState,
  playerId: string
): { state: GameState; error?: string } {
  if (state.phase !== "disprove" || !state.pendingSuggestion) {
    return { state, error: "No pending suggestion" };
  }

  const pending = state.pendingSuggestion;
  const expectedPlayer = state.players[pending.disproveIndex];
  if (expectedPlayer.id !== playerId) {
    return { state, error: "Not your turn to disprove" };
  }

  const matches = getMatchingCards(expectedPlayer.hand, pending);
  if (matches.length > 0) {
    return { state, error: "You must show a matching card" };
  }

  let nextIndex = (pending.disproveIndex + 1) % state.players.length;
  while (
    nextIndex !== state.turnIndex &&
    state.players[nextIndex].isEliminated
  ) {
    nextIndex = (nextIndex + 1) % state.players.length;
  }

  if (nextIndex === state.turnIndex) {
    return {
      state: {
        ...state,
        pendingSuggestion: null,
        phase: "accuse",
        lastAction: "No one could disprove the suggestion.",
      },
    };
  }

  return {
    state: {
      ...state,
      pendingSuggestion: { ...pending, disproveIndex: nextIndex },
      lastAction: `${expectedPlayer.displayName} could not disprove.`,
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
  if (state.phase !== "accuse" && state.phase !== "suggest") {
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
        phase: "end",
        pendingSuggestion: null,
        lastAction: `${current.displayName} made a correct accusation and wins!`,
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
        phase: "end",
        pendingSuggestion: null,
        lastAction: `${current.displayName} made a wrong accusation. No one wins!`,
      },
    };
  }

  return {
    state: {
      ...state,
      players,
      pendingSuggestion: null,
      phase: "end",
      lastAction: `${current.displayName} made a wrong accusation and is eliminated.`,
    },
  };
}

export function endTurn(state: GameState, playerId: string): { state: GameState; error?: string } {
  const current = getCurrentPlayer(state);
  if (current.id !== playerId) return { state, error: "Not your turn" };

  if (state.phase === "disprove") {
    return { state, error: "Must resolve suggestion first" };
  }

  if (state.phase === "move" && !state.hasMoved) {
    return { state, error: "Must move or use secret passage first" };
  }

  let nextIndex = (state.turnIndex + 1) % state.players.length;
  let attempts = 0;
  while (state.players[nextIndex].isEliminated && attempts < state.players.length) {
    nextIndex = (nextIndex + 1) % state.players.length;
    attempts++;
  }

  return {
    state: {
      ...state,
      turnIndex: nextIndex,
      phase: "roll",
      diceRoll: null,
      hasMoved: false,
      hasSuggested: false,
      movedViaSecretPassage: false,
      lastAction: `${state.players[nextIndex].displayName}'s turn.`,
    },
  };
}

export function sanitizeStateForPlayer(state: GameState, playerId: string): Omit<GameState, "players"> & {
  players: Omit<PlayerState, "hand">[];
} {
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
