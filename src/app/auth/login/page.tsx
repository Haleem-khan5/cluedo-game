"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { LoginPageContent } from "./LoginPageContent";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
