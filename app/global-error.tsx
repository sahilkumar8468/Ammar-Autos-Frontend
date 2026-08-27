"use client";

import React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-sans p-6">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl max-w-md text-center">
          <h2 className="text-xl font-bold text-rose-500 mb-2">Something went wrong!</h2>
          <p className="text-xs text-slate-400 mb-6">{error?.message || "An unexpected error occurred."}</p>
          <button
            onClick={() => reset?.()}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
