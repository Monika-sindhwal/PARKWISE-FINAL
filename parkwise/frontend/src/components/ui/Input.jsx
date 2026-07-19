import { useId } from "react";

const Input = ({ label, icon: Icon, error, className = "", id, ...props }) => {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--color-ink-muted)" }}
          />
        )}
        <input
          id={inputId}
          className={`w-full py-2.5 rounded-lg border outline-none text-sm
            transition-shadow duration-150
            focus:ring-2 focus:ring-offset-0
            ${Icon ? "pl-10 pr-3" : "px-3"}`}
          style={{
            borderColor: error ? "var(--color-occupied)" : "var(--color-border)",
            "--tw-ring-color": error ? "#FCA5A5" : "#BFD0FA",
          }}
          aria-invalid={!!error}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs mt-1.5" style={{ color: "var(--color-occupied)" }}>
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
