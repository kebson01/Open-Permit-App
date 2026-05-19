import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Plus, ClipboardList, CheckCircle2, Clock,
  ExternalLink, Globe, UserCheck, LogIn
} from "lucide-react";
import GuideSetup from "@/components/submission/GuideSetup";
import ApplicationPhase from "@/components/submission/ApplicationPhase";
import PreparationPhase from "@/components/submission/PreparationPhase";
import GuidedSubmissionPhase from "@/components/submission/GuidedSubmissionPhase";
import PhaseProgressBar from "@/components/submission/PhaseProgressBar";
import ModeIndicator from "@/components/submission/ModeIndicator";

const STATUS_STYLES = {
  not_started:     { bg: "bg-gray-100",    text: "text-gray-600",    label: "Not Started" },
  in_progress:     { bg: "bg-blue-100",    text: "text-blue-700",    label: "In Progress" },
  ready_to_submit: { bg: "bg-amber-100",   text: "text-amber-700",   label: "Ready to Submit" },
  submitted:       { bg: "bg-green-100",   text: "text-green-700",   label: "Submitted" },
  approved:        { bg: "bg-emerald-100", text: "text-emerald-700", label: "Approved" },
  rejected:        { bg: "bg-red-100",     text: "text-red-700",     label: "Rejected" },
};

const PHASE_LABELS = {
  application:       "Application",
  preparation:       "Preparation",
  guided_submission: "Guided Submission",
  completed:         "Completed",
};

