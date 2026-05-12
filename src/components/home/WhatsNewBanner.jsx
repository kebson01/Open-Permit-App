import React, { useState } from "react";
import { X, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const CHANGES = [
  { emoji: "🏠", title: "HB 803 — Permit Exemptions", desc: "Projects under $7,500 on single-family homes may no longer require a permit (effective July 1, 2026).", link: "/ExemptionChecker" },
  { emoji: "🏠", title: "Roof Partial Repair Rule", desc: "Only the damaged section may need repair if the rest of the roof meets 2007 FBC or newer.", link: null },
  { emoji: "⚡", title: "Private Providers (HB 683)", desc: "You can now use a licensed private provider to speed up plans review to 3–5 business days.", link: null },
  { emoji: "📅", title: "Permit Expiration — 180 Days", desc: "Permits must remain active. No inspections within 180 days may result in expiration.", link: null },
];

const DISMISSED_KEY = "op_whats_new_dismissed_2026";

export default function WhatsNewBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(DISMISSED_KEY) === "1"; } catch { return false; }
  });

  if (dismissed) return null;

  const dismiss = () => {
    try { localStorage.setItem(DISMISSED_KEY, "1"); } catch {}
    setDismissed(true);
  };

  return (
    <div className="mx-5 mt-6 max-w-lg md:max-w-2xl md:mx-auto rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-blue-200">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-blue-900">📢 2025–2026 Florida Law Changes</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-200 text-blue-800 font-semibold">New</span>
        </div>
        <button onClick={dismiss} className="text-blue-400 hover:text-blue-700 transition-colors p-1 rounded-lg hover:bg-blue-100">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4 grid sm:grid-cols-2 gap-3">
        {CHANGES.map((c, i) => (
          <div key={i} className="bg-white/80 rounded-xl p-3 border border-blue-100">
            <p className="text-xs font-bold text-blue-900 mb-1">{c.emoji} {c.title}</p>
            <p className="text-xs text-gray-600 leading-snug">{c.desc}</p>
            {c.link && (
              <Link to={c.link} className="text-xs font-semibold text-blue-600 underline mt-1.5 inline-block hover:text-blue-800">
                Check yours →
              </Link>
            )}
          </div>
        ))}
      </div>
      <div className="px-5 pb-4">
        <Link
          to="/ExemptionChecker"
          className="inline-flex items-center gap-2 text-xs font-semibold text-blue-700 hover:text-blue-900"
        >
          Check if your project qualifies for the new exemption <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}