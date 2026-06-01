import { cn } from "@/lib/utils";
import { getCardEmoji, getCardType, type Card } from "@/lib/game/constants";
import { User, Swords, Home, Search } from "lucide-react";

interface ClueCardProps {
  /** Suspect, weapon, or room card name. */
  cardName: Card;
  onClick?: () => void;
  isSelected?: boolean;
  size?: "sm" | "md" | "lg";
  isFaceDown?: boolean;
}

const cardTypeStyles = {
  suspect: {
    gradient: "from-violet-900/90 via-purple-950 to-indigo-950",
    border: "border-violet-400/30",
    badge: "bg-violet-500/20 text-violet-200",
    Icon: User,
  },
  weapon: {
    gradient: "from-red-900/90 via-rose-950 to-red-950",
    border: "border-red-400/30",
    badge: "bg-red-500/20 text-red-200",
    Icon: Swords,
  },
  room: {
    gradient: "from-emerald-900/90 via-teal-950 to-green-950",
    border: "border-emerald-400/30",
    badge: "bg-emerald-500/20 text-emerald-200",
    Icon: Home,
  },
};

const cardSizeClasses = {
  sm: "w-[4.5rem] h-[6.75rem] text-[10px]",
  md: "w-24 h-36 text-sm",
  lg: "w-32 h-48 text-base",
};

/** Visual clue card — suspect, weapon, or room. */
export function ClueCard({
  cardName,
  onClick,
  isSelected,
  size = "md",
  isFaceDown,
}: ClueCardProps) {
  const cardType = getCardType(cardName);
  const cardEmoji = getCardEmoji(cardName);
  const styles = cardTypeStyles[cardType];
  const TypeIcon = styles.Icon;

  if (isFaceDown) {
    return (
      <div
        className={cn(
          "rounded-xl border-2 bg-gradient-to-br from-burgundy to-mansion-dark",
          "flex flex-col items-center justify-center shadow-lg border-gold/25",
          cardSizeClasses[size]
        )}
      >
        <Search className="w-6 h-6 text-gold/40" />
        <span className="text-[9px] text-cream/30 mt-1 uppercase">Hidden</span>
      </div>
    );
  }

  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "rounded-xl border-2 bg-gradient-to-br shadow-lg transition-all duration-200",
        "flex flex-col items-center justify-between p-2 text-cream overflow-hidden",
        styles.gradient,
        styles.border,
        cardSizeClasses[size],
        onClick && "hover:scale-105 hover:shadow-xl hover:-translate-y-0.5 cursor-pointer card-interactive",
        isSelected && "ring-2 ring-gold scale-105 -translate-y-1",
        !onClick && "cursor-default"
      )}
    >
      <span
        className={cn(
          "text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1",
          styles.badge
        )}
      >
        <TypeIcon className="w-3 h-3" />
        {cardType}
      </span>
      <span className="text-3xl drop-shadow-md">{cardEmoji}</span>
      <span className="text-center font-medium leading-tight px-1">{cardName}</span>
    </Wrapper>
  );
}

/** @deprecated Use ClueCard */
export const GameCard = ClueCard;
