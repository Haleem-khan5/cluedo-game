"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  LogOut,
  User,
  Gamepad2,
  Sparkles,
  BookOpen,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { shouldShowAppSidebar } from "@/lib/games/catalog";
import { useSidebarOptional } from "./SidebarContext";
import { RulesModal } from "@/components/guide/RulesModal";

export function Header() {
  const { data: authSession } = useSession();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const sidebar = useSidebarOptional();
  const showGamesMenu = shouldShowAppSidebar(pathname);

  return (
    <header className="sticky top-0 z-40 border-b border-cream/10 bg-mansion-dark/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {showGamesMenu && sidebar && (
            <button
              type="button"
              onClick={sidebar.toggle}
              className="p-2 rounded-lg hover:bg-cream/10 text-cream/80 shrink-0"
              aria-label="Open games menu"
              aria-expanded={sidebar.isOpen}
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <Link
            href="/"
            className="flex items-center gap-3 group min-w-0"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center group-hover:bg-gold/20 transition-colors shrink-0">
              <Image
                src="/cluebound-chronicles-portfolio-logo.png"
                alt="Cluebound Chronicles logo"
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
                priority
              />
            </div>
            <span className="font-serif text-lg sm:text-xl text-cream group-hover:text-gold transition-colors truncate hidden sm:block">
              Cluebound Chronicles
            </span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          <Link href="/lobby">
            <Button
              variant={pathname === "/lobby" ? "secondary" : "ghost"}
              size="sm"
              className={cn(pathname === "/lobby" && "bg-gold/15 text-gold")}
            >
              <Gamepad2 className="w-4 h-4" /> Play
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => setIsRulesOpen(true)}>
            <BookOpen className="w-4 h-4" /> Rules
          </Button>
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          {authSession ? (
            <>
              <div className="hidden lg:flex items-center gap-2 text-sm text-cream/70 max-w-[140px]">
                <User className="w-4 h-4 shrink-0" />
                <span className="truncate">{authSession.user?.name}</span>
                {authSession.user?.isGuest && (
                  <span className="text-xs bg-gold/15 text-gold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="hidden sm:inline-flex"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {authSession.user?.isGuest ? "Leave" : "Sign Out"}
                </span>
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="hidden sm:block">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/lobby">
                <Button variant="gold" size="sm">
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">Play</span>
                </Button>
              </Link>
            </>
          )}

          <button
            type="button"
            className="md:hidden p-2 rounded-lg hover:bg-cream/10 text-cream/70"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Account menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <User className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-cream/10 bg-mansion-dark/98 px-4 py-3 space-y-1">
          <Link
            href="/lobby"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-cream/70 hover:bg-cream/5 hover:text-cream"
          >
            <Gamepad2 className="w-4 h-4 text-gold" /> Play
          </Link>
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              setIsRulesOpen(true);
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-cream/70 hover:bg-cream/5 hover:text-cream"
          >
            <BookOpen className="w-4 h-4 text-gold" /> Rules
          </button>
          {authSession && (
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-cream/70 hover:bg-cream/5"
            >
              <LogOut className="w-4 h-4" />{" "}
              {authSession.user?.isGuest ? "Leave" : "Sign Out"}
            </button>
          )}
        </div>
      )}

      <RulesModal open={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
    </header>
  );
}
