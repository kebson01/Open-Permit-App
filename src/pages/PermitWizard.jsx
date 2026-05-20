import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, ClipboardCheck, Calculator, Search, BookOpen,
  ShieldCheck, MapPin, FileText, Camera, Zap, ChevronRight, HelpCircle
} from "lucide-react";
import WizardIntro from "@/components/wizard/WizardIntro";
import WizardQuestionnaire from "@/components/wizard/WizardQuestionnaire";
import WizardResults from "@/components/wizard/WizardResults";
import WizardAIAssistant from "@/components/wizard/WizardAIAssistant";

const TOOLS = [
  {
    icon: ShieldCheck,
    title: "Exemption Checker",
    description: "See if your project qualifies for Florida's HB 803 permit exemption (under $7,500).",
    link: "/ExemptionChecker",
    badge: "HB 803",
    badgeColor: "bg-green-100 text-green-700",
    iconBg: "bg-green-50",
    iconColor: "text-green-600",
  },
  {
    icon: BookOpen,
    title: "Visual Permit Guide",
    description: "Interactive map-based guide to identify exactly which permits apply to your project area.",
    link: "/PermitGuide",
    badge: "Interactive",
    badgeColor: "bg-blue-100 text-blue-700",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    icon: Calculator,
    title: "Fee Calculator",
    description: "Get an instant estimate of all permit fees including state surcharges before you apply.",
    link: "/FeeCalculator",
    badge: "Instant",
    badgeColor: "bg-purple-100 text-purple-700",
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
  },
  {
    icon: Search,
    title: "Property Search",
    description: "Look up any Broward County property to view permit history, ownership, and building details.",
    link: "/PropertyGuide",
    badge: "BCPA Data",
    badgeColor: "bg-amber-100 text-amber-700",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    icon: FileText,
    title: "Apply for Permit",
    description: "Start your guided permit application — answer questions and we'll walk you through submission.",
    link: "/ApplyForPermit",
    badge: "Step-by-step",
    badgeColor: "bg-indigo-100 text-indigo-700",
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
  },
  {
    icon: Camera,
    title: "AR Photo Analysis",
    description: "Take a photo of your project area and let AI identify relevant permits and requirements.",
    link: "/ar-tools",
    badge: "AI Vision",
    badgeColor: "bg-rose-100 text-rose-700",
    iconBg: "bg-rose-50",
    iconColor: "text-rose-600",
  },
  {
    icon: MapPin,
    title: "Building Codes",
    description: "Browse local ordinances, zoning rules, and building codes for South Florida cities.",
    link: "/BuildingCodes",
    badge: "Reference",
    badgeColor: "bg-slate-100 text-slate-700",
    iconBg: "bg-slate-50",
    iconColor: "text-slate-600",
  },
  {
    icon: ClipboardCheck,
    title: "My Projects",
    description: "Track all your permit applications, milestones, and team collaboration in one place.",
    link: "/MyProjects",
    badge: "Dashboard",
    badgeColor: "bg-teal-100 text-teal-700",
    iconBg: "bg-teal-50",
    iconColor: "text-teal-600",
  },
];

const STAGE_LABELS = { intro: "Describe Project", questionnaire: "Answer Questions", results: "Your Results" };

