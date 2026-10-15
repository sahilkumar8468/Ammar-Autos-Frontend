"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import MobileBottomNav from "./MobileBottomNav";
import { Menu } from "lucide-react";

export default function DashboardLayout({
  children,
  activePurchaseSubTab,
  onSelectPurchaseSubTab,
  className = "",
}) {
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

  const handleSetCollapsed = (val) => {
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
    <div className="flex h-screen w-full bg-[#f8fafc] text-slate-800 font-sans overflow-hidden antialiased">
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar for Desktop & Mobile Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform md:relative md:translate-x-0 transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <Sidebar
          collapsed={collapsed}
          setCollapsed={handleSetCollapsed}
          activePurchaseSubTab={activePurchaseSubTab}
          onSelectPurchaseSubTab={(tab) => {
            setMobileOpen(false);
            if (onSelectPurchaseSubTab) onSelectPurchaseSubTab(tab);
          }}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Mobile Header Bar (Only visible on small screens to toggle sidebar) */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 shrink-0 z-20">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Open Sidebar"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#0b243b] flex items-center justify-center p-1 shadow-xs">
              <img
                src="/sport-bike.svg"
                alt="Ammar Autos"
                className="w-full h-full object-contain filter invert brightness-200"
              />
            </div>
            <span className="font-extrabold text-xs tracking-tight text-[#0f2e4a] uppercase">
              Ammar Autos
            </span>
          </div>
          <div className="w-7" />
        </div>

        {/* Scrollable Page Content Container */}
        <div className={`flex-1 overflow-y-auto ${className}`}>
          {children}
        </div>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />
      </div>
    </div>
  );
}
