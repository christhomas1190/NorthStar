import { Badge } from "@/components/ui/badge";

export default function ActivityLog({ items = [] }) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border p-3 text-xs text-slate-500">
        No recent activity.
      </div>
    );
  }
  return (
    <div className="mt-2 max-h-28 overflow-auto rounded-lg bg-slate-50 p-2 border text-[11px]">
      {items.map((it) => (
        <div key={it.id} className="flex items-center justify-between py-1">
          <span className="truncate">
            [{it.date}] <b>{it.by}</b> recorded incident <b>{it.id}</b> for <b>{it.student}</b>
          </span>
          <Badge variant="outline" className="ml-2">{it.tier}</Badge>
        </div>
      ))}
    </div>
  );
}