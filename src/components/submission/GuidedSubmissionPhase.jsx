import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Copy, Check, CheckCircle2, ExternalLink, Loader2, AlertCircle, UserPlus, Globe } from "lucide-react";
import ModeIndicator from "./ModeIndicator";

export default function GuidedSubmissionPhase({ guide, currentUser, mode = "app", onComplete, onUpdate }) {
  const [fieldMap, setFieldMap] = useState({});
  const [checked, setChecked] = useState({}); // { [fieldKey]: boolean }
  const [copied, setCopied] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmNumber, setConfirmNumber] = useState("");
  const [showConfirmInput, setShowConfirmInput] = useState(false);

  useEffect(() => {
    if (guide.field_mapping_snapshot) {
      try {
        setFieldMap(JSON.parse(guide.field_mapping_snapshot));
      } catch {}
    }
    // Restore any previously checked state
    base44.entities.SubmissionGuideStep.filter({ guide_id: guide.id, phase: "guided_submission" })
      .then(steps => {
        const c = {};
        (steps || []).forEach(s => { if (s.status === "completed") c[s.step_key] = true; });
        setChecked(c);
      }).catch(() => {});
  }, [guide.id]);

  const fields = Object.entries(fieldMap);
  // Group by section
  const sections = {};
  fields.forEach(([fieldLabel, info]) => {
    const sec = info.section || "General";
    if (!sections[sec]) sections[sec] = [];
    sections[sec].push([fieldLabel, info]);
  });

  const totalFields = fields.length;
  const checkedCount = Object.values(checked).filter(Boolean).length;
  const allChecked = totalFields > 0 && checkedCount === totalFields;

  const handleCopy = (fieldLabel, value) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(prev => ({ ...prev, [fieldLabel]: true }));
      setTimeout(() => setCopied(prev => ({ ...prev, [fieldLabel]: false })), 2000);
    });
  };

  const handleCheck = async (fieldLabel, value) => {
    const next = !checked[fieldLabel];
    setChecked(prev => ({ ...prev, [fieldLabel]: next }));
    // Persist as SubmissionGuideStep
    const stepKey = fieldLabel.replace(/\s+/g, "_").toLowerCase().slice(0, 50);
    const existing = await base44.entities.SubmissionGuideStep.filter({ guide_id: guide.id, step_key: stepKey });
    if (existing?.length > 0) {
      await base44.entities.SubmissionGuideStep.update(existing[0].id, { status: next ? "completed" : "pending" });
    } else {
      await base44.entities.SubmissionGuideStep.create({
        guide_id: guide.id,
        step_key: stepKey,
        title: fieldLabel,
        phase: "guided_submission",
        step_type: "portal_entry",
        display_order: 1,
        status: next ? "completed" : "pending",
        prefilled_value: value,
        target_field_label: fieldLabel,
      });
    }
  };

  const handleMarkSubmitted = async () => {
    setSubmitting(true);
    const updated = await base44.entities.SubmissionGuide.update(guide.id, {
      phase: "completed",
      overall_status: "submitted",
      submitted_date: new Date().toISOString().slice(0, 10),
      confirmation_number: confirmNumber || undefined,
    });
    setSubmitting(false);
    onComplete(updated);
  };

  const progress = totalFields > 0 ? Math.round((checkedCount / totalFields) * 100) : 0;

  const isWebMode = mode === "web";

  return (
    <div className="space-y-5">
      <ModeIndicator mode={mode} />
      {/* Instructions banner */}
      <div className="p-4 rounded-2xl border" style={{ background: "#EBF5FF", borderColor: "#60A9DE" }}>
        <p className="font-bold text-sm mb-1" style={{ color: "#022A5B" }}>📋 How to use this guide</p>
        <ol className="text-xs space-y-1" style={{ color: "#025799" }}>
          <li>1. Open the City of Weston permit portal in a new tab (button below)</li>
          <li>2. For each field below, click <strong>Copy</strong> to copy the value, then paste it into the portal</li>
          <li>3. Check off each field as you enter it</li>
          <li>4. When all fields are entered, click <strong>Mark as Submitted</strong></li>
        </ol>
        <a
          href="https://www.westonfl.org/Permits"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-xl text-white text-xs font-semibold"
          style={{ background: "#022A5B" }}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Open westonfl.org/Permits →
        </a>
      </div>

      {/* Progress */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
          <span>{checkedCount} of {totalFields} fields entered</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: allChecked ? "#22c55e" : "#025799" }} />
        </div>
      </div>

      {/* Field groups by section */}
      {Object.entries(sections).map(([section, sectionFields]) => (
        <div key={section} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100" style={{ background: "#F0F7FF" }}>
            <p className="font-bold text-xs uppercase tracking-wider" style={{ color: "#022A5B" }}>{section}</p>
          </div>
          <div className="divide-y divide-gray-50">
            {sectionFields.map(([fieldLabel, info]) => {
              const isChecked = checked[fieldLabel];
              const isCopied = copied[fieldLabel];
              const displayVal = info.value === "true" ? "Yes" : info.value === "false" ? "No" : info.value;
              return (
                <div key={fieldLabel} className={`px-4 py-3.5 transition-colors ${isChecked ? "bg-green-50" : ""}`}>
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={() => handleCheck(fieldLabel, info.value)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                        isChecked ? "bg-green-500 border-green-500" : "border-gray-300 hover:border-green-400"
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 text-white" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      {/* Portal field label */}
                      <p className="text-xs text-gray-400 mb-0.5 font-medium uppercase tracking-wide">{fieldLabel}</p>
                      {/* Value */}
                      <p className={`text-sm font-semibold break-words ${isChecked ? "text-gray-400" : "text-gray-900"}`}>
                        {displayVal || "—"}
                      </p>
                      {info.was_prefilled && (
                        <span className="text-xs text-blue-400">⚡ Auto-filled from your profile</span>
                      )}
                    </div>

                    {/* Copy button */}
                    {displayVal && (
                      <button
                        onClick={() => handleCopy(fieldLabel, displayVal)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium shrink-0 transition-all ${
                          isCopied
                            ? "border-green-300 bg-green-50 text-green-600"
                            : "border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600"
                        }`}
                      >
                        {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {isCopied ? "Copied!" : "Copy"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {totalFields === 0 && (
        <div className="text-center py-8 text-gray-400 bg-white rounded-2xl border border-gray-200">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p>No field mapping available. Go back to the Application phase and complete your answers.</p>
        </div>
      )}

      {/* Web mode signup CTA */}
      {isWebMode && (
        <div className="bg-gradient-to-br from-[#022A5B] to-[#025799] rounded-2xl p-5 text-white">
          <div className="flex items-start gap-3">
            <UserPlus className="w-6 h-6 shrink-0 mt-0.5 text-blue-200" />
            <div>
              <h3 className="font-bold text-base mb-1">Save your info for next time</h3>
              <p className="text-sm text-blue-100 mb-3">
                Create a free Open Permit account to auto-fill your property and contractor details on every future application — no more re-entering the same information.
              </p>
              <ul className="text-xs text-blue-200 space-y-1 mb-4">
                <li>✓ Auto-fill from your property & contractor profile</li>
                <li>✓ Save progress across multiple applications</li>
                <li>✓ Track permit status in one dashboard</li>
                <li>✓ Free to use — always</li>
              </ul>
              <button
                onClick={() => window.open("/?signup=true", "_blank")}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-[#022A5B] bg-white hover:bg-blue-50 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Create Free Account →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit section */}
      {(allChecked || checkedCount > 0) && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h3 className="font-bold text-gray-900 mb-1">Ready to submit?</h3>
          <p className="text-sm text-gray-500 mb-4">
            Once you've submitted your application to the City of Weston, mark it here to track your progress.
          </p>

          {showConfirmInput ? (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="City confirmation / application number (optional)"
                value={confirmNumber}
                onChange={e => setConfirmNumber(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <button
                onClick={handleMarkSubmitted}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50"
                style={{ background: "#16a34a" }}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {submitting ? "Saving..." : "Confirm Submission ✓"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirmInput(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm"
              style={{ background: allChecked ? "#16a34a" : "#025799" }}
            >
              <CheckCircle2 className="w-4 h-4" />
              Mark as Submitted to Weston
            </button>
          )}
        </div>
      )}
    </div>
  );
}