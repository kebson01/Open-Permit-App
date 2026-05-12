import React, { useState } from "react";
import { Info, AlertTriangle } from "lucide-react";

const PARTIAL_CHECKLIST = [
  "Building permit (partial repair)",
  "Contractor's license & insurance",
  "Photos of damaged area before and after",
  "Proof remaining roof meets 2007 FBC or newer",
  "Manufacturer's product approval documentation",
  "Notice of Commencement (NOC) if job value exceeds $2,500",
];

const FULL_CHECKLIST = [
  "Building permit (full replacement)",
  "Contractor's license & insurance",
  "Permit drawings / roofing plans",
  "Manufacturer's product approval documentation",
  "Two layers of underlayment (required per current FBC)",
  "Nail penetration must meet current hurricane resilience standards (min. 6d nails, 6\" spacing)",
  "Wind mitigation form (Miami-Dade Product Control or FL approval)",
  "Notice of Commencement (NOC) if job value exceeds $2,500",
  "Final inspection by building department",
];

export default function RoofingSubtype({ onSelect }) {
  const [selected, setSelected] = useState(null);

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
                Under updated Florida Building Code, only the damaged section may need repair if the remaining roof meets 2007 Florida Building Code or newer. A partial repair permit — rather than a full re-roof permit — may apply.
              </p>
            </div>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">Verify with your building department whether a partial repair permit applies to your specific project.</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Partial Repair Checklist</p>
            <ul className="space-y-1.5">
              {PARTIAL_CHECKLIST.map((item, i) => (
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
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Full Replacement Checklist</p>
            <ul className="space-y-1.5">
              {FULL_CHECKLIST.map((item, i) => (
                <li key={i} className={`flex items-start gap-2 text-xs ${
                  item.startsWith("Two layers") || item.startsWith("Nail penetration")
                    ? "text-blue-800 font-medium"
                    : "text-gray-700"
                }`}>
                  <span className="w-4 h-4 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-xs text-blue-700 font-medium">⚡ Current FBC Requirements: Two layers of underlayment required. Nail penetration must meet 170mph hurricane wind resistance standards per HVHZ (Broward County).</p>
          </div>
        </div>
      )}
    </div>
  );
}