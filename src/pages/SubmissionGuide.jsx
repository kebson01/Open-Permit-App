import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, ClipboardList, CheckCircle2, Clock, AlertTriangle, ExternalLink } from "lucide-react";
import GuideSetup from "@/components/submission/GuideSetup";
import ApplicationPhase from "@/components/submission/ApplicationPhase";
import PreparationPhase from "@/components/submission/PreparationPhase";
import GuidedSubmissionPhase from "@/components/submission/GuidedSubmissionPhase";
import PhaseProgressBar from "@/components/submission/PhaseProgressBar";

const STATUS_STYLES = {
  not_started:    { bg: "bg-gray-100",   text: "text-gray-600",   label: "Not Started" },
  in_progress:    { bg: "bg-blue-100",   text: "text-blue-700",   label: "In Progress" },
  ready_to_submit:{ bg: "bg-amber-100",  text: "text-amber-700",  label: "Ready to Submit" },
  submitted:      { bg: "bg-green-100",  text: "text-green-700",  label: "Submitted" },
  approved:       { bg: "bg-emerald-100",text: "text-emerald-700",label: "Approved" },
  rejected:       { bg: "bg-red-100",    text: "text-red-700",    label: "Rejected" },
};

const PHASE_LABELS = {
  application: "Application",
  preparation: "Preparation",
  guided_submission: "Guided Submission",
  completed: "Completed",
};

