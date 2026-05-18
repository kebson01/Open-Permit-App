import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowRight, CheckCircle2, XCircle, AlertTriangle, Info, ChevronLeft } from "lucide-react";

const WORK_TYPES = [
  { value: "electrical",   label: "Electrical",        alwaysRequired: true,  reason: "Electrical work always requires a permit regardless of project value, per Florida Electrical Code." },
  { value: "plumbing",     label: "Plumbing",           alwaysRequired: true,  reason: "Plumbing work always requires a permit per Florida Plumbing Code." },
  { value: "hvac",         label: "HVAC / Mechanical",  alwaysRequired: true,  reason: "HVAC and mechanical work always requires a permit per Florida Mechanical Code." },
  { value: "gas",          label: "Gas Systems",        alwaysRequired: true,  reason: "Gas system work always requires a permit due to life-safety requirements." },
  { value: "structural",   label: "Building / Structural", alwaysRequired: true, reason: "Structural and building work always requires a permit regardless of cost." },
  { value: "roofing",      label: "Roofing (partial repair)", alwaysRequired: false },
  { value: "fence",        label: "Fence / Gate",       alwaysRequired: false },
  { value: "pool",         label: "Pool / Spa",         alwaysRequired: false },
  { value: "other",        label: "Other Minor Work",   alwaysRequired: false },
];

const THRESHOLD = 7500;

function getResult(workType, cost, floodZone, isSingleFamily) {
  const type = WORK_TYPES.find(w => w.value === workType);
  if (!type) return null;

  if (type.alwaysRequired) {
    return { status: "required", reason: type.reason };
  }

  if (floodZone === "yes") {
    return { status: "verify", reason: "Work in a designated flood hazard area is excluded from the HB 803 exemption. Contact your local building department to confirm." };
  }

  if (floodZone === "not_sure") {
    return { status: "verify", reason: "You're unsure whether the property is in a flood hazard area. Properties in flood zones are excluded from the HB 803 exemption — please verify before assuming you're exempt." };
  }

  if (isSingleFamily === "no") {
    return { status: "required", reason: "The HB 803 exemption applies only to single-family homes. Multi-family or commercial properties must obtain permits regardless of cost." };
  }

  const numCost = parseFloat(cost) || 0;
  if (numCost === 0) {
    return { status: "verify", reason: "Please enter an estimated project cost to determine exemption status." };
  }

  if (numCost < THRESHOLD) {
    return { status: "exempt", workType, cost: numCost };
  }

  return { status: "required", reason: `Projects valued at $${numCost.toLocaleString()} meet or exceed the $7,500 threshold. HB 803 only exempts projects under $7,500.` };
}

