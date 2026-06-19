import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ChevronDown, ChevronUp, Info, X } from "lucide-react";
import StepProgress from "@/components/exemption/StepProgress";
import Step1CityProperty from "@/components/exemption/Step1CityProperty";
import Step2WorkType from "@/components/exemption/Step2WorkType";
import Step3Details from "@/components/exemption/Step3Details";
import Step4Result from "@/components/exemption/Step4Result";
import CommonQuestions from "@/components/exemption/CommonQuestions";

const INITIAL_ANSWERS = {
  city: "", propertyType: "", workType: "",
  structuralChanges: "", newElecPlumbing: "",
  fenceHeight: "", fenceMaterial: "", fenceFront: "",
  shedSqft: "", shedElectricity: "", shedPrefab: "",
  roofWorkType: "", hvacLikeForLike: "",
  waterHeaterType: "", waterHeaterLikeForLike: "",
  windowsImpact: "", windowsCount: "",
  poolDepth: "", poolPrefab: "",
  minorStructural: "", minorNewWiring: "",
  projectCost: "", isPrimaryResidence: "",
};

export default function ExemptionChecker() {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState(INITIAL_ANSWERS);
  const [bannerOpen, setBannerOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setCurrentUser(session?.user ?? null));
  }, []);

  const setAnswer = (key, val) => setAnswers(p => ({ ...p, [key]: val }));

  const reset = () => { setStep(1); setAnswers(INITIAL_ANSWERS); };

  return (
    <div style={{ background: "#f7f9fb", minHeight: "100vh", paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #003466 0%, #00489a 100%)", padding: "44px 24px 40px" }}>
        <div className="max-w-3xl mx-auto">
          <h1 style={{ color: "white", fontSize: 30, fontWeight: 800, fontFamily: "'Hanken Grotesk', sans-serif", marginBottom: 10 }}>
            Do I Need a Permit?
          </h1>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 15, fontFamily: "'Public Sans', sans-serif", maxWidth: 520, lineHeight: 1.6 }}>
            Answer a few questions and get an instant answer based on Florida Building Code and local Broward County rules.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Info banner */}
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, marginBottom: 20, overflow: "hidden" }}>
          <button onClick={() => setBannerOpen(p => !p)}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
            <Info className="w-4 h-4" style={{ color: "#92400e", flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#92400e", fontFamily: "'Public Sans', sans-serif" }}>
              Important: This tool provides guidance only — always verify with your local building department.
            </span>
            {bannerOpen ? <ChevronUp className="w-4 h-4" style={{ color: "#92400e" }} /> : <ChevronDown className="w-4 h-4" style={{ color: "#92400e" }} />}
          </button>
          {bannerOpen && (
            <div style={{ padding: "0 16px 14px 42px" }}>
              <p style={{ fontSize: 12, color: "#78350f", fontFamily: "'Public Sans', sans-serif", lineHeight: 1.6, margin: 0 }}>
                This tool provides guidance based on Florida Building Code (FBC-R R105.2) and local city ordinances. Results are informational only — always verify with your local building department before starting work.
              </p>
            </div>
          )}
        </div>

        {/* Step progress */}
        {step < 4 && <StepProgress current={step} total={4} />}

        {/* Steps */}
        <div style={{ background: "white", border: "1px solid #c3c6d1", borderRadius: 18, padding: "28px 24px", boxShadow: "0 1px 4px rgba(15,23,42,0.06)" }}>
          {step === 1 && <Step1CityProperty answers={answers} setAnswer={setAnswer} onNext={() => setStep(2)} />}
          {step === 2 && <Step2WorkType answers={answers} setAnswer={setAnswer} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
          {step === 3 && <Step3Details answers={answers} setAnswer={setAnswer} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
          {step === 4 && <Step4Result answers={answers} currentUser={currentUser} onReset={reset} />}
        </div>

        {/* Common questions */}
        <CommonQuestions />
      </div>
    </div>
  );
}