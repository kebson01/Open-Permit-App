import React, { useState } from "react";
import { CheckSquare, Square, LogIn } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function DocumentChecklist({ documents, permitName }) {
  const [checked, setChecked] = useState({});
  const [showSavePrompt, setShowSavePrompt] = useState(false);

  const toggle = (doc) => {
    const next = { ...checked, [doc]: !checked[doc] };
    setChecked(next);
    // Show save prompt after checking any item (only once per session)
    if (next[doc] && !showSavePrompt) {
      base44.auth.isAuthenticated().then(authed => {
        if (!authed) setShowSavePrompt(true);
      });
    }
  };

  const checkedCount = Object.values(checked).filter(Boolean).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-blue-600" />
          Documents Needed
        </h4>
        {checkedCount > 0 && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
            {checkedCount}/{documents.length} ready
          </span>
        )}
      </div>

      <ul className="space-y-2 mb-3">
        {documents.map((doc, i) => (
          <li
            key={i}
            onClick={() => toggle(doc)}
            className="flex items-start gap-2.5 cursor-pointer group"
          >
            {checked[doc] ? (
              <CheckSquare className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
            ) : (
              <Square className="w-4 h-4 text-gray-300 group-hover:text-gray-500 mt-0.5 flex-shrink-0 transition-colors" />
            )}
            <span className={`text-sm leading-snug transition-colors ${checked[doc] ? "line-through text-gray-400" : "text-gray-700 group-hover:text-gray-900"}`}>
              {doc}
            </span>
          </li>
        ))}
      </ul>

      {showSavePrompt && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
          <LogIn className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-blue-800 mb-0.5">Save your checklist</p>
            <p className="text-xs text-blue-600 mb-2">Create a free account to save your progress and come back anytime.</p>
            <button
              onClick={() => base44.auth.redirectToLogin(window.location.href)}
              className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              Sign up / Log in →
            </button>
          </div>
          <button onClick={() => setShowSavePrompt(false)} className="text-blue-400 hover:text-blue-600 text-xs leading-none mt-0.5">✕</button>
        </div>
      )}
    </div>
  );
}