import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, ChevronRight, ChevronLeft, AlertTriangle } from "lucide-react";
import { useGuideQuestions } from "./useGuideQuestions";
import QuestionField from "./QuestionField";

export default function ApplicationPhase({ guide, currentUser, onComplete, onUpdate }) {
  const { questions, answers, setAnswers, loading } = useGuideQuestions(guide, currentUser);
  const [saving, setSaving] = useState(false);
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);

  // Group by section
  const sections = [];
  questions.forEach(q => {
    if (!sections.includes(q.section)) sections.push(q.section);
  });

  const currentSection = sections[currentSectionIdx];
  const sectionQuestions = questions.filter(q => {
    if (q.section !== currentSection) return false;
    // Handle conditional questions
    if (q.conditional_on_key && q.conditional_on_value) {
      const dep = answers[q.conditional_on_key];
      if (!dep || dep.answer_value !== q.conditional_on_value) return false;
    }
    return true;
  });

  const handleAnswer = (q, value) => {
    setAnswers(prev => ({
      ...prev,
      [q.question_key]: {
        ...(prev[q.question_key] || {}),
        _pending: true,
        guide_id: guide.id,
        question_id: q.id || q.question_key,
        question_key: q.question_key,
        question_text: q.question_text,
        answer_value: value,
        was_prefilled: prev[q.question_key]?.was_prefilled || false,
        was_edited: prev[q.question_key]?.was_prefilled ? true : false,
        answered_by: currentUser.email,
        answered_date: new Date().toISOString().slice(0, 10),
      }
    }));
  };

  const isSectionComplete = () => {
    return sectionQuestions.every(q => {
      if (!q.is_required) return true;
      const ans = answers[q.question_key];
      return ans?.answer_value && ans.answer_value.trim() !== "";
    });
  };

  const saveAnswers = async () => {
    setSaving(true);
    // Persist all pending answers
    const pending = Object.values(answers).filter(a => a._pending);
    for (const a of pending) {
      const { _pending, ...data } = a;
      if (a.id) {
        await base44.entities.SubmissionAnswer.update(a.id, data);
      } else {
        const created = await base44.entities.SubmissionAnswer.create(data);
        setAnswers(prev => ({ ...prev, [a.question_key]: { ...created } }));
      }
    }
    setSaving(false);
  };

  const handleNext = async () => {
    await saveAnswers();
    if (currentSectionIdx < sections.length - 1) {
      setCurrentSectionIdx(i => i + 1);
    } else {
      // All sections done — update guide and advance phase
      const totalQ = questions.length;
      const answeredQ = Object.values(answers).filter(a => a.answer_value).length;
      const prefilledQ = Object.values(answers).filter(a => a.was_prefilled && !a.was_edited).length;
      const updated = await base44.entities.SubmissionGuide.update(guide.id, {
        questions_total: totalQ,
        questions_answered: answeredQ,
        questions_prefilled: prefilledQ,
        phase: "preparation",
        overall_status: "in_progress",
      });
      onComplete(updated);
    }
  };

  const handleBack = () => {
    if (currentSectionIdx > 0) setCurrentSectionIdx(i => i - 1);
  };

  if (loading) return (
    <div className="text-center py-16"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" /></div>
  );

  const progress = sections.length > 0 ? Math.round(((currentSectionIdx) / sections.length) * 100) : 0;

  return (
    <div>
      {/* Progress */}
      <div className="mb-5">
        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
          <span>Section {currentSectionIdx + 1} of {sections.length}: <strong>{currentSection}</strong></span>
          <span>{progress}% complete</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: "#025799" }} />
        </div>
        <div className="flex gap-1 mt-2">
          {sections.map((s, i) => (
            <div key={s} className={`flex-1 h-1 rounded-full ${i <= currentSectionIdx ? "bg-blue-500" : "bg-gray-200"}`} />
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-4">
        <h2 className="font-bold text-gray-900 mb-1">{currentSection}</h2>
        <p className="text-xs text-gray-400 mb-5">{sectionQuestions.filter(q => q.is_required).length} required fields in this section</p>

        {sectionQuestions.map(q => (
          <QuestionField
            key={q.question_key}
            question={q}
            value={answers[q.question_key]?.answer_value || ""}
            onChange={val => handleAnswer(q, val)}
            prefilled={answers[q.question_key]?.was_prefilled && !answers[q.question_key]?.was_edited}
          />
        ))}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        {currentSectionIdx > 0 && (
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={!isSectionComplete() || saving}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-semibold text-sm disabled:opacity-50 transition-opacity hover:opacity-90"
          style={{ background: "#022A5B" }}
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {currentSectionIdx < sections.length - 1 ? (
            <><span>Next Section</span> <ChevronRight className="w-4 h-4" /></>
          ) : (
            "Continue to Preparation →"
          )}
        </button>
      </div>

      {!isSectionComplete() && (
        <div className="mt-3 flex items-center gap-2 text-xs text-amber-600">
          <AlertTriangle className="w-3.5 h-3.5" />
          Please answer all required fields to continue.
        </div>
      )}
    </div>
  );
}