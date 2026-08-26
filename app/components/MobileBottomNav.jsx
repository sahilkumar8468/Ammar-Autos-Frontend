"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Banknote,
  Receipt,
  TrendingUp
} from "lucide-react";

export default function MobileBottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { label: "Home", icon: <LayoutDashboard size={20} />, route: "/dashboard" },
    { label: "Purchase", icon: <ShoppingCart size={20} />, route: "/purchase-dashboard" },
    { label: "Sales", icon: <Banknote size={20} />, route: "/pages/sales" },
    { label: "Ledger", icon: <Receipt size={20} />, route: "/expense-dashboard" },
    { label: "Profit", icon: <TrendingUp size={20} />, route: "/earning-dashboard" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 shadow-lg px-2 py-1.5 md:hidden">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.route || (pathname && pathname.startsWith(item.route));
          return (
            <button
              key={item.route}
              onClick={() => router.push(item.route)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? "text-slate-900 font-black bg-slate-100"
                  : "text-slate-500 hover:text-slate-900 font-medium"
              }`}
            >
              <div className={isActive ? "scale-110 text-slate-900 transition-transform" : ""}>
                {item.icon}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-black">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
