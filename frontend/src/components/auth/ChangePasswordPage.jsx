import React from "react";
import { useNavigate } from "react-router-dom";
import Page from "@/components/layout/Page";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/state/auth.jsx";
import { postJSON } from "@/lib/api.js";

export default function ChangePasswordPage() {
  const { user, updateToken, clearMustChangePassword } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = React.useState({ newPassword: "", confirm: "" });
  const [err, setErr] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  // If not logged in, go to login
  if (!user) {
    navigate("/login", { replace: true });
    return null;
  }

  // If already changed password, go to dashboard
  if (!user.mustChangePassword) {
    const dest = user.role === "Teacher" ? "/teacher" : "/admin";
    navigate(dest, { replace: true });
    return null;
  }

  function onChange(e) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setErr("");

    if (form.newPassword.length < 8) {
      setErr("Password must be at least 8 characters.");
      return;
    }
    if (!/[0-9]/.test(form.newPassword)) {
      setErr("Password must contain at least 1 number.");
      return;
    }
    if (!/[!@#$%^&*()\-_=+[\]{};':"\\|,.<>/?]/.test(form.newPassword)) {
      setErr("Password must contain at least 1 special character.");
      return;
    }
    if (form.newPassword !== form.confirm) {
      setErr("Passwords do not match.");
      return;
    }

    setSaving(true);
    try {
      await postJSON("/api/auth/change-password", { newPassword: form.newPassword });

      // Rebuild token with new password (HTTP Basic encodes credentials)
      const newToken = "Basic " + btoa(user.id + ":" + form.newPassword);
      updateToken(newToken);
      clearMustChangePassword();

      const dest = user.role === "Teacher" ? "/teacher" : "/admin";
      navigate(dest, { replace: true });
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
            <CardTitle>Set a new password</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--ns-text-muted,#6b7280)] mb-2">
              Your account requires a password change before you can continue.
            </p>
            <ul className="mb-4 space-y-1">
              {[
                { label: "At least 8 characters", test: (p) => p.length >= 8 },
                { label: "At least 1 number", test: (p) => /[0-9]/.test(p) },
                { label: "At least 1 special character", test: (p) => /[!@#$%^&*()\-_=+[\]{};':"\\|,.<>/?]/.test(p) },
              ].map((rule) => {
                const met = rule.test(form.newPassword);
                return (
                  <li key={rule.label} className={`flex items-center gap-1.5 text-xs ${met ? "text-emerald-600" : "text-[var(--ns-text-muted,#9ca3af)]"}`}>
                    <span className="text-[10px]">{met ? "✓" : "○"}</span>
                    {rule.label}
                  </li>
                );
              })}
            </ul>
            {err && (
              <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-700 text-sm">{err}</div>
            )}
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="text-sm">New password</label>
                <Input
                  name="newPassword"
                  type="password"
                  autoFocus
                  value={form.newPassword}
                  onChange={onChange}
                  placeholder="At least 8 characters"
                />
              </div>
              <div>
                <label className="text-sm">Confirm password</label>
                <Input
                  name="confirm"
                  type="password"
                  value={form.confirm}
                  onChange={onChange}
                  placeholder="Repeat new password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Saving…" : "Set password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
