const EmptyState = ({ icon: Icon, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {Icon && (
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
          style={{ background: "var(--color-bg)" }}
        >
          <Icon className="w-6 h-6" style={{ color: "var(--color-ink-muted)" }} />
        </div>
      )}
      <h3 className="font-display font-semibold text-lg mb-1">{title}</h3>
      {description && (
        <p className="text-sm max-w-sm mb-4" style={{ color: "var(--color-ink-muted)" }}>
          {description}
        </p>
      )}
      {action}
    </div>
  );
};

export default EmptyState;
