"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  KeyRound,
  PlusCircle,
  Users,
  Crown,
  Play,
  ArrowLeft,
  Loader2,
  BookOpen,
  Bot,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GuestQuickPlayCard } from "@/components/auth/GuestQuickPlayCard";
import { LobbyInviteSharePanel } from "@/components/lobby/LobbyInviteSharePanel";
import { useSocket } from "@/hooks/useSocket";
import { useMultiplayerGameStore } from "@/store/multiplayerGameStore";
import {
  mapServerLobbyToSnapshot,
  type ServerLobbyPayload,
} from "@/types/multiplayer.types";
import { MIN_PLAYERS, MAX_PLAYERS, PLAYER_COLORS } from "@/lib/game/constants";

export default function GameLobbyPage() {
  const { data: authSession, status: authStatus } = useSession();
  const router = useRouter();
  const authenticatedUserId = authSession?.user?.id;

  const { emit, on } = useSocket(authenticatedUserId);
  const {
    waitingLobbySnapshot,
    setWaitingLobbySnapshot,
    setActiveGameSessionId,
  } = useMultiplayerGameStore();

  const [manualJoinCodeInput, setManualJoinCodeInput] = useState("");
  const [isLobbyActionLoading, setIsLobbyActionLoading] = useState(false);
  const [lobbyErrorMessage, setLobbyErrorMessage] = useState("");

  useEffect(() => {
    const unsubscribe = on("lobby:update", (payload) => {
      setWaitingLobbySnapshot(mapServerLobbyToSnapshot(payload as ServerLobbyPayload));
    });
    return unsubscribe;
  }, [on, setWaitingLobbySnapshot]);

  useEffect(() => {
    const unsubscribe = on("game:state", (payload) => {
      const gameState = payload as { id: string };
      setActiveGameSessionId(gameState.id);
      router.push(`/game/${gameState.id}`);
    });
    return unsubscribe;
  }, [on, setActiveGameSessionId, router]);

  const createNewLobby = async () => {
    if (!authenticatedUserId) return;
    setIsLobbyActionLoading(true);
    setLobbyErrorMessage("");

    const result = await emit<{ success: boolean; error?: string }>("lobby:create", {
      userId: authenticatedUserId,
      displayName: authSession?.user?.name ?? "Detective",
    });

    setIsLobbyActionLoading(false);
    if (!result.success) setLobbyErrorMessage(result.error ?? "Failed to create lobby");
  };

  const joinLobbyByCode = async () => {
    if (!authenticatedUserId || manualJoinCodeInput.trim().length < 6) return;
    setIsLobbyActionLoading(true);
    setLobbyErrorMessage("");

    const result = await emit<{ success: boolean; error?: string }>("lobby:join", {
      code: manualJoinCodeInput.trim().toUpperCase(),
      userId: authenticatedUserId,
      displayName: authSession?.user?.name ?? "Detective",
    });

    setIsLobbyActionLoading(false);
    if (!result.success) setLobbyErrorMessage(result.error ?? "Lobby not found");
  };

  const addBotToLobby = async () => {
    if (!authenticatedUserId || !waitingLobbySnapshot) return;
    setIsLobbyActionLoading(true);
    setLobbyErrorMessage("");

    const result = await emit<{ success: boolean; error?: string }>("lobby:addBot", {
      code: waitingLobbySnapshot.lobbyInviteCode,
      userId: authenticatedUserId,
    });

    setIsLobbyActionLoading(false);
    if (!result.success) setLobbyErrorMessage(result.error ?? "Failed to add bot");
  };

  const removeBotFromLobby = async (botUserId: string) => {
    if (!authenticatedUserId || !waitingLobbySnapshot) return;
    setIsLobbyActionLoading(true);
    setLobbyErrorMessage("");

    const result = await emit<{ success: boolean; error?: string }>("lobby:removeBot", {
      code: waitingLobbySnapshot.lobbyInviteCode,
      userId: authenticatedUserId,
      botUserId,
    });

    setIsLobbyActionLoading(false);
    if (!result.success) setLobbyErrorMessage(result.error ?? "Failed to remove bot");
  };

  const startGameAsHost = async () => {
    if (!authenticatedUserId || !waitingLobbySnapshot) return;
    setIsLobbyActionLoading(true);
    setLobbyErrorMessage("");

    const result = await emit<{ success: boolean; error?: string; sessionId?: string }>(
      "lobby:start",
      {
        code: waitingLobbySnapshot.lobbyInviteCode,
        userId: authenticatedUserId,
      }
    );

    setIsLobbyActionLoading(false);
    if (!result.success) {
      setLobbyErrorMessage(result.error ?? "Failed to start game");
    } else if (result.sessionId) {
      setActiveGameSessionId(result.sessionId);
      router.push(`/game/${result.sessionId}`);
    }
  };

  if (authStatus === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
        <p className="text-cream/50 text-sm">Loading…</p>
      </div>
    );
  }

  if (authStatus === "unauthenticated") {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-1 text-cream/40 hover:text-cream/60 text-sm mb-8">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <h1 className="font-serif text-3xl text-cream text-center mb-2">Lobby</h1>
        <p className="text-cream/50 text-sm text-center mb-8">Sign in or play as guest</p>
        <GuestQuickPlayCard />
        <p className="text-center mt-5 text-sm text-cream/45">
          <Link href="/auth/login" className="text-gold hover:underline">Sign in</Link>
          {" · "}
          <Link href="/auth/signup" className="text-gold hover:underline">Sign up</Link>
        </p>
      </div>
    );
  }

  if (waitingLobbySnapshot) {
    const isCurrentUserHost = waitingLobbySnapshot.hostUserId === authenticatedUserId;
    const playerCount = waitingLobbySnapshot.waitingPlayers.length;
    const hasMinimumPlayers = playerCount >= MIN_PLAYERS;

    return (
      <div className="max-w-xl mx-auto px-4 py-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl bg-mansion-card border border-cream/10 p-6 sm:p-8 shadow-2xl space-y-6"
        >
          <div className="text-center">
            <h1 className="font-serif text-2xl text-cream">Waiting Room</h1>
            <p className="text-cream/50 text-sm mt-1">
              {playerCount}/{MAX_PLAYERS} players · need {MIN_PLAYERS} to start
            </p>
          </div>

          <LobbyInviteSharePanel lobbyInviteCode={waitingLobbySnapshot.lobbyInviteCode} />

          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs uppercase tracking-wider text-cream/40">Players</h2>
              {isCurrentUserHost && playerCount < MAX_PLAYERS && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addBotToLobby}
                  loading={isLobbyActionLoading}
                >
                  <Bot className="w-4 h-4" /> Add Bot
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {waitingLobbySnapshot.waitingPlayers.map((player) => (
                <div
                  key={player.userId}
                  className="flex items-center gap-3 p-3 rounded-xl bg-mansion-dark/60 border border-cream/5"
                >
                  <div
                    className="w-8 h-8 rounded-full border-2 border-white/25 flex items-center justify-center text-xs font-bold text-white"
                    style={{
                      backgroundColor:
                        PLAYER_COLORS.find((c) => c.id === player.tokenColorId)?.hex ?? "#888",
                    }}
                  >
                    {player.isBot ? <Bot className="w-4 h-4" /> : player.displayName[0]}
                  </div>
                  <span className="text-cream text-sm font-medium">{player.displayName}</span>
                  {player.isBot && (
                    <span className="text-xs bg-gold/15 text-gold px-2 py-0.5 rounded-full">
                      Bot
                    </span>
                  )}
                  {player.userId === authenticatedUserId && (
                    <span className="text-xs text-cream/40">you</span>
                  )}
                  {player.isHost && (
                    <span className="ml-auto text-xs bg-gold/20 text-gold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Crown className="w-3 h-3" /> Host
                    </span>
                  )}
                  {isCurrentUserHost && player.isBot && (
                    <button
                      type="button"
                      onClick={() => removeBotFromLobby(player.userId)}
                      className="ml-auto p-1 rounded-lg hover:bg-red-500/20 text-cream/40 hover:text-red-300"
                      aria-label={`Remove ${player.displayName}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {lobbyErrorMessage && (
            <div className="p-3 rounded-xl bg-red-900/30 border border-red-500/30 text-red-300 text-sm">
              {lobbyErrorMessage}
            </div>
          )}

          {isCurrentUserHost ? (
            <Button
              variant="gold"
              className="w-full"
              onClick={startGameAsHost}
              loading={isLobbyActionLoading}
              disabled={!hasMinimumPlayers}
            >
              <Play className="w-5 h-5" />
              {hasMinimumPlayers
                ? "Start Game"
                : `Need ${MIN_PLAYERS - playerCount} more player${MIN_PLAYERS - playerCount === 1 ? "" : "s"}`}
            </Button>
          ) : (
            <p className="text-center text-cream/50 text-sm flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Waiting for host…
            </p>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl text-cream">Lobby</h1>
          <p className="text-cream/50 text-sm mt-1">Create a game or join with a code</p>
          {authSession?.user?.isGuest && (
            <span className="inline-block mt-3 text-xs bg-gold/15 text-gold px-3 py-1 rounded-full">
              Guest · {authSession.user.name}
            </span>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-mansion-card border border-cream/10 p-5 shadow-xl">
            <PlusCircle className="w-8 h-8 text-gold mb-3" />
            <h2 className="font-serif text-lg text-cream">Create</h2>
            <p className="text-cream/45 text-xs mt-1 mb-4">{MIN_PLAYERS}–{MAX_PLAYERS} players</p>
            <Button variant="gold" className="w-full" onClick={createNewLobby} loading={isLobbyActionLoading}>
              New Game
            </Button>
          </div>

          <div className="rounded-2xl bg-mansion-card border border-cream/10 p-5 shadow-xl">
            <KeyRound className="w-8 h-8 text-gold mb-3" />
            <h2 className="font-serif text-lg text-cream">Join</h2>
            <Input
              value={manualJoinCodeInput}
              onChange={(e) => setManualJoinCodeInput(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              className="mt-3 mb-3 text-center text-xl tracking-[0.25em] font-mono"
              aria-label="Lobby code"
            />
            <Button
              variant="secondary"
              className="w-full"
              onClick={joinLobbyByCode}
              loading={isLobbyActionLoading}
              disabled={manualJoinCodeInput.length < 6}
            >
              Join
            </Button>
          </div>
        </div>

        {lobbyErrorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-red-900/30 border border-red-500/30 text-red-300 text-sm text-center">
            {lobbyErrorMessage}
          </div>
        )}

        <p className="text-center mt-6">
          <Link href="/guide" className="text-sm text-gold/70 hover:text-gold inline-flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" /> How to play
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
