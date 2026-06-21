import Link from "next/link";
import { Search, Home } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <Search className="w-14 h-14 text-cream/30 mx-auto mb-4" />
        <h1 className="font-serif text-4xl text-cream mb-2">404</h1>
        <p className="text-cream/50 mb-6">This chapter of the case file doesn&apos;t exist. The clue you seek is elsewhere.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button variant="gold">
              <Home className="w-4 h-4" /> Return Home
            </Button>
          </Link>
          <Link href="/guide">
            <Button variant="ghost">Read Guidebook</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
