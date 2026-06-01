"use client";

import { SUSPECTS, WEAPONS, ROOMS } from "@/lib/game/constants";
import { useMultiplayerGameStore } from "@/store/multiplayerGameStore";
import { cn } from "@/lib/utils";
import type { DetectiveNoteMark } from "@/types/multiplayer.types";
import { ClipboardList, HelpCircle, X, Check, Minus } from "lucide-react";

const noteMarkCycle: DetectiveNoteMark[] = ["unknown", "maybe", "ruled-out", "confirmed"];

const noteMarkStyles: Record<DetectiveNoteMark, string> = {
  unknown: "bg-mansion-dark/40 text-cream/30 border-cream/10",
  maybe: "bg-amber-900/40 text-amber-300 border-amber-500/30",
  "ruled-out": "bg-red-900/40 text-red-300 border-red-500/30 line-through",
  confirmed: "bg-emerald-900/60 text-emerald-300 border-emerald-500/30",
};

const noteMarkIcons: Record<DetectiveNoteMark, typeof HelpCircle> = {
  unknown: Minus,
  maybe: HelpCircle,
  "ruled-out": X,
  confirmed: Check,
};

function DetectiveNoteCell({
  cardName,
  currentMark,
  onMarkChange,
}: {
  cardName: string;
  currentMark: DetectiveNoteMark;
  onMarkChange: (mark: DetectiveNoteMark) => void;
}) {
  const cycleNoteMark = () => {
    const currentIndex = noteMarkCycle.indexOf(currentMark);
    const nextMark = noteMarkCycle[(currentIndex + 1) % noteMarkCycle.length];
    onMarkChange(nextMark);
  };

  const MarkIcon = noteMarkIcons[currentMark];

  return (
    <button
      onClick={cycleNoteMark}
      title={cardName}
      className={cn(
        "w-full aspect-square rounded-lg text-xs font-medium transition-all border flex items-center justify-center",
        "hover:scale-105 active:scale-95",
        noteMarkStyles[currentMark]
      )}
    >
      <MarkIcon className="w-3.5 h-3.5" />
    </button>
  );
}

/** Interactive deduction grid — local only, not synced to server. */
export function DetectiveNotes() {
  const { detectiveNotesSheet, updateDetectiveNote } = useMultiplayerGameStore();

  const getMarkForCard = (cardName: string): DetectiveNoteMark =>
    detectiveNotesSheet[cardName] ?? "unknown";

  const NoteSection = ({
    sectionTitle,
    cardNames,
  }: {
    sectionTitle: string;
    cardNames: readonly string[];
  }) => (
    <div>
      <h4 className="text-xs uppercase tracking-wider text-gold/80 mb-2">{sectionTitle}</h4>
      <div className="grid grid-cols-3 gap-1.5">
        {cardNames.map((cardName) => (
          <div key={cardName} className="text-center">
            <p className="text-[9px] text-cream/50 truncate mb-1 px-0.5">{cardName}</p>
            <DetectiveNoteCell
              cardName={cardName}
              currentMark={getMarkForCard(cardName)}
              onMarkChange={(mark) => updateDetectiveNote(cardName, mark)}
            />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="rounded-2xl bg-mansion-card/80 border border-cream/10 p-4 space-y-4">
      <h3 className="font-serif text-lg text-cream flex items-center gap-2">
        <ClipboardList className="w-5 h-5 text-gold" />
        Detective Notes
      </h3>
      <p className="text-xs text-cream/45 flex items-center gap-1">
        Tap to cycle: <Minus className="w-3 h-3" /> → <HelpCircle className="w-3 h-3" /> →{" "}
        <X className="w-3 h-3" /> → <Check className="w-3 h-3" />
      </p>
      <NoteSection sectionTitle="Suspects" cardNames={SUSPECTS} />
      <NoteSection sectionTitle="Weapons" cardNames={WEAPONS} />
      <NoteSection sectionTitle="Rooms" cardNames={ROOMS} />
    </div>
  );
}
