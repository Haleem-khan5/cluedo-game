"use client";

import { Button } from "@/components/ui/Button";
import { ClueCard } from "./ClueCard";
import { CATEGORY_LABEL, type CardCategory } from "@/lib/game/cardDisplay";
import type { Card } from "@/lib/game/constants";
import { cn } from "@/lib/utils";
import { Search, MessageCircle, Hand, Eye } from "lucide-react";

interface TurnActionPanelProps {
  isYourTurn: boolean;
  activePlayerName: string;
  selectedSuspect: string | null;
  selectedRoom: string | null;
  selectedWeapon: string | null;
  canAccuse: boolean;
  isLoading: boolean;
  /** Card most recently revealed privately to this player. */
  revealedCard?: Card | null;
  /** Interrogation currently being resolved — shown to onlookers. */
  activeInterrogation?: {
    askerName: string;
    targetName: string;
    suspect: string;
    room: string;
    weapon: string;
  };
  /** Countdown for the active turn — hidden while a reveal is in progress. */
  turnProgress?: { secondsLeft: number; total: number };
  onInterrogate: () => void;
  onAccuse: () => void;
  revealMode?: {
    interrogatorName: string;
    suspect: string;
    room: string;
    weapon: string;
    matchingCards: Card[];
    onReveal: (card: Card) => void;
    onPass?: () => void;
  };
}

function EmptySlot({ category }: { category: CardCategory }) {
  return (
    <div className="w-24 h-36 rounded-xl border-2 border-dashed border-cream/15 bg-cream/[0.02] flex flex-col items-center justify-center gap-2 text-center">
      <span className="text-cream/20 text-2xl leading-none">+</span>
      <span className="text-[10px] uppercase tracking-wide text-cream/35">
        {CATEGORY_LABEL[category]}
      </span>
    </div>
  );
}

