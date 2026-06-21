import Image from "next/image";
import Link from "next/link";
import { BookOpen, Gamepad2 } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-cream/10 bg-mansion-dark/80 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-cream/50 text-sm">
          <Image
            src="/cluebound-chronicles-portfolio-logo.png"
            alt="Cluebound Chronicles logo"
            width={24}
            height={24}
            className="h-6 w-6 object-contain"
          />
          Cluebound Chronicles
        </div>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/lobby" className="text-cream/55 hover:text-gold transition-colors flex items-center gap-1.5">
            <Gamepad2 className="w-3.5 h-3.5" /> Play
          </Link>
          <Link href="/guide" className="text-cream/55 hover:text-gold transition-colors flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" /> Rules
          </Link>
          <Link href="/auth/login" className="text-cream/55 hover:text-gold transition-colors">
            Sign In
          </Link>
        </nav>
        <p className="text-xs text-cream/30">© {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}
