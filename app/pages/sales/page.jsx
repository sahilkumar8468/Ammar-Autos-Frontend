"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Plus, X, Loader2, RefreshCw, Trash2, Pencil,
  Search, TrendingUp, Bike as BikeIcon, FileDown, ChevronLeft, ChevronRight
} from "lucide-react";
import { downloadSalePDF } from "@/app/lib/pdfUtils";

const URL = process.env.NEXT_PUBLIC_BASE_URL;

const CATEGORY_LABELS = {
  company: "Company Sale",
  dealer: "Dealer Sale",
  local_customer: "Local Customer Sale",
};

const emptyForm = {
  registrationNo: "",
  bikeCompany: "",
  bikeModel: "",
  chasisNo: "",
  engineNo: "",
  linkedPurchaseId: null,
  category: "local_customer",

  buyerName: "",
  buyerFatherName: "",
  buyerCnic: "",
  buyerCurrentAddress: "",
  buyerPermanentAddress: "",
  addressSameAsPermanent: false,
  buyerPhotos: [],

  salerName: "",
  salerNumber: "",
  salerCnic: "",
  salerAddress: "",
  salerPhotos: [],

  saleDateTime: "",
  totalSaleAmount: "",
  advanceReceived: "",
  saleType: "cash",
  installmentMonths: "",
  perMonthInstallment: "",
  installmentStartDate: "",
};

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const money = (n) => (n != null ? `Rs. ${Number(n).toLocaleString()}` : "—");

const formatDate = (value) => {
  if (!value) return "—";
  const d = value?.seconds ? new Date(value.seconds * 1000) : new Date(value);
  return isNaN(d) ? "—" : d.toLocaleDateString();
};

// Helper: extract seconds from a Firestore Timestamp (handles both {_seconds,_nanoseconds} and {seconds,nanoseconds} formats)
const extractTimestampSeconds = (ts) => {
  if (!ts || typeof ts !== "object") return null;
  return ts._seconds || ts.seconds || null;
};

// Helper: convert a Firestore Timestamp to an <input type="date"> value (YYYY-MM-DD)
const toDateInputValue = (ts) => {
  const secs = extractTimestampSeconds(ts);
  if (!secs) return "";
  return new Date(secs * 1000).toISOString().slice(0, 10);
};

// Helper: convert a Firestore Timestamp to an <input type="datetime-local"> value (YYYY-MM-DDTHH:MM)
const toDateTimeInputValue = (ts) => {
  if (!ts) return "";
  if (typeof ts === "string") return ts;
  const secs = extractTimestampSeconds(ts);
  if (!secs) return "";
  return new Date(secs * 1000).toISOString().slice(0, 16);
};

