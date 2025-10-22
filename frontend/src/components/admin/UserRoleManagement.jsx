import React from "react";
import Page from "@/components/layout/Page";
import PageTabs from "@/components/layout/PageTabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import UserForm from "./UserForm";
import RoleForm from "./RoleForm";

export default function UserRoleManagement() {
  const createUser = async (payload) => {
    console.log("create user =>", payload);
    // POST /api/users
  };

  const createRole = async (payload) => {
    console.log("create role =>", payload);
    // POST /api/roles
  };

  return (
    <Page title="User & Role Management" subtitle="Add users and define roles & permissions">
      <PageTabs
        items={[
          { label: "Admin Dashboard", to: "/admin" },
          { label: "User & Role Management", to: "/admin/user-role-management" },
          { label: "Import Students", to: "/admin/import-students" },
        ]}
      />

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">New User</CardTitle>
          </CardHeader>
          <CardContent>
            <UserForm onSubmit={createUser} />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">New Role</CardTitle>
          </CardHeader>
          <CardContent>
            <RoleForm onSubmit={createRole} />
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
