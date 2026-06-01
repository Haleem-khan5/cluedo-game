"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, BookOpen } from "lucide-react";
import { GameGuidebook } from "./GameGuidebook";
import { guidebookSections } from "@/lib/game/guidebookContent";

interface InGameGuideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Slide-over guide panel accessible during live gameplay. */
export function InGameGuideDrawer({ isOpen, onClose }: InGameGuideDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-mansion-dark border-l border-cream/10 flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between p-4 border-b border-cream/10 shrink-0">
              <h2 className="font-serif text-xl text-cream flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-gold" />
                Quick Guide
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-cream/10 text-cream/60"
                aria-label="Close guide"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <GameGuidebook sections={guidebookSections.filter((s) => ["turn", "suggestions", "accusation", "notes"].includes(s.id))} compact />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