export default function SaleList() {
  const router = useRouter();
  const label = "Sale";

  const [sales, setSales] = useState([]);
  const [stats, setStats] = useState({ bikesSold: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [month, setMonth] = useState(""); // blank = show all, pick a month to filter

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 10;

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [regLookupStatus, setRegLookupStatus] = useState(null); // "found" | "afr" | "new" | "sold"

  const fetchSales = useCallback(async (overridePage) => {
    setLoading(true);
    setError("");
    try {
      const currentPage = overridePage !== undefined ? overridePage : page;
      const params = new URLSearchParams({ limit: PAGE_SIZE });
      params.set("page", currentPage);
      if (month) params.set("month", month);
      if (search.trim()) params.set("search", search.trim());

      const statsParams = new URLSearchParams();
      if (month) statsParams.set("month", month);

      const [salesRes, statsRes] = await Promise.all([
        fetch(`${URL}/sale?${params.toString()}`),
        fetch(`${URL}/sale/stats?${statsParams.toString()}`),
      ]);
      const salesData = await salesRes.json();
      const statsData = await statsRes.json();

      if (!salesRes.ok) throw new Error(salesData.message || "Failed to fetch");
      setSales(salesData.data || []);
      const count = salesData.totalCount || 0;
      setTotalCount(count);
      setTotalPages(salesData.totalPages || Math.ceil(count / PAGE_SIZE) || 1);
      if (statsRes.ok) setStats(statsData);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [month, search, page]);

  useEffect(() => {
    setPage(1);
  }, [month, search]);

  useEffect(() => {
    const t = setTimeout(fetchSales, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [fetchSales, search]);

  const openAdd = () => {
    setForm({ ...emptyForm, category: "local_customer" });
    setEditId(null);
    setFormError("");
    setRegLookupStatus(null);
    setShowForm(true);
  };

  const openEdit = (s) => {
    setForm({
      registrationNo: s.registrationNo || "",
      bikeCompany: s.bikeCompany || "",
      bikeModel: s.bikeModel || "",
      chasisNo: s.chasisNo || "",
      engineNo: s.engineNo || "",
      linkedPurchaseId: s.linkedPurchaseId || null,
      category: s.category || "local_customer",

      buyerName: s.buyerName || "",
      buyerFatherName: s.buyerFatherName || "",
      buyerCnic: s.buyerCnic || "",
      buyerCurrentAddress: s.buyerCurrentAddress || "",
      buyerPermanentAddress: s.buyerPermanentAddress || "",
      addressSameAsPermanent: s.addressSameAsPermanent || false,
      buyerPhotos: s.buyerPhotos || [],

      salerName: s.salerName || "",
      salerNumber: s.salerNumber || "",
      salerCnic: s.salerCnic || "",
      salerAddress: s.salerAddress || "",
      salerPhotos: s.salerPhotos || [],

      saleDateTime: toDateTimeInputValue(s.saleDateTime),
      totalSaleAmount: s.totalSaleAmount || "",
      advanceReceived: s.advanceReceived || "",
      saleType: s.saleType || "cash",
      installmentMonths: s.installmentMonths || "",
      perMonthInstallment: s.perMonthInstallment || "",
      installmentStartDate: toDateInputValue(s.installmentStartDate),
    });
    setEditId(s.id);
    setFormError("");
    setRegLookupStatus(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setFormError("");
    setForm(emptyForm);
    setEditId(null);
    setRegLookupStatus(null);
  };

  const update = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));
  const handleChange = (e) => update(e.target.name, e.target.value);

  const toggleSameAddress = (checked) => {
    setForm((prev) => ({
      ...prev,
      addressSameAsPermanent: checked,
      buyerPermanentAddress: checked ? prev.buyerCurrentAddress : prev.buyerPermanentAddress,
    }));
  };
  const updateCurrentAddress = (value) => {
    setForm((prev) => ({
      ...prev,
      buyerCurrentAddress: value,
      buyerPermanentAddress: prev.addressSameAsPermanent ? value : prev.buyerPermanentAddress,
    }));
  };

  const handleRegistrationBlur = async () => {
    const value = form.registrationNo.trim();
    if (!value) return;

    if (value.toUpperCase() === "AFR") {
      setRegLookupStatus("afr");
      update("linkedPurchaseId", null);
      update("category", "local_customer");
      return;
    }

    try {
      const res = await fetch(`${URL}/sale/lookup-bike/${encodeURIComponent(value)}`);
      const data = await res.json();

      if (!data.found) {
        setRegLookupStatus("new");
        update("linkedPurchaseId", null);
        update("category", "local_customer");
        return;
      }
      if (data.alreadySold) {
        setRegLookupStatus("sold");
        return;
      }

      setForm((prev) => ({
        ...prev,
        bikeCompany: data.data.bikeCompany,
        bikeModel: data.data.bikeModel,
        chasisNo: data.data.chasisNo,
        engineNo: data.data.engineNo,
        registrationNo: data.data.registrationNo,
        linkedPurchaseId: data.purchaseId,
        category: data.purchaseCategory || "local_customer",
      }));
      setRegLookupStatus("found");
    } catch (e) {
      console.error("Registration lookup failed:", e);
    }
  };

  const addPhoto = (field, file) => {
    if (!file) return;
    update(field, [...form[field], file]);
  };
  const removePhoto = (field, index) =>
    update(field, form[field].filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      // 1. Upload new photos first
      const uploadPendingPhotos = async (photos) => {
        const result = [];
        for (const photo of photos) {
          if (photo instanceof File) {
            const body = new FormData();
            body.append("photo", photo);
            const res = await fetch(`${URL}/upload`, { method: "POST", body });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || "Photo upload failed");
            result.push(data.url);
          } else {
            result.push(photo); // existing url
          }
        }
        return result;
      };

      const finalBuyerPhotos = await uploadPendingPhotos(form.buyerPhotos);
      const finalSalerPhotos = await uploadPendingPhotos(form.salerPhotos);

      const payload = {
        ...form,
        buyerPhotos: finalBuyerPhotos,
        salerPhotos: finalSalerPhotos,
      };

      const url = editId ? `${URL}/sale/${editId}` : `${URL}/sale`;
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save");
      closeForm();
      setPage(1);
      fetchSales(1);
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this sale record?")) return;
    try {
      const res = await fetch(`${URL}/sale/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setPage(1);
      fetchSales(1);
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans antialiased">
      {/* Header */}
      <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm backdrop-blur-md bg-white/80">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-md shadow-slate-900/10">
              <span role="img" aria-label="motorbike" className="text-xl block leading-none">🏍️</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Ammar Autos</h1>
              <p className="text-xs text-slate-500 font-medium -mt-0.5">{label}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchSales}
              className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors duration-200 p-2 rounded-xl hover:bg-slate-100"
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors duration-200"
            >
              <ArrowLeft size={16} />
              Back
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Section Heading + Add Button */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">{label} Records</h2>
            <div className="h-1 w-12 bg-slate-900 mt-2 rounded-full" />
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-slate-900 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-slate-700 transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            <Plus size={16} />
            Add Sale
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600"><BikeIcon size={22} /></div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Bikes Sold This Month</p>
              <p className="text-2xl font-bold text-slate-900">{stats.bikesSold ?? 0}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600"><TrendingUp size={22} /></div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Revenue This Month</p>
              <p className="text-2xl font-bold text-slate-900">{money(stats.revenue ?? 0)}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by bike no, chasis no, or customer CNIC"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all duration-200 bg-white"
            />
          </div>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all duration-200 bg-white"
          />
          {(search || month) && (
            <button
              onClick={() => { setSearch(""); setMonth(""); setPage(1); }}
              className="text-sm font-semibold text-slate-500 hover:text-slate-900 px-3"
            >
              Clear
            </button>
          )}
        </div>

        {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-400">
              <Loader2 size={28} className="animate-spin" />
            </div>
          ) : sales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
              <span className="text-4xl">🏍️</span>
              <p className="text-sm font-medium">No sales yet. Add your first sale.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {["#", "Reg. No", "Bike", "Buyer", "CNIC", "Type", "Amount", "Remaining", "Date", "Action"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sales.map((s, i) => (
                    <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150">
                      <td className="px-4 py-3 text-slate-400 font-medium">{(page - 1) * PAGE_SIZE + i + 1}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                        {s.registrationStatus === "AFR" ? "AFR" : s.registrationNo || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{[s.bikeCompany, s.bikeModel].filter(Boolean).join(" ") || "—"}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{s.buyerName || "—"}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{s.buyerCnic || "—"}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap capitalize">{s.saleType || "—"}</td>
                      <td className="px-4 py-3 text-emerald-700 font-semibold whitespace-nowrap">{money(s.totalSaleAmount)}</td>
                      <td className="px-4 py-3 font-semibold whitespace-nowrap">
                        {s.amountRemaining > 0
                          ? <span className="text-rose-600">{money(s.amountRemaining)}</span>
                          : <span className="text-emerald-600">Paid</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(s.saleDateTime)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(s)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200" title="Edit">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDelete(s.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200" title="Delete">
                            <Trash2 size={14} />
                          </button>
                          <button onClick={() => downloadSalePDF(s)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200" title="Download PDF">
                            <FileDown size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200">
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
                  <button key={item} onClick={() => setPage(item)} className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all duration-200 ${page === item ? "bg-slate-900 text-white shadow-md" : "border border-slate-200 text-slate-600 hover:bg-slate-100"}`}>
                    {item}
                  </button>
                )
              )}
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200">
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Record count summary */}
        {totalCount > 0 && (
          <p className="text-center text-xs text-slate-400 mt-2">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)} of {totalCount} records
          </p>
        )}
      </main>

      {/* Add / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">{editId ? "Edit" : "Add"} {label}</h2>
              <button onClick={closeForm} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all duration-200">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">
              {/* Registration lookup */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Registration No. (or type AFR) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="registrationNo"
                  value={form.registrationNo}
                  onChange={handleChange}
                  onBlur={handleRegistrationBlur}
                  required
                  placeholder="e.g. LEA-1234 or AFR"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all duration-200 bg-slate-50 hover:bg-white"
                />
                {regLookupStatus === "found" && <p className="text-xs text-emerald-600 mt-1.5 font-medium">Matched an existing purchase — bike details auto-filled.</p>}
                {regLookupStatus === "afr" && <p className="text-xs text-amber-600 mt-1.5 font-medium">Applied For Registration — treated as a new, unregistered bike.</p>}
                {regLookupStatus === "new" && <p className="text-xs text-slate-400 mt-1.5 font-medium">No matching purchase found — enter bike details manually.</p>}
                {regLookupStatus === "sold" && <p className="text-xs text-red-600 mt-1.5 font-medium">This bike is already recorded as sold.</p>}
              </div>

              {/* Bike details */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Bike Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { name: "bikeCompany", label: "Bike Company" },
                    { name: "bikeModel", label: "Bike Model" },
                    { name: "chasisNo", label: "Chasis No." },
                    { name: "engineNo", label: "Engine No." },
                  ].map((f) => (
                    <div key={f.name}>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{f.label}</label>
                      <input
                        type="text" name={f.name} value={form[f.name]} onChange={handleChange}
                        placeholder={`Enter ${f.label.toLowerCase()}`}
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all duration-200 bg-slate-50 hover:bg-white"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Buyer */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Buyer Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { name: "buyerName", label: "Buyer Name", required: true },
                    { name: "buyerFatherName", label: "Father's Name" },
                    { name: "buyerCnic", label: "CNIC Number", required: true },
                  ].map((f) => (
                    <div key={f.name}>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        {f.label} {f.required && <span className="text-red-400">*</span>}
                      </label>
                      <input
                        type="text" name={f.name} value={form[f.name]} onChange={handleChange} required={f.required}
                        placeholder={`Enter ${f.label.toLowerCase()}`}
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all duration-200 bg-slate-50 hover:bg-white"
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Current Address</label>
                  <textarea
                    value={form.buyerCurrentAddress}
                    onChange={(e) => updateCurrentAddress(e.target.value)}
                    rows={2}
                    placeholder="Enter current address"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all duration-200 bg-slate-50 hover:bg-white resize-none"
                  />
                </div>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 mt-3">
                  <input
                    type="checkbox"
                    checked={form.addressSameAsPermanent}
                    onChange={(e) => toggleSameAddress(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  Permanent address is the same as current address
                </label>

                {!form.addressSameAsPermanent && (
                  <div className="mt-3">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Permanent Address</label>
                    <textarea
                      name="buyerPermanentAddress"
                      value={form.buyerPermanentAddress}
                      onChange={handleChange}
                      rows={2}
                      placeholder="Enter permanent address"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all duration-200 bg-slate-50 hover:bg-white resize-none"
                    />
                  </div>
                )}

                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Buyer Photos</label>
                    <label className="text-xs font-semibold text-blue-600 cursor-pointer hover:underline">
                      + Add Photo
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => addPhoto("buyerPhotos", e.target.files[0])} />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {form.buyerPhotos.map((photo, idx) => {
                      const src = typeof photo === "string" ? photo : (typeof URL !== "undefined" && URL.createObjectURL ? URL.createObjectURL(photo) : "");
                      return (
                      <div key={idx} className="relative w-16 h-16">
                        <img src={src} alt="" className="w-16 h-16 object-cover rounded-xl border border-slate-200" />
                        <button type="button" onClick={() => removePhoto("buyerPhotos", idx)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs">×</button>
                      </div>
                    )})}
                  </div>
                </div>
              </div>

              {/* Saler */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Saler Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { name: "salerName", label: "Saler Name" },
                    { name: "salerNumber", label: "Saler Number" },
                    { name: "salerCnic", label: "Saler CNIC" },
                  ].map((f) => (
                    <div key={f.name}>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{f.label}</label>
                      <input
                        type="text" name={f.name} value={form[f.name]} onChange={handleChange}
                        placeholder={`Enter ${f.label.toLowerCase()}`}
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all duration-200 bg-slate-50 hover:bg-white"
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Saler Address</label>
                  <textarea
                    name="salerAddress" value={form.salerAddress} onChange={handleChange} rows={2}
                    placeholder="Enter saler address"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all duration-200 bg-slate-50 hover:bg-white resize-none"
                  />
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Saler Photo</label>
                    <label className="text-xs font-semibold text-blue-600 cursor-pointer hover:underline">
                      + Add Photo
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => addPhoto("salerPhotos", e.target.files[0])} />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {form.salerPhotos.map((photo, idx) => {
                      const src = typeof photo === "string" ? photo : (typeof URL !== "undefined" && URL.createObjectURL ? URL.createObjectURL(photo) : "");
                      return (
                      <div key={idx} className="relative w-16 h-16">
                        <img src={src} alt="" className="w-16 h-16 object-cover rounded-xl border border-slate-200" />
                        <button type="button" onClick={() => removePhoto("salerPhotos", idx)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs">×</button>
                      </div>
                    )})}
                  </div>
                </div>
              </div>

              {/* Sale terms */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Sale Terms</p>

                <div className="mb-4">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Sale Date &amp; Time</label>
                  <input
                    type="datetime-local" name="saleDateTime" value={form.saleDateTime} onChange={handleChange}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all duration-200 bg-slate-50 hover:bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Total Sale Amount (Rs.) <span className="text-red-400">*</span></label>
                    <input
                      type="number" name="totalSaleAmount" value={form.totalSaleAmount} onChange={handleChange} required
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all duration-200 bg-slate-50 hover:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Advance Received (Rs.)</label>
                    <input
                      type="number" name="advanceReceived" value={form.advanceReceived} onChange={handleChange}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all duration-200 bg-slate-50 hover:bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-5 mb-4">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <input type="radio" name="saleType" checked={form.saleType === "cash"} onChange={() => update("saleType", "cash")} />
                    Cash
                  </label>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <input type="radio" name="saleType" checked={form.saleType === "installment"} onChange={() => update("saleType", "installment")} />
                    Installment
                  </label>
                </div>

                {form.saleType === "installment" && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Months</label>
                      <input
                        type="number" name="installmentMonths" value={form.installmentMonths} onChange={handleChange}
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all duration-200 bg-slate-50 hover:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Per-Month (Rs.)</label>
                      <input
                        type="number" name="perMonthInstallment" value={form.perMonthInstallment} onChange={handleChange}
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all duration-200 bg-slate-50 hover:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Start Date</label>
                      <input
                        type="date" name="installmentStartDate" value={form.installmentStartDate} onChange={handleChange}
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all duration-200 bg-slate-50 hover:bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {formError && <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{formError}</p>}

              <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-slate-700 transition-all duration-200 disabled:opacity-60">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  {submitting ? "Saving..." : editId ? "Update" : "Save Sale"}
                </button>
                <button type="button" onClick={closeForm}
                  className="flex-1 text-sm font-semibold py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all duration-200">
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