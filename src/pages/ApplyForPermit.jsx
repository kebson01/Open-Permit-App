import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { supabase } from "@/lib/supabaseClient";
import { searchProperties } from "@/lib/searchProperties";
import { Link } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Loader2, Check, Copy, CheckCircle2,
  Search, Home, Wrench, Shield, ExternalLink, AlertTriangle, FileText
} from "lucide-react";

// ── Constants ──────────────────────────────────────────────────────────
const CITIES = ["Weston", "Hollywood", "Coral Springs", "Cooper City", "Fort Lauderdale", "Sunrise"];

const CITY_PORTALS = {
  "Weston": "https://www.westonfl.org/Permits",
  "Hollywood": "https://www.hollywoodfl.org/permits",
  "Coral Springs": "https://www.coralsprings.org/permits",
  "Cooper City": "https://www.coopercityfl.org/permits",
  "Fort Lauderdale": "https://lauderbuild.fortlauderdale.gov",
  "Sunrise": "https://www.sunrisefl.gov/permits",
};

const CITY_PERMIT_TABLES = {
  "Weston": "weston_permit_types",
  "Hollywood": "hollywood_permit_types",
  "Coral Springs": "coral_springs_permit_types",
  "Cooper City": "cooper_city_permit_types",
  "Fort Lauderdale": "fort_lauderdale_permit_types",
  "Sunrise": "sunrise_permit_types",
};

const STEP_LABELS = ["Setup", "Permit Type", "Application", "Review", "Submit"];

