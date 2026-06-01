"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  LogOut,
  User,
  Castle,
  Gamepad2,
  Sparkles,
  BookOpen,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/lobby", label: "Play", icon: Gamepad2 },
  { href: "/guide", label: "Guidebook", icon: BookOpen },
];

export function Header() {
  const { data: authSession } = useSession();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-cream/10 bg-mansion-dark/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
            <Castle className="w-5 h-5 text-gold" />
          </div>
          <div className="hidden xs:block">
            <h1 className="font-serif text-lg sm:text-xl text-cream group-hover:text-gold transition-colors">
              Mystery Mansion
            </h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-cream/40 hidden sm:block">
              A Murder Mystery
            </p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link key={link.href} href={link.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(isActive && "bg-gold/15 text-gold")}
                >
                  <Icon className="w-4 h-4" /> {link.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
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
              <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/" })} className="hidden sm:inline-flex">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="hidden sm:block">
                <Button variant="ghost" size="sm">Sign In</Button>
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
            aria-label="Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-cream/10 bg-mansion-dark/98 px-4 py-3 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-cream/70 hover:bg-cream/5 hover:text-cream"
              >
                <Icon className="w-4 h-4 text-gold" /> {link.label}
              </Link>
            );
          })}
          {authSession && (
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-cream/70 hover:bg-cream/5"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          )}
        </div>
      )}
    </header>
  );
}
