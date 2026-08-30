"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  Banknote,
  Package,
  ShoppingCart,
  Calendar,
  Search,
  CheckCircle,
  FileText,
  AlertCircle,
  FileDown
} from "lucide-react";
import MobileBottomNav from "@/app/components/MobileBottomNav";
import ExportPDFModal from "@/app/components/ExportPDFModal";
import { downloadEarningPDF } from "@/app/lib/pdfUtils";

const URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5000";

const money = (n) => (n != null ? `Rs. ${Number(n).toLocaleString()}` : "—");

const formatDate = (val) => {
  if (!val) return "—";
  const d = new Date(val);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
};

export default function EarningDashboard() {
  const router = useRouter();

  const [range, setRange] = useState("6months"); // "10days" | "thisMonth" | "6months" | "perMonth" | "custom" | "all"
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [monthStr, setMonthStr] = useState("");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showExportModal, setShowExportModal] = useState(false);

  const [data, setData] = useState({
    summary: {
      totalProfit: 0,
      totalBikeSalesProfit: 0,
      totalRegProfit: 0,
      totalSalesCount: 0,
      totalSalesRevenue: 0,
      totalPurchasesCount: 0,
      totalPurchasesCost: 0,
      currentStockCount: 0,
      currentStockValue: 0
    },
    chartData: [],
    profitList: []
  });

  const fetchEarningData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("range", range);
      if (range === "custom") {
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);
      } else if (range === "perMonth" && monthStr) {
        params.set("month", monthStr);
      }

      const res = await fetch(`${URL}/earning?${params.toString()}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to fetch earning data");
      }

      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [range, startDate, endDate, monthStr]);

  const handleExportEarningPDF = async ({ rangeType, startDate, endDate }) => {
    const params = new URLSearchParams();
    let rangeLabel = "All Time";
    if (rangeType === "all") {
      params.set("range", "all");
      rangeLabel = "All Time (Full)";
    } else if (rangeType === "today") {
      params.set("range", "custom");
      const today = new Date().toISOString().slice(0, 10);
      params.set("startDate", today);
      params.set("endDate", today);
      rangeLabel = `Today (${today})`;
    } else if (rangeType === "thisMonth") {
      params.set("range", "thisMonth");
      rangeLabel = "This Month";
    } else if (rangeType === "pastMonth") {
      const d = new Date();
      const firstDay = new Date(d.getFullYear(), d.getMonth() - 1, 1).toISOString().slice(0, 10);
      const lastDay = new Date(d.getFullYear(), d.getMonth(), 0).toISOString().slice(0, 10);
      params.set("range", "custom");
      params.set("startDate", firstDay);
      params.set("endDate", lastDay);
      rangeLabel = "Past Month";
    } else if (rangeType === "custom" && startDate && endDate) {
      params.set("range", "custom");
      params.set("startDate", startDate);
      params.set("endDate", endDate);
      rangeLabel = `${startDate} to ${endDate}`;
    }

    const res = await fetch(`${URL}/earning?${params.toString()}`);
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || "Failed to fetch earning data for PDF export");
    downloadEarningPDF(json, rangeLabel);
  };

  useEffect(() => {
    fetchEarningData();
  }, [fetchEarningData]);

  const [typeFilter, setTypeFilter] = useState("all"); // "all" | "sale" | "registration"

  const filteredProfitList = (data.profitList || []).filter((item) => {
    if (typeFilter !== "all" && item.recordType !== typeFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (item.buyerName && item.buyerName.toLowerCase().includes(q)) ||
      (item.bikeCompany && item.bikeCompany.toLowerCase().includes(q)) ||
      (item.bikeModel && item.bikeModel.toLowerCase().includes(q)) ||
      (item.registrationNo && item.registrationNo.toLowerCase().includes(q)) ||
      (item.chasisNo && item.chasisNo.toLowerCase().includes(q))
    );
  });

  // Helper for max value in charts
  const maxChartProfit = Math.max(1, ...(data.chartData || []).map((d) => d.profit || 0));
  const maxChartSales = Math.max(1, ...(data.chartData || []).map((d) => d.salesCount || 0));
  const maxChartPurchases = Math.max(1, ...(data.chartData || []).map((d) => d.purchasesCount || 0));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16">
      {/* Top Header Banner */}
      <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              title="Back to Dashboard"
            >
              <ArrowLeft size={22} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">📈</span>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Earning & Profit Analytics</h1>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Track Net Profit, Registration Margin, Bike Sales vs Purchases & Stock Value
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md cursor-pointer"
              title="Download Earning & Profit PDF Report"
            >
              <FileDown size={15} />
              Download PDF
            </button>
            <button
              onClick={fetchEarningData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh Data
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Date & Range Filter</h3>
              <p className="text-sm font-semibold text-slate-800">Select period to calculate profit and view reports</p>
            </div>

            {/* Quick Presets Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: "10days", label: "Past 10 Days" },
                { id: "thisMonth", label: "This Month" },
                { id: "6months", label: "Past 6 Months" },
                { id: "perMonth", label: "Specific Month" },
                { id: "custom", label: "Custom Range" },
                { id: "all", label: "All Time" },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setRange(btn.id)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    range === btn.id
                      ? "bg-teal-600 text-white shadow-md shadow-teal-600/20"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conditional Input Controls */}
          {range === "perMonth" && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
              <label className="text-xs font-bold text-slate-600">Select Month:</label>
              <input
                type="month"
                value={monthStr}
                onChange={(e) => setMonthStr(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
          )}

          {range === "custom" && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">To:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-center gap-3 text-sm">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {/* Net Profit Card */}
          <div className="bg-gradient-to-br from-teal-600 to-emerald-700 text-white rounded-2xl p-6 shadow-xl shadow-teal-600/10 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-100">Total Net Profit</span>
              <div className="p-2 bg-white/10 rounded-xl">
                <TrendingUp size={22} className="text-white" />
              </div>
            </div>
            <div className="text-3xl font-black tracking-tight mb-1">
              {money(data.summary.totalProfit)}
            </div>
            <div className="text-[11px] text-teal-100 font-medium space-y-0.5 mt-2 pt-2 border-t border-teal-500/40">
              <div>Bike Sales: <strong className="text-white">{money(data.summary.totalBikeSalesProfit || 0)}</strong></div>
              <div>Registration Profit: <strong className="text-white">{money(data.summary.totalRegProfit || 0)}</strong></div>
            </div>
          </div>

          {/* Bikes Sold Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Bikes Sold</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Banknote size={22} />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 tracking-tight mb-1">
              {data.summary.totalSalesCount || 0} <span className="text-sm font-semibold text-slate-400">bikes</span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Total Sales Revenue: <strong className="text-slate-800">{money(data.summary.totalSalesRevenue)}</strong>
            </p>
          </div>

          {/* Bikes Purchased Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Bikes Purchased</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <ShoppingCart size={22} />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 tracking-tight mb-1">
              {data.summary.totalPurchasesCount || 0} <span className="text-sm font-semibold text-slate-400">bikes</span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Total Purchase Cost: <strong className="text-slate-800">{money(data.summary.totalPurchasesCost)}</strong>
            </p>
          </div>

          {/* Current Stock Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Bike Stock</span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <Package size={22} />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 tracking-tight mb-1">
              {data.summary.currentStockCount || 0} <span className="text-sm font-semibold text-slate-400">unsold</span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Stock Valuation: <strong className="text-slate-800">{money(data.summary.currentStockValue)}</strong>
            </p>
          </div>
        </div>

        {/* Charts & Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Chart 1: Profit Trend Bar Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Profit Breakdown Over Time</h3>
                <p className="text-xs text-slate-500 font-medium">Monthly / Daily Net Earnings Visualizer</p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-teal-50 text-teal-700 rounded-full">
                Trend Analysis
              </span>
            </div>

            {loading ? (
              <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
                Loading Profit Analytics...
              </div>
            ) : !data.chartData || data.chartData.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm">
                <span>No profit data recorded for this range</span>
              </div>
            ) : (
              <div className="h-64 flex items-end gap-3 pt-6 pb-2 border-b border-slate-100 overflow-x-auto">
                {data.chartData.map((item, idx) => {
                  const profitHeight = Math.max(12, Math.round(((item.profit || 0) / maxChartProfit) * 180));
                  return (
                    <div key={idx} className="flex-1 min-w-[48px] flex flex-col items-center gap-2 group">
                      <div className="text-[10px] font-bold text-teal-700 opacity-0 group-hover:opacity-100 transition-opacity">
                        {money(item.profit)}
                      </div>
                      <div
                        className="w-full bg-gradient-to-t from-teal-600 to-emerald-400 rounded-t-lg transition-all group-hover:brightness-110 shadow-sm"
                        style={{ height: `${profitHeight}px` }}
                      />
                      <span className="text-[10px] font-semibold text-slate-500 truncate w-full text-center">
                        {item.period}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Chart 2: Bikes Sold vs Bought Comparison */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900">Bikes Sold vs Bought</h3>
                <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">
                  Volume
                </span>
              </div>

              {loading ? (
                <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
                  Loading...
                </div>
              ) : (
                <div className="space-y-6 my-4">
                  {/* Sales Bar */}
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-emerald-700">Total Bikes Sold</span>
                      <span className="text-slate-900">{data.summary.totalSalesCount} bikes</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (data.summary.totalSalesCount / (data.summary.totalSalesCount + data.summary.totalPurchasesCount || 1)) * 100)}%`
                        }}
                      />
                    </div>
                  </div>

                  {/* Purchases Bar */}
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-blue-700">Total Bikes Purchased</span>
                      <span className="text-slate-900">{data.summary.totalPurchasesCount} bikes</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (data.summary.totalPurchasesCount / (data.summary.totalSalesCount + data.summary.totalPurchasesCount || 1)) * 100)}%`
                        }}
                      />
                    </div>
                  </div>

                  {/* Stock Bar */}
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-amber-700">Available Stock</span>
                      <span className="text-slate-900">{data.summary.currentStockCount} bikes</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (data.summary.currentStockCount / (data.summary.totalPurchasesCount || 1)) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Profit Per Bike & Registration Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Profit & Margin Ledger</h3>
              <p className="text-xs text-slate-500 font-medium">Individual breakdown of bike sales &amp; registration profits</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Type Filter Buttons */}
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setTypeFilter("all")}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${typeFilter === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
                >
                  All ({data.profitList?.length || 0})
                </button>
                <button
                  onClick={() => setTypeFilter("sale")}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${typeFilter === "sale" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
                >
                  Bike Sales ({data.profitList?.filter(i => i.recordType === "sale").length || 0})
                </button>
                <button
                  onClick={() => setTypeFilter("registration")}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${typeFilter === "registration" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
                >
                  Registrations ({data.profitList?.filter(i => i.recordType === "registration").length || 0})
                </button>
              </div>

              {/* Search Input */}
              <div className="relative w-full sm:w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search buyer, model, reg #..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Bike Details</th>
                  <th className="py-3.5 px-4">Buyer / Reference</th>
                  <th className="py-3.5 px-4">Reg / Chasis No</th>
                  <th className="py-3.5 px-4 text-right">Cost (Purchase/Agent)</th>
                  <th className="py-3.5 px-4 text-right">Revenue (Sale/Customer)</th>
                  <th className="py-3.5 px-4 text-right">Net Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 text-sm">
                      Loading profit records...
                    </td>
                  </tr>
                ) : filteredProfitList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 text-sm">
                      No matching records found in this range.
                    </td>
                  </tr>
                ) : (
                  filteredProfitList.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-600">
                        {formatDate(item.saleDate)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md text-[10px] uppercase ${item.recordType === "registration" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}`}>
                          {item.recordType === "registration" ? "📜 Reg Paper" : "🏍️ Bike Sale"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {item.bikeCompany} {item.bikeModel}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {item.buyerName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {item.registrationNo !== "—" ? item.registrationNo : item.chasisNo}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-blue-700">
                        {item.hasMatchedPurchase ? (
                          money(item.purchaseCost)
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Direct / Unlinked</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-900">
                        {money(item.salePrice)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`inline-flex items-center gap-1 font-bold px-2.5 py-1 rounded-full text-xs ${
                            item.profit >= 0
                              ? item.recordType === "registration" ? "bg-purple-100 text-purple-900" : "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {item.profit >= 0 ? "+" : ""}{money(item.profit)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Export Earning & Profit PDF Modal */}
      <ExportPDFModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExportEarningPDF}
        title="Export Earning & Profit Report"
        description="Choose a date range or export all profit, margin, and revenue transactions."
        defaultRange="all"
      />

      <MobileBottomNav />
    </div>
  );
}
