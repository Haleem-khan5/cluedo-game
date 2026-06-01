import type { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { prisma } from "@/lib/prisma";
import { generateLobbyCode } from "@/lib/utils";
import { getAllowedSocketOrigins } from "@/lib/config/publicAppUrl";
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  PLAYER_COLORS,
} from "@/lib/game/constants";
import {
  createSolution,
  initializeGame,
  rollDice,
  movePlayer,
  useSecretPassage,
  makeSuggestion,
  disproveSuggestion,
  passDisprove,
  makeAccusation,
  endTurn,
  sanitizeStateForPlayer,
  getMatchingCards,
  type GameState,
  type GameSolution,
} from "@/lib/game/engine";
import type { Position } from "@/lib/game/board";
import type { Room, Suspect, Weapon } from "@/lib/game/constants";

interface LobbyPlayer {
  userId: string;
  displayName: string;
  color: string;
  socketId: string;
  isHost: boolean;
}

interface ActiveLobby {
  id: string;
  code: string;
  hostId: string;
  players: LobbyPlayer[];
}

interface ActiveGame {
  state: GameState;
  solution: GameSolution;
  lobbyId: string;
  playerSocketMap: Map<string, string>;
  revealedCards: Map<string, { card: string; toPlayerId: string }>;
}

const lobbies = new Map<string, ActiveLobby>();
const games = new Map<string, ActiveGame>();
const socketToLobby = new Map<string, string>();
const socketToUser = new Map<string, string>();

function getLobbyRoom(code: string) {
  return `lobby:${code}`;
}

function getGameRoom(sessionId: string) {
  return `game:${sessionId}`;
}

function emitGameState(io: Server, game: ActiveGame) {
  const sessionId = game.state.id;
  const room = getGameRoom(sessionId);

  for (const player of game.state.players) {
    const socketId = game.playerSocketMap.get(player.userId);
    if (!socketId) continue;

    const sanitized = sanitizeStateForPlayer(game.state, player.id);
    const revealed = game.revealedCards.get(player.id);

    io.to(socketId).emit("game:state", {
      ...sanitized,
      hand: player.hand,
      revealedCard: revealed?.toPlayerId === player.id ? revealed.card : undefined,
    });
  }

  io.to(room).emit("game:update", {
    ...sanitizeStateForPlayer(game.state, ""),
    players: game.state.players.map(({ hand, ...rest }) => rest),
  });
}

