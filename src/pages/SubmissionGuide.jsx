import React, { useState, useEffect } from "react";
import { getCurrentUser, redirectToLogin } from "@/lib/auth";
import * as db from "@/lib/db";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Plus, ClipboardList, CheckCircle2, Clock,
  ExternalLink, UserCheck, LogIn
} from "lucide-react";
import GuideSetup from "@/components/submission/GuideSetup";
import ApplicationPhase from "@/components/submission/ApplicationPhase";
import PreparationPhase from "@/components/submission/PreparationPhase";
import GuidedSubmissionPhase from "@/components/submission/GuidedSubmissionPhase";
import PhaseProgressBar from "@/components/submission/PhaseProgressBar";
import ModeIndicator from "@/components/submission/ModeIndicator";
import PageHeader from "@/components/ui/PageHeader";
import Btn from "@/components/ui/Btn";
import Callout from "@/components/ui/Callout";
import PanelCard from "@/components/ui/PanelCard";
import SegmentedToggle from "@/components/ui/SegmentedToggle";

const STATUS_STYLES = {
  not_started:     { bg: "bg-surface",    text: "text-muted",     label: "Not Started" },
  in_progress:     { bg: "bg-action-50",  text: "text-action",    label: "In Progress" },
  ready_to_submit: { bg: "bg-warning-50", text: "text-warning",   label: "Ready to Submit" },
  submitted:       { bg: "bg-success-50", text: "text-success",   label: "Submitted" },
  approved:        { bg: "bg-green-100",  text: "text-green-700", label: "Approved" },
  rejected:        { bg: "bg-danger-50",  text: "text-danger",    label: "Rejected" },
};

const PHASE_LABELS = {
  application:       "Application",
  preparation:       "Preparation",
  guided_submission: "Guided Submission",
  completed:         "Completed",
};

const MODE_OPTIONS = [
  { value: "app", label: "App Mode",   icon: <UserCheck className="w-3.5 h-3.5" /> },
  { value: "web", label: "Guest Mode", icon: "🌐" },
];

