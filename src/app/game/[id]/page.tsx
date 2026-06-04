"use client";

import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Trophy, Search, Loader2, BookOpen, Frown, PartyPopper } from "lucide-react";
import { useSocket } from "@/hooks/useSocket";
import { useMultiplayerGameStore } from "@/store/multiplayerGameStore";
import { DeductionGrid } from "@/components/game/DeductionGrid";
import { TurnActionPanel } from "@/components/game/TurnActionPanel";
import { RulesModal } from "@/components/guide/RulesModal";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PLAYER_COLORS, type Card } from "@/lib/game/constants";
import type { GameState } from "@/lib/game/engine";
import { shortPlayerName } from "@/lib/game/playerName";
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
  const [acknowledgedClue, setAcknowledgedClue] = useState<Card | null>(null);
  const [showEliminatedNotice, setShowEliminatedNotice] = useState(false);
  const eliminatedNoticeShownRef = useRef(false);
  const [turnSecondsLeft, setTurnSecondsLeft] = useState(TURN_SECONDS);

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
      const raw = payload as GameState & {
        hand?: Card[];
        revealedCard?: Card;
        revealedByUserId?: string;
      };
      const mapped = mapSocketPayloadToClientState(raw);
      setLiveGameState(mapped);
      // Mark the revealed card only in the column of the player who revealed it.
      if (raw.revealedCard && raw.revealedByUserId) {
        const card = raw.revealedCard;
        const revealerUserId = raw.revealedByUserId;
        setRevealedCardsByPlayer((prev) => {
          if (prev[revealerUserId]?.has(card)) return prev;
          const nextSet = new Set(prev[revealerUserId] ?? []);
          nextSet.add(card);
          return { ...prev, [revealerUserId]: nextSet };
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

  // Notify this player once when their wrong accusation eliminates them (game continues for others).
  useEffect(() => {
    const me = liveGameState?.players.find((p) => p.userId === authenticatedUserId);
    if (
      me?.isEliminated &&
      liveGameState?.status === "playing" &&
      !eliminatedNoticeShownRef.current
    ) {
      eliminatedNoticeShownRef.current = true;
      setShowEliminatedNotice(true);
    }
  }, [liveGameState?.players, liveGameState?.status, authenticatedUserId]);

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
  const didIWin = !!winningPlayer && winningPlayer.userId === authenticatedUserId;

  const interrogatorName = liveGameState.pendingSuggestion
    ? liveGameState.players.find((p) => p.id === liveGameState.pendingSuggestion!.suggesterId)
        ?.displayName ?? "Someone"
    : "";

  const pendingSuggestion = liveGameState.pendingSuggestion;

  const askSequence =
    pendingSuggestion && liveGameState.phase === "disprove"
      ? buildAskSequence(liveGameState, pendingSuggestion, authenticatedUserId)
      : undefined;

  const activeInterrogation =
    pendingSuggestion && liveGameState.phase === "disprove"
      ? {
          askerName: interrogatorName,
          targetName:
            liveGameState.players[pendingSuggestion.disproveIndex]?.displayName ?? "Someone",
          suspect: pendingSuggestion.suspect,
          room: pendingSuggestion.room,
          weapon: pendingSuggestion.weapon,
          askSequence,
        }
      : undefined;

  const statusMessage = liveGameState.lastAction ?? undefined;

  const handleRevealCard = (card: Card) => {
    emitGameAction(
      "game:disprove",
      { sessionId: activeGameSessionId, userId: authenticatedUserId, card },
      "Reveal failed"
    ).then(() => setPendingDisproveRequest(null));
  };

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

        <div className="flex flex-col xl:flex-row gap-3 xl:gap-4 items-start">
          <div className="w-full xl:flex-1 min-w-0">
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
              revealPrompt={
                pendingDisproveRequest
                  ? {
                      askedCards: [
                        pendingDisproveRequest.suggestion.suspectName,
                        pendingDisproveRequest.suggestion.roomName,
                        pendingDisproveRequest.suggestion.weaponName,
                      ] as Card[],
                      matchingCards: pendingDisproveRequest.matchingCardsInHand,
                    }
                  : undefined
              }
              onRevealCard={pendingDisproveRequest ? handleRevealCard : undefined}
            />
          </div>

          <div className="w-full xl:w-[360px] xl:shrink-0 xl:sticky xl:top-[57px]">
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
                  onReveal: handleRevealCard,
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
                revealedCard={
                  liveGameState.privatelyRevealedCard &&
                  liveGameState.privatelyRevealedCard !== acknowledgedClue
                    ? liveGameState.privatelyRevealedCard
                    : null
                }
                onAcknowledgeReveal={() =>
                  setAcknowledgedClue(liveGameState.privatelyRevealedCard ?? null)
                }
                statusMessage={statusMessage}
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
        title={didIWin ? "Case Closed!" : "Game Over"}
        size="md"
      >
        <div className="text-center space-y-4">
          {didIWin ? (
            <>
              <div className="relative mx-auto w-16 h-16">
                <Trophy className="w-16 h-16 text-gold mx-auto drop-shadow-lg" />
                <PartyPopper className="w-6 h-6 text-emerald-400 absolute -top-1 -right-1" />
              </div>
              <div>
                <p className="text-2xl font-serif text-gold">You cracked the case!</p>
                <p className="text-sm text-cream/60 mt-1">
                  Masterful detective work — the mystery is yours.
                </p>
              </div>
            </>
          ) : winningPlayer ? (
            <>
              <Trophy className="w-14 h-14 text-gold/80 mx-auto" />
              <div>
                <p className="text-xl font-serif text-cream">
                  {winningPlayer.displayName} solved it
                </p>
                <p className="text-sm text-cream/55 mt-1">
                  So close, detective — try your skills next time.
                </p>
              </div>
            </>
          ) : (
            <>
              <Search className="w-14 h-14 text-cream/50 mx-auto" />
              <p className="text-xl font-serif text-cream">Mystery unsolved!</p>
            </>
          )}
          {revealedMurderSolution && (
            <div className="p-4 rounded-xl bg-mansion-dark/60 border border-cream/10 text-left space-y-1 text-sm">
              <p className="text-cream/45 text-xs uppercase">The solution was</p>
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

      <Modal
        open={showEliminatedNotice && liveGameState.status === "playing"}
        onClose={() => setShowEliminatedNotice(false)}
        title="You're out"
        size="sm"
      >
        <div className="text-center space-y-4">
          <Frown className="w-14 h-14 text-red-400/80 mx-auto" />
          <div>
            <p className="text-lg font-serif text-cream">That accusation was wrong</p>
            <p className="text-sm text-cream/55 mt-1">
              You&apos;re eliminated — but your guess stays secret. Better luck next time! You can
              keep watching how it unfolds.
            </p>
          </div>
          <div className="flex gap-2.5">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => setShowEliminatedNotice(false)}
            >
              Keep watching
            </Button>
            <Button
              variant="gold"
              className="flex-1"
              onClick={() => {
                resetMultiplayerState();
                router.push("/lobby");
              }}
            >
              Leave
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function isViewingPlayersTurnCheck(state: GameState, userId?: string): boolean {
  if (!userId || state.phase !== "turn") return false;
  return state.players[state.turnIndex]?.userId === userId;
}

export interface AskSequenceEntry {
  name: string;
  status: "passed" | "asking" | "waiting";
  isYou: boolean;
}

/** Order in which the interrogator asks others to disprove (clockwise from the asker). */
function buildAskSequence(
  state: GameState,
  pending: { suggesterId: string; disproveIndex: number },
  viewerUserId?: string
): AskSequenceEntry[] {
  const players = state.players;
  const suggesterIndex = players.findIndex((p) => p.id === pending.suggesterId);
  if (suggesterIndex < 0) return [];

  const order: number[] = [];
  for (let step = 1; step < players.length; step++) {
    const idx = (suggesterIndex + step) % players.length;
    if (!players[idx].isEliminated) order.push(idx);
  }

  const currentPos = order.indexOf(pending.disproveIndex);
  return order.map((idx, pos) => {
    const player = players[idx];
    const status: AskSequenceEntry["status"] =
      currentPos < 0 || pos < currentPos
        ? "passed"
        : pos === currentPos
          ? "asking"
          : "waiting";
    return {
      name: shortPlayerName(player.displayName),
      status,
      isYou: player.userId === viewerUserId,
    };
  });
}
