import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StatusBadge from "./StatusBadge";

describe("StatusBadge", () => {
  test.each([
    "pending",
    "confirmed",
    "approved",
    "cancelled",
    "rejected",
    "completed",
    "unpaid",
    "paid",
    "refunded",
  ])("renders the '%s' status text", (status) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(status)).toBeInTheDocument();
  });

  test("falls back gracefully for an unrecognized status instead of crashing", () => {
    render(<StatusBadge status="some_future_status" />);
    expect(screen.getByText("some_future_status")).toBeInTheDocument();
  });
});
