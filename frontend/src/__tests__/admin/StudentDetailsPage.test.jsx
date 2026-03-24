/**
 * Tests for src/components/student/StudentDetailsPage.jsx
 * Feature 2: Edit and Delete inline functionality (Admin only)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import React from "react";

// ── mocks ─────────────────────────────────────────────────────────────────────

vi.mock("@/lib/api.js", () => ({
  getJSON:  vi.fn(),
  putJSON:  vi.fn(),
  delJSON:  vi.fn(),
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

vi.mock("@/components/layout/PageTabs", () => ({
  default: () => null,
}));

import * as api from "@/lib/api.js";
import { useAuth } from "@/state/auth.jsx";
import StudentDetailPage from "@/components/student/StudentDetailsPage.jsx";

// ── test data ─────────────────────────────────────────────────────────────────

const STUDENT = {
  id: 1,
  firstName: "Ada",
  lastName:  "Lovelace",
  studentId: "A001",
  grade:     "8",
  schoolId:  5,
};

function renderPage({ role = "Admin" } = {}) {
  useAuth.mockReturnValue({
    activeDistrictId: 10,
    user: { id: role === "Admin" ? "admin" : "teacher1", role },
  });

  return render(
    <MemoryRouter initialEntries={["/admin/students/1"]}>
      <Routes>
        <Route path="/admin/students/:studentId" element={<StudentDetailPage />} />
        <Route path="/admin/students" element={<div>Roster Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

// ── setup ──────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  api.getJSON.mockImplementation((url) => {
    if (url === "/api/students/1")             return Promise.resolve(STUDENT);
    if (url === "/api/incidents")              return Promise.resolve([]);
    if (url.includes("/interventions"))        return Promise.resolve([]);
    if (url.includes("/tier-history"))         return Promise.resolve([]);
    return Promise.resolve(null);
  });
  api.putJSON.mockResolvedValue({});
  api.delJSON.mockResolvedValue({});
});

// ── tests ──────────────────────────────────────────────────────────────────────

describe("StudentDetailsPage — Edit/Delete (Admin)", () => {
  it("renders student name in overview card", async () => {
    renderPage();
    // Wait for the exact span text — uniquely identifies the overview card name span
    await waitFor(() => screen.getByText("Ada Lovelace"));
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
  });

  it("Admin sees Edit button in overview card", async () => {
    renderPage({ role: "Admin" });
    await waitFor(() => screen.getByText("Ada Lovelace"));
    expect(screen.getByRole("button", { name: /^edit$/i })).toBeInTheDocument();
  });

  it("Admin sees Delete button in overview card", async () => {
    renderPage({ role: "Admin" });
    await waitFor(() => screen.getByText("Ada Lovelace"));
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
  });

  it("Teacher does NOT see Edit button", async () => {
    renderPage({ role: "Teacher" });
    await waitFor(() => screen.getByText("Ada Lovelace"));
    expect(screen.queryByRole("button", { name: /^edit$/i })).not.toBeInTheDocument();
  });

  it("Teacher does NOT see Delete button", async () => {
    renderPage({ role: "Teacher" });
    await waitFor(() => screen.getByText("Ada Lovelace"));
    expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();
  });

  it("clicking Edit shows inline form with pre-filled values", async () => {
    renderPage();
    await waitFor(() => screen.getByText("Ada Lovelace"));
    await userEvent.click(screen.getByRole("button", { name: /^edit$/i }));

    expect(screen.getByDisplayValue("Ada")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Lovelace")).toBeInTheDocument();
    expect(screen.getByDisplayValue("8")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("Cancel closes the edit form without saving", async () => {
    renderPage();
    await waitFor(() => screen.getByText("Ada Lovelace"));
    await userEvent.click(screen.getByRole("button", { name: /^edit$/i }));
    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(screen.queryByRole("button", { name: /save/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^edit$/i })).toBeInTheDocument();
  });

  it("Save calls putJSON with updated fields", async () => {
    api.getJSON.mockImplementation((url) => {
      if (url === "/api/students/1") return Promise.resolve(STUDENT);
      return Promise.resolve([]);
    });

    renderPage();
    await waitFor(() => screen.getByText("Ada Lovelace"));
    await userEvent.click(screen.getByRole("button", { name: /^edit$/i }));

    const firstNameInput = screen.getByDisplayValue("Ada");
    await userEvent.clear(firstNameInput);
    await userEvent.type(firstNameInput, "Ada M.");

    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => expect(api.putJSON).toHaveBeenCalledWith(
      "/api/students/1",
      expect.objectContaining({ firstName: "Ada M.", districtId: 10 })
    ));
  });

  it("Delete shows confirm dialog and calls delJSON on confirm", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);

    renderPage();
    await waitFor(() => screen.getByText("Ada Lovelace"));
    await userEvent.click(screen.getByRole("button", { name: /delete/i }));

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => expect(api.delJSON).toHaveBeenCalledWith("/api/students/1"));
  });

  it("after Delete navigates to /admin/students (Roster)", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);

    renderPage();
    await waitFor(() => screen.getByText("Ada Lovelace"));
    await userEvent.click(screen.getByRole("button", { name: /delete/i }));

    await waitFor(() => screen.getByText("Roster Page"));
  });

  it("Cancel on confirm dialog does NOT call delJSON", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);

    renderPage();
    await waitFor(() => screen.getByText("Ada Lovelace"));
    await userEvent.click(screen.getByRole("button", { name: /delete/i }));

    expect(api.delJSON).not.toHaveBeenCalled();
  });

  it("Back to Student Roster link present", async () => {
    renderPage();
    await waitFor(() => screen.getByText("Ada Lovelace"));
    const link = screen.getByRole("link", { name: /back to student roster/i });
    expect(link).toHaveAttribute("href", "/admin/students");
  });
});
