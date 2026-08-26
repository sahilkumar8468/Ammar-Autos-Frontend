"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Search, Banknote, Loader2, RefreshCw,
  AlertCircle, PhoneCall, FileDown, CalendarClock, Bell, X, CheckCircle2
} from "lucide-react";
import { downloadSalePDF } from "@/app/lib/pdfUtils";
import MobileBottomNav from "@/app/components/MobileBottomNav";
import Footer from "@/app/components/Footer";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

function money(n) {
  return `Rs. ${Number(n || 0).toLocaleString()}`;
}

function fmtDate(val) {
  if (!val) return "—";
  const d = new Date(val);
  return isNaN(d) ? "—" : d.toLocaleDateString("en-PK");
}

/* ─── PDF for installment record ─────────────────────────────── */
function downloadInstallmentPDF(c) {
  const win = window.open("", "_blank", "width=860,height=700");
  const histRows = (c.installmentHistory || [])
    .map((h, i) => `<tr style="border-bottom:1px solid #f1f5f9;">
      <td style="padding:8px 12px;font-size:12px;color:#64748b;">${i + 1}</td>
      <td style="padding:8px 12px;font-size:12px;font-weight:600;color:#059669;">${money(h.amount)}</td>
      <td style="padding:8px 12px;font-size:12px;color:#1e293b;">${fmtDate(h.date)}</td>
      <td style="padding:8px 12px;font-size:12px;color:#64748b;">${h.notes || "—"}</td>
    </tr>`).join("");

  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/>
    <title>Installment Report — ${c.name}</title>
    <style>*{box-sizing:border-box;margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;}
    body{background:#fff;padding:28px;color:#1e293b;}
    @media print{.no-print{display:none!important;}}</style></head><body>
  <div class="no-print" style="text-align:right;margin-bottom:16px;">
    <button onclick="window.print()" style="padding:8px 20px;background:#0f172a;color:white;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;">🖨️ Print / Save PDF</button>
  </div>
  <div style="background:linear-gradient(135deg,#0f172a,#1e3a5f);color:white;padding:24px 28px;border-radius:14px;margin-bottom:22px;display:flex;justify-content:space-between;align-items:center;">
    <div>
      <div style="font-size:22px;font-weight:800;">🏍️ Ammar Autos</div>
      <div style="font-size:11px;opacity:.7;margin-top:4px;">Bike Showroom Management System</div>
      <div style="margin-top:8px;display:inline-block;background:rgba(255,255,255,.15);padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;">Installment Payment Report</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:10px;opacity:.7;">Printed</div>
      <div style="font-size:14px;font-weight:700;">${new Date().toLocaleDateString("en-PK")}</div>
    </div>
  </div>
  <div style="margin-bottom:18px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;display:grid;grid-template-columns:1fr 1fr;gap:10px;">
    <div><span style="font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:.05em;">Customer</span><div style="font-size:15px;font-weight:800;color:#1e293b;margin-top:2px;">${c.name}</div></div>
    <div><span style="font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:.05em;">CNIC</span><div style="font-size:13px;font-weight:600;color:#1e293b;margin-top:2px;">${c.cnic}</div></div>
    <div><span style="font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:.05em;">Bike</span><div style="font-size:13px;font-weight:600;color:#1e293b;margin-top:2px;">${c.bike}</div></div>
    <div><span style="font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:.05em;">Reg No</span><div style="font-size:13px;font-weight:600;color:#1e293b;margin-top:2px;">${c.registrationNo}</div></div>
    <div><span style="font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:.05em;">Engine No</span><div style="font-size:13px;font-weight:600;color:#1e293b;margin-top:2px;">${c.engineNo}</div></div>
    <div><span style="font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:.05em;">Chasis No</span><div style="font-size:13px;font-weight:600;color:#1e293b;margin-top:2px;">${c.chasisNo}</div></div>
    <div><span style="font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:.05em;">Total Price</span><div style="font-size:13px;font-weight:700;color:#059669;margin-top:2px;">${money(c.totalSaleAmount)}</div></div>
    <div><span style="font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:.05em;">Remaining</span><div style="font-size:13px;font-weight:700;color:${c.remainingBalance > 0 ? "#dc2626" : "#059669"};margin-top:2px;">${c.remainingBalance > 0 ? money(c.remainingBalance) : "FULLY PAID"}</div></div>
    <div><span style="font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:.05em;">Monthly</span><div style="font-size:13px;font-weight:600;color:#1e293b;margin-top:2px;">${money(c.perMonthInstallment)}</div></div>
    <div><span style="font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:.05em;">Months</span><div style="font-size:13px;font-weight:600;color:#1e293b;margin-top:2px;">${c.installmentMonths} months</div></div>
  </div>
  <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#64748b;margin-bottom:10px;">Payment History</div>
  <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
    <thead><tr style="background:#f8fafc;">
      <th style="padding:10px 12px;text-align:left;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;">#</th>
      <th style="padding:10px 12px;text-align:left;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;">Amount</th>
      <th style="padding:10px 12px;text-align:left;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;">Date</th>
      <th style="padding:10px 12px;text-align:left;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;">Notes</th>
    </tr></thead>
    <tbody>${histRows || `<tr><td colspan="4" style="text-align:center;padding:20px;color:#94a3b8;font-size:12px;">No payments recorded yet.</td></tr>`}</tbody>
  </table>
  <div style="margin-top:24px;padding-top:12px;border-top:1px solid #e2e8f0;text-align:center;font-size:11px;color:#94a3b8;">
    Generated by Ammar Autos — ${new Date().toLocaleDateString("en-PK", { year: "numeric", month: "long", day: "numeric" })}
  </div>
</body></html>`);
  win.document.close();
}

export default function PaymentDashboard() {
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [installmentAmount, setInstallmentAmount] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/customer`);
      const data = await res.json();
      if (res.ok) setCustomers(data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, []);

  // Filter customers based on search
  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase().trim();
    return customers.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.cnic?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) ||
      c.bike?.toLowerCase().includes(q) ||
      c.registrationNo?.toLowerCase().includes(q) ||
      c.chasisNo?.toLowerCase().includes(q) ||
      c.engineNo?.toLowerCase().includes(q)
    );
  }, [customers, search]);

  // Upcoming installments (due within 7 days and not overdue)
  const upcomingAlerts = useMemo(() =>
    customers.filter(c => !c.isOverdue && c.daysUntilNextDue >= 0 && c.daysUntilNextDue <= 7 && c.remainingBalance > 0),
    [customers]
  );

  // Overdue customers
  const overdueCustomers = useMemo(() =>
    customers.filter(c => c.isOverdue && c.remainingBalance > 0),
    [customers]
  );

  const handlePayInstallment = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${BASE_URL}/customer/pay-installment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          saleId: selectedCustomer.id,
          amountPaid: Number(installmentAmount),
          notes: paymentNotes || "Monthly installment paid",
          paymentDate: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        closeModal();
        fetchCustomers();
      }
    } catch (e) {
      alert("Payment failed");
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setSelectedCustomer(null);
    setInstallmentAmount("");
    setPaymentNotes("");
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans antialiased">
      {/* Header */}
      <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 text-white p-2.5 rounded-xl shadow-md">
              <Banknote size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Ammar Autos</h1>
              <p className="text-xs text-slate-500 font-medium -mt-0.5">Installment Payments Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Bell icon with overdue count */}
            {(overdueCustomers.length + upcomingAlerts.length) > 0 && (
              <div className="relative">
                <Bell size={22} className="text-rose-500" />
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {overdueCustomers.length + upcomingAlerts.length}
                </span>
              </div>
            )}
            <button onClick={fetchCustomers} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors">
              <RefreshCw size={16} />
            </button>
            <button onClick={() => router.push("/dashboard")} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
              <ArrowLeft size={16} /> Back
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* ── UPCOMING ALERTS (7-day warning) ── */}
        {upcomingAlerts.filter(c => !dismissedAlerts.has(c.id + "_upcoming")).length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Bell size={18} className="text-amber-600" />
              <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wider">Upcoming Due — Next 7 Days</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {upcomingAlerts.filter(c => !dismissedAlerts.has(c.id + "_upcoming")).map((c) => (
                <div key={c.id} className="bg-white border border-amber-100 rounded-xl p-3 flex items-start justify-between gap-2 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-100 text-amber-600 rounded-lg shrink-0">
                      <CalendarClock size={15} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{c.name}</p>
                      <p className="text-xs text-slate-500">{c.bike}</p>
                      <p className="text-xs text-amber-700 font-semibold mt-1">
                        Due in {c.daysUntilNextDue} day{c.daysUntilNextDue !== 1 ? "s" : ""} — {money(c.perMonthInstallment)}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setDismissedAlerts(s => new Set([...s, c.id + "_upcoming"]))} className="text-slate-300 hover:text-slate-500 shrink-0">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── OVERDUE ALERTS ── */}
        {overdueCustomers.filter(c => !dismissedAlerts.has(c.id + "_overdue")).length > 0 && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle size={18} className="text-rose-600" />
              <h3 className="text-sm font-bold text-rose-800 uppercase tracking-wider">Overdue — Call Customers Immediately</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {overdueCustomers.filter(c => !dismissedAlerts.has(c.id + "_overdue")).map((c) => (
                <div key={c.id} className="bg-white border border-rose-100 rounded-xl p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-rose-100 text-rose-600 rounded-lg shrink-0">
                        <PhoneCall size={15} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-rose-900">{c.name}</p>
                        <p className="text-xs font-semibold text-slate-500">📞 {c.phone}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{c.bike} | Reg: {c.registrationNo}</p>
                        <p className="text-xs text-slate-500">Engine: {c.engineNo} | Chasis: {c.chasisNo}</p>
                        <p className="text-xs text-rose-700 font-bold mt-1.5">
                          {c.overdueMonths} month{c.overdueMonths !== 1 ? "s" : ""} overdue — Remaining: {money(c.remainingBalance)}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => setDismissedAlerts(s => new Set([...s, c.id + "_overdue"]))} className="text-slate-300 hover:text-slate-500 shrink-0">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SEARCH ── */}
        <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, CNIC, engine no, chasis no, registration no, bike..."
            className="w-full text-sm bg-transparent outline-none"
          />
          {search && <button onClick={() => setSearch("")} className="text-slate-300 hover:text-slate-500"><X size={16} /></button>}
        </div>

        {/* ── SUMMARY STATS ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Buyers", value: customers.length, color: "blue" },
            { label: "Overdue", value: overdueCustomers.length, color: "rose" },
            { label: "Due This Week", value: upcomingAlerts.length, color: "amber" },
            { label: "Fully Paid", value: customers.filter(c => c.remainingBalance <= 0).length, color: "emerald" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
              <p className={`text-3xl font-black mt-1 text-${s.color}-600`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── CARDS ── */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Installment Accounts ({filtered.length})</h2>
              <div className="h-1 w-12 bg-slate-900 mt-2 rounded-full" />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-slate-400" /></div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
              <Banknote size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-semibold text-slate-500">No installment customers found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((c) => {
                const isPaidOff = c.remainingBalance <= 0;
                const cardBg = c.isOverdue
                  ? "border-rose-300 bg-rose-50 shadow-rose-100"
                  : isPaidOff
                    ? "border-emerald-200 bg-emerald-50 shadow-emerald-100"
                    : "border-slate-200 bg-white hover:border-slate-300";

                const totalPaid = Number(c.advanceReceived || 0) + Number(c.paidInstallments || 0);
                const progress = c.totalSaleAmount > 0 ? Math.min(100, Math.round((totalPaid / c.totalSaleAmount) * 100)) : 0;

                return (
                  <div key={c.id} className={`rounded-2xl border p-5 transition-all duration-200 shadow-sm flex flex-col ${cardBg}`}>
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          {isPaidOff && <CheckCircle2 size={14} className="text-emerald-500" />}
                          {c.isOverdue && <AlertCircle size={14} className="text-rose-500" />}
                          <h3 className={`text-base font-bold ${c.isOverdue ? "text-rose-900" : "text-slate-900"}`}>{c.name}</h3>
                        </div>
                        <p className={`text-xs font-semibold ${c.isOverdue ? "text-rose-500" : "text-slate-400"}`}>
                          📞 {c.phone} &nbsp;|&nbsp; {c.cnic}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => downloadInstallmentPDF(c)} className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title="Download PDF">
                          <FileDown size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Bike details */}
                    <div className="space-y-2 flex-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Bike</span>
                        <span className="font-bold text-slate-800 text-right">{c.bike}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Reg No</span>
                        <span className="font-semibold text-slate-700">{c.registrationNo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Engine</span>
                        <span className="font-semibold text-slate-600 text-xs">{c.engineNo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Chasis</span>
                        <span className="font-semibold text-slate-600 text-xs">{c.chasisNo}</span>
                      </div>

                      <div className="my-2 border-t border-dashed border-slate-200" />

                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Total</span>
                        <span className="font-bold text-slate-800">{money(c.totalSaleAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Paid</span>
                        <span className="font-bold text-emerald-600">{money(totalPaid)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`font-medium ${c.isOverdue ? "text-rose-500" : "text-slate-400"}`}>Remaining</span>
                        <span className={`font-bold ${c.isOverdue ? "text-rose-700" : "text-slate-800"}`}>{money(c.remainingBalance)}</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="my-4">
                      <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${isPaidOff ? "bg-emerald-500" : c.isOverdue ? "bg-rose-500" : "bg-blue-500"}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Monthly</span>
                        <span className="text-sm font-bold text-slate-800">{money(c.perMonthInstallment)}</span>
                      </div>
                      {isPaidOff ? (
                        <div className="px-4 py-2 bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl uppercase tracking-wider">✓ Fully Paid</div>
                      ) : (
                        <button
                          onClick={() => { setSelectedCustomer(c); setInstallmentAmount(String(c.perMonthInstallment || "")); }}
                          className={`px-4 py-2 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2 ${c.isOverdue
                            ? "bg-rose-600 text-white hover:bg-rose-700 shadow-rose-200"
                            : "bg-slate-900 text-white hover:bg-slate-800"
                            }`}
                        >
                          <CalendarClock size={13} /> Pay
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
      <MobileBottomNav />

      {/* ── PAY MODAL ── */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className={`px-6 py-5 border-b ${selectedCustomer.isOverdue ? "bg-rose-50 border-rose-100" : "bg-slate-50 border-slate-200"}`}>
              <h2 className={`text-lg font-bold ${selectedCustomer.isOverdue ? "text-rose-900" : "text-slate-900"}`}>
                Pay Installment
              </h2>
              <p className="text-xs font-semibold text-slate-500 mt-1">
                {selectedCustomer.name} — {selectedCustomer.bike}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Remaining: <span className="font-bold text-rose-600">{money(selectedCustomer.remainingBalance)}</span>
                &nbsp; | Monthly: {money(selectedCustomer.perMonthInstallment)}
              </p>
            </div>
            <form onSubmit={handlePayInstallment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Amount (Rs.)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 font-bold text-sm">Rs.</span>
                  <input
                    type="number"
                    value={installmentAmount}
                    onChange={(e) => setInstallmentAmount(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 text-sm font-semibold border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Notes (Optional)</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. July installment"
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={submitting}
                  className="flex-1 bg-slate-900 text-white font-bold text-sm rounded-xl py-3 hover:bg-slate-800 flex justify-center items-center gap-2">
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  Confirm Payment
                </button>
                <button type="button" onClick={closeModal}
                  className="flex-1 bg-slate-100 text-slate-600 font-bold text-sm rounded-xl py-3 hover:bg-slate-200">
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
