import React from "react";
import { BarChart3, Users, ClipboardList, FileDown, Clock, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import KPICard from "@/components/common/KPICard";

const KPIS = [
  { label: "Active Students", value: 742, hint: "All grades" },
  { label: "Incidents (30d)", value: 128, hint: "+5 vs last wk" },
  { label: "Tier 2", value: 54, hint: "Targeted supports" },
  { label: "Tier 3", value: 17, hint: "Intensive supports" },
];

const incidents = [
  { id: "I-5581", student: "Marcus Lee", type: "Disruption", tier: "Tier 2", date: "2025-09-20 10:21", by: "t_45 (Ms. Carter)" },
  { id: "I-5579", student: "Sofia Perez", type: "Peer conflict", tier: "Tier 3", date: "2025-09-18 13:09", by: "t_22 (Mr. Hill)" },
];

const tiers = [
  { name: "Tier 1", desc: "Universal supports", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { name: "Tier 2", desc: "Targeted small-group supports", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { name: "Tier 3", desc: "Intensive individualized supports", color: "bg-rose-50 text-rose-700 border-rose-200" },
];

export default function AdminDashboard() {
  return (
    <div className="min-h-screen w-full">
      {/* Tabs only (no header here) */}
      <Tabs defaultValue="admin">
        <TabsList className="grid grid-cols-4 w-full md:w-[720px]">
          <TabsTrigger value="admin" className="gap-2"><BarChart3 size={16}/> Admin Dashboard</TabsTrigger>
          <TabsTrigger value="teacher" className="gap-2"><ClipboardList size={16}/> Teacher Console</TabsTrigger>
          <TabsTrigger value="student" className="gap-2"><Users size={16}/> Student Profile</TabsTrigger>
          <TabsTrigger value="reports" className="gap-2"><FileDown size={16}/> Reports & Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="admin" className="mt-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Card className="xl:col-span-2 shadow-sm">
              <CardHeader><CardTitle className="text-lg">School Overview</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {KPIS.map(k => <KPICard key={k.label} {...k} />)}
                </div>

                <div className="mt-6 rounded-2xl border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">30-Day Incident Trend</p>
                      <p className="text-sm text-slate-400">(Mock chart placeholder)</p>
                    </div>
                    <Button variant="outline" size="sm">Open Full Analytics</Button>
                  </div>
                  <div className="mt-3 h-36 w-full rounded-xl bg-slate-100 grid place-content-center text-slate-400">Chart Area</div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-lg">Quick Actions</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  <Button variant="outline" className="justify-between">Define Behavior Categories ▸</Button>
                  <Button variant="outline" className="justify-between">Manage Interventions ▸</Button>
                  <Button variant="outline" className="justify-between">Set Escalation Rules ▸</Button>
                  <Button variant="outline" className="justify-between">User & Role Management ▸</Button>
                  <Button variant="outline" className="justify-between">Compliance Export ▸</Button>
                </div>

                <div className="mt-5 rounded-2xl border p-3 text-xs text-slate-600 flex items-start gap-2">
                  <Clock size={14} className="mt-0.5"/>
                  <div className="w-full">
                    <p className="font-medium">Admin-only Activity Log</p>
                    <p>All inputs are auto-tagged with <code>userId</code> and <code>timestamp</code>.</p>
                    <div className="mt-2 max-h-28 overflow-auto rounded-lg bg-slate-50 p-2 border text-[11px]">
                      {incidents.map(it => (
                        <div key={it.id} className="flex items-center justify-between py-1">
                          <span className="truncate">[{it.date}] <b>{it.by}</b> recorded incident <b>{it.id}</b> for <b>{it.student}</b></span>
                          <Badge variant="outline" className="ml-2">{it.tier}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {tiers.map(t => (
              <Card key={t.name} className={`border ${t.color} shadow-sm`}>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Tag size={16}/> {t.name}</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm opacity-80">{t.desc}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="outline">Examples</Badge>
                    <Badge variant="outline">Entry Criteria</Badge>
                    <Badge variant="outline">Progress Monitor</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Stubs for other tabs */}
        <TabsContent value="teacher" className="mt-6"><div className="rounded-2xl border bg-white p-4">Teacher Console (stub)</div></TabsContent>
        <TabsContent value="student" className="mt-6"><div className="rounded-2xl border bg-white p-4">Student Profile (stub)</div></TabsContent>
        <TabsContent value="reports" className="mt-6"><div className="rounded-2xl border bg-white p-4">Reports & Trends (stub)</div></TabsContent>
      </Tabs>
    </div>
  );
}
