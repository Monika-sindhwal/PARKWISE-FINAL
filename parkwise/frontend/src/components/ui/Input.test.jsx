import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Input from "./Input";

describe("Input", () => {
  test("renders the label", () => {
    render(<Input label="Email" value="" onChange={() => {}} />);
    expect(screen.getByText("Email")).toBeInTheDocument();
  });

  test("shows an error message when provided", () => {
    render(<Input label="Email" value="" onChange={() => {}} error="Email is required" />);
    expect(screen.getByText("Email is required")).toBeInTheDocument();
  });

  test("does not show an error message when none is provided", () => {
    render(<Input label="Email" value="" onChange={() => {}} />);
    expect(screen.queryByText(/required/i)).not.toBeInTheDocument();
  });

  test("calls onChange when the user types", async () => {
    const handleChange = vi.fn();
    render(<Input label="Email" value="" onChange={handleChange} />);
    await userEvent.type(screen.getByLabelText("Email"), "a");
    expect(handleChange).toHaveBeenCalled();
  });

  test("passes through the placeholder", () => {
    render(<Input label="Email" value="" onChange={() => {}} placeholder="you@example.com" />);
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
  });
});
