"use client";

import React, { useState, useEffect, ReactNode } from "react";
import Sidebar from "./Sidebar";
import MobileBottomNav from "./MobileBottomNav";
import { Menu } from "lucide-react";

export interface DashboardLayoutProps {
  children: ReactNode;
  activePurchaseSubTab?: string | null;
  onSelectPurchaseSubTab?: (tab: "company" | "dealer" | "local_customer" | null) => void;
  className?: string;
}

export default function DashboardLayout({
  children,
  activePurchaseSubTab,
  onSelectPurchaseSubTab,
  className = "",
}: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sidebar_collapsed");
      if (saved !== null) {
        setCollapsed(saved === "true");
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const handleSetCollapsed = (val: boolean | ((prev: boolean) => boolean)) => {
    setCollapsed((prev) => {
      const nextVal = typeof val === "function" ? val(prev) : val;
      try {
        localStorage.setItem("sidebar_collapsed", String(nextVal));
      } catch (e) {
        // ignore
      }
      return nextVal;
    });
  };

  return (
    <div className={`min-h-screen bg-slate-50 flex flex-col md:flex-row ${className}`}>
      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:block shrink-0">
        <Sidebar
          collapsed={collapsed}
          setCollapsed={handleSetCollapsed}
          activePurchaseSubTab={activePurchaseSubTab}
          onSelectPurchaseSubTab={onSelectPurchaseSubTab}
        />
      </div>

      {/* Mobile Top App Bar with Drawer Toggle */}
      <div className="md:hidden sticky top-0 z-40 bg-[#0f283d] text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            title="Open Menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-lg">🏍️</span>
            <span className="font-bold text-sm tracking-wide">AMMAR AUTOS</span>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 w-72 max-w-[85vw] h-full shadow-2xl animate-in slide-in-from-left duration-200">
            <Sidebar
              collapsed={false}
              setCollapsed={() => setMobileOpen(false)}
              activePurchaseSubTab={activePurchaseSubTab}
              onSelectPurchaseSubTab={(tab) => {
                if (onSelectPurchaseSubTab) onSelectPurchaseSubTab(tab);
                setMobileOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="flex-1">{children}</div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
