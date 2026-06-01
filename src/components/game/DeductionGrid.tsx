"use client";

import { Fragment } from "react";
import {
  SUSPECTS,
  WEAPONS,
  ROOMS,
  PLAYER_COLORS,
  getCardEmoji,
  type Card,
} from "@/lib/game/constants";
import { cn } from "@/lib/utils";
import type { GameState } from "@/lib/game/engine";
import type { GridCellMark } from "@/types/multiplayer.types";
import {
  gridMarkKey,
  useMultiplayerGameStore,
} from "@/store/multiplayerGameStore";
import { Check, X, HelpCircle, Layers } from "lucide-react";

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
}

const CATEGORY_STYLE = {
  suspect: {
    header:
      "text-violet-200 bg-gradient-to-r from-violet-900/60 via-violet-950/40 to-transparent border-y border-violet-500/20",
    row: "hover:bg-violet-500/[0.06]",
    accent: "text-violet-200/90",
    dot: "bg-violet-400",
    icon: "🕵️",
  },
  room: {
    header:
      "text-emerald-200 bg-gradient-to-r from-emerald-900/60 via-emerald-950/40 to-transparent border-y border-emerald-500/20",
    row: "hover:bg-emerald-500/[0.06]",
    accent: "text-emerald-200/90",
    dot: "bg-emerald-400",
    icon: "🏠",
  },
  weapon: {
    header:
      "text-rose-200 bg-gradient-to-r from-rose-900/60 via-rose-950/40 to-transparent border-y border-rose-500/20",
    row: "hover:bg-rose-500/[0.06]",
    accent: "text-rose-200/90",
    dot: "bg-rose-400",
    icon: "🗡️",
  },
} as const;

