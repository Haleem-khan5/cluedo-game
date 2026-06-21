"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, MessageCircle, Eye, Gavel, Lightbulb } from "lucide-react";

const HOW_IT_WORKS = [
  {
    Icon: MessageCircle,
    title: "Interrogate",
    body: "Name a suspect, a room and a weapon to probe the other detectives.",
  },
  {
    Icon: Eye,
    title: "Disprove",
    body: "If someone holds one of those cards, they secretly reveal it to you.",
  },
  {
    Icon: Gavel,
    title: "Accuse",
    body: "Piece the clues together and accuse — be right and the case is yours.",
  },
];

const DETECTIVE_TIPS = [
  "Watch who disproves — the card you’re shown rules one of your guesses out.",
  "Mark everything on the deduction sheet. Certainty, not luck, wins cases.",
  "Interrogate using cards you already hold to squeeze out fresh information.",
  "Only accuse when you’re certain — a wrong accusation knocks you out.",
];

export function LobbySidePanel() {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setTipIndex((prev) => (prev + 1) % DETECTIVE_TIPS.length),
      5000
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative hidden lg:flex flex-col justify-center px-10 xl:px-16 py-12 overflow-hidden">
      <div className="absolute -top-32 -left-24 w-[28rem] h-[28rem] rounded-full bg-gold/[0.06] blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-16 w-[24rem] h-[24rem] rounded-full bg-burgundy/20 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="relative max-w-md"
      >
        <div className="w-14 h-14 rounded-2xl bg-gold/15 border border-gold/30 flex items-center justify-center mb-6">
          <Search className="w-7 h-7 text-gold" />
        </div>

        <h1 className="font-serif text-4xl xl:text-5xl text-cream leading-[1.05]">
          Cluebound Chronicles
        </h1>
        <p className="text-cream/55 mt-4 text-lg leading-relaxed">
          A murder. Six suspects. One detective sharp enough to solve it — that’s you.
        </p>

        <div className="mt-9 space-y-5">
          {HOW_IT_WORKS.map((step, index) => (
            <div key={step.title} className="flex items-start gap-4">
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-xl bg-mansion-card border border-cream/10 flex items-center justify-center text-gold">
                  <step.Icon className="w-5 h-5" />
                </div>
                {index < HOW_IT_WORKS.length - 1 && (
                  <div className="absolute left-1/2 top-10 h-5 w-px -translate-x-1/2 bg-cream/10" />
                )}
              </div>
              <div className="pt-0.5">
                <p className="text-cream font-medium text-sm">{step.title}</p>
                <p className="text-cream/45 text-sm leading-snug mt-0.5">{step.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-9 rounded-2xl border border-gold/20 bg-gold/[0.05] p-4">
          <p className="text-[11px] uppercase tracking-wider text-gold/70 mb-2 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5" /> Detective tip
          </p>
          <div className="min-h-[2.75rem]">
            <AnimatePresence mode="wait">
              <motion.p
                key={tipIndex}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
                className="text-sm text-cream/75 leading-snug"
              >
                {DETECTIVE_TIPS[tipIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
          <div className="flex gap-1.5 mt-3">
            {DETECTIVE_TIPS.map((_, index) => (
              <button
                key={index}
                onClick={() => setTipIndex(index)}
                aria-label={`Tip ${index + 1}`}
                className={
                  "h-1.5 rounded-full transition-all " +
                  (index === tipIndex
                    ? "w-6 bg-gold"
                    : "w-1.5 bg-cream/20 hover:bg-cream/40")
                }
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
