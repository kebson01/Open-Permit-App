import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, MapPin, ClipboardList, Mail, Globe, UserCheck } from "lucide-react";

const WESTON_PERMITS = [
  "Roofing — Full Replacement",
  "Roofing — Partial Repair",
  "HVAC / A/C Replacement",
  "Window Replacement",
  "Door Replacement",
  "Screen Enclosure",
  "Fence / Gate",
  "New Pool",
  "Pool Renovation",
  "Electrical — Panel Upgrade",
  "Plumbing",
  "Residential Remodel",
  "Addition",
  "Driveway / Paving",
  "Generator",
  "Solar Panels",
  "Shed / Accessory Structure",
  "New Construction",
];

const ROLES = [
  { key: "homeowner", label: "🏠 Homeowner", desc: "Owner-builder or personal project" },
  { key: "contractor", label: "🔧 Contractor", desc: "Licensed contractor pulling permit" },
  { key: "private_provider", label: "🏛 Private Provider", desc: "FL Statute 553.791 provider" },
];

export default function GuideSetup({ currentUser, mode = "app", onCreated }) {
  const [selectedCity] = useState("Weston");
  const [permitType, setPermitType] = useState("");
  const [userRole, setUserRole] = useState("homeowner");
  const [guestEmail, setGuestEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [emailError, setEmailError] = useState("");

  const isWebMode = mode === "web";

  const handleStart = async () => {
    if (!permitType) return;

    if (isWebMode) {
      if (!guestEmail || !guestEmail.includes("@")) {
        setEmailError("Please enter a valid email address.");
        return;
      }
      setEmailError("");
    }

    setCreating(true);
    const email = isWebMode ? guestEmail : currentUser.email;
    const guide = await base44.entities.SubmissionGuide.create({
      user_email: email,
      user_role: userRole,
      city_name: selectedCity,
      permit_type_name: permitType,
      target_system: "manual",
      city_portal_url: "https://www.westonfl.org/Permits",
      phase: "application",
      overall_status: "in_progress",
      started_date: new Date().toISOString().slice(0, 10),
      questions_answered: 0,
      questions_prefilled: 0,
      questions_total: 0,
      is_guest: isWebMode,
    });
    setCreating(false);
    onCreated(guide, email);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">

      {/* Mode badge */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border ${
        isWebMode
          ? "bg-orange-50 border-orange-200 text-orange-700"
          : "bg-green-50 border-green-200 text-green-700"
      }`}>
        {isWebMode
          ? <><Globe className="w-3.5 h-3.5 shrink-0" /> <span>Guest Mode — no account needed. We'll guide you every step of the way.</span></>
          : <><UserCheck className="w-3.5 h-3.5 shrink-0" /> <span>App Mode — your profile data will be auto-filled where possible.</span></>
        }
      </div>

      {/* City */}
      <div>
        <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-blue-500" /> City
        </label>
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-800 font-medium">
          City of Weston, FL
          <span className="ml-auto text-xs text-blue-400">More cities coming soon</span>
        </div>
      </div>

      {/* Guest email (web mode only) */}
      {isWebMode && (
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-1.5 flex items-center gap-1.5">
            <Mail className="w-4 h-4 text-orange-500" /> Your Email
            <span className="text-red-500 ml-0.5">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-2">So we can save your progress and notify you when the permit is ready.</p>
          <input
            type="email"
            value={guestEmail}
            onChange={e => { setGuestEmail(e.target.value); setEmailError(""); }}
            placeholder="your@email.com"
            className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${
              emailError ? "border-red-300 focus:ring-red-200" : "border-gray-200 focus:ring-blue-200"
            }`}
          />
          {emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}
        </div>
      )}

      {/* Role */}
      <div>
        <label className="block text-sm font-bold text-gray-800 mb-2">I am a...</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {ROLES.map(r => (
            <button key={r.key} onClick={() => setUserRole(r.key)}
              className={`text-left p-3 rounded-xl border-2 transition-all ${
                userRole === r.key ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-200"
              }`}
            >
              <p className="font-semibold text-sm text-gray-800">{r.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{r.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Permit type */}
      <div>
        <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
          <ClipboardList className="w-4 h-4 text-blue-500" /> Permit Type
        </label>
        {isWebMode && (
          <p className="text-xs text-gray-500 mb-2">Select the type of work you're planning. Not sure? Choose the closest match — you can always contact the city.</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
          {WESTON_PERMITS.map(pt => (
            <button key={pt} onClick={() => setPermitType(pt)}
              className={`text-left px-3 py-2.5 rounded-xl border text-sm transition-all ${
                permitType === pt
                  ? "border-blue-500 bg-blue-50 text-blue-800 font-semibold"
                  : "border-gray-200 hover:border-blue-200 text-gray-700"
              }`}
            >{pt}</button>
          ))}
        </div>
      </div>

      <button
        onClick={handleStart}
        disabled={!permitType || creating}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50 transition-opacity hover:opacity-90"
        style={{ background: "#022A5B" }}
      >
        {creating && <Loader2 className="w-4 h-4 animate-spin" />}
        {creating ? "Creating..." : isWebMode ? "Start My Free Application Guide →" : "Start Application Guide →"}
      </button>

      <p className="text-xs text-gray-400 text-center">
        OpenPermit does not submit on your behalf. We help you prepare and guide you through the city's portal.
      </p>
    </div>
  );
}