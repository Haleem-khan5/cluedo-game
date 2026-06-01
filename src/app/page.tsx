"use client";

import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { GuestQuickPlayCard } from "@/components/auth/GuestQuickPlayCard";
import {
  Users,
  Shield,
  Zap,
  BookOpen,
  QrCode,
  Castle,
  Search,
  Sparkles,
  LogIn,
  UserPlus,
} from "lucide-react";

const gameFeatureList = [
  {
    icon: Users,
    title: "3–6 Players Online",
    description: "Gather detectives for real-time multiplayer — share a QR code or invite link.",
  },
  {
    icon: Shield,
    title: "Secure & Fair",
    description: "Server-authoritative state with hidden hands and anti-cheat protection.",
  },
  {
    icon: Zap,
    title: "Classic Gameplay",
    description: "Roll dice, explore rooms, suggest clues, disprove, and make your accusation.",
  },
  {
    icon: BookOpen,
    title: "Detective Notes",
    description: "Track deductions on an interactive notes sheet as clues unfold.",
  },
  {
    icon: QrCode,
    title: "Easy Invites",
    description: "Share a lobby QR code or link — friends join instantly, even as guests.",
  },
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
      <section className="relative min-h-[88vh] flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-mansion-dark via-mansion to-mansion-dark" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23C9A227'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative z-10 text-center max-w-3xl"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: "spring" }}
            className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gold/10 border border-gold/25 mb-6"
          >
            <Castle className="w-12 h-12 text-gold" />
          </motion.div>

          <h1 className="font-serif text-5xl sm:text-7xl text-cream mb-4 leading-tight">
            Mystery Mansion
          </h1>
          <p className="text-lg sm:text-xl text-cream/75 mb-2 font-light flex items-center justify-center gap-2">
            <Search className="w-5 h-5 text-gold" />
            A murder has occurred. Can you uncover the truth?
          </p>
          <p className="text-cream/45 mb-10 max-w-xl mx-auto">
            Deduce the suspect, weapon, and room. Play online with friends — no account required for guests.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            {isSignedIn ? (
              <>
                <Link href="/lobby">
                  <Button variant="gold" size="lg">
                    <Castle className="w-5 h-5" /> Enter the Mansion
                  </Button>
                </Link>
                <Link href="/guide">
                  <Button variant="ghost" size="lg">
                    <BookOpen className="w-5 h-5" /> Read Guidebook
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Button
                  variant="gold"
                  size="lg"
                  onClick={() => signIn("guest", { name: "Guest Detective", callbackUrl: "/lobby" })}
                >
                  <Sparkles className="w-5 h-5" /> Play as Guest
                </Button>
                <Link href="/auth/login">
                  <Button variant="ghost" size="lg">
                    <LogIn className="w-5 h-5" /> Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button variant="secondary" size="lg">
                    <UserPlus className="w-5 h-5" /> Sign Up
                  </Button>
                </Link>
                <Link href="/guide">
                  <Button variant="ghost" size="lg">
                    <BookOpen className="w-5 h-5" /> How to Play
                  </Button>
                </Link>
              </>
            )}
          </div>

          {!isSignedIn && (
            <p className="text-xs text-cream/35">
              Guests play instantly · Registered users save progress · Google sign-in available
            </p>
          )}
        </motion.div>
      </section>

      {!isSignedIn && (
        <section className="py-12 px-4 bg-mansion-dark/40">
          <div className="max-w-md mx-auto">
            <GuestQuickPlayCard />
          </div>
        </section>
      )}

      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="font-serif text-3xl text-cream mb-4">The Suspects</h2>
          <p className="text-cream/45 mb-10">Six guests. One murderer. Who did it?</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {suspectRoster.map((suspect, index) => (
              <motion.div
                key={suspect.suspectName}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                viewport={{ once: true }}
                className="rounded-2xl bg-mansion-card border border-cream/10 p-5 hover:border-gold/30 hover:-translate-y-1 transition-all"
              >
                <span className="text-4xl">{suspect.icon}</span>
                <p className="text-cream text-sm mt-3 font-medium">{suspect.suspectName}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-mansion-dark/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-serif text-3xl text-cream text-center mb-12">How It Works</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {gameFeatureList.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
                viewport={{ once: true }}
                className="rounded-2xl bg-mansion-card border border-cream/10 p-6 flex gap-4"
              >
                <div className="w-11 h-11 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
                  <feature.icon className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h3 className="font-serif text-lg text-cream mb-1">{feature.title}</h3>
                  <p className="text-cream/45 text-sm">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 text-center">
        <Castle className="w-10 h-10 text-gold mx-auto mb-4" />
        <h2 className="font-serif text-3xl text-cream mb-4">Ready to Investigate?</h2>
        <p className="text-cream/45 mb-8">Gather 3–6 detectives. Share your lobby QR code. Solve the mystery.</p>
        <Link href={isSignedIn ? "/lobby" : "/auth/login"}>
          <Button variant="gold" size="lg">
            {isSignedIn ? "Go to Lobby" : "Start Playing"}
          </Button>
        </Link>
      </section>

      <footer className="border-t border-cream/10 py-8 text-center text-cream/30 text-sm">
        Mystery Mansion — An original murder mystery board game
      </footer>
    </div>
  );
}
