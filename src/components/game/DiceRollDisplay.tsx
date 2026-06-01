"use client";

import { motion } from "framer-motion";
import { Dices } from "lucide-react";

interface DiceRollDisplayProps {
  /** Last dice roll value (1–6), or null before rolling. */
  diceValue: number | null;
  /** Whether the roll animation should play. */
  isRolling?: boolean;
}

/** Animated dice display for the active turn. */
export function DiceRollDisplay({ diceValue, isRolling }: DiceRollDisplayProps) {
  if (diceValue === null && !isRolling) {
    return (
      <div className="flex flex-col items-center justify-center p-6 rounded-2xl border border-dashed border-cream/15 bg-mansion-dark/30">
        <Dices className="w-10 h-10 text-cream/25 mb-2" />
        <p className="text-sm text-cream/40">Roll to begin moving</p>
      </div>
    );
  }

  return (
    <motion.div
      animate={isRolling ? { rotate: [0, 90, 180, 270, 360] } : {}}
      transition={{ duration: 0.6 }}
      className="relative flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-br from-gold/20 to-burgundy/20 border border-gold/30 shadow-inner"
    >
      <Dices className="w-8 h-8 text-gold/60 absolute top-3 right-3" />
      <motion.span
        key={diceValue}
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        className="text-6xl font-black text-cream drop-shadow-lg tabular-nums"
      >
        {diceValue ?? "?"}
      </motion.span>
      <p className="text-xs uppercase tracking-wider text-gold/80 mt-2">Steps remaining</p>
    </motion.div>
  );
}