export default function ExemptionChecker() {
  const [workType, setWorkType] = useState("");
  const [cost, setCost] = useState("");
  const [floodZone, setFloodZone] = useState("");
  const [isSingleFamily, setIsSingleFamily] = useState("");
  const [result, setResult] = useState(null);
  const [showHB803Info, setShowHB803Info] = useState(false);

  const canCheck = workType && floodZone && isSingleFamily;

  const handleCheck = () => {
    const r = getResult(workType, cost, floodZone, isSingleFamily);
    setResult(r);
    setTimeout(() => {
      document.getElementById("result-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const selectedType = WORK_TYPES.find(w => w.value === workType);

  return (
    <div className="min-h-screen pb-24 md:pb-8" style={{ backgroundColor: "#f9f9fc" }}>
      {/* Hero */}
      <div className="px-5 pt-8 pb-7" style={{ background: "#022A5B" }}>
        <div className="max-w-2xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 mb-4 transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" /> Back to Home
          </Link>
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.45)" }}>HB 803 Exemption Checker</p>
          <h1 className="font-bold text-white leading-tight mb-2" style={{ fontSize: "clamp(22px, 4vw, 30px)" }}>Do You Need a Permit?</h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.55)", maxWidth: 460 }}>
            Answer 4 quick questions to see if your project qualifies for the new Florida permit exemption.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* New Law Banner */}
        <div className="mb-6 p-4 rounded-2xl flex items-start gap-3" style={{ background: "#EBF5FF", border: "1px solid #60A9DE" }}>
          <span className="text-xl flex-shrink-0 mt-0.5">🆕</span>
          <div>
            <p className="text-sm font-bold mb-1" style={{ color: "#022A5B" }}>New Florida Law: HB 803 — Effective July 1, 2026</p>
            <p className="text-xs leading-relaxed" style={{ color: "#025799" }}>
              Starting July 1, 2026, some home improvement projects under $7,500 on single-family homes may not require a permit. Check if yours qualifies below.
            </p>
            <button
              onClick={() => setShowHB803Info(!showHB803Info)}
              className="text-xs font-semibold underline mt-1.5" style={{ color: "#025799" }}
            >
              {showHB803Info ? "Hide details" : "Learn more about HB 803 →"}
            </button>
            {showHB803Info && (
              <div className="mt-3 text-xs leading-relaxed space-y-1.5 border-t pt-3" style={{ color: "#025799", borderColor: "#60A9DE" }}>
                <p><strong>What is HB 803?</strong> Florida House Bill 803 creates a new class of permit exemptions for certain low-value repairs on single-family residential properties, effective July 1, 2026.</p>
                <p><strong>Who qualifies?</strong> Owner-occupants of single-family homes doing repairs or replacements valued under $7,500 that are not in flood hazard areas.</p>
                <p><strong>What's excluded?</strong> Electrical, plumbing, HVAC/mechanical, gas systems, structural work, work in flood zones, and multi-family/commercial properties are all excluded.</p>
                <p><strong>Still recommended:</strong> Even if exempt, keep records of all work performed. HOA rules may still require approval.</p>
              </div>
            )}
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
          {/* Q1: Work type */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-3">
              1. What type of work are you doing?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {WORK_TYPES.map(type => (
                <button
                  key={type.value}
                  onClick={() => { setWorkType(type.value); setResult(null); }}
                  className={`text-left px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium flex items-center gap-2 ${
                    workType === type.value
                      ? "border-[#60A9DE] bg-[#EBF5FF] text-[#022A5B]"
                      : "border-gray-200 text-gray-700 hover:border-[#60A9DE]"
                  }`}
                >
                  {type.alwaysRequired && (
                    <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" title="Always requires permit" />
                  )}
                  {!type.alwaysRequired && (
                    <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" title="May be exempt" />
                  )}
                  {type.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">🔴 Red = always requires permit &nbsp; 🟢 Green = may qualify for exemption</p>
          </div>

          {/* Q2: Cost */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2">
              2. Estimated project cost?
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                type="number"
                min="0"
                placeholder="e.g. 3500"
                value={cost}
                onChange={e => { setCost(e.target.value); setResult(null); }}
                className="w-full pl-7 pr-4 h-11 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50"
              />
            </div>
            {cost && parseFloat(cost) >= THRESHOLD && (
              <p className="text-xs text-amber-600 mt-1.5 font-medium">⚠️ Projects at or above $7,500 require a permit under HB 803.</p>
            )}
          </div>

          {/* Q3: Flood zone */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2">
              3. Is the property in a flood hazard area?
            </label>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: "no", label: "No" },
                { value: "yes", label: "Yes" },
                { value: "not_sure", label: "Not Sure" },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setFloodZone(opt.value); setResult(null); }}
                  className={`px-5 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                    floodZone === opt.value
                      ? "border-[#60A9DE] bg-[#EBF5FF] text-[#022A5B]"
                      : "border-gray-200 text-gray-600 hover:border-[#60A9DE]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1.5">You can check flood zone status at <a href="https://msc.fema.gov" target="_blank" rel="noopener noreferrer" className="underline">msc.fema.gov</a></p>
          </div>

          {/* Q4: Single-family */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2">
              4. Is this a single-family home?
            </label>
            <div className="flex gap-2">
              {[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No (condo, duplex, commercial, etc.)" },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setIsSingleFamily(opt.value); setResult(null); }}
                  className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                    isSingleFamily === opt.value
                      ? "border-[#60A9DE] bg-[#EBF5FF] text-[#022A5B]"
                      : "border-gray-200 text-gray-600 hover:border-[#60A9DE]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleCheck}
            disabled={!canCheck}
            className="w-full h-12 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ background: canCheck ? "#025799" : "#9ca3af" }}
          >
            Check Exemption Status
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Result Card */}
        {result && (
          <div id="result-card" className="mt-6">
            {result.status === "exempt" && (
              <div className="rounded-2xl border-2 p-6" style={{ borderColor: "#60A9DE", background: "#EBF5FF" }}>
                <div className="flex items-start gap-3 mb-4">
                  <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: "#025799" }} />
                  <div>
                    <h3 className="font-bold text-base mb-1" style={{ color: "#022A5B" }}>✓ This project may not require a permit</h3>
                    <p className="text-sm leading-relaxed" style={{ color: "#025799" }}>
                      Under Florida HB 803 (effective July 1, 2026), {selectedType?.label?.toLowerCase()} work valued under $7,500 on single-family homes outside flood zones is exempt from the permit requirement.
                    </p>
                  </div>
                </div>
                <div className="bg-white/70 rounded-xl p-4 mb-4" style={{ border: "1px solid #60A9DE" }}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#022A5B" }}>📋 We Still Recommend</p>
                  <ul className="text-xs space-y-1.5" style={{ color: "#025799" }}>
                    <li>• Keep records of all work performed (invoices, contractor info)</li>
                    <li>• Check if your HOA has its own approval requirements</li>
                    <li>• Verify the law is in effect — HB 803 is effective July 1, 2026</li>
                    <li>• Contact your building department if you have any doubts</li>
                  </ul>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    to={createPageUrl("FeeCalculator")}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-semibold text-sm transition-colors" style={{ borderColor: "#60A9DE", color: "#025799" }}
                  >
                    Continue to Fee Estimate Anyway
                  </Link>
                  <button
                    onClick={() => setShowHB803Info(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white font-semibold text-sm transition-colors" style={{ background: "#025799" }}
                  >
                    Learn More About HB 803
                  </button>
                </div>
              </div>
            )}

            {result.status === "required" && (
              <div className="rounded-2xl border-2 p-6" style={{ borderColor: "#025799", background: "#EBF5FF" }}>
                <div className="flex items-start gap-3 mb-4">
                  <XCircle className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: "#025799" }} />
                  <div>
                    <h3 className="font-bold text-base mb-1" style={{ color: "#022A5B" }}>A permit is required for this project</h3>
                    <p className="text-sm leading-relaxed" style={{ color: "#025799" }}>{result.reason}</p>
                  </div>
                </div>
                <div className="bg-white/70 rounded-xl p-4 mb-4" style={{ border: "1px solid #60A9DE" }}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#022A5B" }}>Next Steps</p>
                  <ul className="text-xs space-y-1.5" style={{ color: "#025799" }}>
                    <li>• Use the Visual Permit Guide to identify the exact permit type</li>
                    <li>• Use the Fee Calculator to estimate your permit costs</li>
                    <li>• Gather required documents before visiting the building department</li>
                  </ul>
                </div>
                <Link
                  to={createPageUrl("PermitGuide")}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white font-bold text-sm transition-colors" style={{ background: "#025799" }}
                >
                  Find the Right Permit
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {result.status === "verify" && (
              <div className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-6">
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-amber-900 text-base mb-1">Please verify with your local building department</h3>
                    <p className="text-sm text-amber-800 leading-relaxed">{result.reason}</p>
                  </div>
                </div>
                <div className="bg-white/70 rounded-xl p-4 mb-4 border border-amber-200">
                  <p className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2">What to ask your building department</p>
                  <ul className="text-xs text-amber-800 space-y-1.5">
                    <li>• "Is my property in a FEMA Special Flood Hazard Area?"</li>
                    <li>• "Does HB 803 apply to this type of work at this address?"</li>
                    <li>• "Do I need a permit for {selectedType?.label?.toLowerCase() || "this work"} under $7,500?"</li>
                  </ul>
                </div>
                <a
                  href="https://www.broward.org/Building"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-600 text-white font-bold text-sm hover:bg-amber-700 transition-colors"
                >
                  Contact Building Department
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}