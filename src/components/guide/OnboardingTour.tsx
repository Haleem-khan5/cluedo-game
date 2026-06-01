"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { onboardingTourSteps } from "@/lib/game/guidebookContent";

const TOUR_STORAGE_KEY = "mystery-mansion-tour-completed";

interface OnboardingTourProps {
  /** Force show tour even if completed (for manual replay). */
  forceShow?: boolean;
  onComplete?: () => void;
}

/** Interactive step-by-step tour for first-time players on the game screen. */
export function OnboardingTour({ forceShow, onComplete }: OnboardingTourProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (forceShow) {
      setCurrentStepIndex(0);
      setIsVisible(true);
      return;
    }
    const completed = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!completed) {
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, [forceShow]);

  const currentStep = onboardingTourSteps[currentStepIndex];
  const isLastStep = currentStepIndex === onboardingTourSteps.length - 1;

  const finishTour = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
    setIsVisible(false);
    onComplete?.();
  };

  const goNext = () => {
    if (isLastStep) finishTour();
    else setCurrentStepIndex((i) => i + 1);
  };

  const goPrev = () => setCurrentStepIndex((i) => Math.max(0, i - 1));

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-[2px]"
          />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed z-[70] bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:w-[380px] rounded-2xl bg-mansion-card border border-gold/30 shadow-2xl shadow-black/50 p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2 text-gold">
                <BookOpen className="w-5 h-5" />
                <span className="text-xs uppercase tracking-wider">
                  Tour {currentStepIndex + 1}/{onboardingTourSteps.length}
                </span>
              </div>
              <button
                onClick={finishTour}
                className="p-1 rounded-lg hover:bg-cream/10 text-cream/50"
                aria-label="Skip tour"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h3 className="font-serif text-xl text-cream mb-2">{currentStep.title}</h3>
            <p className="text-sm text-cream/60 leading-relaxed mb-5">{currentStep.description}</p>

            <div className="flex gap-1 mb-4">
              {onboardingTourSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    index <= currentStepIndex ? "bg-gold" : "bg-cream/15"
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              {currentStepIndex > 0 && (
                <Button variant="ghost" size="sm" onClick={goPrev}>
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
              )}
              <Button variant="gold" size="sm" className="flex-1" onClick={goNext}>
                {isLastStep ? "Start Investigating" : "Next"}
                {!isLastStep && <ChevronRight className="w-4 h-4" />}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function resetOnboardingTour() {
  localStorage.removeItem(TOUR_STORAGE_KEY);
}
