"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  Banknote,
  Plus,
  Trash2,
  FileDown,
  Receipt,
  Search,
  CheckCircle2,
  XCircle,
  Calendar,
  Tag
} from "lucide-react";
import MobileBottomNav from "@/app/components/MobileBottomNav";
import { downloadNetIncomePDF } from "@/app/lib/pdfUtils";
import { saveLocalRecord, getLocalPaginated } from "@/app/lib/offlineService";

const URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5000";

const money = (n) => (n != null ? `Rs. ${Number(n).toLocaleString()}` : "—");

const EXPENSE_CATEGORIES = [
  "Salary / Wages",
  "Tea & Refreshment",
  "Bike Parts & Repair",
  "Rent & Utilities",
  "Workshop Maintenance",
  "General"
];

export default function EarningDashboard() {
  const router = useRouter();

  const [range, setRange] = useState("6months");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [monthStr, setMonthStr] = useState("");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [data, setData] = useState({
    summary: {
      totalProfit: 0,
      totalSalesCount: 0,
      totalSalesRevenue: 0,
      totalPurchasesCount: 0,
      totalPurchasesCost: 0,
      currentStockCount: 0,
      currentStockValue: 0
    },
    profitList: []
  });

  // Local Expenses State with Deduction Toggle
  const [expenses, setExpenses] = useState([]);
  const [expenseForm, setExpenseForm] = useState({
    title: "",
    amount: "",
    category: "General",
    expenseDate: new Date().toISOString().slice(0, 10),
    description: "",
    deductFromProfit: true,
  });
  const [submittingExpense, setSubmittingExpense] = useState(false);

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

      if (res.ok && json.success) {
        setData(json);
      } else {
        // Fallback local calculation
        setData({
          summary: { totalProfit: 0, totalSalesCount: 0, totalSalesRevenue: 0 },
          profitList: []
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [range, startDate, endDate, monthStr]);

  const loadExpenses = useCallback(async () => {
    try {
      const res = await fetch(`${URL}/expense?limit=50`);
      const json = await res.json();
      if (res.ok && json.success) {
        setExpenses(
          (json.data || []).map((exp) => ({
            ...exp,
            deductFromProfit: exp.deductFromProfit !== undefined ? exp.deductFromProfit : true,
          }))
        );
      }
    } catch (err) {
      // Local fallback
      const localRes = await getLocalPaginated("expenses", 1, 50);
      if (localRes.success) {
        setExpenses(localRes.data.map(exp => ({ ...exp, deductFromProfit: exp.deductFromProfit !== false })));
      }
    }
  }, []);

  useEffect(() => {
    fetchEarningData();
    loadExpenses();
  }, [fetchEarningData, loadExpenses]);

  // Handle New Expense Submission
  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.title.trim() || !expenseForm.amount) return;

    setSubmittingExpense(true);
    const newExpense = {
      title: expenseForm.title.trim(),
      amount: parseFloat(expenseForm.amount),
      category: expenseForm.category,
      expenseDate: expenseForm.expenseDate,
      description: expenseForm.description.trim(),
      deductFromProfit: expenseForm.deductFromProfit,
      createdAt: new Date().toISOString(),
    };

    try {
      // 1. Save locally to Dexie (Offline-First)
      await saveLocalRecord("expenses", newExpense);

      // 2. Post to backend API
      await fetch(`${URL}/expense`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newExpense),
      });

      // Update UI state
      setExpenses((prev) => [newExpense, ...prev]);
      setExpenseForm({
        title: "",
        amount: "",
        category: "General",
        expenseDate: new Date().toISOString().slice(0, 10),
        description: "",
        deductFromProfit: true,
      });
    } catch (err) {
      console.error("Expense error:", err);
    } finally {
      setSubmittingExpense(false);
    }
  };

  // Toggle Expense Deduction Status
  const toggleExpenseDeduction = (idx) => {
    setExpenses((prev) => {
      const updated = [...prev];
      updated[idx] = {
        ...updated[idx],
        deductFromProfit: !updated[idx].deductFromProfit,
      };
      return updated;
    });
  };

  // Delete Expense
  const handleDeleteExpense = async (id, idx) => {
    setExpenses((prev) => prev.filter((_, i) => i !== idx));
    if (id) {
      try {
        await fetch(`${URL}/expense/${id}`, { method: "DELETE" });
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Calculation Metrics
  const grossProfit = data.summary.totalProfit || 0;

  const deductibleExpenses = expenses
    .filter((e) => e.deductFromProfit)
    .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  const neglectedExpenses = expenses
    .filter((e) => !e.deductFromProfit)
    .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  const netIncome = grossProfit - deductibleExpenses;

  // PDF Export Trigger
  const handleExportNetIncomePDF = () => {
    downloadNetIncomePDF({
      rangeLabel: range === "6months" ? "Last 6 Months" : range === "thisMonth" ? "This Month" : "Custom Period",
      date: new Date().toLocaleDateString("en-PK"),
      grossProfit,
      deductibleExpenses,
      neglectedExpenses,
      netIncome,
      expensesList: expenses,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans antialiased flex flex-col justify-between pb-16 md:pb-0">
      <div>
        {/* Header */}
        <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs backdrop-blur-md bg-white/90 px-4 sm:px-6 py-3.5 sm:py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/dashboard")}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <ArrowLeft size={20} className="text-slate-600" />
              </button>
              <div>
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">Earning & Net Income</h1>
                <p className="text-[11px] sm:text-xs text-slate-500 font-medium -mt-0.5">Bike Sales Gross Profit & Daily Expenses Deduction</p>
              </div>
            </div>

            <button
              onClick={handleExportNetIncomePDF}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <FileDown size={16} />
              <span>Download Net Income PDF</span>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Metrics Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {/* Gross Profit */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Gross Sale Profit</span>
              <p className="text-2xl font-black text-emerald-600 mt-2">{money(grossProfit)}</p>
              <span className="text-[11px] text-slate-400 mt-1">From bike sales</span>
            </div>

            {/* Deductible Expenses */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-500">Deductible Expenses</span>
              <p className="text-2xl font-black text-rose-600 mt-2">-{money(deductibleExpenses)}</p>
              <span className="text-[11px] text-slate-400 mt-1">Subtracted from profit</span>
            </div>

            {/* Neglected Expenses */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Neglected Expenses</span>
              <p className="text-2xl font-black text-slate-600 mt-2">{money(neglectedExpenses)}</p>
              <span className="text-[11px] text-slate-400 mt-1">Excluded from calculation</span>
            </div>

            {/* Net Income */}
            <div className="bg-emerald-900 text-white p-5 rounded-2xl border border-emerald-800 shadow-md flex flex-col justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">Final Net Income</span>
              <p className="text-2xl font-black text-emerald-300 mt-2">{money(netIncome)}</p>
              <span className="text-[11px] text-emerald-200/80 mt-1">Gross Profit - Deducted Expenses</span>
            </div>
          </div>

          {/* Add Daily Expense Form */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Receipt className="text-slate-700" size={20} />
              <h2 className="text-base font-bold text-slate-900">Record Daily Expense</h2>
            </div>

            <form onSubmit={handleAddExpense} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Expense Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chai, Spare parts, Salary"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Price / Amount (Rs.) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="e.g. 1500"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Category</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Expense Date</label>
                <input
                  type="date"
                  value={expenseForm.expenseDate}
                  onChange={(e) => setExpenseForm({ ...expenseForm, expenseDate: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Optional Description</label>
                <input
                  type="text"
                  placeholder="Additional details..."
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Deduct Checkbox & Submit */}
              <div className="flex items-end gap-3 sm:col-span-2 md:col-span-1">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer pb-2.5">
                  <input
                    type="checkbox"
                    checked={expenseForm.deductFromProfit}
                    onChange={(e) => setExpenseForm({ ...expenseForm, deductFromProfit: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <span>Deduct from Profit</span>
                </label>

                <button
                  type="submit"
                  disabled={submittingExpense}
                  className="flex-1 py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  {submittingExpense ? "Saving..." : "Add Expense"}
                </button>
              </div>
            </form>
          </div>

          {/* Expenses Table with Deduction Toggle */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Recorded Daily Expenses ({expenses.length})</h3>
              <span className="text-xs text-slate-500">Toggle "Deduct" button to neglect or include in profit</span>
            </div>

            {expenses.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-medium">
                No daily expenses recorded yet. Use the form above to add an expense.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Title</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Price / Amount</th>
                      <th className="p-3">Description</th>
                      <th className="p-3 text-center">Net Profit Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {expenses.map((exp, idx) => (
                      <tr key={exp.id || idx} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 text-slate-400">{idx + 1}</td>
                        <td className="p-3 font-bold text-slate-800">{exp.title}</td>
                        <td className="p-3 text-slate-600">{exp.category || "General"}</td>
                        <td className="p-3 font-bold text-rose-600">{money(exp.amount)}</td>
                        <td className="p-3 text-slate-500 max-w-xs truncate">{exp.description || "—"}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => toggleExpenseDeduction(idx)}
                            className={`px-3 py-1 rounded-full text-[11px] font-extrabold transition-all cursor-pointer ${
                              exp.deductFromProfit
                                ? "bg-rose-100 text-rose-700 border border-rose-200 hover:bg-rose-200"
                                : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200"
                            }`}
                          >
                            {exp.deductFromProfit ? "Deducted (-)" : "Neglected (0)"}
                          </button>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleDeleteExpense(exp.id, idx)}
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
      </div>

      <MobileBottomNav />
    </div>
  );
}
