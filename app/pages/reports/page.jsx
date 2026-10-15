"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  ShoppingCart,
  CreditCard,
  FileText,
  CalendarRange,
  Search,
  Download,
  RefreshCw,
  Loader2,
  Bike,
  PieChart as PieChartIcon,
  BarChart3,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  DollarSign,
  Layers,
  Sparkles,
  Check,
  Eye,
  FileDown,
  X,
} from "lucide-react";
import DashboardLayout from "@/app/components/DashboardLayout";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5000";

function fmt(n) {
  return `Rs. ${Number(n || 0).toLocaleString()}`;
}

const formatDateTime = (value) => {
  if (!value) return "—";
  let d;
  if (typeof value === "object") {
    if (typeof value.toDate === "function") d = value.toDate();
    else {
      const secs = value._seconds ?? value.seconds;
      if (typeof secs === "number") d = new Date(secs * 1000);
    }
  }
  if (!d) d = new Date(value);
  if (isNaN(d.getTime())) return "—";

  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString("en-GB", { month: "short" }).toUpperCase();
  const year = d.getFullYear();
  const minute = String(d.getMinutes()).padStart(2, "0");
  const isPm = d.getHours() >= 12;
  const hour12 = d.getHours() % 12 || 12;

  return `${day}/${month}/${year} ${hour12}:${minute}${isPm ? "PM" : "AM"}`;
};

