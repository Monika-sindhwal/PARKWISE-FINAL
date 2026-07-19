const Skeleton = ({ className = "" }) => {
  return (
    <div
      className={`animate-pulse rounded-md ${className}`}
      style={{ background: "var(--color-border)" }}
    />
  );
};

export default Skeleton;
