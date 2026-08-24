"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Package, DollarSign, Loader2, RefreshCw, FileDown, ChevronLeft, ChevronRight } from "lucide-react";
import { downloadInventoryPDF } from "@/app/lib/pdfUtils";

const URL = process.env.NEXT_PUBLIC_BASE_URL;
const PAGE_SIZE = 10;

export default function InventoryDashboard() {
  const router = useRouter();
  const [inventory, setInventory] = useState([]);
  const [summary, setSummary] = useState({ totalPurchased: 0, totalPurchaseValue: 0, remainingBalance: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchInventory = async (pageNum = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`${URL}/inventory?page=${pageNum}&limit=${PAGE_SIZE}`);
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
  };

  useEffect(() => { fetchInventory(page); }, [page]);

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
              <p className="text-xs text-slate-500 font-medium -mt-0.5">Inventory Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => downloadInventoryPDF(inventory, summary)}
              className="flex items-center gap-2 bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-emerald-700 transition-all shadow-md"
              title="Download Inventory PDF Report"
            >
              <FileDown size={16} /> Download PDF
            </button>
            <button onClick={() => fetchInventory(page)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"><RefreshCw size={16} /></button>
            <button onClick={() => router.push("/dashboard")} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
              <ArrowLeft size={16} /> Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl"><Package size={28} /></div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Unsold Bikes in Stock</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{summary.totalUnsold ?? summary.totalPurchased ?? 0}</p>
            </div>
          </div>
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><DollarSign size={28} /></div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Inventory Value</p>
              <p className="text-2xl font-bold text-emerald-700 mt-1">Rs. {Number(summary.totalPurchaseValue || 0).toLocaleString()}</p>
            </div>
          </div>
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl"><DollarSign size={28} /></div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Remaining Payment</p>
              <p className="text-2xl font-bold text-rose-600 mt-1">Rs. {Number(summary.remainingBalance || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Unsold Bikes in Stock ({total})</h2>
            <button
              onClick={() => downloadInventoryPDF(inventory, summary)}
              className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-all"
            >
              <FileDown size={14} /> PDF Report
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-16 text-slate-400"><Loader2 size={28} className="animate-spin" /></div>
          ) : inventory.length === 0 ? (
            <p className="text-xs text-slate-400 py-12 text-center">No unsold bikes found in inventory.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {["#", "Bike Model", "Registration No", "Chasis No", "Engine No", "Purchase Price", "Remaining", "Seller Name"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item, i) => (
                    <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-slate-400 font-medium">{i + 1}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{[item.bikeCompany, item.bikeModel].filter(Boolean).join(" ") || "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{item.registrationNo || "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{item.chasisNo || "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{item.engineNo || "—"}</td>
                      <td className="px-4 py-3 text-emerald-700 font-semibold">Rs. {Number(item.actualAmount || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-rose-600 font-semibold">Rs. {Number(item.amountRemaining || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-slate-600">{item.customerName || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
              <p className="text-xs text-slate-500">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`text-xs font-bold w-8 h-8 rounded-lg transition-all ${
                      p === page
                        ? "bg-slate-900 text-white shadow-md"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
