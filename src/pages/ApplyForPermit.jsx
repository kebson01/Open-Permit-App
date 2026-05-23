import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { supabase } from "@/lib/supabaseClient";
import { ArrowLeft, ArrowRight, Loader2, Check, Copy, CheckCircle2, MapPin, Search, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/ui/PageHeader";
import Btn from "@/components/ui/Btn";
const CITIES = ["Weston", "Hollywood", "Coral Springs", "Cooper City", "Fort Lauderdale"];
const CITY_PORTALS = {
  "Weston": "https://www.westonfl.org/Permits",
  "Hollywood": "https://www.hollywoodfl.org/permits",
  "Coral Springs": "https://www.coralsprings.org/permits",
  "Cooper City": "https://www.coopercityfl.org/permits",
  "Fort Lauderdale": "https://lauderbuild.fortlauderdale.gov",
};

const CITY_PERMIT_TABLES = {
  "Weston": "weston_permit_types",
  "Hollywood": "hollywood_permit_types",
  "Coral Springs": "coral_springs_permit_types",
  "Cooper City": "cooper_city_permit_types",
  "Fort Lauderdale": "fort_lauderdale_permit_types",
};

// Progress bar showing 5 steps
function ProgressBar({ currentStep }) {
  const steps = ["Setup", "Permit Type", "Questions", "Review", "Submit"];
  return (
    <div className="flex items-center justify-between gap-2 mb-6">
      {steps.map((label, idx) => {
        const stepNum = idx + 1;
        const isComplete = stepNum < currentStep;
        const isCurrent = stepNum === currentStep;
        return (
          <div key={stepNum} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  isComplete
                    ? "bg-success text-white"
                    : isCurrent
                    ? "bg-action text-white"
                    : "bg-line text-muted"
                }`}
              >
                {isComplete ? <Check className="w-4 h-4" /> : stepNum}
              </div>
              <span className={`text-[9px] font-semibold hidden sm:block ${isCurrent ? "text-action" : "text-muted"}`}>{label}</span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-4 ${isComplete ? "bg-success" : "bg-line"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// STEP 1: Role, City, Property
function Step1Setup({ onNext, initialCity }) {
  const [selectedRole, setSelectedRole] = useState("homeowner");
  const [selectedCity, setSelectedCity] = useState(initialCity || "");
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [propertySearch, setPropertySearch] = useState("");
  const [propertyResults, setPropertyResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  const handlePropertySearch = async () => {
    if (!propertySearch.trim() || propertySearch.length < 2) {
      setSearchError("Enter at least 2 characters");
      return;
    }
    setSearchLoading(true);
    setSearchError("");
    setPropertyResults([]);
    try {
      const q = propertySearch.trim();
      let query = supabase
        .from("properties_search_view")
        .select("folio_number, full_address, owner_name, city_name, total_sqft, year_built, beds, baths")
        .limit(10);

      // Prioritize folio number if it looks like one (all digits)
      if (/^\d+$/.test(q)) {
        query = query.ilike("folio_number", `${q}%`);
      } else {
        // Search address only to avoid timeout
        query = query.ilike("full_address", `%${q}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setPropertyResults(data || []);
      if (!data || data.length === 0) setSearchError("No properties found");
    } catch (err) {
      setSearchError("Search failed—try a shorter query");
    } finally {
      setSearchLoading(false);
    }
  };

  const canContinue = selectedRole && selectedCity;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-card border border-line shadow-card p-5">
        <h3 className="font-bold text-ink mb-4 text-sm uppercase tracking-wider">Your Role</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: "homeowner", label: "🏠 Homeowner" },
            { key: "contractor", label: "🔧 Contractor" },
            { key: "private_provider", label: "🏛 Provider" },
          ].map(r => (
            <button
              key={r.key}
              onClick={() => setSelectedRole(r.key)}
              className={`p-3 rounded-control border-2 text-center transition-all ${
                selectedRole === r.key ? "border-action bg-action-50 text-action" : "border-line text-muted hover:border-action"
              }`}
            >
              <p className="font-semibold text-sm">{r.label}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-card border border-line shadow-card p-5">
        <h3 className="font-bold text-ink mb-3 text-sm uppercase tracking-wider">
          <MapPin className="inline w-4 h-4 mr-1.5 text-action" />
          Select City
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CITIES.map(city => (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              className={`p-3 rounded-control border-2 text-left text-sm font-semibold transition-all ${
                selectedCity === city ? "border-action bg-action-50 text-action" : "border-line text-ink hover:border-action"
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-card border border-line shadow-card p-5">
        <h3 className="font-bold text-ink mb-3 text-sm uppercase tracking-wider">Property (Optional)</h3>
        {selectedProperty ? (
          <div className="flex items-center justify-between p-3 rounded-control bg-success-50 border border-success">
            <div>
              <p className="text-sm font-semibold text-success">{selectedProperty.full_address || selectedProperty.folio_number}</p>
              <p className="text-xs text-success">Folio: {selectedProperty.folio_number}</p>
            </div>
            <button onClick={() => setSelectedProperty(null)} className="text-xs text-success underline">Change</button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={propertySearch}
                onChange={e => { setPropertySearch(e.target.value); setSearchError(""); }}
                onKeyDown={e => e.key === "Enter" && handlePropertySearch()}
                placeholder="Search by address or folio..."
                className="flex-1 px-4 py-2.5 rounded-control border border-line text-sm focus:outline-none focus:border-action"
              />
              <button
                onClick={handlePropertySearch}
                disabled={searchLoading}
                className="px-4 py-2.5 rounded-control bg-action text-white text-sm font-bold disabled:opacity-60 hover:bg-action-hover transition-colors"
              >
                {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </button>
            </div>
            {searchError && <p className="text-xs text-warning bg-warning-50 px-3 py-2 rounded-control">{searchError}</p>}
            {propertyResults.length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-0.5 border border-line rounded-control">
                {propertyResults.map(p => (
                  <button
                    key={p.folio_number}
                    onClick={() => { setSelectedProperty(p); setPropertyResults([]); setPropertySearch(""); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-action-50 border-b border-line last:border-0 transition-colors"
                  >
                    <p className="font-semibold text-sm text-ink">{p.full_address || p.folio_number}</p>
                    <p className="text-xs text-muted">{p.city_name} · {p.folio_number}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Btn variant="primary" size="lg" className="w-full justify-center"
        onClick={() => onNext({ role: selectedRole, city: selectedCity, property: selectedProperty })}
        disabled={!canContinue}
      >
        Continue <ArrowRight className="w-4 h-4" />
      </Btn>
    </div>
  );
}

// STEP 2: Permit Type
function Step2PermitType({ city, onNext, onBack }) {
  const [permitTypes, setPermitTypes] = useState([]);
  const [availableQuestionTypes, setAvailableQuestionTypes] = useState(new Set());
  const [selectedPermit, setSelectedPermit] = useState(null);
  const [loadingPermits, setLoadingPermits] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPermits = async () => {
      setLoadingPermits(true);
      setError("");
      try {
        const tableName = CITY_PERMIT_TABLES[city];
        const { data, error: err } = await supabase
          .from(tableName)
          .select("id, name, category, description, typical_timeline")
          .order("category");
        if (err) throw err;
        setPermitTypes(data || []);

        // Load available questions to show availability badges
        const { data: questionData } = await supabase
          .from("city_application_questions")
          .select("permit_type_name")
          .eq("city_name", city)
          .eq("is_active", true);
        
        if (questionData) {
          const typeNames = new Set(questionData.map(q => q.permit_type_name?.toLowerCase() || ""));
          setAvailableQuestionTypes(typeNames);
        }
      } catch (err) {
        setError(err.message);
        setPermitTypes([]);
      } finally {
        setLoadingPermits(false);
      }
    };
    loadPermits();
  }, [city]);

  const hasQuestions = (permitName) => {
    const name = permitName.toLowerCase();
    const base = name.split("/")[0].trim();
    return Array.from(availableQuestionTypes).some(qt => qt.includes(base) || base.includes(qt.split(" ")[0]));
  };

  const grouped = {};
  permitTypes.forEach(pt => {
    const cat = pt.category || "other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(pt);
  });

  return (
    <div className="space-y-4">
      {loadingPermits ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
      ) : permitTypes.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
          <p className="text-muted">No permit types available</p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([cat, types]) => (
            <div key={cat}>
              <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">
                {cat}
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {types.map(pt => (
                  <button
                    key={pt.id}
                    onClick={() => setSelectedPermit(pt)}
                    className={`text-left p-4 rounded-control border-2 transition-all ${
                      selectedPermit?.id === pt.id ? "border-action bg-action-50" : "border-line bg-white hover:border-action"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className={`font-semibold text-sm ${selectedPermit?.id === pt.id ? "text-action" : "text-ink"}`}>
                        {pt.name}
                      </p>
                      {hasQuestions(pt.name) ? (
                        <span className="text-xs px-2 py-1 bg-success-50 text-success rounded-full font-semibold whitespace-nowrap">
                          ✓ Ready
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 bg-surface text-muted rounded-full whitespace-nowrap">
                          Soon
                        </span>
                      )}
                    </div>
                    {pt.description && <p className="text-xs text-muted mt-1 line-clamp-2">{pt.description}</p>}
                    {pt.typical_timeline && <p className="text-xs text-action mt-2">⏱ {pt.typical_timeline}</p>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <Btn variant="secondary" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" /> Back
        </Btn>
        <Btn variant="primary" className="flex-1 justify-center" onClick={() => onNext({ permit: selectedPermit })} disabled={!selectedPermit}>
          Continue <ArrowRight className="w-4 h-4" />
        </Btn>
      </div>
    </div>
  );
}

// STEP 3: Questions
function Step3Questions({ city, permit, onNext, onBack }) {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [error, setError] = useState("");
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);

  useEffect(() => {
    const loadQuestions = async () => {
      setLoadingQuestions(true);
      setError("");
      try {
        const permitBase = permit.name.split("/")[0].trim();
        const { data, error: err } = await supabase
          .from("city_application_questions")
          .select("*")
          .eq("city_name", city)
          .ilike("permit_type_name", `%${permitBase}%`)
          .eq("is_active", true)
          .order("display_order");
        if (err) throw err;
        setQuestions(data || []);
      } catch (err) {
        setError(err.message);
        setQuestions([]);
      } finally {
        setLoadingQuestions(false);
      }
    };
    loadQuestions();
  }, [city, permit.name]);

  const grouped = {};
  questions.forEach(q => {
    const sec = q.section || "General";
    if (!grouped[sec]) grouped[sec] = [];
    grouped[sec].push(q);
  });

  const sections = Object.entries(grouped);
  const currentSection = sections[currentSectionIdx];

  if (loadingQuestions) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>;
  }

  if (questions.length === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <p className="text-action text-sm leading-relaxed">
            Guided questions are not yet available for <strong>{permit.name}</strong> in <strong>{city}</strong>. You can continue to review your application summary and we'll guide you through the city portal submission.
          </p>
        </div>
        <div className="flex gap-3">
          <Btn variant="secondary" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" /> Back
          </Btn>
          <Btn variant="primary" className="flex-1 justify-center" onClick={() => onNext({ questions, answers })}>
            Continue to Review <ArrowRight className="w-4 h-4" />
          </Btn>
        </div>
      </div>
    );
  }

  if (!currentSection) {
    return <div className="text-center py-8 text-gray-600">No questions found</div>;
  }

  const [sectionName, sectionQuestions] = currentSection;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold text-ink mb-1">
          {sectionName}
        </h3>
        <p className="text-xs text-gray-500">Section {currentSectionIdx + 1} of {sections.length}</p>
      </div>

      <div className="space-y-4">
        {sectionQuestions.map(q => (
          <div key={q.id} className="bg-white rounded-card border border-line shadow-card p-4">
            <label className="block font-bold text-ink text-sm mb-3">
              {q.question_text}
              {q.is_required && <span className="text-red-600 ml-1">*</span>}
            </label>

            {(q.input_type === "text" || q.input_type === "address") && (
              <input
                type="text"
                value={answers[q.question_key] || ""}
                onChange={e => setAnswers({ ...answers, [q.question_key]: e.target.value })}
                placeholder="Enter your answer..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 text-sm"
              />
            )}

            {q.input_type === "number" && (
              <input
                type="number"
                value={answers[q.question_key] || ""}
                onChange={e => setAnswers({ ...answers, [q.question_key]: e.target.value })}
                placeholder="0"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 text-sm"
              />
            )}

            {q.input_type === "date" && (
              <input
                type="date"
                value={answers[q.question_key] || ""}
                onChange={e => setAnswers({ ...answers, [q.question_key]: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 text-sm"
              />
            )}

            {q.input_type === "boolean" && (
              <div className="flex gap-2">
                {["Yes", "No"].map(opt => (
                  <button
                    key={opt}
                    onClick={() => setAnswers({ ...answers, [q.question_key]: opt === "Yes" })}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                      answers[q.question_key] === (opt === "Yes")
                        ? "bg-blue-500 text-white"
                        : "border border-gray-200 text-gray-700 hover:border-blue-200"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {q.input_type === "select" && (
              <select
                value={answers[q.question_key] || ""}
                onChange={e => setAnswers({ ...answers, [q.question_key]: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 text-sm"
              >
                <option value="">Select an option</option>
                {Array.isArray(q.options) && q.options.map(opt => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            )}

            {q.input_type === "multi_select" && (
              <div className="space-y-2">
                {Array.isArray(q.options) && q.options.map(opt => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(answers[q.question_key] || []).includes(opt)}
                      onChange={e => {
                        const current = answers[q.question_key] || [];
                        if (e.target.checked) {
                          setAnswers({ ...answers, [q.question_key]: [...current, opt] });
                        } else {
                          setAnswers({ ...answers, [q.question_key]: current.filter(x => x !== opt) });
                        }
                      }}
                      className="w-4 h-4 rounded accent-blue-500"
                    />
                    <span className="text-sm text-gray-700">{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {q.input_type === "file" && (
              <input
                type="file"
                onChange={e => setAnswers({ ...answers, [q.question_key]: e.target.files?.[0]?.name || "" })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 text-sm"
              />
            )}

            {q.help_text && <p className="text-xs text-gray-500 italic mt-2">{q.help_text}</p>}
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Btn variant="secondary" onClick={() => (currentSectionIdx > 0 ? setCurrentSectionIdx(prev => prev - 1) : onBack())}>
          <ArrowLeft className="w-4 h-4" /> {currentSectionIdx > 0 ? "Previous" : "Back"}
        </Btn>
        {currentSectionIdx < sections.length - 1 ? (
          <Btn variant="primary" className="flex-1 justify-center" onClick={() => setCurrentSectionIdx(prev => prev + 1)}>
            Next Section <ArrowRight className="w-4 h-4" />
          </Btn>
        ) : (
          <Btn variant="primary" className="flex-1 justify-center" onClick={() => onNext({ questions, answers })}>
            Review Answers <ArrowRight className="w-4 h-4" />
          </Btn>
        )}
      </div>
    </div>
  );
}

// STEP 4: Review
function Step4Review({ city, permit, answers, questions, onNext, onBack }) {
  const [fee, setFee] = useState(null);
  const [loadingFee, setLoadingFee] = useState(true);

  useEffect(() => {
    const loadFee = async () => {
      setLoadingFee(true);
      try {
        const { data } = await supabase
          .from("fee_rules")
          .select("flat_fee, description")
          .eq("city_name", city)
          .ilike("permit_name", `%${permit.name}%`)
          .single();
        if (data) setFee(data);
      } catch {
        // Fee not available
      } finally {
        setLoadingFee(false);
      }
    };
    loadFee();
  }, [city, permit.name]);

  const grouped = {};
  questions.forEach(q => {
    const sec = q.section || "General";
    if (!grouped[sec]) grouped[sec] = [];
    grouped[sec].push(q);
  });

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-card border border-line shadow-card p-5">
        <h3 className="font-bold text-ink mb-4 text-sm uppercase tracking-wider">Your Answers</h3>
        {Object.entries(grouped).map(([sec, qs]) => (
          <div key={sec} className="mb-5">
            <h4 className="text-sm font-semibold text-muted mb-3 uppercase tracking-wider">
              {sec}
            </h4>
            <div className="space-y-2 border-b border-gray-100 pb-4">
              {qs.map(q => (
                <div key={q.id} className="flex justify-between text-sm">
                  <span className="text-gray-600">{q.text}</span>
                  <span className="font-semibold text-gray-900">{String(answers[q.question_key] || "—")}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {fee && !loadingFee && (
        <div className="bg-action-50 border border-action-100 rounded-card p-5">
          <p className="text-sm text-muted mb-2">Estimated Permit Fee:</p>
          <p className="text-2xl font-bold text-action">${fee.flat_fee ? fee.flat_fee.toLocaleString() : "TBD"}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Btn variant="secondary" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" /> Back
        </Btn>
        <Btn variant="primary" className="flex-1 justify-center" onClick={() => onNext({})}>
          Go to Submission <ArrowRight className="w-4 h-4" />
        </Btn>
      </div>
    </div>
  );
}

// STEP 5: Guided Submission
function Step5Submit({ role, city, permit, property, answers, questions, onBack, currentUser }) {
  const [fieldMap, setFieldMap] = useState([]);
  const [checkedFields, setCheckedFields] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Create field map from answers
    const fields = questions.map(q => ({
      key: q.question_key,
      label: q.text,
      value: answers[q.question_key] || "",
      portalField: q.target_system_field || q.text,
    }));
    setFieldMap(fields);
    setLoading(false);
  }, [questions, answers]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const { error: err } = await supabase.from("submission_guides").insert({
        user_email: currentUser?.email || "guest@openpermit.com",
        user_role: role,
        city_name: city,
        permit_type_name: permit.name,
        permit_type_id: permit.id || "",
        target_system: city === "Fort Lauderdale" ? "accela" : "manual",
        phase: "guided_submission",
        overall_status: "ready_to_submit",
        folio_number: property?.folio_number || null,
        questions_total: questions.length,
        questions_answered: Object.keys(answers).length,
        field_mapping_snapshot: JSON.stringify(answers),
        started_date: new Date().toISOString().split("T")[0],
      });
      if (err) throw err;

      // Show success and navigate
      alert("Application saved! You can now submit to the city portal.");
      window.location.href = "/MyProjects";
    } catch (err) {
      setError(err.message || "Failed to save application");
    } finally {
      setSubmitting(false);
    }
  };

  const allChecked = fieldMap.length > 0 && fieldMap.every(f => checkedFields[f.key]);

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-card border border-line shadow-card p-5">
        <h3 className="font-bold text-ink mb-4 text-sm uppercase tracking-wider">
          Portal: {city}
        </h3>
        <p className="text-sm text-muted mb-3">
          Copy each field value and enter it into the{" "}
          <a
            href={CITY_PORTALS[city]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline font-semibold"
          >
            {city} permit portal ↗
          </a>
        </p>

        <div className="space-y-2 border-t border-line pt-4">
          {fieldMap.map(field => (
            <div key={field.key} className="flex items-center gap-3 p-3 bg-surface rounded-control">
              <input
                type="checkbox"
                checked={checkedFields[field.key] || false}
                onChange={e => setCheckedFields({ ...checkedFields, [field.key]: e.target.checked })}
                className="w-5 h-5 rounded accent-blue-500"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 font-mono">{field.portalField}</p>
                <p className="text-sm font-semibold text-gray-800 truncate">{field.value || "(empty)"}</p>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(field.value || "")}
                className="text-gray-400 hover:text-gray-700 transition"
                title="Copy to clipboard"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>}

      <div className="flex gap-3">
        <Btn variant="secondary" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" /> Back
        </Btn>
        <Btn variant="primary" className="flex-1 justify-center" onClick={handleSubmit} disabled={!allChecked || submitting}>
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          {allChecked ? "Mark as Submitted" : "Complete all fields first"}
        </Btn>
      </div>
    </div>
  );
}

// MAIN COMPONENT
export default function ApplyForPermit() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [stepData, setStepData] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(u => setCurrentUser(u || null)).catch(() => {}).finally(() => setAuthLoading(false));
  }, []);

  const handleStep1 = data => {
    setStepData({ ...stepData, ...data });
    setCurrentStep(2);
  };

  const handleStep2 = data => {
    setStepData({ ...stepData, ...data });
    setCurrentStep(3);
  };

  const handleStep3 = data => {
    setStepData({ ...stepData, ...data });
    setCurrentStep(4);
  };

  const handleStep4 = data => {
    setStepData({ ...stepData, ...data });
    setCurrentStep(5);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-6 h-6 animate-spin text-action" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-8">
      <PageHeader
        eyebrow="Apply for Permit"
        title="New Permit Application"
        subtitle="We'll guide you through each step — from selecting your permit type to submitting your application."
      />
      <div className="max-w-3xl mx-auto px-4 pt-5">
        <div className="bg-white rounded-card border border-line shadow-card p-4 mb-5">
          <ProgressBar currentStep={currentStep} />
        </div>
        {currentStep === 1 && <Step1Setup onNext={handleStep1} initialCity={stepData.city} />}
        {currentStep === 2 && <Step2PermitType city={stepData.city} onNext={handleStep2} onBack={() => setCurrentStep(1)} />}
        {currentStep === 3 && (
          <Step3Questions
            city={stepData.city}
            permit={stepData.permit}
            onNext={handleStep3}
            onBack={() => setCurrentStep(2)}
          />
        )}
        {currentStep === 4 && (
          <Step4Review
            city={stepData.city}
            permit={stepData.permit}
            answers={stepData.answers || {}}
            questions={stepData.questions || []}
            onNext={handleStep4}
            onBack={() => setCurrentStep(3)}
          />
        )}
        {currentStep === 5 && (
          <Step5Submit
            role={stepData.role}
            city={stepData.city}
            permit={stepData.permit}
            property={stepData.property}
            answers={stepData.answers || {}}
            questions={stepData.questions || []}
            onBack={() => setCurrentStep(4)}
            currentUser={currentUser}
          />
        )}
      </div>
    </div>
  );
}