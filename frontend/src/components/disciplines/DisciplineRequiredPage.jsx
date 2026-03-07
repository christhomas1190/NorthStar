import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import Page from "@/components/layout/Page";
import PageTabs from "@/components/layout/PageTabs";
import { useAuth } from "@/state/auth.jsx";
import { getJSON } from "@/lib/api.js";

export default function DisciplineRequiredPage() {
  const { activeSchoolId } = useAuth();
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState(null); // { studentId, x, y, lines }

  useEffect(() => {
    if (!activeSchoolId) return;
    (async () => {
      setLoading(true);
      const [alertsData, incidentsData] = await Promise.all([
        getJSON(`/api/escalation-rules/alerts?schoolId=${activeSchoolId}`).catch(() => []),
        getJSON("/api/incidents").catch(() => []),
      ]);
      setAlerts(Array.isArray(alertsData) ? alertsData : []);
      setIncidents(Array.isArray(incidentsData) ? incidentsData : []);
      setLoading(false);
    })();
  }, [activeSchoolId]);

  // Group incidents by studentId
  const incidentsByStudent = {};
  for (const inc of incidents) {
    if (!incidentsByStudent[inc.studentId]) incidentsByStudent[inc.studentId] = [];
    incidentsByStudent[inc.studentId].push(inc);
  }

  function getTooltipLines(alert) {
    const incs = incidentsByStudent[alert.studentId] || [];
    if (!incs.length) return [`${alert.effectiveCautionCount} incident(s) on record — no detail available.`];

    const sorted = [...incs]
      .sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt))
      .slice(0, 8);

    const lines = sorted.map((i) => {
      const date = i.occurredAt ? new Date(i.occurredAt).toLocaleDateString() : "—";
      return `• ${i.category} · ${i.severity} · ${date}`;
    });

    if (incs.length > 8) lines.push(`…and ${incs.length - 8} more`);
    return lines;
  }

  function buildPrefill(alert) {
    const incs = incidentsByStudent[alert.studentId] || [];
    const catCounts = {};
    for (const inc of incs) {
      const cat = inc.category || "Unknown";
      catCounts[cat] = (catCounts[cat] || 0) + 1;
    }
    const catList = Object.entries(catCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, n]) => `${n}x ${cat}`)
      .join(", ");

    const threshold = alert.status === "ESCALATED" ? "escalation threshold" : "caution threshold";
    const description =
      `Student reached ${threshold} with ${alert.effectiveCautionCount} effective incident(s).` +
      (catList ? `\n\nIncident breakdown: ${catList}.` : "") +
      `\n\nPlease review and apply the appropriate disciplinary action.`;

    const tier = alert.status === "ESCALATED" ? "TIER_2" : "TIER_1";
    const strategy =
      alert.status === "ESCALATED"
        ? "Formal disciplinary conference with student and guardian"
        : "Check-in / Check-out with behavior monitoring plan";

    return { description, strategy, tier };
  }

  function handleDiscipline(alert) {
    navigate(`/admin/students/${alert.studentId}/disciplines/new`, {
      state: { prefill: { ...buildPrefill(alert), studentName: alert.studentName } },
    });
  }

  return (
    <Page title="Discipline Required" subtitle="Students flagged by escalation rules">
      <PageTabs
        items={[
          { label: "Admin Dashboard", to: "/admin" },
          { label: "Reports & Trends", to: "/reports" },
          { label: "Discipline", to: "/admin/disciplines/new" },
          { label: "Discipline Required", to: "/admin/disciplines/required", badge: alerts.length },
        ]}
      />

      {loading ? (
        <div className="text-sm text-slate-500 py-8 text-center">Loading…</div>
      ) : alerts.length === 0 ? (
        <div
          className="rounded-xl p-8 text-center text-sm"
          style={{ border: "1.5px solid var(--ns-border)", background: "var(--ns-white)", color: "var(--ns-text2)" }}
        >
          No students currently require discipline action. All clear.
        </div>
      ) : (
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1.5px solid var(--ns-border)", background: "var(--ns-white)" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1.5px solid var(--ns-border)", background: "var(--ns-bg)" }}>
                <th className="text-left px-5 py-3 font-semibold" style={{ color: "var(--ns-text2)", fontFamily: "'Outfit', sans-serif" }}>
                  Student
                </th>
                <th className="text-left px-5 py-3 font-semibold" style={{ color: "var(--ns-text2)" }}>Status</th>
                <th className="text-left px-5 py-3 font-semibold" style={{ color: "var(--ns-text2)" }}>Incidents</th>
                <th className="text-right px-5 py-3 font-semibold" style={{ color: "var(--ns-text2)" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => {
                const tooltipLines = getTooltipLines(alert);

                return (
                  <tr
                    key={alert.studentId}
                    style={{ borderBottom: "1px solid var(--ns-border)" }}
                  >
                    {/* Student name with hover tooltip */}
                    <td className="px-5 py-3">
                      <span
                        style={{
                          fontWeight: 600,
                          color: "var(--ns-accent)",
                          cursor: "pointer",
                          textDecoration: tooltip?.studentId === alert.studentId ? "underline" : "none",
                          fontFamily: "'Outfit', sans-serif",
                        }}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setTooltip({
                            studentId: alert.studentId,
                            x: rect.left,
                            y: rect.bottom + 8,
                            lines: tooltipLines,
                          });
                        }}
                        onMouseLeave={() => setTooltip(null)}
                        onClick={() => handleDiscipline(alert)}
                      >
                        {alert.studentName}
                      </span>
                    </td>

                    {/* Status badge */}
                    <td className="px-5 py-3">
                      <span
                        style={{
                          display: "inline-block",
                          borderRadius: 4,
                          padding: "2px 8px",
                          fontSize: 11,
                          fontWeight: 700,
                          background: alert.status === "ESCALATED" ? "#fee2e2" : "#fef3c7",
                          color: alert.status === "ESCALATED" ? "#b91c1c" : "#92400e",
                        }}
                      >
                        {alert.status}
                      </span>
                    </td>

                    {/* Count */}
                    <td className="px-5 py-3" style={{ color: "var(--ns-text2)" }}>
                      {alert.effectiveCautionCount}
                    </td>

                    {/* Action button */}
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleDiscipline(alert)}
                        style={{
                          padding: "5px 14px",
                          borderRadius: 7,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          border: alert.status === "ESCALATED" ? "1.5px solid #b91c1c" : "1.5px solid #d97706",
                          background: "transparent",
                          color: alert.status === "ESCALATED" ? "#b91c1c" : "#d97706",
                          transition: "all 0.15s",
                        }}
                      >
                        Issue Discipline
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Portal tooltip — renders outside all containers so nothing clips it */}
      {tooltip && createPortal(
        <div
          style={{
            position: "fixed",
            left: tooltip.x,
            top: tooltip.y,
            zIndex: 9999,
            minWidth: 280,
            maxWidth: 380,
            background: "#1e293b",
            color: "#f1f5f9",
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: 12,
            lineHeight: 1.7,
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            pointerEvents: "none",
          }}
        >
          <p style={{ fontWeight: 700, marginBottom: 6, color: "#fbbf24", margin: "0 0 6px 0" }}>
            Why discipline is required:
          </p>
          {tooltip.lines.map((line, i) => (
            <p key={i} style={{ margin: 0 }}>{line}</p>
          ))}
        </div>,
        document.body
      )}
    </Page>
  );
}
