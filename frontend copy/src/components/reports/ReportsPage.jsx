import React, { useMemo, useState } from "react";
import Page from "@/components/layout/Page";
import PageTabs from "@/components/layout/PageTabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { FileDown, Filter, BarChart3 } from "lucide-react";

// Mock rows — swap with API later
const RAW = [
  { id: "I-5581", student: "Marcus Lee", category: "Disruption", tier: "Tier 2", date: "2025-09-20 10:21", by: "t_45 (Ms. Carter)" },
  { id: "I-5579", student: "Sofia Perez", category: "Peer Conflict", tier: "Tier 3", date: "2025-09-18 13:09", by: "t_22 (Mr. Hill)" },
  { id: "I-5575", student: "David Chen", category: "Defiance", tier: "Tier 1", date: "2025-09-15 09:44", by: "t_03 (Ms. Park)" },
];

export default function ReportsPage() {
  const [from, setFrom] = useState(() => new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10));
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return RAW.filter(r =>
      !term ||
      r.student.toLowerCase().includes(term) ||
      r.category.toLowerCase().includes(term) ||
      r.id.toLowerCase().includes(term)
    );
  }, [q]);

  function exportCSV() {
    const header = ["id","student","category","tier","date","by"].join(",");
    const body = rows.map(r => [r.id, r.student, r.category, r.tier, r.date, r.by].join(",")).join("\n");
    const blob = new Blob([header + "\n" + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `incidents_${from}_to_${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Page
      title="Reports & Trends"
      subtitle="Filters, trends, and exports for incidents"
      actions={
        <Button variant="outline" onClick={exportCSV}>
          <FileDown size={16} className="mr-2" /> Export CSV
        </Button>
      }
    >
      {/* Pill tabs under the page header */}
      <PageTabs
        items={[
          { label: "Admin Dashboard", to: "/admin" },
          { label: "Reports & Trends", to: "/reports" },
        ]}
      />

      {/* Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filters */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-base">Filters</CardTitle>
            <Badge variant="outline" className="gap-1">
              <Filter size={14} /> Basic
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-600">From</label>
                <Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-600">To</label>
                <Input type="date" value={to} onChange={e => setTo(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-600">Search</label>
                <Input placeholder="Student, category, or ID…" value={q} onChange={e => setQ(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trend (placeholder) */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-base">30-Day Trend</CardTitle>
            <Badge variant="outline" className="gap-1">
              <BarChart3 size={14} /> Mock
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="h-36 w-full rounded-xl bg-slate-100 grid place-content-center text-slate-400">
              Chart Area
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
              <div><div className="text-slate-500">Incidents</div><div className="font-semibold">128</div></div>
              <div><div className="text-slate-500">Tier 2</div><div className="font-semibold">54</div></div>
              <div><div className="text-slate-500">Tier 3</div><div className="font-semibold">17</div></div>
            </div>
          </CardContent>
        </Card>

        {/* Results table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <TR className="text-left text-slate-600 border-b">
                    <TH>Incident</TH>
                    <TH>Student</TH>
                    <TH>Category</TH>
                    <TH>Tier</TH>
                    <TH>Date</TH>
                    <TH>By</TH>
                  </TR>
                </THead>
                <TBody>
                  {rows.map(r => (
                    <TR key={r.id} className="border-b last:border-0">
                      <TD className="font-medium text-slate-800">{r.id}</TD>
                      <TD>{r.student}</TD>
                      <TD>{r.category}</TD>
                      <TD><Badge variant="outline">{r.tier}</Badge></TD>
                      <TD>{r.date}</TD>
                      <TD>{r.by}</TD>
                    </TR>
                  ))}
                  {rows.length === 0 && (
                    <TR>
                      <TD colSpan={6} className="py-6 text-slate-500">
                        No results for the selected filters.
                      </TD>
                    </TR>
                  )}
                </TBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Exports */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Exports</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={exportCSV}>
              <FileDown size={16} className="mr-2" /> CSV (incidents)
            </Button>
            <Button variant="outline" disabled>
              <FileDown size={16} className="mr-2" /> PDF (coming soon)
            </Button>
            <Button variant="outline" disabled>
              <FileDown size={16} className="mr-2" /> XLSX (coming soon)
            </Button>
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
