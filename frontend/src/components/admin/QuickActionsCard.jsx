import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/state/auth.jsx";

export default function QuickActionsCard() {
  const { user } = useAuth();
  const btnCls = "justify-between rounded-lg w-full text-left";

  return (
    <Card>
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

          <Button variant="outline" className={btnCls} onClick={() => (window.location.href = "/admin/students")}>
            Student Roster ▸
          </Button>

          <Button variant="outline" className={btnCls} onClick={() => (window.location.href = "/admin/import-students")}>
            Import Students ▸
          </Button>

          <Button variant="outline" className={btnCls} onClick={() => (window.location.href = "/admin/districts/features")}>
            Feature Flags ▸
          </Button>

          {user?.hasGradebook && (
            <Button variant="outline" className={btnCls} onClick={() => (window.location.href = "/admin/gradebook/setup")}>
              Gradebook Setup ▸
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
