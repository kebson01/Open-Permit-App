/**
 * PanelCard — standard content panel / card.
 *
 * Props:
 *   title    string   header text
 *   icon     node     lucide icon element
 *   action   node     slot rendered in the header right side (buttons, links…)
 *   padded   bool     add inner padding (default true)
 *   className string  extra classes on the root div
 */
export default function PanelCard({ title, icon, action, padded = true, className = "", children }) {
  return (
    <div className={`bg-white rounded-card border border-line shadow-card overflow-hidden ${className}`}>
      {(title || icon || action) && (
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-line">
          <div className="flex items-center gap-2">
            {icon && <span className="text-muted">{icon}</span>}
            {title && <h3 className="font-bold text-ink text-sm">{title}</h3>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </div>
  );
}