"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, RefreshCw, Loader2, Search, Download,
  TrendingUp, ShoppingCart, CreditCard, FileText, CalendarRange, User
} from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

function fmt(n) {
  return `Rs. ${Number(n || 0).toLocaleString()}`;
}

function fmtDate(v) {
  if (!v) return "—";
  const d = v?.seconds ? new Date(v.seconds * 1000) : new Date(v);
  return isNaN(d) ? "—" : d.toLocaleDateString("en-PK");
}

export default function ReportsDashboard() {
  const router = useRouter();
  const printRef = useRef(null);

  const [summary, setSummary] = useState({});
  const [allSales, setAllSales] = useState([]);
  const [allPurchases, setAllPurchases] = useState([]);
  const [allRegistrations, setAllRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [appliedCustomer, setAppliedCustomer] = useState("");
  const [selectedScenario, setSelectedScenario] = useState("all");

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
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  // Helper: parse date from Firestore timestamp or string
  const parseDate = (val) => {
    if (!val) return null;
    // Firestore Timestamp serialized as { seconds, nanoseconds } (older SDK)
    if (val.seconds != null) return new Date(val.seconds * 1000);
    // Firestore Timestamp serialized as { _seconds, _nanoseconds } (newer SDK)
    if (val._seconds != null) return new Date(val._seconds * 1000);
    // Firestore Timestamp with toDate() (if called server-side before serialization)
    if (typeof val.toDate === "function") return val.toDate();
    // ISO string or other parseable format
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  };

  // Apply date range and customer filter
  const filterRecords = (records, dateField, nameField) => {
    const from = dateFrom ? new Date(dateFrom + "T00:00:00.000Z") : null;
    const to = dateTo ? new Date(dateTo + "T23:59:59.999Z") : null;

    return records.filter((r) => {
      const d = parseDate(r[dateField]);
      // Skip records with unparseable dates only when a filter is active
      if (!d) return !dateFrom && !dateTo;
      if (from && d < from) return false;
      if (to && d > to) return false;
      if (appliedCustomer) {
        const name = (r[nameField] || "").toLowerCase();
        if (!name.includes(appliedCustomer.toLowerCase())) return false;
      }
      return true;
    });
  };

  const filteredSales = filterRecords(allSales, "saleDateTime", "buyerName");
  const filteredPurchases = filterRecords(allPurchases, "purchaseDateTime", "customerName");
  const filteredRegistrations = filterRecords(allRegistrations, "createdAt", "bikeCompany");

  // Computed summary from filtered data
  const filteredSummary = {
    totalSalesValue: filteredSales.reduce((s, r) => s + Number(r.totalSaleAmount || 0), 0),
    totalPurchaseCost: filteredPurchases.reduce((s, r) => s + Number(r.actualAmount || 0), 0),
    totalInstallmentPending: filteredSales
      .filter(s => (s.saleType || "").toLowerCase() === "installment")
      .reduce((s, r) => s + Math.max(0, Number(r.totalSaleAmount || 0) - Number(r.advanceReceived || 0) - Number(r.paidInstallments || 0)), 0),
    completedPapers: filteredRegistrations.filter(r => r.paperReceived).length,
    pendingPapers: filteredRegistrations.filter(r => !r.paperReceived).length,
  };

  const handleApplyCustomer = () => {
    setAppliedCustomer(customerFilter);
  };

  const handleClearFilters = () => {
    setDateFrom(""); setDateTo(""); setCustomerFilter(""); setAppliedCustomer("");
  };

  // PDF Print
  const handleDownloadPDF = () => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open("", "_blank", "width=900,height=700");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ammar Autos - Report</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; }
          body { background: #fff; color: #1e293b; padding: 24px; }
          .header { background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%); color: white; padding: 24px 32px; border-radius: 16px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; }
          .header h1 { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
          .header p { font-size: 12px; opacity: 0.7; margin-top: 4px; }
          .header .meta { text-align: right; font-size: 12px; opacity: 0.8; }
          .cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
          .card { border-radius: 12px; padding: 16px; border: 1px solid #e2e8f0; }
          .card-green { background: linear-gradient(135deg, #ecfdf5, #d1fae5); border-color: #6ee7b7; }
          .card-blue { background: linear-gradient(135deg, #eff6ff, #dbeafe); border-color: #93c5fd; }
          .card-red { background: linear-gradient(135deg, #fff1f2, #ffe4e6); border-color: #fca5a5; }
          .card-purple { background: linear-gradient(135deg, #f5f3ff, #ede9fe); border-color: #c4b5fd; }
          .card label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
          .card .value { font-size: 20px; font-weight: 800; margin-top: 6px; }
          .card-green .value { color: #059669; }
          .card-blue .value { color: #2563eb; }
          .card-red .value { color: #dc2626; }
          .card-purple .value { color: #7c3aed; }
          .section { margin-bottom: 28px; }
          .section h2 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #475569; padding: 8px 0; border-bottom: 2px solid #e2e8f0; margin-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          thead tr { background: linear-gradient(135deg, #1e293b, #334155); color: white; }
          th { padding: 8px 10px; text-align: left; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; }
          td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; white-space: nowrap; }
          tr:nth-child(even) td { background: #f8fafc; }
          .badge-green { background: #dcfce7; color: #15803d; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 700; }
          .badge-red { background: #fee2e2; color: #dc2626; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 700; }
          .badge-blue { background: #dbeafe; color: #1d4ed8; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 700; }
          .footer { margin-top: 32px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; }
          @media print { body { padding: 12px; } .header { border-radius: 8px; } }
        </style>
      </head>
      <body>
        ${content.innerHTML}
        <div class="footer">Generated by Ammar Autos Management System &bull; ${new Date().toLocaleDateString("en-PK", { year: "numeric", month: "long", day: "numeric" })}</div>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
  };

  const hasFilters = dateFrom || dateTo || appliedCustomer;

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans antialiased">
      {/* Header */}
      <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm backdrop-blur-md bg-white/80">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-slate-900 to-slate-700 text-white p-2.5 rounded-xl shadow-md">
              <span role="img" aria-label="motorbike" className="text-xl block leading-none">🏍️</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Ammar Autos</h1>
              <p className="text-xs text-slate-500 font-medium -mt-0.5">Comprehensive Reports</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-all duration-200 shadow-md"
            >
              <Download size={15} /> Download PDF
            </button>
            <button onClick={fetchReports} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all">
              <RefreshCw size={16} />
            </button>
            <button onClick={() => router.push("/dashboard")} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
              <ArrowLeft size={16} /> Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* Filter Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
            <CalendarRange size={14} /> Filters
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Date From</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Date To</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <User size={11} /> Customer / Buyer Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search customer..."
                  value={customerFilter}
                  onChange={e => setCustomerFilter(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleApplyCustomer()}
                  className="flex-1 px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <button onClick={handleApplyCustomer} className="px-3 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-700 transition-all">
                  <Search size={14} />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Report Type</label>
              <select value={selectedScenario} onChange={e => setSelectedScenario(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900">
                <option value="all">All Reports</option>
                <option value="sales">Sales Report</option>
                <option value="purchases">Purchases Report</option>
                <option value="registrations">Registrations Report</option>
              </select>
            </div>
          </div>
          {hasFilters && (
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-slate-500">
                Filters active{dateFrom && ` — from ${dateFrom}`}{dateTo && ` to ${dateTo}`}{appliedCustomer && ` — customer: "${appliedCustomer}"`}
              </p>
              <button onClick={handleClearFilters} className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors underline underline-offset-2">
                Clear All Filters
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-24 text-slate-400"><Loader2 size={36} className="animate-spin" /></div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Sales Revenue", value: fmt(filteredSummary.totalSalesValue), icon: TrendingUp, color: "from-emerald-500 to-teal-600", bg: "from-emerald-50 to-teal-50 border-emerald-200" },
                { label: "Total Purchase Cost", value: fmt(filteredSummary.totalPurchaseCost), icon: ShoppingCart, color: "from-blue-500 to-indigo-600", bg: "from-blue-50 to-indigo-50 border-blue-200" },
                { label: "Pending Installments", value: fmt(filteredSummary.totalInstallmentPending), icon: CreditCard, color: "from-rose-500 to-red-600", bg: "from-rose-50 to-red-50 border-rose-200" },
                { label: "Papers Recv'd / Pending", value: `${filteredSummary.completedPapers} / ${filteredSummary.pendingPapers}`, icon: FileText, color: "from-violet-500 to-purple-600", bg: "from-violet-50 to-purple-50 border-violet-200" },
              ].map((card) => (
                <div key={card.label} className={`p-5 bg-gradient-to-br ${card.bg} border rounded-2xl shadow-sm`}>
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3 shadow-md`}>
                    <card.icon size={16} className="text-white" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{card.label}</p>
                  <p className="text-xl font-bold text-slate-900 mt-1">{card.value}</p>
                </div>
              ))}
            </div>

            {/* Printable Section */}
            <div ref={printRef}>
              {/* PDF Header (only visible in print) */}
              <div className="header" style={{ display: "none" }}>
                <div>
                  <div style={{ fontSize: "26px", fontWeight: "800", color: "white" }}>🏍️ Ammar Autos</div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", marginTop: "4px" }}>Bike Showroom Management System</div>
                </div>
                <div style={{ textAlign: "right", fontSize: "12px", color: "rgba(255,255,255,0.8)" }}>
                  <div>Report Date: {new Date().toLocaleDateString("en-PK")}</div>
                  {dateFrom && <div>From: {dateFrom}</div>}
                  {dateTo && <div>To: {dateTo}</div>}
                  {appliedCustomer && <div>Customer: {appliedCustomer}</div>}
                </div>
              </div>

              {/* SALES */}
              {(selectedScenario === "all" || selectedScenario === "sales") && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-2">
                      <TrendingUp size={15} /> Sales & Installment Report
                      <span className="ml-2 text-xs font-normal text-slate-400">({filteredSales.length} records)</span>
                    </h3>
                    <span className="text-sm font-bold text-emerald-700">{fmt(filteredSummary.totalSalesValue)}</span>
                  </div>
                  <div className="overflow-x-auto">
                    {filteredSales.length === 0 ? (
                      <p className="text-xs text-slate-400 py-8 text-center">No sales records match the filters.</p>
                    ) : (
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-slate-800 text-white">
                            {["#", "Buyer", "Bike", "Sale Type", "Total Amount", "Advance", "Installments Paid", "Balance", "Sale Date"].map(h => (
                              <th key={h} className="px-4 py-3 text-left font-bold uppercase tracking-wider whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSales.map((s, i) => {
                            const balance = Math.max(0, Number(s.totalSaleAmount || 0) - Number(s.advanceReceived || 0) - Number(s.paidInstallments || 0));
                            return (
                              <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3 text-slate-400">{i + 1}</td>
                                <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{s.buyerName || "—"}</td>
                                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{[s.bikeCompany, s.bikeModel].filter(Boolean).join(" ") || "—"}</td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s.saleType === "installment" ? "bg-indigo-50 text-indigo-700" : "bg-emerald-50 text-emerald-700"}`}>
                                    {s.saleType || "cash"}
                                  </span>
                                </td>
                                <td className="px-4 py-3 font-bold text-slate-900">{fmt(s.totalSaleAmount)}</td>
                                <td className="px-4 py-3 text-emerald-700 font-semibold">{fmt(s.advanceReceived)}</td>
                                <td className="px-4 py-3 text-indigo-700 font-semibold">{fmt(s.paidInstallments)}</td>
                                <td className="px-4 py-3 text-rose-600 font-semibold">{fmt(balance)}</td>
                                <td className="px-4 py-3 text-slate-500">{fmtDate(s.saleDateTime)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {/* PURCHASES */}
              {(selectedScenario === "all" || selectedScenario === "purchases") && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">
                  <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-blue-700 flex items-center gap-2">
                      <ShoppingCart size={15} /> Purchase Cost Report
                      <span className="ml-2 text-xs font-normal text-slate-400">({filteredPurchases.length} records)</span>
                    </h3>
                    <span className="text-sm font-bold text-blue-700">{fmt(filteredSummary.totalPurchaseCost)}</span>
                  </div>
                  <div className="overflow-x-auto">
                    {filteredPurchases.length === 0 ? (
                      <p className="text-xs text-slate-400 py-8 text-center">No purchase records match the filters.</p>
                    ) : (
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-slate-800 text-white">
                            {["#", "Customer", "Category", "Bike", "CC", "Color", "Actual Amount", "Remaining", "Approval", "Purchase Date"].map(h => (
                              <th key={h} className="px-4 py-3 text-left font-bold uppercase tracking-wider whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPurchases.map((p, i) => (
                            <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3 text-slate-400">{i + 1}</td>
                              <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{p.customerName || "—"}</td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold capitalize">
                                  {(p.category || "").replace("_", " ")}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{[p.bikeCompany, p.bikeModel].filter(Boolean).join(" ") || "—"}</td>
                              <td className="px-4 py-3 text-slate-600">{p.bikeCC || "—"}</td>
                              <td className="px-4 py-3 text-slate-600">{p.bikeColor || "—"}</td>
                              <td className="px-4 py-3 font-bold text-emerald-700">{fmt(p.actualAmount)}</td>
                              <td className="px-4 py-3 text-rose-600 font-semibold">{fmt(p.amountRemaining)}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${p.approved ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                                  {p.approved ? "Approved" : "Pending"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-500">{fmtDate(p.purchaseDateTime)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {/* REGISTRATIONS */}
              {(selectedScenario === "all" || selectedScenario === "registrations") && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">
                  <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-violet-50 to-purple-50">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-violet-700 flex items-center gap-2">
                      <FileText size={15} /> Registration Status Report
                      <span className="ml-2 text-xs font-normal text-slate-400">({filteredRegistrations.length} records)</span>
                    </h3>
                    <span className="text-sm font-bold text-violet-700">
                      ✅ {filteredSummary.completedPapers} received &nbsp;|&nbsp; ⏳ {filteredSummary.pendingPapers} pending
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    {filteredRegistrations.length === 0 ? (
                      <p className="text-xs text-slate-400 py-8 text-center">No registration records match the filters.</p>
                    ) : (
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-slate-800 text-white">
                            {["#", "Bike", "Chasis No", "Reg No", "Agent", "Total Money", "Advance", "Paper Status", "Date"].map(h => (
                              <th key={h} className="px-4 py-3 text-left font-bold uppercase tracking-wider whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRegistrations.map((r, i) => (
                            <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3 text-slate-400">{i + 1}</td>
                              <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{[r.bikeCompany, r.bikeModel].filter(Boolean).join(" ") || "—"}</td>
                              <td className="px-4 py-3 text-slate-600">{r.chasisNo || "—"}</td>
                              <td className="px-4 py-3 text-slate-600">{r.registrationNo || "—"}</td>
                              <td className="px-4 py-3 text-slate-600">{r.agentLetter || "—"}</td>
                              <td className="px-4 py-3 font-semibold text-slate-800">{fmt(r.agentTotalMoney)}</td>
                              <td className="px-4 py-3 text-emerald-700 font-semibold">{fmt(r.agentAdvance)}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${r.paperReceived ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                                  {r.paperReceived ? "Received" : "Pending"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-500">{fmtDate(r.createdAt)}</td>
                            </tr>
                          ))}
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

      {/* Print styles — hidden from screen */}
      <style>{`
        @media print {
          body { background: white !important; }
          header, .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}
