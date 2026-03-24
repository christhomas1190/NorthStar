import React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Page from "@/components/layout/Page";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { postJSON } from "@/lib/api.js";

const RULES = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "At least 1 number", test: (p) => /[0-9]/.test(p) },
  { label: "At least 1 special character", test: (p) => /[!@#$%^&*()\-_=+[\]{};':"\\|,.<>/?]/.test(p) },
];

function RuleIndicator({ password }) {
  return (
    <ul className="mt-2 space-y-1">
      {RULES.map((rule) => {
        const met = rule.test(password);
        return (
          <li key={rule.label} className={`flex items-center gap-1.5 text-xs ${met ? "text-emerald-600" : "text-[var(--ns-text-muted,#9ca3af)]"}`}>
            <span className="text-[10px]">{met ? "✓" : "○"}</span>
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [form, setForm] = React.useState({ newPassword: "", confirm: "" });
  const [err, setErr] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  if (!token) {
    return (
      <Page>
        <div className="mx-auto max-w-sm mt-12">
          <Card>
            <CardHeader><CardTitle>Invalid link</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-[var(--ns-text-muted,#6b7280)] mb-3">
                This reset link is missing a token. Please request a new one.
              </p>
              <Link to="/forgot-password" className="text-sm text-[var(--ns-accent)] hover:underline">
                Request a new reset link
              </Link>
            </CardContent>
          </Card>
        </div>
      </Page>
    );
  }

  function onChange(e) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  }

  function validate() {
    for (const rule of RULES) {
      if (!rule.test(form.newPassword)) return rule.label + " is required.";
    }
    if (form.newPassword !== form.confirm) return "Passwords do not match.";
    return null;
  }

  async function submit(e) {
    e.preventDefault();
    setErr("");
    const validationErr = validate();
    if (validationErr) { setErr(validationErr); return; }

    setLoading(true);
    try {
      await postJSON("/api/auth/reset-password", { token, newPassword: form.newPassword });
      navigate("/login?reset=1", { replace: true });
    } catch (e2) {
      const msg = String(e2.message || e2);
      if (msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("expired")) {
        setErr("This reset link is invalid or has expired.");
      } else {
        setErr(msg);
      }
    } finally {
      setLoading(false);
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
            <p className="text-sm text-[var(--ns-text-muted,#6b7280)] mb-4">
              Choose a strong password for your account.
            </p>
            {err && (
              <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-700 text-sm">
                {err}
                {(err.includes("invalid") || err.includes("expired")) && (
                  <div className="mt-1">
                    <Link to="/forgot-password" className="underline">Request a new link</Link>
                  </div>
                )}
              </div>
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
                  placeholder="Min 8 chars, 1 number, 1 special"
                />
                <RuleIndicator password={form.newPassword} />
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
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Saving…" : "Set password"}
              </Button>
            </form>
            <div className="mt-3 text-center">
              <Link to="/login" className="text-sm text-[var(--ns-accent)] hover:underline">
                Back to sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
