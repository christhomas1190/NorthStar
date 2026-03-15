import { getJSON, postJSON } from "@/lib/api.js";

export async function getEscalationRules() {
  return getJSON("/api/escalation-rules");
}
export async function upsertEscalationRules(payload) {
  return postJSON("/api/escalation-rules", payload);
}
