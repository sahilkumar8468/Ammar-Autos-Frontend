"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Plus, X, Loader2, RefreshCw, Trash2, Pencil, Check, Search, ChevronLeft, ChevronRight, FileDown, Eye } from "lucide-react";
import { downloadPurchasePDF } from "@/app/lib/pdfUtils";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

const emptyForm = {
  customerName: "",
  customerFatherName: "",
  customerNo: "",
  purchaseDate: "",
  currentAddress: "",
  permanentAddress: "",
  cnicNumber: "",
  actualAmount: "",
  amountRemaining: "",
  additionalExpense: "",
  bikeCompany: "",
  bikeModel: "",
  bikeCC: "",
  bikeColor: "",
  registrationNo: "",
  chasisNo: "",
  engineNo: "",
  documents: [],
};

const PAGE_SIZE = 10;

const formatDateTime = (value) => {
  if (!value) return "—";
  let d;
  if (typeof value === "object") {
    if (typeof value.toDate === "function") {
      d = value.toDate();
    } else {
      const secs = value._seconds ?? value.seconds;
      if (typeof secs === "number") d = new Date(secs * 1000);
    }
  }
  if (!d) d = new Date(value);
  if (isNaN(d)) return "—";

  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString("en-GB", { month: "short" }).toUpperCase();
  const year = d.getFullYear();
  const minute = String(d.getMinutes()).padStart(2, "0");
  const isPm = d.getHours() >= 12;
  const hour12 = d.getHours() % 12 || 12;

  return `${day}/${month}/${year} ${hour12}:${minute}${isPm ? "PM" : "AM"}`;
};

