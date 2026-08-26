"use client";

import React from "react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 font-sans p-6">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl max-w-md text-center">
        <h2 className="text-2xl font-black text-slate-900 mb-2">404 - Page Not Found</h2>
        <p className="text-xs text-slate-500 mb-6">The requested page could not be found.</p>
        <Link
          href="/dashboard"
          className="inline-block px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-all"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
