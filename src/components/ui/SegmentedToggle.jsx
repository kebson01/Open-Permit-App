/**
 * SegmentedToggle — pill-style tab / toggle group.
 *
 * Props:
 *   options  Array<{ value, label, icon? }>
 *   value    currently selected value
 *   onChange (value) => void
 *   size     "sm" | "md" (default)
 */
export default function SegmentedToggle({ options = [], value, onChange, size = "md" }) {
  const pad = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";
  return (
    <div className="inline-flex items-center bg-surface border border-line rounded-control p-0.5 gap-0.5">
      {options.map(opt => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={[
              "inline-flex items-center gap-1.5 font-semibold rounded-[10px] transition-colors",
              pad,
              active
                ? "bg-white text-action shadow-sm border border-line"
                : "text-muted hover:text-ink",
            ].join(" ")}
          >
            {opt.icon && <span>{opt.icon}</span>}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}