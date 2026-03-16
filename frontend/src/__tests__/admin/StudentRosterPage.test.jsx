/**
 * Tests for src/components/admin/StudentRosterPage.jsx
 * Feature 1: Student Roster — list, search, inline edit, delete
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import React from "react";

// ── mocks ─────────────────────────────────────────────────────────────────────

vi.mock("@/lib/api.js", () => ({
  getJSON: vi.fn(),
  putJSON: vi.fn(),
  delJSON: vi.fn(),
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
import StudentRosterPage from "@/components/admin/StudentRosterPage.jsx";

// ── test data ─────────────────────────────────────────────────────────────────

const STUDENTS = [
  { id: 1, firstName: "Ada",   lastName: "Lovelace", studentId: "A001", grade: "8",  schoolId: 5 },
  { id: 2, firstName: "Grace", lastName: "Hopper",   studentId: "G002", grade: "9",  schoolId: 5 },
  { id: 3, firstName: "Alan",  lastName: "Turing",   studentId: "T003", grade: "10", schoolId: 5 },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <StudentRosterPage />
    </MemoryRouter>
  );
}

// ── setup ──────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  useAuth.mockReturnValue({ activeDistrictId: 10, user: { role: "Admin" } });
  api.getJSON.mockResolvedValue(STUDENTS);
});

// ── tests ──────────────────────────────────────────────────────────────────────

describe("StudentRosterPage", () => {
  it("shows loading state on initial render", () => {
    api.getJSON.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("renders all students after data loads", async () => {
    renderPage();
    await waitFor(() => screen.getByRole("link", { name: "Ada Lovelace" }));

    expect(screen.getByRole("link", { name: "Ada Lovelace" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Grace Hopper" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Alan Turing" })).toBeInTheDocument();
  });

  it("shows student count summary", async () => {
    renderPage();
    await waitFor(() => screen.getByRole("link", { name: "Ada Lovelace" }));
    expect(screen.getByText(/3 of 3 student/i)).toBeInTheDocument();
  });

  it("filters students by first name search", async () => {
    renderPage();
    await waitFor(() => screen.getByRole("link", { name: "Ada Lovelace" }));

    const search = screen.getByPlaceholderText(/search/i);
    await userEvent.type(search, "ada");

    expect(screen.getByRole("link", { name: "Ada Lovelace" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Grace Hopper" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Alan Turing" })).not.toBeInTheDocument();
    expect(screen.getByText(/1 of 3/i)).toBeInTheDocument();
  });

  it("filters students by student ID", async () => {
    renderPage();
    await waitFor(() => screen.getByRole("link", { name: "Ada Lovelace" }));

    const search = screen.getByPlaceholderText(/search/i);
    await userEvent.type(search, "G002");

    expect(screen.getByRole("link", { name: "Grace Hopper" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Ada Lovelace" })).not.toBeInTheDocument();
  });

  it("shows empty state when search matches nothing", async () => {
    renderPage();
    await waitFor(() => screen.getByRole("link", { name: "Ada Lovelace" }));

    const search = screen.getByPlaceholderText(/search/i);
    await userEvent.type(search, "zzz-nomatch");

    expect(screen.getByText(/no students found/i)).toBeInTheDocument();
    expect(screen.getByText(/0 of 3/i)).toBeInTheDocument();
  });

  it("shows Edit and Delete buttons for Admin role", async () => {
    renderPage();
    await waitFor(() => screen.getByRole("link", { name: "Ada Lovelace" }));

    const editButtons = screen.getAllByRole("button", { name: /edit/i });
    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });

    expect(editButtons).toHaveLength(3);
    expect(deleteButtons).toHaveLength(3);
  });

  it("hides Edit and Delete buttons for Teacher role", async () => {
    useAuth.mockReturnValue({ activeDistrictId: 10, user: { role: "Teacher" } });
    renderPage();
    await waitFor(() => screen.getByRole("link", { name: "Ada Lovelace" }));

    expect(screen.queryByRole("button", { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();
  });

  it("clicking Edit shows inline form with pre-filled values", async () => {
    renderPage();
    await waitFor(() => screen.getByRole("link", { name: "Ada Lovelace" }));

    const editButtons = screen.getAllByRole("button", { name: /edit/i });
    await userEvent.click(editButtons[0]); // edit Ada Lovelace

    expect(screen.getByDisplayValue("Ada")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Lovelace")).toBeInTheDocument();
    expect(screen.getByDisplayValue("8")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("Cancel edit restores normal row view", async () => {
    renderPage();
    await waitFor(() => screen.getByRole("link", { name: "Ada Lovelace" }));

    const editButtons = screen.getAllByRole("button", { name: /edit/i });
    await userEvent.click(editButtons[0]);
    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(screen.getAllByRole("button", { name: /edit/i })).toHaveLength(3);
    expect(screen.queryByRole("button", { name: /save/i })).not.toBeInTheDocument();
  });

  it("Save calls putJSON and reloads list", async () => {
    api.putJSON.mockResolvedValue({});
    // First load: original list; reload after save: updated list
    api.getJSON
      .mockResolvedValueOnce(STUDENTS)
      .mockResolvedValue([
        ...STUDENTS.slice(1),
        { id: 1, firstName: "Ada", lastName: "Updated", studentId: "A001", grade: "8", schoolId: 5 },
      ]);

    renderPage();
    await waitFor(() => screen.getByRole("link", { name: "Ada Lovelace" }));

    const editButtons = screen.getAllByRole("button", { name: /edit/i });
    await userEvent.click(editButtons[0]);
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => expect(api.putJSON).toHaveBeenCalledWith(
      "/api/students/1",
      expect.objectContaining({ firstName: "Ada", districtId: 10 })
    ));
  });

  it("Delete shows confirm dialog and calls delJSON on confirm", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    api.delJSON.mockResolvedValue({});

    renderPage();
    await waitFor(() => screen.getByRole("link", { name: "Ada Lovelace" }));

    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    await userEvent.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => expect(api.delJSON).toHaveBeenCalledWith("/api/students/1"));
  });

  it("Delete does NOT call delJSON when confirm is cancelled", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);

    renderPage();
    await waitFor(() => screen.getByRole("link", { name: "Ada Lovelace" }));

    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    await userEvent.click(deleteButtons[0]);

    expect(api.delJSON).not.toHaveBeenCalled();
  });

  it("shows error message when getJSON fails", async () => {
    api.getJSON.mockRejectedValue(new Error("Network error"));
    renderPage();
    await waitFor(() => screen.getByText("Network error"));
  });
});
