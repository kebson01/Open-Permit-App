import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import StepProgress from "@/components/exemption/StepProgress";
import Step1CityProperty from "@/components/exemption/Step1CityProperty";
import Step2WorkType from "@/components/exemption/Step2WorkType";
import Step3Details from "@/components/exemption/Step3Details";
import Step4Result from "@/components/exemption/Step4Result";
import CommonQuestions from "@/components/exemption/CommonQuestions";
import { resolveCity } from "@/lib/permitTypes";
import { C, F, T, RADIUS, SHADOW } from "@/lib/theme";

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
  // The reader has already told the app which city they are in, so asking again
  // with a blank field is a question we know the answer to. Seeded, still
  // changeable in step 1.
  const [answers, setAnswers] = useState({ ...INITIAL_ANSWERS, city: resolveCity() });
  const [bannerOpen, setBannerOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setCurrentUser(session?.user ?? null));
  }, []);

  const setAnswer = (key, val) => setAnswers(p => ({ ...p, [key]: val }));

  // Starting over means a new project, not a new address — keep the city.
  const reset = () => { setStep(1); setAnswers({ ...INITIAL_ANSWERS, city: resolveCity() }); };

  return (
    <div style={{ background: C.ground, minHeight: "100vh", paddingBottom: 40, fontFamily: F.body, color: C.ink }}>
      <div className="mx-auto max-w-[720px] px-4 pt-5">
        <h1 style={{ fontFamily: F.head, fontSize: T.title, fontWeight: 800, letterSpacing: "-0.02em" }}>
          Do I need a permit?
        </h1>
        <p className="mt-1" style={{ color: C.muted, fontSize: T.small, lineHeight: 1.55 }}>
          Answer a few questions and get an answer based on the Florida Building Code and local
          Broward County rules.
        </p>
      </div>

      <div className="mx-auto max-w-[720px] px-4 py-5">
        {/* Info banner */}
        <div className="mb-5 overflow-hidden" style={{ background: C.warnSoft, borderRadius: RADIUS }}>
          <button
            onClick={() => setBannerOpen(p => !p)}
            aria-expanded={bannerOpen}
            className="flex w-full cursor-pointer items-center gap-2.5 border-none bg-transparent px-4 py-3 text-left"
          >
            <Info className="h-4 w-4 shrink-0" style={{ color: C.warn }} aria-hidden="true" />
            <span className="flex-1" style={{ fontSize: T.small, fontWeight: 600, color: C.warn }}>
              Guidance only — always verify with your local building department.
            </span>
            {bannerOpen
              ? <ChevronUp className="h-4 w-4 shrink-0" style={{ color: C.warn }} aria-hidden="true" />
              : <ChevronDown className="h-4 w-4 shrink-0" style={{ color: C.warn }} aria-hidden="true" />}
          </button>
          {bannerOpen && (
            <div style={{ padding: "0 16px 14px 42px" }}>
              <p style={{ fontSize: T.caption, color: C.warn, lineHeight: 1.6, margin: 0 }}>
                This tool provides guidance based on the Florida Building Code (FBC-R R105.2) and
                local city ordinances. Results are informational only — always verify with your
                local building department before starting work.
              </p>
            </div>
          )}
        </div>

        {/* Step progress */}
        {step < 4 && <StepProgress current={step} total={4} />}

        {/* Steps */}
        <div style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: RADIUS, padding: "24px 20px", boxShadow: SHADOW }}>
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