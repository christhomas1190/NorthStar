import React, { useEffect, useState } from "react";
import Page from "@/components/layout/Page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getJSON, patchJSON } from "@/lib/api.js";

export default function DistrictFeaturesPage() {
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(null); // districtId being saved

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const data = await getJSON("/api/districts");
      setDistricts(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function toggle(districtId, field, currentValue) {
    setSaving(districtId + "_" + field);
    try {
      const updated = await patchJSON(`/api/districts/${districtId}/features`, {
        [field]: !currentValue,
      });
      setDistricts((prev) =>
        prev.map((d) => (d.id === districtId ? { ...d, ...updated } : d))
      );
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setSaving(null);
    }
  }

  return (
    <Page title="Feature Flags" subtitle="Toggle paid features per district">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">District Features</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <p style={{ color: "var(--ns-muted)", fontSize: 13 }}>Loading…</p>}
          {err && (
            <p style={{ color: "var(--ns-danger)", fontSize: 13, marginBottom: 12 }}>{err}</p>
          )}
          {!loading && districts.length === 0 && (
            <p style={{ color: "var(--ns-muted)", fontSize: 13 }}>No districts found.</p>
          )}
          {!loading && districts.length > 0 && (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1.5px solid var(--ns-border)" }}>
                  <th style={th}>District</th>
                  <th style={{ ...th, textAlign: "center" }}>Gradebook</th>
                  <th style={{ ...th, textAlign: "center" }}>Academic Trend</th>
                </tr>
              </thead>
              <tbody>
                {districts.map((d) => (
                  <tr key={d.id} style={{ borderBottom: "1px solid var(--ns-border)" }}>
                    <td style={td}>
                      <span style={{ fontWeight: 500 }}>{d.districtName}</span>
                      <span style={{ marginLeft: 8, color: "var(--ns-muted)", fontSize: 11 }}>
                        #{d.id}
                      </span>
                    </td>
                    <td style={{ ...td, textAlign: "center" }}>
                      <ToggleSwitch
                        checked={d.hasGradebook === true}
                        disabled={saving === d.id + "_hasGradebook"}
                        onChange={() => toggle(d.id, "hasGradebook", d.hasGradebook)}
                      />
                    </td>
                    <td style={{ ...td, textAlign: "center" }}>
                      <ToggleSwitch
                        checked={d.hasAcademicTrend === true}
                        disabled={saving === d.id + "_hasAcademicTrend"}
                        onChange={() => toggle(d.id, "hasAcademicTrend", d.hasAcademicTrend)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </Page>
  );
}

const th = {
  textAlign: "left",
  padding: "8px 12px",
  fontWeight: 600,
  color: "var(--ns-text2)",
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const td = {
  padding: "10px 12px",
  color: "var(--ns-text)",
  verticalAlign: "middle",
};

function ToggleSwitch({ checked, disabled, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      style={{
        width: 40,
        height: 22,
        borderRadius: 11,
        border: "none",
        background: checked ? "var(--ns-accent)" : "var(--ns-border2)",
        cursor: disabled ? "not-allowed" : "pointer",
        position: "relative",
        transition: "background 0.2s",
        opacity: disabled ? 0.6 : 1,
      }}
      aria-pressed={checked}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: checked ? 21 : 3,
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "white",
          transition: "left 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }}
      />
    </button>
  );
}