function MarkLegend() {
  const items = [
    { mark: "yes" as const, label: "Has it" },
    { mark: "no" as const, label: "Ruled out" },
    { mark: "maybe" as const, label: "Maybe" },
  ];
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 mb-3 pb-3 border-b border-cream/10">
      <span className="text-[10px] uppercase tracking-wider text-cream/35">
        Tap to cycle
      </span>
      {items.map(({ mark, label }) => (
        <span key={mark} className="flex items-center gap-1.5">
          <MarkCell mark={mark} disabled />
          <span className="text-[10px] text-cream/45">{label}</span>
        </span>
      ))}
    </div>
  );
}

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
    "inline-flex w-8 h-8 items-center justify-center rounded-lg border transition-all text-xs font-bold";

  const content = (() => {
    switch (mark) {
      case "yes":
        return (
          <span className={cn(base, "border-emerald-500/40 bg-emerald-500/15 text-emerald-400")}>
            <Check className="w-4 h-4" strokeWidth={3} />
          </span>
        );
      case "no":
        return (
          <span className={cn(base, "border-red-500/40 bg-red-500/15 text-red-400")}>
            <X className="w-4 h-4" strokeWidth={3} />
          </span>
        );
      case "maybe":
        return (
          <span className={cn(base, "border-amber-500/40 bg-amber-500/15 text-amber-400")}>
            <HelpCircle className="w-4 h-4" strokeWidth={2.5} />
          </span>
        );
      case "has":
        return (
          <span className={cn(base, "border-gold/40 bg-gold/10 text-gold")}>
            <Layers className="w-4 h-4" />
          </span>
        );
      default:
        return (
          <span
            className={cn(
              base,
              "border-cream/8 bg-cream/[0.03] text-cream/20",
              !disabled && "hover:border-cream/20 hover:bg-cream/[0.06] hover:text-cream/40"
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
      title="Click to cycle: ✓ → ✗ → ? → card"
    >
      {content}
    </button>
  );
}

function firstName(displayName: string): string {
  return displayName.split(" ")[0] ?? displayName;
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
}: DeductionGridProps) {
  const playerGridMarks = useMultiplayerGameStore((s) => s.playerGridMarks);
  const cyclePlayerGridMark = useMultiplayerGameStore((s) => s.cyclePlayerGridMark);

  const allPlayers = liveGameState.players;

  const resolveMark = (playerUserId: string, cardName: Card): GridCellMark => {
    if (playerUserId === currentUserId && privateHandCards.includes(cardName)) {
      return "has";
    }
    if (revealedCardsByPlayer[playerUserId]?.has(cardName)) {
      return "has";
    }
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
    {
      title: "Suspects",
      cards: SUSPECTS,
      selected: selectedSuspect,
      onSelect: onSelectSuspect,
      category: "suspect",
    },
    {
      title: "Locations",
      cards: ROOMS,
      selected: selectedRoom,
      onSelect: onSelectRoom,
      category: "room",
    },
    {
      title: "Weapons",
      cards: WEAPONS,
      selected: selectedWeapon,
      onSelect: onSelectWeapon,
      category: "weapon",
    },
  ];

  return (
    <div className="rounded-2xl bg-mansion-card border border-cream/10 shadow-xl p-3 sm:p-4">
      <MarkLegend />
      <div className="overflow-x-auto">
        <table className="w-auto min-w-[380px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-cream/10 sticky top-0 z-10 bg-mansion-card">
              <th className="p-2 w-8" />
              <th className="p-2 text-left text-[11px] font-semibold text-cream/45 uppercase tracking-wider w-[220px]">
                Cards
              </th>
              {allPlayers.map((player) => {
                const colorHex =
                  PLAYER_COLORS.find((c) => c.id === player.color)?.hex ?? "#888";
                const isSelf = player.userId === currentUserId;
                return (
                  <th key={player.id} className="px-2 py-1.5 text-center w-16">
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={cn(
                          "w-6 h-6 rounded-full border shadow-sm",
                          isSelf ? "border-gold/60 ring-2 ring-gold/25" : "border-cream/20"
                        )}
                        style={{ backgroundColor: colorHex }}
                        title={player.displayName}
                      />
                      <span
                        className={cn(
                          "text-[10px] truncate max-w-[56px] leading-tight",
                          isSelf ? "text-gold font-semibold" : "text-cream/55"
                        )}
                      >
                        {firstName(player.displayName)}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => {
              const style = CATEGORY_STYLE[section.category];
              return (
                <Fragment key={section.title}>
                  <tr>
                    <td
                      colSpan={2 + allPlayers.length}
                      className={cn(
                        "px-3 py-2 text-[11px] font-bold uppercase tracking-widest rounded-md",
                        style.header
                      )}
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="text-sm">{style.icon}</span>
                        {section.title}
                      </span>
                    </td>
                  </tr>
                  {section.cards.map((cardName) => {
                    const isInOwnHand = privateHandCards.includes(cardName);
                    const isSelected = section.selected === cardName;
                    const canSelect = isSelectionEnabled && !isInOwnHand;

                    return (
                      <tr
                        key={cardName}
                        className={cn(
                          "border-b border-cream/[0.06] transition-colors",
                          style.row,
                          isInOwnHand && "bg-gold/[0.06]"
                        )}
                      >
                        <td className="p-1 w-8 text-center align-middle">
                          {canSelect && (
                            <input
                              type="radio"
                              name={`pick-${section.category}`}
                              checked={isSelected}
                              onChange={() => section.onSelect(cardName)}
                              className="accent-gold w-4 h-4 cursor-pointer"
                            />
                          )}
                        </td>
                        <td className="py-1.5 pr-2 align-middle">
                          <button
                            type="button"
                            onClick={canSelect ? () => section.onSelect(cardName) : undefined}
                            disabled={!canSelect}
                            className={cn(
                              "flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-left transition-all",
                              isSelected && "ring-1 ring-gold/60 bg-gold/10",
                              canSelect && "cursor-pointer hover:bg-cream/[0.05]"
                            )}
                          >
                            <span className="text-xl shrink-0">{getCardEmoji(cardName)}</span>
                            <span
                              className={cn(
                                "font-medium truncate text-sm",
                                isInOwnHand
                                  ? "text-cream/45 line-through decoration-gold/40"
                                  : style.accent
                              )}
                            >
                              {cardName}
                            </span>
                            {isInOwnHand && (
                              <span className="ml-auto text-[9px] uppercase tracking-wide text-gold/90 bg-gold/15 border border-gold/30 px-1.5 py-0.5 rounded-full shrink-0">
                                Yours
                              </span>
                            )}
                          </button>
                        </td>
                        {allPlayers.map((player) => {
                          const mark = resolveMark(player.userId, cardName);
                          const locked = isCellLocked(player.userId, cardName);
                          return (
                            <td key={player.id} className="px-2 py-1.5 text-center align-middle">
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
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
