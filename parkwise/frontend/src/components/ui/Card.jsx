const Card = ({ children, hoverable = false, className = "", style = {}, ...props }) => {
  return (
    <div
      className={`rounded-2xl transition-all duration-200 ease-out
        ${hoverable ? "hover:shadow-lg hover:-translate-y-0.5 cursor-pointer" : "shadow-sm"}
        ${className}`}
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
