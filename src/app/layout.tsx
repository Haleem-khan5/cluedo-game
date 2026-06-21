import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AppShell } from "@/components/layout/AppShell";
import { SidebarProvider } from "@/components/layout/SidebarContext";
import { ToastContainer } from "@/components/ui/ToastContainer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cluebound Chronicles — Online Murder Mystery Game",
  description:
    "Play Cluebound Chronicles online with 3-6 detectives. Follow clues, question suspects, make suggestions, and solve the murder mystery.",
  keywords: ["murder mystery", "board game", "multiplayer", "detective", "online game"],
  appleWebApp: { capable: true, title: "Cluebound Chronicles" },
  icons: {
    icon: "/cluebound-chronicles-portfolio-logo.png",
    apple: "/cluebound-chronicles-portfolio-logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1a1410",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-mansion-dark text-cream"
      >
        <AuthProvider>
          <SidebarProvider>
            <Header />
            <AppShell>{children}</AppShell>
            <Footer />
            <ToastContainer />
          </SidebarProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
