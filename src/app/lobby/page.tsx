"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  KeyRound,
  PlusCircle,
  Plus,
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
import { LobbySidePanel } from "@/components/lobby/LobbySidePanel";
import { useSocket } from "@/hooks/useSocket";
import { useMultiplayerGameStore } from "@/store/multiplayerGameStore";
import {
  mapServerLobbyToSnapshot,
  type ServerLobbyPayload,
} from "@/types/multiplayer.types";
import { MIN_PLAYERS, MAX_PLAYERS, PLAYER_COLORS } from "@/lib/game/constants";
import { cn } from "@/lib/utils";

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
    const players = waitingLobbySnapshot.waitingPlayers;
    const playerCount = players.length;
    const hasMinimumPlayers = playerCount >= MIN_PLAYERS;
    const canAddMore = playerCount < MAX_PLAYERS;
    const slots = Array.from({ length: MAX_PLAYERS }, (_, i) => players[i] ?? null);

    return (
      <div className="min-h-[calc(100vh-57px)] grid lg:grid-cols-2">
        <LobbySidePanel />
        <div className="flex items-center justify-center px-4 py-8 lg:border-l lg:border-cream/5">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md rounded-2xl bg-mansion-card border border-cream/10 p-5 sm:p-6 shadow-2xl space-y-5"
        >
          {/* Header with live capacity meter */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-serif text-2xl text-cream flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Waiting Room
              </h1>
              <p className="text-cream/50 text-sm mt-0.5">
                {hasMinimumPlayers
                  ? `Ready when you are — up to ${MAX_PLAYERS} players`
                  : `Add ${MIN_PLAYERS - playerCount} more to begin`}
              </p>
            </div>
            <div
              className="flex items-center gap-1.5"
              title={`${playerCount}/${MAX_PLAYERS} players`}
            >
              {Array.from({ length: MAX_PLAYERS }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "w-2.5 h-2.5 rounded-full transition-colors",
                    i < playerCount
                      ? "bg-gold"
                      : i < MIN_PLAYERS
                        ? "bg-cream/15 ring-1 ring-gold/40"
                        : "bg-cream/15"
                  )}
                />
              ))}
            </div>
          </div>

          <LobbyInviteSharePanel lobbyInviteCode={waitingLobbySnapshot.lobbyInviteCode} />

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs uppercase tracking-wider text-cream/40">Players</h2>
              {isCurrentUserHost && canAddMore && (
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

            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              {slots.map((player, index) => {
                if (!player) {
                  const isNextOpen = index === playerCount;
                  if (isCurrentUserHost && isNextOpen && canAddMore) {
                    return (
                      <button
                        key={`empty-${index}`}
                        type="button"
                        onClick={addBotToLobby}
                        disabled={isLobbyActionLoading}
                        className="flex flex-col items-center gap-1.5 w-[68px] group disabled:opacity-50"
                      >
                        <span className="w-12 h-12 rounded-full border-2 border-dashed border-cream/20 group-hover:border-gold/60 group-hover:bg-gold/10 flex items-center justify-center text-cream/40 group-hover:text-gold transition-colors">
                          <Plus className="w-5 h-5" />
                        </span>
                        <span className="text-[11px] text-cream/45 group-hover:text-gold transition-colors">
                          Add bot
                        </span>
                      </button>
                    );
                  }
                  return (
                    <div
                      key={`empty-${index}`}
                      className="flex flex-col items-center gap-1.5 w-[68px]"
                    >
                      <span className="w-12 h-12 rounded-full border-2 border-dashed border-cream/12 flex items-center justify-center text-cream/25 text-sm">
                        {index + 1}
                      </span>
                      <span className="text-[11px] text-cream/25">Open</span>
                    </div>
                  );
                }

                const isYou = player.userId === authenticatedUserId;
                return (
                  <div
                    key={player.userId}
                    className="relative flex flex-col items-center gap-1.5 w-[68px] group"
                  >
                    <div
                      className="w-12 h-12 rounded-full border-2 border-white/25 flex items-center justify-center text-base font-bold text-white shadow-md"
                      style={{
                        backgroundColor:
                          PLAYER_COLORS.find((c) => c.id === player.tokenColorId)?.hex ?? "#888",
                      }}
                    >
                      {player.isBot ? <Bot className="w-5 h-5" /> : player.displayName[0]}
                    </div>

                    {player.isHost && (
                      <span
                        className="absolute -top-1.5 -right-0.5 w-5 h-5 rounded-full bg-gold flex items-center justify-center shadow ring-2 ring-mansion-card"
                        title="Host"
                      >
                        <Crown className="w-3 h-3 text-mansion-dark" />
                      </span>
                    )}

                    {isCurrentUserHost && player.isBot && (
                      <button
                        type="button"
                        onClick={() => removeBotFromLobby(player.userId)}
                        className="absolute -top-1.5 -right-0.5 w-5 h-5 rounded-full bg-red-500/90 hover:bg-red-500 text-white items-center justify-center shadow ring-2 ring-mansion-card hidden group-hover:flex"
                        aria-label={`Remove ${player.displayName}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}

                    <span
                      className={cn(
                        "text-[11px] font-medium truncate w-full text-center",
                        isYou ? "text-gold" : "text-cream/70"
                      )}
                      title={player.displayName}
                    >
                      {isYou ? "You" : player.displayName}
                    </span>
                  </div>
                );
              })}
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
              Waiting for host to start…
            </p>
          )}
        </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-57px)] grid lg:grid-cols-2">
      <LobbySidePanel />
      <div className="flex items-center justify-center px-4 py-10 lg:border-l lg:border-cream/5">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="mb-6">
            <h1 className="font-serif text-2xl text-cream">Start playing</h1>
            <p className="text-cream/50 text-sm mt-1">Create a new game or join with a code.</p>
            {authSession?.user?.isGuest && (
              <span className="inline-block mt-3 text-xs bg-gold/15 text-gold px-3 py-1 rounded-full">
                Guest · {authSession.user.name}
              </span>
            )}
          </div>

          <div className="rounded-2xl bg-mansion-card border border-cream/10 p-5 shadow-xl">
            <div className="flex items-center gap-3 mb-1">
              <PlusCircle className="w-6 h-6 text-gold" />
              <h2 className="font-serif text-lg text-cream">Create a game</h2>
            </div>
            <p className="text-cream/45 text-xs mb-4 ml-9">
              You’ll host · {MIN_PLAYERS}–{MAX_PLAYERS} players · add bots anytime
            </p>
            <Button
              variant="gold"
              className="w-full"
              onClick={createNewLobby}
              loading={isLobbyActionLoading}
            >
              <PlusCircle className="w-5 h-5" /> New Game
            </Button>
          </div>

          <div className="flex items-center gap-3 my-4">
            <span className="h-px flex-1 bg-cream/10" />
            <span className="text-xs uppercase tracking-wider text-cream/30">or join</span>
            <span className="h-px flex-1 bg-cream/10" />
          </div>

          <div className="rounded-2xl bg-mansion-card border border-cream/10 p-5 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <KeyRound className="w-6 h-6 text-gold" />
              <h2 className="font-serif text-lg text-cream">Join with a code</h2>
            </div>
            <Input
              value={manualJoinCodeInput}
              onChange={(e) => setManualJoinCodeInput(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              className="mb-3 text-center text-xl tracking-[0.25em] font-mono"
              aria-label="Lobby code"
            />
            <Button
              variant="secondary"
              className="w-full"
              onClick={joinLobbyByCode}
              loading={isLobbyActionLoading}
              disabled={manualJoinCodeInput.length < 6}
            >
              Join Game
            </Button>
          </div>

          {lobbyErrorMessage && (
            <div className="mt-4 p-3 rounded-xl bg-red-900/30 border border-red-500/30 text-red-300 text-sm text-center">
              {lobbyErrorMessage}
            </div>
          )}

          <p className="text-center mt-6">
            <Link
              href="/guide"
              className="text-sm text-gold/70 hover:text-gold inline-flex items-center gap-1"
            >
              <BookOpen className="w-3.5 h-3.5" /> How to play
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