export default function ReportsDashboard() {
  const router = useRouter();
  const printRef = useRef(null);

  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "sales" | "purchases" | "registrations"
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({});
  const [allSales, setAllSales] = useState([]);
  const [allPurchases, setAllPurchases] = useState([]);
  const [allRegistrations, setAllRegistrations] = useState([]);

  // Filters (Purchase page style search inputs)
  const [dateRangePreset, setDateRangePreset] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchCustomer, setSearchCustomer] = useState("");
  const [searchChasis, setSearchChasis] = useState("");
  const [searchEngine, setSearchEngine] = useState("");
  const [appliedCustomer, setAppliedCustomer] = useState("");
  const [appliedChasis, setAppliedChasis] = useState("");
  const [appliedEngine, setAppliedEngine] = useState("");

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/reports`);
      const result = await res.json();
      if (res.ok) {
        setSummary(result.summary || {});
        setAllSales(result.data?.sales || []);
        setAllPurchases(result.data?.purchases || []);
        setAllRegistrations(result.data?.registrations || []);
      }
    } catch (e) {
      console.error("Failed to load reports data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handlePresetChange = (preset) => {
    setDateRangePreset(preset);
    const now = new Date();
    if (preset === "all") {
      setDateFrom("");
      setDateTo("");
    } else if (preset === "today") {
      const d = now.toISOString().slice(0, 10);
      setDateFrom(d);
      setDateTo(d);
    } else if (preset === "thisMonth") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
      setDateFrom(start);
      setDateTo(end);
    } else if (preset === "lastMonth") {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
      const end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
      setDateFrom(start);
      setDateTo(end);
    }
  };

  const handleApplyFilters = () => {
    setAppliedCustomer(searchCustomer.trim().toLowerCase());
    setAppliedChasis(searchChasis.trim().toLowerCase());
    setAppliedEngine(searchEngine.trim().toLowerCase());
  };

  const handleClearFilters = () => {
    setSearchCustomer("");
    setSearchChasis("");
    setSearchEngine("");
    setAppliedCustomer("");
    setAppliedChasis("");
    setAppliedEngine("");
    setDateFrom("");
    setDateTo("");
    setDateRangePreset("all");
  };

  const hasActiveFilters = Boolean(appliedCustomer || appliedChasis || appliedEngine || dateFrom || dateTo);

  const parseDate = (val) => {
    if (!val) return null;
    if (val.seconds != null) return new Date(val.seconds * 1000);
    if (val._seconds != null) return new Date(val._seconds * 1000);
    if (typeof val.toDate === "function") return val.toDate();
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  };

  // Filter helper matching Purchase Search UI
  const filterList = (items, dateKeys, nameField) => {
    const from = dateFrom ? new Date(dateFrom + "T00:00:00.000Z") : null;
    const to = dateTo ? new Date(dateTo + "T23:59:59.999Z") : null;

    return items.filter((item) => {
      // Date filter
      if (from || to) {
        const itemDate = dateKeys.map((k) => parseDate(item[k])).find(Boolean);
        if (!itemDate) return false;
        if (from && itemDate < from) return false;
        if (to && itemDate > to) return false;
      }
      // Customer / Buyer Search
      if (appliedCustomer) {
        const name = String(item[nameField] || "").toLowerCase();
        if (!name.includes(appliedCustomer)) return false;
      }
      // Chasis Search
      if (appliedChasis) {
        const chasis = String(item.chasisNo || "").toLowerCase();
        if (!chasis.includes(appliedChasis)) return false;
      }
      // Engine / Reg Search
      if (appliedEngine) {
        const engine = String(item.engineNo || "").toLowerCase();
        const reg = String(item.registrationNo || "").toLowerCase();
        if (!engine.includes(appliedEngine) && !reg.includes(appliedEngine)) return false;
      }
      return true;
    });
  };

  const filteredSales = useMemo(
    () => filterList(allSales, ["saleDateTime", "saleDate", "createdAt"], "buyerName"),
    [allSales, dateFrom, dateTo, appliedCustomer, appliedChasis, appliedEngine]
  );

  const filteredPurchases = useMemo(
    () => filterList(allPurchases, ["purchaseDateTime", "purchaseDate", "createdAt"], "customerName"),
    [allPurchases, dateFrom, dateTo, appliedCustomer, appliedChasis, appliedEngine]
  );

  const filteredRegistrations = useMemo(
    () => filterList(allRegistrations, ["registrationDateTime", "createdAt", "registrationDate"], "customerName"),
    [allRegistrations, dateFrom, dateTo, appliedCustomer, appliedChasis, appliedEngine]
  );

  // Computations
  const totalSalesRevenue = useMemo(() => filteredSales.reduce((acc, s) => acc + Number(s.totalSaleAmount || 0), 0), [filteredSales]);
  const totalAdvanceReceived = useMemo(() => filteredSales.reduce((acc, s) => acc + Number(s.advanceReceived || 0), 0), [filteredSales]);
  const totalInstallmentsReceived = useMemo(() => filteredSales.reduce((acc, s) => acc + Number(s.paidInstallments || 0), 0), [filteredSales]);
  const totalCollected = totalAdvanceReceived + totalInstallmentsReceived;

  const installmentSales = useMemo(() => filteredSales.filter((s) => (s.saleType || "").toLowerCase() === "installment"), [filteredSales]);
  const totalInstallmentPending = useMemo(() => {
    return installmentSales.reduce((acc, s) => {
      const balance = Number(s.totalSaleAmount || 0) - Number(s.advanceReceived || 0) - Number(s.paidInstallments || 0);
      return acc + Math.max(0, balance);
    }, 0);
  }, [installmentSales]);

  const totalPurchaseCost = useMemo(() => filteredPurchases.reduce((acc, p) => acc + Number(p.actualAmount || 0) + Number(p.additionalExpense || 0), 0), [filteredPurchases]);
  const totalPurchaseRemaining = useMemo(() => filteredPurchases.reduce((acc, p) => acc + Number(p.amountRemaining || 0), 0), [filteredPurchases]);

  const completedPapers = useMemo(() => filteredRegistrations.filter((r) => r.paperReceived === true).length, [filteredRegistrations]);
  const pendingPapers = useMemo(() => filteredRegistrations.filter((r) => !r.paperReceived).length, [filteredRegistrations]);
  const regShowroomProfit = useMemo(() => {
    return filteredRegistrations.reduce((acc, r) => acc + Math.max(0, Number(r.customerTotalMoney || 0) - Number(r.agentTotalMoney || 0)), 0);
  }, [filteredRegistrations]);

  // Chart Data 1: Monthly Timeline
  const timelineData = useMemo(() => {
    const map = new Map();
    filteredSales.forEach((s) => {
      const d = parseDate(s.saleDateTime || s.saleDate || s.createdAt);
      if (!d) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!map.has(key)) map.set(key, { period: key, sales: 0, purchases: 0, profit: 0, volume: 0 });
      const entry = map.get(key);
      entry.sales += Number(s.totalSaleAmount || 0);
      entry.volume += 1;
    });

    filteredPurchases.forEach((p) => {
      const d = parseDate(p.purchaseDateTime || p.purchaseDate || p.createdAt);
      if (!d) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!map.has(key)) map.set(key, { period: key, sales: 0, purchases: 0, profit: 0, volume: 0 });
      const entry = map.get(key);
      entry.purchases += Number(p.actualAmount || 0) + Number(p.additionalExpense || 0);
    });

    return Array.from(map.values())
      .map((item) => ({ ...item, profit: item.sales - item.purchases }))
      .sort((a, b) => a.period.localeCompare(b.period))
      .slice(-12);
  }, [filteredSales, filteredPurchases]);

  // Chart Data 2: Sales by Type
  const salesTypeData = useMemo(() => {
    let cash = 0;
    let cashCount = 0;
    let installment = 0;
    let installmentCount = 0;

    filteredSales.forEach((s) => {
      const isInst = (s.saleType || "").toLowerCase() === "installment";
      const amt = Number(s.totalSaleAmount || 0);
      if (isInst) {
        installment += amt;
        installmentCount += 1;
      } else {
        cash += amt;
        cashCount += 1;
      }
    });

    return [
      { name: "Cash Sales", value: cash, count: cashCount, color: "#10b981" },
      { name: "Installment Sales", value: installment, count: installmentCount, color: "#6366f1" },
    ];
  }, [filteredSales]);

  // Chart Data 3: Top Bike Brands
  const brandData = useMemo(() => {
    const brandMap = new Map();
    filteredSales.forEach((s) => {
      const raw = (s.bikeCompany || "Other").trim().toUpperCase();
      const brand = raw.includes("HONDA") ? "HONDA" : raw.includes("YAMAHA") ? "YAMAHA" : raw.includes("SUZUKI") ? "SUZUKI" : raw.includes("HI SPEED") ? "HI SPEED" : raw.includes("UNIQUE") ? "UNIQUE" : raw.includes("EXPRESS") ? "EXPRESS" : raw.includes("SUPER STAR") ? "SUPER STAR" : raw || "OTHER";
      if (!brandMap.has(brand)) brandMap.set(brand, { brand, count: 0, revenue: 0 });
      const entry = brandMap.get(brand);
      entry.count += 1;
      entry.revenue += Number(s.totalSaleAmount || 0);
    });

    return Array.from(brandMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  }, [filteredSales]);

  // Chart Data 4: Purchases by Sourcing Category
  const purchaseCategoryData = useMemo(() => {
    const map = { company: 0, dealer: 0, local_customer: 0 };
    filteredPurchases.forEach((p) => {
      const cat = p.category || "local_customer";
      map[cat] = (map[cat] || 0) + Number(p.actualAmount || 0);
    });

    return [
      { name: "Company", value: map.company || 0, color: "#0d9488" },
      { name: "Dealer", value: map.dealer || 0, color: "#3b82f6" },
      { name: "Local Customer", value: map.local_customer || 0, color: "#f59e0b" },
    ].filter((x) => x.value > 0);
  }, [filteredPurchases]);

  // Chart Data 5: Paper Status
  const paperStatusData = useMemo(() => {
    return [
      { name: "Completed Papers", value: completedPapers, color: "#10b981" },
      { name: "Pending Papers", value: pendingPapers, color: "#f43f5e" },
    ];
  }, [completedPapers, pendingPapers]);

  // PDF Print Trigger
  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open("", "_blank", "width=960,height=720");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ammar Autos - Business Intelligence & Financial Report</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
          body { background: #fff; color: #0f172a; padding: 24px; }
          .header { background: #0b243b; color: white; padding: 24px 30px; border-radius: 12px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; }
          .header h1 { font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
          .header p { font-size: 12px; opacity: 0.75; margin-top: 4px; }
          .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
          .card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; background: #f8fafc; }
          .card .title { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
          .card .val { font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 16px; margin-bottom: 28px; }
          thead tr { background: #f8fafc; border-bottom: 2px solid #e2e8f0; }
          th { padding: 8px 10px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; }
          td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; }
          tr:nth-child(even) td { background: #f8fafc; }
          .footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px; }
          @media print { body { padding: 12px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>🏍️ Ammar Autos Showroom</h1>
            <p>Comprehensive Business Analytics &amp; Payload Report</p>
          </div>
          <div style="text-align: right; font-size: 11px;">
            <div>Generated: ${new Date().toLocaleDateString("en-PK")}</div>
            ${dateFrom ? `<div>Range: ${dateFrom} to ${dateTo || "Present"}</div>` : `<div>Range: Full Lifetime History</div>`}
          </div>
        </div>

        <div class="summary-grid">
          <div class="card"><div class="title">Total Sales Revenue</div><div class="val">${fmt(totalSalesRevenue)}</div></div>
          <div class="card"><div class="title">Total Collected</div><div class="val">${fmt(totalCollected)}</div></div>
          <div class="card"><div class="title">Installments Pending</div><div class="val">${fmt(totalInstallmentPending)}</div></div>
          <div class="card"><div class="title">Total Purchases Outlay</div><div class="val">${fmt(totalPurchaseCost)}</div></div>
        </div>

        ${content.innerHTML}

        <div class="footer">
          Ammar Autos Management System &bull; Confidential &bull; Printed on ${new Date().toLocaleString("en-PK")}
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 400);
  };

  return (
    <DashboardLayout>
      <div className="min-h-full bg-[#f8fafc] text-slate-800 pb-16">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs px-6 py-4">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center shadow-md">
                <BarChart3 size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">Business Intelligence &amp; Reports</h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                    Live Analytics
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  Detailed analytics, charts, financial trends, and raw payload records
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all duration-150 cursor-pointer"
              >
                <Download size={14} />
                <span>Export / Print PDF</span>
              </button>

              <button
                onClick={fetchReports}
                disabled={loading}
                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                title="Refresh Report Data"
              >
                <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          {/* Purchase Page Style Search & Filter Row */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-4">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              {/* Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2 flex items-center gap-1">
                  <CalendarRange size={13} /> Period:
                </span>
                {[
                  { id: "all", label: "All Time" },
                  { id: "today", label: "Today" },
                  { id: "thisMonth", label: "This Month" },
                  { id: "lastMonth", label: "Last Month" },
                  { id: "custom", label: "Custom Dates" },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetChange(preset.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      dateRangePreset === preset.id
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Date pickers */}
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setDateRangePreset("custom");
                  }}
                  className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <span className="text-xs text-slate-400">to</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setDateRangePreset("custom");
                  }}
                  className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            {/* Purchase Page Style 3 Search Inputs + Search Button */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="Search by Customer / Buyer..."
                value={searchCustomer}
                onChange={(e) => setSearchCustomer(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
                className="flex-1 min-w-[200px] px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white shadow-2xs"
              />
              <input
                type="text"
                placeholder="Search by Chasis No..."
                value={searchChasis}
                onChange={(e) => setSearchChasis(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
                className="flex-1 min-w-[180px] px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white shadow-2xs"
              />
              <input
                type="text"
                placeholder="Search by Engine or Reg No..."
                value={searchEngine}
                onChange={(e) => setSearchEngine(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
                className="flex-1 min-w-[180px] px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white shadow-2xs"
              />

              <button
                onClick={handleApplyFilters}
                className="px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Search size={15} /> Search
              </button>

              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Interactive Navigation Tabs */}
          <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
            {[
              { id: "overview", label: "Executive Analytics & Charts", icon: BarChart3, count: null },
              { id: "purchases", label: "Purchases & Stock Outlay", icon: ShoppingCart, count: filteredPurchases.length },
              { id: "sales", label: "Sales & Installments", icon: TrendingUp, count: filteredSales.length },
              { id: "registrations", label: "Registrations & Papers", icon: FileText, count: filteredRegistrations.length },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-xl"
                      : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
                  }`}
                >
                  <Icon size={15} />
                  <span>{tab.label}</span>
                  {tab.count !== null && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${isActive ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-3">
              <Loader2 size={36} className="animate-spin text-teal-600" />
              <p className="text-xs font-medium">Aggregating real-time showroom payload &amp; generating charts...</p>
            </div>
          ) : (
            <>
              {/* Top KPI Cards (Common to all views) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Total Purchases Outlay */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Purchase Cost</span>
                    <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                      <ShoppingCart size={18} />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 tracking-tight">{fmt(totalPurchaseCost)}</div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span>Remaining Due: <strong className="text-rose-600">{fmt(totalPurchaseRemaining)}</strong></span>
                    <span>Units: <strong>{filteredPurchases.length}</strong></span>
                  </div>
                </div>

                {/* 2. Total Sales Value */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Sales Value</span>
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <TrendingUp size={18} />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 tracking-tight">{fmt(totalSalesRevenue)}</div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span>Collected: <strong className="text-emerald-700">{fmt(totalCollected)}</strong></span>
                    <span>Units: <strong>{filteredSales.length}</strong></span>
                  </div>
                </div>

                {/* 3. Installment Pending */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Installments Pending</span>
                    <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                      <CreditCard size={18} />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-rose-600 tracking-tight">{fmt(totalInstallmentPending)}</div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span>Active Cases: <strong>{installmentSales.length}</strong></span>
                    <span>Recv'd: <strong>{fmt(totalInstallmentsReceived)}</strong></span>
                  </div>
                </div>

                {/* 4. Registration Paper Status */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Registration Papers</span>
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                      <FileText size={18} />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-purple-700 tracking-tight">
                    {completedPapers} <span className="text-sm font-semibold text-slate-400">/ {filteredRegistrations.length}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span className="text-emerald-700 font-semibold">✅ {completedPapers} Received</span>
                    <span className="text-amber-600 font-semibold">⏳ {pendingPapers} Pending</span>
                  </div>
                </div>
              </div>

              {/* TAB 1: OVERVIEW & ANALYTICS CHARTS */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Row 1: Composed Revenue vs Cost Timeline Chart */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                          <TrendingUp size={16} className="text-emerald-600" />
                          Financial Revenue vs Outlay vs Net Profit Over Time
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Visual trend tracking sales income, purchase expenditures, and monthly profit margins
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-semibold">
                        <span className="flex items-center gap-1.5 text-emerald-600">
                          <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> Sales Revenue
                        </span>
                        <span className="flex items-center gap-1.5 text-blue-600">
                          <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" /> Purchase Cost
                        </span>
                        <span className="flex items-center gap-1.5 text-purple-600">
                          <span className="w-3 h-3 rounded-sm bg-purple-500 inline-block" /> Gross Margin
                        </span>
                      </div>
                    </div>

                    <div className="h-80 w-full">
                      {timelineData.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-xs text-slate-400">
                          No timeline transactions recorded in selected range
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={timelineData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#64748b" }} />
                            <YAxis
                              tick={{ fontSize: 10, fill: "#64748b" }}
                              tickFormatter={(val) => `Rs.${(val / 1000).toFixed(0)}k`}
                            />
                            <Tooltip
                              formatter={(value, name) => [fmt(value), name === "sales" ? "Sales Revenue" : name === "purchases" ? "Purchase Cost" : "Profit"]}
                              labelFormatter={(label) => `Month: ${label}`}
                              contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                            />
                            <Area type="monotone" dataKey="sales" fill="#ecfdf5" stroke="#10b981" strokeWidth={2} name="sales" />
                            <Bar dataKey="purchases" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} name="purchases" />
                            <Bar dataKey="profit" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={16} name="profit" />
                          </ComposedChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Distribution Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Sales Type Distribution (Donut) */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            <PieChartIcon size={16} className="text-indigo-600" />
                            Sales Volume: Cash vs. Installment
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">Capital collection ratio across transaction types</p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-around h-64">
                        <div className="w-48 h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={salesTypeData}
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={80}
                                paddingAngle={4}
                                dataKey="value"
                              >
                                {salesTypeData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(val) => [fmt(val), "Revenue"]}
                                contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "11px" }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="space-y-3 mt-4 sm:mt-0">
                          {salesTypeData.map((item) => (
                            <div key={item.name} className="flex items-center gap-3">
                              <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: item.color }} />
                              <div>
                                <p className="text-xs font-bold text-slate-800">{item.name}</p>
                                <p className="text-xs text-slate-500 font-medium">{fmt(item.value)} ({item.count} deals)</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Top Bike Brands Bar Chart */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            <Bike size={16} className="text-teal-600" />
                            Top Selling Bike Brands by Revenue
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">Most profitable manufacturers in current period</p>
                        </div>
                      </div>

                      <div className="h-64 w-full">
                        {brandData.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-xs text-slate-400">
                            No brand sales recorded
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={brandData} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                              <XAxis type="number" tickFormatter={(v) => `Rs.${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: "#64748b" }} />
                              <YAxis dataKey="brand" type="category" tick={{ fontSize: 11, fill: "#334155", fontWeight: 600 }} />
                              <Tooltip
                                formatter={(val, name, props) => [`${fmt(val)} (${props.payload.count} units)`, "Total Revenue"]}
                                contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "11px" }}
                              />
                              <Bar dataKey="revenue" fill="#0d9488" radius={[0, 6, 6, 0]} barSize={18} />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Sourcing Breakdown & Paper Progress */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Purchase Sourcing Category */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            <ShoppingCart size={16} className="text-blue-600" />
                            Inventory Sourcing Distribution
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">Procurement spend by supplier channel</p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-around h-56">
                        <div className="w-44 h-44">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={purchaseCategoryData}
                                cx="50%"
                                cy="50%"
                                outerRadius={70}
                                dataKey="value"
                              >
                                {purchaseCategoryData.map((entry, index) => (
                                  <Cell key={`cell-pur-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(val) => [fmt(val), "Cost"]}
                                contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "11px" }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="space-y-2 mt-4 sm:mt-0 text-xs">
                          {purchaseCategoryData.map((item) => (
                            <div key={item.name} className="flex items-center gap-2.5">
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                              <div>
                                <span className="font-bold text-slate-800 capitalize">{item.name} Purchases:</span>
                                <span className="ml-1 text-slate-500 font-semibold">{fmt(item.value)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Registration Paper Clearance Ratio */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            <FileText size={16} className="text-purple-600" />
                            Document &amp; Registration Clearance
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">Agent file status &amp; customer papers ready</p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-around h-56">
                        <div className="w-44 h-44">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={paperStatusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={45}
                                outerRadius={70}
                                paddingAngle={4}
                                dataKey="value"
                              >
                                {paperStatusData.map((entry, index) => (
                                  <Cell key={`cell-paper-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(val) => [`${val} Files`, "Status"]}
                                contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "11px" }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="space-y-3 mt-4 sm:mt-0 text-xs">
                          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                            <CheckCircle2 size={18} className="text-emerald-600" />
                            <div>
                              <div className="font-bold text-emerald-800">{completedPapers} Papers Received</div>
                              <div className="text-[10px] text-emerald-600">Customer files completed &amp; handed over</div>
                            </div>
                          </div>

                          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3">
                            <Clock size={18} className="text-rose-600" />
                            <div>
                              <div className="font-bold text-rose-800">{pendingPapers} Papers Pending</div>
                              <div className="text-[10px] text-rose-600">Pending with registration agents</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Printable Table Content (EXACT Purchase page table aesthetic!) */}
              <div ref={printRef} className="space-y-6">
                {/* TAB 2: PURCHASES & SOURCING DETAILED TABLE (Matching Purchase Page UI!) */}
                {(activeTab === "overview" || activeTab === "purchases") && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                          <ShoppingCart size={16} className="text-teal-600" /> Procurement &amp; Purchases Data
                          <span className="text-xs font-normal text-slate-400">({filteredPurchases.length} records)</span>
                        </h3>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-medium text-slate-500">Total Purchase Value: </span>
                        <span className="text-sm font-bold text-teal-700">{fmt(totalPurchaseCost)}</span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      {filteredPurchases.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                          <span className="text-3xl">📋</span>
                          <p className="text-xs font-medium">No purchase records found matching filters.</p>
                        </div>
                      ) : (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                              {["#", "Supplier / Seller", "Category", "Bike Model", "CC", "Color", "Reg. No", "Chasis No", "Engine No", "Actual Amount", "Remaining", "Extra Expense", "Date", "Status", "Actions"].map((h) => (
                                <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {filteredPurchases.slice(0, activeTab === "overview" ? 15 : 100).map((p, idx) => (
                              <tr key={p.id || idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150">
                                <td className="px-4 py-3 text-slate-400 font-medium">{idx + 1}</td>
                                <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{p.customerName || "—"}</td>
                                <td className="px-4 py-3">
                                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 capitalize">
                                    {(p.category || "local").replace("_", " ")}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                                  {[p.bikeCompany, p.bikeModel].filter(Boolean).join(" ") || "—"}
                                </td>
                                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{p.bikeCC || "—"}</td>
                                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{p.bikeColor || "—"}</td>
                                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{p.registrationNo || "AFR"}</td>
                                <td className="px-4 py-3 text-slate-600 whitespace-nowrap font-mono text-xs">{p.chasisNo || "—"}</td>
                                <td className="px-4 py-3 text-slate-600 whitespace-nowrap font-mono text-xs">{p.engineNo || "—"}</td>
                                <td className="px-4 py-3 text-emerald-700 font-semibold whitespace-nowrap">{fmt(p.actualAmount)}</td>
                                <td className="px-4 py-3 text-rose-600 font-semibold whitespace-nowrap">{Number(p.amountRemaining) > 0 ? fmt(p.amountRemaining) : "—"}</td>
                                <td className="px-4 py-3 text-amber-600 whitespace-nowrap">{Number(p.additionalExpense) > 0 ? fmt(p.additionalExpense) : "—"}</td>
                                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDateTime(p.purchaseDateTime || p.purchaseDate || p.createdAt)}</td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${
                                    p.approved ? "bg-emerald-500 text-white" : "bg-red-50 text-red-500 border border-red-200"
                                  }`} title={p.approved ? "Approved" : "Pending Approval"}>
                                    <Check size={14} />
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => router.push("/purchase-dashboard")}
                                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200 cursor-pointer"
                                      title="Open in Purchasing"
                                    >
                                      <Eye size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: SALES & INSTALLMENTS DETAILED TABLE (Matching Purchase Page UI!) */}
                {(activeTab === "overview" || activeTab === "sales") && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                          <TrendingUp size={16} className="text-emerald-600" /> Sales &amp; Invoices Data
                          <span className="text-xs font-normal text-slate-400">({filteredSales.length} records)</span>
                        </h3>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-medium text-slate-500">Total Sales Value: </span>
                        <span className="text-sm font-bold text-emerald-700">{fmt(totalSalesRevenue)}</span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      {filteredSales.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                          <span className="text-3xl">📋</span>
                          <p className="text-xs font-medium">No sales records found matching filters.</p>
                        </div>
                      ) : (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                              {["#", "Buyer Name", "Bike", "Reg. No", "Chasis No", "Sale Type", "Total Amount", "Advance", "Paid Installments", "Remaining Due", "Date", "Status", "Actions"].map((h) => (
                                <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {filteredSales.slice(0, activeTab === "overview" ? 15 : 100).map((s, idx) => {
                              const balance = Math.max(0, Number(s.totalSaleAmount || 0) - Number(s.advanceReceived || 0) - Number(s.paidInstallments || 0));
                              const isInst = (s.saleType || "").toLowerCase() === "installment";
                              return (
                                <tr key={s.id || idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150">
                                  <td className="px-4 py-3 text-slate-400 font-medium">{idx + 1}</td>
                                  <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{s.buyerName || "—"}</td>
                                  <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                                    {[s.bikeCompany, s.bikeModel].filter(Boolean).join(" ") || "—"}
                                  </td>
                                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{s.registrationNo || "AFR"}</td>
                                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap font-mono text-xs">{s.chasisNo || "—"}</td>
                                  <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                      isInst ? "bg-indigo-50 text-indigo-700" : "bg-emerald-50 text-emerald-700"
                                    }`}>
                                      {s.saleType || "Cash"}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-emerald-700 font-semibold whitespace-nowrap">{fmt(s.totalSaleAmount)}</td>
                                  <td className="px-4 py-3 text-slate-600 font-semibold whitespace-nowrap">{fmt(s.advanceReceived)}</td>
                                  <td className="px-4 py-3 text-indigo-700 font-semibold whitespace-nowrap">{fmt(s.paidInstallments)}</td>
                                  <td className="px-4 py-3 text-rose-600 font-semibold whitespace-nowrap">{balance > 0 ? fmt(balance) : "—"}</td>
                                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDateTime(s.saleDateTime || s.saleDate || s.createdAt)}</td>
                                  <td className="px-4 py-3">
                                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500 text-white" title="Confirmed Sale">
                                      <Check size={14} />
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <button
                                      onClick={() => router.push("/pages/sales")}
                                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200 cursor-pointer"
                                      title="Open in Sales"
                                    >
                                      <Eye size={14} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 4: REGISTRATIONS & PAPERS DETAILED TABLE (Matching Purchase Page UI!) */}
                {(activeTab === "overview" || activeTab === "registrations") && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                          <FileText size={16} className="text-purple-600" /> Registrations &amp; Documentation Data
                          <span className="text-xs font-normal text-slate-400">({filteredRegistrations.length} records)</span>
                        </h3>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-medium text-slate-500">Showroom Margin: </span>
                        <span className="text-sm font-bold text-purple-700">{fmt(regShowroomProfit)}</span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      {filteredRegistrations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                          <span className="text-3xl">📋</span>
                          <p className="text-xs font-medium">No registration records found.</p>
                        </div>
                      ) : (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                              {["#", "Customer / Bike", "Chasis No", "Reg. No", "Agent", "Cost (Agent Fee)", "Charged (Customer)", "Profit", "Date", "Paper Status", "Actions"].map((h) => (
                                <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {filteredRegistrations.map((r, idx) => {
                              const profit = Math.max(0, Number(r.customerTotalMoney || 0) - Number(r.agentTotalMoney || 0));
                              return (
                                <tr key={r.id || idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150">
                                  <td className="px-4 py-3 text-slate-400 font-medium">{idx + 1}</td>
                                  <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                                    {[r.bikeCompany, r.bikeModel].filter(Boolean).join(" ") || "—"}
                                  </td>
                                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap font-mono text-xs">{r.chasisNo || "—"}</td>
                                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap font-mono text-xs">{r.registrationNo || "AFR"}</td>
                                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{r.agentLetter || "—"}</td>
                                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{fmt(r.agentTotalMoney)}</td>
                                  <td className="px-4 py-3 text-slate-900 font-semibold whitespace-nowrap">{fmt(r.customerTotalMoney)}</td>
                                  <td className="px-4 py-3 text-emerald-700 font-semibold whitespace-nowrap">{fmt(profit)}</td>
                                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDateTime(r.createdAt || r.registrationDateTime)}</td>
                                  <td className="px-4 py-3">
                                    {r.paperReceived ? (
                                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500 text-white" title="Paper Received">
                                        <Check size={14} />
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-50 text-red-500 border border-red-200" title="Paper Pending">
                                        <Clock size={14} />
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    <button
                                      onClick={() => router.push("/registration-dashboard")}
                                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200 cursor-pointer"
                                      title="Open in Registration"
                                    >
                                      <Eye size={14} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </DashboardLayout>
  );
}