export default function PermitWizard() {
  const [mode, setMode] = useState("hub"); // "hub" | "wizard"
  const [stage, setStage] = useState("intro");
  const [introData, setIntroData] = useState(null);
  const [questionnaireData, setQuestionnaireData] = useState(null);
  const [resultsData, setResultsData] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get("project_id");

  const handleRestart = () => {
    setStage("intro");
    setIntroData(null);
    setQuestionnaireData(null);
    setResultsData(null);
    setMode("hub");
  };

  const aiContext = introData ? `
Project: "${introData.description}"
Category: ${introData.aiParsed?.category}
City: ${questionnaireData?.answers?.city_name || "Unknown"}
${resultsData ? `Permits Required: ${(resultsData.permits_required || []).map(p => p.type).join(", ")}` : ""}
` : null;

  // ── HUB MODE ──
  if (mode === "hub") {
    return (
      <div className="min-h-screen" style={{ background: "#f8fafc" }}>
        {/* Header */}
        <div className="px-5 pt-8 pb-8" style={{ background: "linear-gradient(135deg, #0D2B5E 0%, #1a3a7a 100%)" }}>
          <div className="max-w-4xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-widest mb-2 text-blue-300">Permit Navigator</p>
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-white text-2xl leading-tight">Permit Wizard & Tools</h1>
                <p className="text-blue-200 text-sm">Your complete permit toolkit for South Florida</p>
              </div>
            </div>

            {/* CTA to start wizard */}
            <div className="mt-5 p-4 bg-white/10 border border-white/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-start gap-3 flex-1">
                <HelpCircle className="w-5 h-5 text-blue-200 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-white text-sm">Not sure what permits you need?</p>
                  <p className="text-blue-200 text-xs mt-0.5">Answer a few questions and our AI will tell you exactly which permits apply to your project.</p>
                </div>
              </div>
              <button
                onClick={() => setMode("wizard")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-blue-900 font-bold text-sm hover:bg-blue-50 transition-colors shrink-0"
              >
                Start Wizard <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="max-w-4xl mx-auto px-4 py-8 pb-20">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">All Permit Tools</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-4">
            {TOOLS.map(tool => (
              <Link
                key={tool.title}
                to={tool.link}
                className="group flex items-start gap-4 p-5 bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${tool.iconBg}`}>
                  <tool.icon className={`w-5 h-5 ${tool.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900 text-sm">{tool.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tool.badgeColor}`}>
                      {tool.badge}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{tool.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors shrink-0 mt-0.5" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── WIZARD MODE ──
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Wizard Header */}
      <div className="px-4 py-6" style={{ background: "linear-gradient(135deg, #0D2B5E 0%, #0F3575 100%)" }}>
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleRestart}
            className="text-blue-200 hover:text-white flex items-center gap-1 text-sm mb-4"
          >
            ← Back to Tools Hub
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Permit Determination Wizard</h1>
              <p className="text-blue-200 text-sm">Find out exactly which permits you need</p>
            </div>
          </div>
          {/* Stage indicator */}
          <div className="flex gap-2 mt-5">
            {Object.entries(STAGE_LABELS).map(([key, label], i) => (
              <div key={key} className="flex items-center gap-2 flex-1">
                <div className={`flex items-center gap-1.5 ${stage === key ? "opacity-100" : Object.keys(STAGE_LABELS).indexOf(stage) > i ? "opacity-80" : "opacity-40"}`}>
                  <div className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${
                    stage === key ? "bg-white text-blue-700" :
                    Object.keys(STAGE_LABELS).indexOf(stage) > i ? "bg-green-400 text-white" : "bg-white/30 text-white"
                  }`}>{i + 1}</div>
                  <span className="text-xs text-white hidden sm:block">{label}</span>
                </div>
                {i < 2 && <div className={`h-px flex-1 ${Object.keys(STAGE_LABELS).indexOf(stage) > i ? "bg-green-400" : "bg-white/20"}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Wizard Content */}
      <div className="max-w-2xl mx-auto px-4 py-8 pb-32">
        {stage === "intro" && <WizardIntro onNext={(data) => { setIntroData(data); setStage("questionnaire"); }} />}
        {stage === "questionnaire" && (
          <WizardQuestionnaire
            intro={introData}
            onNext={({ answers, results }) => { setQuestionnaireData({ answers }); setResultsData(results); setStage("results"); }}
            onBack={() => setStage("intro")}
          />
        )}
        {stage === "results" && (
          <WizardResults
            intro={introData}
            questionnaire={questionnaireData}
            results={resultsData}
            onRestart={handleRestart}
            onSaveProject={() => alert("Review your results above and use 'Save Project' from your project dashboard to track this permit.")}
          />
        )}
      </div>

      {introData && <WizardAIAssistant context={aiContext} />}
    </div>
  );
}