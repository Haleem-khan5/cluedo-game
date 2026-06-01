"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PARTY_LINKS,
  WEEKLY_GAMES,
  BOARD_GAMES,
  type GameCatalogEntry,
} from "@/lib/games/catalog";
import { useToastStore } from "@/components/ui/ToastContainer";
import { useSidebar } from "./SidebarContext";

function ComingSoonBadge() {
  return (
    <span className="text-[9px] uppercase tracking-wide bg-cream/10 text-cream/50 px-1.5 py-0.5 rounded-full font-semibold">
      Soon
    </span>
  );
}

function GameNavItem({
  game,
  isActive,
  onComingSoon,
  onNavigate,
}: {
  game: GameCatalogEntry;
  isActive: boolean;
  onComingSoon: (name: string) => void;
  onNavigate: () => void;
}) {
  const isLive = game.status === "live" && game.href;

  const className = cn(
    "flex items-center justify-between gap-2 w-full px-3 py-2 rounded-lg text-sm font-semibold transition-colors text-left",
    isActive && isLive && "bg-gold/15 text-gold ring-1 ring-gold/20",
    !isActive && isLive && "hover:bg-cream/5",
    !isLive && "opacity-60 cursor-default hover:opacity-80"
  );

  const content = (
    <>
      <span style={{ color: isActive && isLive ? undefined : game.color }}>{game.name}</span>
      {game.status === "coming-soon" ? <ComingSoonBadge /> : null}
    </>
  );

  if (isLive && game.href) {
    return (
      <Link href={game.href} className={className} onClick={onNavigate}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        onComingSoon(game.name);
        onNavigate();
      }}
    >
      {content}
    </button>
  );
}

function SidebarNavContent({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  const showToast = useToastStore((s) => s.showToast);

  const handleComingSoon = (name: string) => {
    showToast(`${name} is coming soon!`, "info");
  };

  const isMiniClueActive =
    pathname === "/lobby" ||
    pathname.startsWith("/game/") ||
    pathname.startsWith("/join/") ||
    pathname === "/guide";

  return (
    <>
      <nav className="flex-1 py-4 px-3 space-y-5 overflow-y-auto">
        <div className="space-y-0.5">
          {PARTY_LINKS.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.id}
                href={link.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-gold/15 font-medium text-gold ring-1 ring-gold/20"
                    : "text-cream/65 hover:bg-cream/5 hover:text-cream"
                )}
              >
                {link.label}
                {link.id === "my-parties" && <ChevronRight className="w-4 h-4 text-cream/40" />}
              </Link>
            );
          })}
        </div>

        <div>
          <p className="px-3 mb-1.5 text-xs font-bold text-cream/40 uppercase tracking-wider">
            Weekly Games
          </p>
          <div className="space-y-0.5">
            {WEEKLY_GAMES.map((game) => (
              <GameNavItem
                key={game.id}
                game={game}
                isActive={false}
                onComingSoon={handleComingSoon}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="px-3 mb-1.5 text-xs font-bold text-cream/40 uppercase tracking-wider">
            Board Games
          </p>
          <div className="space-y-0.5">
            {BOARD_GAMES.map((game) => (
              <GameNavItem
                key={game.id}
                game={game}
                isActive={game.id === "mini-clue" && isMiniClueActive}
                onComingSoon={handleComingSoon}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      </nav>

      <div className="border-t border-cream/10 px-3 py-3 space-y-0.5 text-sm text-cream/50 shrink-0">
        <button
          type="button"
          onClick={() => {
            showToast("Thanks for your feedback!", "info");
            onNavigate();
          }}
          className="block w-full text-left px-3 py-1.5 rounded-lg hover:bg-cream/5 hover:text-cream transition-colors"
        >
          Feedback
        </button>
        <div className="flex items-center gap-2 px-3 py-1.5">
          <span>Changelog</span>
          <span className="text-[9px] bg-forest text-cream px-1.5 py-0.5 rounded-full font-bold">
            New
          </span>
        </div>
      </div>
    </>
  );
}

/** Slide-in games sidebar — opened via header hamburger, closed on outside click. */
export function AppSidebarDrawer() {
  const { isOpen, close } = useSidebar();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, close]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop — click outside to close */}
      <button
        type="button"
        aria-label="Close menu"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={close}
      />

      {/* Drawer panel — contrasting mansion surface */}
      <motion.aside
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-mansion border-r border-gold/15 text-cream shadow-2xl flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Games menu"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-cream/10 shrink-0">
          <span className="font-serif text-cream text-base">Games &amp; Parties</span>
          <button
            type="button"
            onClick={close}
            className="p-1.5 rounded-lg hover:bg-cream/10 text-cream/60 hover:text-cream transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <SidebarNavContent onNavigate={close} />
      </motion.aside>
    </div>
  );
}
