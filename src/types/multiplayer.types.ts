/**
 * Shared multiplayer types for Mystery Mansion.
 * Each interface describes one slice of real-time lobby or in-game state.
 */

import type { Card } from "@/lib/game/constants";
import type { GameState } from "@/lib/game/engine";

/** A detective waiting in a lobby before the match starts. */
export interface WaitingLobbyPlayer {
  /** Authenticated user id (guest or registered). */
  userId: string;
  /** Name shown on the board and in chat. */
  displayName: string;
  /** Token color assigned in the mansion (burgundy, gold, etc.). */
  tokenColorId: string;
  /** True when this player created the lobby. */
  isHost: boolean;
  /** AI detective — plays automatically. */
  isBot?: boolean;
}

/** Full lobby snapshot broadcast over Socket.IO (`lobby:update`). */
export interface WaitingLobbySnapshot {
  /** Database lobby row id. */
  lobbyId: string;
  /** Six-character code friends use to join (e.g. ABC123). */
  lobbyInviteCode: string;
  /** userId of the host who can start the game. */
  hostUserId: string;
  /** Detectives currently in the waiting room. */
  waitingPlayers: WaitingLobbyPlayer[];
}

/** Cards another player must pick from when disproving a suggestion. */
export interface PendingDisproveRequest {
  suggestion: {
    suspectName: string;
    weaponName: string;
    roomName: string;
  };
  /** Matching cards in the disproving player's private hand. */
  matchingCardsInHand: Card[];
}

/** Murder solution revealed when the game ends. */
export interface RevealedMurderSolution {
  suspectName: string;
  weaponName: string;
  roomName: string;
}

/** Client view of live game state including private hand data. */
export type LiveGameClientState = GameState & {
  /** This player's private clue cards — never sent to other clients. */
  privateHandCards?: Card[];
  /** Card privately shown after someone disproved your suggestion. */
  privatelyRevealedCard?: Card;
};

/** Deduction mark on the detective notes sheet. */
export type DetectiveNoteMark = "unknown" | "maybe" | "ruled-out" | "confirmed";

/** Per-player grid cell mark — cycles on click. */
export type GridCellMark = "empty" | "yes" | "no" | "maybe" | "has";

/** Key: `${playerUserId}::${cardName}` */
export type PlayerGridMarks = Record<string, GridCellMark>;

/** Maps card name → note mark (empty = unknown). */
export type DetectiveNotesSheet = Record<string, DetectiveNoteMark>;

/** Socket callback shape for lobby create/join/start actions. */
export interface SocketActionResult {
  success: boolean;
  error?: string;
}

/** Legacy lobby shape used by the server — mapped to WaitingLobbySnapshot on client. */
export interface ServerLobbyPayload {
  id: string;
  code: string;
  hostId: string;
  players: {
    userId: string;
    displayName: string;
    color: string;
    isHost: boolean;
    isBot?: boolean;
  }[];
}

/** Converts server lobby payload to client-friendly snapshot. */
export function mapServerLobbyToSnapshot(payload: ServerLobbyPayload): WaitingLobbySnapshot {
  return {
    lobbyId: payload.id,
    lobbyInviteCode: payload.code,
    hostUserId: payload.hostId,
    waitingPlayers: payload.players.map((player) => ({
      userId: player.userId,
      displayName: player.displayName,
      tokenColorId: player.color,
      isHost: player.isHost,
      isBot: player.isBot,
    })),
  };
}

/** Converts client snapshot back to server shape for socket emits. */
export function mapSnapshotToServerLobby(snapshot: WaitingLobbySnapshot): ServerLobbyPayload {
  return {
    id: snapshot.lobbyId,
    code: snapshot.lobbyInviteCode,
    hostId: snapshot.hostUserId,
    players: snapshot.waitingPlayers.map((player) => ({
      userId: player.userId,
      displayName: player.displayName,
      color: player.tokenColorId,
      isHost: player.isHost,
      isBot: player.isBot,
    })),
  };
}
