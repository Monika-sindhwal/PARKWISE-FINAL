// Combines a date + time strings into a Date, and computes duration/price.
// Mirrors the backend's calculation exactly (see backend booking.controller.js):
// durationHours = (exit - entry) / (1000*60*60); totalAmount = round(duration * pricePerHour * 100) / 100
export const calculateBookingEstimate = (dateStr, entryTimeStr, exitTimeStr, pricePerHour) => {
  if (!dateStr || !entryTimeStr || !exitTimeStr || pricePerHour == null) {
    return { entryDate: null, exitDate: null, durationHours: 0, estimate: 0, isValidRange: false };
  }

  const entryDate = new Date(`${dateStr}T${entryTimeStr}:00`);
  const exitDate = new Date(`${dateStr}T${exitTimeStr}:00`);
  const durationHours = (exitDate - entryDate) / (1000 * 60 * 60);
  const isValidRange = durationHours > 0;

  return {
    entryDate,
    exitDate,
    durationHours,
    estimate: isValidRange ? Math.round(durationHours * pricePerHour * 100) / 100 : 0,
    isValidRange,
  };
};
