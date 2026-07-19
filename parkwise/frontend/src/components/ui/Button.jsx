import { Loader2 } from "lucide-react";

const variantStyles = {
  primary: { background: "var(--color-primary)", color: "white" },
  dark: { background: "var(--color-ink)", color: "white" },
  danger: { background: "var(--color-occupied)", color: "white" },
  ghost: { background: "transparent", color: "var(--color-ink)" },
  outline: { background: "transparent", color: "var(--color-primary)", border: "1px solid var(--color-primary)" },
};

const Button = ({
  children,
  variant = "primary",
  loading = false,
  disabled = false,
  icon: Icon,
  className = "",
  type = "button",
  onClick,
  ...props
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm
        transition-all duration-150 ease-out
        hover:brightness-110 active:scale-[0.98]
        disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100
        ${className}`}
      style={variantStyles[variant]}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        Icon && <Icon className="w-4 h-4" />
      )}
      {children}
    </button>
  );
};

export default Button;
