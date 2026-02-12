import React from "react";
import { Clock } from "lucide-react";

export default function RecentActivity({ items }) {
  return (
    <div className="mt-5 w-full max-w-[420px] mx-auto rounded-2xl border p-4 text-xs text-slate-600">

      {/* Header Row */}
      <div className="flex items-center gap-2 mb-3">
        <Clock size={16} />
        <p className="font-semibold text-sm">Recent Activity</p>
      </div>

      {/* Activity Box */}
      <div className="max-h-48 overflow-auto rounded-xl bg-slate-50 p-3 border text-[12px]">
        {items.length === 0 && (
          <div className="py-3 text-center text-slate-500">
            No recent incidents in range.
          </div>
        )}

        {items.map((it) => (
          <div
            key={it.id}
            className="py-2 border-b last:border-b-0"
          >
            <div className="text-slate-500">
              [{it.when}]
            </div>

            <div className="mt-1">
              <span className="font-medium">{it.by}</span>{" "}
              recorded{" "}
              <span className="font-semibold">{it.category}</span>{" "}
              <span className="text-slate-500">
                ({it.severity})
              </span>
            </div>

            <div className="text-slate-400">
              Student #{it.studentId}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
