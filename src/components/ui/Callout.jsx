/**
 * Callout — contextual information / status banner.
 *
 * variant: "info" | "success" | "warning" | "danger"
 */
const CONFIG = {
  info:    { bg: "bg-action-50",  border: "border-action-100",  icon: "ℹ️",  text: "text-action",   body: "text-action" },
  success: { bg: "bg-success-50", border: "border-green-200",   icon: "✓",   text: "text-success",  body: "text-green-800" },
  warning: { bg: "bg-warning-50", border: "border-amber-300",   icon: "⚠️", text: "text-warning",  body: "text-amber-900" },
  danger:  { bg: "bg-danger-50",  border: "border-red-200",     icon: "✕",   text: "text-danger",   body: "text-red-900" },
};

export default function Callout({ variant = "info", icon, title, children, className = "" }) {
  const c = CONFIG[variant] ?? CONFIG.info;
  return (
    <div className={`rounded-card border px-4 py-3.5 flex items-start gap-3 ${c.bg} ${c.border} ${className}`}>
      {icon !== false && (
        <span className={`text-sm shrink-0 mt-0.5 ${c.text}`}>{icon ?? c.icon}</span>
      )}
      <div className="flex-1 min-w-0">
        {title && <p className={`font-bold text-sm mb-0.5 ${c.text}`}>{title}</p>}
        <div className={`text-xs leading-relaxed ${c.body}`}>{children}</div>
      </div>
    </div>
  );
}