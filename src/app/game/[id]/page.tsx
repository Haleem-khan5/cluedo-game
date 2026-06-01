"use client";

import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Volume2,
  VolumeX,
  Hand,
  Users,
  WifiOff,
  Trophy,
  Search,
  Loader2,
  Eye,
  BookOpen,
} from "lucide-react";
import { useSocket } from "@/hooks/useSocket";
import { useMultiplayerGameStore } from "@/store/multiplayerGameStore";
import { useToastStore } from "@/components/ui/ToastContainer";
import { MansionGameBoard } from "@/components/game/MansionGameBoard";
import { ClueCard } from "@/components/game/ClueCard";
import { DetectiveNotes } from "@/components/game/DetectiveNotes";
import { TurnStatusPanel } from "@/components/game/TurnStatusPanel";
import { DiceRollDisplay } from "@/components/game/DiceRollDisplay";
import { GameActionToolbar } from "@/components/game/GameActionToolbar";
import { MobileGameTabs, type MobileGameTab } from "@/components/game/MobileGameTabs";
import { InGameGuideDrawer } from "@/components/guide/InGameGuideDrawer";
import { OnboardingTour, resetOnboardingTour } from "@/components/guide/OnboardingTour";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  SUSPECTS,
  WEAPONS,
  ROOMS,
  SECRET_PASSAGES,
  PLAYER_COLORS,
  type Suspect,
  type Weapon,
  type Room,
  type Card,
} from "@/lib/game/constants";
import { getValidMoves } from "@/lib/game/board";
import type { GameState } from "@/lib/game/engine";
import type { Position } from "@/lib/game/board";
import type {
  LiveGameClientState,
  PendingDisproveRequest,
} from "@/types/multiplayer.types";

