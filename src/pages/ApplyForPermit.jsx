import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import * as db from "@/lib/db";
import {
  ArrowLeft, ArrowRight, CheckCircle2, MapPin, FileText,
  Loader2, Search, AlertTriangle, ExternalLink, ChevronRight, Play
} from "lucide-react";
import PhaseProgressBar from "@/components/submission/PhaseProgressBar";
import ApplicationPhase from "@/components/submission/ApplicationPhase";
import PreparationPhase from "@/components/submission/PreparationPhase";
import GuidedSubmissionPhase from "@/components/submission/GuidedSubmissionPhase";

const PRIMARY = "#004ac6";
const FONTS = { h: "'Manrope', system-ui, sans-serif", b: "'Plus Jakarta Sans', system-ui, sans-serif" };

const CITY_ORDER = ["Weston", "Hollywood", "Coral Springs", "Cooper City", "Fort Lauderdale"];

const CATEGORY_META = {
  building:    { label: "Building",    icon: "🏗️" },
  electrical:  { label: "Electrical",  icon: "⚡" },
  plumbing:    { label: "Plumbing",    icon: "🔧" },
  fire:        { label: "Fire",        icon: "🔥" },
  certificate: { label: "Certificate", icon: "📜" },
  planning:    { label: "Planning",    icon: "📐" },
  engineering: { label: "Engineering", icon: "🛣️" },
  additional:  { label: "Additional",  icon: "➕" },
};

const STEPS = ["Property & City", "Permit Type", "Application Q&A", "Review & Prepare", "Guided Submission"];

