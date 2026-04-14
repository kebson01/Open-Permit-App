import React, { useState } from "react";
import { CheckSquare, Square, LogIn } from "lucide-react";
import { base44 } from "@/api/base44Client";

const DOC_HINTS = {
  "BCUBPA": "Broward County's standard permit application form. Download it from the Broward County website.",
  "Broward County Uniform Building Permit Application": "Broward County's standard permit application form. Download it from the Broward County website.",
  "Notice of Commencement": "A legal notice filed before work begins on projects over $2,500. Your contractor typically handles this.",
  "Product Approval": "Manufacturer documentation showing the product meets Florida Building Code wind resistance requirements.",
  "Signed and Sealed Plans": "Architectural or engineering drawings stamped by a licensed professional.",
  "Site Plan": "A scaled drawing showing the layout of your property and where the work will be performed.",
  "Survey": "A licensed surveyor's drawing showing your property boundaries and existing structures.",
  "Energy Calculations": "Documentation showing your project meets Florida's energy efficiency requirements.",
  "Manufacturer's Specifications": "Technical data sheets from the product manufacturer confirming code compliance.",
  "Contractor License": "A copy of your contractor's current Florida state or Broward County license.",
  "Owner Builder Affidavit": "A signed statement declaring you are the property owner and acting as your own contractor.",
  "Photo ID": "Government-issued photo identification of the permit applicant.",
  "Proof of Property Ownership": "A copy of your deed or tax record confirming you own the property.",
  "HOA Approval": "Written approval from your Homeowners Association, if applicable.",
  "Load Calculations": "Engineering calculations showing the electrical or structural load requirements for your project.",
  "Truss Engineering": "Stamped engineering documents for roof trusses, required for new roofs.",
  "Hazardous Materials Report": "Documentation identifying and addressing any hazardous materials on site.",
};

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
            <span className="flex flex-col">
              <span className={`text-sm leading-snug transition-colors ${checked[doc] ? "line-through text-gray-400" : "text-gray-700 group-hover:text-gray-900"}`}>
                {doc}
              </span>
              {DOC_HINTS[doc] && (
                <span className="text-xs text-gray-400 mt-0.5 leading-snug">{DOC_HINTS[doc]}</span>
              )}
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