"use client";

import { motion } from "framer-motion";
import {
  Crown,
  Dices,
  Footprints,
  MessageSquareWarning,
  Scale,
  Timer,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { GameState } from "@/lib/game/engine";
import { PLAYER_COLORS } from "@/lib/game/constants";

interface TurnStatusPanelProps {
  /** Full game state from the server (hands stripped for other players). */
  liveGameState: GameState;
  /** Authenticated user id of the viewer. */
  currentUserId?: string;
  /** Whether it is this player's turn. */
  isCurrentPlayerTurn: boolean;
}

const phaseLabels: Record<string, { label: string; icon: typeof Dices }> = {
  roll: { label: "Roll the dice", icon: Dices },
  move: { label: "Move your token", icon: Footprints },
  suggest: { label: "Make a suggestion", icon: MessageSquareWarning },
  disprove: { label: "Disproving suggestion", icon: Scale },
  accuse: { label: "Suggest or accuse", icon: Scale },
  end: { label: "End your turn", icon: Timer },
};

/**
 * Header strip showing whose turn it is, dice result, and current phase.
 */
export function TurnStatusPanel({
  liveGameState,
  currentUserId,
  isCurrentPlayerTurn,
}: TurnStatusPanelProps) {
  const activeTurnPlayer = liveGameState.players[liveGameState.turnIndex];
  const phaseInfo = phaseLabels[liveGameState.phase] ?? {
    label: liveGameState.phase,
    icon: Timer,
  };
  const PhaseIcon = phaseInfo.icon;

  const playerColorHex =
    PLAYER_COLORS.find((c) => c.id === activeTurnPlayer?.color)?.hex ?? "#888";

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 transition-all duration-300",
        isCurrentPlayerTurn
          ? "border-gold/40 bg-gradient-to-r from-gold/10 via-mansion-card to-gold/5 shadow-lg shadow-gold/10"
          : "border-cream/10 bg-mansion-card/80"
      )}
    >
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[200px]">
          <div
            className={cn(
              "w-11 h-11 rounded-full border-2 flex items-center justify-center",
              isCurrentPlayerTurn ? "border-gold animate-pulse" : "border-white/20"
            )}
            style={{ backgroundColor: playerColorHex }}
          >
            <User className="w-5 h-5 text-white drop-shadow" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-cream/45">
              {isCurrentPlayerTurn ? "Your Turn" : "Current Turn"}
            </p>
            <p className="font-serif text-xl text-cream flex items-center gap-2">
              {activeTurnPlayer?.displayName}
              {activeTurnPlayer?.userId === liveGameState.players.find(p => p.userId === currentUserId)?.userId && (
                <Crown className="w-4 h-4 text-gold" />
              )}
            </p>
          </div>
        </div>

        {liveGameState.diceRoll !== null && (
          <motion.div
            key={liveGameState.diceRoll}
            initial={{ rotate: -180, scale: 0.5 }}
            animate={{ rotate: 0, scale: 1 }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-mansion-dark/70 border border-gold/20"
          >
            <Dices className="w-5 h-5 text-gold" />
            <span className="text-3xl font-bold text-cream tabular-nums">
              {liveGameState.diceRoll}
            </span>
          </motion.div>
        )}

        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-mansion-dark/50 border border-cream/10">
          <PhaseIcon className="w-4 h-4 text-gold shrink-0" />
          <span className="text-sm text-cream/80 capitalize">{phaseInfo.label}</span>
        </div>
      </div>
    </div>
  );
}
