"use client";

import {
  Dices,
  DoorOpen,
  Flag,
  SkipForward,
  Swords,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Room } from "@/lib/game/constants";
import type { TurnPhase } from "@/lib/game/engine";

interface GameActionToolbarProps {
  /** Current turn phase from server. */
  currentTurnPhase: TurnPhase;
  /** Whether the viewer is the active player. */
  isCurrentPlayerTurn: boolean;
  /** Whether the game has finished. */
  isGameFinished: boolean;
  /** Rooms reachable via secret passage this turn. */
  secretPassageDestinationRooms: Room[];
  /** Whether this player may still make a final accusation. */
  canMakeAccusation: boolean;
  /** Whether an async action is in flight. */
  isActionLoading: boolean;
  onRollDice: () => void;
  onOpenSuggestionModal: () => void;
  onOpenAccusationModal: () => void;
  onEndTurn: () => void;
  onUseSecretPassage: (destinationRoom: Room) => void;
}

/**
 * Contextual action buttons shown during the active player's turn.
 */
export function GameActionToolbar({
  currentTurnPhase,
  isCurrentPlayerTurn,
  isGameFinished,
  secretPassageDestinationRooms,
  canMakeAccusation,
  isActionLoading,
  onRollDice,
  onOpenSuggestionModal,
  onOpenAccusationModal,
  onEndTurn,
  onUseSecretPassage,
}: GameActionToolbarProps) {
  if (!isCurrentPlayerTurn || isGameFinished) return null;

  return (
    <div className="rounded-2xl border border-cream/10 bg-mansion-card/60 p-4">
      <p className="text-xs uppercase tracking-wider text-cream/40 mb-3">Your Actions</p>
      <div className="flex flex-wrap gap-2">
        {currentTurnPhase === "roll" && (
          <Button variant="gold" onClick={onRollDice} loading={isActionLoading}>
            <Dices className="w-5 h-5" /> Roll Dice
          </Button>
        )}

        {currentTurnPhase === "move" &&
          secretPassageDestinationRooms.map((destinationRoom) => (
            <Button
              key={destinationRoom}
              variant="secondary"
              size="sm"
              onClick={() => onUseSecretPassage(destinationRoom)}
              loading={isActionLoading}
            >
              <DoorOpen className="w-4 h-4" />
              Secret → {destinationRoom}
            </Button>
          ))}

        {currentTurnPhase === "suggest" && (
          <Button variant="primary" onClick={onOpenSuggestionModal} loading={isActionLoading}>
            <Swords className="w-5 h-5" /> Make Suggestion
          </Button>
        )}

        {(currentTurnPhase === "accuse" || currentTurnPhase === "suggest") && canMakeAccusation && (
          <Button variant="danger" onClick={onOpenAccusationModal} loading={isActionLoading}>
            <Flag className="w-5 h-5" /> Final Accusation
          </Button>
        )}

        {(currentTurnPhase === "accuse" || currentTurnPhase === "end") && (
          <Button variant="ghost" onClick={onEndTurn} loading={isActionLoading}>
            <SkipForward className="w-5 h-5" /> End Turn
          </Button>
        )}
      </div>
    </div>
  );
}
