import { useEffect, useState } from "react";

const TOTAL_SLOTS = 15;

// Ambient visual showing what ParkWise actually tracks in real time -
// not decoration, a literal (simplified) preview of the live slot board
// customers see when they open a parking lot's page.
const LiveSlotBoard = () => {
  const [slots, setSlots] = useState(() =>
    Array.from({ length: TOTAL_SLOTS }, () => Math.random() > 0.4)
  );

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    const interval = setInterval(() => {
      setSlots((prev) => {
        const next = [...prev];
        const i = Math.floor(Math.random() * TOTAL_SLOTS);
        next[i] = !next[i];
        return next;
      });
    }, 900);
    return () => clearInterval(interval);
  }, []);

  const availableCount = slots.filter(Boolean).length;

  return (
    <div
      className="rounded-2xl p-5 sm:p-6 w-full max-w-sm"
      style={{ background: "var(--color-ink)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium text-white/60">Downtown Mall Parking</span>
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ background: "rgba(22,163,74,0.2)", color: "var(--color-available)" }}
        >
          {availableCount} available
        </span>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {slots.map((available, i) => (
          <div
            key={i}
            className="aspect-square rounded-md flex items-center justify-center text-[10px] font-medium transition-colors duration-700"
            style={{
              background: available ? "rgba(22,163,74,0.15)" : "rgba(220,38,38,0.15)",
              border: `1.5px solid ${available ? "var(--color-available)" : "var(--color-occupied)"}`,
              color: available ? "var(--color-available)" : "var(--color-occupied)",
            }}
          >
            P{i + 1}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveSlotBoard;
