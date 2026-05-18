import { useState } from "react";
import { Info, X } from "lucide-react";

/**
 * HintTooltip — inline expandable hint
 * Usage: <HintTooltip text="Your hint here" />
 * Or with a label: <HintTooltip label="What is this?" text="..." />
 */
export default function HintTooltip({ text, label }) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:text-blue-600 transition-colors align-middle"
        aria-label="Show hint"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      {open && (
        <span
          className="absolute z-50 left-5 top-0 w-64 bg-white border border-blue-100 rounded-xl shadow-xl p-3 text-xs text-gray-700 leading-relaxed"
          style={{ minWidth: 220 }}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="float-right ml-2 text-gray-300 hover:text-gray-500"
          >
            <X className="w-3 h-3" />
          </button>
          {label && <span className="font-semibold text-gray-900 block mb-1">{label}</span>}
          {text}
        </span>
      )}
    </span>
  );
}

/**
 * HintBanner — always-visible contextual info bar
 */
export function HintBanner({ children }) {
  return (
    <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl border text-sm leading-relaxed"
      style={{ background: "#EBF5FF", borderColor: "#60A9DE", color: "#025799" }}>
      <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#025799" }} />
      <span>{children}</span>
    </div>
  );
}

/**
 * HintCard — expandable "what do these mean?" section
 */
export function HintCard({ title, items }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#60A9DE" }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold"
        style={{ background: "#EBF5FF", color: "#022A5B" }}
      >
        <span className="flex items-center gap-2"><Info className="w-4 h-4" />{title}</span>
        <span className="text-xs font-normal" style={{ color: "#025799" }}>{open ? "Hide ▲" : "Show ▼"}</span>
      </button>
      {open && (
        <div className="bg-white divide-y" style={{ borderColor: "#e0eaf5" }}>
          {items.map((item, i) => (
            <div key={i} className="px-4 py-3">
              <p className="font-semibold text-xs mb-0.5" style={{ color: "#022A5B" }}>{item.label}</p>
              <p className="text-xs text-gray-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}