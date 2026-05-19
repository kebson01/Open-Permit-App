import React from "react";
import { Info, Zap } from "lucide-react";

/**
 * Renders a single question input based on input_type.
 * Shows a "prefilled" badge when the value came from Open Permit data.
 */
export default function QuestionField({ question, value, onChange, prefilled }) {
  const q = question;
  let options = [];
  try { options = JSON.parse(q.options || "[]"); } catch {}

  const inputClass = `w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all ${
    prefilled ? "border-blue-200 bg-blue-50 focus:ring-blue-200" : "border-gray-200 focus:ring-blue-300"
  }`;

  const renderInput = () => {
    switch (q.input_type) {
      case "boolean":
        return (
          <div className="flex gap-3">
            {["Yes", "No"].map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => onChange(opt === "Yes" ? "true" : "false")}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                  value === (opt === "Yes" ? "true" : "false")
                    ? "border-blue-500 bg-blue-600 text-white"
                    : "border-gray-200 text-gray-600 hover:border-blue-200"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        );

      case "select":
        return (
          <select
            value={value || ""}
            onChange={e => onChange(e.target.value)}
            className={inputClass}
          >
            <option value="">— Select —</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        );

      case "multi_select":
        const selected = value ? value.split(",") : [];
        return (
          <div className="flex flex-wrap gap-2">
            {options.map(o => {
              const active = selected.includes(o);
              return (
                <button
                  key={o}
                  type="button"
                  onClick={() => {
                    const next = active ? selected.filter(x => x !== o) : [...selected, o];
                    onChange(next.join(","));
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                    active ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:border-blue-200"
                  }`}
                >
                  {o}
                </button>
              );
            })}
          </div>
        );

      case "number":
        return (
          <input
            type="number"
            value={value || ""}
            onChange={e => onChange(e.target.value)}
            className={inputClass}
            placeholder="Enter number..."
          />
        );

      case "date":
        return (
          <input
            type="date"
            value={value || ""}
            onChange={e => onChange(e.target.value)}
            className={inputClass}
          />
        );

      default: // text, address
        return (
          <input
            type="text"
            value={value || ""}
            onChange={e => onChange(e.target.value)}
            className={inputClass}
            placeholder="Enter your answer..."
          />
        );
    }
  };

  return (
    <div className="mb-5">
      <div className="flex items-start justify-between gap-2 mb-2">
        <label className="text-sm font-semibold text-gray-800 flex items-start gap-1">
          {q.question_text}
          {q.is_required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {prefilled && (
          <span className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap">
            <Zap className="w-3 h-3" /> Prefilled
          </span>
        )}
      </div>

      {renderInput()}

      {q.help_text && (
        <p className="flex items-start gap-1 text-xs text-gray-400 mt-1.5">
          <Info className="w-3 h-3 shrink-0 mt-0.5" />
          {q.help_text}
        </p>
      )}
    </div>
  );
}