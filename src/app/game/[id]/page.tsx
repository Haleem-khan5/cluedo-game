"use client";

import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { Trophy, Search, Loader2, BookOpen } from "lucide-react";
import { useSocket } from "@/hooks/useSocket";
import { useMultiplayerGameStore } from "@/store/multiplayerGameStore";
import { useToastStore } from "@/components/ui/ToastContainer";
import { DeductionGrid } from "@/components/game/DeductionGrid";
import { TurnActionPanel } from "@/components/game/TurnActionPanel";
import { RulesModal } from "@/components/guide/RulesModal";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PLAYER_COLORS, type Card } from "@/lib/game/constants";
import type { GameState } from "@/lib/game/engine";
import type { LiveGameClientState } from "@/types/multiplayer.types";

function mapSocketPayloadToClientState(
  payload: GameState & { hand?: Card[]; revealedCard?: Card }
): LiveGameClientState {
  return {
    ...payload,
    privateHandCards: payload.hand,
    privatelyRevealedCard: payload.revealedCard,
  };
}

const TURN_SECONDS = 45;

export default function LiveGamePage() {
  const { data: authSession, status: authStatus } = useSession();
  const routeParams = useParams();
  const router = useRouter();
  const activeGameSessionId = routeParams.id as string;
  const authenticatedUserId = authSession?.user?.id;

  const { emit, on } = useSocket(authenticatedUserId);
  const {
    liveGameState,
    setLiveGameState,
    pendingDisproveRequest,
    setPendingDisproveRequest,
    revealedMurderSolution,
    setRevealedMurderSolution,
    resetMultiplayerState,
  } = useMultiplayerGameStore();

  const [selectedSuspect, setSelectedSuspect] = useState<string | null>(null);
  const [selectedWeapon, setSelectedWeapon] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [isGameActionLoading, setIsGameActionLoading] = useState(false);
  const [gameActionErrorMessage, setGameActionErrorMessage] = useState("");
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [revealedCardsByPlayer, setRevealedCardsByPlayer] = useState<Record<string, Set<Card>>>({});
  const [turnSecondsLeft, setTurnSecondsLeft] = useState(TURN_SECONDS);
  const showToast = useToastStore((s) => s.showToast);
  const previousLastActionRef = useMemo(() => ({ current: "" }), []);

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/auth/login");
  }, [authStatus, router]);

  useEffect(() => {
    if (!authenticatedUserId || !activeGameSessionId) return;
    emit<{ success: boolean }>("game:reconnect", {
      sessionId: activeGameSessionId,
      userId: authenticatedUserId,
    }).then((result) => {
      if (!result?.success) router.push("/lobby");
    });
  }, [authenticatedUserId, activeGameSessionId, emit, router]);

  useEffect(() => {
    const unsubState = on("game:state", (payload) => {
      const mapped = mapSocketPayloadToClientState(payload as GameState & { hand?: Card[]; revealedCard?: Card });
      setLiveGameState(mapped);
      if (mapped.privatelyRevealedCard) {
        setRevealedCardsByPlayer((prev) => {
          const next = { ...prev };
          for (const player of mapped.players) {
            if (player.userId !== authenticatedUserId) {
              if (!next[player.userId]) next[player.userId] = new Set();
              next[player.userId].add(mapped.privatelyRevealedCard!);
            }
          }
          return next;
        });
      }
    });

    const unsubUpdate = on("game:update", (payload) => {
      const prev = useMultiplayerGameStore.getState().liveGameState;
      setLiveGameState({
        ...mapSocketPayloadToClientState(payload as GameState),
        privateHandCards: prev?.privateHandCards,
        privatelyRevealedCard: prev?.privatelyRevealedCard,
      });
    });

    const unsubDisprove = on("game:disprovePrompt", (payload) => {
      const data = payload as {
        suggestion: { suspect: string; weapon: string; room: string };
        matchingCards: Card[];
      };
      setPendingDisproveRequest({
        suggestion: {
          suspectName: data.suggestion.suspect,
          weaponName: data.suggestion.weapon,
          roomName: data.suggestion.room,
        },
        matchingCardsInHand: data.matchingCards,
      });
    });

    const unsubFinished = on("game:finished", (payload) => {
      const data = payload as {
        winnerId: string | null;
        solution: { suspect: string; weapon: string; room: string };
      };
      setRevealedMurderSolution({
        suspectName: data.solution.suspect,
        weaponName: data.solution.weapon,
        roomName: data.solution.room,
      });
      setIsGameOverModalOpen(true);
    });

    return () => {
      unsubState();
      unsubUpdate();
      unsubDisprove();
      unsubFinished();
    };
  }, [on, setLiveGameState, setPendingDisproveRequest, setRevealedMurderSolution, authenticatedUserId]);

  useEffect(() => {
    if (liveGameState?.lastAction && liveGameState.lastAction !== previousLastActionRef.current) {
      previousLastActionRef.current = liveGameState.lastAction;
      showToast(liveGameState.lastAction, "info");
    }
  }, [liveGameState?.lastAction, showToast, previousLastActionRef]);

  // Per-turn countdown — resets whenever the active turn changes.
  const turnTimerKey = `${liveGameState?.turnIndex ?? -1}-${liveGameState?.phase ?? "none"}`;
  const isActiveTurnPhase = liveGameState?.phase === "turn";
  useEffect(() => {
    if (!isActiveTurnPhase) {
      setTurnSecondsLeft(TURN_SECONDS);
      return;
    }
    const startedAt = Date.now();
    setTurnSecondsLeft(TURN_SECONDS);
    const id = setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000;
      setTurnSecondsLeft(Math.max(0, TURN_SECONDS - elapsed));
    }, 200);
    return () => clearInterval(id);
  }, [turnTimerKey, isActiveTurnPhase]);

  const emitGameAction = async <T extends { success: boolean; error?: string }>(
    eventName: string,
    payload: Record<string, unknown>,
    fallbackError: string
  ) => {
    if (!authenticatedUserId) return;
    setIsGameActionLoading(true);
    setGameActionErrorMessage("");
    const result = await emit<T>(eventName, payload);
    setIsGameActionLoading(false);
    if (!result.success) {
      const message = result.error ?? fallbackError;
      setGameActionErrorMessage(message);
      showToast(message, "error");
    } else {
      setSelectedSuspect(null);
      setSelectedWeapon(null);
      setSelectedRoom(null);
    }
    return result;
  };

  if (!liveGameState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-gold animate-spin" />
        <p className="text-cream/55">Loading game…</p>
      </div>
    );
  }

  const activeTurnPlayer = liveGameState.players[liveGameState.turnIndex];
  const viewingPlayerState = liveGameState.players.find((p) => p.userId === authenticatedUserId);
  const isViewingPlayersTurn =
    isViewingPlayersTurnCheck(liveGameState, authenticatedUserId);
  const privateHandCards = liveGameState.privateHandCards ?? [];
  const winningPlayer = liveGameState.players.find((p) => p.id === liveGameState.winnerId);

  const interrogatorName = liveGameState.pendingSuggestion
    ? liveGameState.players.find((p) => p.id === liveGameState.pendingSuggestion!.suggesterId)
        ?.displayName ?? "Someone"
    : "";

  const pendingSuggestion = liveGameState.pendingSuggestion;
  const activeInterrogation =
    pendingSuggestion && liveGameState.phase === "disprove"
      ? {
          askerName: interrogatorName,
          targetName:
            liveGameState.players[pendingSuggestion.disproveIndex]?.displayName ?? "Someone",
          suspect: pendingSuggestion.suspect,
          room: pendingSuggestion.room,
          weapon: pendingSuggestion.weapon,
        }
      : undefined;

  return (
    <div className="min-h-[calc(100vh-57px)]">
      <div className="max-w-[1600px] mx-auto px-2 sm:px-3 py-2 sm:py-3">
        {/* Compact top bar */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <div
            className="w-8 h-8 rounded-full border border-cream/20 flex items-center justify-center text-cream text-xs font-bold shrink-0"
            style={{
              backgroundColor:
                PLAYER_COLORS.find((c) => c.id === activeTurnPlayer?.color)?.hex ?? "#888",
            }}
          >
            {activeTurnPlayer?.displayName[0]}
          </div>
          <p className="font-serif text-cream text-sm sm:text-base flex-1 min-w-0 truncate">
            {activeTurnPlayer?.displayName}
          </p>
          <Button variant="ghost" size="sm" onClick={() => setIsGuideModalOpen(true)}>
            <BookOpen className="w-4 h-4" /> Rules
          </Button>
        </div>

        {gameActionErrorMessage && (
          <div className="mb-2 px-3 py-2 rounded-lg bg-red-950/50 border border-red-500/30 text-red-300 text-xs">
            {gameActionErrorMessage}
          </div>
        )}

        <div className="flex flex-col xl:flex-row xl:justify-center gap-3 xl:gap-6 items-start">
          <div className="w-full xl:w-fit min-w-0">
            <DeductionGrid
              liveGameState={liveGameState}
              currentUserId={authenticatedUserId}
              privateHandCards={privateHandCards}
              selectedSuspect={selectedSuspect}
              selectedRoom={selectedRoom}
              selectedWeapon={selectedWeapon}
              onSelectSuspect={setSelectedSuspect}
              onSelectRoom={setSelectedRoom}
              onSelectWeapon={setSelectedWeapon}
              isSelectionEnabled={isViewingPlayersTurn && liveGameState.phase === "turn"}
              revealedCardsByPlayer={revealedCardsByPlayer}
            />
          </div>

          <div className="w-full xl:w-[380px] xl:shrink-0 xl:sticky xl:top-[57px]">
            {pendingDisproveRequest ? (
              <TurnActionPanel
                isYourTurn={false}
                activePlayerName={interrogatorName}
                selectedSuspect={null}
                selectedRoom={null}
                selectedWeapon={null}
                canAccuse={false}
                isLoading={isGameActionLoading}
                onInterrogate={() => {}}
                onAccuse={() => {}}
                revealMode={{
                  interrogatorName,
                  suspect: pendingDisproveRequest.suggestion.suspectName,
                  room: pendingDisproveRequest.suggestion.roomName,
                  weapon: pendingDisproveRequest.suggestion.weaponName,
                  matchingCards: pendingDisproveRequest.matchingCardsInHand,
                  onReveal: (card) => {
                    emitGameAction(
                      "game:disprove",
                      { sessionId: activeGameSessionId, userId: authenticatedUserId, card },
                      "Reveal failed"
                    ).then(() => setPendingDisproveRequest(null));
                  },
                  onPass: () => {
                    emitGameAction(
                      "game:passDisprove",
                      { sessionId: activeGameSessionId, userId: authenticatedUserId },
                      "Pass failed"
                    ).then(() => setPendingDisproveRequest(null));
                  },
                }}
              />
            ) : (
              <TurnActionPanel
                isYourTurn={isViewingPlayersTurn && liveGameState.phase === "turn"}
                activePlayerName={activeTurnPlayer?.displayName ?? ""}
                selectedSuspect={selectedSuspect}
                selectedRoom={selectedRoom}
                selectedWeapon={selectedWeapon}
                canAccuse={viewingPlayerState?.canAccuse ?? false}
                isLoading={isGameActionLoading}
                revealedCard={liveGameState.privatelyRevealedCard}
                activeInterrogation={activeInterrogation}
                turnProgress={
                  liveGameState.phase === "turn"
                    ? { secondsLeft: turnSecondsLeft, total: TURN_SECONDS }
                    : undefined
                }
                onInterrogate={() => {
                  if (!selectedSuspect || !selectedWeapon || !selectedRoom) return;
                  emitGameAction(
                    "game:suggest",
                    {
                      sessionId: activeGameSessionId,
                      userId: authenticatedUserId,
                      suspect: selectedSuspect,
                      weapon: selectedWeapon,
                      room: selectedRoom,
                    },
                    "Interrogation failed"
                  );
                }}
                onAccuse={() => {
                  if (!selectedSuspect || !selectedWeapon || !selectedRoom) return;
                  emitGameAction(
                    "game:accuse",
                    {
                      sessionId: activeGameSessionId,
                      userId: authenticatedUserId,
                      suspect: selectedSuspect,
                      weapon: selectedWeapon,
                      room: selectedRoom,
                    },
                    "Accusation failed"
                  );
                }}
              />
            )}
          </div>
        </div>
      </div>

      <RulesModal open={isGuideModalOpen} onClose={() => setIsGuideModalOpen(false)} compact />

      <Modal
        open={isGameOverModalOpen || liveGameState.status === "finished"}
        onClose={() => {}}
        title="Game Over"
        size="md"
      >
        <div className="text-center space-y-4">
          {winningPlayer ? (
            <>
              <Trophy className="w-14 h-14 text-gold mx-auto" />
              <p className="text-xl font-serif text-cream">{winningPlayer.displayName} wins!</p>
            </>
          ) : (
            <>
              <Search className="w-14 h-14 text-cream/50 mx-auto" />
              <p className="text-xl font-serif text-cream">Mystery unsolved!</p>
            </>
          )}
          {revealedMurderSolution && (
            <div className="p-4 rounded-xl bg-mansion-dark/60 border border-cream/10 text-left space-y-1 text-sm">
              <p className="text-cream/45 text-xs uppercase">Solution</p>
              <p className="text-cream">👤 {revealedMurderSolution.suspectName}</p>
              <p className="text-cream">🗡️ {revealedMurderSolution.weaponName}</p>
              <p className="text-cream">🏠 {revealedMurderSolution.roomName}</p>
            </div>
          )}
          <Button
            variant="gold"
            className="w-full"
            onClick={() => {
              resetMultiplayerState();
              router.push("/lobby");
            }}
          >
            Play Again
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function isViewingPlayersTurnCheck(state: GameState, userId?: string): boolean {
  if (!userId || state.phase !== "turn") return false;
  return state.players[state.turnIndex]?.userId === userId;
}
