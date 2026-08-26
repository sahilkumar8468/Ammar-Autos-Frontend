"use client";

import React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error?: Error & { digest?: string };
  reset?: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 font-sans p-6">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl max-w-md text-center">
          <h2 className="text-xl font-bold text-rose-600 mb-2">Something went wrong!</h2>
          <p className="text-xs text-slate-500 mb-6">{error?.message || "An unexpected error occurred."}</p>
          {reset && (
            <button
              onClick={() => reset()}
              className="px-5 py-2.5 bg-slate-900 text-white font-semibold text-xs rounded-xl hover:bg-slate-800 transition-all"
            >
              Try Again
            </button>
          )}
        </div>
      </body>
    </html>
  );
}
