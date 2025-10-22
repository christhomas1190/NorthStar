import React from "react";
import { useNavigate } from "react-router-dom";
import Page from "@/components/layout/Page";
import PageTabs from "@/components/layout/PageTabs";
import { Clock, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import KPICard from "@/components/common/KPICard";
import UserForm from "./UserForm";
import RoleForm from "./RoleForm";

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
  const isAdmin = true;
  const navigate = useNavigate();



  return (
    <Page title="Admin Dashboard" subtitle="School overview & quick actions">
      <PageTabs
        items={[
          { label: "Admin Dashboard", to: "/admin" },
          { label: "Reports & Trends", to: "/reports" },

        ]}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Overview */}
        <Card className="xl:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">School Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {KPIS.map((k) => (
                <KPICard key={k.label} {...k} />
              ))}
            </div>

            <div className="mt-6 rounded-2xl border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">30-Day Incident Trend</p>
                  <p className="text-sm text-slate-400">(Mock chart placeholder)</p>
                </div>
                <Button variant="outline" size="sm">
                  Open Full Analytics
                </Button>
              </div>
              <div className="mt-3 h-36 w-full rounded-xl bg-slate-100 grid place-content-center text-slate-400">
                Chart Area
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions + Forms */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 mb-6">
              <Button
                variant="outline"
                className="justify-between"
                onClick={() => navigate("/admin/define-behaviors")}
              >
                Define Behavior Categories ▸
              </Button>
              <Button variant="outline" className="justify-between">
                Manage Interventions ▸
              </Button>
              <Button variant="outline" className="justify-between">
                Set Escalation Rules ▸
              </Button>
             <Button
               variant="outline"
               className="justify-between"
               onClick={() => navigate("/admin/user-role-management")}
             >
               User & Student Management ▸
             </Button>
              <Button variant="outline" className="justify-between">
                Compliance Export ▸
              </Button>
            </div>

            {isAdmin && (
              <div className="mt-5 rounded-2xl border p-3 text-xs text-slate-600 flex items-start gap-2">
                <Clock size={14} className="mt-0.5" />
                <div className="w-full">
                  <p className="font-medium">Admin-only Activity Log</p>
                  <p>
                    All inputs are auto-tagged with <code>userId</code> and <code>timestamp</code>.
                  </p>
                  <div className="mt-2 max-h-28 overflow-auto rounded-lg bg-slate-50 p-2 border text-[11px]">
                    {incidents.map((it) => (
                      <div key={it.id} className="flex items-center justify-between py-1">
                        <span className="truncate">
                          [{it.date}] <b>{it.by}</b> recorded incident <b>{it.id}</b> for{" "}
                          <b>{it.student}</b>
                        </span>
                        <Badge variant="outline" className="ml-2">
                          {it.tier}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tier Info */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {tiers.map((t) => (
          <Card key={t.name} className={`border ${t.color} shadow-sm`}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Tag size={16} /> {t.name}
              </CardTitle>
            </CardHeader>
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
    </Page>
  );
}
