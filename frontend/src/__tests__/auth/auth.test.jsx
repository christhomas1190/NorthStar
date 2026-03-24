/**
 * Tests for src/state/auth.jsx
 * Covers: Protected component, HomeRedirect role routing
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import React from "react";

import { AuthProvider, Protected, useAuth } from "@/state/auth.jsx";

// ── helpers ──────────────────────────────────────────────────────────────────

function renderWithRouter(ui, { initialEntries = ["/"] } = {}) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>
  );
}

function seedUser(user) {
  localStorage.setItem("ns_user", JSON.stringify(user));
  localStorage.setItem("ns_token", "Basic dGVzdDp0ZXN0");
}

beforeEach(() => {
  localStorage.clear();
});

// ── Protected ────────────────────────────────────────────────────────────────

describe("Protected", () => {
  it("redirects to /login when not authenticated", () => {
    // No user in localStorage
    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <AuthProvider>
          <Routes>
            <Route
              path="/admin"
              element={
                <Protected roles={["Admin"]}>
                  <div>Admin Page</div>
                </Protected>
              }
            />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.getByText("Login Page")).toBeInTheDocument();
    expect(screen.queryByText("Admin Page")).not.toBeInTheDocument();
  });

  it("renders children when user has the required role", () => {
    seedUser({ id: "admin", name: "Admin User", role: "Admin", districtId: 1, schoolId: 1 });

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <AuthProvider>
          <Routes>
            <Route
              path="/admin"
              element={
                <Protected roles={["Admin"]}>
                  <div>Admin Page</div>
                </Protected>
              }
            />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText("Admin Page")).toBeInTheDocument();
  });

  it("redirects to /unauthorized when user has wrong role", () => {
    seedUser({ id: "teacher1", name: "Teacher", role: "Teacher", districtId: 1, schoolId: 1 });

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <AuthProvider>
          <Routes>
            <Route
              path="/admin"
              element={
                <Protected roles={["Admin"]}>
                  <div>Admin Page</div>
                </Protected>
              }
            />
            <Route path="/unauthorized" element={<div>Unauthorized</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText("Unauthorized")).toBeInTheDocument();
    expect(screen.queryByText("Admin Page")).not.toBeInTheDocument();
  });

  it("allows multiple accepted roles — Teacher can access Teacher+Admin route", () => {
    seedUser({ id: "t1", name: "Teacher", role: "Teacher", districtId: 1, schoolId: 1 });

    render(
      <MemoryRouter initialEntries={["/student/1"]}>
        <AuthProvider>
          <Routes>
            <Route
              path="/student/:id"
              element={
                <Protected roles={["Admin", "Teacher"]}>
                  <div>Student Detail</div>
                </Protected>
              }
            />
            <Route path="/unauthorized" element={<div>Unauthorized</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText("Student Detail")).toBeInTheDocument();
  });

  it("blocks Viewer from Admin-only route", () => {
    seedUser({ id: "viewer1", name: "Viewer", role: "Viewer", districtId: 1, schoolId: 1 });

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <AuthProvider>
          <Routes>
            <Route
              path="/admin"
              element={
                <Protected roles={["Admin"]}>
                  <div>Admin Page</div>
                </Protected>
              }
            />
            <Route path="/unauthorized" element={<div>Unauthorized</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText("Unauthorized")).toBeInTheDocument();
  });
});

// ── useAuth ──────────────────────────────────────────────────────────────────

describe("useAuth", () => {
  it("exposes user from localStorage after mount", () => {
    const mockUser = { id: "admin", name: "Test Admin", role: "Admin", districtId: 1, schoolId: 1 };
    seedUser(mockUser);

    function Inspector() {
      const { user } = useAuth();
      return <div data-testid="role">{user?.role ?? "none"}</div>;
    }

    renderWithRouter(<Inspector />);
    expect(screen.getByTestId("role").textContent).toBe("Admin");
  });

  it("user is null when localStorage has no user", () => {
    function Inspector() {
      const { user } = useAuth();
      return <div data-testid="role">{user?.role ?? "none"}</div>;
    }

    renderWithRouter(<Inspector />);
    expect(screen.getByTestId("role").textContent).toBe("none");
  });
});
