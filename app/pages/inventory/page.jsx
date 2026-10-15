"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Package,
  Banknote,
  Loader2,
  RefreshCw,
  FileDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Check,
  Eye,
} from "lucide-react";
import MobileBottomNav from "@/app/components/MobileBottomNav";
import ExportPDFModal from "@/app/components/ExportPDFModal";
import { downloadInventoryPDF } from "@/app/lib/pdfUtils";
import DashboardLayout from "@/app/components/DashboardLayout";

const URL = process.env.NEXT_PUBLIC_BASE_URL;
const PAGE_SIZE = 10;

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

export default function InventoryDashboard() {
  const router = useRouter();
  const [inventory, setInventory] = useState([]);
  const [summary, setSummary] = useState({ totalPurchased: 0, totalPurchaseValue: 0, remainingBalance: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showExportModal, setShowExportModal] = useState(false);

  // Search Filters matching Purchase page style
  const [searchCustomer, setSearchCustomer] = useState("");
  const [searchChasis, setSearchChasis] = useState("");
  const [searchEngine, setSearchEngine] = useState("");
  const [appliedCustomer, setAppliedCustomer] = useState("");
  const [appliedChasis, setAppliedChasis] = useState("");
  const [appliedEngine, setAppliedEngine] = useState("");

  const fetchInventory = useCallback(async (pageNum = 1) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        page: String(pageNum),
        limit: String(PAGE_SIZE),
      });
      if (appliedCustomer) qs.set("customer", appliedCustomer);
      if (appliedChasis) qs.set("chasis", appliedChasis);
      if (appliedEngine) qs.set("engine", appliedEngine);

      const res = await fetch(`${URL}/inventory?${qs.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setInventory(data.data || []);
        if (data.summary) setSummary(data.summary);
        if (data.pagination) {
          setPage(data.pagination.page);
          setTotalPages(data.pagination.totalPages);
          setTotal(data.pagination.total);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [appliedCustomer, appliedChasis, appliedEngine]);

  const handleApplyFilters = () => {
    setAppliedCustomer(searchCustomer.trim().toLowerCase());
    setAppliedChasis(searchChasis.trim().toLowerCase());
    setAppliedEngine(searchEngine.trim().toLowerCase());
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchCustomer("");
    setSearchChasis("");
    setSearchEngine("");
    setAppliedCustomer("");
    setAppliedChasis("");
    setAppliedEngine("");
    setPage(1);
  };

  const hasFilters = Boolean(appliedCustomer || appliedChasis || appliedEngine);

  useEffect(() => {
    fetchInventory(page);
  }, [page, fetchInventory]);

  const handleExportPDF = async ({ rangeType, startDate, endDate }) => {
    const params = new URLSearchParams({ all: "true" });
    if (rangeType === "today") {
      const today = new Date().toISOString().slice(0, 10);
      params.set("startDate", today);
      params.set("endDate", today);
    } else if (rangeType === "thisMonth") {
      const d = new Date();
      const firstDay = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
      params.set("startDate", firstDay);
      params.set("endDate", lastDay);
    } else if (rangeType === "pastMonth") {
      const d = new Date();
      const firstDay = new Date(d.getFullYear(), d.getMonth() - 1, 1).toISOString().slice(0, 10);
      const lastDay = new Date(d.getFullYear(), d.getMonth(), 0).toISOString().slice(0, 10);
      params.set("startDate", firstDay);
      params.set("endDate", lastDay);
    } else if (rangeType === "custom" && startDate && endDate) {
      params.set("startDate", startDate);
      params.set("endDate", endDate);
    }

    const res = await fetch(`${URL}/inventory?${params.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to fetch inventory for PDF export");
    const exportData = data.data || [];
    const exportSummary = data.summary || summary;
    downloadInventoryPDF(exportData, exportSummary);
  };

  return (
    <DashboardLayout>
      <div className="min-h-full bg-slate-50/50 text-slate-900 font-sans antialiased pb-16">
        <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs backdrop-blur-md bg-white/90">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#0b243b] text-white p-2.5 rounded-xl shadow-md">
                <Package size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">Inventory Stock</h1>
                <p className="text-xs text-slate-500 font-medium -mt-0.5">Showroom Unsold Bikes &amp; Valuation Registry</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-2 bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-emerald-700 transition-all shadow-md cursor-pointer"
                title="Download Inventory PDF Report"
              >
                <FileDown size={16} /> Download PDF
              </button>
              <button onClick={() => fetchInventory(page)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer" title="Refresh">
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl"><Package size={28} /></div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Unsold Bikes in Stock</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{summary.totalUnsold ?? summary.totalPurchased ?? 0}</p>
              </div>
            </div>
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><Banknote size={28} /></div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Inventory Value</p>
                <p className="text-2xl font-bold text-emerald-700 mt-1">Rs. {Number(summary.totalPurchaseValue || 0).toLocaleString()}</p>
              </div>
            </div>
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl"><Banknote size={28} /></div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Remaining Payables</p>
                <p className="text-2xl font-bold text-rose-600 mt-1">Rs. {Number(summary.remainingBalance || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Search Filters (EXACT Purchase Page UI!) */}
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Search by Customer / Seller..."
              value={searchCustomer}
              onChange={(e) => setSearchCustomer(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
              className="px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white shadow-2xs min-w-[200px]"
            />
            <input
              type="text"
              placeholder="Search by Chasis No..."
              value={searchChasis}
              onChange={(e) => setSearchChasis(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
              className="px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white shadow-2xs min-w-[180px]"
            />
            <input
              type="text"
              placeholder="Search by Engine or Reg No..."
              value={searchEngine}
              onChange={(e) => setSearchEngine(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
              className="px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white shadow-2xs min-w-[180px]"
            />
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Search size={15} /> Search
            </button>
            {hasFilters && (
              <button
                onClick={handleClearFilters}
                className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Inventory Table (EXACT Purchase Page UI!) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-slate-400"><Loader2 size={28} className="animate-spin" /></div>
            ) : inventory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
                <span className="text-4xl">📋</span>
                <p className="text-sm font-medium">No unsold bikes found in inventory.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      {["#", "Seller / Supplier", "Bike Model", "CC", "Color", "Reg. No", "Chasis No", "Engine No", "Purchase Amount", "Remaining", "Date", "Status", "Action"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((item, i) => (
                      <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150">
                        <td className="px-4 py-3 text-slate-400 font-medium">{(page - 1) * PAGE_SIZE + i + 1}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{item.customerName || "—"}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{[item.bikeCompany, item.bikeModel].filter(Boolean).join(" ") || "—"}</td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{item.bikeCC || "—"}</td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{item.bikeColor || "—"}</td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{item.registrationNo || "AFR"}</td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap font-mono text-xs">{item.chasisNo || "—"}</td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap font-mono text-xs">{item.engineNo || "—"}</td>
                        <td className="px-4 py-3 text-emerald-700 font-semibold whitespace-nowrap">Rs. {Number(item.actualAmount || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-rose-600 font-semibold whitespace-nowrap">{Number(item.amountRemaining) > 0 ? `Rs. ${Number(item.amountRemaining).toLocaleString()}` : "—"}</td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDateTime(item.purchaseDateTime || item.purchaseDate || item.createdAt)}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500 text-white" title="In Stock">
                            <Check size={14} />
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => router.push("/purchase-dashboard")}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200 cursor-pointer"
                            title="Open in Purchasing"
                          >
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination (EXACT Purchase Page UI!) */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                .reduce((acc, n, idx, arr) => {
                  if (idx > 0 && n - arr[idx - 1] > 1) acc.push("...");
                  acc.push(n);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === "..." ? (
                    <span key={`dots-${idx}`} className="px-2 text-slate-400 text-sm">…</span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setPage(item)}
                      className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                        page === item ? "bg-slate-900 text-white shadow-md" : "border border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </main>
      </div>
    </DashboardLayout>
  );
}
