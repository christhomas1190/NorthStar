export async function getEscalationRules() {
  const res = await fetch("/api/escalation-rules");
  if (!res.ok) throw new Error("Failed to load escalation rules");
  return res.json();
}
export async function upsertEscalationRules(payload) {
  const res = await fetch("/api/escalation-rules", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to save escalation rules");
  return res.json();
}
