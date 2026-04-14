import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ClipboardCheck } from "lucide-react";
import WizardIntro from "@/components/wizard/WizardIntro";
import WizardQuestionnaire from "@/components/wizard/WizardQuestionnaire";
import WizardResults from "@/components/wizard/WizardResults";
import WizardAIAssistant from "@/components/wizard/WizardAIAssistant";

export default function PermitWizard() {
  const [stage, setStage] = useState("intro"); // intro | questionnaire | results
  const [introData, setIntroData] = useState(null);
  const [questionnaireData, setQuestionnaireData] = useState(null);
  const [resultsData, setResultsData] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get("project_id");

  const handleIntroNext = (data) => {
    setIntroData(data);
    setStage("questionnaire");
  };

  const handleQuestionnaireNext = ({ answers, results }) => {
    setQuestionnaireData({ answers });
    setResultsData(results);
    setStage("results");
  };

  const handleRestart = () => {
    setStage("intro");
    setIntroData(null);
    setQuestionnaireData(null);
    setResultsData(null);
  };

  const handleSaveProject = async () => {
    // Assessment results are displayed on screen; users can save to a project from the results page
    alert("Review your results above and use 'Save Project' from your project dashboard to track this permit.");
  };

  const aiContext = introData ? `
Project: "${introData.description}"
Category: ${introData.aiParsed?.category}
City: ${questionnaireData?.answers?.city_name || "Unknown"}
${resultsData ? `Permits Required: ${(resultsData.permits_required || []).map(p => p.type).join(", ")}` : ""}
` : null;

  const STAGE_LABELS = { intro: "Describe Project", questionnaire: "Answer Questions", results: "Your Results" };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="px-4 py-6" style={{ background: "linear-gradient(135deg, #0D2B5E 0%, #0F3575 100%)" }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            {projectId ? (
              <Link to={`/ProjectDetail?id=${projectId}`} className="text-blue-200 hover:text-white flex items-center gap-1 text-sm">
                <ArrowLeft className="w-4 h-4" /> Back to Project
              </Link>
            ) : (
              <Link to="/ProjectDashboard" className="text-blue-200 hover:text-white flex items-center gap-1 text-sm">
                <ArrowLeft className="w-4 h-4" /> Back
              </Link>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Permit Determination Wizard</h1>
              <p className="text-blue-200 text-sm">Find out exactly which permits you need before applying</p>
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

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8 pb-32">
        {stage === "intro" && <WizardIntro onNext={handleIntroNext} />}
        {stage === "questionnaire" && (
          <WizardQuestionnaire
            intro={introData}
            onNext={handleQuestionnaireNext}
            onBack={() => setStage("intro")}
          />
        )}
        {stage === "results" && (
          <WizardResults
            intro={introData}
            questionnaire={questionnaireData}
            results={resultsData}
            onRestart={handleRestart}
            onSaveProject={handleSaveProject}
          />
        )}
      </div>

      {/* AI Assistant (always available once intro is done) */}
      {introData && <WizardAIAssistant context={aiContext} />}
    </div>
  );
}