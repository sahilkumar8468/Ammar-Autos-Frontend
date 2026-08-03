"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, X, Loader2, RefreshCw, Trash2 } from "lucide-react";

const URL = process.env.NEXT_PUBLIC_BASE_URL;

const CATEGORY_LABELS = {
  company: "Customer Purchase",
  dealer: "Dealer Purchase",
  local_customer: "Local Customer Purchase",
};

export default function PurchaseList({ category }) {
  const router = useRouter();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

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
  };
  const [form, setForm] = useState(emptyForm);

  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${URL}/purchase?category=${category}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch");
      setPurchases(data.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch(`${URL}/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, category }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create");
      setForm(emptyForm);
      setShowForm(false);
      fetchPurchases();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this purchase record?")) return;
    try {
      const res = await fetch(`${URL}/purchase/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      fetchPurchases();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const label = CATEGORY_LABELS[category] || "Purchase";

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
              onClick={fetchPurchases}
              className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors duration-200 p-2 rounded-xl hover:bg-slate-100"
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={() => router.push("/purchase-dashboard")}
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
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</h2>
            <div className="h-1 w-12 bg-slate-900 mt-2 rounded-full" />
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-slate-900 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-slate-700 transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            <Plus size={16} />
            Add Purchase
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-400">
              <Loader2 size={28} className="animate-spin" />
            </div>
          ) : purchases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
              <span className="text-4xl">📋</span>
              <p className="text-sm font-medium">No records yet. Add your first purchase.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {["#", "Customer Name", "Father Name", "CNIC", "Phone", "Actual Amount", "Remaining", "Additional Exp.", "Date", "Action"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((p, i) => (
                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150">
                      <td className="px-4 py-3 text-slate-400 font-medium">{i + 1}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{p.customerName || "—"}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{p.customerFatherName || "—"}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{p.cnicNumber || "—"}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{p.customerNo || "—"}</td>
                      <td className="px-4 py-3 text-emerald-700 font-semibold whitespace-nowrap">
                        {p.actualAmount != null ? `Rs. ${Number(p.actualAmount).toLocaleString()}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-rose-600 font-semibold whitespace-nowrap">
                        {p.amountRemaining != null ? `Rs. ${Number(p.amountRemaining).toLocaleString()}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-amber-600 whitespace-nowrap">
                        {p.additionalExpense != null ? `Rs. ${Number(p.additionalExpense).toLocaleString()}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {p.purchaseDateTime?.seconds
                          ? new Date(p.purchaseDateTime.seconds * 1000).toLocaleDateString()
                          : p.purchaseDate || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                          title="Delete"
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

      {/* Add Purchase Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Add {label}</h2>
              <button
                onClick={() => { setShowForm(false); setFormError(""); setForm(emptyForm); }}
                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all duration-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: "customerName", label: "Customer Name", type: "text", required: true },
                  { name: "customerFatherName", label: "Father's Name", type: "text" },
                  { name: "customerNo", label: "Phone Number", type: "text" },
                  { name: "cnicNumber", label: "CNIC Number", type: "text" },
                  { name: "purchaseDate", label: "Purchase Date", type: "date" },
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
                      required={field.required}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all duration-200 bg-slate-50 hover:bg-white"
                      placeholder={field.type === "text" ? `Enter ${field.label.toLowerCase()}` : ""}
                    />
                  </div>
                ))}
              </div>

              {/* Full-width fields */}
              {[
                { name: "currentAddress", label: "Current Address" },
                { name: "permanentAddress", label: "Permanent Address" },
              ].map((field) => (
                <div key={field.name}>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    {field.label}
                  </label>
                  <textarea
                    name={field.name}
                    value={form[field.name]}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all duration-200 bg-slate-50 hover:bg-white resize-none"
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                  />
                </div>
              ))}

              {formError && (
                <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{formError}</p>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-slate-700 transition-all duration-200 disabled:opacity-60"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  {submitting ? "Saving..." : "Save Purchase"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setFormError(""); setForm(emptyForm); }}
                  className="flex-1 text-sm font-semibold py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all duration-200"
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
