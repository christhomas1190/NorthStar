import React from "react";
import { Link } from "react-router-dom";
import Page from "@/components/layout/Page";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { postJSON } from "@/lib/api.js";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await postJSON("/api/auth/forgot-password", { email: email.trim() });
    } catch (_) {
      // Ignore errors — we always show the same message
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  }

  return (
    <Page>
      <div className="mx-auto max-w-sm mt-12">
        <Card>
          <CardHeader>
            <CardTitle>Forgot password</CardTitle>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-800 text-sm">
                  If that email is registered, you'll receive a reset link shortly. Check your inbox (and spam folder).
                </div>
                <Link to="/login" className="text-sm text-[var(--ns-accent)] hover:underline">
                  Back to sign in
                </Link>
              </div>
            ) : (
              <>
                <p className="text-sm text-[var(--ns-text-muted,#6b7280)] mb-4">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
                <form onSubmit={submit} className="space-y-3">
                  <div>
                    <label className="text-sm">Email address</label>
                    <Input
                      type="email"
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Sending…" : "Send reset link"}
                  </Button>
                </form>
                <div className="mt-3 text-center">
                  <Link to="/login" className="text-sm text-[var(--ns-accent)] hover:underline">
                    Back to sign in
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
