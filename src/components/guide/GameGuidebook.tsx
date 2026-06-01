"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Lightbulb, ListOrdered } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GuidebookBlock, GuidebookSection } from "@/lib/game/guidebookContent";

function GuideBlockRenderer({ block }: { block: GuidebookBlock }) {
  if (block.type === "paragraph") {
    return <p className="text-cream/70 leading-relaxed">{block.text}</p>;
  }
  if (block.type === "list") {
    return (
      <ul className="space-y-2">
        {block.items.map((item) => (
          <li key={item} className="flex gap-2 text-cream/70 text-sm leading-relaxed">
            <span className="text-gold mt-1 shrink-0">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  }
  if (block.type === "steps") {
    return (
      <ol className="space-y-4">
        {block.steps.map((step, index) => (
          <li key={step.title} className="flex gap-4">
            <span className="w-8 h-8 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center text-gold font-bold text-sm shrink-0">
              {index + 1}
            </span>
            <div>
              <p className="font-medium text-cream">{step.title}</p>
              <p className="text-sm text-cream/55 mt-0.5">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    );
  }
  if (block.type === "cards") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {block.cards.map((card) => (
          <div
            key={card.name}
            className="rounded-xl border border-cream/10 bg-mansion-dark/50 p-4 hover:border-gold/25 transition-colors"
          >
            <span className="text-2xl">{card.emoji}</span>
            <p className="font-medium text-cream mt-2">{card.name}</p>
            <p className="text-xs text-cream/45 mt-1">{card.detail}</p>
          </div>
        ))}
      </div>
    );
  }
  if (block.type === "tip") {
    return (
      <div className="flex gap-3 p-4 rounded-xl bg-gold/10 border border-gold/25">
        <Lightbulb className="w-5 h-5 text-gold shrink-0 mt-0.5" />
        <p className="text-sm text-cream/80">{block.text}</p>
      </div>
    );
  }
  return null;
}

function GuideSection({ section, defaultOpen }: { section: GuidebookSection; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen ?? false);

  return (
    <div id={section.id} className="rounded-2xl border border-cream/10 bg-mansion-card/60 overflow-hidden scroll-mt-24">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 p-5 text-left hover:bg-cream/5 transition-colors"
      >
        <span className="text-2xl">{section.icon}</span>
        <h2 className="font-serif text-lg text-cream flex-1">{section.title}</h2>
        <ChevronDown
          className={cn("w-5 h-5 text-cream/40 transition-transform", isOpen && "rotate-180")}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4 border-t border-cream/5 pt-4">
              {section.content.map((block, index) => (
                <GuideBlockRenderer key={index} block={block} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface GameGuidebookProps {
  sections: GuidebookSection[];
  /** Compact mode for in-game drawer */
  compact?: boolean;
}

/** Full or compact guidebook renderer used on /guide and in-game drawer. */
export function GameGuidebook({ sections, compact }: GameGuidebookProps) {
  return (
    <div className={cn("space-y-3", compact && "space-y-2")}>
      {sections.map((section, index) => (
        <GuideSection
          key={section.id}
          section={section}
          defaultOpen={compact ? section.id === "turn" : index === 0}
        />
      ))}
    </div>
  );
}

/** Quick-nav table of contents for the guidebook page. */
export function GuidebookTableOfContents({ sections }: { sections: GuidebookSection[] }) {
  return (
    <nav className="rounded-2xl border border-cream/10 bg-mansion-card/40 p-4 sticky top-20">
      <p className="text-xs uppercase tracking-wider text-cream/40 mb-3 flex items-center gap-1">
        <ListOrdered className="w-3.5 h-3.5" /> Contents
      </p>
      <ul className="space-y-1">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-cream/65 hover:text-gold hover:bg-gold/5 transition-colors"
            >
              <span>{section.icon}</span>
              {section.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