export default function SubmissionGuidePage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [mode, setMode] = useState("web");
  const [guides, setGuides] = useState([]);
  const [guidesLoading, setGuidesLoading] = useState(false);
  const [activeGuide, setActiveGuide] = useState(null);
  const [showSetup, setShowSetup] = useState(false);
  const [guestEmail, setGuestEmail] = useState(null);

  useEffect(() => {
    getCurrentUser().then(u => {
      if (u) { setCurrentUser(u); setMode("app"); loadGuides(u.email); }
    }).catch(() => {}).finally(() => setAuthLoading(false));
  }, []);

  const loadGuides = async (email) => {
    if (!email) return;
    setGuidesLoading(true);
    const data = await db.SubmissionGuide.filter({ user_email: email });
    setGuides(Array.isArray(data) ? data : []);
    setGuidesLoading(false);
  };

  const handleGuideCreated = (guide, email) => {
    setShowSetup(false);
    setActiveGuide(guide);
    if (mode === "web" && email) { setGuestEmail(email); loadGuides(email); }
    else if (currentUser) loadGuides(currentUser.email);
  };

  const handlePhaseComplete = (updatedGuide) => {
    setActiveGuide(updatedGuide);
    const email = currentUser?.email || guestEmail;
    if (email) loadGuides(email);
  };

  const handleGuideUpdate = (updated) => setActiveGuide(updated);

  const switchToAppMode = () => redirectToLogin();

  const handleModeChange = (val) => {
    if (val === "app" && !currentUser) { switchToAppMode(); return; }
    setMode(val);
  };

  // ── Active guide ──
  if (activeGuide) {
    return (
      <div className="min-h-screen bg-surface pb-24 md:pb-8">
        <div className="bg-brand px-5 pt-6 pb-5">
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
            <div className="mt-4"><PhaseProgressBar phase={activeGuide.phase} /></div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-5">
          {activeGuide.phase === "application" && (
            <ApplicationPhase guide={activeGuide} currentUser={currentUser} mode={mode} onComplete={handlePhaseComplete} onUpdate={handleGuideUpdate} />
          )}
          {activeGuide.phase === "preparation" && (
            <PreparationPhase guide={activeGuide} currentUser={currentUser} mode={mode} onComplete={handlePhaseComplete} onUpdate={handleGuideUpdate} />
          )}
          {activeGuide.phase === "guided_submission" && (
            <GuidedSubmissionPhase guide={activeGuide} currentUser={currentUser} mode={mode} onComplete={handlePhaseComplete} onUpdate={handleGuideUpdate} />
          )}
          {activeGuide.phase === "completed" && (
            <div className="text-center py-12">
              <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-ink mb-2">Application Submitted!</h2>
              <p className="text-muted mb-2">
                You've completed the guided submission for <strong>{activeGuide.permit_type_name}</strong>.
              </p>
              {activeGuide.confirmation_number && (
                <p className="text-sm text-action font-medium mb-4">Confirmation #: {activeGuide.confirmation_number}</p>
              )}
              <Btn variant="primary" size="md" as="a" href="https://www.westonfl.org/Permits" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" /> Check Status at westonfl.org/Permits
              </Btn>
              {mode === "web" && !currentUser && (
                <div className="mt-6 max-w-md mx-auto">
                  <Callout variant="info" title="Save your info for next time">
                    Create a free account to auto-fill your next application instantly.
                    <div className="mt-2">
                      <Btn variant="secondary" size="sm" onClick={() => redirectToLogin()}>
                        <LogIn className="w-3.5 h-3.5" /> Create Free Account →
                      </Btn>
                    </div>
                  </Callout>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Setup wizard ──
  if (showSetup) {
    return (
      <div className="min-h-screen bg-surface pb-24 md:pb-8">
        <div className="bg-brand px-5 pt-6 pb-5">
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

  // ── Dashboard ──
  const isLoading = authLoading || guidesLoading;

  return (
    <div className="min-h-screen bg-surface pb-24 md:pb-8">
      <PageHeader
        eyebrow="Submission Guide"
        title="Permit Application Guide"
        subtitle="Prepare and submit permit applications to the City of Weston — step by step."
        actions={
          <Btn variant="primary" size="md" onClick={() => setShowSetup(true)}>
            <Plus className="w-4 h-4" /> New Application
          </Btn>
        }
      />

      <div className="max-w-4xl mx-auto px-4 pt-5 space-y-4">
        {/* Mode toggle */}
        <SegmentedToggle
          options={MODE_OPTIONS}
          value={mode}
          onChange={handleModeChange}
        />

        {/* Mode callout */}
        {mode === "app" && currentUser ? (
          <Callout variant="success" title="App Mode — Profile Auto-Fill Active">
            Your property data, contractor profile, and project details will be automatically filled in. You can review and edit everything before submitting.
            {currentUser && <span className="block mt-1 font-medium">Signed in as {currentUser.email}</span>}
          </Callout>
        ) : mode === "web" ? (
          <Callout variant="warning" title="Guest Mode — No Login Required">
            You'll fill in all fields manually. Every question includes a plain-English explanation so you know exactly what's needed and why.
            {!currentUser && (
              <button onClick={switchToAppMode} className="mt-1 text-xs font-semibold underline flex items-center gap-1">
                <LogIn className="w-3 h-3" /> Sign in to enable auto-fill
              </button>
            )}
          </Callout>
        ) : null}

        {/* Guide list */}
        {isLoading ? (
          <div className="text-center py-16 text-muted">Loading...</div>
        ) : guides.length === 0 ? (
          <PanelCard>
            <div className="text-center py-12">
              <ClipboardList className="w-12 h-12 text-line mx-auto mb-4" />
              <h2 className="text-lg font-bold text-ink mb-2">No applications yet</h2>
              <p className="text-sm text-muted mb-5 max-w-sm mx-auto">
                {mode === "web"
                  ? "Start a new application and we'll walk you through every question with plain-English explanations."
                  : "Start a new application — your profile data will be auto-filled to save you time."}
              </p>
              <Btn variant="primary" size="md" onClick={() => setShowSetup(true)}>
                <Plus className="w-4 h-4" /> Start Your First Application
              </Btn>
            </div>
          </PanelCard>
        ) : (
          <div className="space-y-3">
            {guides.map(guide => {
              const s = STATUS_STYLES[guide.overall_status] || STATUS_STYLES.not_started;
              const pctDone = guide.questions_total > 0
                ? Math.round((guide.questions_answered / guide.questions_total) * 100)
                : 0;
              return (
                <button key={guide.id} onClick={() => setActiveGuide(guide)}
                  className="w-full text-left bg-white border border-line rounded-card p-5 hover:shadow-card hover:border-action-100 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-ink">{guide.permit_type_name}</h3>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${s.bg} ${s.text}`}>{s.label}</span>
                        {guide.is_guest && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-warning-50 text-warning border border-amber-200 font-medium">Guest</span>
                        )}
                      </div>
                      <p className="text-sm text-muted">{guide.city_name} · {PHASE_LABELS[guide.phase] || guide.phase}</p>
                      {guide.questions_total > 0 && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-muted mb-1">
                            <span>{guide.questions_answered} of {guide.questions_total} questions answered</span>
                            <span>{pctDone}%</span>
                          </div>
                          <div className="h-1.5 bg-line rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-action" style={{ width: `${pctDone}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 text-xs text-muted">
                      {guide.overall_status === "submitted" && guide.submitted_date
                        ? <span className="flex items-center gap-1 text-success"><CheckCircle2 className="w-3.5 h-3.5" />Submitted</span>
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