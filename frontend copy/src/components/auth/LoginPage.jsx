import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Page from "@/components/layout/Page";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/state/auth.jsx";

const STATIC_USERS = {
  admin: { password: "Admin!2025#", role: "Admin" },
  teacher: { password: "Teach!2025#", role: "Teacher" },
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();

  const [form, setForm] = React.useState({
    username: "",
    password: "",
    districtId: "1",
    schoolId: "1",
  });
  const [err, setErr] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  function onChange(e) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setSaving(true);

    try {
      const u = (form.username || "").trim().toLowerCase();
      const pw = form.password || "";
      const record = STATIC_USERS[u];

      if (!record || record.password !== pw) {
        setErr("Invalid username or password.");
        return;
      }

      // Use existing auth.login (mock path) so it sets user + tenant context everywhere
      const res = await login({
        username: u,
        password: pw,
        districtId: form.districtId,
        schoolId: form.schoolId,
        roleOverride: record.role, // Admin or Teacher
      });

      if (!res?.ok) {
        setErr("Login failed.");
        return;
      }

      const defaultDest = record.role === "Teacher" ? "/teacher" : "/admin";
      navigate(state?.from?.pathname || defaultDest, { replace: true });
    } catch (e2) {
      setErr(String(e2.message || e2));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Page>
      <div className="mx-auto max-w-sm mt-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Sign in</span>
              <Badge variant="secondary">Static credentials</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {err && (
              <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-700 text-sm">{err}</div>
            )}
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="text-sm">Username</label>
                <Input name="username" autoFocus value={form.username} onChange={onChange} placeholder="admin or teacher" />
              </div>

              <div>
                <label className="text-sm">Password</label>
                <Input name="password" type="password" value={form.password} onChange={onChange} placeholder="Admin!2025# / Teach!2025#" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm">District ID</label>
                  <Input name="districtId" type="number" value={form.districtId} onChange={onChange} required />
                </div>
                <div>
                  <label className="text-sm">School ID</label>
                  <Input name="schoolId" type="number" value={form.schoolId} onChange={onChange} required />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Signing in…" : "Sign in"}
              </Button>

              <p className="text-xs text-slate-500 mt-1">
                This page checks credentials locally and binds your session to the District/School IDs you enter.
              </p>
            </form>

            <div className="mt-4 text-xs text-slate-500">
              <div className="font-medium">Demo credentials</div>
              <div>admin / Admin!2025# &nbsp;→&nbsp; Admin area</div>
              <div>teacher / Teach!2025# &nbsp;→&nbsp; Teacher area</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
