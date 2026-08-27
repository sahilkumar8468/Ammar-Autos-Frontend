"use client";

import { useState, useEffect, useRef } from "react";
import { RefreshCw, Download, Upload } from "lucide-react";
import { getUnsyncedCount, syncCloudBatch } from "@/app/lib/offlineService";
import { exportLocalData, importLocalData } from "@/app/lib/backupUtils";

export default function SyncButton() {
  const [mounted, setMounted] = useState(false);
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const checkStatus = async () => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
    }
    const count = await getUnsyncedCount();
    setUnsyncedCount(count);
  };

  useEffect(() => {
    if (!mounted) return;
    checkStatus();
    const interval = setInterval(checkStatus, 5000);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [mounted]);

  if (!mounted) return null;

  const handleSync = async () => {
    setIsSyncing(true);
    setStatusMessage("Syncing with Cloud...");
    try {
      const res = await syncCloudBatch();
      if (res.success) {
        setStatusMessage(res.message || "Synced!");
        await checkStatus();
      } else {
        setStatusMessage(res.message || "Sync failed.");
      }
    } catch (err) {
      setStatusMessage("Sync error.");
    } finally {
      setIsSyncing(false);
      setTimeout(() => setStatusMessage(""), 4000);
    }
  };

  const handleExport = async () => {
    const res = await exportLocalData();
    if (res.success) {
      setStatusMessage("Backup downloaded!");
    } else {
      setStatusMessage("Export failed.");
    }
    setTimeout(() => setStatusMessage(""), 4000);
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatusMessage("Importing backup...");
    const res = await importLocalData(file);
    if (res.success) {
      setStatusMessage(res.message);
      await checkStatus();
    } else {
      setStatusMessage(res.message || "Import failed.");
    }
    e.target.value = "";
    setTimeout(() => setStatusMessage(""), 5000);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Online / Offline Status Badge */}
      <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-xs font-bold text-slate-700 border border-slate-200">
        {isOnline ? (
          <>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-700">Offline DB (Ready)</span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-amber-700">Offline Mode</span>
          </>
        )}
      </div>

      {/* Unsynced Badge */}
      {unsyncedCount > 0 && (
        <span className="px-2.5 py-1 text-xs font-black bg-amber-100 text-amber-800 border border-amber-300 rounded-full shadow-xs">
          {unsyncedCount} Pending
        </span>
      )}

      {/* Cloud Sync Button */}
      <button
        onClick={handleSync}
        disabled={isSyncing || !isOnline}
        title="Sync local data to Firestore Cloud"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shadow-xs ${
          isSyncing || !isOnline
            ? "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"
            : "bg-slate-900 hover:bg-slate-800 text-white active:scale-95 cursor-pointer"
        }`}
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-blue-400" : ""}`} />
        <span>{isSyncing ? "Syncing..." : "Sync Cloud"}</span>
      </button>

      {/* Export Backup Button */}
      <button
        onClick={handleExport}
        title="Download JSON backup to Laptop Disk"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-all active:scale-95 cursor-pointer shadow-xs"
      >
        <Download className="w-3.5 h-3.5 text-emerald-600" />
        <span>Export Backup</span>
      </button>

      {/* Import Backup Button */}
      <button
        onClick={handleImportClick}
        title="Restore data from JSON backup file"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 transition-all active:scale-95 cursor-pointer shadow-xs"
      >
        <Upload className="w-3.5 h-3.5 text-blue-600" />
        <span>Import Backup</span>
      </button>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />

      {/* Status Feedback Toast */}
      {statusMessage && (
        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200 truncate max-w-xs">
          {statusMessage}
        </span>
      )}
    </div>
  );
}
