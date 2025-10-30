import React from "react";
import Page from "@/components/layout/Page";
import PageTabs from "@/components/layout/PageTabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function UserRoleManagement() {
  const navigate = useNavigate();
  const btn = "justify-between rounded-2xl border border-slate-300 bg-white hover:bg-slate-50";

  return (
    <Page title="User, Role & Teacher Management" subtitle="Go to the dedicated management pages">
      <PageTabs
        items={[
          { label: "Admin Dashboard", to: "/admin" },
          { label: "User & Role Management", to: "/admin/user-role-management" },
          { label: "Import Students", to: "/admin/import-students" },
          { label: "Teachers", to: "/admin/teachers" },
        ]}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Users</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-600">
              View, create, edit, and deactivate users on the dedicated Users page.
            </p>
            <Button className={btn} variant="outline" onClick={() => navigate("/admin/users")}>
              Open Users ▸
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Roles & Permissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-600">
              Define roles and fine-tune permissions on the Roles page.
            </p>
            <Button className={btn} variant="outline" onClick={() => navigate("/admin/roles")}>
              Open Roles ▸
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Teachers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-600">
              Full CRUD for teachers lives on its own page.
            </p>
            <Button className={btn} variant="outline" onClick={() => navigate("/admin/teachers")}>
              Open Teachers ▸
            </Button>
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
