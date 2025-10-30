import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Page from "@/components/layout/Page";
import PageTabs from "@/components/layout/PageTabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminTeacherCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null); // { id, firstName, lastName, email, username }
  const [addAnother, setAddAnother] = useState(false);

  function update(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    setCreated(null);
    try {
      const r = await fetch("/api/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
        }),
      });
      if (!r.ok) {
        const msg = await r.text();
        throw new Error(msg || `Failed with status ${r.status}`);
      }
      const data = await r.json();
      setCreated(data);
      if (addAnother) {
        setForm({ firstName: "", lastName: "", email: "" });
      } else {
        // navigate("/admin/teachers"); // enable if you want an auto-redirect
      }
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Page title="Add Teacher" subtitle="Create a teacher account (username auto-generated)">
      <PageTabs
        items={[
          { label: "Admin Dashboard", to: "/admin" },
          { label: "Teachers", to: "/admin/teachers" },
          { label: "Add Teacher", to: "/admin/teachers/new" },
        ]}
      />

      <div className="max-w-2xl">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Teacher Details</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-700 text-sm">
                {error}
              </div>
            )}
            {created && (
              <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-800 text-sm">
                <div className="font-medium">Teacher created</div>
                <div className="text-xs opacity-80">
                  Username: <code>{created.username}</code> (password set to admin default)
                </div>
              </div>
            )}

            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  name="firstName"
                  placeholder="First name"
                  value={form.firstName}
                  onChange={update}
                  required
                />
                <Input
                  name="lastName"
                  placeholder="Last name"
                  value={form.lastName}
                  onChange={update}
                  required
                />
              </div>
              <Input
                name="email"
                type="email"
                placeholder="Email (school)"
                value={form.email}
                onChange={update}
                required
              />

              <p className="text-xs text-slate-500">
                Username is generated as first initial + last name. If taken, we'll try first two letters + last name, then add a number.
              </p>

              <div className="flex items-center justify-between gap-3 pt-1">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={addAnother}
                    onChange={(e) => setAddAnother(e.target.checked)}
                  />
                  Add another after saving
                </label>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => navigate("/admin/teachers")}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-4 text-xs text-slate-500">
          The default password is configured by the administrator in the server settings and is not shown here.
        </div>
      </div>
    </Page>
  );
}
