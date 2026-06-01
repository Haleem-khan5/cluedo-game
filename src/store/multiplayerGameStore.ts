"use client";

import { create } from "zustand";
import type { Card } from "@/lib/game/constants";
import type {
  DetectiveNotesSheet,
  DetectiveNoteMark,
  LiveGameClientState,
  PendingDisproveRequest,
  RevealedMurderSolution,
  WaitingLobbySnapshot,
} from "@/types/multiplayer.types";

/**
 * Global client store for multiplayer lobby + live game UI state.
 * Server-authoritative game rules live in `src/lib/game/engine.ts`.
 */
interface MultiplayerGameStore {
  /** Active game session id from the database (null when in lobby only). */
  activeGameSessionId: string | null;
  /** Latest game board snapshot including this player's private hand. */
  liveGameState: LiveGameClientState | null;
  /** Waiting-room state before the host starts the match. */
  waitingLobbySnapshot: WaitingLobbySnapshot | null;
  /** Shown when this player must disprove another detective's suggestion. */
  pendingDisproveRequest: PendingDisproveRequest | null;
  /** Murder solution revealed on game over. */
  revealedMurderSolution: RevealedMurderSolution | null;
  /** Whether UI sound effects are enabled. */
  isSoundEffectsEnabled: boolean;
  /** Local detective notes — never synced to server. */
  detectiveNotesSheet: DetectiveNotesSheet;

  setActiveGameSessionId: (sessionId: string | null) => void;
  setLiveGameState: (state: LiveGameClientState | null) => void;
  setWaitingLobbySnapshot: (snapshot: WaitingLobbySnapshot | null) => void;
  setPendingDisproveRequest: (request: PendingDisproveRequest | null) => void;
  setRevealedMurderSolution: (solution: RevealedMurderSolution | null) => void;
  toggleSoundEffects: () => void;
  updateDetectiveNote: (cardName: string, mark: DetectiveNoteMark) => void;
  resetMultiplayerState: () => void;
}

const initialStoreState = {
  activeGameSessionId: null,
  liveGameState: null,
  waitingLobbySnapshot: null,
  pendingDisproveRequest: null,
  revealedMurderSolution: null,
  isSoundEffectsEnabled: true,
  detectiveNotesSheet: {} as DetectiveNotesSheet,
};

export const useMultiplayerGameStore = create<MultiplayerGameStore>((set) => ({
  ...initialStoreState,

  setActiveGameSessionId: (sessionId) => set({ activeGameSessionId: sessionId }),
  setLiveGameState: (state) => set({ liveGameState: state }),
  setWaitingLobbySnapshot: (snapshot) => set({ waitingLobbySnapshot: snapshot }),
  setPendingDisproveRequest: (request) => set({ pendingDisproveRequest: request }),
  setRevealedMurderSolution: (solution) => set({ revealedMurderSolution: solution }),
  toggleSoundEffects: () => set((s) => ({ isSoundEffectsEnabled: !s.isSoundEffectsEnabled })),
  updateDetectiveNote: (cardName, mark) =>
    set((s) => ({
      detectiveNotesSheet: { ...s.detectiveNotesSheet, [cardName]: mark },
    })),
  resetMultiplayerState: () => set({ ...initialStoreState }),
}));

/** @deprecated Use useMultiplayerGameStore — kept for gradual migration. */
export const useGameStore = useMultiplayerGameStore;
