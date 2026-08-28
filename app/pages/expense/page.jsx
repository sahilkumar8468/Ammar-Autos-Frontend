"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Calendar as CalendarIcon,
  Search,
  CheckCircle2,
  FileDown,
  Trash2,
  Pencil,
  Eye,
  X,
  Loader2,
  Receipt,
  Tag,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Building2,
  UserCheck,
  Banknote
} from "lucide-react";
import { downloadExpensePDF } from "@/app/lib/pdfUtils";
import MobileBottomNav from "@/app/components/MobileBottomNav";

const URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5000";

const EXPENSE_CATEGORIES = [
  "Salary / Wages",
  "Tea & Refreshment",
  "Bike Parts & Repair",
  "Rent & Utilities",
  "Workshop Maintenance",
  "Office & Misc",
  "General"
];

const getCategoryColor = (cat) => {
  switch (cat) {
    case "Salary / Wages":
      return "bg-purple-100 text-purple-700 border-purple-200";
    case "Tea & Refreshment":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "Bike Parts & Repair":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "Rent & Utilities":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "Workshop Maintenance":
      return "bg-teal-100 text-teal-700 border-teal-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

const money = (n) => (n != null ? `Rs. ${Number(n).toLocaleString()}` : "—");

const formatDate = (val) => {
  if (!val) return "—";
  const d = new Date(val);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
};

const formatTime = (val) => {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d)) return "";
  return d.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" });
};

const safeISOString = (val) => {
  if (!val) return new Date().toISOString().slice(0, 10);
  const d = new Date(val);
  if (isNaN(d)) return new Date().toISOString().slice(0, 10);
  try {
    return d.toISOString().slice(0, 10);
  } catch (_) {
    return new Date().toISOString().slice(0, 10);
  }
};

const emptyExpenseForm = {
  title: "",
  amount: "",
  transactionType: "expense", // "expense" | "income"
  category: "General",
  expenseDate: new Date().toISOString().slice(0, 10),
  description: ""
};

