import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import SyncButton from "@/app/components/SyncButton";

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ammar Autos - Desktop POS App",
  description: "Offline-First Bike Showroom POS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-mono", jetbrainsMono.variable)}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100">
        <header className="sticky top-0 z-50 p-2 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md flex justify-between items-center px-4 shadow-md">
          <div className="flex items-center gap-2">
            <span className="font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-400 to-emerald-400 text-lg">
              AMMAR AUTOS POS
            </span>
          </div>
          <SyncButton />
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
