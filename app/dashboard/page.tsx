"use client";

export const dynamic = "force-dynamic";

import React from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Banknote,
  TrendingUp,
  Calendar,
  Box,
  FileText,
  Users,
  FileSpreadsheet,
  LogOut,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  PlusCircle,
  FileDown,
} from "lucide-react";
import DashboardLayout from "@/app/components/DashboardLayout";

interface ModuleCard {
  title: string;
  desc: string;
  route: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  borderAccent: string;
  tag?: string;
}

const modules: ModuleCard[] = [
  {
    title: "Purchasing",
    desc: "Procure company, dealer & local bikes.",
    route: "/purchase-dashboard",
    icon: <ShoppingCart className="w-5 h-5" strokeWidth={2.2} />,
    iconBg: "bg-teal-50",
    iconColor: "text-teal-600",
    borderAccent: "hover:border-teal-400 group-hover:shadow-teal-500/10",
    tag: "Core",
  },
  {
    title: "Sales & Invoicing",
    desc: "Cash & installment bike sales with PDF slips.",
    route: "/pages/sales",
    icon: <Banknote className="w-5 h-5" strokeWidth={2.2} />,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    borderAccent: "hover:border-emerald-400 group-hover:shadow-emerald-500/10",
    tag: "Revenue",
  },
  {
    title: "Earning & Profit",
    desc: "Analyze bike margins, net earnings & trends.",
    route: "/earning-dashboard",
    icon: <TrendingUp className="w-5 h-5" strokeWidth={2.2} />,
    iconBg: "bg-cyan-50",
    iconColor: "text-cyan-600",
    borderAccent: "hover:border-cyan-400 group-hover:shadow-cyan-500/10",
  },
  {
    title: "Daily Expenses",
    desc: "Track daily workshop, wages & miscellaneous outlays.",
    route: "/expense-dashboard",
    icon: <Calendar className="w-5 h-5" strokeWidth={2.2} />,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    borderAccent: "hover:border-amber-400 group-hover:shadow-amber-500/10",
  },
  {
    title: "Inventory Stock",
    desc: "Real-time showroom bike inventory & valuations.",
    route: "/inventory-dashboard",
    icon: <Box className="w-5 h-5" strokeWidth={2.2} />,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-700",
    borderAccent: "hover:border-slate-400 group-hover:shadow-slate-500/10",
  },
  {
    title: "Vehicle Registration",
    desc: "Manage excise papers, agent filings & plate status.",
    route: "/registration-dashboard",
    icon: <FileText className="w-5 h-5" strokeWidth={2.2} />,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
    borderAccent: "hover:border-purple-400 group-hover:shadow-purple-500/10",
  },
  {
    title: "Customer CRM",
    desc: "Customer balances, CNIC & overdue payment recovery.",
    route: "/customer-dashboard",
    icon: <Users className="w-5 h-5" strokeWidth={2.2} />,
    iconBg: "bg-sky-50",
    iconColor: "text-sky-600",
    borderAccent: "hover:border-sky-400 group-hover:shadow-sky-500/10",
  },
  {
    title: "Reports & Charts",
    desc: "Executive visual charts, analytics & PDF data exports.",
    route: "/reports-dashboard",
    icon: <FileSpreadsheet className="w-5 h-5" strokeWidth={2.2} />,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
    borderAccent: "hover:border-indigo-400 group-hover:shadow-indigo-500/10",
    tag: "Visual BI",
  },
];

export default function DashboardPage() {
  const router = useRouter();

  return (
    <DashboardLayout>
      <div className="min-h-full bg-[#f8fafc] text-slate-800 font-sans pb-16 selection:bg-teal-100">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs px-6 lg:px-10 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0b243b] to-[#1e3a5f] flex items-center justify-center p-2 shadow-md">
              <img
                src="/sport-bike.svg"
                alt="Ammar Autos Logo"
                className="w-full h-full object-contain filter invert brightness-200"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-[#0f2e4a] uppercase">
                  Ammar Autos
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live System
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Showroom Management &amp; Point of Sale
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/pages/sales")}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <PlusCircle size={14} />
              <span className="hidden sm:inline">New Sale</span>
            </button>
            <button
              onClick={() => router.push("/reports-dashboard")}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <FileSpreadsheet size={14} />
              <span className="hidden sm:inline">Reports</span>
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-8 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-slate-900 via-[#0f283d] to-[#0d9488]/80 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
              <img src="/sport-bike.svg" alt="" className="w-full h-full object-contain filter invert" />
            </div>

            <div className="relative z-10 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-300 text-xs font-bold mb-3">
                <Sparkles size={13} />
                <span>Modern Showroom Command Center</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Control Every Aspect of Your Showroom
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                Streamline motorcycle purchases, cash &amp; installment agreements, profit calculation, inventory tracking, and visual analytics in real time.
              </p>
            </div>

            <div className="relative z-10 flex flex-wrap gap-2.5">
              <button
                onClick={() => router.push("/reports-dashboard")}
                className="px-4 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                <FileSpreadsheet size={14} className="text-indigo-600" />
                <span>View Reports &amp; Charts</span>
              </button>
              <button
                onClick={() => router.push("/purchase-dashboard")}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs transition-all cursor-pointer flex items-center gap-2"
              >
                <ShoppingCart size={14} className="text-teal-300" />
                <span>Purchasing</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modules Grid */}
        <main className="max-w-7xl mx-auto px-6 lg:px-10 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Operational Modules
              </h3>
              <p className="text-xs text-slate-400">Select a section to begin work</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {modules.map((mod, idx) => (
              <div
                key={idx}
                onClick={() => router.push(mod.route)}
                className={`group relative bg-white rounded-2xl p-5 shadow-xs hover:shadow-lg transition-all duration-200 cursor-pointer border border-slate-200/80 flex flex-col justify-between min-h-[170px] hover:-translate-y-1 ${mod.borderAccent}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110 ${mod.iconBg} ${mod.iconColor}`}>
                      {mod.icon}
                    </div>
                    {mod.tag && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 uppercase tracking-wider">
                        {mod.tag}
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 tracking-tight mb-1 group-hover:text-indigo-600 transition-colors">
                    {mod.title}
                  </h4>
                  <p className="text-[12px] text-slate-400 font-medium leading-relaxed">
                    {mod.desc}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100 text-[11px] font-semibold text-slate-400 group-hover:text-slate-900 transition-colors">
                  <span>Open Module</span>
                  <div className="w-6 h-6 rounded-full bg-slate-50 group-hover:bg-slate-900 group-hover:text-white flex items-center justify-center transition-all">
                    <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
}