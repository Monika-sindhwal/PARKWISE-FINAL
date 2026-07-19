import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "./AuthContext";
import api from "../api/axios";

vi.mock("../api/axios");

// Small test harness that exercises the context's public API via buttons,
// since hooks can't be called outside a component.
const TestHarness = () => {
  const { user, loading, login, register, logout } = useAuth();
  return (
    <div>
      <p data-testid="loading">{loading ? "loading" : "ready"}</p>
      <p data-testid="user">{user ? `${user.name} (${user.role})` : "no-user"}</p>
      <button onClick={() => login("test@example.com", "password123")}>Login</button>
      <button onClick={() => register({ name: "New User", email: "new@example.com", password: "pw123456" })}>
        Register
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

const renderWithProvider = () =>
  render(
    <AuthProvider>
      <TestHarness />
    </AuthProvider>
  );

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  test("has no user initially when there is no stored token", async () => {
    renderWithProvider();
    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("ready"));
    expect(screen.getByTestId("user")).toHaveTextContent("no-user");
  });

  test("login stores the token/user and updates state", async () => {
    api.post.mockResolvedValueOnce({
      data: { token: "fake-jwt", user: { name: "Jasleen", role: "customer" } },
    });

    renderWithProvider();
    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("ready"));

    await userEvent.click(screen.getByText("Login"));

    await waitFor(() => expect(screen.getByTestId("user")).toHaveTextContent("Jasleen (customer)"));
    expect(localStorage.getItem("parkwise_token")).toBe("fake-jwt");
    expect(api.post).toHaveBeenCalledWith("/auth/login", {
      email: "test@example.com",
      password: "password123",
    });
  });

  test("register stores the token/user and updates state", async () => {
    api.post.mockResolvedValueOnce({
      data: { token: "fake-jwt-2", user: { name: "New User", role: "customer" } },
    });

    renderWithProvider();
    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("ready"));

    await userEvent.click(screen.getByText("Register"));

    await waitFor(() => expect(screen.getByTestId("user")).toHaveTextContent("New User (customer)"));
    expect(localStorage.getItem("parkwise_token")).toBe("fake-jwt-2");
  });

  test("logout clears storage and user state", async () => {
    api.post.mockResolvedValueOnce({
      data: { token: "fake-jwt", user: { name: "Jasleen", role: "customer" } },
    });

    renderWithProvider();
    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("ready"));
    await userEvent.click(screen.getByText("Login"));
    await waitFor(() => expect(screen.getByTestId("user")).toHaveTextContent("Jasleen"));

    await userEvent.click(screen.getByText("Logout"));

    expect(screen.getByTestId("user")).toHaveTextContent("no-user");
    expect(localStorage.getItem("parkwise_token")).toBeNull();
  });

  test("restores a session on load when a valid token already exists", async () => {
    localStorage.setItem("parkwise_token", "existing-token");
    api.get.mockResolvedValueOnce({ data: { user: { name: "Returning User", role: "owner" } } });

    renderWithProvider();

    await waitFor(() => expect(screen.getByTestId("user")).toHaveTextContent("Returning User (owner)"));
    expect(api.get).toHaveBeenCalledWith("/auth/me");
  });

  test("clears storage if the stored token turns out to be invalid", async () => {
    localStorage.setItem("parkwise_token", "expired-token");
    api.get.mockRejectedValueOnce({ response: { status: 401 } });

    renderWithProvider();

    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("ready"));
    expect(screen.getByTestId("user")).toHaveTextContent("no-user");
    expect(localStorage.getItem("parkwise_token")).toBeNull();
  });
});
