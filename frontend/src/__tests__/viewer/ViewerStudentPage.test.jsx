/**
 * Tests for src/components/viewer/ViewerStudentPage.jsx
 * Feature 3: Read-only student detail — no action buttons
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
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
import ViewerStudentPage from "@/components/viewer/ViewerStudentPage.jsx";

// ── test data ─────────────────────────────────────────────────────────────────

const STUDENT = {
  id: 1,
  firstName: "Ada",
  lastName: "Lovelace",
  studentId: "A001",
  grade: "8",
  schoolId: 5,
};

const INCIDENTS = [
  {
    id: 10,
    studentId: 1,
    category: "Disruption",
    severity: "Minor",
    reportedBy: "teacher1",
    occurredAt: `${new Date().getFullYear()}-02-10T09:00:00Z`,
    description: "Talking during class",
  },
];

const INTERVENTIONS = [
  {
    id: 20,
    tier: "TIER_1",
    strategy: "Check-in/Check-out",
    description: "Daily check-in",
    assignedBy: "admin",
    startDate: "2025-01-10",
  },
];

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/viewer/students/1"]}>
      <Routes>
        <Route path="/viewer/students/:studentId" element={<ViewerStudentPage />} />
      </Routes>
    </MemoryRouter>
  );
}

// ── setup ──────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  useAuth.mockReturnValue({ activeDistrictId: 10, user: { id: "viewer1", role: "Viewer" } });
  api.getJSON.mockImplementation((url) => {
    if (url === "/api/students/1") return Promise.resolve(STUDENT);
    if (url === "/api/incidents")  return Promise.resolve(INCIDENTS);
    if (url.includes("/interventions")) return Promise.resolve(INTERVENTIONS);
    if (url.includes("/tier-history"))  return Promise.resolve([]);
    return Promise.resolve([]);
  });
});

// ── tests ──────────────────────────────────────────────────────────────────────

describe("ViewerStudentPage", () => {
  it("renders student name in the overview card", async () => {
    renderPage();
    // Use exact text — only the <span>{fullName}</span> in the overview card has exactly "Ada Lovelace"
    await waitFor(() => screen.getByText("Ada Lovelace"));
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
  });

  it("renders grade in the overview card", async () => {
    renderPage();
    await waitFor(() => screen.getByText("Ada Lovelace"));
    // "Grade:" label (normalized, trailing space trimmed)
    expect(screen.getByText("Grade:")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
  });

  it("shows Student ID in overview header", async () => {
    renderPage();
    await waitFor(() => screen.getByText("Ada Lovelace"));
    // Exact text of the inner <span> in the overview header
    expect(screen.getByText("Student ID: A001")).toBeInTheDocument();
  });

  it("shows 'Back to Viewer Dashboard' link", async () => {
    renderPage();
    await waitFor(() => screen.getByText("Ada Lovelace"));
    const backLink = screen.getByRole("link", { name: /back to viewer dashboard/i });
    expect(backLink).toHaveAttribute("href", "/viewer");
  });

  it("renders the incidents chart section", async () => {
    renderPage();
    await waitFor(() => screen.getByText("Ada Lovelace"));
    // Multiple elements contain "incidents" — use getAllByText to avoid single-match requirement
    expect(screen.getAllByText(/incidents/i).length).toBeGreaterThan(0);
  });

  it("renders the disciplines/interventions section", async () => {
    renderPage();
    await waitFor(() => screen.getByText("Ada Lovelace"));
    expect(screen.getByText(/disciplines.*interventions/i)).toBeInTheDocument();
  });

  it("renders incidents table with incident data", async () => {
    renderPage();
    await waitFor(() => screen.getByText("Disruption"));
    expect(screen.getByText("Disruption")).toBeInTheDocument();
    expect(screen.getByText("teacher1")).toBeInTheDocument();
  });

  it("NO Create Incident button present", async () => {
    renderPage();
    await waitFor(() => screen.getByText("Ada Lovelace"));
    expect(screen.queryByRole("button", { name: /create incident/i })).not.toBeInTheDocument();
  });

  it("NO Add Discipline button present", async () => {
    renderPage();
    await waitFor(() => screen.getByText("Ada Lovelace"));
    expect(screen.queryByRole("button", { name: /add discipline/i })).not.toBeInTheDocument();
  });

  it("NO Download PDF button present", async () => {
    renderPage();
    await waitFor(() => screen.getByText("Ada Lovelace"));
    expect(screen.queryByRole("button", { name: /download pdf/i })).not.toBeInTheDocument();
  });

  it("NO Edit button present", async () => {
    renderPage();
    await waitFor(() => screen.getByText("Ada Lovelace"));
    expect(screen.queryByRole("button", { name: /^edit$/i })).not.toBeInTheDocument();
  });

  it("NO Delete button present", async () => {
    renderPage();
    await waitFor(() => screen.getByText("Ada Lovelace"));
    expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();
  });

  it("date range controls visible for chart filtering", async () => {
    renderPage();
    await waitFor(() => screen.getByText("Ada Lovelace"));
    const dateInputs = screen.getAllByDisplayValue(/.+/);
    expect(dateInputs.length).toBeGreaterThan(0);
  });
});
