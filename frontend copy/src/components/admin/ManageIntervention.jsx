import { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function ManageIntervention() {
  const [form, setForm] = useState({
    title: "",
    tier: "Tier 1",
    description: "",
    suggestions: "",
    frequency: "Weekly",
    responsibleRole: "Teacher"
  });

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = (e) => {
    e.preventDefault();
    // TODO: POST to /api/intervention
    console.log("Save intervention", form);
  };

  return (
    <Card className="p-6">
      <CardHeader>
        <h1 className="text-xl font-semibold">Manage Interventions</h1>
        <p className="text-sm text-slate-600">
          Add strategies and best-practice steps admins want teachers to use.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input name="title" placeholder="Intervention Title" value={form.title} onChange={onChange} required />
          <Input name="tier" placeholder="Tier (Tier 1, Tier 2, Tier 3)" value={form.tier} onChange={onChange} />
          <Textarea name="description" placeholder="Description / rationale" value={form.description} onChange={onChange} />
          <Textarea name="suggestions" placeholder="Suggested actions / script for staff" value={form.suggestions} onChange={onChange} />
          <div className="grid grid-cols-2 gap-3">
            <Input name="frequency" placeholder="Follow-up Frequency" value={form.frequency} onChange={onChange} />
            <Input name="responsibleRole" placeholder="Responsible Role (Teacher/Counselor/Admin)" value={form.responsibleRole} onChange={onChange} />
          </div>
          <Button type="submit" className="w-full">Save Intervention</Button>
        </form>
      </CardContent>
    </Card>
  );
}
