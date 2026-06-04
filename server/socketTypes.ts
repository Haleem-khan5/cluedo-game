import type { GameState, GameSolution } from "@/lib/game/engine";
import type { BotBrain } from "@/lib/game/botAI";

export interface LobbyPlayer {
  userId: string;
  displayName: string;
  color: string;
  socketId: string;
  isHost: boolean;
  isBot?: boolean;
}

export interface ActiveLobby {
  id: string;
  code: string;
  hostId: string;
  players: LobbyPlayer[];
}

export interface ActiveGame {
  state: GameState;
  solution: GameSolution;
  lobbyId: string;
  playerSocketMap: Map<string, string>;
  revealedCards: Map<string, { card: string; toPlayerId: string; fromPlayerId: string }>;
  botUserIds: Set<string>;
  botBrains: Map<string, BotBrain>;
}
