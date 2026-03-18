import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Page from "@/components/layout/Page";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/state/auth.jsx";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();

  const [form, setForm] = React.useState({ username: "", password: "" });
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
      const res = await login({
        username: (form.username || "").trim(),
        password: form.password || "",
      });

      if (!res?.ok) {
        setErr("Invalid username or password.");
        return;
      }

      const role = res.role || "Admin";
      const defaultDest = role === "Teacher" ? "/teacher" : "/admin";
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
            <CardTitle>Sign in</CardTitle>
          </CardHeader>
          <CardContent>
            {err && (
              <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-700 text-sm">{err}</div>
            )}
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="text-sm">Username</label>
                <Input name="username" autoFocus value={form.username} onChange={onChange} placeholder="Username" />
              </div>
              <div>
                <label className="text-sm">Password</label>
                <Input name="password" type="password" value={form.password} onChange={onChange} placeholder="Password" />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
