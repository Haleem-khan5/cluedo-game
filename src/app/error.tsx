"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <AlertTriangle className="w-14 h-14 text-gold mx-auto mb-4" />
        <h1 className="font-serif text-2xl text-cream mb-2">Something Went Wrong</h1>
        <p className="text-cream/50 text-sm mb-6">
          An unexpected error occurred. The investigation can continue — try again or return home.
        </p>
        {process.env.NODE_ENV === "development" && (
          <pre className="text-left text-xs text-red-300/70 bg-red-900/20 rounded-lg p-3 mb-6 overflow-auto max-h-32">
            {error.message}
          </pre>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="gold" onClick={reset}>
            <RefreshCw className="w-4 h-4" /> Try Again
          </Button>
          <Link href="/">
            <Button variant="ghost">
              <Home className="w-4 h-4" /> Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
