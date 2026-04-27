import { useState } from "react";
import { useCities } from "@/hooks/useCities";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, Loader2, MapPin, Home, Building2, HelpCircle } from "lucide-react";

const SUPABASE_URL = "https://gbknnjidqpmjrwlooluw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdia25uamlkcXBtanJ3bG9vbHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NTQzNDIsImV4cCI6MjA5MDIzMDM0Mn0.qwDACgXe3hesxBRQOzP53Hdc44z_UOka1_uYQScyi68";
const SB_HEADERS = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` };

function QuestionField({ q, value, onChange }) {
  if (q.type === "select") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
        {(q.options || []).map(opt => {
          const label = typeof opt === "object" ? opt.label : opt;
          const val = typeof opt === "object" ? opt.value : opt;
          return (
            <button
              key={val}
              onClick={() => onChange(val)}
              className={`px-4 py-3 rounded-xl border text-sm font-medium text-left transition-all ${
                value === val
                  ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                  : "border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50/50"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    );
  }
  if (q.type === "boolean") {
    return (
      <div className="flex gap-3 mt-2">
        {["Yes", "No"].map(opt => (
          <button
            key={opt}
            onClick={() => onChange(opt === "Yes")}
            className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${
              value === (opt === "Yes")
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 bg-white text-gray-700 hover:border-blue-300"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    );
  }
  if (q.type === "number") {
    return (
      <Input
        type="number"
        className="mt-2"
        placeholder={q.placeholder || "Enter a number..."}
        value={value || ""}
        onChange={e => onChange(e.target.value)}
      />
    );
  }
  return (
    <Input
      className="mt-2"
      placeholder={q.placeholder || "Your answer..."}
      value={value || ""}
      onChange={e => onChange(e.target.value)}
    />
  );
}

const PROPERTY_TYPES = [
  { value: "residential_single", label: "Single-Family Home" },
  { value: "residential_multi", label: "Multi-Family / Condo" },
  { value: "commercial", label: "Commercial / Office" },
  { value: "industrial", label: "Industrial / Warehouse" },
  { value: "mixed_use", label: "Mixed Use" },
];

export default function WizardQuestionnaire({ intro, onNext, onBack }) {
  const { description, aiParsed } = intro;

  const [step, setStep] = useState("city"); // city → property_type → details → review
  const [cityId, setCityId] = useState(""); // kept for compatibility but cityName is the source of truth
  const [cityName, setCityName] = useState("");
  const [propertyType, setPropertyType] = useState(aiParsed?.property_type_guess === "commercial" ? "commercial" : "");
  const [detailAnswers, setDetailAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const { cities } = useCities();

  const questions = aiParsed?.key_questions || [];

  const answeredCount = Object.keys(detailAnswers).filter(k => detailAnswers[k] !== "" && detailAnswers[k] !== undefined).length;
  const requiredCount = questions.filter(q => q.required !== false).length;

  const handleSubmitDetails = async () => {
    setSubmitting(true);

    const allAnswers = {
      city_id: cityId,
      city_name: cityName,
      property_type: propertyType,
      category: aiParsed?.category,
      work_type: aiParsed?.work_type,
      summary: aiParsed?.summary,
      ...detailAnswers,
    };

    try {
      // Fetch real permit type records from Supabase for this city
      let permitTypeContext = "";
      try {
        if (cityName && cityName !== "Other / Unknown") {
          const tableName = cityName.toLowerCase().replace(/ /g, "_") + "_permit_types";
          const res = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?select=*`, { headers: SB_HEADERS });
          const permitTypes = await res.json();
          if (Array.isArray(permitTypes) && permitTypes.length > 0) {
            permitTypeContext = `\n\nREAL PERMIT TYPE DATABASE (use these actual requirements):\n` +
              permitTypes.map(pt => {
                const docs = typeof pt.documents_needed === "string" ? JSON.parse(pt.documents_needed || "[]") : (pt.documents_needed || []);
                const reqs = typeof pt.typical_requirements === "string" ? JSON.parse(pt.typical_requirements || "[]") : (pt.typical_requirements || []);
                const insps = typeof pt.inspections_required === "string" ? JSON.parse(pt.inspections_required || "[]") : (pt.inspections_required || []);
                return [
                  `PERMIT: ${pt.name} (${pt.category}) — City: ${cityName}`,
                  pt.description ? `  Description: ${pt.description}` : "",
                  docs.length ? `  Documents Required: ${docs.join("; ")}` : "",
                  reqs.length ? `  Typical Requirements: ${reqs.join("; ")}` : "",
                  insps.length ? `  Inspections: ${insps.join("; ")}` : "",
                  pt.typical_timeline ? `  Timeline: ${pt.typical_timeline}` : "",
                ].filter(Boolean).join("\n");
              }).join("\n\n");
          }
        }
      } catch {}

      const results = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert permit consultant for Florida municipalities. Based on the following project details, determine exactly what permits are needed.

PROJECT DESCRIPTION: "${description}"
AI-CATEGORIZED AS: ${aiParsed?.category} / ${aiParsed?.work_type}
CITY/JURISDICTION: ${cityName || "Florida (general)"}
PROPERTY TYPE: ${propertyType}
DETAILED ANSWERS: ${JSON.stringify(detailAnswers, null, 2)}
${permitTypeContext}

IMPORTANT: If the REAL PERMIT TYPE DATABASE above contains matching permit types for this project and city, use the EXACT documents_required, inspections_required, and timeline from those records. Do not invent generic ones when real data is available.

Return a detailed JSON permit assessment with:
- permits_required: array of permit objects, each with:
  * type: permit type name
  * category: (building/electrical/plumbing/mechanical/fire/other)
  * is_primary: boolean
  * description: why this permit is needed
  * documents_required: array of required documents (use real data from database if available)
  * inspections_required: array of inspection stages (use real data from database if available)
  * estimated_fee_range: e.g. "$150 - $500"
  * typical_timeline: e.g. "2-4 weeks" (use real data from database if available)
- zoning_considerations: array of strings (setbacks, height limits, HOA, flood zone notes, etc.)
- important_notes: array of warning strings
- next_steps: array of step strings (what to do now)
- can_be_owner_builder: boolean
- licensed_contractor_required: boolean
- overall_complexity: one of [simple, moderate, complex]

Be specific, practical, and jurisdiction-aware. Prioritize real database data over generic answers.`,
        response_json_schema: {
          type: "object",
          properties: {
            permits_required: { type: "array", items: { type: "object" } },
            zoning_considerations: { type: "array", items: { type: "string" } },
            important_notes: { type: "array", items: { type: "string" } },
            next_steps: { type: "array", items: { type: "string" } },
            can_be_owner_builder: { type: "boolean" },
            licensed_contractor_required: { type: "boolean" },
            overall_complexity: { type: "string" }
          }
        }
      });

      onNext({ answers: allAnswers, results });
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-6">
        {["city", "property_type", "details", "review"].map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
              step === s ? "bg-blue-600 text-white" :
              ["city", "property_type", "details", "review"].indexOf(step) > i ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
            }`}>{i + 1}</div>
            {i < 3 && <div className={`h-0.5 flex-1 ${["city", "property_type", "details", "review"].indexOf(step) > i ? "bg-green-400" : "bg-gray-200"}`} />}
          </div>
        ))}
      </div>

      {/* Summary pill */}
      <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 mb-5 text-sm text-blue-800">
        <Sparkle className="w-4 h-4 text-blue-500 flex-shrink-0" />
        <span>{aiParsed?.summary || description}</span>
      </div>

      {step === "city" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Which city or municipality is the project in?</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
            {cities.map(c => (
              <button
                key={c.name}
                onClick={() => { setCityId(c.name); setCityName(c.name); }}
                className={`px-4 py-3 rounded-xl border text-sm font-medium text-left transition-all ${
                  cityName === c.name ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-700 hover:border-blue-300"
                }`}
              >
                {c.name}
              </button>
            ))}
            <button
              onClick={() => { setCityId(""); setCityName("Other / Unknown"); }}
              className={`px-4 py-3 rounded-xl border text-sm font-medium text-left transition-all ${
                cityName === "Other / Unknown" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-700 hover:border-blue-300"
              }`}
            >
              Other / Not Listed
            </button>
          </div>
          <div className="flex gap-3 mt-5">
            <Button variant="outline" onClick={onBack} className="gap-1"><ArrowLeft className="w-4 h-4" /> Back</Button>
            <Button
              disabled={!cityName}
              onClick={() => setStep("property_type")}
              className="flex-1 gap-1 text-white"
              style={{ background: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)" }}
            >
              Continue <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {step === "property_type" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Home className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">What type of property is this?</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PROPERTY_TYPES.map(pt => (
              <button
                key={pt.value}
                onClick={() => setPropertyType(pt.value)}
                className={`px-4 py-3 rounded-xl border text-sm font-medium text-left transition-all ${
                  propertyType === pt.value ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-700 hover:border-blue-300"
                }`}
              >
                {pt.label}
              </button>
            ))}
          </div>
          <div className="flex gap-3 mt-5">
            <Button variant="outline" onClick={() => setStep("city")} className="gap-1"><ArrowLeft className="w-4 h-4" /> Back</Button>
            <Button
              disabled={!propertyType}
              onClick={() => setStep("details")}
              className="flex-1 gap-1 text-white"
              style={{ background: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)" }}
            >
              Continue <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {step === "details" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-1">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">A few more details</h3>
          </div>
          <p className="text-sm text-gray-500 mb-5">Answer as many as you can — more detail means better results.</p>
          <div className="space-y-5">
            {questions.map(q => (
              <div key={q.id}>
                <label className="block text-sm font-medium text-gray-800">{q.question}</label>
                <QuestionField
                  q={q}
                  value={detailAnswers[q.id]}
                  onChange={val => setDetailAnswers(prev => ({ ...prev, [q.id]: val }))}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={() => setStep("property_type")} className="gap-1"><ArrowLeft className="w-4 h-4" /> Back</Button>
            <Button
              onClick={handleSubmitDetails}
              disabled={submitting}
              className="flex-1 gap-1 text-white"
              style={{ background: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)" }}
            >
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing permits...</> : <>Get My Permit Results <ArrowRight className="w-4 h-4" /></>}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Sparkle({ className }) {
  return <Loader2 className={className} style={{ animation: "none" }} />;
}