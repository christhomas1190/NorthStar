// ---------- Date helpers (LOCAL calendar days, no UTC shift) ----------

// Convert Date -> "YYYY-MM-DD" using local time
export function fmtDay(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function today() {
  return fmtDay(new Date());
}

// start = today - (n), end = today
export function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return fmtDay(d);
}

// take an ISO datetime or date string and return "YYYY-MM-DD"
export function dayStringFromOccurredAt(iso) {
  if (!iso) return null;
  return String(iso).slice(0, 10); // ignore time + timezone
}

// parse "YYYY-MM-DD" into a LOCAL Date (no UTC shift)
export function parseLocalDay(dateStr) {
  if (!dateStr) return null;
  const s = String(dateStr).slice(0, 10);
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