/** Maps raw socket game payload to typed client state. */
function mapSocketPayloadToClientState(
  payload: GameState & { hand?: Card[]; revealedCard?: Card }
): LiveGameClientState {
  return {
    ...payload,
    privateHandCards: payload.hand,
    privatelyRevealedCard: payload.revealedCard,
  };
}

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
    isSoundEffectsEnabled,
    toggleSoundEffects,
    resetMultiplayerState,
  } = useMultiplayerGameStore();

  const [isPrivateHandModalOpen, setIsPrivateHandModalOpen] = useState(false);
  const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);
  const [isAccusationModalOpen, setIsAccusationModalOpen] = useState(false);
  const [selectedSuspectName, setSelectedSuspectName] = useState<Suspect | null>(null);
  const [selectedWeaponName, setSelectedWeaponName] = useState<Weapon | null>(null);
  const [selectedRoomName, setSelectedRoomName] = useState<Room | null>(null);
  const [isGameActionLoading, setIsGameActionLoading] = useState(false);
  const [gameActionErrorMessage, setGameActionErrorMessage] = useState("");
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState(false);
  const [isGuideDrawerOpen, setIsGuideDrawerOpen] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState<MobileGameTab>("board");
  const [replayTour, setReplayTour] = useState(false);
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
    }).then((reconnectResult) => {
      if (!reconnectResult?.success) router.push("/lobby");
    });
  }, [authenticatedUserId, activeGameSessionId, emit, router]);

  useEffect(() => {
    const unsubscribePrivateState = on("game:state", (payload) => {
      setLiveGameState(mapSocketPayloadToClientState(payload as GameState & { hand?: Card[]; revealedCard?: Card }));
    });

    const unsubscribePublicUpdate = on("game:update", (payload) => {
      const previousState = useMultiplayerGameStore.getState().liveGameState;
      setLiveGameState({
        ...mapSocketPayloadToClientState(payload as GameState),
        privateHandCards: previousState?.privateHandCards,
        privatelyRevealedCard: previousState?.privatelyRevealedCard,
      });
    });

    const unsubscribeDisprovePrompt = on("game:disprovePrompt", (payload) => {
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

    const unsubscribeGameFinished = on("game:finished", (payload) => {
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
      unsubscribePrivateState();
      unsubscribePublicUpdate();
      unsubscribeDisprovePrompt();
      unsubscribeGameFinished();
    };
  }, [on, setLiveGameState, setPendingDisproveRequest, setRevealedMurderSolution]);

  useEffect(() => {
    if (liveGameState?.lastAction && liveGameState.lastAction !== previousLastActionRef.current) {
      previousLastActionRef.current = liveGameState.lastAction;
      showToast(liveGameState.lastAction, "info");
    }
  }, [liveGameState?.lastAction, showToast, previousLastActionRef]);

  const activeTurnPlayer = liveGameState?.players[liveGameState.turnIndex];
  const viewingPlayerState = liveGameState?.players.find((p) => p.userId === authenticatedUserId);
  const isViewingPlayersTurn = activeTurnPlayer?.userId === authenticatedUserId;

  const highlightedMoveTargets = useMemo(() => {
    if (
      !liveGameState ||
      !viewingPlayerState ||
      !isViewingPlayersTurn ||
      liveGameState.phase !== "move" ||
      liveGameState.diceRoll === null
    ) {
      return [];
    }
    const occupiedTokenPositions = liveGameState.players
      .filter((player) => !player.isEliminated)
      .map((player) => player.position);
    return getValidMoves(
      viewingPlayerState.position,
      liveGameState.diceRoll,
      occupiedTokenPositions
    );
  }, [liveGameState, viewingPlayerState, isViewingPlayersTurn]);

  const secretPassageDestinationRooms = useMemo(() => {
    if (!viewingPlayerState?.currentRoom || !isViewingPlayersTurn || liveGameState?.phase !== "move") {
      return [];
    }
    return SECRET_PASSAGES.filter(([fromRoom]) => fromRoom === viewingPlayerState.currentRoom).map(
      ([, toRoom]) => toRoom
    );
  }, [viewingPlayerState, isViewingPlayersTurn, liveGameState?.phase]);

  const emitGameAction = async <T extends { success: boolean; error?: string }>(
    eventName: string,
    payload: Record<string, unknown>,
    fallbackError: string
  ) => {
    if (!authenticatedUserId) return;
    setIsGameActionLoading(true);
    const result = await emit<T>(eventName, payload);
    setIsGameActionLoading(false);
    if (!result.success) setGameActionErrorMessage(result.error ?? fallbackError);
  };

  if (!liveGameState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-gold animate-spin" />
        <p className="text-cream/55">Loading investigation...</p>
      </div>
    );
  }

  const winningPlayer = liveGameState.players.find((p) => p.id === liveGameState.winnerId);
  const privateHandCards = liveGameState.privateHandCards ?? [];

  return (
    <div className="max-w-[1600px] mx-auto px-2 sm:px-4 py-4 pb-24 xl:pb-4 space-y-4">
      <div id="tour-turn-status">
        <TurnStatusPanel
          liveGameState={liveGameState}
          currentUserId={authenticatedUserId}
          isCurrentPlayerTurn={isViewingPlayersTurn}
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => setIsGuideDrawerOpen(true)}>
          <BookOpen className="w-4 h-4" /> Guide
        </Button>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              resetOnboardingTour();
              setReplayTour(true);
            }}
            className="hidden sm:block text-xs text-cream/40 hover:text-cream/70 px-2 py-1"
          >
            Replay tour
          </button>
          <button
            onClick={toggleSoundEffects}
            className="p-2 rounded-lg hover:bg-cream/10 text-cream/50 transition-colors"
            aria-label="Toggle sound"
          >
            {isSoundEffectsEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {liveGameState.lastAction && (
        <motion.div
          key={liveGameState.lastAction}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="hidden sm:flex p-3 rounded-xl bg-gold/10 border border-gold/20 text-cream text-sm items-center gap-2"
        >
          <MessageSquare className="w-4 h-4 text-gold shrink-0" />
          {liveGameState.lastAction}
        </motion.div>
      )}

      {gameActionErrorMessage && (
        <div className="p-3 rounded-xl bg-red-900/30 border border-red-500/30 text-red-300 text-sm flex justify-between">
          <span>{gameActionErrorMessage}</span>
          <button onClick={() => setGameActionErrorMessage("")} className="underline shrink-0 ml-2">
            dismiss
          </button>
        </div>
      )}

      {liveGameState.privatelyRevealedCard && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-xl bg-emerald-900/30 border border-emerald-500/30 flex items-center gap-4"
        >
          <Eye className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-cream text-sm">A clue was shown to you:</span>
          <ClueCard cardName={liveGameState.privatelyRevealedCard} size="sm" />
        </motion.div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4">
        <div className={`space-y-4 ${mobileActiveTab !== "board" && mobileActiveTab !== "actions" ? "hidden xl:block" : ""}`}>
          <div className={mobileActiveTab !== "board" ? "hidden xl:block" : ""}>
            <MansionGameBoard
              liveGameState={liveGameState}
              highlightedMoveTargets={highlightedMoveTargets}
              onMoveTargetClick={
                isViewingPlayersTurn && liveGameState.phase === "move"
                  ? (targetPosition) =>
                      emitGameAction("game:move", {
                        sessionId: activeGameSessionId,
                        userId: authenticatedUserId,
                        target: targetPosition,
                      }, "Invalid move")
                  : undefined
              }
              viewingUserId={authenticatedUserId}
            />
          </div>

          <div id="tour-actions" className={mobileActiveTab !== "actions" && mobileActiveTab !== "board" ? "hidden xl:block" : mobileActiveTab === "actions" ? "block" : "hidden xl:block"}>
            <GameActionToolbar
            currentTurnPhase={liveGameState.phase}
            isCurrentPlayerTurn={isViewingPlayersTurn}
            isGameFinished={liveGameState.status === "finished"}
            secretPassageDestinationRooms={secretPassageDestinationRooms}
            canMakeAccusation={viewingPlayerState?.canAccuse ?? false}
            isActionLoading={isGameActionLoading}
            onRollDice={() =>
              emitGameAction("game:roll", { sessionId: activeGameSessionId, userId: authenticatedUserId }, "Roll failed")
            }
            onOpenSuggestionModal={() => setIsSuggestionModalOpen(true)}
            onOpenAccusationModal={() => setIsAccusationModalOpen(true)}
            onEndTurn={() =>
              emitGameAction("game:endTurn", { sessionId: activeGameSessionId, userId: authenticatedUserId }, "End turn failed")
            }
            onUseSecretPassage={(destinationRoom) =>
              emitGameAction(
                "game:secretPassage",
                { sessionId: activeGameSessionId, userId: authenticatedUserId, room: destinationRoom },
                "Secret passage unavailable"
              )
            }
          />
          </div>

          <div className={`rounded-xl bg-mansion-card border border-cream/10 p-4 ${mobileActiveTab !== "board" ? "hidden xl:block" : ""}`}>
            <h3 className="font-serif text-cream mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-gold" /> Detectives
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {liveGameState.players.map((player, turnIndex) => (
                <div
                  key={player.id}
                  className={`p-2.5 rounded-lg text-sm flex items-center gap-2 border ${
                    turnIndex === liveGameState.turnIndex
                      ? "bg-gold/15 border-gold/30"
                      : "bg-mansion-dark/40 border-transparent"
                  } ${player.isEliminated ? "opacity-40 line-through" : ""}`}
                >
                  <div
                    className="w-5 h-5 rounded-full border border-white/30 shrink-0"
                    style={{
                      backgroundColor:
                        PLAYER_COLORS.find((c) => c.id === player.color)?.hex ?? "#888",
                    }}
                  />
                  <span className="text-cream truncate flex-1">{player.displayName}</span>
                  {!player.isConnected && (
                    <WifiOff className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={`space-y-4 ${mobileActiveTab === "board" || mobileActiveTab === "actions" ? "hidden xl:block" : mobileActiveTab === "clues" || mobileActiveTab === "notes" ? "block" : "hidden xl:block"}`}>
          <div className={`${mobileActiveTab === "actions" ? "block" : "hidden xl:block"}`}>
            <DiceRollDisplay
              diceValue={liveGameState.diceRoll}
              isRolling={isGameActionLoading && liveGameState.phase === "roll"}
            />
          </div>

          <div id="tour-hand" className={`rounded-xl bg-mansion-card border border-cream/10 p-4 ${mobileActiveTab !== "clues" ? "hidden xl:block" : ""}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif text-cream flex items-center gap-2">
                <Hand className="w-4 h-4 text-gold" /> Your Clues
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setIsPrivateHandModalOpen(true)}>
                View All
              </Button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {privateHandCards.length > 0 ? (
                privateHandCards.map((cardName) => (
                  <ClueCard key={cardName} cardName={cardName} size="sm" />
                ))
              ) : (
                <p className="text-cream/40 text-sm">Waiting for cards...</p>
              )}
            </div>
          </div>

          <div id="tour-notes" className={`${mobileActiveTab !== "notes" ? "hidden xl:block" : ""}`}>
            <DetectiveNotes />
          </div>
        </div>
      </div>

      <MobileGameTabs
        activeTab={mobileActiveTab}
        onTabChange={setMobileActiveTab}
        showActionsBadge={isViewingPlayersTurn && liveGameState.status === "playing"}
      />

      <InGameGuideDrawer isOpen={isGuideDrawerOpen} onClose={() => setIsGuideDrawerOpen(false)} />
      <OnboardingTour forceShow={replayTour} onComplete={() => setReplayTour(false)} />

      <Modal open={isPrivateHandModalOpen} onClose={() => setIsPrivateHandModalOpen(false)} title="Your Private Clues" size="lg">
        <div className="flex flex-wrap gap-4 justify-center">
          {privateHandCards.map((cardName) => (
            <ClueCard key={cardName} cardName={cardName} size="md" />
          ))}
        </div>
      </Modal>

      <Modal open={isSuggestionModalOpen} onClose={() => setIsSuggestionModalOpen(false)} title="Make a Suggestion" size="lg">
        <p className="text-cream/55 mb-4 text-sm">
          Name a suspect and weapon for room:{" "}
          <strong className="text-gold">{viewingPlayerState?.currentRoom}</strong>
        </p>
        <SuggestionPickerForm
          selectedSuspect={selectedSuspectName}
          selectedWeapon={selectedWeaponName}
          onSelectSuspect={setSelectedSuspectName}
          onSelectWeapon={setSelectedWeaponName}
          onSubmit={async () => {
            if (!selectedSuspectName || !selectedWeaponName) return;
            await emitGameAction(
              "game:suggest",
              {
                sessionId: activeGameSessionId,
                userId: authenticatedUserId,
                suspect: selectedSuspectName,
                weapon: selectedWeaponName,
              },
              "Suggestion failed"
            );
            setIsSuggestionModalOpen(false);
            setSelectedSuspectName(null);
            setSelectedWeaponName(null);
          }}
          isLoading={isGameActionLoading}
          includeRoomPicker={false}
        />
      </Modal>

      <Modal open={isAccusationModalOpen} onClose={() => setIsAccusationModalOpen(false)} title="Final Accusation" size="lg">
        <p className="text-red-300 mb-4 text-sm flex items-center gap-2">
          <Search className="w-4 h-4" />
          Wrong accusation eliminates you permanently. Choose carefully!
        </p>
        <SuggestionPickerForm
          selectedSuspect={selectedSuspectName}
          selectedWeapon={selectedWeaponName}
          selectedRoom={selectedRoomName}
          onSelectSuspect={setSelectedSuspectName}
          onSelectWeapon={setSelectedWeaponName}
          onSelectRoom={setSelectedRoomName}
          onSubmit={async () => {
            if (!selectedSuspectName || !selectedWeaponName || !selectedRoomName) return;
            await emitGameAction(
              "game:accuse",
              {
                sessionId: activeGameSessionId,
                userId: authenticatedUserId,
                suspect: selectedSuspectName,
                weapon: selectedWeaponName,
                room: selectedRoomName,
              },
              "Accusation failed"
            );
            setIsAccusationModalOpen(false);
          }}
          isLoading={isGameActionLoading}
          includeRoomPicker
        />
      </Modal>

      <Modal
        open={!!pendingDisproveRequest}
        onClose={() => {}}
        title="Disprove This Suggestion"
        size="md"
      >
        {pendingDisproveRequest && (
          <DisproveSuggestionPanel
            disproveRequest={pendingDisproveRequest}
            isLoading={isGameActionLoading}
            onShowCard={(cardName) =>
              emitGameAction(
                "game:disprove",
                { sessionId: activeGameSessionId, userId: authenticatedUserId, card: cardName },
                "Disprove failed"
              ).then(() => setPendingDisproveRequest(null))
            }
            onPass={() =>
              emitGameAction(
                "game:passDisprove",
                { sessionId: activeGameSessionId, userId: authenticatedUserId },
                "Pass failed"
              ).then(() => setPendingDisproveRequest(null))
            }
          />
        )}
      </Modal>

      <Modal
        open={isGameOverModalOpen || liveGameState.status === "finished"}
        onClose={() => {}}
        title="Case Closed"
        size="md"
      >
        <div className="text-center space-y-4">
          {winningPlayer ? (
            <>
              <Trophy className="w-14 h-14 text-gold mx-auto" />
              <p className="text-xl text-cream font-serif">{winningPlayer.displayName} solved the mystery!</p>
            </>
          ) : (
            <>
              <Search className="w-14 h-14 text-cream/50 mx-auto" />
              <p className="text-xl text-cream font-serif">The mystery remains unsolved!</p>
            </>
          )}
          {revealedMurderSolution && (
            <div className="p-4 rounded-xl bg-mansion-dark/60 border border-cream/10 text-left space-y-2">
              <p className="text-cream/45 text-xs uppercase tracking-wider">The Solution</p>
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

function SuggestionPickerForm({
  selectedSuspect,
  selectedWeapon,
  selectedRoom,
  onSelectSuspect,
  onSelectWeapon,
  onSelectRoom,
  onSubmit,
  isLoading,
  includeRoomPicker,
}: {
  selectedSuspect: Suspect | null;
  selectedWeapon: Weapon | null;
  selectedRoom?: Room | null;
  onSelectSuspect: (s: Suspect) => void;
  onSelectWeapon: (w: Weapon) => void;
  onSelectRoom?: (r: Room) => void;
  onSubmit: () => void;
  isLoading: boolean;
  includeRoomPicker: boolean;
}) {
  return (
    <div className="space-y-4">
      <PickerSection title="Suspect" options={SUSPECTS} selected={selectedSuspect} onSelect={onSelectSuspect} activeColor="purple" />
      <PickerSection title="Weapon" options={WEAPONS} selected={selectedWeapon} onSelect={onSelectWeapon} activeColor="red" />
      {includeRoomPicker && onSelectRoom && (
        <PickerSection title="Room" options={ROOMS} selected={selectedRoom ?? null} onSelect={onSelectRoom} activeColor="emerald" />
      )}
      <Button
        variant={includeRoomPicker ? "danger" : "gold"}
        className="w-full"
        onClick={onSubmit}
        disabled={!selectedSuspect || !selectedWeapon || (includeRoomPicker && !selectedRoom)}
        loading={isLoading}
      >
        {includeRoomPicker ? "Make Accusation" : "Submit Suggestion"}
      </Button>
    </div>
  );
}

function PickerSection<T extends string>({
  title,
  options,
  selected,
  onSelect,
  activeColor,
}: {
  title: string;
  options: readonly T[];
  selected: T | null;
  onSelect: (value: T) => void;
  activeColor: "purple" | "red" | "emerald";
}) {
  const activeClasses = {
    purple: "bg-purple-900/60 border-purple-400 text-cream",
    red: "bg-red-900/60 border-red-400 text-cream",
    emerald: "bg-emerald-900/60 border-emerald-400 text-cream",
  };

  return (
    <div>
      <h4 className="text-sm text-cream/65 mb-2">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(option)}
            className={`px-3 py-2 rounded-lg text-sm border transition-all ${
              selected === option ? activeClasses[activeColor] : "border-cream/10 text-cream/55 hover:border-cream/25"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function DisproveSuggestionPanel({
  disproveRequest,
  isLoading,
  onShowCard,
  onPass,
}: {
  disproveRequest: PendingDisproveRequest;
  isLoading: boolean;
  onShowCard: (card: Card) => void;
  onPass: () => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-cream/70 text-sm">
        Suggestion: <strong>{disproveRequest.suggestion.suspectName}</strong> with{" "}
        <strong>{disproveRequest.suggestion.weaponName}</strong> in{" "}
        <strong>{disproveRequest.suggestion.roomName}</strong>
      </p>
      <p className="text-cream/50 text-sm">Pick one matching card to show privately:</p>
      <div className="flex flex-wrap gap-3 justify-center">
        {disproveRequest.matchingCardsInHand.map((cardName) => (
          <ClueCard key={cardName} cardName={cardName} size="md" onClick={() => onShowCard(cardName)} />
        ))}
      </div>
      <Button variant="ghost" className="w-full" onClick={onPass} loading={isLoading}>
        I have no matching cards
      </Button>
    </div>
  );
}
