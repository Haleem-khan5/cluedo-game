"use client";

import { Button } from "@/components/ui/Button";
import { ClueCard } from "./ClueCard";
import { CATEGORY_LABEL, type CardCategory } from "@/lib/game/cardDisplay";
import type { Card } from "@/lib/game/constants";
import { cn } from "@/lib/utils";
import { Search, MessageCircle, Hand, Check, X, Loader2 } from "lucide-react";

interface AskSequenceEntry {
  name: string;
  status: "passed" | "asking" | "waiting";
  isYou: boolean;
}

interface TurnActionPanelProps {
  isYourTurn: boolean;
  activePlayerName: string;
  selectedSuspect: string | null;
  selectedRoom: string | null;
  selectedWeapon: string | null;
  canAccuse: boolean;
  isLoading: boolean;
  /** Latest public game event — replaces toasts. */
  statusMessage?: string;
  /** Card most recently revealed privately to this player. */
  revealedCard?: Card | null;
  /** Acknowledge the revealed clue (collapses the notice). */
  onAcknowledgeReveal?: () => void;
  /** Interrogation currently being resolved — shown to onlookers. */
  activeInterrogation?: {
    askerName: string;
    targetName: string;
    suspect: string;
    room: string;
    weapon: string;
    askSequence?: AskSequenceEntry[];
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
    <div className="w-[4.5rem] h-[6.75rem] rounded-xl border-2 border-dashed border-cream/15 bg-cream/[0.02] flex flex-col items-center justify-center gap-1.5 text-center">
      <span className="text-cream/20 text-xl leading-none">+</span>
      <span className="text-[9px] uppercase tracking-wide text-cream/35">
        {CATEGORY_LABEL[category]}
      </span>
    </div>
  );
}

