import React, { useState } from "react";
import { Info, Zap, ChevronDown, ChevronUp, Lightbulb } from "lucide-react";

// "Why we ask" explanations keyed by question_key
const WHY_WE_ASK = {
  property_address:    { reason: "The city uses this to confirm the exact location of the permitted work.", tip: "Use the address as it appears on your deed or property tax bill." },
  folio_number:        { reason: "The Broward County Property Appraiser (BCPA) folio number uniquely identifies your parcel.", tip: "Find it on your tax bill or at bcpa.net." },
  owner_name:          { reason: "The permit must be issued in the legal property owner's name.", tip: "Use the name exactly as it appears on the deed." },
  is_homestead:        { reason: "Homestead status affects certain fee calculations and eligibility.", tip: "Check your property tax bill — it will say 'HX' if homestead-exempt." },
  job_value:           { reason: "The permit fee is calculated as a percentage of the total job value.", tip: "Include all labor and materials. Undervaluing may result in a rejected application." },
  roof_area_sqft:      { reason: "Used to calculate the roofing permit fee and verify the scope of work.", tip: "Measure the actual roof surface area, not the footprint." },
  roof_material:       { reason: "Different materials require different product approvals and inspection standards.", tip: "In Broward County (HVHZ), all roofing must meet hurricane wind ratings." },
  noa_number:          { reason: "Florida law requires all roofing and window products to have a valid Notice of Acceptance (NOA).", tip: "Look up your product at floridabuilding.org/pr to find the NOA number." },
  contractor_name:     { reason: "The licensed contractor is legally responsible for the permitted work.", tip: "Must match the name on the Florida state license." },
  contractor_license:  { reason: "Only state-licensed contractors may pull permits in Weston.", tip: "Find or verify licenses at myfloridalicense.com." },
  contractor_phone:    { reason: "The city may need to contact the contractor for inspections or corrections.", tip: "Use a business phone number that is answered during business hours." },
  noc_required:        { reason: "A Notice of Commencement protects homeowners from unpaid contractor liens.", tip: "Required for jobs over $2,500 in Weston (or $15,000 for HVAC). Must be recorded at Broward County before work begins." },
  system_type:         { reason: "Different HVAC system types require different permits and inspections.", tip: "If replacing only part of the system, select the specific component." },
  system_tons:         { reason: "Tonnage determines whether a Manual J energy calculation is required.", tip: "Found on the manufacturer nameplate or spec sheet." },
  model_number:        { reason: "Required for the equipment spec sheet attachment.", tip: "Found on the unit's data plate or in the installation manual." },
  window_count:        { reason: "The permit fee is based on the number of window openings.", tip: "Count each individual window or door opening separately." },
  scope_of_work:       { reason: "The city reviewer uses this to understand exactly what work is proposed.", tip: "Be specific — include materials, methods, and affected areas." },
};

export default function QuestionField({ question: q, value, onChange, prefilled, mode = "app" }) {
  const [whyOpen, setWhyOpen] = useState(false);
  const isWebMode = mode === "web";
  const why = WHY_WE_ASK[q.question_key] || (q.help_text ? { reason: q.help_text, tip: null } : null);

  let options = [];
  try { options = JSON.parse(q.options || "[]"); } catch {}

  const baseInput = `w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all`;
  const inputClass = `${baseInput} ${
    prefilled ? "border-green-200 bg-green-50 focus:ring-green-200" : "border-gray-200 focus:ring-blue-300"
  }`;

  const renderInput = () => {
    switch (q.input_type) {
      case "boolean":
        return (
          <div className="flex gap-3">
            {["Yes", "No"].map(opt => (
              <button key={opt} type="button"
                onClick={() => onChange(opt === "Yes" ? "true" : "false")}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                  value === (opt === "Yes" ? "true" : "false")
                    ? "border-blue-500 bg-blue-600 text-white"
                    : "border-gray-200 text-gray-600 hover:border-blue-200"
                }`}
              >{opt}</button>
            ))}
          </div>
        );
      case "select":
        return (
          <select value={value || ""} onChange={e => onChange(e.target.value)} className={inputClass}>
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
                <button key={o} type="button"
                  onClick={() => {
                    const next = active ? selected.filter(x => x !== o) : [...selected, o];
                    onChange(next.join(","));
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                    active ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:border-blue-200"
                  }`}
                >{o}</button>
              );
            })}
          </div>
        );
      case "number":
        return <input type="number" value={value || ""} onChange={e => onChange(e.target.value)} className={inputClass} placeholder="Enter number..." />;
      case "date":
        return <input type="date" value={value || ""} onChange={e => onChange(e.target.value)} className={inputClass} />;
      default:
        return <input type="text" value={value || ""} onChange={e => onChange(e.target.value)} className={inputClass} placeholder="Enter your answer..." />;
    }
  };

  return (
    <div className="mb-5">
      {/* Label row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <label className="text-sm font-semibold text-gray-800">
          {q.question_text}
          {q.is_required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {prefilled && (
          <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap">
            <Zap className="w-3 h-3" /> Auto-filled from your profile
          </span>
        )}
      </div>

      {renderInput()}

      {/* Why we ask — WEB MODE: always visible */}
      {why && isWebMode && (
        <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs">
          <p className="font-semibold text-amber-800 flex items-center gap-1 mb-1">
            <Lightbulb className="w-3 h-3" /> Why we ask this
          </p>
          <p className="text-amber-700">{why.reason}</p>
          {why.tip && <p className="text-amber-600 mt-1"><strong>Tip:</strong> {why.tip}</p>}
        </div>
      )}

      {/* Why we ask — APP MODE: collapsible */}
      {why && !isWebMode && (
        <div className="mt-1.5">
          <button
            type="button"
            onClick={() => setWhyOpen(v => !v)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-500 transition-colors"
          >
            <Info className="w-3 h-3" />
            Why we ask this
            {whyOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {whyOpen && (
            <div className="mt-1.5 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs">
              <p className="text-blue-700">{why.reason}</p>
              {why.tip && <p className="text-blue-600 mt-1"><strong>Tip:</strong> {why.tip}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}