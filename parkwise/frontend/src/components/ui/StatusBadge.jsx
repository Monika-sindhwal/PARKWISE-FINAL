const statusStyles = {
  pending: { bg: "rgba(245,165,36,0.15)", color: "#B45309" },
  confirmed: { bg: "rgba(22,163,74,0.12)", color: "var(--color-available)" },
  approved: { bg: "rgba(22,163,74,0.12)", color: "var(--color-available)" },
  cancelled: { bg: "rgba(220,38,38,0.12)", color: "var(--color-occupied)" },
  rejected: { bg: "rgba(220,38,38,0.12)", color: "var(--color-occupied)" },
  completed: { bg: "rgba(44,75,219,0.1)", color: "var(--color-primary)" },
  unpaid: { bg: "rgba(245,165,36,0.15)", color: "#B45309" },
  paid: { bg: "rgba(22,163,74,0.12)", color: "var(--color-available)" },
  refunded: { bg: "var(--color-bg)", color: "var(--color-ink-muted)" },
};

const StatusBadge = ({ status }) => {
  const style = statusStyles[status] || { bg: "var(--color-bg)", color: "var(--color-ink-muted)" };
  return (
    <span
      className="text-xs font-medium px-2.5 py-1 rounded-full capitalize"
      style={{ background: style.bg, color: style.color }}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
