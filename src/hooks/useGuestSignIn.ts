"use client";

import { signIn } from "next-auth/react";
import { useCallback, useState } from "react";

interface UseGuestSignInOptions {
  /** Route after successful guest sign-in (e.g. /lobby or /join/ABC123). */
  redirectPath?: string;
}

/**
 * Signs the user in as a temporary guest detective (no email required).
 * Returns the guest display name used for the session.
 */
export function useGuestSignIn(options: UseGuestSignInOptions = {}) {
  const { redirectPath = "/lobby" } = options;
  const [isGuestSignInLoading, setIsGuestSignInLoading] = useState(false);
  const [guestSignInError, setGuestSignInError] = useState("");

  const signInAsGuest = useCallback(
    async (guestDisplayName: string) => {
      setIsGuestSignInLoading(true);
      setGuestSignInError("");

      const trimmedName = guestDisplayName.trim() || "Guest Detective";
      const result = await signIn("guest", {
        name: trimmedName,
        redirect: false,
      });

      setIsGuestSignInLoading(false);

      if (result?.error) {
        setGuestSignInError("Could not start guest session. Is PostgreSQL running? Try: docker compose up -d");
        return { success: false as const };
      }

      window.location.href = redirectPath;
      return { success: true as const, guestDisplayName: trimmedName };
    },
    [redirectPath]
  );

  return {
    signInAsGuest,
    isGuestSignInLoading,
    guestSignInError,
    clearGuestSignInError: () => setGuestSignInError(""),
  };
}