const toDateTimeInputValue = (value) => {
  if (!value) return "";
  let d;
  if (typeof value === "object" && value !== null) {
    if (typeof value.toDate === "function") {
      d = value.toDate();
    } else {
      const secs = value._seconds ?? value.seconds;
      if (typeof secs === "number") d = new Date(secs * 1000);
    }
  }
  if (!d) d = new Date(value);
  if (isNaN(d.getTime())) return "";

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const getTodayMaxDateTime = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}T23:59`;
};

export default function CompanyPurchase({ goBack }) {

  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [approvingId, setApprovingId] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [searchEngine, setSearchEngine] = useState("");
  const [searchChasis, setSearchChasis] = useState("");
  const [searchCustomer, setSearchCustomer] = useState("");
  const [appliedEngine, setAppliedEngine] = useState("");
  const [appliedChasis, setAppliedChasis] = useState("");
  const [appliedCustomer, setAppliedCustomer] = useState("");

  const fetchPurchases = useCallback(async (overridePage) => {
    setLoading(true);
    setError("");
    try {
      const currentPage = overridePage !== undefined ? overridePage : page;
      const qs = new URLSearchParams({
        category: "company",
        page: currentPage,
        limit: PAGE_SIZE,
      });
      if (appliedEngine) qs.set("engineNo", appliedEngine);
      if (appliedChasis) qs.set("chasisNo", appliedChasis);
      if (appliedCustomer) qs.set("customerName", appliedCustomer);

      const res = await fetch(`${BASE_URL}/purchase?${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch");
      setPurchases(data.data || []);
      setTotalCount(data.totalCount || 0);
      const tp = Math.ceil((data.totalCount || 0) / PAGE_SIZE) || 1;
      setTotalPages(tp);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, appliedEngine, appliedChasis, appliedCustomer]);

  useEffect(() => { fetchPurchases(); }, [fetchPurchases]);

  const handleSearch = () => {
    setAppliedEngine(searchEngine);
    setAppliedChasis(searchChasis);
    setAppliedCustomer(searchCustomer);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchEngine(""); setSearchChasis(""); setSearchCustomer("");
    setAppliedEngine(""); setAppliedChasis(""); setAppliedCustomer("");
    setPage(1);
  };

  const goToPage = (p) => { setPage(p); };

  useEffect(() => {
    if (showForm) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [showForm]);

  const openAdd = () => { setForm({ ...emptyForm, purchaseDate: toDateTimeInputValue(new Date()) }); setEditId(null); setIsViewOnly(false); setFormError(""); setShowForm(true); };
  const openEdit = (p) => {
    setForm({
      customerName: p.customerName || "",
      customerFatherName: p.customerFatherName || "",
      customerNo: p.customerNo || "",
      purchaseDate: toDateTimeInputValue(p.purchaseDateTime || p.purchaseDate),
      currentAddress: p.currentAddress || "",
      permanentAddress: p.permanentAddress || "",
      cnicNumber: p.cnicNumber || "",
      actualAmount: p.actualAmount !== undefined ? p.actualAmount : "",
      amountRemaining: p.amountRemaining !== undefined ? p.amountRemaining : "",
      additionalExpense: p.additionalExpense !== undefined ? p.additionalExpense : "",
      bikeCompany: p.bikeCompany || "",
      bikeModel: p.bikeModel || "",
      bikeCC: p.bikeCC || "",
      bikeColor: p.bikeColor || "",
      registrationNo: p.registrationNo || "",
      chasisNo: p.chasisNo || "",
      engineNo: p.engineNo || "",
      documents: p.documents || [],
    });
    setEditId(p.id);
    setIsViewOnly(false);
    setFormError("");
    setShowForm(true);
  };
  const openView = (p) => {
    openEdit(p);
    setIsViewOnly(true);
  };
  const closeForm = () => { setShowForm(false); setFormError(""); setForm(emptyForm); setEditId(null); setIsViewOnly(false); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isViewOnly) return;
    if (form.purchaseDate) {
      const selected = new Date(form.purchaseDate);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      if (selected > endOfToday) {
        setFormError("Future dates cannot be selected for purchase date & time. Please select today or a past date.");
        return;
      }
    }
    setSubmitting(true);
    setFormError("");
    try {
      const url = editId ? `${BASE_URL}/purchase/${editId}` : `${BASE_URL}/purchase`;
      const method = editId ? "PUT" : "POST";
      const payload = {
        ...form,
        category: "company",
        bikeCC: form.bikeCC,
        bikeColor: form.bikeColor,
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      closeForm();
      fetchPurchases(page);
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this record?")) return;
    try {
      const res = await fetch(`${BASE_URL}/purchase/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      fetchPurchases(page);
    } catch (e) { alert(e.message); }
  };

  const handleApprove = async (id) => {
    setApprovingId(id);
    try {
      const res = await fetch(`${BASE_URL}/purchase/${id}/approve`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to approve");
      fetchPurchases(page);
    } catch (e) {
      alert(e.message);
    } finally {
      setApprovingId(null);
    }
  };

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const addPhoto = async (field, file) => {
    if (!file) return;
    const body = new FormData();
    body.append("photo", file);
    try {
      const res = await fetch(`${BASE_URL}/upload`, { method: "POST", body });
      const data = await res.json();
      if (data.success) setForm(prev => ({ ...prev, [field]: [...prev[field], data.url] }));
    } catch (e) {
      console.error("Upload failed:", e);
    }
  };
  
  const removePhoto = (field, index) =>
    setForm(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));

  const startItem = (page - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(page * PAGE_SIZE, totalCount);

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
              <p className="text-xs text-slate-500 font-medium -mt-0.5">Company purchase</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => fetchPurchases(page)} className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all duration-200" title="Refresh">
              <RefreshCw size={16} />
            </button>
            <button onClick={goBack} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors duration-200">
              <ArrowLeft size={16} /> Back
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Company Purchase Records</h2>
            <div className="h-1 w-12 bg-slate-900 mt-2 rounded-full" />
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 bg-slate-900 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-slate-700 transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5">
            <Plus size={16} /> Add Purchase
          </button>
        </div>

        {/* Filter Bar */}
        <div className="mb-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <Search size={14} className="text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search customer name..."
                value={searchCustomer}
                onChange={e => setSearchCustomer(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                className="w-full text-sm bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
              />
            </div>
            <div className="flex items-center gap-2 flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <Search size={14} className="text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search engine no..."
                value={searchEngine}
                onChange={e => setSearchEngine(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                className="w-full text-sm bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
              />
            </div>
            <div className="flex items-center gap-2 flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <Search size={14} className="text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search chasis no..."
                value={searchChasis}
                onChange={e => setSearchChasis(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                className="w-full text-sm bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleSearch} className="px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition-all duration-200 whitespace-nowrap">Search</button>
              {(appliedEngine || appliedChasis || appliedCustomer) && (
                <button onClick={handleClearFilters} className="px-4 py-2 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-all duration-200 whitespace-nowrap">Clear</button>
              )}
            </div>
          </div>
          {totalCount > 0 && (
            <p className="text-xs text-slate-400 mt-2">Showing {startItem}–{endItem} of {totalCount} records</p>
          )}
        </div>

        {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-400"><Loader2 size={28} className="animate-spin" /></div>
          ) : purchases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
              <span className="text-4xl">📋</span>
              <p className="text-sm font-medium">No records found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {["#", "Customer Name", "Father Name", "CNIC", "Phone", "Bike", "CC", "Color", "Reg. No", "Chasis No", "Engine No", "Actual Amount", "Remaining", "Extra Expense", "Date", "Approval", "Actions"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((p, i) => {
                    const unapproved = !p.approved;
                    const idCellClass = `px-4 py-3 text-slate-600 whitespace-nowrap ${unapproved ? "bg-red-50" : ""}`;
                    return (
                      <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150">
                        <td className="px-4 py-3 text-slate-400 font-medium">{(page - 1) * PAGE_SIZE + i + 1}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{p.customerName || "—"}</td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{p.customerFatherName || "—"}</td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{p.cnicNumber || "—"}</td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{p.customerNo || "—"}</td>
                        <td className={idCellClass}>{[p.bikeCompany, p.bikeModel].filter(Boolean).join(" ") || "—"}</td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{p.bikeCC || "—"}</td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{p.bikeColor || "—"}</td>
                        <td className={idCellClass}>{p.registrationStatus === "AFR" ? "AFR" : (p.registrationNo || "—")}</td>
                        <td className={idCellClass}>{p.chasisStatus === "AFR" ? "AFR" : (p.chasisNo || "—")}</td>
                        <td className={idCellClass}>{p.engineStatus === "AFR" ? "AFR" : (p.engineNo || "—")}</td>
                        <td className="px-4 py-3 text-emerald-700 font-semibold whitespace-nowrap">{p.actualAmount != null ? `Rs. ${Number(p.actualAmount).toLocaleString()}` : "—"}</td>
                        <td className="px-4 py-3 text-rose-600 font-semibold whitespace-nowrap">{p.amountRemaining != null ? `Rs. ${Number(p.amountRemaining).toLocaleString()}` : "—"}</td>
                        <td className="px-4 py-3 text-amber-600 whitespace-nowrap">{p.additionalExpense != null ? `Rs. ${Number(p.additionalExpense).toLocaleString()}` : "—"}</td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDateTime(p.purchaseDateTime || p.purchaseDate)}</td>
                        <td className="px-4 py-3">
                          {p.approved ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500 text-white" title="Approved — letter received">
                              <Check size={14} />
                            </span>
                          ) : (
                            <button
                              onClick={() => handleApprove(p.id)}
                              disabled={approvingId === p.id}
                              className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-50 text-red-400 border border-red-200 hover:bg-red-100 hover:text-red-600 transition-all duration-200 disabled:opacity-50"
                              title="Mark as approved — letter received"
                            >
                              {approvingId === p.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={14} />}
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => openView(p)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200" title="View Purchase Details"><Eye size={14} /></button>
                            <button onClick={() => openEdit(p)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200" title="Edit"><Pencil size={14} /></button>
                            <button onClick={() => handleDelete(p.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200" title="Delete"><Trash2 size={14} /></button>
                            <button onClick={() => downloadPurchasePDF(p)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200" title="Download PDF"><FileDown size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button onClick={() => goToPage(Math.max(1, page - 1))} disabled={page === 1} className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200">
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
                  <button key={item} onClick={() => goToPage(item)} className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all duration-200 ${page === item ? "bg-slate-900 text-white shadow-md" : "border border-slate-200 text-slate-600 hover:bg-slate-100"}`}>
                    {item}
                  </button>
                )
              )}
            <button onClick={() => goToPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200">
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </main>

      {/* Add / Edit / View Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">{isViewOnly ? "View Company Purchase Record" : (editId ? "Edit" : "Add") + " Customer Purchase"}</h2>
              <button onClick={closeForm} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all duration-200"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: "customerName", label: "Customer Name", type: "text", required: true },
                  { name: "customerFatherName", label: "Father's Name", type: "text" },
                  { name: "customerNo", label: "Phone Number", type: "text" },
                  { name: "cnicNumber", label: "CNIC Number", type: "text" },
                  { name: "purchaseDate", label: "Purchase Date & Time", type: "datetime-local" },
                  { name: "actualAmount", label: "Actual Amount (Rs.)", type: "number" },
                  { name: "amountRemaining", label: "Amount Remaining (Rs.)", type: "number" },
                  { name: "additionalExpense", label: "Additional Expense (Rs.)", type: "number" },
                ].map((field) => (
                  <div key={field.name}>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      {field.label} {field.required && <span className="text-red-400">*</span>}
                    </label>
                    <input
                      type={field.type}
                      name={field.name}
                      value={form[field.name]}
                      onChange={handleChange}
                      disabled={isViewOnly}
                      required={field.required}
                      max={field.type === "datetime-local" ? getTodayMaxDateTime() : undefined}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all duration-200 bg-slate-50 hover:bg-white disabled:bg-slate-100 disabled:text-slate-600"
                      placeholder={field.type !== "date" && field.type !== "number" ? `Enter ${field.label.toLowerCase()}` : ""}
                    />
                  </div>
                ))}
              </div>

              {[{ name: "currentAddress", label: "Current Address" }, { name: "permanentAddress", label: "Permanent Address" }].map((field) => (
                <div key={field.name}>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{field.label}</label>
                  <textarea name={field.name} value={form[field.name]} onChange={handleChange} rows={2} disabled={isViewOnly}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all duration-200 bg-slate-50 hover:bg-white disabled:bg-slate-100 disabled:text-slate-600 resize-none"
                    placeholder={`Enter ${field.label.toLowerCase()}`} />
                </div>
              ))}

              {/* Bike Details */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Bike Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  {[
                    { name: "bikeCompany", label: "Bike Company" },
                    { name: "bikeModel", label: "Bike Model" },
                    { name: "bikeCC", label: "Bike CC" },
                    { name: "bikeColor", label: "Bike Color" },
                  ].map((field) => (
                    <div key={field.name}>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{field.label}</label>
                      <input type="text" name={field.name} value={form[field.name]} onChange={handleChange} disabled={isViewOnly}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all duration-200 bg-slate-50 hover:bg-white disabled:bg-slate-100 disabled:text-slate-600"
                      />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { name: "registrationNo", label: "Registration No." },
                    { name: "chasisNo", label: "Chasis No." },
                    { name: "engineNo", label: "Engine No." },
                  ].map((field) => (
                    <div key={field.name}>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{field.label}</label>
                      <input type="text" name={field.name} value={form[field.name]} onChange={handleChange} disabled={isViewOnly}
                        placeholder="Enter number or AFR"
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all duration-200 bg-slate-50 hover:bg-white disabled:bg-slate-100 disabled:text-slate-600"
                      />
                    </div>
                  ))}
                </div>
                {!isViewOnly && (
                  <p className="text-xs text-slate-400 mt-2">
                    Type <span className="font-semibold text-slate-500">AFR</span> in any of these fields if only the "Applied For Registration" letter has been received and the number isn't available yet.
                  </p>
                )}
              </div>

              {/* Photos */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Purchase Documents / Photos</label>
                  {!isViewOnly && (
                    <label className="text-xs font-semibold text-blue-600 cursor-pointer hover:underline">
                      + Add Photo
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => addPhoto("documents", e.target.files[0])} />
                    </label>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.documents.map((url, idx) => (
                    <div key={idx} className="relative w-16 h-16">
                      <img src={url} alt="" className="w-16 h-16 object-cover rounded-xl border border-slate-200" />
                      {!isViewOnly && (
                        <button type="button" onClick={() => removePhoto("documents", idx)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold">×</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {formError && <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{formError}</p>}
              <div className="flex items-center gap-3 pt-2">
                {!isViewOnly && (
                  <button type="submit" disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-slate-700 transition-all duration-200 disabled:opacity-60">
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    {submitting ? "Saving..." : editId ? "Update" : "Save Purchase"}
                  </button>
                )}
                <button type="button" onClick={closeForm}
                  className="flex-1 text-sm font-semibold py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all duration-200">
                  {isViewOnly ? "Close" : "Cancel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}