"use client";

import { BookOpen } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { GameGuidebook } from "./GameGuidebook";
import { guidebookSections } from "@/lib/game/guidebookContent";

interface RulesModalProps {
  open: boolean;
  onClose: () => void;
  /** When true, only shows the in-game essentials. */
  compact?: boolean;
}

/** Rules shown as a large popup card — returns to the previous screen on close. */
export function RulesModal({ open, onClose, compact }: RulesModalProps) {
  const sections = compact
    ? guidebookSections.filter((s) =>
        ["turn", "suggestions", "accusation", "notes"].includes(s.id)
      )
    : guidebookSections;

  return (
    <Modal open={open} onClose={onClose} title="" size="xl">
      <div className="space-y-5 -mt-2">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gold/10 border border-gold/25 flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-6 h-6 text-gold" />
          </div>
          <h2 className="font-serif text-2xl text-cream">Detective&apos;s Guidebook</h2>
          <p className="text-sm text-cream/50 mt-1">
            Everything you need to crack the case.
          </p>
        </div>
        <GameGuidebook sections={sections} compact={compact} />
      </div>
    </Modal>
  );
}
