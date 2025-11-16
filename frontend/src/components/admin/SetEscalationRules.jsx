import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/state/auth.jsx";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const DEFAULTS = Object.freeze({
  tier1WindowDays: 14,
  reviewEveryDays: 10,
  sameCautionDetentionThreshold: 4,
  mixedCautionDetentionThreshold: 6,
  sameCautionTier2Threshold: 8,
  detentionLabel: "Saturday detention",
  detentionDurationDays: 1,
  tier2Label: "Escalate to Tier 2",
  tier2DurationDays: 10,
  tier1MajorToTier2: 1,
  tier2NoResponseCount: 3,
  tier2MajorToTier3: 2,
  requireParentContact: true,
  requireAdminApproval: false,
  notifyRoles: "Admin,Counselor",
  decayCount: 1,
  decayDays: 7,
});

const clampInt = (n, min = 0, fallback = 0) => {
  const v = Number.isFinite(+n) ? Math.trunc(+n) : fallback;
  return Math.max(min, v);
};

export default function SetEscalationRules() {
  const { activeDistrictId, activeSchoolId } = useAuth();

  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rules, setRules] = useState({ ...DEFAULTS });
  const [initial, setInitial] = useState({ ...DEFAULTS });

  useEffect(() => {
    if (!activeDistrictId || !activeSchoolId) {
      setLoaded(true);
      return;
    }
    let alive = true;
    (async () => {
      try {
        const res = await fetch(
          `/api/escalation-rules?schoolId=${encodeURIComponent(activeSchoolId)}`,
          {
            headers: {
              "X-District-Id": String(activeDistrictId),
              "Content-Type": "application/json",
            },
          }
        );
        if (res.ok) {
          const data = await res.json();
          if (!alive) return;
          setRules((r) => ({ ...r, ...data }));
          setInitial((r) => ({ ...r, ...data }));
        }
      } catch {
      } finally {
        if (alive) setLoaded(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [activeDistrictId, activeSchoolId]);

  const errors = useMemo(() => {
    const e = {};
    if (rules.tier1WindowDays < 1) e.tier1WindowDays = "Must be ≥ 1 day.";
    if (rules.reviewEveryDays < 1) e.reviewEveryDays = "Must be ≥ 1 day.";
    if (rules.sameCautionDetentionThreshold < 1) e.sameCautionDetentionThreshold = "Must be ≥ 1.";
    if (rules.mixedCautionDetentionThreshold < 1) e.mixedCautionDetentionThreshold = "Must be ≥ 1.";
    if (rules.sameCautionTier2Threshold < 1) e.sameCautionTier2Threshold = "Must be ≥ 1.";
    if (rules.sameCautionTier2Threshold <= rules.sameCautionDetentionThreshold)
      e.sameCautionTier2Threshold = "Tier 2 should be higher than detention threshold.";
    if (rules.tier1MajorToTier2 < 0) e.tier1MajorToTier2 = "Cannot be negative.";
    if (rules.tier2NoResponseCount < 0) e.tier2NoResponseCount = "Cannot be negative.";
    if (rules.tier2MajorToTier3 < 0) e.tier2MajorToTier3 = "Cannot be negative.";
    if (rules.detentionDurationDays < 0) e.detentionDurationDays = "Cannot be negative.";
    if (rules.tier2DurationDays < 0) e.tier2DurationDays = "Cannot be negative.";
    if (rules.decayCount < 0) e.decayCount = "Cannot be negative.";
    if (rules.decayDays < 0) e.decayDays = "Cannot be negative.";
    return e;
  }, [rules]);

  const isDirty = useMemo(
    () => JSON.stringify(rules) !== JSON.stringify(initial),
    [rules, initial]
  );
  const isValid = Object.keys(errors).length === 0;

  const onNum = (name, min = 0) => (e) =>
    setRules((r) => ({ ...r, [name]: clampInt(e.target.value, min, r[name]) }));
  const onText = (name) => (e) => setRules((r) => ({ ...r, [name]: e.target.value }));
  const onToggle = (name) => (e) => setRules((r) => ({ ...r, [name]: e.target.checked }));

  const onRestoreDefaults = () => setRules({ ...DEFAULTS });
  const onCancel = () => setRules(initial);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return alert("Please fix the highlighted fields before saving.");
    if (!activeDistrictId || !activeSchoolId) return alert("Select a District & School first.");
    setSaving(true);
    try {
      const res = await fetch(
        `/api/escalation-rules?schoolId=${encodeURIComponent(activeSchoolId)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-District-Id": String(activeDistrictId),
          },
          body: JSON.stringify(rules),
        }
      );
      if (!res.ok) throw new Error("Save failed");
      const saved = await res.json();
      setRules((r) => ({ ...r, ...saved }));
      setInitial((r) => ({ ...r, ...saved }));
      alert("Rules saved.");
    } catch (err) {
      alert(err.message || "Could not save rules.");
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) {
    return <div className="p-6 text-sm text-slate-600">Loading escalation rules…</div>;
  }

  const Field = ({ label, name, type = "number", min = 0, placeholder, className = "" }) => (
    <div className={`space-y-1 ${className}`}>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <Input
        type={type}
        name={name}
        min={type === "number" ? min : undefined}
        value={rules[name]}
        onChange={type === "number" ? onNum(name, min) : onText(name)}
        placeholder={placeholder}
        className={errors[name] ? "border-rose-300 focus-visible:ring-rose-300" : ""}
      />
      <div className="h-4">
        {errors[name] && <p className="text-xs text-rose-600">{errors[name]}</p>}
      </div>
    </div>
  );

  return (
    <Card className="p-6">
      <CardHeader>
        <h1 className="text-xl font-semibold">Set Escalation Rules</h1>
        <p className="text-sm text-slate-600">
          Fill in the blanks to define your policy. The sentences below update live to read like a handbook.
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={onSubmit} className="space-y-8">
          <section className="space-y-3">
            <h2 className="font-medium">Rule 1 — Same Caution → {rules.detentionLabel}</h2>
            <div className="rounded-xl border p-4 bg-slate-50">
              <p className="text-sm">
                If a student gets <b>{rules.sameCautionDetentionThreshold}</b> of the <b>same cautions</b> in{" "}
                <b>{rules.tier1WindowDays}</b> days, then they will receive <b>{rules.detentionLabel}</b>
                {rules.detentionDurationDays ? <> for <b>{rules.detentionDurationDays}</b> day(s)</> : null}.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Field label="Same-caution threshold" name="sameCautionDetentionThreshold" min={1} placeholder="e.g., 4" />
              <Field label="Rolling window (days)" name="tier1WindowDays" min={1} placeholder="e.g., 14" />
              <Field label="Consequence label" name="detentionLabel" type="text" placeholder="Saturday detention" />
              <Field label="Consequence duration (days)" name="detentionDurationDays" min={0} placeholder="e.g., 1" />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-medium">Rule 2 — Mixed Cautions → {rules.detentionLabel}</h2>
            <div className="rounded-xl border p-4 bg-slate-50">
              <p className="text-sm">
                Any <b>{rules.mixedCautionDetentionThreshold}</b> cautions (mixed types) within <b>{rules.tier1WindowDays}</b> days
                constitute the same and result in <b>{rules.detentionLabel}</b>
                {rules.detentionDurationDays ? <> for <b>{rules.detentionDurationDays}</b> day(s)</> : null}.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Field label="Mixed-caution threshold" name="mixedCautionDetentionThreshold" min={1} placeholder="e.g., 6" />
              <Field label="Consequence label" name="detentionLabel" type="text" placeholder="Saturday detention" />
              <Field label="Consequence duration (days)" name="detentionDurationDays" min={0} placeholder="e.g., 1" />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-medium">Rule 3 — Same Caution → Tier Escalation</h2>
            <div className="rounded-xl border p-4 bg-slate-50">
              <p className="text-sm">
                <b>{rules.sameCautionTier2Threshold}</b> of the <b>same</b> cautions within <b>{rules.tier1WindowDays}</b> days
                constitutes <b>{rules.tier2Label}</b>
                {rules.tier2DurationDays ? <> for <b>{rules.tier2DurationDays}</b> day(s)</> : null}.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Field label="Same-caution → Tier threshold" name="sameCautionTier2Threshold" min={1} placeholder="e.g., 8" />
              <Field label="Tier action label" name="tier2Label" type="text" placeholder="Escalate to Tier 2" />
              <Field label="Tier action duration (days)" name="tier2DurationDays" min={0} placeholder="e.g., 10" />
              <Field label="Rolling window (days)" name="tier1WindowDays" min={1} />
            </div>
          </section>

          <section className="rounded-xl border p-4 bg-slate-50">
            <p className="text-sm">
              If both same-caution and mixed-caution detention triggers fire at once, assign one detention.
              If a student receives two detentions within the window, the next consequence is at administrator discretion.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-medium">Rule 4 — Caution Decay (Weekdays Only)</h2>
            <div className="rounded-xl border p-4 bg-slate-50">
              <p className="text-sm">
                Students will lose <b>{rules.decayCount}</b> caution(s) if they do not receive a new caution for{" "}
                <b>{rules.decayDays}</b> consecutive <b>weekday</b>(s).
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Field label="Lose this many cautions" name="decayCount" min={0} placeholder="e.g., 1" />
              <Field label="After this many clean weekdays" name="decayDays" min={0} placeholder="e.g., 7" />
              <Field label="Review every (days)" name="reviewEveryDays" min={1} placeholder="e.g., 10" />
              <Field label="Notify roles" name="notifyRoles" type="text" placeholder="Admin,Counselor" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Require Parent Contact</label>
                <div>
                  <input
                    type="checkbox"
                    checked={!!rules.requireParentContact}
                    onChange={onToggle("requireParentContact")}
                  />{" "}
                  <span className="text-sm text-slate-700">Yes</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Require Admin Approval</label>
                <div>
                  <input
                    type="checkbox"
                    checked={!!rules.requireAdminApproval}
                    onChange={onToggle("requireAdminApproval")}
                  />{" "}
                  <span className="text-sm text-slate-700">Yes</span>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-medium">Legacy MTSS Options (optional)</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Field label="Majors to Tier 2" name="tier1MajorToTier2" min={0} placeholder="e.g., 1" />
              <Field label="Failed Tier 2 interventions" name="tier2NoResponseCount" min={0} placeholder="e.g., 3" />
              <Field label="Majors to Tier 3" name="tier2MajorToTier3" min={0} placeholder="e.g., 2" />
            </div>
          </section>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="submit"
              disabled={!isDirty || !isValid || saving}
              className={!isDirty || !isValid || saving ? "opacity-60 cursor-not-allowed" : ""}
            >
              {saving ? "Saving..." : "Save Rules"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={!isDirty || saving}>
              Cancel
            </Button>
            <Button type="button" variant="outline" onClick={onRestoreDefaults} disabled={saving} className="ml-0 sm:ml-auto">
              Restore Recommended Defaults
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
