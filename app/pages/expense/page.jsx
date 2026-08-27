"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  RefreshCw,
  TrendingUp,
  Banknote,
  Calendar as CalendarIcon,
  Search,
  FileDown,
  Trash2,
  Pencil,
  Eye,
  X,
  Receipt,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { downloadExpensePDF } from "@/app/lib/pdfUtils";
import MobileBottomNav from "@/app/components/MobileBottomNav";

const URL = process.env.NEXT_PUBLIC_BASE_URL;

const EXPENSE_CATEGORIES = [
  "Salary / Wages",
  "Tea & Refreshment",
  "Bike Parts & Repair",
  "Rent & Utilities",
  "Workshop Maintenance",
  "General"
];

const money = (n) => (n != null ? `Rs. ${Number(n).toLocaleString()}` : "—");

export default function ExpenseDashboard() {
  const router = useRouter();

  // Date Range state — DEFAULT TO "today"
  const [range, setRange] = useState("today");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [search, setSearch] = useState("");

  // Data state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [overviewData, setOverviewData] = useState({
    summary: {
      totalGeneralExpenses: 0,
      totalBikeGrossProfit: 0,
      netProfit: 0,
      expensesCount: 0
    },
    expenses: [],
    ledger: []
  });

  // Expense Write Form State
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("General");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [expenseDescription, setExpenseDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const fetchOverviewData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("range", range);
      if (range === "specificDate") params.set("date", selectedDate);

      const res = await fetch(`${URL}/expense/overview?${params.toString()}`);
      const json = await res.json();

      if (res.ok && json.success) {
        setOverviewData(json);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [range, selectedDate]);

  useEffect(() => {
    fetchOverviewData();
  }, [fetchOverviewData]);

  // Submit New Daily Expense
  const handleWriteExpense = async (e) => {
    e.preventDefault();
    if (!expenseTitle.trim() || !expenseAmount) return;

    setSubmitting(true);
    const newExpense = {
      title: expenseTitle.trim(),
      amount: parseFloat(expenseAmount),
      transactionType: "expense",
      category: expenseCategory,
      expenseDate: expenseDate || new Date().toISOString().slice(0, 10),
      description: expenseDescription.trim()
    };

    try {
      const res = await fetch(`${URL}/expense`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newExpense)
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to record expense");

      setSuccessMsg("Expense recorded successfully!");
      setExpenseTitle("");
      setExpenseAmount("");
      setExpenseCategory("General");
      setExpenseDescription("");
      fetchOverviewData();
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!confirm("Are you sure you want to delete this expense entry?")) return;
    try {
      const res = await fetch(`${URL}/expense/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSuccessMsg("Expense deleted.");
        fetchOverviewData();
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const changeDay = (offset) => {
    let baseDate = range === "specificDate" && selectedDate ? new Date(selectedDate) : new Date();
    baseDate.setDate(baseDate.getDate() + offset);
    setSelectedDate(baseDate.toISOString().slice(0, 10));
    setRange("specificDate");
  };

  const summary = overviewData.summary || {};
  const grossProfit = summary.totalBikeGrossProfit || summary.totalGrossProfit || 0;
  const totalExpenses = summary.totalGeneralExpenses || 0;
  const netProfit = grossProfit - totalExpenses;

  const filteredExpenses = (overviewData.expenses || []).filter((exp) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (exp.title && exp.title.toLowerCase().includes(q)) ||
      (exp.category && exp.category.toLowerCase().includes(q)) ||
      (exp.description && exp.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 font-sans pb-20">
      {/* Header */}
      <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs backdrop-blur-md bg-white/90 px-4 sm:px-6 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <ArrowLeft size={20} className="text-slate-600" />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">Daily Expenses & Profit</h1>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium -mt-0.5">Write daily showroom expenses and track net income</p>
            </div>
          </div>

          <button
            onClick={() => downloadExpensePDF(overviewData)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <FileDown size={16} />
            <span>Download Expense PDF</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Success Toast */}
        {successMsg && (
          <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-3.5 rounded-xl text-xs font-bold flex items-center justify-between">
            <span>✅ {successMsg}</span>
            <button onClick={() => setSuccessMsg("")}><X size={16} /></button>
          </div>
        )}

        {/* Date Selector */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {["today", "yesterday", "thisMonth", "all"].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  range === r ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {r === "today" ? "Today" : r === "yesterday" ? "Yesterday" : r === "thisMonth" ? "This Month" : "All Time"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => changeDay(-1)} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer">
              <ChevronLeft size={16} />
            </button>
            <input
              type="date"
              value={range === "specificDate" ? selectedDate : new Date().toISOString().slice(0, 10)}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setRange("specificDate");
              }}
              className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-xl bg-white focus:outline-none"
            />
            <button onClick={() => changeDay(1)} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* 2 Main Summary Hero Cards: DAILY PROFIT & DAILY EXPENSE */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Daily Profit Card */}
          <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Daily Bike Profit</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600"><TrendingUp size={20} /></div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-black text-emerald-600">{money(grossProfit)}</p>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Gross profit from sales</span>
            </div>
          </div>

          {/* Daily Expenses Card */}
          <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Daily Total Expenses</span>
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600"><Receipt size={20} /></div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-black text-rose-600">-{money(totalExpenses)}</p>
              <span className="text-[11px] text-slate-400 mt-0.5 block">{summary.expensesCount} operational entry(s)</span>
            </div>
          </div>

          {/* Net Income Card */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Net Showroom Income</span>
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
                {netProfit >= 0 ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-black text-emerald-300">{money(netProfit)}</p>
              <span className="text-[11px] text-slate-300 mt-0.5 block">Profit minus Daily Expenses</span>
            </div>
          </div>
        </div>

        {/* WRITE DAILY EXPENSE FORM */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-slate-900 text-white rounded-xl"><Plus size={16} /></div>
            <h2 className="text-sm font-bold text-slate-900">Write Daily Expense Entry</h2>
          </div>

          <form onSubmit={handleWriteExpense} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-slate-600 mb-1">Expense Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Chai, Staff Salary, Repair"
                value={expenseTitle}
                onChange={(e) => setExpenseTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-slate-600 mb-1">Price / Amount (Rs.) *</label>
              <input
                type="number"
                required
                min="0"
                placeholder="e.g. 500"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-slate-600 mb-1">Category</label>
              <select
                value={expenseCategory}
                onChange={(e) => setExpenseCategory(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-slate-600 mb-1">Date</label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="sm:col-span-2 md:col-span-3">
              <input
                type="text"
                placeholder="Optional description / details..."
                value={expenseDescription}
                onChange={(e) => setExpenseDescription(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="sm:col-span-2 md:col-span-1 flex items-end">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
              >
                {submitting ? "Saving..." : "+ Record Expense"}
              </button>
            </div>
          </form>
        </div>

        {/* EXPENSES TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Recorded Daily Expenses ({filteredExpenses.length})</h3>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search expenses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          {filteredExpenses.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs font-medium">
              No daily expenses recorded for this period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Title</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3">Description</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredExpenses.map((exp, idx) => (
                    <tr key={exp.id || idx} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-bold text-slate-800">{exp.title}</td>
                      <td className="p-3 text-slate-600">{exp.category || "General"}</td>
                      <td className="p-3 font-bold text-rose-600 text-right">-{money(exp.amount)}</td>
                      <td className="p-3 text-slate-500 max-w-xs truncate">{exp.description || "—"}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="Delete Expense"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