export default function ExpenseDashboard() {
  const router = useRouter();

  // Date Range state — DEFAULT TO "today"
  const [range, setRange] = useState("today");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [monthStr, setMonthStr] = useState("");
  const [search, setSearch] = useState("");

  // Tab state: "ledger" | "expenses" | "purchases" | "sales"
  const [activeTab, setActiveTab] = useState("ledger");

  // Data state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [overviewData, setOverviewData] = useState({
    summary: {
      totalGeneralExpenses: 0,
      totalBikePurchasesCost: 0,
      totalBikeSalesRevenue: 0,
      totalBikeGrossProfit: 0,
      totalOtherIncome: 0,
      totalInflow: 0,
      totalOutflow: 0,
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

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [expenseForm, setExpenseForm] = useState(emptyExpenseForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Inline Quick Add State
  const [quickTitle, setQuickTitle] = useState("");
  const [quickAmount, setQuickAmount] = useState("");
  const [quickCategory, setQuickCategory] = useState("General");
  const [quickType, setQuickType] = useState("expense");
  const [quickSubmitting, setQuickSubmitting] = useState(false);

  const fetchOverviewData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("range", range);

      if (range === "specificDate") {
        params.set("date", selectedDate);
      } else if (range === "custom") {
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);
      } else if (range === "perMonth" && monthStr) {
        params.set("month", monthStr);
      }

      const res = await fetch(`${URL}/expense/overview?${params.toString()}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to fetch daily expense overview");
      }

      setOverviewData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [range, selectedDate, startDate, endDate, monthStr]);

  useEffect(() => {
    fetchOverviewData();
  }, [fetchOverviewData]);

  // Scroll lock when modal is open
  useEffect(() => {
    if (showModal) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0", 10) * -1);
      }
    }
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [showModal]);

  // Navigate date by +/- 1 day
  const changeDay = (offset) => {
    let baseDate = new Date();
    if (range === "specificDate" && selectedDate) {
      baseDate = new Date(selectedDate);
    } else if (range === "yesterday") {
      baseDate.setDate(baseDate.getDate() - 1);
    }
    baseDate.setDate(baseDate.getDate() + offset);
    const newDateStr = baseDate.toISOString().slice(0, 10);
    setSelectedDate(newDateStr);
    setRange("specificDate");
  };

  // Handle Quick Add Expense or Income
  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!quickTitle.trim() || !quickAmount) return;
    setQuickSubmitting(true);
    try {
      const res = await fetch(`${URL}/expense`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: quickTitle.trim(),
          amount: parseFloat(quickAmount),
          transactionType: quickType,
          category: quickCategory,
          expenseDate: range === "specificDate" ? selectedDate : new Date().toISOString().slice(0, 10),
          description: "Quick entry"
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to record transaction");

      setQuickTitle("");
      setQuickAmount("");
      setSuccessMsg(`Recorded "${quickTitle.trim()}" (${money(quickAmount)}) successfully!`);
      fetchOverviewData();
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err) {
      alert(err.message);
    } finally {
      setQuickSubmitting(false);
    }
  };

  // Handle Full Modal Submit
  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    if (isViewOnly) return;
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
      if (!res.ok) throw new Error(data.message || "Failed to save record");

      setSuccessMsg(editId ? "Entry updated successfully!" : "Entry recorded successfully!");
      setShowModal(false);
      setIsViewOnly(false);
      fetchOverviewData();
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openAddExpense = () => {
    setEditId(null);
    setIsViewOnly(false);
    setExpenseForm({
      ...emptyExpenseForm,
      expenseDate: range === "specificDate" ? selectedDate : new Date().toISOString().slice(0, 10)
    });
    setFormError("");
    setShowModal(true);
  };

  const openEditExpense = (item) => {
    setEditId(item.id);
    setIsViewOnly(false);
    setExpenseForm({
      title: item.title || "",
      amount: item.amount || "",
      transactionType: item.transactionType || (item.type === "manual_income" ? "income" : "expense"),
      category: item.category || "General",
      expenseDate: safeISOString(item.expenseDate || item.date || item.purchaseDateTime || item.createdAt),
      description: item.description || ""
    });
    setFormError("");
    setShowModal(true);
  };

  const openViewExpense = (item) => {
    setEditId(item.id);
    setIsViewOnly(true);
    setExpenseForm({
      title: item.title || "",
      amount: item.amount || "",
      transactionType: item.transactionType || (item.type === "manual_income" ? "income" : "expense"),
      category: item.category || "General",
      expenseDate: safeISOString(item.expenseDate || item.date || item.purchaseDateTime || item.createdAt),
      description: item.description || ""
    });
    setFormError("");
    setShowModal(true);
  };

  const handleDeleteExpense = async (id) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      const res = await fetch(`${URL}/expense/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete record");
      setSuccessMsg("Record deleted successfully.");
      fetchOverviewData();
      setTimeout(() => setSuccessMsg(""), 3000);
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
      (item.registrationNo && item.registrationNo.toLowerCase().includes(q)) ||
      (item.buyerName && item.buyerName.toLowerCase().includes(q))
    );
  });

  const summary = overviewData.summary || {};
  const isNetProfitPositive = (summary.netProfit || 0) >= 0;
  const isNetCashPositive = (summary.netCashFlow || 0) >= 0;

  // Format label for current range
  const currentRangeLabel =
    range === "today"
      ? `Today (${formatDate(new Date())})`
      : range === "yesterday"
      ? "Yesterday"
      : range === "specificDate"
      ? `Date: ${formatDate(selectedDate)}`
      : range === "thisMonth"
      ? "This Month"
      : range === "pastMonth"
      ? "Past Month"
      : range === "6months"
      ? "Past 6 Months"
      : range === "1year"
      ? "Past 1 Year"
      : range === "perMonth"
      ? `Month: ${monthStr}`
      : "Custom Date Range";

  // PDF Export Trigger
  const handleExportPDF = () => {
    downloadExpensePDF({
      rangeLabel: currentRangeLabel,
      summary,
      categoryBreakdown: overviewData.categoryBreakdown || [],
      ledger: filteredLedger
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16">
      {/* HEADER BANNER */}
      <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              title="Back to Dashboard"
            >
              <ArrowLeft size={22} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">📊</span>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  Daily Expenses & Profit
                </h1>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 font-semibold mt-0.5">
                Daily Cash Flow, Bike Gross Profit & Showroom Expenses
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs border border-slate-200"
              title="Download PDF Financial Report"
            >
              <FileDown size={15} />
              <span>Export PDF</span>
            </button>

            <button
              onClick={openAddExpense}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Plus size={16} />
              <span>Add Expense</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* SUCCESS / ERROR NOTIFICATIONS */}
        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2 shadow-xs animate-in fade-in">
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl flex items-center gap-2 shadow-xs animate-in fade-in">
            <X size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* DATE RANGE FILTER TOOLBAR */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Timeline Filter
              </span>
              <p className="text-sm font-bold text-slate-900">{currentRangeLabel}</p>
            </div>

            {/* Presets Button Row */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "today", label: "Today" },
                { id: "yesterday", label: "Yesterday" },
                { id: "specificDate", label: "Pick Date" },
                { id: "thisMonth", label: "This Month" },
                { id: "pastMonth", label: "Past Month" },
                { id: "6months", label: "Past 6M" },
                { id: "1year", label: "1 Year" },
                { id: "perMonth", label: "Month" },
                { id: "custom", label: "Custom Range" },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setRange(btn.id)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    range === btn.id
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conditional Sub-controls for Specific Date / Custom Range */}
          {range === "specificDate" && (
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => changeDay(-1)}
                  className="p-1.5 hover:bg-white text-slate-700 rounded-lg transition-all cursor-pointer"
                  title="Previous Day"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-bold text-slate-700 px-2">Day Stepper</span>
                <button
                  onClick={() => changeDay(1)}
                  className="p-1.5 hover:bg-white text-slate-700 rounded-lg transition-all cursor-pointer"
                  title="Next Day"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <CalendarIcon size={14} className="text-slate-500" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-xs font-bold bg-transparent outline-none text-slate-800 cursor-pointer"
                />
              </div>
            </div>
          )}

          {range === "perMonth" && (
            <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
              <span className="text-xs font-bold text-slate-600">Select Month:</span>
              <input
                type="month"
                value={monthStr}
                onChange={(e) => setMonthStr(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
              />
            </div>
          )}

          {range === "custom" && (
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">To:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* 2 MAIN HERO METRIC CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* HERO CARD 1: NET DAILY PROFIT */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white shadow-lg shadow-emerald-700/10 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md">
                  <TrendingUp size={22} className="text-emerald-200" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-emerald-100">
                    Net Showroom Income
                  </h3>
                  <p className="text-[11px] text-emerald-200 font-semibold">{currentRangeLabel}</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-white/15 text-emerald-100 backdrop-blur-md border border-white/20">
                Profit minus Expenses
              </span>
            </div>

            <div className="mt-6">
              <div className="text-3xl lg:text-4xl font-black tracking-tight drop-shadow-xs">
                {money(summary.netProfit)}
              </div>
              <div className="mt-2.5 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-emerald-100">
                <span>Gross Profit: <strong className="text-white font-bold">+{money(summary.totalBikeGrossProfit ?? summary.totalGrossProfit)}</strong></span>
                <span>Expenses: <strong className="text-emerald-200 font-bold">-{money(summary.totalGeneralExpenses)}</strong></span>
              </div>
            </div>
          </div>

          {/* HERO CARD 2: DAY-END CASH BALANCE */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white shadow-lg shadow-slate-900/15 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl backdrop-blur-md ${isNetCashPositive ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>
                  {isNetCashPositive ? <ArrowUpRight size={22} /> : <ArrowDownRight size={22} />}
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">
                    Day-End Cash Balance
                  </h3>
                  <p className="text-[11px] text-slate-400 font-semibold">{currentRangeLabel}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider backdrop-blur-md ${
                isNetCashPositive ? "bg-emerald-400/20 text-emerald-200 border border-emerald-400/30" : "bg-rose-400/20 text-rose-200 border border-rose-400/30"
              }`}>
                {isNetCashPositive ? "Cash Inflow +" : "Cash Outflow -"}
              </span>
            </div>

            <div className="mt-6">
              <div className="text-3xl lg:text-4xl font-black tracking-tight drop-shadow-xs">
                {money(summary.netCashFlow)}
              </div>
              <div className="mt-2.5 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-slate-200">
                <span>Inflow: <strong className="text-emerald-300 font-bold">+{money(summary.totalInflow)}</strong></span>
                <span>Outflow: <strong className="text-rose-300 font-bold">-{money(summary.totalOutflow)}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* METRICS SUB-GRID: BIKE PROFIT, SALES, PURCHASES, EXPENSES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* GROSS BIKE PROFIT CARD */}
          <div className="p-5 bg-white rounded-3xl border border-emerald-200/90 shadow-xs flex flex-col justify-between hover:border-emerald-400 transition-all group bg-gradient-to-br from-emerald-50/40 to-white">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-700">
                Gross Bike Profit
              </span>
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                <TrendingUp size={18} />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-black text-emerald-700 tracking-tight">
                +{money(summary.totalBikeGrossProfit ?? summary.totalGrossProfit)}
              </div>
              <p className="text-[11px] text-slate-400 font-bold mt-1">
                {summary.salesCount} bike(s) sold in period
              </p>
            </div>
          </div>

          {/* BIKES SOLD REVENUE */}
          <div className="p-5 bg-white rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-blue-300 transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 group-hover:text-blue-600 transition-colors">
                Bikes Sold (Revenue)
              </span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <Banknote size={18} />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                +{money(summary.totalBikeSalesRevenue)}
              </div>
              <p className="text-[11px] text-slate-400 font-bold mt-1">
                {summary.salesCount} sale transaction(s)
              </p>
            </div>
          </div>

          {/* BIKES PURCHASED COST */}
          <div className="p-5 bg-white rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-amber-300 transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 group-hover:text-amber-600 transition-colors">
                Bikes Purchased (Cost)
              </span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all">
                <ShoppingCart size={18} />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-black text-rose-600 tracking-tight">
                -{money(summary.totalBikePurchasesCost)}
              </div>
              <p className="text-[11px] text-slate-400 font-bold mt-1">
                {summary.purchasesCount} bike(s) purchased
              </p>
            </div>
          </div>

          {/* GENERAL DAILY EXPENSES */}
          <div className="p-5 bg-white rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-rose-300 transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 group-hover:text-rose-600 transition-colors">
                General Expenses
              </span>
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-all">
                <Receipt size={18} />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-black text-rose-600 tracking-tight">
                -{money(summary.totalGeneralExpenses)}
              </div>
              <p className="text-[11px] text-slate-400 font-bold mt-1">
                {summary.expensesCount} operational entry(s)
              </p>
            </div>
          </div>
        </div>

        {/* QUICK ONE-CLICK INLINE EXPENSE / INCOME ENTRY BAR */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-slate-900 text-white rounded-lg">
                <Plus size={14} />
              </div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Quick Ledger Entry <span className="text-slate-400 font-normal normal-case">(Add Expense or Other Income)</span>
              </h3>
            </div>
            {/* Quick Type Selector */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setQuickType("expense")}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                  quickType === "expense" ? "bg-rose-600 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                💸 Expense (Outflow)
              </button>
              <button
                type="button"
                onClick={() => setQuickType("income")}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                  quickType === "income" ? "bg-emerald-600 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                💵 Income (Inflow)
              </button>
            </div>
          </div>

          <form onSubmit={handleQuickAdd} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-5">
              <input
                type="text"
                required
                placeholder={quickType === "expense" ? "Expense Title (e.g. Employee Daily Wage, Tea, Repair)" : "Income Title (e.g. Scrap Sale, Service Fee)"}
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/70 focus:bg-white text-slate-900"
              />
            </div>

            <div className="sm:col-span-3">
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rs.</span>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="Amount"
                  value={quickAmount}
                  onChange={(e) => setQuickAmount(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs font-bold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/70 focus:bg-white text-slate-900"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <select
                value={quickCategory}
                onChange={(e) => setQuickCategory(e.target.value)}
                className="w-full px-3 py-2.5 text-xs font-bold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/70 focus:bg-white text-slate-800 cursor-pointer"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={quickSubmitting || !quickTitle.trim() || !quickAmount}
                className={`w-full h-full py-2.5 px-4 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer ${
                  quickType === "expense" ? "bg-slate-900 hover:bg-rose-600" : "bg-emerald-700 hover:bg-emerald-800"
                }`}
              >
                {quickSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                <span>Record</span>
              </button>
            </div>
          </form>
        </div>

        {/* EXPENSE CATEGORY BREAKDOWN */}
        {overviewData.categoryBreakdown && overviewData.categoryBreakdown.length > 0 && (
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
              <Tag size={13} /> Expense Breakdown by Category
            </h4>
            <div className="flex flex-wrap items-center gap-2">
              {overviewData.categoryBreakdown.map((cat) => (
                <div
                  key={cat.category}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${getCategoryColor(cat.category)}`}
                >
                  <span>{cat.category}:</span>
                  <span className="font-black">{money(cat.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TABBED LEDGER & TRANSACTION EXPLORER */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "ledger", label: "Daily General Ledger", count: filteredLedger.length, icon: <Layers size={14} /> },
                { id: "expenses", label: "General Expenses", count: filteredExpenses.length, icon: <Receipt size={14} /> },
                { id: "purchases", label: "Bike Purchases", count: filteredPurchases.length, icon: <ShoppingCart size={14} /> },
                { id: "sales", label: "Bike Sales & Profit", count: filteredSales.length, icon: <Banknote size={14} /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-2xl transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    activeTab === tab.id ? "bg-white/20 text-white" : "bg-white text-slate-700 border border-slate-200"
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search ledger entries..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50 focus:bg-white text-slate-900"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                <RefreshCw size={24} className="animate-spin text-slate-700" />
                <span className="text-xs font-bold">Loading Financial Ledger Data...</span>
              </div>
            ) : (
              <>
                {/* TAB 1: CONSOLIDATED DAILY LEDGER */}
                {activeTab === "ledger" && (
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-500">
                        <th className="py-3.5 px-4 w-12">#</th>
                        <th className="py-3.5 px-4">Date / Time</th>
                        <th className="py-3.5 px-4">Type</th>
                        <th className="py-3.5 px-4">Transaction Details</th>
                        <th className="py-3.5 px-4">Category</th>
                        <th className="py-3.5 px-4 text-right">Inflow (+)</th>
                        <th className="py-3.5 px-4 text-right">Outflow (-)</th>
                        <th className="py-3.5 px-4 text-center sticky right-0 bg-slate-100 z-10 border-l border-slate-200 w-28">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium">
                      {filteredLedger.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-16 text-slate-400 font-semibold">
                            No ledger entries found for this period.
                          </td>
                        </tr>
                      ) : (
                        filteredLedger.map((item, i) => {
                          const isInflow = item.inflow > 0;
                          return (
                            <tr key={item.id || i} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3.5 px-4 text-slate-400 font-bold">{i + 1}</td>
                              <td className="py-3.5 px-4 whitespace-nowrap font-bold text-slate-800">
                                {formatDate(item.date)}
                                {item.date && (
                                  <span className="text-[10px] text-slate-400 font-normal ml-1">
                                    {formatTime(item.date)}
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                  item.type === "bike_sale"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : item.type === "bike_purchase"
                                    ? "bg-amber-100 text-amber-800"
                                    : item.type === "manual_income"
                                    ? "bg-teal-100 text-teal-800"
                                    : "bg-rose-100 text-rose-800"
                                }`}>
                                  {item.type === "bike_sale"
                                    ? "🏍️ Bike Sale"
                                    : item.type === "bike_purchase"
                                    ? "🛒 Bike Bought"
                                    : item.type === "manual_income"
                                    ? "💵 Income"
                                    : "💸 Expense"}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 font-bold text-slate-900">
                                {item.title}
                                {item.registrationNo && item.registrationNo !== "—" && (
                                  <span className="ml-2 font-mono text-[11px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                    {item.registrationNo}
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold border ${getCategoryColor(item.category)}`}>
                                  {item.category || "General"}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right font-black text-emerald-700 whitespace-nowrap text-sm">
                                {isInflow ? `+ ${money(item.inflow)}` : "—"}
                              </td>
                              <td className="py-3.5 px-4 text-right font-black text-rose-600 whitespace-nowrap text-sm">
                                {!isInflow ? `- ${money(item.outflow)}` : "—"}
                              </td>
                              <td className="py-3.5 px-4 text-center sticky right-0 bg-white z-10 border-l border-slate-200/80 shadow-xs">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => openViewExpense(item)}
                                    className="p-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 rounded-lg transition-all cursor-pointer"
                                    title="View Details"
                                  >
                                    <Eye size={13} />
                                  </button>
                                  {(item.type === "manual_expense" || item.type === "manual_income") && (
                                    <>
                                      <button
                                        onClick={() => openEditExpense(item)}
                                        className="p-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 rounded-lg transition-all cursor-pointer"
                                        title="Edit"
                                      >
                                        <Pencil size={13} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteExpense(item.id)}
                                        className="p-1.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 rounded-lg transition-all cursor-pointer"
                                        title="Delete"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    {filteredLedger.length > 0 && (
                      <tfoot>
                        <tr className="bg-slate-900 text-white font-black text-xs border-t-2 border-slate-800">
                          <td colSpan={5} className="py-3.5 px-4 uppercase tracking-wider">
                            Total Day-End Closing Feed
                          </td>
                          <td className="py-3.5 px-4 text-right text-emerald-400 text-sm">
                            + {money(summary.totalInflow)}
                          </td>
                          <td className="py-3.5 px-4 text-right text-rose-400 text-sm">
                            - {money(summary.totalOutflow)}
                          </td>
                          <td className="py-3.5 px-4 text-center sticky right-0 bg-slate-900 z-10 border-l border-slate-800 text-slate-300">
                            {summary.netCashFlow >= 0 ? "Net +" : "Net -"}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                )}

                {/* TAB 2: GENERAL EXPENSES */}
                {activeTab === "expenses" && (
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-500">
                        <th className="py-3.5 px-4 w-12">#</th>
                        <th className="py-3.5 px-4">Date</th>
                        <th className="py-3.5 px-4">Expense Title</th>
                        <th className="py-3.5 px-4">Category</th>
                        <th className="py-3.5 px-4 text-right">Amount (Rs.)</th>
                        <th className="py-3.5 px-4">Description</th>
                        <th className="py-3.5 px-4 text-center sticky right-0 bg-slate-100 z-10 border-l border-slate-200 w-36">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium">
                      {filteredExpenses.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-16 text-slate-400 font-semibold">
                            No manual operational expenses recorded for this date.
                          </td>
                        </tr>
                      ) : (
                        filteredExpenses.map((item, i) => (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4 text-slate-400 font-bold">{i + 1}</td>
                            <td className="py-3.5 px-4 whitespace-nowrap font-bold text-slate-800">
                              {formatDate(item.expenseDate || item.createdAt)}
                            </td>
                            <td className="py-3.5 px-4 font-black text-slate-900">{item.title}</td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold border ${getCategoryColor(item.category)}`}>
                                {item.category || "General"}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right font-black text-rose-600 whitespace-nowrap text-sm">
                              {money(item.amount)}
                            </td>
                            <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">{item.description || "—"}</td>
                            <td className="py-3.5 px-4 text-center sticky right-0 bg-white z-10 border-l border-slate-200/80 shadow-xs">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => openViewExpense(item)}
                                  className="px-2 py-1 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                                  title="View Details"
                                >
                                  <Eye size={13} /> View
                                </button>
                                <button
                                  onClick={() => openEditExpense(item)}
                                  className="p-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 rounded-lg transition-all cursor-pointer"
                                  title="Edit Expense"
                                >
                                  <Pencil size={13} />
                                </button>
                                <button
                                  onClick={() => handleDeleteExpense(item.id)}
                                  className="p-1.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 rounded-lg transition-all cursor-pointer"
                                  title="Delete Expense"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {/* TAB 3: BIKE PURCHASES */}
                {activeTab === "purchases" && (
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-500">
                        <th className="py-3.5 px-4 w-12">#</th>
                        <th className="py-3.5 px-4">Purchase Date</th>
                        <th className="py-3.5 px-4">Bike Details</th>
                        <th className="py-3.5 px-4">Reg No</th>
                        <th className="py-3.5 px-4">Chasis No</th>
                        <th className="py-3.5 px-4">Seller Name</th>
                        <th className="py-3.5 px-4 text-right">Purchase Outflow (Rs.)</th>
                        <th className="py-3.5 px-4 text-center sticky right-0 bg-slate-100 z-10 border-l border-slate-200 w-28">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium">
                      {filteredPurchases.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-16 text-slate-400 font-semibold">
                            No bike purchases recorded on this date.
                          </td>
                        </tr>
                      ) : (
                        filteredPurchases.map((item, i) => (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4 text-slate-400 font-bold">{i + 1}</td>
                            <td className="py-3.5 px-4 whitespace-nowrap font-bold text-slate-800">
                              {formatDate(item.purchaseDateTime || item.createdAt)}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-900">
                              {[item.bikeCompany, item.bikeModel].filter(Boolean).join(" ") || "—"}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-slate-700 font-bold">{item.registrationNo || "—"}</td>
                            <td className="py-3.5 px-4 font-mono text-slate-500">{item.chasisNo || "—"}</td>
                            <td className="py-3.5 px-4 text-slate-700 font-medium">{item.customerName || "—"}</td>
                            <td className="py-3.5 px-4 text-right font-black text-rose-600 whitespace-nowrap text-sm">
                              - {money(parseFloat(item.actualAmount || 0) + parseFloat(item.additionalExpense || 0))}
                            </td>
                            <td className="py-3.5 px-4 text-center sticky right-0 bg-white z-10 border-l border-slate-200/80 shadow-xs">
                              <button
                                onClick={() => openViewExpense(item)}
                                className="px-2 py-1 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 mx-auto"
                                title="View Purchase Record"
                              >
                                <Eye size={13} /> View
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {/* TAB 4: BIKE SALES & PROFIT */}
                {activeTab === "sales" && (
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-500">
                        <th className="py-3.5 px-4 w-12">#</th>
                        <th className="py-3.5 px-4">Sale Date</th>
                        <th className="py-3.5 px-4">Bike Details</th>
                        <th className="py-3.5 px-4">Reg No</th>
                        <th className="py-3.5 px-4">Buyer Name</th>
                        <th className="py-3.5 px-4 text-right">Sale Price (Inflow)</th>
                        <th className="py-3.5 px-4 text-right">Purchase Cost</th>
                        <th className="py-3.5 px-4 text-right">Bike Gross Profit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium">
                      {filteredSales.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-16 text-slate-400 font-semibold">
                            No bike sales recorded on this date.
                          </td>
                        </tr>
                      ) : (
                        filteredSales.map((item, i) => (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4 text-slate-400 font-bold">{i + 1}</td>
                            <td className="py-3.5 px-4 whitespace-nowrap font-bold text-slate-800">
                              {formatDate(item.date)}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-900">{item.title}</td>
                            <td className="py-3.5 px-4 font-mono text-slate-700 font-bold">{item.registrationNo || "—"}</td>
                            <td className="py-3.5 px-4 text-slate-700 font-medium">{item.buyerName || "—"}</td>
                            <td className="py-3.5 px-4 text-right font-black text-emerald-700 whitespace-nowrap text-sm">
                              + {money(item.salePrice)}
                            </td>
                            <td className="py-3.5 px-4 text-right font-semibold text-slate-600 whitespace-nowrap">
                              {money(item.cost)}
                            </td>
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-black ${
                                item.profit >= 0 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                              }`}>
                                {item.profit >= 0 ? "+" : ""}{money(item.profit)}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* FULL ADD / EDIT / VIEW MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-900 text-white rounded-2xl">
                  <Receipt size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    {isViewOnly ? "View Ledger Entry Details" : (editId ? "Edit Ledger Entry" : "Record Ledger Entry")}
                  </h2>
                  <p className="text-xs text-slate-500 font-semibold">
                    {isViewOnly ? "Read-only transaction details" : "Enter expense or income details"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleExpenseSubmit} className="p-6 space-y-4">
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">
                  Entry Type
                </label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    disabled={isViewOnly}
                    onClick={() => setExpenseForm({ ...expenseForm, transactionType: "expense" })}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer disabled:cursor-not-allowed ${
                      expenseForm.transactionType !== "income"
                        ? "bg-rose-600 text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    💸 Expense (Outflow)
                  </button>
                  <button
                    type="button"
                    disabled={isViewOnly}
                    onClick={() => setExpenseForm({ ...expenseForm, transactionType: "income" })}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer disabled:cursor-not-allowed ${
                      expenseForm.transactionType === "income"
                        ? "bg-emerald-600 text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    💵 Income (Inflow)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">
                  Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={isViewOnly}
                  placeholder="e.g. Employee Daily Wage, Chai Expense, Bike Spare Parts"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  className="w-full px-4 py-3 text-sm font-semibold border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/70 focus:bg-white text-slate-900 disabled:bg-slate-100 disabled:text-slate-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">
                    Amount (Rs.) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    disabled={isViewOnly}
                    placeholder="e.g. 500"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="w-full px-4 py-3 text-sm font-black border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/70 focus:bg-white text-slate-900 disabled:bg-slate-100 disabled:text-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <select
                    value={expenseForm.category}
                    disabled={isViewOnly}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="w-full px-4 py-3 text-sm font-bold border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/70 focus:bg-white text-slate-800 cursor-pointer disabled:bg-slate-100 disabled:text-slate-600"
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">
                  Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  disabled={isViewOnly}
                  value={expenseForm.expenseDate}
                  onChange={(e) => setExpenseForm({ ...expenseForm, expenseDate: e.target.value })}
                  className="w-full px-4 py-3 text-sm font-bold border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/70 focus:bg-white text-slate-900 cursor-pointer disabled:bg-slate-100 disabled:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1.5">
                  Description / Note <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  disabled={isViewOnly}
                  placeholder="Additional details about this entry..."
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="w-full px-4 py-3 text-sm font-medium border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/70 focus:bg-white text-slate-900 resize-none disabled:bg-slate-100 disabled:text-slate-600"
                />
              </div>

              {formError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                {!isViewOnly && (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold py-3.5 rounded-2xl transition-all disabled:opacity-50 cursor-pointer shadow-md"
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    <span>{submitting ? "Saving..." : editId ? "Update Entry" : "Save Entry"}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 text-sm font-bold py-3.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  {isViewOnly ? "Close" : "Cancel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <MobileBottomNav />
    </div>
  );
}
