"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Plus, X, Loader2, RefreshCw, Trash2, Pencil,
  Search, TrendingUp, Bike as BikeIcon, FileDown, ChevronLeft, ChevronRight,
  Eye, Calendar, CheckCircle2, AlertCircle, RotateCcw
} from "lucide-react";
import { downloadSalePDF } from "@/app/lib/pdfUtils";
import MobileBottomNav from "@/app/components/MobileBottomNav";
import DeleteConfirmModal from "@/app/components/DeleteConfirmModal";
import ExportPDFModal from "@/app/components/ExportPDFModal";
import { downloadSalePDF, downloadSalesSummaryPDF } from "@/app/lib/pdfUtils";

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
  installmentDescription: "",
  hasInitialGracePayment: false,
  initialGraceAmount: "",
  initialGraceDueDate: "",
  initialGraceDescription: "",
  installments: [],
};

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const money = (n) => (n != null ? `Rs. ${Number(n).toLocaleString()}` : "—");

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

const extractTimestampSeconds = (ts) => {
  if (!ts || typeof ts !== "object") return null;
  return ts._seconds || ts.seconds || null;
};

const toLocalDateInputValue = (ts) => {
  if (!ts) return "";
  let d;
  if (typeof ts === "object" && ts !== null) {
    if (typeof ts.toDate === "function") {
      d = ts.toDate();
    } else {
      const secs = ts._seconds ?? ts.seconds;
      if (typeof secs === "number") d = new Date(secs * 1000);
    }
  }
  if (!d) d = new Date(ts);
  if (isNaN(d.getTime())) return "";

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toDateInputValue = toLocalDateInputValue;

const toDateTimeInputValue = (ts) => {
  if (!ts) return "";
  let d;
  if (typeof ts === "object" && ts !== null) {
    if (typeof ts.toDate === "function") {
      d = ts.toDate();
    } else {
      const secs = ts._seconds ?? ts.seconds;
      if (typeof secs === "number") d = new Date(secs * 1000);
    }
  }
  if (!d) d = new Date(ts);
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

const getTodayMaxDate = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function SaleList() {
  const router = useRouter();
  const label = "Sale";

  const [sales, setSales] = useState([]);
  const [stats, setStats] = useState({ bikesSold: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [month, setMonth] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 10;

  const [showForm, setShowForm] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [regLookupStatus, setRegLookupStatus] = useState(null);

  const totalAmountRemaining = Math.max(
    0,
    parseFloat(form.totalSaleAmount || 0) - parseFloat(form.advanceReceived || 0)
  );

  const installmentScheduleSum = (form.installments || []).reduce(
    (sum, item) => sum + parseFloat(item.amount || 0),
    0
  );

  // Return / Buyback Modal state
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnSale, setReturnSale] = useState(null);
  const [returnForm, setReturnForm] = useState({
    category: "local_customer",
    customerName: "",
    customerFatherName: "",
    customerNo: "",
    cnicNumber: "",
    currentAddress: "",
    permanentAddress: "",
    purchaseDate: "",
    actualAmount: "",
    amountRemaining: "",
    additionalExpense: "",
    bikeCompany: "",
    bikeModel: "",
    chasisNo: "",
    engineNo: "",
    registrationNo: "",
  });
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [returnError, setReturnError] = useState("");
  const [returnSuccess, setReturnSuccess] = useState("");

  const openReturnModal = (s) => {
    setReturnSale(s);
    setReturnForm({
      category: s.category || "local_customer",
      customerName: s.buyerName || "",
      customerFatherName: s.buyerFatherName || "",
      customerNo: s.buyerNumber || s.salerNumber || "",
      cnicNumber: s.buyerCnic || "",
      currentAddress: s.buyerCurrentAddress || "",
      permanentAddress: s.buyerPermanentAddress || "",
      purchaseDate: toLocalDateInputValue(new Date()),
      actualAmount: "",
      amountRemaining: "",
      additionalExpense: "",
      bikeCompany: s.bikeCompany || "",
      bikeModel: s.bikeModel || "",
      chasisNo: s.chasisNo || "",
      engineNo: s.engineNo || "",
      registrationNo: s.registrationNo || "",
    });
    setReturnError("");
    setReturnSuccess("");
    setShowReturnModal(true);
  };

  useEffect(() => {
    if (showForm || showReturnModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showForm, showReturnModal]);

  const closeReturnModal = () => {
    setShowReturnModal(false);
    setReturnSale(null);
    setReturnError("");
    setReturnSuccess("");
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    setReturnSubmitting(true);
    setReturnError("");
    setReturnSuccess("");
    try {
      if (returnForm.purchaseDate) {
        const selected = new Date(returnForm.purchaseDate);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);
        if (selected > endOfToday) {
          throw new Error("Future dates cannot be selected for return purchase date. Please select today or a past date.");
        }
      }
      const payload = {
        category: returnForm.category || "local_customer",
        customerName: returnForm.customerName,
        customerFatherName: returnForm.customerFatherName || "",
        customerNo: returnForm.customerNo || "",
        cnicNumber: returnForm.cnicNumber || "",
        currentAddress: returnForm.currentAddress || "",
        permanentAddress: returnForm.permanentAddress || "",
        purchaseDate: returnForm.purchaseDate,
        actualAmount: parseFloat(returnForm.actualAmount || 0),
        amountRemaining: parseFloat(returnForm.amountRemaining || 0),
        additionalExpense: parseFloat(returnForm.additionalExpense || 0),
        bikeCompany: returnForm.bikeCompany || "",
        bikeModel: returnForm.bikeModel || "",
        chasisNo: returnForm.chasisNo || "",
        engineNo: returnForm.engineNo || "",
        registrationNo: returnForm.registrationNo || "",
        isReturn: true,
        previousSaleId: returnSale?.id || null,
      };

      const res = await fetch(`${URL}/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to record return purchase");
      setReturnSuccess("Bike returned & re-entered into inventory successfully!");
      setTimeout(() => {
        closeReturnModal();
        fetchSales();
      }, 1200);
    } catch (err) {
      setReturnError(err.message);
    } finally {
      setReturnSubmitting(false);
    }
  };

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
    setForm({ ...emptyForm, category: "local_customer", saleDateTime: toDateTimeInputValue(new Date()) });
    setEditId(null);
    setIsReadOnly(false);
    setFormError("");
    setRegLookupStatus(null);
    setShowForm(true);
  };

  const populateFormWithSale = (s) => {
    const parsedInstallments = Array.isArray(s.installments)
      ? s.installments.map((inst, idx) => ({
          monthNumber: inst.monthNumber || idx + 1,
          dueDate: toDateInputValue(inst.dueDate),
          amount: inst.amount || "",
          description: inst.description || `Installment #${idx + 1}`,
          paid: !!inst.paid,
          paidDate: inst.paidDate ? toDateInputValue(inst.paidDate) : null,
        }))
      : [];

    return {
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

      saleDateTime: toDateTimeInputValue(s.saleDateTime || s.saleDate),
      totalSaleAmount: s.totalSaleAmount || "",
      advanceReceived: s.advanceReceived || "",
      saleType: s.saleType || "cash",
      installmentMonths: s.installmentMonths || "",
      perMonthInstallment: s.perMonthInstallment || "",
      installmentStartDate: toDateInputValue(s.installmentStartDate),
      installmentDescription: s.installmentDescription || "",
      hasInitialGracePayment: s.hasInitialGracePayment || false,
      initialGraceAmount: s.initialGraceAmount || "",
      initialGraceDueDate: toDateInputValue(s.initialGraceDueDate),
      initialGraceDescription: s.initialGraceDescription || "",
      installments: parsedInstallments,
    };
  };

  const openView = (s) => {
    setForm(populateFormWithSale(s));
    setEditId(s.id);
    setIsReadOnly(true);
    setFormError("");
    setRegLookupStatus(null);
    setShowForm(true);
  };

  const openEdit = (s) => {
    setForm(populateFormWithSale(s));
    setEditId(s.id);
    setIsReadOnly(false);
    setFormError("");
    setRegLookupStatus(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setIsReadOnly(false);
    setForm(emptyForm);
    setEditId(null);
  };

  const update = (field, value) => {
    if (isReadOnly) return;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleChange = (e) => {
    if (isReadOnly) return;
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const generateScheduleRows = (currentForm) => {
    const {
      installmentMonths,
      installmentStartDate,
      perMonthInstallment,
      hasInitialGracePayment,
      initialGraceAmount,
      initialGraceDueDate,
      initialGraceDescription
    } = currentForm;

    const rows = [];
    let monthOffset = 0;

    if (hasInitialGracePayment && parseFloat(initialGraceAmount) > 0) {
      let gDate = initialGraceDueDate;
      if (!gDate) {
        const d = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
        gDate = d.toISOString().slice(0, 10);
      }
      rows.push({
        monthNumber: 1,
        dueDate: gDate,
        amount: parseFloat(initialGraceAmount || 0),
        description: initialGraceDescription || "Initial / Grace Payment (10 Days)",
        paid: false
      });
      monthOffset = 1;
    }

    const months = parseInt(installmentMonths || 0, 10);
    const perMonth = parseFloat(perMonthInstallment || 0);
    const baseDate = installmentStartDate ? new Date(installmentStartDate) : new Date();

    for (let i = 1; i <= months; i++) {
      const d = new Date(baseDate);
      d.setMonth(d.getMonth() + (i - 1));
      rows.push({
        monthNumber: i + monthOffset,
        dueDate: isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10),
        amount: perMonth || 0,
        description: `Installment #${i}`,
        paid: false
      });
    }

    return rows;
  };

  const autoFillSchedule = () => {
    if (isReadOnly) return;
    const rows = generateScheduleRows(form);
    update("installments", rows);
  };

  const updateInstallmentRow = (idx, field, value) => {
    if (isReadOnly) return;
    setForm((prev) => {
      const updated = [...prev.installments];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, installments: updated };
    });
  };

  const addInstallmentRow = () => {
    if (isReadOnly) return;
    setForm((prev) => {
      const nextNum = prev.installments.length + 1;
      const lastDate = prev.installments[prev.installments.length - 1]?.dueDate;
      let nextDateStr = "";
      if (lastDate) {
        const d = new Date(lastDate);
        d.setMonth(d.getMonth() + 1);
        if (!isNaN(d.getTime())) nextDateStr = d.toISOString().slice(0, 10);
      }
      return {
        ...prev,
        installments: [
          ...prev.installments,
          {
            monthNumber: nextNum,
            dueDate: nextDateStr,
            amount: parseFloat(prev.perMonthInstallment || 0),
            description: `Custom Installment #${nextNum}`,
            paid: false
          }
        ]
      };
    });
  };

  const removeInstallmentRow = (idx) => {
    if (isReadOnly) return;
    setForm((prev) => ({
      ...prev,
      installments: prev.installments.filter((_, i) => i !== idx)
    }));
  };

  const updateCurrentAddress = (addr) => {
    if (isReadOnly) return;
    setForm((prev) => ({
      ...prev,
      buyerCurrentAddress: addr,
      buyerPermanentAddress: prev.addressSameAsPermanent ? addr : prev.buyerPermanentAddress,
    }));
  };

  const toggleSameAddress = (checked) => {
    if (isReadOnly) return;
    setForm((prev) => ({
      ...prev,
      addressSameAsPermanent: checked,
      buyerPermanentAddress: checked ? prev.buyerCurrentAddress : prev.buyerPermanentAddress,
    }));
  };

  const addPhoto = (field, file) => {
    if (isReadOnly || !file) return;
    setForm((prev) => ({ ...prev, [field]: [...prev[field], file] }));
  };

  const removePhoto = (field, idx) => {
    if (isReadOnly) return;
    setForm((prev) => ({ ...prev, [field]: prev[field].filter((_, i) => i !== idx) }));
  };

  const handleRegistrationBlur = async () => {
    if (isReadOnly) return;
    const value = form.registrationNo.trim();
    if (!value) {
      setRegLookupStatus(null);
      return;
    }

    setRegLookupStatus(null);
    try {
      const res = await fetch(`${URL}/sale/lookup-bike/${encodeURIComponent(value)}`);
      const data = await res.json();
      if (!res.ok || !data.success) return;

      if (data.isAfr) {
        setRegLookupStatus("afr");
        setForm((prev) => ({ ...prev, linkedPurchaseId: null }));
        return;
      }
      if (!data.found) {
        const chasisRes = await fetch(`${URL}/sale/lookup-bike-chasis/${encodeURIComponent(value)}`);
        const chasisData = await chasisRes.json();
        if (chasisRes.ok && chasisData.success && chasisData.found) {
          if (chasisData.alreadySold) {
            setRegLookupStatus("sold");
            return;
          }
          setRegLookupStatus("found");
          setForm((prev) => ({
            ...prev,
            bikeCompany: chasisData.data.bikeCompany || prev.bikeCompany,
            bikeModel: chasisData.data.bikeModel || prev.bikeModel,
            chasisNo: chasisData.data.chasisNo || prev.chasisNo,
            engineNo: chasisData.data.engineNo || prev.engineNo,
            linkedPurchaseId: chasisData.purchaseId,
            category: chasisData.purchaseCategory || prev.category,
          }));
          return;
        }
        setRegLookupStatus("new");
        setForm((prev) => ({ ...prev, linkedPurchaseId: null }));
        return;
      }

      if (data.alreadySold) {
        setRegLookupStatus("sold");
        return;
      }

      setRegLookupStatus("found");
      setForm((prev) => ({
        ...prev,
        bikeCompany: data.data.bikeCompany || prev.bikeCompany,
        bikeModel: data.data.bikeModel || prev.bikeModel,
        chasisNo: data.data.chasisNo || prev.chasisNo,
        engineNo: data.data.engineNo || prev.engineNo,
        linkedPurchaseId: data.purchaseId,
        category: data.purchaseCategory || prev.category,
      }));
    } catch {
      // ignore lookup network errors silently
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly) {
      closeForm();
      return;
    }

    try {
      if (form.saleDateTime) {
        const selected = new Date(form.saleDateTime);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);
        if (selected > endOfToday) {
          setFormError("Future dates cannot be selected for sale date & time. Please select today or a past date.");
          setSubmitting(false);
          return;
        }
      }

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
            result.push(photo);
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

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${URL}/sale/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete sale record");
      setDeleteTarget(null);
      fetchSales();
    } catch (e) {
      alert(e.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans antialiased">
      {/* Header */}
      <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm backdrop-blur-md bg-white/80">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all duration-200"
              title="Back to Dashboard"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="bg-emerald-600 text-white p-2.5 rounded-xl shadow-md shadow-emerald-600/10">
              <span role="img" aria-label="sale" className="text-xl block leading-none">💰</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Sales Dashboard</h1>
              <p className="text-xs text-slate-500 font-medium -mt-0.5">Manage Bike Sales & Custom Installment Schedules</p>
            </div>
          </div>
          <button
            onClick={() => router.push("/earning-dashboard")}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-xs font-semibold rounded-xl hover:bg-teal-700 transition-all shadow-md shadow-teal-600/20"
          >
            <TrendingUp size={16} />
            View Earning & Profit
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Sales Overview</h2>
            <div className="h-1 w-12 bg-emerald-600 mt-1.5 rounded-full" />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-all duration-200 shadow-md cursor-pointer"
              title="Download Sales PDF Report"
            >
              <FileDown size={16} />
              Export PDF
            </button>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-700 transition-all duration-200 shadow-md shadow-slate-900/10 cursor-pointer"
            >
              <Plus size={16} />
              Add Sale
            </button>
          </div>
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
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap capitalize">
                        {s.saleType || "—"}
                        {s.saleType === "installment" && Array.isArray(s.installments) && (
                          <span className="ml-1 text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded-full font-bold">
                            {s.installments.length} mo
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-emerald-700 font-semibold whitespace-nowrap">{money(s.totalSaleAmount)}</td>
                      <td className="px-4 py-3 font-semibold whitespace-nowrap">
                        {s.amountRemaining > 0
                          ? <span className="text-rose-600">{money(s.amountRemaining)}</span>
                          : <span className="text-emerald-600">Paid</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDateTime(s.saleDateTime || s.saleDate)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openView(s)} className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all duration-200" title="View (Readonly)">
                            <Eye size={14} />
                          </button>
                          <button onClick={() => openReturnModal(s)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all duration-200" title="Return / Buy Back Bike">
                            <RotateCcw size={14} />
                          </button>
                          <button onClick={() => openEdit(s)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200" title="Edit">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => setDeleteTarget(s)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200" title="Delete">
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

        {totalCount > 0 && (
          <p className="text-center text-xs text-slate-400 mt-2">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)} of {totalCount} records
          </p>
        )}
      </main>

      <MobileBottomNav />

      {/* Unified Add / Edit / View (Readonly) Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {isReadOnly ? "View Sale Details (Readonly)" : editId ? "Edit Sale" : "Add Sale"}
                </h2>
                {isReadOnly && editId && <p className="text-xs text-slate-400 font-mono">Record ID: {editId}</p>}
              </div>
              <button onClick={closeForm} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all duration-200">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">
              {/* Registration lookup */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Registration No. (or type AFR) {!isReadOnly && <span className="text-red-400">*</span>}
                </label>
                <input
                  type="text"
                  name="registrationNo"
                  value={form.registrationNo}
                  onChange={handleChange}
                  onBlur={handleRegistrationBlur}
                  disabled={isReadOnly}
                  readOnly={isReadOnly}
                  required={!isReadOnly}
                  placeholder="e.g. LEA-1234 or AFR"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all duration-200 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-700"
                />
                {!isReadOnly && regLookupStatus === "found" && <p className="text-xs text-emerald-600 mt-1.5 font-medium">Matched an existing purchase — bike details auto-filled.</p>}
                {!isReadOnly && regLookupStatus === "afr" && <p className="text-xs text-amber-600 mt-1.5 font-medium">Applied For Registration — treated as a new, unregistered bike.</p>}
                {!isReadOnly && regLookupStatus === "new" && <p className="text-xs text-slate-400 mt-1.5 font-medium">No matching purchase found — enter bike details manually.</p>}
                {!isReadOnly && regLookupStatus === "sold" && <p className="text-xs text-red-600 mt-1.5 font-medium">This bike is already recorded as sold.</p>}
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
                        disabled={isReadOnly} readOnly={isReadOnly}
                        placeholder={`Enter ${f.label.toLowerCase()}`}
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all duration-200 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-700"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Buyer Details */}
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
                        {f.label} {!isReadOnly && f.required && <span className="text-red-400">*</span>}
                      </label>
                      <input
                        type="text" name={f.name} value={form[f.name]} onChange={handleChange} required={!isReadOnly && f.required}
                        disabled={isReadOnly} readOnly={isReadOnly}
                        placeholder={`Enter ${f.label.toLowerCase()}`}
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all duration-200 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-700"
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Current Address</label>
                  <textarea
                    value={form.buyerCurrentAddress}
                    onChange={(e) => updateCurrentAddress(e.target.value)}
                    disabled={isReadOnly} readOnly={isReadOnly}
                    rows={2}
                    placeholder="Enter current address"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all duration-200 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-700 resize-none"
                  />
                </div>

                {!isReadOnly && (
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 mt-3">
                    <input
                      type="checkbox"
                      checked={form.addressSameAsPermanent}
                      onChange={(e) => toggleSameAddress(e.target.checked)}
                      disabled={isReadOnly}
                      className="rounded border-slate-300"
                    />
                    Permanent address is the same as current address
                  </label>
                )}

                {(!form.addressSameAsPermanent || isReadOnly) && (
                  <div className="mt-3">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Permanent Address</label>
                    <textarea
                      name="buyerPermanentAddress"
                      value={form.buyerPermanentAddress}
                      onChange={handleChange}
                      disabled={isReadOnly} readOnly={isReadOnly}
                      rows={2}
                      placeholder="Enter permanent address"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all duration-200 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-700 resize-none"
                    />
                  </div>
                )}

                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Buyer Photos</label>
                    {!isReadOnly && (
                      <label className="text-xs font-semibold text-blue-600 cursor-pointer hover:underline">
                        + Add Photo
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => addPhoto("buyerPhotos", e.target.files[0])} />
                      </label>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {form.buyerPhotos.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">No buyer photos attached</span>
                    ) : (
                      form.buyerPhotos.map((photo, idx) => {
                        const src = typeof photo === "string" ? photo : (typeof URL !== "undefined" && URL.createObjectURL ? URL.createObjectURL(photo) : "");
                        return (
                          <div key={idx} className="relative w-16 h-16">
                            <img src={src} alt="" className="w-16 h-16 object-cover rounded-xl border border-slate-200" />
                            {!isReadOnly && (
                              <button type="button" onClick={() => removePhoto("buyerPhotos", idx)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs">×</button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Saler Details */}
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
                        disabled={isReadOnly} readOnly={isReadOnly}
                        placeholder={`Enter ${f.label.toLowerCase()}`}
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all duration-200 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-700"
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Saler Address</label>
                  <textarea
                    name="salerAddress" value={form.salerAddress} onChange={handleChange} rows={2}
                    disabled={isReadOnly} readOnly={isReadOnly}
                    placeholder="Enter saler address"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all duration-200 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-700 resize-none"
                  />
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Saler Photo</label>
                    {!isReadOnly && (
                      <label className="text-xs font-semibold text-blue-600 cursor-pointer hover:underline">
                        + Add Photo
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => addPhoto("salerPhotos", e.target.files[0])} />
                      </label>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {form.salerPhotos.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">No seller photos attached</span>
                    ) : (
                      form.salerPhotos.map((photo, idx) => {
                        const src = typeof photo === "string" ? photo : (typeof URL !== "undefined" && URL.createObjectURL ? URL.createObjectURL(photo) : "");
                        return (
                          <div key={idx} className="relative w-16 h-16">
                            <img src={src} alt="" className="w-16 h-16 object-cover rounded-xl border border-slate-200" />
                            {!isReadOnly && (
                              <button type="button" onClick={() => removePhoto("salerPhotos", idx)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs">×</button>
                            )}
                          </div>
                        );
                      })
                    )}
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
                    disabled={isReadOnly} readOnly={isReadOnly}
                    max={getTodayMaxDateTime()}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all duration-200 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-700"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    {form.saleType === "cash" ? "Sold Amount (Rs.)" : "Total Sale Amount (Rs.)"} {!isReadOnly && <span className="text-red-400">*</span>}
                  </label>
                  <input
                    type="number" name="totalSaleAmount" value={form.totalSaleAmount} onChange={handleChange} required={!isReadOnly}
                    disabled={isReadOnly} readOnly={isReadOnly}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all duration-200 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-700"
                  />
                </div>

                <div className="flex items-center gap-5 mb-4">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <input type="radio" name="saleType" checked={form.saleType === "cash"} onChange={() => update("saleType", "cash")} disabled={isReadOnly} />
                    Cash
                  </label>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <input type="radio" name="saleType" checked={form.saleType === "installment"} onChange={() => update("saleType", "installment")} disabled={isReadOnly} />
                    Installment
                  </label>
                </div>

                {/* Enhanced Installment Controls */}
                {form.saleType === "installment" && (
                  <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-4 mb-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Advance Received (Rs.)</label>
                        <input
                          type="number" name="advanceReceived" value={form.advanceReceived} onChange={handleChange}
                          disabled={isReadOnly} readOnly={isReadOnly}
                          placeholder="Enter advance amount"
                          className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white disabled:bg-slate-100 disabled:text-slate-700"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Remaining Balance (Rs.)</label>
                        <input
                          type="text" value={money(totalAmountRemaining)} disabled readOnly
                          className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-100 font-bold text-rose-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Months</label>
                        <input
                          type="number" name="installmentMonths" value={form.installmentMonths} onChange={handleChange}
                          disabled={isReadOnly} readOnly={isReadOnly}
                          placeholder="e.g. 3"
                          className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white disabled:bg-slate-100 disabled:text-slate-700"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Per-Month Amount (Rs.)</label>
                        <input
                          type="number" name="perMonthInstallment" value={form.perMonthInstallment} onChange={handleChange}
                          disabled={isReadOnly} readOnly={isReadOnly}
                          placeholder="e.g. 25000"
                          className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white disabled:bg-slate-100 disabled:text-slate-700"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Start Date</label>
                        <input
                          type="date" name="installmentStartDate" value={form.installmentStartDate} onChange={handleChange}
                          disabled={isReadOnly} readOnly={isReadOnly}
                          className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white disabled:bg-slate-100 disabled:text-slate-700"
                        />
                      </div>
                    </div>

                    {/* Conditional Initial / Grace Payment Checkbox */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-3">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.hasInitialGracePayment}
                          onChange={(e) => update("hasInitialGracePayment", e.target.checked)}
                          disabled={isReadOnly}
                          className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                        />
                        Add Initial / Grace Payment (e.g. 10-day custom payment before monthly installments)
                      </label>

                      {form.hasInitialGracePayment && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Grace Amount (Rs.)</label>
                            <input
                              type="number"
                              value={form.initialGraceAmount}
                              onChange={(e) => update("initialGraceAmount", e.target.value)}
                              disabled={isReadOnly} readOnly={isReadOnly}
                              placeholder="e.g. 15000"
                              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 disabled:bg-slate-100"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Grace Due Date</label>
                            <input
                              type="date"
                              value={form.initialGraceDueDate}
                              onChange={(e) => update("initialGraceDueDate", e.target.value)}
                              disabled={isReadOnly} readOnly={isReadOnly}
                              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 disabled:bg-slate-100"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Grace Description</label>
                            <input
                              type="text"
                              value={form.initialGraceDescription}
                              onChange={(e) => update("initialGraceDescription", e.target.value)}
                              disabled={isReadOnly} readOnly={isReadOnly}
                              placeholder="Initial 10-day payment"
                              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 disabled:bg-slate-100"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Schedule Auto-Populate & Custom Row Matrix */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            Custom Monthly Schedule ({form.installments.length} Installments)
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Set custom dates, amounts, or descriptions for every month.
                          </p>
                        </div>
                        {!isReadOnly && (
                          <div className="flex items-center gap-2">
                         
                            <button
                              type="button"
                              onClick={addInstallmentRow}
                              className="px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-700 transition-all"
                            >
                              + Add Row
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Real-time Schedule Sum Indicator */}
                      <div className="p-2.5 rounded-xl text-xs mb-3 flex items-center justify-between bg-white border border-slate-200">
                        <span className="font-semibold text-slate-600">
                          Scheduled Total: <strong className="text-slate-900">{money(installmentScheduleSum)}</strong> / Remaining Balance: <strong className="text-rose-600">{money(totalAmountRemaining)}</strong>
                        </span>
                        {Math.abs(installmentScheduleSum - totalAmountRemaining) < 1 ? (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            ✓ Sum Matches Balance
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            ⚠️ Difference: {money(totalAmountRemaining - installmentScheduleSum)}
                          </span>
                        )}
                      </div>

                      {form.installments.length > 0 && (
                        <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto bg-white">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 text-slate-500 font-bold uppercase text-[10px]">
                              <tr>
                                <th className="py-2 px-3">#</th>
                                <th className="py-2 px-3">Due Date</th>
                                <th className="py-2 px-3">Amount (Rs.)</th>
                                <th className="py-2 px-3">Description / Note</th>
                                {isReadOnly ? (
                                  <th className="py-2 px-3 text-center">Status</th>
                                ) : (
                                  <th className="py-2 px-3 text-center">Action</th>
                                )}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {form.installments.map((inst, idx) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                  <td className="py-2 px-3 font-bold text-slate-500 w-10">
                                    {inst.monthNumber || idx + 1}
                                  </td>
                                  <td className="py-2 px-3 w-36">
                                    <input
                                      type="date"
                                      value={inst.dueDate}
                                      onChange={(e) => updateInstallmentRow(idx, "dueDate", e.target.value)}
                                      disabled={isReadOnly} readOnly={isReadOnly}
                                      className="w-full px-2 py-1 border border-slate-200 rounded text-xs disabled:bg-slate-100"
                                    />
                                  </td>
                                  <td className="py-2 px-3 w-32">
                                    <input
                                      type="number"
                                      value={inst.amount}
                                      onChange={(e) => updateInstallmentRow(idx, "amount", e.target.value)}
                                      disabled={isReadOnly} readOnly={isReadOnly}
                                      className="w-full px-2 py-1 border border-slate-200 rounded text-xs font-semibold disabled:bg-slate-100"
                                    />
                                  </td>
                                  <td className="py-2 px-3">
                                    <input
                                      type="text"
                                      value={inst.description}
                                      onChange={(e) => updateInstallmentRow(idx, "description", e.target.value)}
                                      disabled={isReadOnly} readOnly={isReadOnly}
                                      placeholder="e.g. Regular installment"
                                      className="w-full px-2 py-1 border border-slate-200 rounded text-xs disabled:bg-slate-100"
                                    />
                                  </td>
                                  {isReadOnly ? (
                                    <td className="py-2 px-3 text-center">
                                      {inst.paid ? (
                                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Paid</span>
                                      ) : (
                                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Pending</span>
                                      )}
                                    </td>
                                  ) : (
                                    <td className="py-2 px-3 text-center w-12">
                                      <button
                                        type="button"
                                        onClick={() => removeInstallmentRow(idx)}
                                        className="text-red-500 hover:text-red-700 p-1"
                                        title="Delete Row"
                                      >
                                        ×
                                      </button>
                                    </td>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Placed at the VERY END of the Installments section as requested */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                        Installment Plan Description &amp; Terms (Notes)
                      </label>
                      <textarea
                        name="installmentDescription"
                        value={form.installmentDescription}
                        onChange={handleChange}
                        disabled={isReadOnly} readOnly={isReadOnly}
                        rows={2}
                        placeholder="e.g. 3-month plan with initial grace payment of Rs. 15,000..."
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white disabled:bg-slate-100 disabled:text-slate-700 resize-none"
                      />
                    </div>
                  </div>
                )}

                {formError && <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{formError}</p>}

                <div className="flex items-center gap-3 pt-2">
                  {isReadOnly ? (
                    <button
                      type="button"
                      onClick={closeForm}
                      className="w-full text-sm font-semibold py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all duration-200"
                    >
                      Close Details
                    </button>
                  ) : (
                    <>
                      <button type="submit" disabled={submitting}
                        className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-slate-700 transition-all duration-200 disabled:opacity-60">
                        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                        {submitting ? "Saving..." : editId ? "Update Sale" : "Save Sale"}
                      </button>
                      <button type="button" onClick={closeForm}
                        className="flex-1 text-sm font-semibold py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all duration-200">
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Return / Buy Back Modal */}
      {showReturnModal && returnSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <RotateCcw size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Return / Buy Back Bike</h2>
                  <p className="text-xs text-slate-400">Re-enter sold bike into inventory as a new purchase</p>
                </div>
              </div>
              <button onClick={closeReturnModal} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all duration-200">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleReturnSubmit} className="px-6 py-5 space-y-5">
              {/* Bike & Previous Buyer Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Bike Details</p>
                  <p className="text-sm font-bold text-slate-800">{[returnSale.bikeCompany, returnSale.bikeModel].filter(Boolean).join(" ") || "—"}</p>
                  <p className="text-xs text-slate-600 font-mono">Reg: <span className="font-semibold">{returnSale.registrationNo || "—"}</span></p>
                  <p className="text-xs text-slate-600 font-mono">Chasis: <span className="font-semibold">{returnSale.chasisNo || "—"}</span></p>
                  <p className="text-xs text-slate-600 font-mono">Engine: <span className="font-semibold">{returnSale.engineNo || "—"}</span></p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Seller (Original Buyer)</p>
                  <p className="text-sm font-bold text-slate-800">{returnSale.buyerName || "—"}</p>
                  <p className="text-xs text-slate-600">Father: <span className="font-semibold">{returnSale.buyerFatherName || "—"}</span></p>
                  <p className="text-xs text-slate-600 font-mono">CNIC: <span className="font-semibold">{returnSale.buyerCnic || "—"}</span></p>
                  <p className="text-xs text-slate-600">Address: <span className="font-semibold">{returnSale.buyerCurrentAddress || "—"}</span></p>
                </div>
              </div>

              {/* Form Inputs */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Return Purchase Terms</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Purchase Category <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={returnForm.category}
                      onChange={(e) => setReturnForm({ ...returnForm, category: e.target.value })}
                      required
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50 hover:bg-white"
                    >
                      <option value="local_customer">Local Customer Purchase</option>
                      <option value="company">Company Purchase</option>
                      <option value="dealer">Dealer Purchase</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Return Date <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={returnForm.purchaseDate}
                      onChange={(e) => setReturnForm({ ...returnForm, purchaseDate: e.target.value })}
                      max={getTodayMaxDate()}
                      required
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50 hover:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Buyback / Return Price (Rs.) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      value={returnForm.actualAmount}
                      onChange={(e) => setReturnForm({ ...returnForm, actualAmount: e.target.value })}
                      placeholder="e.g. 85000"
                      required
                      min="0"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50 hover:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Amount Remaining (Rs.)
                    </label>
                    <input
                      type="number"
                      value={returnForm.amountRemaining}
                      onChange={(e) => setReturnForm({ ...returnForm, amountRemaining: e.target.value })}
                      placeholder="0"
                      min="0"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50 hover:bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Additional Expenses (Rs.)
                    </label>
                    <input
                      type="number"
                      value={returnForm.additionalExpense}
                      onChange={(e) => setReturnForm({ ...returnForm, additionalExpense: e.target.value })}
                      placeholder="0"
                      min="0"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50 hover:bg-white"
                    />
                  </div>
                </div>
              </div>

              {returnError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{returnError}</span>
                </div>
              )}

              {returnSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>{returnSuccess}</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={returnSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 bg-amber-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-amber-700 transition-all duration-200 disabled:opacity-60 shadow-md shadow-amber-600/20"
                >
                  {returnSubmitting ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                  {returnSubmitting ? "Processing..." : "Complete Return & Add to Stock"}
                </button>
                <button
                  type="button"
                  onClick={closeReturnModal}
                  className="flex-1 text-sm font-semibold py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={isDeleting}
        title="Delete Sale Record"
        itemName={deleteTarget ? `${deleteTarget.bikeCompany || ""} ${deleteTarget.bikeModel || ""} (${deleteTarget.registrationNo || "AFR"}) - Buyer: ${deleteTarget.buyerName || "—"}` : ""}
        description="Are you sure you want to delete this sale record? Deleting this sale will restore the bike's status in inventory and remove all associated financial revenue."
      />

      {/* Export Sales PDF Modal */}
      <ExportPDFModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExportSalesPDF}
        title="Export Sales Summary Report"
        description="Choose a date range or download all sales transactions."
        defaultRange="all"
      />
    </div>
  );
}