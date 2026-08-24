"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  RefreshCw,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Calendar,
  Search,
  CheckCircle2,
  FileDown,
  Trash2,
  Pencil,
  X,
  Loader2,
  Receipt,
  Tag,
  Clock,
  Filter,
  AlertCircle
} from "lucide-react";
import { downloadExpensePDF } from "@/app/lib/pdfUtils";

const URL = process.env.NEXT_PUBLIC_BASE_URL;

const EXPENSE_CATEGORIES = [
  "Salary / Wages",
  "Tea & Refreshment",
  "Bike Parts & Repair",
  "Rent & Utilities",
  "Workshop Maintenance",
  "Office & Misc",
  "General"
];

const money = (n) => (n != null ? `Rs. ${Number(n).toLocaleString()}` : "—");

const formatDate = (val) => {
  if (!val) return "—";
  const d = new Date(val);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
};

const emptyExpenseForm = {
  title: "",
  amount: "",
  category: "General",
  expenseDate: new Date().toISOString().slice(0, 10),
  description: ""
};

export default function ExpenseDashboard() {
  const router = useRouter();

  // Date Range state
  const [range, setRange] = useState("thisMonth"); // "thisMonth" | "pastMonth" | "6months" | "1year" | "perMonth" | "custom" | "all"
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [monthStr, setMonthStr] = useState("");
  const [search, setSearch] = useState("");

  // Tab state: "ledger" | "expenses" | "purchases" | "sales"
  const [activeTab, setActiveTab] = useState("ledger");

  // Loading & data state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [overviewData, setOverviewData] = useState({
    summary: {
      totalGeneralExpenses: 0,
      totalBikePurchasesCost: 0,
      totalBikeSalesRevenue: 0,
      totalGrossProfit: 0,
      netProfit: 0,
      netCashFlow: 0,
      expensesCount: 0,
      purchasesCount: 0,
      salesCount: 0
    },
    categoryBreakdown: [],
    expenses: [],
    purchases: [],
    sales: [],
    ledger: []
  });

  // Expense Modal State
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [expenseForm, setExpenseForm] = useState(emptyExpenseForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchOverviewData = useCallback(async () => {
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

      const res = await fetch(`${URL}/expense/overview?${params.toString()}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to fetch expense & ledger overview");
      }

      setOverviewData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [range, startDate, endDate, monthStr]);

  useEffect(() => {
    fetchOverviewData();
  }, [fetchOverviewData]);

  // Handle Create / Edit Expense
  const openAddExpense = () => {
    setEditId(null);
    setExpenseForm({
      ...emptyExpenseForm,
      expenseDate: new Date().toISOString().slice(0, 10)
    });
    setFormError("");
    setShowModal(true);
  };

  const openEditExpense = (item) => {
    setEditId(item.id);
    setExpenseForm({
      title: item.title || "",
      amount: item.amount || "",
      category: item.category || "General",
      expenseDate: item.expenseDate ? new Date(item.expenseDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      description: item.description || ""
    });
    setFormError("");
    setShowModal(true);
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      const url = editId ? `${URL}/expense/${editId}` : `${URL}/expense`;
      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expenseForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save expense");

      setSuccessMsg(editId ? "Expense updated successfully!" : "Expense recorded successfully!");
      setShowModal(false);
      fetchOverviewData();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!confirm("Are you sure you want to delete this expense record?")) return;
    try {
      const res = await fetch(`${URL}/expense/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete expense");
      fetchOverviewData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Search filtering
  const q = search.trim().toLowerCase();

  const filteredLedger = (overviewData.ledger || []).filter((item) => {
    if (!q) return true;
    return (
      (item.title && item.title.toLowerCase().includes(q)) ||
      (item.category && item.category.toLowerCase().includes(q)) ||
      (item.description && item.description.toLowerCase().includes(q)) ||
      (item.registrationNo && item.registrationNo.toLowerCase().includes(q)) ||
      (item.customerName && item.customerName.toLowerCase().includes(q)) ||
      (item.buyerName && item.buyerName.toLowerCase().includes(q))
    );
  });

  const filteredExpenses = (overviewData.expenses || []).filter((item) => {
    if (!q) return true;
    return (
      (item.title && item.title.toLowerCase().includes(q)) ||
      (item.category && item.category.toLowerCase().includes(q)) ||
      (item.description && item.description.toLowerCase().includes(q))
    );
  });

  const filteredPurchases = (overviewData.purchases || []).filter((item) => {
    if (!q) return true;
    return (
      (item.bikeCompany && item.bikeCompany.toLowerCase().includes(q)) ||
      (item.bikeModel && item.bikeModel.toLowerCase().includes(q)) ||
      (item.registrationNo && item.registrationNo.toLowerCase().includes(q)) ||
      (item.customerName && item.customerName.toLowerCase().includes(q))
    );
  });

  const filteredSales = (overviewData.sales || []).filter((item) => {
    if (!q) return true;
    return (
      (item.title && item.title.toLowerCase().includes(q)) ||
      (item.buyerName && item.buyerName.toLowerCase().includes(q)) ||
      (item.registrationNo && item.registrationNo.toLowerCase().includes(q))
    );
  });

  const rangeLabelMap = {
    thisMonth: "This Month",
    pastMonth: "Past Month",
    "6months": "Past 6 Months",
    "1year": "Past 1 Year",
    perMonth: `Month: ${monthStr || "Selected"}`,
    custom: `Custom (${startDate || "Start"} to ${endDate || "End"})`,
    all: "All Time"
  };

  const currentRangeLabel = rangeLabelMap[range] || "This Month";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16">
      {/* Header */}
      <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
              title="Back to Dashboard"
            >
              <ArrowLeft size={22} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🧾</span>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Daily Expense & Ledger</h1>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Track daily operational costs, auto-synced bike transactions & showroom net profit
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => downloadExpensePDF(overviewData, currentRangeLabel)}
              className="flex items-center gap-2 bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/10"
              title="Download Comprehensive Financial Report PDF"
            >
              <FileDown size={15} /> Download PDF Report
            </button>
            <button
              onClick={openAddExpense}
              className="flex items-center gap-2 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-slate-800 transition-all shadow-md"
            >
              <Plus size={15} /> Add Expense
            </button>
            <button
              onClick={fetchOverviewData}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
              title="Refresh Data"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Success Alert */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-semibold shadow-sm animate-fade-in">
            <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Date Range Selector */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Calendar size={14} /> Period & Date Filter
              </h3>
              <p className="text-sm font-semibold text-slate-800">
                Viewing ledger for: <span className="text-teal-700 font-bold">{currentRangeLabel}</span>
              </p>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: "thisMonth", label: "This Month" },
                { id: "pastMonth", label: "Past Month" },
                { id: "6months", label: "Past 6 Months" },
                { id: "1year", label: "Past 1 Year" },
                { id: "perMonth", label: "Specific Month" },
                { id: "custom", label: "Custom Range" },
                { id: "all", label: "All Time" },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setRange(btn.id)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    range === btn.id
                      ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
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
                className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          )}

          {range === "custom" && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-600">Start Date:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-600">End Date:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>
          )}
        </div>

        {/* Financial KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Net Profit Card */}
          <div className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between ${
            overviewData.summary.netProfit >= 0
              ? "bg-emerald-50/70 border-emerald-200"
              : "bg-rose-50/70 border-rose-200"
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Net Profit</span>
              <div className={`p-2 rounded-xl ${
                overviewData.summary.netProfit >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
              }`}>
                <TrendingUp size={18} />
              </div>
            </div>
            <div className="mt-3">
              <p className={`text-2xl font-black ${
                overviewData.summary.netProfit >= 0 ? "text-emerald-700" : "text-rose-700"
              }`}>
                {money(overviewData.summary.netProfit)}
              </p>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">Bike Profit − Daily Expenses</p>
            </div>
          </div>

          {/* Gross Bike Profit Card */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Gross Bike Profit</span>
              <div className="p-2 rounded-xl bg-teal-50 text-teal-600"><DollarSign size={18} /></div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-black text-teal-700">{money(overviewData.summary.totalGrossProfit)}</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">{overviewData.summary.salesCount} bikes sold in period</p>
            </div>
          </div>

          {/* General Daily Expenses Card */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">General Expenses</span>
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600"><Receipt size={18} /></div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-black text-rose-600">{money(overviewData.summary.totalGeneralExpenses)}</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">{overviewData.summary.expensesCount} operational entries</p>
            </div>
          </div>

          {/* Bike Purchases Outflow */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Bike Purchases</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600"><ShoppingCart size={18} /></div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-black text-amber-700">{money(overviewData.summary.totalBikePurchasesCost)}</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">{overviewData.summary.purchasesCount} bikes bought in period</p>
            </div>
          </div>

          {/* Total Bike Sales Revenue */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Bike Sales Revenue</span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600"><DollarSign size={18} /></div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-black text-slate-900">{money(overviewData.summary.totalBikeSalesRevenue)}</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">Total revenue collected</p>
            </div>
          </div>
        </div>

        {/* Expense Category Breakdown Pills */}
        {overviewData.categoryBreakdown && overviewData.categoryBreakdown.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Tag size={14} /> General Expense Breakdown by Category
            </h3>
            <div className="flex flex-wrap items-center gap-2.5">
              {overviewData.categoryBreakdown.map((cat) => (
                <div key={cat.category} className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">{cat.category}:</span>
                  <span className="text-xs font-black text-rose-600">{money(cat.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ledger & Activity Section with Navigation Tabs */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            {/* Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: "ledger", label: `All Activity Ledger (${filteredLedger.length})` },
                { id: "expenses", label: `General Expenses (${filteredExpenses.length})` },
                { id: "purchases", label: `Bike Purchases (${filteredPurchases.length})` },
                { id: "sales", label: `Bike Sales & Profit (${filteredSales.length})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-slate-900 text-white shadow-md"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50 hover:bg-white"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20 text-slate-400">
              <Loader2 size={32} className="animate-spin" />
            </div>
          ) : (
            <>
              {/* TAB 1: ALL ACTIVITY LEDGER */}
              {activeTab === "ledger" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        {["#", "Date", "Type / Category", "Description / Details", "Inflow (Rs.)", "Outflow / Cost", "Net Impact"].map((h) => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLedger.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-12 text-slate-400 text-xs font-medium">
                            No activities or transactions recorded for this period.
                          </td>
                        </tr>
                      ) : (
                        filteredLedger.map((item, i) => (
                          <tr key={`${item.type}-${item.id}-${i}`} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 text-slate-400 font-medium">{i + 1}</td>
                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap font-medium">{formatDate(item.date)}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                                item.type === "manual_expense"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : item.type === "bike_purchase"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              }`}>
                                {item.type === "manual_expense"
                                  ? `Expense: ${item.category}`
                                  : item.type === "bike_purchase"
                                  ? "Bike Purchase"
                                  : "Bike Sale"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-800 font-semibold">
                              <div>{item.title}</div>
                              {item.description && <div className="text-xs text-slate-400 font-normal mt-0.5">{item.description}</div>}
                              {item.buyerName && <div className="text-xs text-slate-500 font-normal mt-0.5">Buyer: {item.buyerName}</div>}
                              {item.customerName && <div className="text-xs text-slate-500 font-normal mt-0.5">Seller: {item.customerName}</div>}
                            </td>
                            <td className="px-4 py-3 text-emerald-700 font-bold whitespace-nowrap">
                              {item.inflow > 0 ? money(item.inflow) : "—"}
                            </td>
                            <td className="px-4 py-3 text-rose-600 font-bold whitespace-nowrap">
                              {item.outflow > 0 ? money(item.outflow) : "—"}
                            </td>
                            <td className="px-4 py-3 font-black whitespace-nowrap">
                              {item.type === "bike_sale" ? (
                                <span className={item.profit >= 0 ? "text-emerald-700" : "text-rose-600"}>
                                  +{money(item.profit)} (Profit)
                                </span>
                              ) : (
                                <span className="text-rose-600">
                                  -{money(item.outflow || item.amount)}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 2: GENERAL EXPENSES */}
              {activeTab === "expenses" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500 font-medium">Showing custom operational expenses (wages, tea, parts, utilities)</p>
                    <button
                      onClick={openAddExpense}
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-all"
                    >
                      <Plus size={14} /> Add New Expense
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          {["#", "Date", "Title", "Category", "Amount (Rs.)", "Description", "Actions"].map((h) => (
                            <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredExpenses.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-12 text-slate-400 text-xs font-medium">
                              No manual expenses found in this period.
                            </td>
                          </tr>
                        ) : (
                          filteredExpenses.map((item, i) => (
                            <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3 text-slate-400 font-medium">{i + 1}</td>
                              <td className="px-4 py-3 text-slate-600 whitespace-nowrap font-medium">{formatDate(item.expenseDate || item.createdAt)}</td>
                              <td className="px-4 py-3 font-bold text-slate-800">{item.title}</td>
                              <td className="px-4 py-3">
                                <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
                                  {item.category || "General"}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-black text-rose-600 whitespace-nowrap">{money(item.amount)}</td>
                              <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{item.description || "—"}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => openEditExpense(item)}
                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                    title="Edit Expense"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteExpense(item.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                    title="Delete Expense"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: BIKE PURCHASES (AUTO-SYNCED) */}
              {activeTab === "purchases" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        {["#", "Purchase Date", "Bike Model", "Registration No", "Chasis No", "Engine No", "Seller Name", "Purchase Cost"].map((h) => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPurchases.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-12 text-slate-400 text-xs font-medium">
                            No bike purchases recorded in this period.
                          </td>
                        </tr>
                      ) : (
                        filteredPurchases.map((item, i) => (
                          <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 text-slate-400 font-medium">{i + 1}</td>
                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(item.purchaseDateTime || item.createdAt)}</td>
                            <td className="px-4 py-3 font-bold text-slate-800">{[item.bikeCompany, item.bikeModel].filter(Boolean).join(" ") || "—"}</td>
                            <td className="px-4 py-3 text-slate-600 font-mono">{item.registrationNo || "—"}</td>
                            <td className="px-4 py-3 text-slate-600 font-mono">{item.chasisNo || "—"}</td>
                            <td className="px-4 py-3 text-slate-600 font-mono">{item.engineNo || "—"}</td>
                            <td className="px-4 py-3 text-slate-600">{item.customerName || "—"}</td>
                            <td className="px-4 py-3 font-black text-amber-700 whitespace-nowrap">
                              {money(parseFloat(item.actualAmount || 0) + parseFloat(item.additionalExpense || 0))}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 4: BIKE SALES & PROFIT (AUTO-SYNCED) */}
              {activeTab === "sales" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        {["#", "Sale Date", "Bike Description", "Registration No", "Buyer Name", "Sale Price", "Purchase Cost", "Gross Profit"].map((h) => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSales.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-12 text-slate-400 text-xs font-medium">
                            No bike sales recorded in this period.
                          </td>
                        </tr>
                      ) : (
                        filteredSales.map((item, i) => (
                          <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 text-slate-400 font-medium">{i + 1}</td>
                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(item.date)}</td>
                            <td className="px-4 py-3 font-bold text-slate-800">{item.title}</td>
                            <td className="px-4 py-3 text-slate-600 font-mono">{item.registrationNo || "—"}</td>
                            <td className="px-4 py-3 text-slate-600">{item.buyerName || "—"}</td>
                            <td className="px-4 py-3 font-black text-emerald-700 whitespace-nowrap">{money(item.salePrice)}</td>
                            <td className="px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">{money(item.cost)}</td>
                            <td className="px-4 py-3 font-black text-teal-700 whitespace-nowrap">+{money(item.profit)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Add / Edit Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                  <Receipt size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{editId ? "Edit Expense" : "Record Daily Expense"}</h2>
                  <p className="text-xs text-slate-400">Enter daily operational cost (wages, tea, parts, utilities)</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleExpenseSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Expense Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Employee Daily Wage, Chai Expense, Bike Spare Parts"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50 hover:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Amount (Rs.) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 500"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50 hover:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50 hover:bg-white"
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Expense Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={expenseForm.expenseDate}
                  onChange={(e) => setExpenseForm({ ...expenseForm, expenseDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50 hover:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Description / Note <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional details about this expense..."
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50 hover:bg-white resize-none"
                />
              </div>

              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-slate-800 transition-all disabled:opacity-60"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  {submitting ? "Saving..." : editId ? "Update Expense" : "Save Expense"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 text-sm font-semibold py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
