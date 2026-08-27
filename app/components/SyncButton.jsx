"use client";

import { useState, useEffect, useRef } from "react";
import { RefreshCw, Download, Upload, CloudCheck, CloudOff, Database, CheckCircle2 } from "lucide-react";
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
    setStatusMessage("Syncing with Firestore...");
    try {
      const res = await syncCloudBatch();
      if (res.success) {
        setStatusMessage(res.message || "Synced successfully!");
        await checkStatus();
      } else {
        setStatusMessage(res.message || "Sync failed.");
      }
    } catch (err) {
      setStatusMessage("Sync error occurred.");
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

    setStatusMessage("Importing data...");
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
    <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-900/90 text-white rounded-xl shadow-lg border border-slate-800 backdrop-blur-md">
      {/* Online/Offline Status Indicator */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 text-xs font-medium border border-slate-700">
        {isOnline ? (
          <>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-400">Online (Local DB)</span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-amber-400">Offline Mode</span>
          </>
        )}
      </div>

      {/* Unsynced Badge */}
      {unsyncedCount > 0 && (
        <span className="px-2.5 py-1 text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full animate-bounce">
          {unsyncedCount} Pending
        </span>
      )}

      {/* Cloud Sync Button */}
      <button
        onClick={handleSync}
        disabled={isSyncing || !isOnline}
        title="Sync pending local data to Firestore Cloud"
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-md ${
          isSyncing || !isOnline
            ? "bg-slate-700 text-slate-400 cursor-not-allowed opacity-60"
            : "bg-blue-600 hover:bg-blue-500 text-white active:scale-95 cursor-pointer"
        }`}
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-blue-300" : ""}`} />
        <span>{isSyncing ? "Syncing..." : "Sync Cloud"}</span>
      </button>

      {/* Export Backup Button */}
      <button
        onClick={handleExport}
        title="Download JSON backup to Laptop Disk"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all active:scale-95 cursor-pointer"
      >
        <Download className="w-3.5 h-3.5 text-emerald-400" />
        <span>Export Backup</span>
      </button>

      {/* Import Backup Button */}
      <button
        onClick={handleImportClick}
        title="Restore data from JSON backup file"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all active:scale-95 cursor-pointer"
      >
        <Upload className="w-3.5 h-3.5 text-sky-400" />
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
        <span className="ml-2 text-xs font-medium text-blue-400 animate-fade-in truncate max-w-xs">
          {statusMessage}
        </span>
      )}
    </div>
  );
}
