"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { LogIn, Sparkles, KeyRound, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GuestQuickPlayCard } from "@/components/auth/GuestQuickPlayCard";

export function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectAfterAuth = searchParams.get("callbackUrl") ?? "/lobby";

  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [authErrorMessage, setAuthErrorMessage] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [activeAuthTab, setActiveAuthTab] = useState<"signIn" | "guest">("signIn");

  const handleEmailSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsAuthLoading(true);
    setAuthErrorMessage("");

    const signInResult = await signIn("credentials", {
      email: emailInput,
      password: passwordInput,
      redirect: false,
    });

    setIsAuthLoading(false);
    if (signInResult?.error) {
      setAuthErrorMessage("Invalid email or password");
    } else {
      router.push(redirectAfterAuth);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: redirectAfterAuth });
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <KeyRound className="w-14 h-14 text-gold mx-auto mb-4" />
          <h1 className="font-serif text-3xl text-cream">Welcome Back</h1>
          <p className="text-cream/55 mt-2">Sign in or play as a guest detective</p>
        </div>

        <div className="rounded-2xl bg-mansion-card border border-cream/10 p-6 space-y-6 shadow-2xl">
          <div className="flex rounded-xl bg-mansion-dark/60 p-1">
            <button
              type="button"
              onClick={() => setActiveAuthTab("signIn")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                activeAuthTab === "signIn" ? "bg-burgundy text-cream" : "text-cream/55"
              }`}
            >
              <LogIn className="w-4 h-4" /> Sign In
            </button>
            <button
              type="button"
              onClick={() => setActiveAuthTab("guest")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                activeAuthTab === "guest" ? "bg-burgundy text-cream" : "text-cream/55"
              }`}
            >
              <UserCircle className="w-4 h-4" /> Guest
            </button>
          </div>

          {authErrorMessage && (
            <div className="p-3 rounded-xl bg-red-900/30 border border-red-500/30 text-red-300 text-sm">
              {authErrorMessage}
            </div>
          )}

          {activeAuthTab === "signIn" ? (
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <Input
                id="emailInput"
                label="Email Address"
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="detective@mansion.com"
                required
              />
              <Input
                id="passwordInput"
                label="Password"
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                required
              />
              <Button type="submit" variant="gold" className="w-full" loading={isAuthLoading}>
                <LogIn className="w-4 h-4" /> Sign In
              </Button>
            </form>
          ) : (
            <GuestQuickPlayCard
              redirectAfterGuestSignIn={redirectAfterAuth}
              title="Quick Guest Play"
              description="No account needed — pick a name and join the investigation."
            />
          )}

          {activeAuthTab === "signIn" && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-cream/10" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-mansion-card text-cream/40">or</span>
                </div>
              </div>

              <Button variant="ghost" className="w-full" onClick={handleGoogleSignIn} type="button">
                <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </Button>
            </>
          )}

          <p className="text-center text-sm text-cream/45">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="text-gold hover:underline inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
