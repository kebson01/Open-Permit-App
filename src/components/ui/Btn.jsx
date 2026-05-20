/**
 * Btn — design-system button.
 *
 * variant: "primary" | "secondary" | "ghost"
 * size:    "sm" | "md" (default) | "lg"
 *
 * All other props (onClick, disabled, type, asChild…) are forwarded.
 * Use `as` prop to render as a different element (e.g. as="a").
 */
const VARIANTS = {
  primary:   "bg-action text-white hover:bg-action-hover active:bg-action-hover focus-visible:ring-2 focus-visible:ring-action disabled:opacity-50",
  secondary: "bg-white border border-line text-ink hover:bg-surface active:bg-line focus-visible:ring-2 focus-visible:ring-action disabled:opacity-50",
  ghost:     "bg-transparent text-action hover:bg-action-50 active:bg-action-100 focus-visible:ring-2 focus-visible:ring-action disabled:opacity-50",
};

const SIZES = {
  sm: "h-8  px-3  text-xs  gap-1.5",
  md: "h-10 px-4  text-sm  gap-2",
  lg: "h-12 px-6  text-sm  gap-2  font-bold",
};

export default function Btn({
  variant = "primary",
  size = "md",
  // eslint-disable-next-line react/prop-types
  as: Component = "button",
  className = "",
  children,
  ...props
}) {
  const Tag = Component;
  return (
    <Tag
      className={[
        "inline-flex items-center justify-center font-semibold rounded-control transition-colors outline-none",
        VARIANTS[variant] ?? VARIANTS.primary,
        SIZES[size] ?? SIZES.md,
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </Tag>
  );
}