import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useCities } from "@/hooks/useCities";
import { Loader2, MapPin, ClipboardList } from "lucide-react";

// Weston permit types that are supported
const WESTON_PERMITS = [
  "Roofing — Full Replacement",
  "Roofing — Partial Repair",
  "HVAC / A/C Replacement",
  "Window Replacement",
  "Door Replacement",
  "Fence / Gate",
  "Pool & Spa",
  "Electrical — Panel Upgrade",
  "Plumbing",
  "Residential Remodel",
  "Addition",
  "Driveway / Paving",
  "Generator",
  "Solar Panels",
];

export default function GuideSetup({ currentUser, onCreated }) {
  const [selectedCity, setSelectedCity] = useState("Weston");
  const [permitType, setPermitType] = useState("");
  const [userRole, setUserRole] = useState("homeowner");
  const [creating, setCreating] = useState(false);

  const handleStart = async () => {
    if (!permitType) return;
    setCreating(true);
    const guide = await base44.entities.SubmissionGuide.create({
      user_email: currentUser.email,
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
    });
    setCreating(false);
    onCreated(guide);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
      {/* City — currently only Weston */}
      <div>
        <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-blue-500" /> City
        </label>
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-800 font-medium">
          City of Weston
          <span className="ml-auto text-xs text-blue-500">More cities coming soon</span>
        </div>
      </div>

      {/* Role */}
      <div>
        <label className="block text-sm font-bold text-gray-800 mb-2">I am a...</label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: "homeowner", label: "🏠 Homeowner", desc: "Owner-builder or personal project" },
            { key: "contractor", label: "🔧 Contractor", desc: "Licensed contractor pulling permit" },
          ].map(r => (
            <button
              key={r.key}
              onClick={() => setUserRole(r.key)}
              className={`text-left p-3 rounded-xl border-2 transition-all ${
                userRole === r.key
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-blue-200"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
          {WESTON_PERMITS.map(pt => (
            <button
              key={pt}
              onClick={() => setPermitType(pt)}
              className={`text-left px-3 py-2.5 rounded-xl border text-sm transition-all ${
                permitType === pt
                  ? "border-blue-500 bg-blue-50 text-blue-800 font-semibold"
                  : "border-gray-200 hover:border-blue-200 text-gray-700"
              }`}
            >
              {pt}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleStart}
        disabled={!permitType || creating}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50 transition-opacity hover:opacity-90"
        style={{ background: "#022A5B" }}
      >
        {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {creating ? "Creating..." : "Start Application Guide →"}
      </button>

      <p className="text-xs text-gray-400 text-center">
        OpenPermit does not submit on your behalf. We help you prepare and guide you through the city's portal.
      </p>
    </div>
  );
}