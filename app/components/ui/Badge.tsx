interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "dropped";
}

const variantClasses = {
  default: "bg-zinc-700 text-zinc-200",
  success: "bg-green-700 text-green-100",
  warning: "bg-yellow-700 text-yellow-100",
  danger: "bg-red-700 text-red-100",
  dropped: "bg-zinc-800 text-zinc-500 line-through",
};

export function Badge({ children, variant = "default", className = "", ...props }: BadgeProps) {
  return (
    <span
      {...props}
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