export function initSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: getAllowedSocketOrigins(),
      methods: ["GET", "POST"],
      credentials: true,
    },
    path: "/api/socket",
  });

  io.on("connection", (socket: Socket) => {
    socket.on("auth:register", ({ userId }: { userId: string }) => {
      socketToUser.set(socket.id, userId);
    });

    socket.on("lobby:create", async ({ userId, displayName }, callback) => {
      try {
        let code = generateLobbyCode();
        while (lobbies.has(code)) code = generateLobbyCode();

        const lobby = await prisma.gameLobby.create({
          data: { code, hostId: userId, status: "waiting" },
        });

        const activeLobby: ActiveLobby = {
          id: lobby.id,
          code,
          hostId: userId,
          players: [
            {
              userId,
              displayName,
              color: PLAYER_COLORS[0].id,
              socketId: socket.id,
              isHost: true,
            },
          ],
        };

        lobbies.set(code, activeLobby);
        socketToLobby.set(socket.id, code);
        socket.join(getLobbyRoom(code));

        callback?.({ success: true, code, lobby: activeLobby });
        io.to(getLobbyRoom(code)).emit("lobby:update", activeLobby);
      } catch (err) {
        callback?.({ success: false, error: "Failed to create lobby" });
      }
    });

    socket.on("lobby:join", async ({ code, userId, displayName }, callback) => {
      try {
        const lobby = lobbies.get(code.toUpperCase());
        if (!lobby) {
          callback?.({ success: false, error: "Lobby not found" });
          return;
        }
        if (lobby.players.length >= MAX_PLAYERS) {
          callback?.({ success: false, error: "Lobby is full" });
          return;
        }
        if (lobby.players.some((p) => p.userId === userId)) {
          const existing = lobby.players.find((p) => p.userId === userId)!;
          existing.socketId = socket.id;
          socketToLobby.set(socket.id, code.toUpperCase());
          socket.join(getLobbyRoom(code.toUpperCase()));
          callback?.({ success: true, lobby });
          io.to(getLobbyRoom(code.toUpperCase())).emit("lobby:update", lobby);
          return;
        }

        const usedColors = new Set(lobby.players.map((p) => p.color));
        const color = PLAYER_COLORS.find((c) => !usedColors.has(c.id))?.id ?? "burgundy";

        lobby.players.push({
          userId,
          displayName,
          color,
          socketId: socket.id,
          isHost: false,
        });

        socketToLobby.set(socket.id, code.toUpperCase());
        socket.join(getLobbyRoom(code.toUpperCase()));

        callback?.({ success: true, lobby });
        io.to(getLobbyRoom(code.toUpperCase())).emit("lobby:update", lobby);
      } catch {
        callback?.({ success: false, error: "Failed to join lobby" });
      }
    });

    socket.on("lobby:start", async ({ code, userId }, callback) => {
      try {
        const lobby = lobbies.get(code.toUpperCase());
        if (!lobby) {
          callback?.({ success: false, error: "Lobby not found" });
          return;
        }
        if (lobby.hostId !== userId) {
          callback?.({ success: false, error: "Only host can start" });
          return;
        }
        if (lobby.players.length < MIN_PLAYERS) {
          callback?.({ success: false, error: `Need at least ${MIN_PLAYERS} players` });
          return;
        }

        const solution = createSolution();
        const session = await prisma.gameSession.create({
          data: {
            lobbyId: lobby.id,
            solution: solution as object,
            boardState: {},
            status: "playing",
          },
        });

        const playerData = lobby.players.map((p, i) => ({
          id: `player_${p.userId}`,
          userId: p.userId,
          displayName: p.displayName,
          color: p.color,
          canAccuse: true,
          isEliminated: false,
          turnOrder: i,
          isConnected: true,
        }));

        const { state } = initializeGame(session.id, lobby.code, playerData, solution);

        for (let i = 0; i < state.players.length; i++) {
          await prisma.player.create({
            data: {
              userId: lobby.players[i].userId,
              sessionId: session.id,
              displayName: lobby.players[i].displayName,
              color: lobby.players[i].color,
              position: state.players[i].position as object,
              hand: state.players[i].hand as object,
              turnOrder: i,
              socketId: lobby.players[i].socketId,
            },
          });
        }

        await prisma.gameLobby.update({
          where: { id: lobby.id },
          data: { status: "playing" },
        });

        const playerSocketMap = new Map<string, string>();
        lobby.players.forEach((p) => playerSocketMap.set(p.userId, p.socketId));

        const game: ActiveGame = {
          state,
          solution,
          lobbyId: lobby.id,
          playerSocketMap,
          revealedCards: new Map(),
        };

        games.set(session.id, game);

        for (const p of lobby.players) {
          const s = io.sockets.sockets.get(p.socketId);
          s?.join(getGameRoom(session.id));
        }

        emitGameState(io, game);
        callback?.({ success: true, sessionId: session.id });
        lobbies.delete(code.toUpperCase());
      } catch (err) {
        console.error("Start game error:", err);
        callback?.({ success: false, error: "Failed to start game" });
      }
    });

    socket.on("game:reconnect", ({ sessionId, userId }, callback) => {
      const game = games.get(sessionId);
      if (!game) {
        callback?.({ success: false, error: "Game not found" });
        return;
      }

      game.playerSocketMap.set(userId, socket.id);
      game.state.players = game.state.players.map((p) =>
        p.userId === userId ? { ...p, isConnected: true } : p
      );

      socket.join(getGameRoom(sessionId));
      emitGameState(io, game);
      callback?.({ success: true, state: sanitizeStateForPlayer(game.state, "") });
    });

    socket.on("game:roll", ({ sessionId, userId }, callback) => {
      const game = games.get(sessionId);
      if (!game) return callback?.({ success: false, error: "Game not found" });

      const player = game.state.players.find((p) => p.userId === userId);
      if (!player) return callback?.({ success: false, error: "Player not found" });

      const result = rollDice(game.state);
      if (result.error) return callback?.({ success: false, error: result.error });

      game.state = result.state;
      emitGameState(io, game);
      callback?.({ success: true, roll: result.state.diceRoll });
    });

    socket.on("game:move", ({ sessionId, userId, target }, callback) => {
      const game = games.get(sessionId);
      if (!game) return callback?.({ success: false, error: "Game not found" });

      const player = game.state.players.find((p) => p.userId === userId);
      if (!player) return callback?.({ success: false, error: "Player not found" });

      const result = movePlayer(game.state, player.id, target as Position);
      if (result.error) return callback?.({ success: false, error: result.error });

      game.state = result.state;
      emitGameState(io, game);
      callback?.({ success: true });
    });

    socket.on("game:secretPassage", ({ sessionId, userId, room }, callback) => {
      const game = games.get(sessionId);
      if (!game) return callback?.({ success: false, error: "Game not found" });

      const player = game.state.players.find((p) => p.userId === userId);
      if (!player) return callback?.({ success: false, error: "Player not found" });

      const result = useSecretPassage(game.state, player.id, room as Room);
      if (result.error) return callback?.({ success: false, error: result.error });

      game.state = result.state;
      emitGameState(io, game);
      callback?.({ success: true });
    });

    socket.on(
      "game:suggest",
      ({ sessionId, userId, suspect, weapon }, callback) => {
        const game = games.get(sessionId);
        if (!game) return callback?.({ success: false, error: "Game not found" });

        const player = game.state.players.find((p) => p.userId === userId);
        if (!player) return callback?.({ success: false, error: "Player not found" });

        const result = makeSuggestion(
          game.state,
          player.id,
          suspect as Suspect,
          weapon as Weapon
        );
        if (result.error) return callback?.({ success: false, error: result.error });

        game.state = result.state;
        emitGameState(io, game);

        const pending = game.state.pendingSuggestion!;
        const nextPlayer = game.state.players[pending.disproveIndex];
        const matches = getMatchingCards(nextPlayer.hand, pending);
        const socketId = game.playerSocketMap.get(nextPlayer.userId);
        if (socketId && matches.length > 0) {
          io.to(socketId).emit("game:disprovePrompt", {
            suggestion: pending,
            matchingCards: matches,
          });
        }

        callback?.({ success: true });
      }
    );

    socket.on("game:disprove", ({ sessionId, userId, card }, callback) => {
      const game = games.get(sessionId);
      if (!game) return callback?.({ success: false, error: "Game not found" });

      const player = game.state.players.find((p) => p.userId === userId);
      if (!player) return callback?.({ success: false, error: "Player not found" });

      const result = disproveSuggestion(game.state, player.id, card);
      if (result.error) return callback?.({ success: false, error: result.error });

      game.state = result.state;
      if (result.revealedTo) {
        const suggester = game.state.players.find((p) => p.id === result.revealedTo);
        if (suggester) {
          game.revealedCards.set(suggester.id, { card, toPlayerId: suggester.id });
        }
      }
      emitGameState(io, game);
      callback?.({ success: true });
    });

    socket.on("game:passDisprove", ({ sessionId, userId }, callback) => {
      const game = games.get(sessionId);
      if (!game) return callback?.({ success: false, error: "Game not found" });

      const player = game.state.players.find((p) => p.userId === userId);
      if (!player) return callback?.({ success: false, error: "Player not found" });

      const result = passDisprove(game.state, player.id);
      if (result.error) return callback?.({ success: false, error: result.error });

      game.state = result.state;
      emitGameState(io, game);

      const pending = game.state.pendingSuggestion;
      if (pending) {
        const nextPlayer = game.state.players[pending.disproveIndex];
        const matches = getMatchingCards(nextPlayer.hand, pending);
        const socketId = game.playerSocketMap.get(nextPlayer.userId);
        if (socketId && matches.length > 0) {
          io.to(socketId).emit("game:disprovePrompt", {
            suggestion: pending,
            matchingCards: matches,
          });
        }
      }

      callback?.({ success: true });
    });

    socket.on(
      "game:accuse",
      ({ sessionId, userId, suspect, weapon, room }, callback) => {
        const game = games.get(sessionId);
        if (!game) return callback?.({ success: false, error: "Game not found" });

        const player = game.state.players.find((p) => p.userId === userId);
        if (!player) return callback?.({ success: false, error: "Player not found" });

        const result = makeAccusation(
          game.state,
          player.id,
          suspect as Suspect,
          weapon as Weapon,
          room as Room,
          game.solution
        );
        if (result.error) return callback?.({ success: false, error: result.error });

        game.state = result.state;
        emitGameState(io, game);

        if (game.state.status === "finished") {
          io.to(getGameRoom(sessionId)).emit("game:finished", {
            winnerId: game.state.winnerId,
            solution: game.solution,
          });
        }

        callback?.({ success: true });
      }
    );

    socket.on("game:endTurn", ({ sessionId, userId }, callback) => {
      const game = games.get(sessionId);
      if (!game) return callback?.({ success: false, error: "Game not found" });

      const player = game.state.players.find((p) => p.userId === userId);
      if (!player) return callback?.({ success: false, error: "Player not found" });

      const result = endTurn(game.state, player.id);
      if (result.error) return callback?.({ success: false, error: result.error });

      game.state = result.state;
      game.revealedCards.clear();
      emitGameState(io, game);
      callback?.({ success: true });
    });

    socket.on("disconnect", () => {
      const lobbyCode = socketToLobby.get(socket.id);
      if (lobbyCode) {
        const lobby = lobbies.get(lobbyCode);
        if (lobby) {
          const player = lobby.players.find((p) => p.socketId === socket.id);
          if (player && player.isHost && lobby.players.length > 1) {
            const newHost = lobby.players.find((p) => p.userId !== player.userId);
            if (newHost) {
              lobby.hostId = newHost.userId;
              newHost.isHost = true;
            }
          }
          lobby.players = lobby.players.filter((p) => p.socketId !== socket.id);
          if (lobby.players.length === 0) {
            lobbies.delete(lobbyCode);
          } else {
            io.to(getLobbyRoom(lobbyCode)).emit("lobby:update", lobby);
          }
        }
        socketToLobby.delete(socket.id);
      }

      const userId = socketToUser.get(socket.id);
      if (userId) {
        for (const [, game] of games) {
          const player = game.state.players.find((p) => p.userId === userId);
          if (player && game.playerSocketMap.get(userId) === socket.id) {
            game.state.players = game.state.players.map((p) =>
              p.userId === userId ? { ...p, isConnected: false } : p
            );
            emitGameState(io, game);
          }
        }
      }

      socketToUser.delete(socket.id);
    });
  });

  return io;
}

export { lobbies, games };
