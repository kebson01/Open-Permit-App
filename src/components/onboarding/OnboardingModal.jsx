import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import * as db from "@/lib/db";
import { X, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";


const PRIMARY = "#004ac6";
const FONTS = { h: "'Manrope', system-ui, sans-serif", b: "'Plus Jakarta Sans', system-ui, sans-serif" };

const ROLES = [
  { key: "homeowner",        emoji: "🏠", label: "Homeowner",       desc: "Managing your own home or property" },
  { key: "contractor",       emoji: "🔧", label: "Contractor",       desc: "Licensed contractor pulling permits" },
  { key: "private_provider", emoji: "🏛", label: "Private Provider", desc: "FL Statute 553.791 provider" },
];

export default function OnboardingModal({ currentUser, onComplete, onSkip }) {
  const [role, setRole]     = useState("");
  const [saving, setSaving] = useState(false);

  const handleRoleNext = async () => {
    if (!role || saving) return;
    setSaving(true);

    // 1. Save to localStorage immediately — survives Supabase failure
    localStorage.setItem("op_role", role);

    // 2. Fire-and-forget Supabase write with 3s timeout — never blocks the user
    const timeout = new Promise(resolve => setTimeout(resolve, 3000));
    const write = (async () => {
      try {
        await base44.auth.updateMe({ role });
        await db.UserOnboarding.create({
          user_email: currentUser.email,
          role,
          started_date: new Date().toISOString().slice(0, 10),
          is_complete: true,
          completed_date: new Date().toISOString().slice(0, 10),
          current_step: "completed",
        });
      } catch {}
    })();

    await Promise.race([write, timeout]);
    setSaving(false);
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem("op_role", "skipped");
    onSkip();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-5" style={{ background: PRIMARY }}>
          <button onClick={handleSkip} className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
            <span className="text-xl">🏗️</span>
          </div>
          <h2 className="font-extrabold text-white text-xl" style={{ fontFamily: FONTS.h }}>Welcome to OpenPermit</h2>
          <p className="text-blue-200 text-sm mt-1" style={{ fontFamily: FONTS.b }}>Let's personalize your experience</p>
        </div>

        <div className="p-6">
          <p className="font-bold text-gray-800 mb-4" style={{ fontFamily: FONTS.h }}>What best describes you?</p>
          <div className="space-y-3 mb-6">
            {ROLES.map(r => (
              <button key={r.key} onClick={() => setRole(r.key)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                  role === r.key ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-200"
                }`}>
                <span className="text-2xl">{r.emoji}</span>
                <div>
                  <p className="font-bold text-sm text-gray-800" style={{ fontFamily: FONTS.b }}>{r.label}</p>
                  <p className="text-xs text-gray-400">{r.desc}</p>
                </div>
                {role === r.key && <CheckCircle2 className="w-4 h-4 text-blue-500 ml-auto shrink-0" />}
              </button>
            ))}
          </div>

          <button
            onClick={handleRoleNext}
            disabled={!role || saving}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50"
            style={{ background: PRIMARY, fontFamily: FONTS.h }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Get Started <ArrowRight className="w-4 h-4" /></>}
          </button>

          <button onClick={handleSkip} className="w-full text-center text-xs text-gray-400 mt-3 hover:text-gray-600 transition-colors">
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}