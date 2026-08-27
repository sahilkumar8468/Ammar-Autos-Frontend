"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Building2, UserCheck, ArrowLeft } from "lucide-react";
import CompanyPurchase from "./CompanyPurchase";
import DealerPurchase from "./DealerPurchase";
import MobileBottomNav from "@/app/components/MobileBottomNav";

const purchaseCategories = [
  {
    icon: <UserCheck size={28} />,
    label: "Company Purchase",
    description: "Direct purchases by Company",
    color: "bg-blue-50 text-blue-600 hover:bg-blue-100",
    key: "company",
  },
  {
    icon: <Building2 size={28} />,
    label: "Dealer Purchase",
    description: "Bulk purchases by registered dealers",
    color: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100",
    key: "dealer",
  },
  {
    icon: <Users size={28} />,
    label: "Local Customer Purchase",
    description: "Purchases by local walk-in customers",
    color: "bg-amber-50 text-amber-600 hover:bg-amber-100",
    key: "local_customer",
  },
];

export default function PurchaseDashboard() {
  const router = useRouter();
  const [activePage, setActivePage] = useState(null); // null = show cards

  // If a sub-page is active, render it with a goBack prop
  if (activePage === "company") return <CompanyPurchase goBack={() => setActivePage(null)} />;
  if (activePage === "dealer") return <DealerPurchase goBack={() => setActivePage(null)} />;
  if (activePage === "local_customer") return <LocalPurchase goBack={() => setActivePage(null)} />;

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans antialiased">
      <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm backdrop-blur-md bg-white/80">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-md shadow-slate-900/10">
              <span role="img" aria-label="motorbike" className="text-xl block leading-none">🏍️</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Ammar Autos</h1>
              <p className="text-xs text-slate-500 font-medium -mt-0.5">Purchase Management</p>
            </div>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors duration-200"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Purchase Categories</h2>
          <div className="h-1 w-12 bg-slate-900 mt-2 rounded-full" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {purchaseCategories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActivePage(cat.key)}
              className="group relative flex flex-col items-center justify-between p-8 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-slate-300 hover:-translate-y-1 transition-all duration-300 ease-out text-center cursor-pointer w-full"
            >
              <span className="text-xs font-bold tracking-wider text-slate-500 uppercase group-hover:text-slate-900 transition-colors duration-200">
                {cat.label}
              </span>
              <div className={`p-5 rounded-2xl transition-all duration-300 group-hover:scale-110 mt-4 mb-3 ${cat.color}`}>
                {cat.icon}
              </div>
              <p className="text-xs text-slate-400 group-hover:text-slate-500 transition-colors duration-200 leading-relaxed">
                {cat.description}
              </p>
              <div className="w-8 h-1 bg-transparent group-hover:bg-slate-900 rounded-full transition-all duration-300 mt-4 opacity-0 group-hover:opacity-100" />
            </button>
          ))}
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}
