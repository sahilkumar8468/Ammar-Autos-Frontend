"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  DollarSign,
  Package,
  User,
  Truck,
  CreditCard,
  BarChart2,
  Banknote,
  Settings,
  LogOut,
  FileText,
  TrendingUp,
} from "lucide-react";

const modules = [
  { icon: <ShoppingCart size={28} />, label: "Purchase", color: "bg-blue-50 text-blue-600 hover:bg-blue-100", route: "/purchase-dashboard" },
  { icon: <DollarSign size={28} />, label: "Sales", color: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100", route: "/pages/sales" },
  { icon: <TrendingUp size={28} />, label: "Earning & Profit", color: "bg-teal-50 text-teal-600 hover:bg-teal-100", route: "/earning-dashboard" },
  { icon: <Package size={28} />, label: "Inventory", color: "bg-amber-50 text-amber-600 hover:bg-amber-100", route: "/inventory-dashboard" },
  { icon: <FileText size={28} />, label: "Registration", color: "bg-purple-50 text-purple-600 hover:bg-purple-100", route: "/registration-dashboard" },
  { icon: <User size={28} />, label: "Customer", color: "bg-indigo-50 text-indigo-600 hover:bg-indigo-100", route: "/customer-dashboard" },
  { icon: <BarChart2 size={28} />, label: "Reports", color: "bg-cyan-50 text-cyan-600 hover:bg-cyan-100", route: "/reports-dashboard" },
  { icon: <LogOut size={28} />, label: "Logout", color: "bg-red-50 text-red-600 hover:bg-red-100", route: "/" },
];

export default function DashboardPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans antialiased">
      {/* Modern Header Banner */}
      <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm backdrop-blur-md bg-white/80">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-md shadow-slate-900/10">
              <span role="img" aria-label="motorbike" className="text-xl block leading-none">🏍️</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Ammar Autos</h1>
              <p className="text-xs text-slate-500 font-medium -mt-0.5">Point of Sale System</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Section Heading */}
        <div className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Core Modules</h2>
          <div className="h-1 w-12 bg-slate-900 mt-2 rounded-full" />
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5">
          {modules.map((mod, idx) => (
            <button
              key={idx}
              onClick={() => mod.route && router.push(mod.route)}
              className="group relative flex flex-col items-center justify-between p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-slate-300 hover:-translate-y-1 transition-all duration-300 ease-out text-center cursor-pointer w-full aspect-square"
            >
              {/* Text Label at Top (Keeps the core legacy structure but cleaned up) */}
              <span className="text-xs font-bold tracking-wider text-slate-500 uppercase group-hover:text-slate-900 transition-colors duration-200">
                {mod.label}
              </span>

              {/* Modernized Icon Container with Contextual Palette */}
              <div className={`p-4 rounded-2xl transition-all duration-300 group-hover:scale-110 ${mod.color}`}>
                {mod.icon}
              </div>

              {/* Decorative bottom indicator line for interactive feel */}
              <div className="w-8 h-1 bg-transparent group-hover:bg-slate-900 rounded-full transition-all duration-300 mt-2 opacity-0 group-hover:opacity-100" />
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}