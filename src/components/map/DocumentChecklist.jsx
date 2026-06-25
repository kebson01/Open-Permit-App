import React, { useState } from "react";
import { CheckSquare, Square, LogIn } from "lucide-react";
import { isAuthenticated, redirectToLogin } from "@/lib/auth";

const DOC_EXPLANATIONS = {
  "BCUBPA": "Broward County's standard permit application form. Download it from the Broward County website.",
  "Broward County Uniform Building Permit Application": "Broward County's standard permit application form. Download it from the Broward County website.",
  "Notice of Commencement": "A legal notice filed before work begins on projects over $2,500. Your contractor typically handles this.",
  "Product Approval": "Manufacturer documentation showing the product meets Florida Building Code wind resistance requirements.",
  "Signed and Sealed Plans": "Architectural or engineering drawings stamped by a licensed professional.",
  "Energy Calculations": "A report showing your project meets Florida's energy efficiency requirements.",
  "Contractor License": "A copy of your contractor's current state-issued license.",
  "Property Survey": "A legal drawing of your property showing boundaries and existing structures.",
  "Site Plan": "A drawing showing the layout of the project on your lot, including setbacks from property lines.",
  "Structural Plans": "Engineering drawings detailing load-bearing elements of the structure.",
  "Electrical Plans": "Diagrams of the electrical wiring and panel layout for the project.",
  "Manufacturer's Specifications": "Technical documents from the product manufacturer showing installation requirements.",
  "Homeowner Affidavit": "A signed statement confirming you are the owner and will occupy the home.",
  "NOC": "Notice of Commencement — a legal notice filed before work begins on projects over $2,500.",
};

export default function DocumentChecklist({ documents, permitName }) {
  const [checked, setChecked] = useState({});
  const [showSavePrompt, setShowSavePrompt] = useState(false);

  const toggle = (doc) => {
    const next = { ...checked, [doc]: !checked[doc] };
    setChecked(next);
    // Show save prompt after checking any item (only once per session)
    if (next[doc] && !showSavePrompt) {
      isAuthenticated().then(authed => {
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
            <div>
              <span className={`text-sm leading-snug transition-colors ${checked[doc] ? "line-through text-gray-400" : "text-gray-700 group-hover:text-gray-900"}`}>
                {doc}
              </span>
              {DOC_EXPLANATIONS[doc] && (
                <p className="text-xs text-gray-400 mt-0.5 leading-snug">{DOC_EXPLANATIONS[doc]}</p>
              )}
            </div>
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
              onClick={() => redirectToLogin()}
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