"use client";

import { usePathname } from "next/navigation";
import { AppSidebarDrawer } from "./AppSidebar";
import { shouldShowAppSidebar } from "@/lib/games/catalog";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showSidebar = shouldShowAppSidebar(pathname);

  if (!showSidebar) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      <AppSidebarDrawer />
      <main className="flex-1">{children}</main>
    </>
  );
}
