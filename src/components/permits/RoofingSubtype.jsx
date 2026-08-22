import React, { useState } from "react";
import { Info, AlertTriangle, DollarSign } from "lucide-react";

// Documents from weston_permit_types "Re-Roof / Roofing Permit" documents_needed
// Full list — shown for full replacement
const FULL_REPLACEMENT_DOCS = [
  "Building permit application",
  "Contractor's license & insurance certificate",
  "Permit drawings / roofing plans",
  "Manufacturer's product approval documentation",
  "Wind mitigation form (Miami-Dade Product Control or FL approval)",
  "HVHZ Uniform Roof Permit Application",
  "Lightweight Concrete Installation Packet (if applicable)",
  "Final inspection by building department",
];

// Additional items required for full replacement per 2025 hurricane code update
const FULL_REPLACEMENT_EXTRAS = [
  "✓ Two layers of underlayment required (current FBC)",
  "✓ Nail penetration must meet current hurricane resilience standards (2025 update)",
];

// Partial repair — omit full-replacement-only items
const PARTIAL_DOCS = FULL_REPLACEMENT_DOCS.filter(
  d => !d.includes("HVHZ Uniform Roof Permit") && !d.includes("Lightweight Concrete")
).map(d => d === "Building permit application" ? "Building permit (partial repair)" : d);

export default function RoofingSubtype({ onSelect, jobValue }) {
  const [selected, setSelected] = useState(null);
  const showNOC = parseFloat(jobValue) > 2500 || (!jobValue && true); // show if value unknown or >$2500

  const choose = (type) => {
    setSelected(type);
    onSelect?.(type);
  };

  return (
    <div className="bg-white border border-blue-200 rounded-2xl p-5 mb-4">
      <p className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
        <span className="text-lg">🏠</span> Is this a full roof replacement or a partial repair?
      </p>

      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <button
          onClick={() => choose("partial")}
          className={`text-left p-4 rounded-xl border-2 transition-all ${
            selected === "partial"
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-blue-300"
          }`}
        >
          <p className="font-semibold text-sm text-gray-900 mb-1">Partial Repair</p>
          <p className="text-xs text-gray-500 leading-snug">Only the damaged section needs replacement. Rest of roof is in acceptable condition.</p>
        </button>

        <button
          onClick={() => choose("full")}
          className={`text-left p-4 rounded-xl border-2 transition-all ${
            selected === "full"
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-blue-300"
          }`}
        >
          <p className="font-semibold text-sm text-gray-900 mb-1">Full Replacement</p>
          <p className="text-xs text-gray-500 leading-snug">Removing and replacing the entire roof system.</p>
        </button>
      </div>

      {selected === "partial" && (
        <div className="space-y-3">
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 flex items-start gap-3">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-blue-900 mb-1">Florida Law — Partial Repair Pathway</p>
              <p className="text-xs text-blue-800 leading-relaxed">
                Under updated Florida Building Code, only the damaged section may need repair if the remaining roof meets 2007 FBC or newer. A partial repair permit — rather than a full re-roof permit — may apply.
              </p>
            </div>
          </div>
          {showNOC && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2">
              <DollarSign className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 font-medium">⚠️ A Notice of Commencement is required before work begins once the job passes your city&rsquo;s threshold — confirm the figure with them.</p>
            </div>
          )}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-700">Verify with your building department whether a partial repair permit applies to your specific project.</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Partial Repair Checklist</p>
            <ul className="space-y-1.5">
              {PARTIAL_DOCS.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                  <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {selected === "full" && (
        <div className="space-y-3">
          {showNOC && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2">
              <DollarSign className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 font-medium">⚠️ A Notice of Commencement is required before work begins once the job passes your city&rsquo;s threshold — confirm the figure with them.</p>
            </div>
          )}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Full Replacement Checklist</p>
            <ul className="space-y-1.5">
              {FULL_REPLACEMENT_DOCS.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                  <span className="w-4 h-4 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                  {item}
                </li>
              ))}
              {FULL_REPLACEMENT_EXTRAS.map((item, i) => (
                <li key={`extra-${i}`} className="flex items-start gap-2 text-xs text-blue-800 font-semibold">
                  <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">★</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-xs text-blue-700 font-medium">⚡ HVHZ (Broward County): Two layers of underlayment required. Nail penetration must meet 170mph hurricane wind resistance per current FBC.</p>
          </div>
        </div>
      )}
    </div>
  );
}