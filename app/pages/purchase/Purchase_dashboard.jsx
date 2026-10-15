"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserCheck,
  Building2,
  Users,
  ArrowRight,
  Plus,
  RefreshCw,
  Search,
  ShoppingCart,
  Sparkles,
} from "lucide-react";
import DashboardLayout from "@/app/components/DashboardLayout";
import CompanyPurchase from "./CompanyPurchase";
import DealerPurchase from "./DealerPurchase";
import LocalPurchase from "./LocalPurchase";

const purchaseCategories = [
  {
    key: "company",
    title: "Company Purchase",
    desc: "Direct procurement from manufacturing companies.",
    color: "text-teal-600",
    bg: "bg-teal-50",
    borderLeft: "border-l-4 border-l-teal-600 hover:border-teal-400",
    arrowBg: "bg-teal-50 group-hover:bg-teal-600",
    arrowColor: "text-teal-600 group-hover:text-white",
    icon: <UserCheck className="w-6 h-6" strokeWidth={2} />,
    tag: "Direct",
  },
  {
    key: "dealer",
    title: "Dealer Purchase",
    desc: "Wholesale bulk procurement from registered auto dealers.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    borderLeft: "border-l-4 border-l-emerald-600 hover:border-emerald-400",
    arrowBg: "bg-emerald-50 group-hover:bg-emerald-600",
    arrowColor: "text-emerald-600 group-hover:text-white",
    icon: <Building2 className="w-6 h-6" strokeWidth={2} />,
    tag: "Wholesale",
  },
  {
    key: "local_customer",
    title: "Local Customer Purchase",
    desc: "Trade-ins and direct purchases from walk-in local sellers.",
    color: "text-amber-600",
    bg: "bg-amber-50",
    borderLeft: "border-l-4 border-l-amber-600 hover:border-amber-400",
    arrowBg: "bg-amber-50 group-hover:bg-amber-600",
    arrowColor: "text-amber-600 group-hover:text-white",
    icon: <Users className="w-6 h-6" strokeWidth={2} />,
    tag: "Walk-in",
  },
];

export default function PurchaseDashboard() {
  const router = useRouter();
  const [activePage, setActivePage] = useState(null); // "company" | "dealer" | "local_customer" | null

  return (
    <DashboardLayout
      activePurchaseSubTab={activePage}
      onSelectPurchaseSubTab={(tab) => setActivePage(tab)}
    >
      <div className="flex-1 p-6 lg:p-10 pb-16">
        {/* If a sub-tab is chosen, render that specific UI */}
        {activePage === "company" && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-6">
            <CompanyPurchase goBack={() => setActivePage(null)} />
          </div>
        )}

        {activePage === "dealer" && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-6">
            <DealerPurchase goBack={() => setActivePage(null)} />
          </div>
        )}

        {activePage === "local_customer" && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-6">
            <LocalPurchase goBack={() => setActivePage(null)} />
          </div>
        )}

        {/* If no subtab selected, show redesigned 3 Purchasing Cards */}
        {!activePage && (
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Hero Banner inside Purchase */}
            <div className="bg-gradient-to-r from-teal-900 via-[#0f2e4a] to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
              <div className="relative z-10 max-w-xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-teal-300 text-xs font-bold mb-3">
                  <ShoppingCart size={13} />
                  <span>Inventory Acquisition Hub</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Choose Purchase Channel
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                  Record new motorcycle acquisitions with chassis/engine number tracing, supplier invoices, payable schedules, and automated inventory sync.
                </p>
              </div>
            </div>

            {/* 3 Redesigned Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {purchaseCategories.map((cat) => (
                <div
                  key={cat.key}
                  onClick={() => setActivePage(cat.key)}
                  className={`group relative bg-white rounded-2xl p-6 shadow-xs hover:shadow-xl transition-all duration-200 cursor-pointer border border-slate-200/80 flex flex-col justify-between min-h-[210px] ${cat.borderLeft} hover:-translate-y-1`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105 shadow-xs ${cat.bg} ${cat.color}`}
                      >
                        {cat.icon}
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 uppercase tracking-wider">
                        {cat.tag}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-800 tracking-tight leading-tight mb-1.5 group-hover:text-teal-700 transition-colors">
                      {cat.title}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">
                      {cat.desc}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-100 text-xs font-semibold text-slate-500 group-hover:text-slate-900 transition-colors">
                    <span>Open Form</span>
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${cat.arrowBg} ${cat.arrowColor}`}
                    >
                      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
