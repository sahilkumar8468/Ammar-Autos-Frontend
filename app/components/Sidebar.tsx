"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Menu,
  Building2,
  UserCheck,
  User,
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (val: boolean | ((prev: boolean) => boolean)) => void;
  activePurchaseSubTab?: string | null;
  onSelectPurchaseSubTab?: (tab: "company" | "dealer" | "local_customer" | null) => void;
}

export default function Sidebar({
  collapsed,
  setCollapsed,
  activePurchaseSubTab,
  onSelectPurchaseSubTab,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [purchaseOpen, setPurchaseOpen] = useState(true);

  const isPurchasePage = pathname?.includes("purchase") || false;

  const handlePurchaseClick = () => {
    if (collapsed) {
      setCollapsed(false);
      setPurchaseOpen(true);
      if (!isPurchasePage) router.push("/purchase-dashboard");
      return;
    }
    setPurchaseOpen(!purchaseOpen);
    if (!isPurchasePage) {
      router.push("/purchase-dashboard");
    }
  };

  const handleSubTabClick = (tab: "company" | "dealer" | "local_customer") => {
    if (onSelectPurchaseSubTab) {
      onSelectPurchaseSubTab(tab);
    } else {
      router.push("/purchase-dashboard");
    }
  };

  const navItems = [
    {
      title: "Sales",
      route: "/pages/sales",
      icon: <Banknote size={19} className="text-[#16a34a]" />,
      activeColor: "bg-[#eaf8ee] text-[#16a34a] font-bold border-l-4 border-[#16a34a]",
    },
    {
      title: "Earning & Profit",
      route: "/earning-dashboard",
      icon: <TrendingUp size={19} className="text-[#00897b]" />,
      activeColor: "bg-[#e0f7fa] text-[#00897b] font-bold border-l-4 border-[#00897b]",
    },
    {
      title: "Daily Expense",
      route: "/expense-dashboard",
      icon: <Calendar size={19} className="text-[#ea580c]" />,
      activeColor: "bg-[#fff3e0] text-[#ea580c] font-bold border-l-4 border-[#ea580c]",
    },
    {
      title: "Inventory",
      route: "/inventory-dashboard",
      icon: <Box size={19} className="text-[#334155]" />,
      activeColor: "bg-[#edf2f7] text-[#334155] font-bold border-l-4 border-[#334155]",
    },
    {
      title: "Registration",
      route: "/registration-dashboard",
      icon: <FileText size={19} className="text-[#9333ea]" />,
      activeColor: "bg-[#f3e8ff] text-[#9333ea] font-bold border-l-4 border-[#9333ea]",
    },
    {
      title: "Customer",
      route: "/customer-dashboard",
      icon: <Users size={19} className="text-[#0284c7]" />,
      activeColor: "bg-[#e0f7fa] text-[#0284c7] font-bold border-l-4 border-[#0284c7]",
    },
    {
      title: "Reports",
      route: "/reports-dashboard",
      icon: <FileSpreadsheet size={19} className="text-[#475569]" />,
      activeColor: "bg-[#f1f5f9] text-[#475569] font-bold border-l-4 border-[#475569]",
    },
  ];

  return (
    <aside
      className={`relative bg-white border-r border-slate-200 transition-all duration-300 flex flex-col justify-between shrink-0 select-none z-30 shadow-xs ${collapsed ? "w-[72px]" : "w-64"
        }`}
    >
      <div>
        {/* Sidebar Brand & Collapse Toggle */}
        <div className="h-16 px-4 border-b border-slate-100 flex items-center justify-between">
          {!collapsed ? (
            <div
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-[#0b243b] flex items-center justify-center p-1.5 shadow-sm group-hover:scale-105 transition-transform">
                <img
                  src="/sport-bike.svg"
                  alt="Ammar Autos Logo"
                  className="w-full h-full object-contain filter invert brightness-200"
                />
              </div>
              <div className="overflow-hidden">
                <h1 className="text-sm font-black tracking-tight text-[#0f2e4a] uppercase truncate">
                  Ammar Autos
                </h1>
                <p className="text-[10px] text-slate-400 font-medium truncate -mt-0.5">
                  Showroom Management
                </p>
              </div>
            </div>
          ) : (
            <div
              onClick={() => router.push("/dashboard")}
              className="w-9 h-9 mx-auto rounded-xl bg-[#0b243b] flex items-center justify-center p-1.5 shadow-sm cursor-pointer hover:scale-105 transition-transform"
              title="Dashboard"
            >
              <img
                src="/sport-bike.svg"
                alt="Ammar Autos Logo"
                className="w-full h-full object-contain filter invert brightness-200"
              />
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-140px)]">
          {/* Dashboard Back link */}
          <button
            onClick={() => router.push("/dashboard")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${pathname === "/dashboard"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            title="Dashboard Overview"
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <span className="text-base">🏠</span>
            </div>
            {!collapsed && <span className="truncate">Dashboard Overview</span>}
          </button>

          {/* Purchasing Group with Dropdown */}
          <div className="rounded-xl overflow-hidden transition-all">
            <button
              onClick={handlePurchaseClick}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${isPurchasePage
                ? "bg-[#e2f7f4] text-[#0d9488] font-bold border-l-4 border-[#0d9488]"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              title="Purchase Management"
            >
              <div className="flex items-center gap-3 truncate">
                <div className="w-5 h-5 flex items-center justify-center text-[#0d9488]">
                  <ShoppingCart size={19} />
                </div>
                {!collapsed && <span className="truncate">Purchasing</span>}
              </div>
              {!collapsed && (
                <ChevronDown
                  size={15}
                  className={`text-slate-400 transition-transform duration-200 ${purchaseOpen ? "rotate-180" : ""
                    }`}
                />
              )}
            </button>

            {/* 3 Purchasing Child Tabs */}
            {!collapsed && purchaseOpen && (
              <div className="ml-5 pl-3 border-l-2 border-[#0d9488]/30 py-1 space-y-1 mt-1">
                <button
                  onClick={() => handleSubTabClick("company")}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left ${activePurchaseSubTab === "company"
                    ? "bg-[#0d9488] text-white shadow-xs font-semibold"
                    : "text-slate-600 hover:bg-slate-100 hover:text-[#0d9488]"
                    }`}
                >
                  <UserCheck size={14} />
                  <span className="truncate">Company Purchase</span>
                </button>

                <button
                  onClick={() => handleSubTabClick("dealer")}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left ${activePurchaseSubTab === "dealer"
                    ? "bg-[#0d9488] text-white shadow-xs font-semibold"
                    : "text-slate-600 hover:bg-slate-100 hover:text-[#0d9488]"
                    }`}
                >
                  <Building2 size={14} />
                  <span className="truncate">Dealer Purchase</span>
                </button>

                <button
                  onClick={() => handleSubTabClick("local_customer")}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left ${activePurchaseSubTab === "local_customer"
                    ? "bg-[#0d9488] text-white shadow-xs font-semibold"
                    : "text-slate-600 hover:bg-slate-100 hover:text-[#0d9488]"
                    }`}
                >
                  <Users size={14} />
                  <span className="truncate">Local Customer</span>
                </button>
              </div>
            )}
          </div>

          {/* Other Nav Items from Dashboard */}
          {navItems.map((item, idx) => {
            const isActive = pathname?.startsWith(item.route);
            return (
              <button
                key={idx}
                onClick={() => router.push(item.route)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${isActive
                  ? item.activeColor
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                title={item.title}
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  {item.icon}
                </div>
                {!collapsed && <span className="truncate">{item.title}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Logout button at bottom */}
      <div className="p-3 border-t border-slate-100">
        <button
          onClick={() => router.push("/")}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
          title="Logout"
        >
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
