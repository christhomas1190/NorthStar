/**
 * Tests for src/components/admin/QuickActionsCard.jsx
 * Verifies all quick-action buttons are present and navigate to correct routes
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import QuickActionsCard from "@/components/admin/QuickActionsCard.jsx";

describe("QuickActionsCard", () => {
  beforeEach(() => {
    // Replace window.location.href with a writable mock
    Object.defineProperty(window, "location", {
      value: { href: "" },
      writable: true,
    });
  });

  it("renders the Quick Actions heading", () => {
    render(<QuickActionsCard />);
    expect(screen.getByText(/quick actions/i)).toBeInTheDocument();
  });

  it("renders the Student Roster button", () => {
    render(<QuickActionsCard />);
    expect(screen.getByText(/student roster/i)).toBeInTheDocument();
  });

  it("renders the Import Students button", () => {
    render(<QuickActionsCard />);
    expect(screen.getByText(/import students/i)).toBeInTheDocument();
  });

  it("renders the Define Behavior Categories button", () => {
    render(<QuickActionsCard />);
    expect(screen.getByText(/define behavior categories/i)).toBeInTheDocument();
  });

  it("renders the Manage Interventions button", () => {
    render(<QuickActionsCard />);
    expect(screen.getByText(/manage interventions/i)).toBeInTheDocument();
  });

  it("renders the Set Escalation Rules button", () => {
    render(<QuickActionsCard />);
    expect(screen.getByText(/set escalation rules/i)).toBeInTheDocument();
  });

  it("renders the User & Student Management button", () => {
    render(<QuickActionsCard />);
    expect(screen.getByText(/user.*student management/i)).toBeInTheDocument();
  });

  it("Student Roster button navigates to /admin/students", async () => {
    render(<QuickActionsCard />);
    await userEvent.click(screen.getByText(/student roster/i));
    expect(window.location.href).toBe("/admin/students");
  });

  it("Import Students button navigates to /admin/import-students", async () => {
    render(<QuickActionsCard />);
    await userEvent.click(screen.getByText(/import students/i));
    expect(window.location.href).toBe("/admin/import-students");
  });

  it("Define Behavior Categories navigates to /admin/define-behaviors", async () => {
    render(<QuickActionsCard />);
    await userEvent.click(screen.getByText(/define behavior categories/i));
    expect(window.location.href).toBe("/admin/define-behaviors");
  });

  it("Manage Interventions navigates to /admin/interventions", async () => {
    render(<QuickActionsCard />);
    await userEvent.click(screen.getByText(/manage interventions/i));
    expect(window.location.href).toBe("/admin/interventions");
  });

  it("Set Escalation Rules navigates to /admin/escalation-rules", async () => {
    render(<QuickActionsCard />);
    await userEvent.click(screen.getByText(/set escalation rules/i));
    expect(window.location.href).toBe("/admin/escalation-rules");
  });
});
