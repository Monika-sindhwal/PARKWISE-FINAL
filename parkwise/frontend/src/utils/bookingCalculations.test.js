import { describe, test, expect } from "vitest";
import { calculateBookingEstimate } from "./bookingCalculations";

describe("calculateBookingEstimate", () => {
  test("calculates correct duration and price for a simple 3-hour booking", () => {
    const result = calculateBookingEstimate("2026-07-20", "10:00", "13:00", 20);
    expect(result.durationHours).toBe(3);
    expect(result.estimate).toBe(60);
    expect(result.isValidRange).toBe(true);
  });

  test("handles fractional hours correctly (30 minutes)", () => {
    const result = calculateBookingEstimate("2026-07-20", "10:00", "10:30", 20);
    expect(result.durationHours).toBe(0.5);
    expect(result.estimate).toBe(10);
  });

  test("rounds the estimate to 2 decimal places", () => {
    // 1.1 hours * 33 = 36.3 exactly, but test a case that could produce float drift
    const result = calculateBookingEstimate("2026-07-20", "10:00", "11:07", 33);
    // 67 minutes = 1.1166... hours
    expect(result.estimate).toBe(Math.round(result.durationHours * 33 * 100) / 100);
  });

  test("flags an invalid range when exit is before entry", () => {
    const result = calculateBookingEstimate("2026-07-20", "13:00", "10:00", 20);
    expect(result.isValidRange).toBe(false);
    expect(result.estimate).toBe(0);
  });

  test("flags an invalid range when exit equals entry", () => {
    const result = calculateBookingEstimate("2026-07-20", "10:00", "10:00", 20);
    expect(result.isValidRange).toBe(false);
  });

  test("returns safe defaults when fields are missing", () => {
    const result = calculateBookingEstimate("", "", "", 20);
    expect(result.isValidRange).toBe(false);
    expect(result.estimate).toBe(0);
    expect(result.entryDate).toBeNull();
  });

  test("returns safe defaults when pricePerHour is not yet known", () => {
    const result = calculateBookingEstimate("2026-07-20", "10:00", "13:00", undefined);
    expect(result.isValidRange).toBe(false);
    expect(result.estimate).toBe(0);
  });

  test("matches the backend's exact rounding formula for a known tricky case", () => {
    // Mirrors backend/src/controllers/booking.controller.js:
    // Math.round(durationHours * pricePerHour * 100) / 100
    const result = calculateBookingEstimate("2026-07-20", "09:00", "09:20", 45);
    const expected = Math.round((20 / 60) * 45 * 100) / 100;
    expect(result.estimate).toBe(expected);
  });
});
