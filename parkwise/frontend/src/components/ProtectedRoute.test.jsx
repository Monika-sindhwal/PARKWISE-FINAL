import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { useAuth } from "../context/AuthContext";

vi.mock("../context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

const renderWithRouter = (initialPath = "/protected") =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/" element={<div>Home Page</div>} />
        <Route
          path="/protected"
          element={
            <ProtectedRoute allowedRoles={["owner"]}>
              <div>Secret Content</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/protected-any-role"
          element={
            <ProtectedRoute>
              <div>Secret Content</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );

describe("ProtectedRoute", () => {
  test("shows a loading state while auth is still resolving", () => {
    useAuth.mockReturnValue({ user: null, loading: true });
    renderWithRouter();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test("redirects to /login when there is no logged-in user", () => {
    useAuth.mockReturnValue({ user: null, loading: false });
    renderWithRouter();
    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  test("renders the protected content when the user's role is allowed", () => {
    useAuth.mockReturnValue({ user: { role: "owner" }, loading: false });
    renderWithRouter();
    expect(screen.getByText("Secret Content")).toBeInTheDocument();
  });

  test("redirects home when the user's role is not in allowedRoles", () => {
    useAuth.mockReturnValue({ user: { role: "customer" }, loading: false });
    renderWithRouter();
    expect(screen.getByText("Home Page")).toBeInTheDocument();
  });

  test("renders content for any logged-in user when no allowedRoles is specified", () => {
    useAuth.mockReturnValue({ user: { role: "customer" }, loading: false });
    renderWithRouter("/protected-any-role");
    expect(screen.getByText("Secret Content")).toBeInTheDocument();
  });
});
