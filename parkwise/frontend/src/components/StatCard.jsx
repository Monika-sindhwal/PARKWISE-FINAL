import Card from "./ui/Card";

const StatCard = ({ icon: Icon, label, value, tint = "primary" }) => {
  const tints = {
    primary: { bg: "#EEF2FE", color: "var(--color-primary)" },
    available: { bg: "rgba(22,163,74,0.1)", color: "var(--color-available)" },
    occupied: { bg: "rgba(220,38,38,0.1)", color: "var(--color-occupied)" },
    accent: { bg: "rgba(245,165,36,0.15)", color: "#B45309" },
  };
  const t = tints[tint] || tints.primary;

  return (
    <Card className="p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: t.bg }}>
        <Icon className="w-5 h-5" style={{ color: t.color }} />
      </div>
      <div>
        <p className="text-xs" style={{ color: "var(--color-ink-muted)" }}>
          {label}
        </p>
        <p className="font-display text-xl font-semibold">{value}</p>
      </div>
    </Card>
  );
};

export default StatCard;
