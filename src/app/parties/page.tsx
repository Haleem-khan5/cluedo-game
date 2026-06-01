"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Castle, PlusCircle, KeyRound, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GuestQuickPlayCard } from "@/components/auth/GuestQuickPlayCard";

export default function MyPartiesPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/lobby");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  if (status === "authenticated") {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-cream/50 text-sm">
        Opening lobby…
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="font-serif text-2xl text-cream mb-1">My Parties</h1>
      <p className="text-cream/50 text-sm mb-8">Sign in to create or manage your game lobbies</p>

      <GuestQuickPlayCard redirectAfterGuestSignIn="/lobby" />

      <div className="grid gap-3 mt-6">
        <Link href="/auth/login?callbackUrl=/lobby">
          <Button variant="gold" className="w-full">
            <Castle className="w-4 h-4" /> Sign in & go to lobby
          </Button>
        </Link>
        <Link href="/parties/public">
          <Button variant="ghost" className="w-full">
            Browse public parties <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      <div className="mt-10 grid sm:grid-cols-2 gap-3">
        <div className="rounded-xl bg-mansion-card border border-cream/10 p-4">
          <PlusCircle className="w-6 h-6 text-gold mb-2" />
          <h2 className="font-serif text-cream text-sm">Create</h2>
          <p className="text-cream/45 text-xs mt-1">Host a Mini-Clue lobby</p>
        </div>
        <div className="rounded-xl bg-mansion-card border border-cream/10 p-4">
          <KeyRound className="w-6 h-6 text-gold mb-2" />
          <h2 className="font-serif text-cream text-sm">Join</h2>
          <p className="text-cream/45 text-xs mt-1">Enter a 6-digit code</p>
        </div>
      </div>
    </div>
  );
}
