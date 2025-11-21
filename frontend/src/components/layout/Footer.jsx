import React from "react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-slate-200 bg-white mt-8">
      <div className="mx-auto max-w-6xl px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-slate-500">
        {/* Left: "NS" symbol + name */}
        <div className="flex items-center gap-2">
          {/* This is the same pill you have in the header */}
          <div className="h-9 w-9 rounded-2xl bg-slate-900 text-white grid place-content-center font-bold">
            NS
          </div>

          <div className="flex flex-col leading-tight">
            <span className="font-semibold text-slate-800">
              NorthStar Behavior
            </span>
            <span className="text-[11px] sm:text-xs text-slate-500">
              Supporting teachers, students, and schools.
            </span>
          </div>
        </div>

        {/* Right: meta */}
        <div className="flex flex-wrap items-center gap-2">
          <span>© {year} NorthStar</span>
          <span className="hidden sm:inline text-slate-300">•</span>
          <span className="text-slate-400">Admin view · v1.0</span>
        </div>
      </div>
    </footer>
  );
}