"use client";

import { cn } from "@/lib/utils";
import { Map, ClipboardList, Hand, Zap } from "lucide-react";

export type MobileGameTab = "board" | "notes" | "clues" | "actions";

interface MobileGameTabsProps {
  activeTab: MobileGameTab;
  onTabChange: (tab: MobileGameTab) => void;
  showActionsBadge?: boolean;
}

const tabs: { id: MobileGameTab; label: string; icon: typeof Map }[] = [
  { id: "board", label: "Board", icon: Map },
  { id: "clues", label: "Clues", icon: Hand },
  { id: "notes", label: "Notes", icon: ClipboardList },
  { id: "actions", label: "Actions", icon: Zap },
];

/** Bottom tab bar for mobile game layout (hidden on xl+). */
export function MobileGameTabs({ activeTab, onTabChange, showActionsBadge }: MobileGameTabsProps) {
  return (
    <nav className="xl:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-cream/10 bg-mansion-dark/95 backdrop-blur-lg safe-area-bottom">
      <div className="flex">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex-1 flex flex-col items-center gap-0.5 py-2.5 px-1 transition-colors relative",
                isActive ? "text-gold" : "text-cream/45 hover:text-cream/70"
              )}
            >
              {showActionsBadge && tab.id === "actions" && (
                <span className="absolute top-1.5 right-1/4 w-2 h-2 rounded-full bg-gold animate-pulse" />
              )}
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