export default function SubmissionGuidePage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeGuide, setActiveGuide] = useState(null);
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      setCurrentUser(u);
      if (u) loadGuides(u.email);
    }).catch(() => setLoading(false));
  }, []);

  const loadGuides = async (email) => {
    setLoading(true);
    const data = await base44.entities.SubmissionGuide.filter({ user_email: email }, "-updated_date");
    setGuides(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const handleGuideCreated = (guide) => {
    setShowSetup(false);
    setActiveGuide(guide);
    loadGuides(currentUser.email);
  };

  const handlePhaseComplete = async (guide, nextPhase) => {
    const updated = await base44.entities.SubmissionGuide.update(guide.id, { phase: nextPhase });
    setActiveGuide(updated);
    loadGuides(currentUser.email);
  };

  const handleGuideUpdate = (updated) => {
    setActiveGuide(updated);
    loadGuides(currentUser?.email);
  };

  // Not logged in
  if (!loading && !currentUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <ClipboardList className="w-12 h-12 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Sign in to use the Submission Guide</h2>
        <p className="text-gray-500 text-sm mb-5 text-center max-w-sm">The Submission Guide saves your progress and helps you prepare your permit application step by step.</p>
        <button onClick={() => base44.auth.redirectToLogin(window.location.href)}
          className="px-5 py-2.5 rounded-xl text-white font-semibold text-sm"
          style={{ background: "#022A5B" }}>
          Sign In to Continue
        </button>
      </div>
    );
  }

  // Active guide — show the phase UI
  if (activeGuide) {
    return (
      <div className="min-h-screen pb-24 md:pb-8" style={{ backgroundColor: "#f9f9fc" }}>
        {/* Header */}
        <div className="px-5 pt-6 pb-5" style={{ background: "#022A5B" }}>
          <div className="max-w-3xl mx-auto">
            <button onClick={() => setActiveGuide(null)}
              className="flex items-center gap-1.5 text-blue-200 hover:text-white text-sm mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to My Applications
            </button>
            <h1 className="text-white font-bold text-xl mb-0.5">{activeGuide.permit_type_name}</h1>
            <p className="text-blue-200 text-sm">{activeGuide.city_name} · Submission Guide</p>
            <div className="mt-4">
              <PhaseProgressBar phase={activeGuide.phase} />
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-5">
          {activeGuide.phase === "application" && (
            <ApplicationPhase
              guide={activeGuide}
              currentUser={currentUser}
              onComplete={(g) => handlePhaseComplete(g, "preparation")}
              onUpdate={handleGuideUpdate}
            />
          )}
          {activeGuide.phase === "preparation" && (
            <PreparationPhase
              guide={activeGuide}
              currentUser={currentUser}
              onComplete={(g) => handlePhaseComplete(g, "guided_submission")}
              onUpdate={handleGuideUpdate}
            />
          )}
          {activeGuide.phase === "guided_submission" && (
            <GuidedSubmissionPhase
              guide={activeGuide}
              currentUser={currentUser}
              onComplete={(g) => handlePhaseComplete(g, "completed")}
              onUpdate={handleGuideUpdate}
            />
          )}
          {activeGuide.phase === "completed" && (
            <div className="text-center py-16">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
              <p className="text-gray-500 mb-2">You've completed the guided submission for <strong>{activeGuide.permit_type_name}</strong>.</p>
              {activeGuide.confirmation_number && (
                <p className="text-sm text-blue-700 font-medium mb-4">Confirmation #: {activeGuide.confirmation_number}</p>
              )}
              <a href="https://www.westonfl.org/Permits" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold mb-4"
                style={{ background: "#022A5B" }}>
                <ExternalLink className="w-4 h-4" /> Check Status at westonfl.org/Permits
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Setup wizard
  if (showSetup) {
    return (
      <div className="min-h-screen pb-24 md:pb-8" style={{ backgroundColor: "#f9f9fc" }}>
        <div className="px-5 pt-6 pb-5" style={{ background: "#022A5B" }}>
          <div className="max-w-3xl mx-auto">
            <button onClick={() => setShowSetup(false)}
              className="flex items-center gap-1.5 text-blue-200 hover:text-white text-sm mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Cancel
            </button>
            <h1 className="text-white font-bold text-xl">Start a New Permit Application</h1>
            <p className="text-blue-200 text-sm mt-0.5">We'll guide you step by step through the process.</p>
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-4 py-5">
          <GuideSetup currentUser={currentUser} onCreated={handleGuideCreated} />
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="min-h-screen pb-24 md:pb-8" style={{ backgroundColor: "#f9f9fc" }}>
      {/* Hero */}
      <div className="px-5 pt-8 pb-7" style={{ background: "#00020c" }}>
        <div className="max-w-4xl mx-auto flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.45)" }}>Submission Guide</p>
            <h1 className="font-bold text-white text-2xl mb-1">My Permit Applications</h1>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>Prepare and submit permit applications to the City of Weston — step by step.</p>
          </div>
          <button
            onClick={() => setShowSetup(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-sm mt-2"
            style={{ background: "#025799" }}
          >
            <Plus className="w-4 h-4" /> New Application
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading...</div>
        ) : guides.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-700 mb-2">No applications yet</h2>
            <p className="text-sm text-gray-500 mb-5 max-w-sm mx-auto">Start a new application to get a step-by-step guide for submitting your permit to the City of Weston.</p>
            <button onClick={() => setShowSetup(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm"
              style={{ background: "#022A5B" }}>
              <Plus className="w-4 h-4" /> Start Your First Application
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {guides.map(guide => {
              const s = STATUS_STYLES[guide.overall_status] || STATUS_STYLES.not_started;
              const pctDone = guide.questions_total > 0
                ? Math.round((guide.questions_answered / guide.questions_total) * 100)
                : 0;
              return (
                <button
                  key={guide.id}
                  onClick={() => setActiveGuide(guide)}
                  className="w-full text-left bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md hover:border-blue-200 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-gray-900">{guide.permit_type_name}</h3>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${s.bg} ${s.text}`}>{s.label}</span>
                      </div>
                      <p className="text-sm text-gray-500">{guide.city_name} · {PHASE_LABELS[guide.phase] || guide.phase}</p>
                      {guide.questions_total > 0 && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>{guide.questions_answered} of {guide.questions_total} questions answered</span>
                            <span>{pctDone}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pctDone}%`, background: "#025799" }} />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 text-xs text-gray-400">
                      {guide.overall_status === "submitted" && guide.submitted_date
                        ? <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-3.5 h-3.5" />Submitted</span>
                        : <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />Resume →</span>
                      }
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}