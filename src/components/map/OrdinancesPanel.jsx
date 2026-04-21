import React, { useState } from "react";
import { X, BookOpen, ExternalLink, Send, Sparkles } from "lucide-react";

const CITY_ORDINANCE_URLS = {
  "Weston":          "https://codelibrary.amlegal.com/codes/weston/",
  "Hollywood":       "https://codelibrary.amlegal.com/codes/hollywood/",
  "Coral Springs":   "https://library.municode.com/fl/coral_springs/codes/code_of_ordinances",
  "Fort Lauderdale": "https://library.municode.com/fl/fort_lauderdale/codes/code_of_ordinances",
  "Cooper City":     "https://library.municode.com/fl/cooper_city/codes/code_of_ordinances",
};

const EXAMPLE_QUESTIONS = [
  "What are the setback requirements for fences?",
  "What's the maximum height for a shed?",
  "Can I run a business from my home?",
  "What are the pool barrier requirements?",
];

export default function OrdinancesPanel({ open, onClose, city, onAskAI }) {
  const [question, setQuestion] = useState("");
  const ordinanceUrl = CITY_ORDINANCE_URLS[city] || CITY_ORDINANCE_URLS["Weston"];

  const handleAsk = (q) => {
    const text = (q || question).trim();
    if (!text) return;
    const prompt = `Looking at the ${city} Code of Ordinances at ${ordinanceUrl}, ${text}`;
    onAskAI(prompt);
    setQuestion("");
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div
          className="px-5 py-4 flex items-start justify-between flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #0D2B5E 0%, #0F3575 100%)" }}
        >
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <BookOpen className="w-4 h-4 text-blue-300" />
              <h3 className="text-white font-bold text-base">Code of Ordinances</h3>
            </div>
            <p className="text-blue-200 text-xs">{city}, FL</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* Explainer */}
          <p className="text-sm text-gray-600 leading-relaxed">
            The Code of Ordinances contains all the rules and regulations for your city — zoning, building standards, land use, and more.
          </p>

          {/* Open Official Code button */}
          <a
            href={ordinanceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #0D2B5E 0%, #0F3575 100%)" }}
          >
            <span className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Open Official Code
            </span>
            <ExternalLink className="w-4 h-4 opacity-70" />
          </a>

          {/* Ask AI */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              <Sparkles className="w-3.5 h-3.5 inline mr-1 text-blue-500" />
              Ask about an ordinance
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAsk()}
                placeholder="e.g. What are the setback rules for pools?"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
              <button
                onClick={() => handleAsk()}
                disabled={!question.trim()}
                className="px-3 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-40 transition-opacity hover:opacity-90 flex-shrink-0"
                style={{ background: "#3B82F6" }}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Example question chips */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Example questions</p>
            <div className="space-y-2">
              {EXAMPLE_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleAsk(q)}
                  className="w-full text-left px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 text-sm text-gray-700 hover:text-blue-800 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            AI answers are sourced from the official ordinance database. Always verify with your local building department before making decisions.
          </p>
        </div>
      </div>
    </>
  );
}