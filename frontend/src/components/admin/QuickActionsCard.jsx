import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function QuickActionsCard() {
  const btnCls =
    "justify-between rounded-2xl border border-slate-300 bg-white hover:bg-slate-50";

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 mb-6">
          <Button variant="outline" className={btnCls} onClick={() => (window.location.href = "/admin/define-behaviors")}>
            Define Behavior Categories ▸
          </Button>

          <Button variant="outline" className={btnCls} onClick={() => (window.location.href = "/admin/interventions")}>
            Manage Interventions ▸
          </Button>

          <Button variant="outline" className={btnCls} onClick={() => (window.location.href = "/admin/escalation-rules")}>
            Set Escalation Rules ▸
          </Button>

          <Button variant="outline" className={btnCls} onClick={() => (window.location.href = "/admin/user-role-management")}>
            User & Student Management ▸
          </Button>

          <Button variant="outline" className={btnCls} onClick={() => (window.location.href = "/admin/import-students")}>
            Import Students ▸
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