/** A single suggested card with an optional "ruled out" overlay when it matches a revealed clue. */
function SuggestedCard({ card, ruledOut }: { card: Card; ruledOut?: boolean }) {
  return (
    <div className="relative">
      <div className={cn("transition-opacity", ruledOut && "opacity-40")}>
        <ClueCard cardName={card} size="sm" />
      </div>
      {ruledOut && (
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-emerald-950/70 border-2 border-emerald-400/60">
          <Check className="w-5 h-5 text-emerald-300" strokeWidth={3} />
          <span className="text-[9px] uppercase tracking-wider text-emerald-300 mt-0.5">
            Ruled out
          </span>
        </div>
      )}
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
  statusMessage,
  revealedCard,
  onAcknowledgeReveal,
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
    const matchSet = new Set(revealMode.matchingCards);
    const hasMatch = revealMode.matchingCards.length > 0;
    const askedCards = [
      revealMode.suspect,
      revealMode.room,
      revealMode.weapon,
    ] as Card[];

    return (
      <div className="rounded-2xl border-2 border-gold/50 bg-mansion-card shadow-xl p-4 w-full ring-2 ring-gold/20">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
          <h2 className="font-serif text-base text-cream">You’re being asked</h2>
        </div>
        <p className="text-xs text-cream/60 mb-3">
          <span className="text-gold font-medium">{revealMode.interrogatorName}</span>{" "}
          {hasMatch
            ? "wants proof — tap one of your highlighted cards to reveal it."
            : "asked about these. You hold none of them."}
        </p>

        <div className="flex flex-wrap justify-center gap-2.5 mb-3">
          {askedCards.map((card) => {
            const held = matchSet.has(card);
            return (
              <div key={card} className="relative">
                <div
                  className={cn(
                    "rounded-xl transition-shadow",
                    held &&
                      "ring-2 ring-gold ring-offset-2 ring-offset-mansion-card shadow-[0_0_18px_rgba(212,175,55,0.45)]"
                  )}
                >
                  <ClueCard
                    cardName={card}
                    size="sm"
                    onClick={held && !isLoading ? () => revealMode.onReveal(card) : undefined}
                  />
                </div>
                {held && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-wide text-mansion-dark bg-gold px-1.5 py-0.5 rounded-full shadow whitespace-nowrap">
                    Yours · tap
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {hasMatch ? (
          <div className="rounded-lg bg-gold/10 border border-gold/25 text-gold/90 text-[11px] text-center py-2 px-3 flex items-center justify-center gap-1.5">
            <Hand className="w-3.5 h-3.5" />
            The glowing card(s) are in your hand — reveal one.
          </div>
        ) : (
          <Button
            variant="ghost"
            size="md"
            className="w-full"
            onClick={revealMode.onPass}
            loading={isLoading}
          >
            Pass — I have none of these
          </Button>
        )}
      </div>
    );
  }

  const interrogationCards = activeInterrogation
    ? ([activeInterrogation.suspect, activeInterrogation.room, activeInterrogation.weapon] as Card[])
    : [];
  const revealMatchesInterrogation =
    !!revealedCard && interrogationCards.includes(revealedCard);

  return (
    <div
      className={cn(
        "rounded-2xl border-2 bg-mansion-card shadow-xl p-4 w-full transition-all",
        isYourTurn ? "border-gold/40" : "border-cream/10"
      )}
    >
      {/* Header row — turn label + inline timer */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className={cn(
            "w-2 h-2 rounded-full shrink-0",
            isYourTurn ? "bg-gold animate-pulse" : "bg-cream/30"
          )}
        />
        <h2 className="font-serif text-base text-cream flex-1 min-w-0 truncate">
          {isYourTurn ? "Your turn" : `${activePlayerName}'s turn`}
        </h2>
        {showTimer && (
          <span
            className={cn(
              "text-xs tabular-nums font-medium shrink-0",
              timerLow ? "text-red-400" : "text-cream/50"
            )}
          >
            {Math.ceil(turnProgress!.secondsLeft)}s
          </span>
        )}
      </div>

      {showTimer && (
        <div className="h-1 rounded-full bg-cream/10 overflow-hidden mb-3">
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-200 ease-linear",
              timerLow ? "bg-red-500" : "bg-gold"
            )}
            style={{ width: `${timerPct}%` }}
          />
        </div>
      )}

      {statusMessage && (
        <div className="mb-3 rounded-lg bg-cream/[0.04] border border-cream/10 px-3 py-2 text-xs text-cream/65 leading-snug">
          {statusMessage}
        </div>
      )}

      {/* Active interrogation — the three suggested cards double as the reveal display */}
      {activeInterrogation && (
        <div className="mb-3 rounded-xl border border-gold/25 bg-gold/[0.06] p-3">
          <p className="text-[11px] uppercase tracking-wider text-gold/80 mb-2 flex items-center gap-1.5">
            <MessageCircle className="w-3.5 h-3.5" />
            {activeInterrogation.askerName} is interrogating
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {interrogationCards.map((card) => (
              <SuggestedCard
                key={card}
                card={card}
                ruledOut={revealMatchesInterrogation && card === revealedCard}
              />
            ))}
          </div>

          {activeInterrogation.askSequence && activeInterrogation.askSequence.length > 0 && (
            <div className="mt-3 space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-cream/35">Asking in order</p>
              {activeInterrogation.askSequence.map((entry, i) => (
                <div
                  key={`${entry.name}-${i}`}
                  className={cn(
                    "flex items-center gap-2 text-xs rounded-md px-2 py-1.5",
                    entry.status === "asking" && "bg-gold/10"
                  )}
                >
                  <span className="text-cream/30 w-4 text-center shrink-0">{i + 1}</span>
                  {entry.status === "passed" ? (
                    <X className="w-3.5 h-3.5 text-red-400 shrink-0" strokeWidth={3} />
                  ) : entry.status === "asking" ? (
                    <Loader2 className="w-3.5 h-3.5 text-gold animate-spin shrink-0" />
                  ) : (
                    <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-cream/25" />
                    </span>
                  )}
                  <span
                    className={cn(
                      "font-medium",
                      entry.status === "asking"
                        ? "text-cream"
                        : entry.status === "passed"
                          ? "text-cream/40"
                          : "text-cream/55"
                    )}
                  >
                    {entry.isYou ? "You" : entry.name}
                  </span>
                  <span className="ml-auto text-cream/40">
                    {entry.status === "passed"
                      ? "no cards"
                      : entry.status === "asking"
                        ? "answering…"
                        : "waiting"}
                  </span>
                </div>
              ))}
            </div>
          )}

          {revealMatchesInterrogation && (
            <button
              onClick={onAcknowledgeReveal}
              className="mt-2.5 w-full rounded-lg bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 text-xs py-2 flex items-center justify-center gap-1.5 hover:bg-emerald-500/25 transition-colors"
            >
              <Check className="w-3.5 h-3.5" /> Got it — clear clue
            </button>
          )}
        </div>
      )}

      {/* Standalone revealed clue (when it isn't already shown inline above) */}
      {revealedCard && !revealMatchesInterrogation && (
        <button
          onClick={onAcknowledgeReveal}
          className="mb-3 w-full text-left rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3 flex items-center gap-3 hover:bg-emerald-950/45 transition-colors group"
        >
          <ClueCard cardName={revealedCard} size="sm" />
          <span className="flex-1 min-w-0">
            <span className="text-[11px] uppercase tracking-wider text-emerald-300/80 block mb-0.5">
              Clue revealed
            </span>
            <span className="text-xs text-cream/60 leading-snug block">
              <span className="text-cream font-medium">{revealedCard}</span> is{" "}
              <span className="text-emerald-300">not</span> part of the mystery.
            </span>
            <span className="text-[11px] text-emerald-300/90 mt-1.5 inline-flex items-center gap-1 group-hover:text-emerald-200">
              <Check className="w-3.5 h-3.5" /> Tap to dismiss
            </span>
          </span>
        </button>
      )}

      {isYourTurn ? (
        <>
          <p className="text-[11px] uppercase tracking-wider text-cream/40 mb-2">
            Your case file
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-3">
            {selectedSuspect ? (
              <ClueCard cardName={selectedSuspect as Card} size="sm" />
            ) : (
              <EmptySlot category="suspect" />
            )}
            {selectedRoom ? (
              <ClueCard cardName={selectedRoom as Card} size="sm" />
            ) : (
              <EmptySlot category="room" />
            )}
            {selectedWeapon ? (
              <ClueCard cardName={selectedWeapon as Card} size="sm" />
            ) : (
              <EmptySlot category="weapon" />
            )}
          </div>

          {!allSelected && (
            <p className="text-xs text-cream/45 text-center mb-3">
              Tick one suspect, location &amp; weapon from the sheet to build your case.
            </p>
          )}

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="md"
              className="flex-1"
              disabled={!allSelected || !canAccuse || isLoading}
              onClick={onAccuse}
            >
              <Search className="w-4 h-4" /> Accuse
            </Button>
            <Button
              variant="gold"
              size="md"
              className="flex-1"
              disabled={!allSelected || isLoading}
              onClick={onInterrogate}
            >
              <MessageCircle className="w-4 h-4" /> Interrogate
            </Button>
          </div>
        </>
      ) : (
        !activeInterrogation && (
          <div className="text-center py-4">
            <p className="text-xs text-cream/45">Waiting for</p>
            <p className="font-serif text-cream text-sm mt-0.5">{activePlayerName}…</p>
          </div>
        )
      )}
    </div>
  );
}
