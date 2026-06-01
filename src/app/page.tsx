"use client";

import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import {
  Users,
  Shield,
  Zap,
  BookOpen,
  QrCode,
  Castle,
  Sparkles,
  LogIn,
  UserPlus,
} from "lucide-react";

const quickFeatures = [
  { icon: Users, label: "3–6 players" },
  { icon: Zap, label: "Real-time" },
  { icon: QrCode, label: "QR invites" },
  { icon: Shield, label: "Fair play" },
  { icon: BookOpen, label: "Notes sheet" },
];

const suspectRoster = [
  { suspectName: "Professor Gray", icon: "🎓" },
  { suspectName: "Lady Violet", icon: "💜" },
  { suspectName: "Colonel Stone", icon: "🎖️" },
  { suspectName: "Doctor Rose", icon: "🌹" },
  { suspectName: "Captain Black", icon: "⚓" },
  { suspectName: "Miss Amber", icon: "✨" },
];

export default function HomePage() {
  const { data: authSession } = useSession();
  const isSignedIn = !!authSession?.user;

  return (
    <div className="overflow-hidden">
      <section className="relative min-h-[85vh] flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 text-center max-w-2xl w-full"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gold/10 border border-gold/25 mb-6">
            <Castle className="w-10 h-10 text-gold" />
          </div>

          <h1 className="font-serif text-5xl sm:text-6xl text-cream mb-3 leading-tight">
            Mystery Mansion
          </h1>
          <p className="text-lg text-cream/60 mb-8">
            Online murder mystery · 3–6 players · No account needed
          </p>

          <div className="flex flex-wrap gap-3 justify-center mb-10">
            {isSignedIn ? (
              <>
                <Link href="/lobby">
                  <Button variant="gold" size="lg">
                    <Castle className="w-5 h-5" /> Play Now
                  </Button>
                </Link>
                <Link href="/guide">
                  <Button variant="ghost" size="lg">
                    <BookOpen className="w-5 h-5" /> Rules
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Button
                  variant="gold"
                  size="lg"
                  onClick={() => signIn("guest", { name: "Guest", callbackUrl: "/lobby" })}
                >
                  <Sparkles className="w-5 h-5" /> Play as Guest
                </Button>
                <Link href="/lobby">
                  <Button variant="secondary" size="lg">
                    <Castle className="w-5 h-5" /> Lobby
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="ghost" size="lg">
                    <LogIn className="w-5 h-5" /> Sign In
                  </Button>
                </Link>
                <Link href="/guide">
                  <Button variant="ghost" size="lg">
                    <BookOpen className="w-5 h-5" /> Rules
                  </Button>
                </Link>
              </>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {quickFeatures.map((feature) => (
              <span
                key={feature.label}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cream/5 border border-cream/10 text-xs text-cream/55"
              >
                <feature.icon className="w-3.5 h-3.5 text-gold" />
                {feature.label}
              </span>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="py-16 px-4 border-t border-cream/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-2xl text-cream text-center mb-2">The Suspects</h2>
          <p className="text-center text-cream/40 text-sm mb-8">Six guests. One killer.</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {suspectRoster.map((suspect, index) => (
              <motion.div
                key={suspect.suspectName}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                viewport={{ once: true }}
                className="rounded-xl bg-mansion-card border border-cream/10 p-4 text-center hover:border-gold/25 transition-colors"
              >
                <span className="text-3xl">{suspect.icon}</span>
                <p className="text-cream text-xs mt-2 font-medium leading-tight">{suspect.suspectName}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {!isSignedIn && (
        <section className="py-12 px-4 text-center border-t border-cream/5">
          <Link href="/auth/signup">
            <Button variant="ghost">
              <UserPlus className="w-4 h-4" /> Create free account
            </Button>
          </Link>
        </section>
      )}
    </div>
  );
}
