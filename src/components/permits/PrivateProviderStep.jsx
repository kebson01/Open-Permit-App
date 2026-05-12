import React, { useState } from "react";
import { Info, Clock, CheckSquare, X } from "lucide-react";

const PRIVATE_CHECKLIST = [
  "Private Provider Authorization Form (required)",
  "Private provider must be licensed under Florida Statute 553.791",
  "Provide private provider's license number to building department at permit submission",
  "All inspections conducted by private provider — not city inspectors",
  "City building department still issues the final permit",
  "Final Certificate of Occupancy issued by municipality",
];

export default function PrivateProviderStep({ onAnswer }) {
  const [answer, setAnswer] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const select = (val) => {
    setAnswer(val);
    onAnswer?.(val);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
      <p className="text-sm font-bold text-gray-900 mb-1">Will you be using a private provider?</p>
      <p className="text-xs text-gray-500 mb-4">(Third-party inspector / plans reviewer)</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { val: "yes", label: "Yes — Private Provider" },
          { val: "no",  label: "No — City / Municipality" },
        ].map(opt => (
          <button
            key={opt.val}
            onClick={() => select(opt.val)}
            className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
              answer === opt.val
                ? "border-blue-500 bg-blue-50 text-blue-800"
                : "border-gray-200 text-gray-600 hover:border-blue-300"
            }`}
          >
            {opt.label}
          </button>
        ))}
        <button
          onClick={() => setShowInfoModal(true)}
          className="px-4 py-2.5 rounded-xl border-2 border-indigo-200 bg-indigo-50 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
        >
          <Info className="w-3.5 h-3.5" />
          What's this?
        </button>
      </div>

      {answer === "yes" && (
        <div className="space-y-3">
          <div className="rounded-xl bg-green-50 border border-green-200 p-4 flex items-start gap-3">
            <Clock className="w-4 h-4 text-green-700 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-green-900 mb-1">⚡ Faster Timeline with a Private Provider</p>
              <p className="text-xs text-green-800 leading-relaxed">
                Plans review typically takes <strong>3–5 business days</strong> with a private provider vs. <strong>10–20 business days</strong> through the city building department.
              </p>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Additional Requirements</p>
            <ul className="space-y-1.5">
              {PRIVATE_CHECKLIST.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                  <CheckSquare className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${i < 2 ? "text-blue-600" : "text-gray-400"}`} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-xs text-blue-700">
              📋 The city building department still issues the permit — the private provider handles plans review and inspections under Florida Statute 553.791.
            </p>
          </div>
        </div>
      )}

      {answer === "no" && (
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-xs text-gray-700 leading-relaxed">
            <strong>Standard municipal review.</strong> Plans review timelines are typically 10–20 business days. Your local building department will perform all inspections.
          </p>
        </div>
      )}

      {/* Info modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowInfoModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                <Info className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="font-bold text-gray-900">What is a Private Provider?</h3>
            </div>
            <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
              <p>
                Florida law (HB 683) allows <strong>licensed private providers</strong> to perform plans review and inspections instead of the municipal building department.
              </p>
              <p>
                This can <strong>significantly reduce your permitting timeline</strong> — private providers typically complete plans review in 3–5 business days vs. 2–4 weeks through the city.
              </p>
              <p>
                The <strong>city building department still issues the permit</strong>. The private provider is simply an alternative for the technical review and inspection work.
              </p>
              <p className="text-xs text-gray-500">
                Private providers must be licensed under Florida Statute 553.791. Ask your contractor or architect for a referral, or search the DBPR contractor lookup.
              </p>
            </div>
            <button
              onClick={() => setShowInfoModal(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}