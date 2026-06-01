"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Castle,
  KeyRound,
  Users,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GuestQuickPlayCard } from "@/components/auth/GuestQuickPlayCard";
import { LobbyInviteSharePanel } from "@/components/lobby/LobbyInviteSharePanel";
import { useSocket } from "@/hooks/useSocket";
import { useMultiplayerGameStore } from "@/store/multiplayerGameStore";
import { mapServerLobbyToSnapshot } from "@/types/multiplayer.types";
import type { ServerLobbyPayload } from "@/types/multiplayer.types";
import { MIN_PLAYERS, MAX_PLAYERS, PLAYER_COLORS } from "@/lib/game/constants";

/**
 * Public join page — opened via shared link or QR code (`/join/ABC123`).
 * Guests can enter a name and join without registering.
 */
export default function JoinLobbyByCodePage() {
  const router = useRouter();
  const routeParams = useParams();
  const lobbyInviteCodeFromUrl = (routeParams.code as string)?.toUpperCase() ?? "";

  const { data: authSession, status: authStatus } = useSession();
  const authenticatedUserId = authSession?.user?.id;

  const { emit, on } = useSocket(authenticatedUserId);
  const { waitingLobbySnapshot, setWaitingLobbySnapshot, setActiveGameSessionId } =
    useMultiplayerGameStore();

  const [isJoinActionLoading, setIsJoinActionLoading] = useState(false);
  const [joinErrorMessage, setJoinErrorMessage] = useState("");
  const [hasAttemptedAutoJoin, setHasAttemptedAutoJoin] = useState(false);

  useEffect(() => {
    const unsubscribeLobbyUpdate = on("lobby:update", (payload) => {
      setWaitingLobbySnapshot(mapServerLobbyToSnapshot(payload as ServerLobbyPayload));
    });
    return unsubscribeLobbyUpdate;
  }, [on, setWaitingLobbySnapshot]);

  useEffect(() => {
    const unsubscribeGameStart = on("game:state", (payload) => {
      const gameState = payload as { id: string };
      setActiveGameSessionId(gameState.id);
      router.push(`/game/${gameState.id}`);
    });
    return unsubscribeGameStart;
  }, [on, setActiveGameSessionId, router]);

  const joinLobbyWithCode = async (code: string, displayName: string) => {
    if (!authenticatedUserId) return;
    setIsJoinActionLoading(true);
    setJoinErrorMessage("");

    const joinResult = await emit<{ success: boolean; error?: string }>("lobby:join", {
      code: code.toUpperCase(),
      userId: authenticatedUserId,
      displayName,
    });

    setIsJoinActionLoading(false);
    if (!joinResult.success) {
      setJoinErrorMessage(joinResult.error ?? "Could not join this lobby. Check the code and try again.");
    }
  };

  useEffect(() => {
    if (
      authStatus === "authenticated" &&
      authenticatedUserId &&
      lobbyInviteCodeFromUrl &&
      !hasAttemptedAutoJoin &&
      !waitingLobbySnapshot
    ) {
      setHasAttemptedAutoJoin(true);
      joinLobbyWithCode(
        lobbyInviteCodeFromUrl,
        authSession?.user?.name ?? "Detective"
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus, authenticatedUserId, lobbyInviteCodeFromUrl]);

  if (authStatus === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
        <p className="text-cream/50 text-sm">Loading invite...</p>
      </div>
    );
  }

  if (waitingLobbySnapshot) {
    const playerCount = waitingLobbySnapshot.waitingPlayers.length;
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-mansion-card border border-emerald-500/20 p-8 shadow-2xl space-y-6"
        >
          <div className="text-center">
            <Castle className="w-12 h-12 text-gold mx-auto mb-3" />
            <h1 className="font-serif text-2xl text-cream">You&apos;re In!</h1>
            <p className="text-cream/50 mt-2">Waiting for the host to start the investigation</p>
          </div>

          <LobbyInviteSharePanel lobbyInviteCode={waitingLobbySnapshot.lobbyInviteCode} />

          <div className="flex items-center gap-2 text-cream/60 text-sm">
            <Users className="w-4 h-4" />
            {playerCount}/{MAX_PLAYERS} detectives ready
            {playerCount < MIN_PLAYERS && (
              <span className="text-amber-400/80"> — need {MIN_PLAYERS - playerCount} more</span>
            )}
          </div>

          <div className="space-y-2">
            {waitingLobbySnapshot.waitingPlayers.map((player) => (
              <div
                key={player.userId}
                className="flex items-center gap-3 p-3 rounded-xl bg-mansion-dark/60 border border-cream/5"
              >
                <div
                  className="w-8 h-8 rounded-full border-2 border-white/30"
                  style={{
                    backgroundColor:
                      PLAYER_COLORS.find((c) => c.id === player.tokenColorId)?.hex ?? "#888",
                  }}
                />
                <span className="text-cream">{player.displayName}</span>
                {player.isHost && (
                  <span className="ml-auto text-xs bg-gold/20 text-gold px-2 py-0.5 rounded-full">
                    Host
                  </span>
                )}
              </div>
            ))}
          </div>

          <p className="text-center text-cream/40 text-sm animate-pulse">
            The host will start when everyone is ready...
          </p>
        </motion.div>
      </div>
    );
  }

  if (authStatus === "unauthenticated") {
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-cream/40 hover:text-cream/70 text-sm mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Home
        </Link>

        <div className="text-center mb-8">
          <KeyRound className="w-14 h-14 text-gold mx-auto mb-4" />
          <h1 className="font-serif text-3xl text-cream">Join Game</h1>
          <p className="text-cream/55 mt-2">
            You&apos;ve been invited to lobby{" "}
            <span className="font-mono text-gold tracking-wider">{lobbyInviteCodeFromUrl}</span>
          </p>
        </div>

        <GuestQuickPlayCard
          redirectAfterGuestSignIn={`/join/${lobbyInviteCodeFromUrl}`}
          title="Join as Guest"
          description="Enter your detective name — no sign-up required. You'll join the lobby automatically."
        />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <Loader2 className="w-10 h-10 text-gold animate-spin mx-auto mb-4" />
      <p className="text-cream/60">Joining lobby {lobbyInviteCodeFromUrl}...</p>
      {joinErrorMessage && (
        <div className="mt-6 p-4 rounded-xl bg-red-900/30 border border-red-500/30 text-red-300 text-sm">
          {joinErrorMessage}
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 w-full"
            onClick={() => router.push("/lobby")}
          >
            Go to Lobby
          </Button>
        </div>
      )}
    </div>
  );
}