export default function SubmissionGuidePage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [mode, setMode] = useState("web"); // "app" | "web" — resolved after auth check
  const [guides, setGuides] = useState([]);
  const [guidesLoading, setGuidesLoading] = useState(false);
  const [activeGuide, setActiveGuide] = useState(null);
  const [showSetup, setShowSetup] = useState(false);
  // For web mode, track guest email so we can load their guides
  const [guestEmail, setGuestEmail] = useState(null);

  // Auth check — if logged in, default to app mode
  useEffect(() => {
    base44.auth.me().then(u => {
      if (u) {
        setCurrentUser(u);
        setMode("app");
        loadGuides(u.email);
      }
    }).catch(() => {}).finally(() => setAuthLoading(false));
  }, []);

  const loadGuides = async (email) => {
    if (!email) return;
    setGuidesLoading(true);
    const data = await base44.entities.SubmissionGuide.filter({ user_email: email }, "-updated_date");
    setGuides(Array.isArray(data) ? data : []);
    setGuidesLoading(false);
  };

  const handleGuideCreated = (guide, email) => {
    setShowSetup(false);
    setActiveGuide(guide);
    if (mode === "web" && email) {
      setGuestEmail(email);
      loadGuides(email);
    } else if (currentUser) {
      loadGuides(currentUser.email);
    }
  };

  const handlePhaseComplete = (updatedGuide) => {
    setActiveGuide(updatedGuide);
    const email = currentUser?.email || guestEmail;
    if (email) loadGuides(email);
  };

  const handleGuideUpdate = (updated) => {
    setActiveGuide(updated);
  };

  const switchToAppMode = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  // --- Active guide — show phase UI ---
  if (activeGuide) {
    return (
      <div className="min-h-screen pb-24 md:pb-8" style={{ backgroundColor: "#f9f9fc" }}>
        <div className="px-5 pt-6 pb-5" style={{ background: "#022A5B" }}>
          <div className="max-w-3xl mx-auto">
            <button onClick={() => setActiveGuide(null)}
              className="flex items-center gap-1.5 text-blue-200 hover:text-white text-sm mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to My Applications
            </button>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h1 className="text-white font-bold text-xl mb-0.5">{activeGuide.permit_type_name}</h1>
                <p className="text-blue-200 text-sm">{activeGuide.city_name} · Submission Guide</p>
              </div>
              <ModeIndicator mode={mode} onSwitch={mode === "web" && !currentUser ? switchToAppMode : null} />
            </div>
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
              mode={mode}
              onComplete={handlePhaseComplete}
              onUpdate={handleGuideUpdate}
            />
          )}
          {activeGuide.phase === "preparation" && (
            <PreparationPhase
              guide={activeGuide}
              currentUser={currentUser}
              mode={mode}
              onComplete={handlePhaseComplete}
              onUpdate={handleGuideUpdate}
            />
          )}
          {activeGuide.phase === "guided_submission" && (
            <GuidedSubmissionPhase
              guide={activeGuide}
              currentUser={currentUser}
              mode={mode}
              onComplete={handlePhaseComplete}
              onUpdate={handleGuideUpdate}
            />
          )}
          {activeGuide.phase === "completed" && (
            <div className="text-center py-12">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
              <p className="text-gray-500 mb-2">
                You've completed the guided submission for <strong>{activeGuide.permit_type_name}</strong>.
              </p>
              {activeGuide.confirmation_number && (
                <p className="text-sm text-blue-700 font-medium mb-4">
                  Confirmation #: {activeGuide.confirmation_number}
                </p>
              )}
              <a href="https://www.westonfl.org/Permits" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
                style={{ background: "#022A5B" }}>
                <ExternalLink className="w-4 h-4" /> Check Status at westonfl.org/Permits
              </a>
              {mode === "web" && !currentUser && (
                <div className="mt-6 p-5 bg-gradient-to-br from-[#022A5B] to-[#025799] rounded-2xl text-white text-left max-w-md mx-auto">
                  <h3 className="font-bold mb-1.5">Save your info for next time</h3>
                  <p className="text-sm text-blue-100 mb-3">Create a free account to auto-fill your next application instantly.</p>
                  <button onClick={() => base44.auth.redirectToLogin(window.location.href)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-[#022A5B] text-sm font-bold hover:bg-blue-50 transition-colors">
                    <LogIn className="w-4 h-4" /> Create Free Account →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Setup wizard ---
  if (showSetup) {
    return (
      <div className="min-h-screen pb-24 md:pb-8" style={{ backgroundColor: "#f9f9fc" }}>
        <div className="px-5 pt-6 pb-5" style={{ background: "#022A5B" }}>
          <div className="max-w-3xl mx-auto">
            <button onClick={() => setShowSetup(false)}
              className="flex items-center gap-1.5 text-blue-200 hover:text-white text-sm mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Cancel
            </button>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h1 className="text-white font-bold text-xl">Start a New Permit Application</h1>
                <p className="text-blue-200 text-sm mt-0.5">
                  {mode === "app"
                    ? "Your profile data will be auto-filled where possible."
                    : "No account needed — we'll guide you every step of the way."}
                </p>
              </div>
              <ModeIndicator mode={mode} onSwitch={mode === "web" && !currentUser ? switchToAppMode : null} />
            </div>
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-4 py-5">
          <GuideSetup currentUser={currentUser} mode={mode} onCreated={handleGuideCreated} />
        </div>
      </div>
    );
  }

  // --- Dashboard ---
  const email = currentUser?.email || guestEmail;
  const isLoading = authLoading || guidesLoading;

  return (
    <div className="min-h-screen pb-24 md:pb-8" style={{ backgroundColor: "#f9f9fc" }}>
      {/* Hero */}
      <div className="px-5 pt-8 pb-7" style={{ background: "#022A5B" }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.45)" }}>
                Submission Guide
              </p>
              <h1 className="font-bold text-white text-2xl mb-1">Permit Application Guide</h1>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
                Prepare and submit permit applications to the City of Weston — step by step.
              </p>
            </div>
            <button
              onClick={() => setShowSetup(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-sm mt-2"
              style={{ background: "#025799" }}
            >
              <Plus className="w-4 h-4" /> New Application
            </button>
          </div>

          {/* Mode toggle bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                if (!currentUser) { switchToAppMode(); return; }
                setMode("app");
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                mode === "app"
                  ? "bg-green-500 border-green-500 text-white"
                  : "bg-white/10 border-white/20 text-white/60 hover:bg-white/20"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              {currentUser ? "App Mode" : "Sign in for App Mode"}
            </button>
            <button
              onClick={() => setMode("web")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                mode === "web"
                  ? "bg-orange-400 border-orange-400 text-white"
                  : "bg-white/10 border-white/20 text-white/60 hover:bg-white/20"
              }`}
            >
              <Globe className="w-3.5 h-3.5" /> Guest Mode
            </button>
            {mode === "app" && currentUser && (
              <span className="text-xs text-green-300 ml-1">
                Signed in as {currentUser.email}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Mode explanation cards */}
      <div className="max-w-4xl mx-auto px-4 pt-5">
        {mode === "app" && currentUser ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-2xl mb-5 flex items-start gap-3">
            <UserCheck className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-green-800 text-sm">App Mode — Profile Auto-Fill Active</p>
              <p className="text-xs text-green-700 mt-0.5">
                Your property data, contractor profile, and project details will be automatically filled in. You can review and edit everything before submitting.
              </p>
            </div>
          </div>
        ) : mode === "web" ? (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl mb-5 flex items-start gap-3">
            <Globe className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-orange-800 text-sm">Guest Mode — No Login Required</p>
              <p className="text-xs text-orange-700 mt-0.5 mb-2">
                You'll fill in all fields manually. Every question includes a plain-English explanation so you know exactly what's needed and why.
              </p>
              {!currentUser && (
                <button onClick={switchToAppMode}
                  className="flex items-center gap-1.5 text-xs font-semibold text-orange-700 hover:text-orange-900 transition-colors underline">
                  <LogIn className="w-3 h-3" /> Sign in to enable auto-fill
                </button>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Guide list */}
      <div className="max-w-4xl mx-auto px-4 pb-6">
        {isLoading ? (
          <div className="text-center py-16 text-gray-400">Loading...</div>
        ) : guides.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-700 mb-2">No applications yet</h2>
            <p className="text-sm text-gray-500 mb-5 max-w-sm mx-auto">
              {mode === "web"
                ? "Start a new application and we'll walk you through every question with plain-English explanations."
                : "Start a new application — your profile data will be auto-filled to save you time."}
            </p>
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
                <button key={guide.id} onClick={() => setActiveGuide(guide)}
                  className="w-full text-left bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md hover:border-blue-200 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-gray-900">{guide.permit_type_name}</h3>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${s.bg} ${s.text}`}>{s.label}</span>
                        {guide.is_guest && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200 font-medium">Guest</span>
                        )}
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