// ── Progress Bar ───────────────────────────────────────────────────────
function ProgressBar({ currentStep }) {
  return (
    <div className="flex items-center justify-center gap-0 py-4">
      {STEP_LABELS.map((label, idx) => {
        const stepNum = idx + 1;
        const isComplete = stepNum < currentStep;
        const isCurrent = stepNum === currentStep;
        return (
          <div key={stepNum} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 ${
                isComplete ? "bg-teal-500 border-teal-500 text-white" :
                isCurrent ? "bg-[#004ac6] border-[#004ac6] text-white" :
                "bg-white border-gray-300 text-gray-400"
              }`}>
                {isComplete ? <Check className="w-3.5 h-3.5" /> : stepNum}
              </div>
              <span className={`text-[9px] font-semibold whitespace-nowrap ${
                isCurrent ? "text-[#004ac6]" : isComplete ? "text-teal-500" : "text-gray-400"
              }`}>{label}</span>
            </div>
            {idx < STEP_LABELS.length - 1 && (
              <div className={`w-8 sm:w-12 h-0.5 mb-4 ${isComplete ? "bg-teal-500" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────
function calcFee(feeRule, answers) {
  if (!feeRule) return null;
  const tech = feeRule.technology_admin_fee || 0;
  const jobVal = parseFloat(answers?.job_valuation || answers?.construction_cost || 0);
  const linFt = parseFloat(answers?.linear_feet || 0);
  switch (feeRule.calc_type) {
    case "flat": return (feeRule.flat_fee || 0) + tech;
    case "flat_plus_pct": return (feeRule.base_fee || 0) + ((feeRule.rate_percentage || 0) / 100 * jobVal) + tech;
    case "flat_plus_linear": return (feeRule.base_fee || 0) + (feeRule.rate_per_linear_ft || 0) * Math.max(0, linFt - (feeRule.base_includes_ft || 0)) + tech;
    default: return (feeRule.flat_fee || feeRule.base_fee || 0) + tech;
  }
}

function getDocumentList(permitName) {
  const n = (permitName || "").toLowerCase();
  if (n.includes("roof")) return ["Signed & Sealed Plans", "Florida Product Approval / NOA", "Contractor License", "Certificate of Insurance", "HOA Approval Letter (if applicable)"];
  if (n.includes("pool")) return ["Pool Construction Plans", "Contractor License", "Certificate of Insurance", "Pool Barrier Plan", "HOA Approval Letter (if applicable)"];
  if (n.includes("screen") || n.includes("enclosure")) return ["Enclosure Plans", "NOA / Product Approval", "Contractor License", "Certificate of Insurance", "HOA Approval Letter (if applicable)"];
  return ["Plans / Drawings", "Contractor License", "Certificate of Insurance"];
}

function hasGuidedQuestions(permitName, questionsAvailable) {
  const base = (permitName || "").split("/")[0].trim().toLowerCase();
  return Array.from(questionsAvailable).some(q =>
    q.toLowerCase().includes(base) || base.includes(q.split("/")[0].trim().toLowerCase())
  );
}

// ── Main Component ─────────────────────────────────────────────────────
export default function ApplyForPermit() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ── Shared wizard state ──
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState("homeowner");
  const [selectedCity, setSelectedCity] = useState("Weston");
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [selectedPermit, setSelectedPermit] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [feeRule, setFeeRule] = useState(null);
  const [guideId, setGuideId] = useState(null);
  const [portalChecked, setPortalChecked] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [confirmationNumber, setConfirmationNumber] = useState("");

  useEffect(() => {
    base44.auth.me().then(u => setCurrentUser(u || null)).catch(() => {}).finally(() => setAuthLoading(false));
  }, []);

  const resetAll = () => {
    setCurrentStep(1); setSelectedRole("homeowner"); setSelectedCity("Weston");
    setSelectedProperty(null); setSelectedPermit(null); setQuestions([]); setAnswers({});
    setCurrentSectionIndex(0); setFeeRule(null); setGuideId(null); setPortalChecked({});
    setSubmitting(false); setSubmitError(""); setSubmitted(false); setConfirmationNumber("");
  };

  const calculatedFee = calcFee(feeRule, answers);

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#FAF8FF" }}>
      <Loader2 className="w-6 h-6 animate-spin text-[#004ac6]" />
    </div>
  );

  const stepTitles = ["Setup", "Select Permit Type", "Application Questions", "Review & Prepare", "Guided Submission"];

  return (
    <div className="min-h-screen pb-16" style={{ background: "#F5F6FA" }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-6 pb-2">
        <div className="max-w-2xl mx-auto">
          <ProgressBar currentStep={currentStep} />
          <h1 className="text-xl font-extrabold text-gray-900 mt-1" style={{ fontFamily: "'Manrope', system-ui, sans-serif" }}>
            {stepTitles[currentStep - 1]}
          </h1>
          {currentStep === 1 && <p className="text-sm text-gray-400 mt-0.5">Tell us who you are and where the work will be performed.</p>}
          {currentStep === 2 && <p className="text-sm text-gray-400 mt-0.5">Select the type of permit you need for <strong>{selectedCity}</strong>.</p>}
          {currentStep === 3 && <p className="text-sm text-gray-400 mt-0.5">Answer questions to prepare your application.</p>}
          {currentStep === 4 && <p className="text-sm text-gray-400 mt-0.5">Review your answers, fee estimate, and required documents.</p>}
          {currentStep === 5 && <p className="text-sm text-gray-400 mt-0.5">Open the city portal and enter each field as you go.</p>}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-5">
        {currentStep === 1 && (
          <Step1
            selectedRole={selectedRole} setSelectedRole={setSelectedRole}
            selectedCity={selectedCity} setSelectedCity={setSelectedCity}
            selectedProperty={selectedProperty} setSelectedProperty={setSelectedProperty}
            onNext={() => setCurrentStep(2)}
          />
        )}
        {currentStep === 2 && (
          <Step2
            selectedCity={selectedCity}
            selectedPermit={selectedPermit} setSelectedPermit={setSelectedPermit}
            onBack={() => setCurrentStep(1)}
            onNext={() => setCurrentStep(3)}
          />
        )}
        {currentStep === 3 && (
          <Step3
            selectedCity={selectedCity}
            selectedPermit={selectedPermit}
            selectedProperty={selectedProperty}
            currentUser={currentUser}
            questions={questions} setQuestions={setQuestions}
            answers={answers} setAnswers={setAnswers}
            currentSectionIndex={currentSectionIndex} setCurrentSectionIndex={setCurrentSectionIndex}
            onBack={() => setCurrentStep(2)}
            onNext={() => setCurrentStep(4)}
          />
        )}
        {currentStep === 4 && (
          <Step4
            selectedCity={selectedCity}
            selectedPermit={selectedPermit}
            questions={questions}
            answers={answers}
            feeRule={feeRule} setFeeRule={setFeeRule}
            calculatedFee={calculatedFee}
            onBack={() => setCurrentStep(3)}
            onNext={() => setCurrentStep(5)}
          />
        )}
        {currentStep === 5 && (
          <Step5
            selectedRole={selectedRole}
            selectedCity={selectedCity}
            selectedPermit={selectedPermit}
            selectedProperty={selectedProperty}
            questions={questions}
            answers={answers}
            feeRule={feeRule}
            calculatedFee={calculatedFee}
            currentUser={currentUser}
            guideId={guideId} setGuideId={setGuideId}
            portalChecked={portalChecked} setPortalChecked={setPortalChecked}
            submitting={submitting} setSubmitting={setSubmitting}
            submitError={submitError} setSubmitError={setSubmitError}
            submitted={submitted} setSubmitted={setSubmitted}
            confirmationNumber={confirmationNumber} setConfirmationNumber={setConfirmationNumber}
            onBack={() => setCurrentStep(4)}
            onReset={resetAll}
          />
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// STEP 1 — SETUP
// ══════════════════════════════════════════════════════════════════════
function Step1({ selectedRole, setSelectedRole, selectedCity, setSelectedCity, selectedProperty, setSelectedProperty, onNext }) {
  const [propertySearch, setPropertySearch] = useState("");
  const [propertyResults, setPropertyResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  const ROLES = [
    { key: "homeowner", icon: Home, label: "Homeowner", sub: "Managing your own home or property" },
    { key: "contractor", icon: Wrench, label: "Contractor", sub: "Licensed contractor pulling permits" },
    { key: "private_provider", icon: Shield, label: "Private Provider", sub: "FL Statute 553.791 provider" },
  ];

  const handleSearch = () => searchProperties(propertySearch, setPropertyResults, setSearchLoading, setSearchError);

  return (
    <div className="space-y-6">
      {/* Role */}
      <Card>
        <SectionLabel>I am applying as a</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
          {ROLES.map(r => {
            const Icon = r.icon;
            const active = selectedRole === r.key;
            return (
              <button key={r.key} onClick={() => setSelectedRole(r.key)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all ${active ? "border-[#004ac6] bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                <Icon className={`w-6 h-6 ${active ? "text-[#004ac6]" : "text-gray-400"}`} />
                <div>
                  <p className={`font-semibold text-sm ${active ? "text-[#004ac6]" : "text-gray-800"}`}>{r.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{r.sub}</p>
                </div>
              </button>
            );
          })}
        </div>
        {selectedRole === "homeowner" && (
          <div className="mt-3 flex items-start gap-2 bg-blue-50 rounded-lg px-3 py-2.5">
            <span className="text-blue-500 text-sm">ℹ️</span>
            <p className="text-xs text-blue-700">Homeowners can apply for most residential permits without a license if they live in the property.</p>
          </div>
        )}
      </Card>

      {/* City */}
      <Card>
        <SectionLabel>Jurisdiction / City</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
          {CITIES.map(c => (
            <button key={c} onClick={() => setSelectedCity(c)}
              className={`py-2.5 px-3 rounded-lg text-sm font-medium border-2 transition-all ${selectedCity === c ? "bg-[#004ac6] border-[#004ac6] text-white" : "border-gray-200 text-gray-700 hover:border-[#004ac6] hover:text-[#004ac6]"}`}>
              {c}
            </button>
          ))}
        </div>
      </Card>

      {/* Property Search */}
      <Card>
        <SectionLabel>Property <span className="text-gray-400 font-normal">(Optional)</span></SectionLabel>
        <p className="text-xs text-gray-400 mt-0.5 mb-3">Selecting a property will auto-fill your application</p>

        {selectedProperty ? (
          <div className="flex items-start justify-between p-4 rounded-xl bg-teal-50 border border-teal-200">
            <div className="flex items-start gap-2 min-w-0">
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-bold text-sm text-gray-900 leading-snug">{selectedProperty.full_address}</p>
                <p className="text-xs text-gray-500 mt-0.5">Owner: {selectedProperty.owner_name || "—"}</p>
                <p className="text-xs font-mono text-gray-400 mt-0.5">Folio: {selectedProperty.folio_number}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {[
                    selectedProperty.year_built ? `${selectedProperty.year_built} built` : null,
                    selectedProperty.total_sqft ? `${parseInt(selectedProperty.total_sqft).toLocaleString()} sq ft` : null,
                    (selectedProperty.beds || selectedProperty.baths) ? `${selectedProperty.beds || "—"} bed / ${selectedProperty.baths || "—"} bath` : null,
                    selectedProperty.homestead_flag === "Y" ? "Homestead: Yes" : selectedProperty.homestead_flag === "N" ? "Homestead: No" : null,
                  ].filter(Boolean).join(" · ")}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0 ml-3">
              <span className="text-xs text-gray-400">{selectedProperty.city_name}</span>
              <button onClick={() => { setSelectedProperty(null); setPropertyResults([]); setPropertySearch(""); }}
                className="text-xs text-teal-600 font-semibold underline">Clear</button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2.5 bg-white focus-within:border-[#004ac6]">
                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  type="text"
                  value={propertySearch}
                  onChange={e => { setPropertySearch(e.target.value); setSearchError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleSearch()}
                  placeholder="Address, owner name, or folio #"
                  className="flex-1 text-sm focus:outline-none bg-transparent text-gray-800"
                />
              </div>
              <button onClick={handleSearch} disabled={searchLoading}
                className="px-4 py-2.5 rounded-lg bg-[#004ac6] text-white text-sm font-semibold disabled:opacity-60 flex items-center gap-1.5 shrink-0">
                {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
              </button>
            </div>
            {searchError && <p className="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">{searchError}</p>}
            {propertyResults.length > 0 && (
              <div className="border border-gray-200 rounded-xl overflow-hidden max-h-52 overflow-y-auto shadow-sm">
                {propertyResults.map(p => (
                  <button key={p.folio_number} onClick={() => { setSelectedProperty(p); setPropertyResults([]); setPropertySearch(""); }}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-0 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-gray-900">{p.full_address}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{p.owner_name}</p>
                        <p className="text-xs font-mono text-gray-400 mt-0.5">{p.folio_number}</p>
                      </div>
                      <span className="text-xs text-gray-400 shrink-0 mt-0.5">{p.city_name}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      <PrimaryButton onClick={onNext} disabled={!selectedRole || !selectedCity}>
        Continue to Permit Type <ArrowRight className="w-4 h-4" />
      </PrimaryButton>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// STEP 2 — PERMIT TYPE
// ══════════════════════════════════════════════════════════════════════
function Step2({ selectedCity, selectedPermit, setSelectedPermit, onBack, onNext }) {
  const [permitTypes, setPermitTypes] = useState([]);
  const [questionsAvailable, setQuestionsAvailable] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError("");
      try {
        const table = CITY_PERMIT_TABLES[selectedCity];
        if (!table) throw new Error("City not configured");
        const [{ data: pts, error: e1 }, { data: qs }] = await Promise.all([
          supabase.from(table).select("id,name,category,description,typical_timeline").order("category"),
          supabase.from("city_application_questions").select("permit_type_name").eq("city_name", selectedCity).eq("is_active", true),
        ]);
        if (e1) throw e1;
        setPermitTypes(pts || []);
        setQuestionsAvailable(new Set((qs || []).map(q => q.permit_type_name || "")));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedCity]);

  const grouped = {};
  permitTypes.forEach(pt => {
    const cat = pt.category || "other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(pt);
  });

  return (
    <div className="space-y-5">
      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#004ac6]" /></div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
      ) : (
        Object.entries(grouped).map(([cat, types]) => (
          <div key={cat}>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{cat}</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {types.map(pt => {
                const guided = hasGuidedQuestions(pt.name, questionsAvailable);
                const active = selectedPermit?.id === pt.id;
                return (
                  <button key={pt.id} onClick={() => setSelectedPermit(pt)}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${active ? "border-[#004ac6] bg-blue-50" : "border-gray-200 bg-white hover:border-[#004ac6]"}`}>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className={`font-semibold text-sm ${active ? "text-[#004ac6]" : "text-gray-900"}`}>{pt.name}</p>
                      {guided
                        ? <span className="text-[10px] px-2 py-0.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-full font-semibold whitespace-nowrap">✓ Guided</span>
                        : <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full whitespace-nowrap">Coming soon</span>}
                    </div>
                    {pt.description && <p className="text-xs text-gray-500 line-clamp-2">{pt.description}</p>}
                    {pt.typical_timeline && <p className="text-xs text-[#004ac6] mt-1.5">⏱ {pt.typical_timeline}</p>}
                  </button>
                );
              })}
            </div>
          </div>
        ))
      )}
      <NavButtons onBack={onBack} onNext={onNext} nextDisabled={!selectedPermit} nextLabel="Continue to Application →" />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// STEP 3 — APPLICATION Q&A
// ══════════════════════════════════════════════════════════════════════
function Step3({ selectedCity, selectedPermit, selectedProperty, currentUser, questions, setQuestions, answers, setAnswers, currentSectionIndex, setCurrentSectionIndex, onBack, onNext }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError("");
      try {
        const base = selectedPermit.name.split("/")[0].trim();
        const { data, error: err } = await supabase
          .from("city_application_questions")
          .select("*")
          .eq("city_name", selectedCity)
          .ilike("permit_type_name", `%${base}%`)
          .eq("is_active", true)
          .order("display_order");
        if (err) throw err;
        const loaded = data || [];
        setQuestions(loaded);
        setCurrentSectionIndex(0);

        // Auto-prefill
        const prefillMap = {
          "property.full_address": selectedProperty?.full_address,
          "property.FOLIO_NUMBER": selectedProperty?.folio_number,
          "property.NAME_LINE_1": selectedProperty?.owner_name,
          "property.HOMESTEAD_FLAG": selectedProperty?.homestead_flag === "Y" ? "Yes" : selectedProperty?.homestead_flag === "N" ? "No" : null,
          "property.BLDG_TOT_SQ_FOOTAGE": selectedProperty?.total_sqft?.toString(),
          "project.estimated_cost": null,
          "project.description": null,
          "project.square_footage": selectedProperty?.total_sqft?.toString(),
          "user.email": currentUser?.email || null,
          "user.phone": null,
          "contractor.company_name": null,
          "contractor.license_number": null,
          "contractor.phone": null,
          "contractor.insurance_expiration": null,
        };
        const prefilled = {};
        loaded.forEach(q => {
          const val = prefillMap[q.prefill_from];
          if (q.prefill_from && val) prefilled[q.question_key] = val;
        });
        if (Object.keys(prefilled).length > 0) {
          setAnswers(prev => ({ ...prefilled, ...prev }));
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedCity, selectedPermit?.name]);

  const grouped = {};
  questions.forEach(q => {
    const sec = q.section || "General";
    if (!grouped[sec]) grouped[sec] = [];
    grouped[sec].push(q);
  });
  const sections = Object.entries(grouped);

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#004ac6]" /></div>;
  if (error) return <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>;

  if (questions.length === 0) {
    return (
      <div className="space-y-4">
        <Card>
          <div className="flex items-start gap-3">
            <span className="text-blue-400 mt-0.5">ℹ️</span>
            <p className="text-sm text-blue-800">Guided questions are not yet available for <strong>{selectedPermit.name}</strong> in <strong>{selectedCity}</strong>. You can still continue to review and submit your application.</p>
          </div>
        </Card>
        <NavButtons onBack={onBack} onNext={onNext} nextLabel="Continue to Review →" />
      </div>
    );
  }

  const [sectionName, sectionQuestions] = sections[currentSectionIndex] || [];
  const visibleQuestions = (sectionQuestions || []).filter(q =>
    !q.conditional_on_key || answers[q.conditional_on_key] === q.conditional_on_value
  );
  const prefillKeys = new Set(questions.filter(q => q.prefill_from && answers[q.question_key]).map(q => q.question_key));
  const sectionProgress = Math.round(((currentSectionIndex + 1) / sections.length) * 100);
  const isLastSection = currentSectionIndex === sections.length - 1;

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900 text-base">{sectionName}</h3>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Section {currentSectionIndex + 1} of {sections.length}</span>
      </div>
      <div className="w-full h-1.5 bg-gray-200 rounded-full">
        <div className="h-1.5 bg-[#004ac6] rounded-full transition-all" style={{ width: `${sectionProgress}%` }} />
      </div>

      {/* Questions */}
      <div className="space-y-3">
        {visibleQuestions.map((q, qi) => {
          const isPrefilled = prefillKeys.has(q.question_key);
          return (
            <div key={q.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2 mb-2">
                <label className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                  <span className="text-xs text-gray-400 font-normal">{qi + 1}.</span>
                  {q.question_text}
                  {q.is_required && <span className="text-red-500">*</span>}
                </label>
                {isPrefilled && <span className="text-[10px] px-2 py-0.5 bg-teal-50 text-teal-600 border border-teal-200 rounded-full font-semibold whitespace-nowrap shrink-0">Auto-filled</span>}
              </div>

              {(q.input_type === "text" || q.input_type === "address") && (
                <input type="text" value={answers[q.question_key] || ""} onChange={e => setAnswers({ ...answers, [q.question_key]: e.target.value })}
                  placeholder="Enter your answer..." className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#004ac6]" />
              )}
              {q.input_type === "number" && (
                <input type="number" value={answers[q.question_key] || ""} onChange={e => setAnswers({ ...answers, [q.question_key]: e.target.value })}
                  placeholder="0" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#004ac6]" />
              )}
              {q.input_type === "date" && (
                <input type="date" value={answers[q.question_key] || ""} onChange={e => setAnswers({ ...answers, [q.question_key]: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#004ac6]" />
              )}
              {q.input_type === "boolean" && (
                <div className="flex gap-2">
                  <button onClick={() => setAnswers({ ...answers, [q.question_key]: "Yes" })}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${answers[q.question_key] === "Yes" ? "bg-green-50 border-green-500 text-green-700" : "border-gray-300 text-gray-600 hover:border-green-400"}`}>Yes</button>
                  <button onClick={() => setAnswers({ ...answers, [q.question_key]: "No" })}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${answers[q.question_key] === "No" ? "bg-red-50 border-red-400 text-red-700" : "border-gray-300 text-gray-600 hover:border-red-300"}`}>No</button>
                </div>
              )}
              {q.input_type === "select" && (
                <select value={answers[q.question_key] || ""} onChange={e => setAnswers({ ...answers, [q.question_key]: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#004ac6]">
                  <option value="">— Select an option —</option>
                  {(Array.isArray(q.options) ? q.options : []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              )}
              {q.input_type === "multi_select" && (
                <div className="space-y-1.5">
                  {(Array.isArray(q.options) ? q.options : []).map(opt => (
                    <label key={opt} className="flex items-center gap-2 text-sm py-1 cursor-pointer">
                      <input type="checkbox"
                        checked={(answers[q.question_key] || "").includes(opt)}
                        onChange={e => {
                          const current = (answers[q.question_key] || "").split(",").filter(Boolean);
                          const updated = e.target.checked ? [...current, opt] : current.filter(v => v !== opt);
                          setAnswers({ ...answers, [q.question_key]: updated.join(",") });
                        }}
                        className="w-4 h-4 accent-[#004ac6]" />
                      <span className="text-gray-700">{opt}</span>
                    </label>
                  ))}
                </div>
              )}
              {q.help_text && <p className="text-xs text-gray-400 italic mt-2">{q.help_text}</p>}
            </div>
          );
        })}
      </div>

      {/* Section nav */}
      <div className="flex gap-3 pt-2">
        <button onClick={() => currentSectionIndex > 0 ? setCurrentSectionIndex(i => i - 1) : onBack()}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {currentSectionIndex > 0 ? "Previous" : "Back"}
        </button>
        {isLastSection ? (
          <PrimaryButton className="flex-1" onClick={onNext}>Review Answers <ArrowRight className="w-4 h-4" /></PrimaryButton>
        ) : (
          <PrimaryButton className="flex-1" onClick={() => setCurrentSectionIndex(i => i + 1)}>
            Next Section <ArrowRight className="w-4 h-4" />
          </PrimaryButton>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// STEP 4 — REVIEW & PREPARE
// ══════════════════════════════════════════════════════════════════════
function Step4({ selectedCity, selectedPermit, questions, answers, feeRule, setFeeRule, calculatedFee, onBack, onNext }) {
  const [loadingFee, setLoadingFee] = useState(true);
  const [docChecks, setDocChecks] = useState({});
  const [expandedSections, setExpandedSections] = useState({});

  useEffect(() => {
    const load = async () => {
      setLoadingFee(true);
      try {
        const base = selectedPermit.name.split("/")[0].trim();
        const { data } = await supabase.from("fee_rules").select("*").eq("city_name", selectedCity)
          .ilike("permit_name", `%${base}%`).limit(1).single();
        setFeeRule(data || null);
      } catch {
        setFeeRule(null);
      } finally {
        setLoadingFee(false);
      }
    };
    load();
  }, [selectedCity, selectedPermit?.name]);

  const grouped = {};
  questions.forEach(q => {
    const sec = q.section || "General";
    if (!grouped[sec]) grouped[sec] = [];
    grouped[sec].push(q);
  });

  const missingRequired = questions.filter(q => q.is_required && !answers[q.question_key]);
  const docs = getDocumentList(selectedPermit?.name);
  const jobVal = parseFloat(answers?.job_valuation || answers?.construction_cost || 0);

  return (
    <div className="space-y-5">
      {/* Missing fields warning */}
      {missingRequired.length > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800">
            <strong>{missingRequired.length} required field{missingRequired.length > 1 ? "s are" : " is"} missing.</strong> You can still continue but the city may request this information.
          </p>
        </div>
      )}

      {/* Answer Summary */}
      <Card>
        <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider">Your Answers</h3>
        <div className="space-y-3">
          {Object.entries(grouped).map(([sec, qs]) => {
            const isOpen = expandedSections[sec] !== false;
            return (
              <div key={sec} className="border border-gray-100 rounded-lg overflow-hidden">
                <button className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors"
                  onClick={() => setExpandedSections(p => ({ ...p, [sec]: !isOpen }))}>
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">{sec}</span>
                  <span className="text-gray-400 text-xs">{isOpen ? "▲" : "▼"}</span>
                </button>
                {isOpen && (
                  <div className="divide-y divide-gray-50">
                    {qs.map(q => (
                      <div key={q.id} className="flex justify-between items-center px-4 py-2.5 gap-4 text-sm">
                        <span className="text-gray-500 flex-1">{q.question_text}</span>
                        {answers[q.question_key]
                          ? <span className="font-medium text-gray-900 text-right max-w-[160px] truncate">{String(answers[q.question_key])}</span>
                          : q.is_required
                            ? <span className="text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded">⚠ Required</span>
                            : <span className="text-gray-300 text-xs">—</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {questions.length === 0 && <p className="text-sm text-gray-400">No questions were answered for this permit type.</p>}
        </div>
      </Card>

      {/* Fee Estimate */}
      <Card>
        <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider">Fee Estimate</h3>
        {loadingFee ? (
          <div className="flex items-center gap-2 py-2"><Loader2 className="w-4 h-4 animate-spin text-gray-400" /><span className="text-sm text-gray-400">Loading fee...</span></div>
        ) : feeRule ? (
          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Permit</span><span className="text-gray-700">{selectedPermit?.name}</span></div>
            {feeRule.flat_fee > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Base fee</span><span className="text-gray-700">${feeRule.flat_fee?.toFixed(2)}</span></div>}
            {feeRule.base_fee > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Base fee</span><span className="text-gray-700">${feeRule.base_fee?.toFixed(2)}</span></div>}
            {feeRule.rate_percentage > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">{feeRule.rate_percentage}% of ${jobVal.toLocaleString()}</span><span className="text-gray-700">${((feeRule.rate_percentage / 100) * jobVal).toFixed(2)}</span></div>}
            {feeRule.technology_admin_fee > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Technology & admin</span><span className="text-gray-700">${feeRule.technology_admin_fee?.toFixed(2)}</span></div>}
            <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
              <span className="font-bold text-gray-900">Estimated Total</span>
              <span className="font-bold text-[#004ac6] text-lg">${calculatedFee?.toFixed(2) || "TBD"}</span>
            </div>
            <p className="text-xs text-gray-400 italic">Estimate only. Final fee determined at time of submission.</p>
          </div>
        ) : (
          <p className="text-sm text-gray-400">Fee estimate not available for this permit type.</p>
        )}
      </Card>

      {/* Documents Checklist */}
      <Card>
        <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider">Documents Needed</h3>
        <div className="space-y-2">
          {docs.map(doc => (
            <label key={doc} className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={!!docChecks[doc]} onChange={e => setDocChecks(p => ({ ...p, [doc]: e.target.checked }))}
                className="w-4 h-4 accent-[#004ac6] rounded" />
              <span className={`text-sm transition-colors ${docChecks[doc] ? "line-through text-gray-300" : "text-gray-700"}`}>{doc}</span>
            </label>
          ))}
        </div>
      </Card>

      <NavButtons onBack={onBack} onNext={onNext} nextLabel="Go to Guided Submission →" />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// STEP 5 — GUIDED SUBMISSION
// ══════════════════════════════════════════════════════════════════════
function Step5({ selectedRole, selectedCity, selectedPermit, selectedProperty, questions, answers, feeRule, calculatedFee, currentUser, guideId, setGuideId, portalChecked, setPortalChecked, submitting, setSubmitting, submitError, setSubmitError, submitted, setSubmitted, confirmationNumber, setConfirmationNumber, onBack, onReset }) {
  const [saving, setSaving] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState({});
  const savedRef = useRef(false);

  const portalUrl = CITY_PORTALS[selectedCity] || "#";

  // Save to submission_guides on mount
  useEffect(() => {
    if (savedRef.current || guideId) return;
    savedRef.current = true;
    const save = async () => {
      setSaving(true);
      try {
        const { data: { user: sbUser } } = await supabase.auth.getUser();

        const { data: guideData, error: guideError } = await supabase
          .from('submission_guides')
          .insert({
            user_email: sbUser?.email || 'guest@openpermit.com',
            user_id: sbUser?.id || null,
            user_role: selectedRole,
            is_guest: !sbUser,
            city_name: selectedCity,
            city_portal_url: portalUrl,
            permit_type_name: selectedPermit?.name,
            target_system: selectedCity === 'Fort Lauderdale' ? 'accela' : 'manual',
            phase: 'guided_submission',
            overall_status: 'ready_to_submit',
            folio_number: selectedProperty?.folio_number || null,
            questions_total: questions.length,
            questions_answered: Object.keys(answers).filter(k => answers[k] && answers[k] !== '').length,
            questions_prefilled: questions.filter(q => q.prefill_from && answers[q.question_key]).length,
            estimated_fee: calculatedFee || null,
            field_mapping_snapshot: answers,
            started_date: new Date().toISOString().split('T')[0],
          })
          .select('id')
          .single();

        if (guideError) {
          console.error('Guide save error:', guideError);
          setSubmitError('Could not save application: ' + guideError.message);
          return;
        }

        setGuideId(guideData.id);

        // Claim any previous guest submissions by this email
        if (sbUser) {
          await supabase.rpc('claim_guest_guides', { p_email: sbUser.email, p_user_id: sbUser.id }).catch(() => {});
        }
      } finally {
        setSaving(false);
      }
    };
    save();
  }, []);

  const checklistItems = questions.filter(q => q.target_system_field && answers[q.question_key]);
  const checkedCount = Object.values(portalChecked).filter(Boolean).length;
  const allChecked = checklistItems.length > 0 && checkedCount === checklistItems.length;

  const copyToClipboard = (key, value) => {
    navigator.clipboard.writeText(value || "").then(() => {
      setCopyFeedback(p => ({ ...p, [key]: true }));
      setTimeout(() => setCopyFeedback(p => ({ ...p, [key]: false })), 1500);
    });
  };

  const handleMarkSubmitted = async () => {
    if (!guideId) return;
    setSubmitting(true); setSubmitError("");

    const { error: updateError } = await supabase
      .from('submission_guides')
      .update({
        overall_status: 'submitted',
        phase: 'completed',
        submitted_date: new Date().toISOString().split('T')[0],
        confirmation_number: confirmationNumber || null,
      })
      .eq('id', guideId);

    if (updateError) {
      setSubmitError('Could not mark as submitted: ' + updateError.message);
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  };

  // ── Final success screen ──
  if (submitted) {
    return (
      <div className="flex flex-col items-center text-center py-10 space-y-5">
        <div className="w-20 h-20 rounded-full bg-teal-50 flex items-center justify-center border-4 border-teal-200">
          <CheckCircle2 className="w-10 h-10 text-teal-500" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900" style={{ fontFamily: "'Manrope', system-ui, sans-serif" }}>Application Submitted!</h2>
          <p className="text-gray-500 text-sm mt-1">Your application has been logged and saved.</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 w-full text-left space-y-2">
          <div className="flex justify-between text-sm"><span className="text-gray-500">Permit Type</span><span className="font-semibold text-gray-900">{selectedPermit?.name}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">City</span><span className="font-semibold text-gray-900">{selectedCity}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">Date</span><span className="font-semibold text-gray-900">{new Date().toLocaleDateString()}</span></div>
          {confirmationNumber && <div className="flex justify-between text-sm"><span className="text-gray-500">Confirmation #</span><span className="font-semibold text-[#004ac6]">{confirmationNumber}</span></div>}
        </div>
        <div className="flex gap-3 w-full">
          <Link to="/MyProjects" className="flex-1 py-3 rounded-xl bg-[#004ac6] text-white text-sm font-semibold text-center hover:opacity-90 transition-opacity">
            View in My Projects
          </Link>
          <button onClick={onReset} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
            Start Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {saving && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Saving your application...
        </div>
      )}

      {/* Header card */}
      <Card>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="font-bold text-gray-900">{selectedPermit?.name}</p>
            <p className="text-sm text-gray-500">{selectedCity}, FL</p>
          </div>
          <a href={portalUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#004ac6] text-white text-xs font-semibold hover:opacity-90 transition-opacity shrink-0">
            <ExternalLink className="w-3.5 h-3.5" /> Open Portal
          </a>
        </div>
        <p className="text-xs text-gray-500 bg-blue-50 rounded-lg px-3 py-2.5">
          Open the city portal in a new tab. Enter each field below as you go. Check each one off when done.
        </p>
      </Card>

      {/* Progress */}
      {checklistItems.length > 0 && (
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>Fields entered</span>
            <span className="font-semibold">{checkedCount} of {checklistItems.length}</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full">
            <div className="h-2 bg-teal-500 rounded-full transition-all" style={{ width: `${checklistItems.length > 0 ? (checkedCount / checklistItems.length) * 100 : 0}%` }} />
          </div>
        </div>
      )}

      {/* Field checklist */}
      <Card>
        <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider">Fields to Enter</h3>
        {checklistItems.length === 0 ? (
          <p className="text-sm text-gray-400">No portal field mappings available. Refer to the city portal directly.</p>
        ) : (
          <div className="space-y-2">
            {checklistItems.map(q => {
              const checked = !!portalChecked[q.question_key];
              const val = answers[q.question_key] || "";
              return (
                <div key={q.question_key} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${checked ? "bg-gray-50 border-gray-100 opacity-60" : "bg-white border-gray-200"}`}>
                  <input type="checkbox" checked={checked} onChange={e => setPortalChecked(p => ({ ...p, [q.question_key]: e.target.checked }))}
                    className="w-4 h-4 accent-teal-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold text-gray-500 ${checked ? "line-through" : ""}`}>{q.target_system_field}</p>
                    <p className={`text-sm font-mono text-gray-800 truncate ${checked ? "line-through" : ""}`}>{val || "(empty)"}</p>
                  </div>
                  <button onClick={() => copyToClipboard(q.question_key, val)}
                    className={`shrink-0 transition-colors ${copyFeedback[q.question_key] ? "text-teal-500" : "text-gray-400 hover:text-gray-700"}`}
                    title="Copy to clipboard">
                    {copyFeedback[q.question_key] ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Completion state */}
      {(allChecked || checklistItems.length === 0) && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-5 space-y-3">
          {checklistItems.length > 0 && <div className="flex items-center gap-2 text-teal-700 font-semibold"><CheckCircle2 className="w-5 h-5" /> All fields entered!</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmation number <span className="text-gray-400 font-normal">(optional)</span></label>
            <input type="text" value={confirmationNumber} onChange={e => setConfirmationNumber(e.target.value)}
              placeholder="Enter city confirmation number..."
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400" />
          </div>
          {submitError && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{submitError}</p>}
          <button onClick={handleMarkSubmitted} disabled={submitting}
            className="w-full py-3 rounded-xl bg-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-teal-600 transition-colors disabled:opacity-60">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Mark as Submitted
          </button>
        </div>
      )}

      {submitError && !allChecked && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{submitError}</p>}

      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Review
      </button>
    </div>
  );
}

// ── Shared UI primitives ───────────────────────────────────────────────
function Card({ children, className = "" }) {
  return <div className={`bg-white border border-gray-200 rounded-xl p-5 shadow-sm ${className}`}>{children}</div>;
}

function SectionLabel({ children }) {
  return <p className="text-sm font-semibold text-gray-700">{children}</p>;
}

function PrimaryButton({ children, onClick, disabled = false, className = "" }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#004ac6] text-white font-bold text-sm disabled:opacity-40 hover:opacity-90 transition-opacity ${className}`}>
      {children}
    </button>
  );
}

function NavButtons({ onBack, onNext, nextDisabled = false, nextLabel = "Continue →" }) {
  return (
    <div className="flex gap-3 pt-2">
      <button onClick={onBack} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <PrimaryButton className="flex-1" onClick={onNext} disabled={nextDisabled}>{nextLabel}</PrimaryButton>
    </div>
  );
}