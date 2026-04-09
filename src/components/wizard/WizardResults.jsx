import { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  CheckCircle2, AlertTriangle, FileText, ClipboardList, DollarSign,
  Clock, ArrowRight, Download, RefreshCw, Building2, ShieldCheck,
  MapPin, Info, ChevronDown, ChevronUp, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";

const COMPLEXITY_STYLES = {
  simple:   { label: "Simple",   color: "bg-green-100 text-green-700",  dot: "bg-green-500" },
  moderate: { label: "Moderate", color: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-500" },
  complex:  { label: "Complex",  color: "bg-red-100 text-red-700",      dot: "bg-red-500" },
};

const CATEGORY_COLORS = {
  building:    "bg-blue-50 border-blue-200 text-blue-700",
  electrical:  "bg-yellow-50 border-yellow-200 text-yellow-700",
  plumbing:    "bg-cyan-50 border-cyan-200 text-cyan-700",
  mechanical:  "bg-orange-50 border-orange-200 text-orange-700",
  fire:        "bg-red-50 border-red-200 text-red-700",
  other:       "bg-gray-50 border-gray-200 text-gray-700",
};

function PermitCard({ permit, index }) {
  const [expanded, setExpanded] = useState(index === 0);
  const colorClass = CATEGORY_COLORS[permit.category?.toLowerCase()] || CATEGORY_COLORS.other;

  return (
    <div className={`border rounded-2xl overflow-hidden ${permit.is_primary ? "border-blue-300 shadow-md" : "border-gray-200"}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full px-5 py-4 flex items-center justify-between text-left ${permit.is_primary ? "bg-blue-50" : "bg-white"}`}
      >
        <div className="flex items-center gap-3">
          {permit.is_primary && <Star className="w-4 h-4 text-blue-600 flex-shrink-0" />}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-900">{permit.type}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${colorClass}`}>
                {permit.category}
              </span>
              {permit.is_primary && <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">Primary</span>}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{permit.description}</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      </button>

      {expanded && (
        <div className="px-5 pb-5 pt-1 bg-white border-t border-gray-100">
          <div className="grid sm:grid-cols-2 gap-4 mt-3">
            {permit.documents_required?.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <FileText className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Documents Required</span>
                </div>
                <ul className="space-y-1">
                  {permit.documents_required.map((doc, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                      {doc}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {permit.inspections_required?.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <ClipboardList className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Inspections</span>
                </div>
                <ul className="space-y-1">
                  {permit.inspections_required.map((insp, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">{i + 1}</div>
                      {insp}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100">
            {permit.estimated_fee_range && (
              <div className="flex items-center gap-1.5 text-sm">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-gray-600">Est. Fee:</span>
                <span className="font-semibold text-gray-900">{permit.estimated_fee_range}</span>
              </div>
            )}
            {permit.typical_timeline && (
              <div className="flex items-center gap-1.5 text-sm">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-gray-600">Timeline:</span>
                <span className="font-semibold text-gray-900">{permit.typical_timeline}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function WizardResults({ intro, questionnaire, results, onRestart, onSaveProject }) {
  const complexity = COMPLEXITY_STYLES[results?.overall_complexity] || COMPLEXITY_STYLES.moderate;
  const permits = results?.permits_required || [];

  const handleExport = () => {
    const lines = [
      `PERMIT ASSESSMENT SUMMARY`,
      `Generated: ${new Date().toLocaleDateString()}`,
      ``,
      `PROJECT: ${intro.description}`,
      `CITY: ${questionnaire.answers?.city_name || "N/A"}`,
      `PROPERTY TYPE: ${questionnaire.answers?.property_type || "N/A"}`,
      ``,
      `PERMITS REQUIRED (${permits.length}):`,
      ...permits.map(p => [
        ``,
        `  ${p.is_primary ? "[PRIMARY] " : ""}${p.type} (${p.category})`,
        `  ${p.description}`,
        `  Estimated Fee: ${p.estimated_fee_range || "N/A"}`,
        `  Timeline: ${p.typical_timeline || "N/A"}`,
        `  Documents: ${(p.documents_required || []).join(", ")}`,
        `  Inspections: ${(p.inspections_required || []).join(", ")}`,
      ].join("\n")),
      ``,
      `ZONING CONSIDERATIONS:`,
      ...(results.zoning_considerations || []).map(z => `  • ${z}`),
      ``,
      `IMPORTANT NOTES:`,
      ...(results.important_notes || []).map(n => `  ⚠ ${n}`),
      ``,
      `NEXT STEPS:`,
      ...(results.next_steps || []).map((s, i) => `  ${i + 1}. ${s}`),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "permit-assessment.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="rounded-2xl p-6 text-white" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)" }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span className="text-sm font-medium text-blue-200">Assessment Complete</span>
            </div>
            <h2 className="text-xl font-bold mb-1">
              {permits.length} Permit{permits.length !== 1 ? "s" : ""} Required
            </h2>
            <p className="text-blue-200 text-sm line-clamp-2">{intro.description}</p>
          </div>
          <div className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full ${complexity.color}`}>
            <span className="mr-1.5 inline-block w-1.5 h-1.5 rounded-full align-middle" style={{ background: "currentColor" }} />
            {complexity.label}
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-white/20 text-sm">
          <div className="flex items-center gap-1.5 text-blue-200">
            <MapPin className="w-3.5 h-3.5" />{questionnaire.answers?.city_name || "Florida"}
          </div>
          <div className="flex items-center gap-1.5 text-blue-200">
            <Building2 className="w-3.5 h-3.5" />{questionnaire.answers?.property_type?.replace(/_/g," ") || "Residential"}
          </div>
          {results?.licensed_contractor_required && (
            <div className="flex items-center gap-1.5 text-yellow-300">
              <ShieldCheck className="w-3.5 h-3.5" />Licensed contractor required
            </div>
          )}
          {results?.can_be_owner_builder && (
            <div className="flex items-center gap-1.5 text-green-300">
              <CheckCircle2 className="w-3.5 h-3.5" />Owner-builder allowed
            </div>
          )}
        </div>
      </div>

      {/* Permits */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-blue-600" /> Required Permits
        </h3>
        {permits.map((p, i) => <PermitCard key={i} permit={p} index={i} />)}
      </div>

      {/* Zoning */}
      {results?.zoning_considerations?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-amber-600" />
            <h3 className="font-semibold text-amber-900">Zoning & Property Considerations</h3>
          </div>
          <ul className="space-y-1.5">
            {results.zoning_considerations.map((z, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-amber-600" />{z}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Important Notes */}
      {results?.important_notes?.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <h3 className="font-semibold text-red-900">Important Notes</h3>
          </div>
          <ul className="space-y-1.5">
            {results.important_notes.map((n, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-red-800">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />{n}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next Steps */}
      {results?.next_steps?.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <ArrowRight className="w-4 h-4 text-green-700" />
            <h3 className="font-semibold text-green-900">Next Steps</h3>
          </div>
          <ol className="space-y-2">
            {results.next_steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-green-800">
                <span className="w-5 h-5 rounded-full bg-green-600 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pt-2">
        <Button onClick={handleExport} variant="outline" className="gap-2">
          <Download className="w-4 h-4" /> Export Summary
        </Button>
        {onSaveProject && (
          <Button onClick={onSaveProject} variant="outline" className="gap-2">
            <Building2 className="w-4 h-4" /> Save to Project
          </Button>
        )}
        <Button onClick={onRestart} variant="outline" className="gap-2 ml-auto">
          <RefreshCw className="w-4 h-4" /> Start New Assessment
        </Button>
      </div>
    </div>
  );
}