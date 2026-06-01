"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Castle,
  KeyRound,
  PlusCircle,
  Users,
  Crown,
  Play,
  ArrowLeft,
  Loader2,
  BookOpen,
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
        <p className="text-cream/50">Loading lobby...</p>
      </div>
    );
  }

  if (authStatus === "unauthenticated") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-1 text-cream/40 hover:text-cream/60 text-sm mb-8">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="text-center mb-10">
          <Castle className="w-14 h-14 text-gold mx-auto mb-4" />
          <h1 className="font-serif text-4xl text-cream">Enter the Mansion</h1>
          <p className="text-cream/55 mt-2">Sign in, register, or play as a guest to join a game</p>
        </div>
        <GuestQuickPlayCard />
        <p className="text-center mt-6 text-sm text-cream/45">
          <Link href="/auth/login" className="text-gold hover:underline">Sign in</Link>
          {" · "}
          <Link href="/auth/signup" className="text-gold hover:underline">Create account</Link>
        </p>
      </div>
    );
  }

  if (waitingLobbySnapshot) {
    const isCurrentUserHost = waitingLobbySnapshot.hostUserId === authenticatedUserId;
    const playerCount = waitingLobbySnapshot.waitingPlayers.length;
    const hasMinimumPlayers = playerCount >= MIN_PLAYERS;

    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="rounded-2xl bg-mansion-card border border-cream/10 p-8 shadow-2xl">
            <div className="text-center mb-6">
              <Users className="w-10 h-10 text-gold mx-auto mb-3" />
              <h1 className="font-serif text-3xl text-cream">Waiting Lobby</h1>
              <p className="text-cream/50 mt-1">
                {playerCount}/{MAX_PLAYERS} detectives · min {MIN_PLAYERS} to start
              </p>
            </div>

            <LobbyInviteSharePanel lobbyInviteCode={waitingLobbySnapshot.lobbyInviteCode} />

            <div className="space-y-2 mt-6">
              {waitingLobbySnapshot.waitingPlayers.map((player) => (
                <div
                  key={player.userId}
                  className="flex items-center gap-3 p-3 rounded-xl bg-mansion-dark/60 border border-cream/5"
                >
                  <div
                    className="w-9 h-9 rounded-full border-2 border-white/25 flex items-center justify-center text-xs font-bold text-white"
                    style={{
                      backgroundColor:
                        PLAYER_COLORS.find((c) => c.id === player.tokenColorId)?.hex ?? "#888",
                    }}
                  >
                    {player.displayName[0]}
                  </div>
                  <span className="text-cream font-medium">{player.displayName}</span>
                  {player.userId === authenticatedUserId && (
                    <span className="text-xs text-cream/40">(you)</span>
                  )}
                  {player.isHost && (
                    <span className="ml-auto text-xs bg-gold/20 text-gold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Crown className="w-3 h-3" /> Host
                    </span>
                  )}
                </div>
              ))}
            </div>

            {lobbyErrorMessage && (
              <div className="mt-4 p-3 rounded-xl bg-red-900/30 border border-red-500/30 text-red-300 text-sm">
                {lobbyErrorMessage}
              </div>
            )}

            <div className="mt-6">
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
                    ? "Start Investigation"
                    : `Waiting for ${MIN_PLAYERS - playerCount} more detective(s)`}
                </Button>
              ) : (
                <p className="text-center text-cream/50 flex items-center justify-center gap-2 animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Waiting for host to start...
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-10">
          <Castle className="w-12 h-12 text-gold mx-auto mb-4" />
          <h1 className="font-serif text-4xl text-cream">Game Lobby</h1>
          <p className="text-cream/55 mt-2">Host a new mystery or join friends with their code</p>
          <Link
            href="/guide"
            className="inline-flex items-center gap-1.5 mt-4 text-sm text-gold/80 hover:text-gold transition-colors"
          >
            <BookOpen className="w-4 h-4" /> New? Read the Detective&apos;s Guidebook
          </Link>
          {authSession?.user?.isGuest && (
            <span className="inline-block mt-3 text-xs bg-gold/15 text-gold px-3 py-1 rounded-full">
              Playing as guest — {authSession.user.name}
            </span>
          )}
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl bg-mansion-card border border-cream/10 p-6 shadow-xl hover:border-gold/20 transition-colors">
            <PlusCircle className="w-10 h-10 text-gold mb-3" />
            <h2 className="font-serif text-xl text-cream">Create Lobby</h2>
            <p className="text-cream/50 text-sm mt-2 mb-6">
              Start a new game for {MIN_PLAYERS}–{MAX_PLAYERS} detectives. Share the QR code or link.
            </p>
            <Button variant="gold" className="w-full" onClick={createNewLobby} loading={isLobbyActionLoading}>
              <Castle className="w-4 h-4" /> Create Game
            </Button>
          </div>

          <div className="rounded-2xl bg-mansion-card border border-cream/10 p-6 shadow-xl hover:border-gold/20 transition-colors">
            <KeyRound className="w-10 h-10 text-gold mb-3" />
            <h2 className="font-serif text-xl text-cream">Join with Code</h2>
            <p className="text-cream/50 text-sm mt-2 mb-4">Enter the 6-character code from your friend</p>
            <Input
              value={manualJoinCodeInput}
              onChange={(e) => setManualJoinCodeInput(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              className="mb-4 text-center text-2xl tracking-[0.3em] font-mono"
            />
            <Button
              variant="secondary"
              className="w-full"
              onClick={joinLobbyByCode}
              loading={isLobbyActionLoading}
              disabled={manualJoinCodeInput.length < 6}
            >
              <Users className="w-4 h-4" /> Join Game
            </Button>
          </div>
        </div>

        {lobbyErrorMessage && (
          <div className="mt-6 p-3 rounded-xl bg-red-900/30 border border-red-500/30 text-red-300 text-sm text-center">
            {lobbyErrorMessage}
          </div>
        )}

        <p className="text-center mt-8">
          <Link href="/" className="text-cream/40 hover:text-cream/60 text-sm inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
