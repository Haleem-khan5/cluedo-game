import Link from "next/link";
import { Castle, BookOpen, Gamepad2 } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-cream/10 bg-mansion-dark/80 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid sm:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Castle className="w-5 h-5 text-gold" />
              <span className="font-serif text-cream">Mystery Mansion</span>
            </div>
            <p className="text-sm text-cream/40 leading-relaxed">
              An original online murder mystery board game. Deduce, suggest, and accuse your way to victory.
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-cream/35 mb-3">Play</p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/lobby" className="text-cream/55 hover:text-gold transition-colors flex items-center gap-1.5">
                  <Gamepad2 className="w-3.5 h-3.5" /> Game Lobby
                </Link>
              </li>
              <li>
                <Link href="/auth/login" className="text-cream/55 hover:text-gold transition-colors">
                  Sign In
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-cream/35 mb-3">Learn</p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/guide" className="text-cream/55 hover:text-gold transition-colors flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" /> Detective&apos;s Guidebook
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-cream/5 text-center text-xs text-cream/30">
          © {new Date().getFullYear()} Mystery Mansion — Production-ready multiplayer detective game
        </div>
      </div>
    </footer>
  );
}