function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center gap-0 overflow-x-auto pb-1">
      {STEPS.map((step, i) => {
        const num = i + 1;
        const done = num < currentStep;
        const active = num === currentStep;
        return (
          <React.Fragment key={step}>
            <div className="flex items-center gap-1.5 shrink-0">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                done ? "text-white" : active ? "text-white" : "text-gray-400 bg-gray-100"
              }`} style={{ background: done ? "#006a61" : active ? PRIMARY : undefined }}>
                {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : num}
              </div>
              <span className={`text-xs font-semibold hidden sm:block ${active ? "text-gray-900" : done ? "text-gray-400" : "text-gray-300"}`} style={{ fontFamily: FONTS.b }}>
                {step}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-px flex-1 mx-2 min-w-[12px] ${done ? "bg-[#006a61]" : "bg-gray-200"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── STEP 1: Property & City ──
function Step1PropertyCity({ currentUser, initial, onNext }) {
  const [cities, setCities]           = useState([]);
  const [selectedCity, setSelectedCity] = useState(initial?.city || null);
  const [role, setRole]               = useState(initial?.role || "homeowner");
  const [propertyQuery, setPropertyQuery] = useState(initial?.address || "");
  const [searching, setSearching]     = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(initial?.property || null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    db.City.list().then(all => {
      const filtered = CITY_ORDER.map(n => all.find(c => c.name === n)).filter(Boolean);
      setCities(filtered);
      if (!selectedCity && filtered.length > 0) setSelectedCity(filtered[0]);
      setLoading(false);
    });
  }, []);

  const doSearch = async () => {
    if (!propertyQuery.trim()) return;
    setSearching(true);
    try {
      const resp = await base44.functions.invoke("propertySearch", { query: propertyQuery });
      const results = Array.isArray(resp.data) ? resp.data : (resp.data?.results || []);
      setSearchResults(results);
    } catch { setSearchResults([]); }
    setSearching(false);
  };

  const canContinue = selectedCity;

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-gray-800 mb-4" style={{ fontFamily: FONTS.h }}>Your Role</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: "homeowner", label: "🏠 Homeowner", desc: "Owner-builder" },
            { key: "contractor", label: "🔧 Contractor", desc: "Licensed contractor" },
            { key: "private_provider", label: "🏛 Private Provider", desc: "FL 553.791" },
          ].map(r => (
            <button key={r.key} onClick={() => setRole(r.key)}
              className={`p-3 rounded-xl border-2 text-left transition-all ${role === r.key ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-200"}`}>
              <p className="font-semibold text-sm text-gray-800" style={{ fontFamily: FONTS.b }}>{r.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{r.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-gray-800 mb-3" style={{ fontFamily: FONTS.h }}>
          <MapPin className="inline w-4 h-4 mr-1.5 text-blue-500" />Select City
        </h3>
        {loading ? <div className="py-4 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-blue-400" /></div> : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {cities.map(c => (
              <button key={c.id} onClick={() => setSelectedCity(c)}
                className={`p-3 rounded-xl border-2 text-left text-sm font-medium transition-all ${selectedCity?.id === c.id ? "border-blue-500 bg-blue-50 text-blue-800" : "border-gray-200 text-gray-700 hover:border-blue-200"}`}
                style={{ fontFamily: FONTS.b }}>
                {c.name}
              </button>
            ))}
          </div>
        )}

        {selectedCity?.name === "Fort Lauderdale" && (
          <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-800">
            <ExternalLink className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            Fort Lauderdale uses <strong className="mx-1">LauderBuild</strong> for permit submission.
          </div>
        )}
        {selectedCity?.name === "Cooper City" && (
          <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <strong>Cooper City requires all applications to be notarized.</strong> A Hold Harmless Agreement is also required.
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-gray-800 mb-3" style={{ fontFamily: FONTS.h }}>Property (Optional)</h3>
        {selectedProperty ? (
          <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 border border-green-200">
            <div>
              <p className="text-sm font-semibold text-green-800" style={{ fontFamily: FONTS.b }}>{selectedProperty.full_address || selectedProperty.FOLIO_NUMBER}</p>
              <p className="text-xs text-green-600">Folio: {selectedProperty.FOLIO_NUMBER}</p>
            </div>
            <button onClick={() => { setSelectedProperty(null); setSearchResults([]); }} className="text-xs text-green-700 underline">Change</button>
          </div>
        ) : (
          <div>
            <div className="flex gap-2">
              <input
                type="text"
                value={propertyQuery}
                onChange={e => setPropertyQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && doSearch()}
                placeholder="Search by address or folio number..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 bg-gray-50"
                style={{ fontFamily: FONTS.b }}
              />
              <button onClick={doSearch} disabled={searching}
                className="px-4 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-60"
                style={{ background: PRIMARY }}>
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </button>
            </div>
            {searchResults.length > 0 && (
              <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                {searchResults.map((p, i) => (
                  <button key={i} onClick={() => { setSelectedProperty(p); setSearchResults([]); if (p.SITUS_CITY) { const cityObj = cities.find(c => c.name === p.SITUS_CITY); if (cityObj) setSelectedCity(cityObj); } }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-blue-50 text-sm border border-gray-100 transition-colors"
                    style={{ fontFamily: FONTS.b }}>
                    <p className="font-semibold text-gray-800">{p.full_address || p.FOLIO_NUMBER}</p>
                    <p className="text-xs text-gray-400">{p.SITUS_CITY} · {p.FOLIO_NUMBER}</p>
                  </button>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-2">Selecting a property will auto-fill your application.</p>
          </div>
        )}
      </div>

      <button
        onClick={() => onNext({ city: selectedCity, role, property: selectedProperty })}
        disabled={!canContinue}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold text-sm disabled:opacity-50 transition-opacity hover:opacity-90"
        style={{ background: PRIMARY, fontFamily: FONTS.h }}
      >
        Continue to Permit Type <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── STEP 2: Permit Type ──
function Step2PermitType({ cityId, cityName, onNext, onBack }) {
  const [permitTypes, setPermitTypes] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [selected, setSelected]       = useState(null);

  useEffect(() => {
    if (!cityId) { setLoading(false); return; }
    db.PermitType.filter({ city_id: cityId }).then(pts => {
      setPermitTypes(Array.isArray(pts) ? pts : []);
      setLoading(false);
    });
  }, [cityId]);

  const filtered = permitTypes.filter(pt =>
    !search || pt.name?.toLowerCase().includes(search.toLowerCase()) || pt.description?.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = {};
  filtered.forEach(pt => {
    const cat = pt.category || "additional";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(pt);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl">
        <Search className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search permit types..."
          className="flex-1 bg-transparent text-sm focus:outline-none"
          style={{ fontFamily: FONTS.b }}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([cat, types]) => {
            const meta = CATEGORY_META[cat] || { label: cat, icon: "📋" };
            return (
              <div key={cat}>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ fontFamily: FONTS.b }}>
                  <span>{meta.icon}</span> {meta.label}
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {types.map(pt => (
                    <button key={pt.id} onClick={() => setSelected(pt)}
                      className={`text-left p-4 rounded-2xl border-2 transition-all ${
                        selected?.id === pt.id ? "border-blue-500 bg-blue-50" : "border-gray-100 bg-white hover:border-blue-200"
                      }`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className={`font-semibold text-sm mb-1 ${selected?.id === pt.id ? "text-blue-800" : "text-gray-800"}`} style={{ fontFamily: FONTS.b }}>{pt.name}</p>
                          {pt.description && <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{pt.description}</p>}
                          {pt.typical_timeline && <p className="text-xs text-blue-600 mt-1.5 font-medium">⏱ {pt.typical_timeline}</p>}
                        </div>
                        {selected?.id === pt.id && <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          {Object.keys(grouped).length === 0 && !loading && (
            <div className="text-center py-8">
              <p className="text-gray-400" style={{ fontFamily: FONTS.b }}>No permit types found{search ? ` for "${search}"` : ""}</p>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onBack} className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={() => onNext({ permitType: selected })}
          disabled={!selected}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50"
          style={{ background: PRIMARY, fontFamily: FONTS.h }}
        >
          Continue <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── MAIN APPLY FOR PERMIT PAGE ──
export default function ApplyForPermit() {
  const [currentUser, setCurrentUser]   = useState(null);
  const [authLoading, setAuthLoading]   = useState(true);
  const [step, setStep]                 = useState(1);
  const [stepData, setStepData]         = useState({});
  const [activeGuide, setActiveGuide]   = useState(null);
  const [resumeGuides, setResumeGuides] = useState([]);
  const [showResume, setShowResume]     = useState(true);
  const navigate = useNavigate();

  const urlParams = new URLSearchParams(window.location.search);
  const resumeId = urlParams.get("resume");
  const folioParam = urlParams.get("folio");
  const cityParam = urlParams.get("city");

  useEffect(() => {
    base44.auth.me().then(u => {
      setCurrentUser(u || null);
      if (u) {
        db.SubmissionGuide.filter({ user_email: u.email }).then(g => {
          const active = Array.isArray(g) ? g.filter(x => ["in_progress","ready_to_submit"].includes(x.overall_status)) : [];
          setResumeGuides(active);
          if (resumeId) {
            const found = active.find(x => x.id === resumeId) || (Array.isArray(g) && g.find(x => x.id === resumeId));
            if (found) setActiveGuide(found);
          }
        });
      }
      setAuthLoading(false);
    }).catch(() => setAuthLoading(false));
  }, []);

  const handleStep1 = (data) => {
    setStepData(prev => ({ ...prev, ...data }));
    setStep(2);
  };

  const handleStep2 = async (data) => {
    const merged = { ...stepData, ...data };
    setStepData(merged);
    // Create SubmissionGuide in Supabase
    const email = currentUser?.email || "";
    const guide = await db.SubmissionGuide.create({
      user_email:       email,
      user_role:        merged.role || "homeowner",
      city_name:        merged.city?.name || "",
      city_id:          merged.city?.id || "",
      city_portal_url:  merged.city?.portal_url || "",
      permit_type_name: merged.permitType?.name || "",
      permit_type_id:   merged.permitType?.id || "",
      folio_number:     merged.property?.FOLIO_NUMBER || "",
      target_system:    merged.city?.name === "Fort Lauderdale" ? "accela" : "manual",
      phase:            "application",
      overall_status:   "in_progress",
      started_date:     new Date().toISOString().slice(0, 10),
      questions_answered: 0,
      questions_prefilled: 0,
      questions_total:  0,
      is_guest:         !currentUser,
    });
    setActiveGuide(guide);
    setStep(3);
  };

  const handlePhaseComplete = (updated) => {
    setActiveGuide(updated);
  };

  const handleGuideUpdate = (updated) => {
    setActiveGuide(updated);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f8f9ff" }}>
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  // Active submission guide — show phase UI
  if (activeGuide) {
    return (
      <div className="min-h-screen pb-8" style={{ background: "#f8f9ff" }}>
        <div className="px-4 pt-6 pb-5" style={{ background: "#022A5B" }}>
          <div className="max-w-3xl mx-auto">
            <button onClick={() => setActiveGuide(null)} className="flex items-center gap-1.5 text-blue-200 hover:text-white text-sm mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to My Applications
            </button>
            <h1 className="text-white font-bold text-xl mb-0.5" style={{ fontFamily: FONTS.h }}>{activeGuide.permit_type_name}</h1>
            <p className="text-blue-200 text-sm">{activeGuide.city_name} · Submission Guide</p>
            <div className="mt-4">
              <PhaseProgressBar phase={activeGuide.phase} />
            </div>
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-4 py-5">
          {activeGuide.phase === "application" && (
            <ApplicationPhase guide={activeGuide} currentUser={currentUser} mode={currentUser ? "app" : "web"} onComplete={handlePhaseComplete} onUpdate={handleGuideUpdate} />
          )}
          {activeGuide.phase === "preparation" && (
            <PreparationPhase guide={activeGuide} currentUser={currentUser} mode={currentUser ? "app" : "web"} onComplete={handlePhaseComplete} onUpdate={handleGuideUpdate} />
          )}
          {activeGuide.phase === "guided_submission" && (
            <GuidedSubmissionPhase guide={activeGuide} currentUser={currentUser} mode={currentUser ? "app" : "web"} onComplete={handlePhaseComplete} onUpdate={handleGuideUpdate} />
          )}
          {activeGuide.phase === "completed" && (
            <div className="text-center py-12">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: FONTS.h }}>Application Submitted!</h2>
              <p className="text-gray-500 mb-2">You completed the guided submission for <strong>{activeGuide.permit_type_name}</strong>.</p>
              {activeGuide.confirmation_number && (
                <p className="text-sm text-blue-700 font-medium mb-4">Confirmation #: {activeGuide.confirmation_number}</p>
              )}
              <Link to="/MyProjects" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ background: PRIMARY, textDecoration: "none" }}>
                View My Projects <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8" style={{ background: "#f8f9ff" }}>
      {/* Header */}
      <div className="px-4 pt-7 pb-5 bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest mb-1 text-gray-400" style={{ fontFamily: FONTS.b }}>Apply for Permit</p>
          <h1 className="font-extrabold text-2xl text-gray-900 mb-4" style={{ fontFamily: FONTS.h }}>New Permit Application</h1>
          <StepIndicator currentStep={step} />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-5">
        {/* Resume banner */}
        {showResume && resumeGuides.length > 0 && step === 1 && (
          <div className="mb-5 rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap" style={{ background: "#eff4ff", border: "1px solid #c7d7ff" }}>
            <div className="flex items-center gap-3">
              <Play className="w-5 h-5" style={{ color: PRIMARY }} />
              <div>
                <p className="font-bold text-sm" style={{ color: PRIMARY, fontFamily: FONTS.h }}>You have {resumeGuides.length} application{resumeGuides.length > 1 ? "s" : ""} in progress</p>
                <p className="text-xs text-gray-500">{resumeGuides[0].permit_type_name} · {resumeGuides[0].city_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setActiveGuide(resumeGuides[0])}
                className="text-sm font-bold px-4 py-2 rounded-xl text-white"
                style={{ background: PRIMARY, fontFamily: FONTS.b }}>
                Resume →
              </button>
              <button onClick={() => setShowResume(false)} className="text-xs text-gray-400 hover:text-gray-600">Start New</button>
            </div>
          </div>
        )}

        {step === 1 && (
          <Step1PropertyCity currentUser={currentUser} initial={{ city: null, role: "homeowner", property: null }} onNext={handleStep1} />
        )}
        {step === 2 && (
          <Step2PermitType
            cityId={stepData.city?.id}
            cityName={stepData.city?.name}
            onNext={handleStep2}
            onBack={() => setStep(1)}
          />
        )}
      </div>
    </div>
  );
}