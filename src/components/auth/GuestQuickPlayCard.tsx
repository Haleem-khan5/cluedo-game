"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { UserCircle, Sparkles, LogIn } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useGuestSignIn } from "@/hooks/useGuestSignIn";

interface GuestQuickPlayCardProps {
  /** Where to send the user after guest sign-in succeeds. */
  redirectAfterGuestSignIn?: string;
  /** Optional heading override. */
  title?: string;
  /** Optional description override. */
  description?: string;
  /** Called after guest session is created (before redirect). */
  onGuestSignedIn?: () => void;
}

/**
 * Card that lets visitors play immediately as a guest detective without registering.
 */
export function GuestQuickPlayCard({
  redirectAfterGuestSignIn = "/lobby",
  title = "Play as Guest",
  description = "No account needed.",
  onGuestSignedIn,
}: GuestQuickPlayCardProps) {
  const [guestDisplayNameInput, setGuestDisplayNameInput] = useState("");
  const { signInAsGuest, isGuestSignInLoading, guestSignInError } = useGuestSignIn({
    redirectPath: redirectAfterGuestSignIn,
  });

  const handleGuestPlaySubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = await signInAsGuest(guestDisplayNameInput);
    if (result.success) onGuestSignedIn?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/5 to-mansion-card p-6 shadow-xl"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-gold/15 flex items-center justify-center shrink-0">
          <UserCircle className="w-7 h-7 text-gold" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-serif text-xl text-cream flex items-center gap-2">
            {title}
            <Sparkles className="w-4 h-4 text-gold" />
          </h2>
          <p className="text-cream/55 text-sm mt-1">{description}</p>
        </div>
      </div>

      <form onSubmit={handleGuestPlaySubmit} className="mt-5 space-y-3">
        <Input
          id="guestDisplayName"
          label="Your name"
          value={guestDisplayNameInput}
          onChange={(e) => setGuestDisplayNameInput(e.target.value)}
          placeholder="Detective Lane"
          maxLength={30}
        />

        {guestSignInError && (
          <p className="text-sm text-red-400">{guestSignInError}</p>
        )}

        <Button
          type="submit"
          variant="gold"
          className="w-full"
          loading={isGuestSignInLoading}
        >
          <Sparkles className="w-4 h-4" />
          Continue
        </Button>
      </form>

      <p className="text-center text-xs text-cream/40 mt-4">
        Have an account?{" "}
        <Link
          href={`/auth/login?callbackUrl=${encodeURIComponent(redirectAfterGuestSignIn)}`}
          className="text-gold hover:underline inline-flex items-center gap-1"
        >
          <LogIn className="w-3 h-3" /> Sign in
        </Link>
      </p>
    </motion.div>
  );
}
