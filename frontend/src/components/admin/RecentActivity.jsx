import React from "react";
import { Clock } from "lucide-react";

export default function RecentActivity({ items }) {
  return (
    <div className="mt-5 rounded-2xl border p-3 text-xs text-slate-600 flex items-start gap-2">
      <Clock size={14} className="mt-0.5" />
      <div className="w-full">
        <p className="font-medium">Recent Activity</p>
        <div className="mt-2 max-h-40 overflow-auto rounded-lg bg-slate-50 p-2 border text-[11px]">
          {items.map((it) => (
            <div key={it.id} className="flex items-center justify-between py-1">
              <span className="truncate">
                [{it.when}] <b>{it.by}</b> recorded <b>{it.category}</b> ({it.severity}) for student #{it.studentId} (id {it.id})
              </span>
            </div>
          ))}

          {items.length === 0 && (
            <div className="py-2 text-slate-500">No recent incidents in range.</div>
          )}
        </div>
      </div>
    </div>
  );
}
