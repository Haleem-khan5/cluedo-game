import Link from "next/link";
import { BookOpen, Castle, ArrowLeft } from "lucide-react";
import { GameGuidebook, GuidebookTableOfContents } from "@/components/guide/GameGuidebook";
import { guidebookSections } from "@/lib/game/guidebookContent";

export const metadata = {
  title: "Guidebook — Mystery Mansion",
  description: "Complete rules and strategy guide for Mystery Mansion murder mystery game.",
};

export default function GuidebookPage() {
  return (
    <div className="min-h-screen">
      <div className="relative overflow-hidden border-b border-cream/10 bg-gradient-to-b from-mansion to-mansion-dark py-12 px-4">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <BookOpen className="w-12 h-12 text-gold mx-auto mb-4" />
          <h1 className="font-serif text-4xl sm:text-5xl text-cream mb-3">Detective&apos;s Guidebook</h1>
          <p className="text-cream/55 max-w-xl mx-auto">
            Everything you need to solve the mystery — rules, rooms, suspects, weapons, and winning strategies.
          </p>
          <Link
            href="/lobby"
            className="inline-flex items-center gap-2 mt-6 text-gold hover:underline text-sm"
          >
            <Castle className="w-4 h-4" /> Ready? Enter the Mansion
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <Link href="/" className="inline-flex items-center gap-1 text-cream/40 hover:text-cream/70 text-sm mb-8">
          <ArrowLeft className="w-4 h-4" /> Home
        </Link>

        <div className="grid lg:grid-cols-[220px_1fr] gap-8">
          <div className="hidden lg:block">
            <GuidebookTableOfContents sections={guidebookSections} />
          </div>
          <div>
            <div className="lg:hidden mb-6 overflow-x-auto flex gap-2 pb-2">
              {guidebookSections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="shrink-0 px-3 py-1.5 rounded-full border border-cream/15 text-sm text-cream/65 hover:border-gold/30 hover:text-gold"
                >
                  {section.icon} {section.title}
                </a>
              ))}
            </div>
            <GameGuidebook sections={guidebookSections} />
          </div>
        </div>
      </div>
    </div>
  );
}
