import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight } from "lucide-react";
import ConfirmWithCity from "@/components/ConfirmWithCity";

/**
 * Shared display for the `ar-tools` checkPermit response.
 * Renders property match, "what I see", per-structure permit cards,
 * red flags, next steps, and a "Start this Permit" CTA.
 */
export default function PhotoAnalysisResults({ analysis, city }) {
  if (!analysis) return null;
  const a = analysis.analysis || {};
  const startCity = city || analysis.city || "";

  return (
    <div className="space-y-3">
      {/* Property identified */}
      {analysis.property_found && analysis.property && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5">
          <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wide mb-0.5">📍 Property Identified</p>
          <p className="text-sm font-semibold text-gray-900 leading-snug">{analysis.property.full_address}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Folio: {analysis.property.folio_number}
            {analysis.property.city_name ? ` · ${analysis.property.city_name}` : ""}
          </p>
        </div>
      )}

      {/* What I see */}
      {a.what_i_see && (
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">What we see</p>
          <p className="text-sm text-gray-700 italic">"{a.what_i_see}"</p>
        </div>
      )}

      {/* AI error */}
      {a.ai_error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
          <p className="text-sm font-semibold text-amber-700">⚠️ AI Analysis Temporarily Unavailable</p>
          <p className="text-xs text-amber-600 mt-0.5">Property identification worked. Contact the building department for permit requirements.</p>
        </div>
      )}

      {/* Structures */}
      {a.structures?.length > 0 && a.structures.map((s, i) => {
        const hvhz = s.hvhz || s.hvhz_requirement;
        return (
          <div
            key={i}
            className={`rounded-xl p-3 border ${s.permit_required ? "border-red-200 bg-red-50/50" : "border-green-200 bg-green-50/50"}`}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <p className="text-sm font-bold text-gray-900">{s.visual_label || s.name || s.permit_name}</p>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                  s.permit_required ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                }`}
              >
                {s.permit_required ? "Permit Required" : "No Permit Needed"}
              </span>
            </div>
            {s.permit_required && s.permit_name && (
              <p className="text-sm font-semibold text-gray-800">{s.permit_name}</p>
            )}
            {s.fee_explanation && <p className="text-xs text-gray-600 mt-1">💰 {s.fee_explanation}</p>}
            {hvhz && <p className="text-xs text-amber-700 mt-1">⚡ {hvhz}</p>}
            {s.noc_required && (
              <p className="text-xs text-gray-500 mt-1">📋 {s.noc_threshold ? `NOC required if over ${s.noc_threshold}` : "A Notice of Commencement may be required — check the threshold with your city"}</p>
            )}
            {s.already_permitted && (
              <p className="text-xs text-green-600 mt-1">✅ {s.permit_history_note || "This work appears to already have a permit on file"}</p>
            )}
            {s.notes && <p className="text-xs text-gray-500 mt-1">{s.notes}</p>}
            {s.permit_required && s.permit_name && (
              <Link
                to={`/PermitInfo?permit=${encodeURIComponent(s.permit_name)}&city=${encodeURIComponent(startCity || "")}`}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-1.5 rounded-lg no-underline hover:opacity-90 transition-opacity"
                style={{ background: "#003466" }}
              >
                See Requirements <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        );
      })}

      {/* No permit needed */}
      {a.no_permit_needed?.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
          <p className="text-sm font-semibold text-green-700 mb-1">✅ No Permit Needed For:</p>
          {a.no_permit_needed.map((item, i) => (
            <p key={i} className="text-xs text-green-700">• {item}</p>
          ))}
        </div>
      )}

      {/* Red flags */}
      {a.red_flags?.length > 0 && (
        <div className="bg-red-50 border border-red-300 rounded-xl px-3 py-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <p className="text-sm font-bold text-red-700">Concerns</p>
          </div>
          {a.red_flags.map((flag, i) => (
            <p key={i} className="text-xs text-red-700">• {flag}</p>
          ))}
        </div>
      )}

      {/* Next steps */}
      {a.next_steps && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3">
          <p className="text-[11px] font-semibold text-indigo-500 uppercase tracking-wide mb-1">Next Steps</p>
          <p className="text-sm text-indigo-800">{a.next_steps}</p>
        </div>
      )}

      <ConfirmWithCity
        city={startCity}
        permitFound={(a.structures || []).some(s => s.permit_required)}
      />
    </div>
  );
}