/**
 * Tests for src/components/viewer/ViewerDashboard.jsx
 * Feature 3: Viewer role — read-only students table + recent incidents
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import React from "react";

// ── mocks ─────────────────────────────────────────────────────────────────────

vi.mock("@/lib/api.js", () => ({
  getJSON: vi.fn(),
}));

vi.mock("@/state/auth.jsx", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/components/layout/Page", () => ({
  default: ({ title, children }) => (
    <div data-testid="page">
      {title && <h1>{title}</h1>}
      {children}
    </div>
  ),
}));

import * as api from "@/lib/api.js";
import { useAuth } from "@/state/auth.jsx";
import ViewerDashboard from "@/components/viewer/ViewerDashboard.jsx";

// ── test data ─────────────────────────────────────────────────────────────────

const STUDENTS = [
  { id: 1, firstName: "Ada",   lastName: "Lovelace", studentId: "A001", grade: "8" },
  { id: 2, firstName: "Grace", lastName: "Hopper",   studentId: "G002", grade: "9" },
  { id: 3, firstName: "Alan",  lastName: "Turing",   studentId: "T003", grade: "10" },
];

const INCIDENTS = [
  { id: 1, studentId: 1, category: "Disruption", severity: "Minor",
    reportedBy: "teacher1", occurredAt: "2025-03-10T09:00:00Z" },
  { id: 2, studentId: 2, category: "Fighting",   severity: "High",
    reportedBy: "teacher2", occurredAt: "2025-03-12T10:00:00Z" },
  { id: 3, studentId: 3, category: "Tardiness",  severity: "Low",
    reportedBy: "teacher1", occurredAt: "2025-03-08T08:00:00Z" },
];

function renderDashboard() {
  return render(
    <MemoryRouter>
      <ViewerDashboard />
    </MemoryRouter>
  );
}

// ── setup ──────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  useAuth.mockReturnValue({ activeDistrictId: 10, user: { id: "viewer1", role: "Viewer" } });
  api.getJSON.mockImplementation((url) => {
    if (url === "/api/students") return Promise.resolve(STUDENTS);
    if (url === "/api/incidents") return Promise.resolve(INCIDENTS);
    return Promise.resolve([]);
  });
});

// ── tests ──────────────────────────────────────────────────────────────────────

describe("ViewerDashboard", () => {
  it("renders the page title", async () => {
    renderDashboard();
    await waitFor(() => expect(api.getJSON).toHaveBeenCalled());
    expect(screen.getByText(/viewer dashboard/i)).toBeInTheDocument();
  });

  it("renders the Students section heading", async () => {
    renderDashboard();
    await waitFor(() => screen.getByRole("link", { name: "Ada Lovelace" }));
    expect(screen.getByText(/^students$/i)).toBeInTheDocument();
  });

  it("renders all students in the table", async () => {
    renderDashboard();
    await waitFor(() => screen.getByRole("link", { name: "Ada Lovelace" }));

    expect(screen.getByRole("link", { name: "Ada Lovelace" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Grace Hopper" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Alan Turing" })).toBeInTheDocument();
  });

  it("each student name links to /viewer/students/:id", async () => {
    renderDashboard();
    await waitFor(() => screen.getByRole("link", { name: "Ada Lovelace" }));

    const adaLink = screen.getByRole("link", { name: "Ada Lovelace" });
    expect(adaLink).toHaveAttribute("href", "/viewer/students/1");
  });

  it("search box filters students by name", async () => {
    renderDashboard();
    await waitFor(() => screen.getByRole("link", { name: "Ada Lovelace" }));

    const search = screen.getByPlaceholderText(/search/i);
    await userEvent.type(search, "grace");

    expect(screen.getByRole("link", { name: "Grace Hopper" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Ada Lovelace" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Alan Turing" })).not.toBeInTheDocument();
  });

  it("search box filters students by student ID", async () => {
    renderDashboard();
    await waitFor(() => screen.getByRole("link", { name: "Ada Lovelace" }));

    const search = screen.getByPlaceholderText(/search/i);
    await userEvent.type(search, "T003");

    expect(screen.getByRole("link", { name: "Alan Turing" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Ada Lovelace" })).not.toBeInTheDocument();
  });

  it("renders Recent Incidents section heading", async () => {
    renderDashboard();
    await waitFor(() => screen.getByRole("link", { name: "Ada Lovelace" }));
    expect(screen.getByText(/recent incidents/i)).toBeInTheDocument();
  });

  it("renders incidents in the recent incidents table", async () => {
    renderDashboard();
    await waitFor(() => screen.getByRole("link", { name: "Ada Lovelace" }));

    expect(screen.getByText("Disruption")).toBeInTheDocument();
    expect(screen.getByText("Fighting")).toBeInTheDocument();
    expect(screen.getByText("Tardiness")).toBeInTheDocument();
  });

  it("resolves student names in incidents table", async () => {
    renderDashboard();
    await waitFor(() => screen.getByText("Disruption"));

    // Incident 1 belongs to Ada Lovelace (id=1)
    const rows = screen.getAllByRole("row");
    const incidentRows = rows.filter(r => r.textContent.includes("Disruption"));
    expect(incidentRows[0].textContent).toContain("Ada");
  });

  it("shows reported-by column in incidents table", async () => {
    renderDashboard();
    await waitFor(() => screen.getByText("Disruption"));

    // teacher1 appears twice (incidents 1 and 3), teacher2 once
    expect(screen.getAllByText("teacher1").length).toBeGreaterThan(0);
    expect(screen.getByText("teacher2")).toBeInTheDocument();
  });

  it("NO Edit buttons visible anywhere", async () => {
    renderDashboard();
    await waitFor(() => screen.getByRole("link", { name: "Ada Lovelace" }));
    expect(screen.queryByRole("button", { name: /edit/i })).not.toBeInTheDocument();
  });

  it("NO Delete buttons visible anywhere", async () => {
    renderDashboard();
    await waitFor(() => screen.getByRole("link", { name: "Ada Lovelace" }));
    expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();
  });

  it("shows empty state when no students found after search", async () => {
    renderDashboard();
    await waitFor(() => screen.getByRole("link", { name: "Ada Lovelace" }));

    const search = screen.getByPlaceholderText(/search/i);
    await userEvent.type(search, "zzz-nobody");

    expect(screen.getByText(/no students found/i)).toBeInTheDocument();
  });

  it("shows loading state initially", () => {
    api.getJSON.mockReturnValue(new Promise(() => {}));
    renderDashboard();
    const loadingEls = screen.getAllByText(/loading/i);
    expect(loadingEls.length).toBeGreaterThan(0);
  });

  it("shows empty tables when all fetches fail (errors suppressed per-call)", async () => {
    // Component uses .catch(() => []) on each call — errors are suppressed, empty data returned
    api.getJSON.mockRejectedValue(new Error("Server down"));
    renderDashboard();
    // Loading clears and empty state rows appear
    await waitFor(() => screen.getAllByText(/no .* found/i));
    expect(screen.queryByText("Server down")).not.toBeInTheDocument();
  });
});
