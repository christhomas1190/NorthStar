import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { useAuth } from "@/state/auth.jsx";

export default function CreateIncidentPage() {
  const { studentId } = useParams();
  const nav = useNavigate();
  const { activeDistrictId, user } = useAuth();
  const [form, setForm] = useState({
    category: "",
    severity: "",
    location: "",
    description: "",
    occurredAt: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    if (!activeDistrictId) {
      setError("Please set an active district in the header first.");
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        category: form.category,
        severity: form.severity,
        location: form.location || null,
        description: form.description,
        // convert datetime-local to ISO string if provided
        occurredAt: form.occurredAt
          ? new Date(form.occurredAt).toISOString()
          : null,
          reportedBy: user?.name || user?.email || "Unknown",
      };

      const res = await fetch(`/api/students/${studentId}/incidents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-District-Id": String(activeDistrictId), // 🔑 REQUIRED
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error(
          "Failed to create incident:",
          res.status,
          res.statusText,
          text
        );
        throw new Error("Failed to create incident");
      }

      // After success, go back to the student info page
      nav(`/admin/students/${studentId}`);
    } catch (err) {
      console.error(err);
      setError(
        "Something went wrong saving the incident. Please check the district ID and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    // keep this consistent with your student details route
    nav(`/admin/students/${studentId}`);
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Create Incident</CardTitle>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Category
                </label>
                <Input
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  placeholder="Disruption, Defiance, etc."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Severity
                </label>
                <Input
                  name="severity"
                  value={form.severity}
                  onChange={handleChange}
                  placeholder="Minor, Major, Level 1, Level 2..."
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <Input
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="Classroom, Hallway, Cafeteria..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Date / Time Occurred
              </label>
              <Input
                type="datetime-local"
                name="occurredAt"
                value={form.occurredAt}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <Textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                placeholder="Briefly describe what happened..."
                required
              />
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save Incident"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