export function TurnActionPanel({
  isYourTurn,
  activePlayerName,
  selectedSuspect,
  selectedRoom,
  selectedWeapon,
  canAccuse,
  isLoading,
  revealedCard,
  activeInterrogation,
  turnProgress,
  onInterrogate,
  onAccuse,
  revealMode,
}: TurnActionPanelProps) {
  const allSelected = selectedSuspect && selectedRoom && selectedWeapon;
  const showTimer = turnProgress && !activeInterrogation;
  const timerPct = turnProgress
    ? Math.max(0, Math.min(100, (turnProgress.secondsLeft / turnProgress.total) * 100))
    : 0;
  const timerLow = turnProgress ? turnProgress.secondsLeft <= 10 : false;

  if (revealMode) {
    const hasMatch = revealMode.matchingCards.length > 0;
    return (
      <div className="rounded-2xl border-2 border-gold/40 bg-mansion-card shadow-xl p-5 w-full">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
          <h2 className="font-serif text-lg text-cream">Interrogation</h2>
        </div>
        <p className="text-sm text-cream/55 mb-4">
          <span className="text-gold font-medium">{revealMode.interrogatorName}</span> asked
          about these three:
        </p>

        <div className="flex flex-wrap justify-center gap-2.5 mb-5">
          <ClueCard cardName={revealMode.suspect as Card} size="md" />
          <ClueCard cardName={revealMode.room as Card} size="md" />
          <ClueCard cardName={revealMode.weapon as Card} size="md" />
        </div>

        {hasMatch ? (
          <>
            <div className="rounded-xl bg-gold/10 border border-gold/25 text-gold text-sm text-center py-2.5 px-3 mb-3 flex items-center justify-center gap-2">
              <Hand className="w-4 h-4" />
              Pick a card you hold to prove it
            </div>
            <div className="flex flex-wrap justify-center gap-2.5">
              {revealMode.matchingCards.map((card) => (
                <ClueCard
                  key={card}
                  cardName={card}
                  size="md"
                  onClick={isLoading ? undefined : () => revealMode.onReveal(card)}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-cream/50 text-center mb-3">
              You hold none of these cards.
            </p>
            <Button
              variant="ghost"
              size="lg"
              className="w-full"
              onClick={revealMode.onPass}
              loading={isLoading}
            >
              Pass — no matching cards
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border-2 bg-mansion-card shadow-xl p-5 w-full transition-all",
        isYourTurn ? "border-gold/40" : "border-cream/10"
      )}
    >
      {showTimer && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider mb-1.5">
            <span className="text-cream/40">Turn timer</span>
            <span className={cn(timerLow ? "text-red-400" : "text-cream/50")}>
              {Math.ceil(turnProgress!.secondsLeft)}s
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-cream/10 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-200 ease-linear",
                timerLow ? "bg-red-500" : "bg-gold"
              )}
              style={{ width: `${timerPct}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        <span
          className={cn(
            "w-2 h-2 rounded-full",
            isYourTurn ? "bg-gold animate-pulse" : "bg-cream/30"
          )}
        />
        <h2 className="font-serif text-lg text-cream">
          {isYourTurn ? "Your turn" : `${activePlayerName}'s turn`}
        </h2>
      </div>

      {activeInterrogation && (
        <div className="mb-4 rounded-xl border border-gold/25 bg-gold/[0.06] p-3">
          <p className="text-[11px] uppercase tracking-wider text-gold/80 mb-1.5 flex items-center gap-1.5">
            <MessageCircle className="w-3.5 h-3.5" /> Interrogation in progress
          </p>
          <p className="text-xs text-cream/60 mb-3">
            <span className="text-cream font-medium">{activeInterrogation.askerName}</span> is
            asking <span className="text-cream font-medium">{activeInterrogation.targetName}</span>{" "}
            about:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <ClueCard cardName={activeInterrogation.suspect as Card} size="sm" />
            <ClueCard cardName={activeInterrogation.room as Card} size="sm" />
            <ClueCard cardName={activeInterrogation.weapon as Card} size="sm" />
          </div>
        </div>
      )}

      {revealedCard && (
        <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3">
          <p className="text-[11px] uppercase tracking-wider text-emerald-300/80 mb-2 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" /> Clue revealed to you
          </p>
          <div className="flex items-center gap-3">
            <ClueCard cardName={revealedCard} size="sm" />
            <p className="text-xs text-cream/55 leading-relaxed">
              Someone holds <span className="text-cream font-medium">{revealedCard}</span> — so it
              is <span className="text-emerald-300">not</span> part of the mystery.
            </p>
          </div>
        </div>
      )}

      {isYourTurn ? (
        <>
          <p className="text-[11px] uppercase tracking-wider text-cream/40 mb-2">
            Your case file
          </p>
          <div className="flex flex-wrap justify-center gap-2.5 mb-4">
            {selectedSuspect ? (
              <ClueCard cardName={selectedSuspect as Card} size="md" />
            ) : (
              <EmptySlot category="suspect" />
            )}
            {selectedRoom ? (
              <ClueCard cardName={selectedRoom as Card} size="md" />
            ) : (
              <EmptySlot category="room" />
            )}
            {selectedWeapon ? (
              <ClueCard cardName={selectedWeapon as Card} size="md" />
            ) : (
              <EmptySlot category="weapon" />
            )}
          </div>

          {!allSelected && (
            <p className="text-xs text-cream/45 text-center mb-4">
              Tick one suspect, location &amp; weapon from the sheet to build your case.
            </p>
          )}

          <div className="flex gap-2.5">
            <Button
              variant="ghost"
              size="lg"
              className="flex-1"
              disabled={!allSelected || !canAccuse || isLoading}
              onClick={onAccuse}
            >
              <Search className="w-4 h-4" /> Accuse
            </Button>
            <Button
              variant="gold"
              size="lg"
              className="flex-1"
              disabled={!allSelected || isLoading}
              onClick={onInterrogate}
            >
              <MessageCircle className="w-4 h-4" /> Interrogate
            </Button>
          </div>
          <p className="text-[11px] text-cream/35 text-center mt-3 leading-relaxed">
            <span className="text-cream/55">Interrogate</span> to gather clues ·{" "}
            <span className="text-cream/55">Accuse</span> only when certain — a wrong accusation
            eliminates you.
          </p>
        </>
      ) : (
        <div className="text-center py-6">
          <p className="text-sm text-cream/50">Waiting for</p>
          <p className="font-serif text-cream text-base mt-0.5">{activePlayerName}…</p>
        </div>
      )}
    </div>
  );
}
