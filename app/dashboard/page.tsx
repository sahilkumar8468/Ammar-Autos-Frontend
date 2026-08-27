"use client";

export const dynamic = "force-dynamic";

import React from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Package,
  User,
  BarChart2,
  Banknote,
  LogOut,
  FileText,
  TrendingUp,
  Receipt,
} from "lucide-react";
import MobileBottomNav from "@/app/components/MobileBottomNav";
import Footer from "@/app/components/Footer";
import SyncButton from "@/app/components/SyncButton";

const modules = [
  { icon: <ShoppingCart size={28} />, label: "Purchase", color: "bg-blue-50 text-blue-600 hover:bg-blue-100", route: "/purchase-dashboard" },
  { icon: <Banknote size={28} />, label: "Sales", color: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100", route: "/pages/sales" },
  { icon: <TrendingUp size={28} />, label: "Earning & Profit", color: "bg-teal-50 text-teal-600 hover:bg-teal-100", route: "/earning-dashboard" },
  { icon: <Receipt size={28} />, label: "Daily Expense", color: "bg-rose-50 text-rose-600 hover:bg-rose-100", route: "/expense-dashboard" },
  { icon: <Package size={28} />, label: "Inventory", color: "bg-amber-50 text-amber-600 hover:bg-amber-100", route: "/inventory-dashboard" },
  { icon: <FileText size={28} />, label: "Registration", color: "bg-purple-50 text-purple-600 hover:bg-purple-100", route: "/registration-dashboard" },
  { icon: <User size={28} />, label: "Customer", color: "bg-indigo-50 text-indigo-600 hover:bg-indigo-100", route: "/customer-dashboard" },
  { icon: <BarChart2 size={28} />, label: "Reports", color: "bg-cyan-50 text-cyan-600 hover:bg-cyan-100", route: "/reports-dashboard" },
  { icon: <LogOut size={28} />, label: "Logout", color: "bg-red-50 text-red-600 hover:bg-red-100", route: "/" },
];

export default function DashboardPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans antialiased flex flex-col justify-between pb-16 md:pb-0">
      <div>
        {/* Header Banner with Title & Sync Buttons */}
        <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs backdrop-blur-md bg-white/90 px-4 sm:px-6 py-3.5 sm:py-4">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-slate-900 text-white p-2 sm:p-2.5 rounded-xl shadow-md shadow-slate-900/10">
                <span role="img" aria-label="motorbike" className="text-lg sm:text-xl block leading-none">🏍️</span>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">Ammar Autos</h1>
                <p className="text-[11px] sm:text-xs text-slate-500 font-medium -mt-0.5">Point of Sale & Showroom Management System</p>
              </div>
            </div>
            
            {/* Sync, Export & Import Action Buttons */}
            <SyncButton />
          </div>
        </header>

        {/* Main Container */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          {/* Section Heading */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Core Showroom Modules</h2>
            <div className="h-1 w-12 bg-slate-900 mt-1.5 rounded-full" />
          </div>

          {/* Bento Grid — Responsive Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 sm:gap-5">
            {modules.map((mod, idx) => (
              <button
                key={idx}
                onClick={() => router.push(mod.route)}
                className={`flex flex-col items-center justify-center p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 group cursor-pointer ${mod.color}`}
              >
                <div className="mb-3 transition-transform duration-200 group-hover:scale-110">
                  {mod.icon}
                </div>
                <span className="text-xs font-bold text-center tracking-tight">{mod.label}</span>
              </button>
            ))}
          </div>
        </main>
      </div>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}