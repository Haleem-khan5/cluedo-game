"use client";

import {
  SUSPECTS,
  WEAPONS,
  ROOMS,
  PLAYER_COLORS,
  getCardEmoji,
  type Card,
} from "@/lib/game/constants";
import { cn } from "@/lib/utils";
import { shortPlayerName } from "@/lib/game/playerName";
import type { GameState } from "@/lib/game/engine";
import type { GridCellMark } from "@/types/multiplayer.types";
import {
  gridMarkKey,
  useMultiplayerGameStore,
} from "@/store/multiplayerGameStore";
import { Check, X, Layers } from "lucide-react";

interface DeductionGridProps {
  liveGameState: GameState;
  currentUserId?: string;
  privateHandCards: Card[];
  selectedSuspect: string | null;
  selectedRoom: string | null;
  selectedWeapon: string | null;
  onSelectSuspect: (name: string) => void;
  onSelectRoom: (name: string) => void;
  onSelectWeapon: (name: string) => void;
  isSelectionEnabled: boolean;
  revealedCardsByPlayer: Record<string, Set<Card>>;
  /** When this player must disprove — highlights the asked cards (and which they hold). */
  revealPrompt?: { askedCards: Card[]; matchingCards: Card[] };
  /** Reveal a held card straight from the grid during a disprove prompt. */
  onRevealCard?: (card: Card) => void;
}

const CATEGORY_STYLE = {
  suspect: {
    header: "text-violet-200 bg-violet-500/10 border-violet-500/20",
    accent: "text-violet-100",
    icon: "🕵️",
  },
  room: {
    header: "text-emerald-200 bg-emerald-500/10 border-emerald-500/20",
    accent: "text-emerald-100",
    icon: "🏠",
  },
  weapon: {
    header: "text-rose-200 bg-rose-500/10 border-rose-500/20",
    accent: "text-rose-100",
    icon: "🗡️",
  },
} as const;

function MarkCell({
  mark,
  onClick,
  disabled,
}: {
  mark: GridCellMark;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const base =
    "inline-flex w-9 h-9 items-center justify-center rounded-lg border transition-all text-sm font-bold leading-none";

  const content = (() => {
    switch (mark) {
      case "yes":
        return (
          <span className={cn(base, "border-emerald-500/40 bg-emerald-500/15 text-emerald-400")}>
            <Check className="w-[18px] h-[18px]" strokeWidth={3} />
          </span>
        );
      case "no":
        return (
          <span className={cn(base, "border-red-500/40 bg-red-500/15 text-red-400")}>
            <X className="w-[18px] h-[18px]" strokeWidth={3} />
          </span>
        );
      case "asked":
        return (
          <span className={cn(base, "border-amber-500/40 bg-amber-500/15 text-amber-300")}>?</span>
        );
      case "shown":
        return (
          <span className={cn(base, "border-sky-500/40 bg-sky-500/15 text-sky-300")}>!</span>
        );
      case "both":
        return (
          <span className={cn(base, "border-violet-500/40 bg-violet-500/15 text-violet-300 text-xs")}>
            ?!
          </span>
        );
      case "has":
        return (
          <span className={cn(base, "border-gold/40 bg-gold/10 text-gold")}>
            <Layers className="w-[18px] h-[18px]" />
          </span>
        );
      default:
        return (
          <span
            className={cn(
              base,
              "border-cream/8 bg-cream/[0.03] text-cream/20",
              !disabled && "hover:border-cream/25 hover:bg-cream/[0.06]"
            )}
          />
        );
    }
  })();

  if (disabled || !onClick) return content;

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
      title="Tap to cycle: ✓ has it → ✗ ruled out → ? asked → ! shown/asked for → ?! both"
    >
      {content}
    </button>
  );
}

