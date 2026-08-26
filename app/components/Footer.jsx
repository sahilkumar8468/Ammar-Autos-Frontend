"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowUp } from "lucide-react";

export default function Footer() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const navigateTo = (path) => {
    if (mounted && router) {
      router.push(path);
    }
  };

  return (
    <footer className="w-full bg-slate-900 text-slate-400 text-xs border-t border-slate-800 mt-12 mb-16 md:mb-0">
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        <div className="space-y-1">
          <div className="flex items-center justify-center md:justify-start gap-2 text-white font-black text-sm">
            <span>🏍️ Ammar Autos</span>
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] rounded-full font-bold">
              v2.0 Mobile Ready
            </span>
          </div>
          <p className="text-slate-400 font-medium">
            Complete Pakistani Auto Showroom Management System & Daily Financial Ledger
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 text-slate-300 font-bold">
          <button onClick={() => navigateTo("/dashboard")} className="hover:text-white transition-colors cursor-pointer">
            Dashboard
          </button>
          <span>•</span>
          <button onClick={() => navigateTo("/expense-dashboard")} className="hover:text-white transition-colors cursor-pointer">
            Daily Expense
          </button>
          <span>•</span>
          <button onClick={() => navigateTo("/earning-dashboard")} className="hover:text-white transition-colors cursor-pointer">
            Profit Reports
          </button>
          <span>•</span>
          <button onClick={() => navigateTo("/registration-dashboard")} className="hover:text-white transition-colors cursor-pointer">
            Registrations
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold">
            <ShieldCheck size={14} className="text-emerald-400" /> Secure Data
          </span>
          <button
            onClick={scrollToTop}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-all border border-slate-700 shadow-2xs cursor-pointer"
            title="Scroll to top"
          >
            <ArrowUp size={16} />
          </button>
        </div>
      </div>

      <div className="w-full bg-slate-950/80 py-3 text-center text-[11px] text-slate-500 font-medium border-t border-slate-800/60">
        © {new Date().getFullYear()} Ammar Autos Point of Sale System • Designed for Mobile, Tablet & Desktop
      </div>
    </footer>
  );
}