export function DeductionGrid({
  liveGameState,
  currentUserId,
  privateHandCards,
  selectedSuspect,
  selectedRoom,
  selectedWeapon,
  onSelectSuspect,
  onSelectRoom,
  onSelectWeapon,
  isSelectionEnabled,
  revealedCardsByPlayer,
  revealPrompt,
  onRevealCard,
}: DeductionGridProps) {
  const playerGridMarks = useMultiplayerGameStore((s) => s.playerGridMarks);
  const cyclePlayerGridMark = useMultiplayerGameStore((s) => s.cyclePlayerGridMark);

  const allPlayers = liveGameState.players;

  const resolveMark = (playerUserId: string, cardName: Card): GridCellMark => {
    // Your own hand → "stack" icon. A card revealed to you by this player → confirmed tick (✓).
    if (playerUserId === currentUserId && privateHandCards.includes(cardName)) return "has";
    if (revealedCardsByPlayer[playerUserId]?.has(cardName)) return "yes";
    return playerGridMarks[gridMarkKey(playerUserId, cardName)] ?? "empty";
  };

  const isCellLocked = (playerUserId: string, cardName: Card): boolean => {
    if (playerUserId === currentUserId && privateHandCards.includes(cardName)) return true;
    if (revealedCardsByPlayer[playerUserId]?.has(cardName)) return true;
    return false;
  };

  const sections: {
    title: string;
    cards: readonly Card[];
    selected: string | null;
    onSelect: (n: string) => void;
    category: keyof typeof CATEGORY_STYLE;
  }[] = [
    { title: "Suspects", cards: SUSPECTS, selected: selectedSuspect, onSelect: onSelectSuspect, category: "suspect" },
    { title: "Locations", cards: ROOMS, selected: selectedRoom, onSelect: onSelectRoom, category: "room" },
    { title: "Weapons", cards: WEAPONS, selected: selectedWeapon, onSelect: onSelectWeapon, category: "weapon" },
  ];

  // Responsive sizing — panels wrap (never scroll). More players → wider panels → fewer per row.
  const playerCount = allPlayers.length;
  const NAME_COL_WIDTH = 128;
  const playerColWidth = 56;
  const panelMinWidth = NAME_COL_WIDTH + playerCount * playerColWidth;

  const matchingSet = new Set(revealPrompt?.matchingCards ?? []);
  const askedSet = new Set(revealPrompt?.askedCards ?? []);

  return (
    <div className="space-y-3">
      {/* Legend — explained once */}
      <div className="rounded-2xl bg-mansion-card border border-cream/10 shadow-xl px-4 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="text-[11px] uppercase tracking-wider text-cream/40 font-medium">
          Tap a cell to mark
        </span>
        {([
          ["yes", "Has it", "This player holds this card"],
          ["no", "Ruled out", "This player does not hold this card"],
          ["asked", "Asked", "This player asked about this card"],
          ["shown", "Shown / asked for", "Shown to, or asked of, this player"],
          ["both", "Asked & asked for", "Asked about it and was asked for it"],
        ] as const).map(([mark, label, tip]) => (
          <span key={mark} className="flex items-center gap-1.5" title={tip}>
            <MarkCell mark={mark} disabled />
            <span className="text-xs text-cream/55">{label}</span>
          </span>
        ))}
      </div>

      {/* Category panels — side by side, fill width, wrap as needed */}
      <div className="flex flex-wrap gap-3">
        {sections.map((section) => {
          const style = CATEGORY_STYLE[section.category];
          return (
            <div
              key={section.title}
              className="flex-1 rounded-2xl bg-mansion-card border border-cream/10 shadow-xl overflow-hidden self-start"
              style={{ minWidth: `${panelMinWidth}px` }}
            >
              <div
                className={cn(
                  "px-4 py-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-widest border-b",
                  style.header
                )}
              >
                <span className="text-base">{style.icon}</span>
                {section.title}
              </div>

              <table className="w-full table-fixed border-collapse text-sm">
                <colgroup>
                  <col />
                  {allPlayers.map((player) => (
                    <col key={player.id} style={{ width: `${playerColWidth}px` }} />
                  ))}
                </colgroup>
                <thead>
                  <tr className="border-b border-cream/10 bg-mansion-dark/30">
                    <th className="py-2 pl-4 text-left text-[10px] font-medium text-cream/35 uppercase tracking-wider">
                      Card
                    </th>
                    {allPlayers.map((player) => {
                      const colorHex =
                        PLAYER_COLORS.find((c) => c.id === player.color)?.hex ?? "#888";
                      const isSelf = player.userId === currentUserId;
                      return (
                        <th key={player.id} className="px-0.5 py-2 align-bottom" title={player.displayName}>
                          <span className="flex flex-col items-center gap-1">
                            <span
                              className={cn(
                                "text-[11px] font-semibold leading-tight w-full px-0.5 text-center break-words",
                                isSelf ? "text-gold" : "text-cream/80"
                              )}
                            >
                              {shortPlayerName(player.displayName)}
                            </span>
                            {isSelf && (
                              <span className="text-[8px] uppercase tracking-wider text-gold/80 bg-gold/15 px-1 rounded-full leading-tight">
                                you
                              </span>
                            )}
                            <span
                              className="h-1 w-7 rounded-full"
                              style={{ backgroundColor: colorHex }}
                            />
                          </span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {section.cards.map((cardName) => {
                    const isInOwnHand = privateHandCards.includes(cardName);
                    const isSelected = section.selected === cardName;
                    const isRevealMatch = matchingSet.has(cardName);
                    const isRevealAsked = askedSet.has(cardName);
                    const canRevealHere = isRevealMatch && !!onRevealCard;
                    const canSelect = isSelectionEnabled && !isInOwnHand;
                    const handleNameClick = canRevealHere
                      ? () => onRevealCard!(cardName)
                      : canSelect
                        ? () => section.onSelect(cardName)
                        : undefined;

                    return (
                      <tr
                        key={cardName}
                        className={cn(
                          "border-b border-cream/[0.05] transition-colors",
                          isInOwnHand && !isRevealAsked && "bg-gold/[0.06]",
                          isSelected && "bg-gold/10",
                          isRevealMatch &&
                            "bg-gold/[0.12] outline outline-2 -outline-offset-2 outline-gold",
                          isRevealAsked &&
                            !isRevealMatch &&
                            "bg-sky-500/[0.07] hover:bg-sky-500/[0.14]"
                        )}
                      >
                        <td className="py-1.5 pl-2.5 pr-1 align-middle">
                          <button
                            type="button"
                            onClick={handleNameClick}
                            disabled={!handleNameClick}
                            className={cn(
                              "flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-left transition-all",
                              canSelect && "cursor-pointer hover:bg-cream/[0.05]",
                              canRevealHere &&
                                "cursor-pointer hover:bg-gold/20 hover:scale-[1.01]",
                              isSelected && "ring-1 ring-gold/60"
                            )}
                          >
                            {canSelect && (
                              <span
                                className={cn(
                                  "w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center",
                                  isSelected ? "border-gold bg-gold" : "border-cream/30"
                                )}
                              >
                                {isSelected && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-mansion-dark" />
                                )}
                              </span>
                            )}
                            <span className="text-2xl shrink-0">{getCardEmoji(cardName)}</span>
                            <span
                              className={cn(
                                "font-medium truncate text-sm",
                                isInOwnHand && !canRevealHere
                                  ? "text-cream/45 line-through decoration-gold/40"
                                  : style.accent
                              )}
                            >
                              {cardName}
                            </span>
                            {canRevealHere ? (
                              <span className="ml-auto text-[9px] font-bold uppercase tracking-wide text-mansion-dark bg-gold px-1.5 py-0.5 rounded-full shrink-0 shadow">
                                Tap to reveal
                              </span>
                            ) : isInOwnHand ? (
                              <span className="ml-auto text-[9px] uppercase tracking-wide text-gold/90 bg-gold/15 border border-gold/30 px-1.5 py-0.5 rounded-full shrink-0">
                                Yours
                              </span>
                            ) : null}
                          </button>
                        </td>
                        {allPlayers.map((player) => {
                          const mark = resolveMark(player.userId, cardName);
                          const locked = isCellLocked(player.userId, cardName);
                          return (
                            <td key={player.id} className="px-1 py-1.5 text-center align-middle">
                              <MarkCell
                                mark={mark}
                                disabled={locked}
                                onClick={
                                  locked
                                    ? undefined
                                    : () => cyclePlayerGridMark(player.userId, cardName)
                                }
                              />
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}
