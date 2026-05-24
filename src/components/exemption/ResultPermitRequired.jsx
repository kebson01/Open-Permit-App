import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { XCircle, Save, Loader2, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { ContactCard } from "./ResultMayNeedPermit";

const PRIMARY = "#004ac6";

const RULES = {
  hvac: {
    subtext: "All HVAC installations and replacements require a mechanical permit in Florida — no exceptions.",
    rule: "Florida Building Code FBC-R M1401.1 requires a mechanical permit for all HVAC system installations and replacements. This applies regardless of whether it is a like-for-like replacement.",
    additional: "A Notice of Commencement (NOC) is also required if the job value exceeds $15,000.",
  },
  water_heater: {
    subtext: "All water heater replacements require a plumbing permit in Florida — including tankless.",
    rule: "Florida Building Code FBC-R P2801.1 requires a permit for all water heater installations. Many homeowners are surprised by this — it applies to every type: electric, gas, and tankless.",
    additional: "Permit includes a required inspection to verify proper installation, T&P relief valve, and expansion tank if needed.",
  },
  electrical: {
    subtext: "New electrical circuits, panel upgrades, and service changes always require an electrical permit.",
    rule: "Florida Building Code FBC-R E3401.1 requires permits for all new electrical wiring, panel upgrades, and service changes. Replacing an outlet or switch on an existing circuit may be exempt, but any new wiring or circuits are not.",
    additional: null,
  },
  roof: {
    subtext: "Full roof replacements always require a building permit and inspection.",
    rule: "Weston and all Broward County cities require a permit for full roof replacement. This includes a required dry-in inspection and final inspection. Florida Product Approval (NOA) documentation is also required for all roofing materials.",
    additional: null,
  },
  solar: {
    subtext: "Solar panel systems require both an electrical permit and a structural permit.",
    rule: "Solar installations require a building permit (structural) and an electrical permit. All solar panels must have a Florida Product Approval. FPL/utility interconnection approval is also required before final inspection.",
    additional: null,
  },
  generator: {
    subtext: "Standby generators require an electrical permit and may require a gas permit.",
    rule: "All standby generator installations require an electrical permit. If connected to natural gas or propane, a separate gas piping permit is required. Generators must meet setback requirements from property lines and openings.",
    additional: null,
  },
  pool_spa: {
    subtext: "All in-ground pools and above-ground pools over 24 inches deep require a permit.",
    rule: "Florida law (FS 515.25) requires a permit for all residential swimming pools. A pool safety barrier (fence, enclosure, or safety cover) must also be installed before final inspection. Pool barrier inspections are separate from the pool permit.",
    additional: "Pool permits in Weston include: structural, electrical, plumbing, and mechanical sub-permits.",
  },
  hurricane_shutters: {
    subtext: "All hurricane shutter and impact protection installations require a permit.",
    rule: "Broward County and all its cities require permits for all hurricane protection installations. All products must have a Florida Product Approval (NOA). A final inspection is required to verify proper installation.",
    additional: null,
  },
  room_addition: {
    subtext: "Room additions and structural changes always require permits.",
    rule: "Any expansion of living space requires a building permit. Room additions typically require: building, electrical, plumbing (if applicable), and mechanical sub-permits. Engineered plans signed and sealed by a Florida licensed engineer are usually required.",
    additional: null,
  },
  structural: {
    subtext: "Structural repairs and modifications always require a building permit.",
    rule: "Any work affecting the structural integrity of a building requires a permit and engineered drawings signed and sealed by a Florida-licensed engineer.",
    additional: null,
  },
  windows_doors: {
    subtext: "Impact-rated windows and doors require a permit and Florida Product Approval.",
    rule: "All window and door replacements with impact-rated products require a building permit in Broward County. A Florida Product Approval (NOA) must be submitted with the application. A final inspection is required to verify proper installation.",
    additional: null,
  },
};

const FEE_ESTIMATES = {
  hvac:             "Flat fee: $205.04 + Tech/Admin: $127.00 = Total: $332.04",
  water_heater:     "Flat fee: $205.04 + Tech/Admin: $127.00 = Total: $332.04",
  fence_gate:       "Base: $205.04 + per linear foot (varies) + Tech/Admin: $127.00",
  pool_spa:         "Flat fee: $1,145.83 + Tech/Admin: $127.00 = Total: $1,272.83",
  generator:        "Flat fee: $350.00 + Tech/Admin: $127.00 = Total: $477.00",
  solar:            "Base: $119.11 + 1.55% of job value + Tech/Admin: $127.00",
  roof:             "Base: $119.11 + 1.55% of job value + Tech/Admin: $127.00",
  windows_doors:    "Base: $119.11 + 1.55% of job value + Tech/Admin: $127.00",
  hurricane_shutters: "Base: $115.79 + per opening (varies) + Tech/Admin: $127.00",
  room_addition:    "Base: $119.11 + 1.55% of job value + Tech/Admin: $127.00",
};

const CONSEQUENCES = [
  { icon: "🚫", text: "Double fees — Weston and all Broward cities charge 100% penalty fee when unpermitted work is discovered" },
  { icon: "🛑", text: "Stop-work order — all work must halt immediately until permit is obtained" },
  { icon: "🔨", text: "Required demolition — city may require you to uncover or remove completed work for inspection" },
  { icon: "🏠", text: "Cannot sell your home — unpermitted work must be disclosed and permitted before sale" },
  { icon: "💰", text: "Insurance denied — homeowner's insurance typically excludes damage caused by unpermitted work" },
  { icon: "⚖️", text: "Legal liability — if unpermitted work causes injury, homeowner bears full legal responsibility" },
];

export default function ResultPermitRequired({ answers, cityInfo, currentUser, onReset }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();

  const ruleKey = answers.workType;
  const ruleInfo = RULES[ruleKey] || {
    subtext: "This type of work requires a building permit.",
    rule: "Please verify with your local building department.",
    additional: null,
  };
  const feeEstimate = FEE_ESTIMATES[ruleKey];
  const isWeston = answers.city === "Weston";
  const phone = cityInfo?.building_department_phone;
  const showOwnerBuilder = answers.propertyType === "single_family" && answers.isPrimaryResidence === "Yes";

  const handleSave = async () => {
    setSaving(true);
    await supabase.from("exemption_checks").insert({
      user_email: currentUser?.email || null,
      city_name: answers.city,
      property_type: answers.propertyType,
      work_type: answers.workType,
      project_cost: parseFloat(answers.projectCost) || null,
      answers: JSON.stringify(answers),
      result: "PERMIT_REQUIRED",
      result_reason: ruleInfo.subtext,
    });
    setSaving(false); setSaved(true);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Header card */}
      <div style={{ background: "#FFF0F0", borderLeft: "6px solid #DC2626", borderRadius: 16, padding: "24px 22px", display: "flex", alignItems: "flex-start", gap: 16, border: "1px solid #fca5a5" }}>
        <XCircle className="w-10 h-10 flex-shrink-0" style={{ color: "#DC2626", marginTop: 2 }} />
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#B91C1C", fontFamily: "'Manrope', sans-serif", marginBottom: 8, lineHeight: 1.25 }}>
            A permit IS required for this work
          </h2>
          <p style={{ fontSize: 14, color: "#7F1D1D", fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.65, margin: 0 }}>
            {ruleInfo.subtext}
          </p>
        </div>
      </div>

      {/* Rule explanation */}
      <div style={{ background: "white", border: "1px solid #e8eaf0", borderRadius: 16, padding: "20px 22px", boxShadow: "0 1px 6px rgba(15,23,42,0.06)" }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: "#191B23", fontFamily: "'Manrope', sans-serif", marginBottom: 12 }}>Why a permit is required</h3>
        <p style={{ fontSize: 13, color: "#374151", fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.7, marginBottom: ruleInfo.additional ? 12 : 0 }}>
          {ruleInfo.rule}
        </p>
        {ruleInfo.additional && (
          <div style={{ background: "#EFF4FF", borderRadius: 10, padding: "12px 14px", borderLeft: "3px solid #3b82f6" }}>
            <p style={{ fontSize: 12, color: "#1e40af", fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.6, margin: 0 }}>
              💡 {ruleInfo.additional}
            </p>
          </div>
        )}
      </div>

      {/* Fee estimate */}
      {(feeEstimate || !isWeston) && (
        <div style={{ background: "white", border: "1px solid #e8eaf0", borderLeft: "4px solid #004ac6", borderRadius: 14, padding: "18px 20px", boxShadow: "0 1px 6px rgba(15,23,42,0.06)" }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: "#191B23", fontFamily: "'Manrope', sans-serif", marginBottom: 10 }}>
            Estimated Permit Fee — {answers.city}
          </h3>
          {isWeston && feeEstimate ? (
            <>
              <p style={{ fontSize: 14, color: PRIMARY, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 8 }}>{feeEstimate}</p>
              <p style={{ fontSize: 11, color: "#9ca3af", fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0 }}>
                Fees are estimates based on current Weston fee schedule. Final fees determined at submission.
              </p>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              <p style={{ fontSize: 13, color: "#374151", fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0 }}>
                Use our Fee Calculator for an exact estimate for {answers.city}.
              </p>
              <Link to="/FeeCalculator"
                style={{ display: "flex", alignItems: "center", gap: 5, background: "#f0f4ff", color: PRIMARY, border: "1px solid #dbeafe", borderRadius: 8, padding: "7px 14px", fontWeight: 700, fontSize: 12, textDecoration: "none", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Fee Calculator <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Owner-builder box */}
      {showOwnerBuilder && (
        <div style={{ background: "#E6F5F2", border: "1px solid #a7f3d0", borderRadius: 14, padding: "18px 20px" }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: "#006A61", fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 8 }}>
            💡 Did you know? As a homeowner, you may be able to pull your own permit without hiring a contractor.
          </p>
          <p style={{ fontSize: 13, color: "#065f46", fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.65, marginBottom: 8 }}>
            Under <strong>Florida Statute 489.103(7)</strong>, owners of single-family homes can act as their own contractor for their primary residence. You must personally appear at the building department and sign an Owner-Builder Disclosure Statement.
          </p>
          <p style={{ fontSize: 12, color: "#047857", fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.6, margin: 0 }}>
            <strong>Note:</strong> This exception applies to construction work — not electrical, plumbing, or mechanical which require licensed contractors in most cases.
          </p>
        </div>
      )}

      {/* Consequences */}
      <div style={{ background: "#FFF0F0", border: "1px solid #fca5a5", borderRadius: 14, padding: "18px 20px" }}>
        <p style={{ fontSize: 13, fontWeight: 800, color: "#B91C1C", fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 12 }}>What happens if you skip the permit?</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {CONSEQUENCES.map((c, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{ fontSize: 15, flexShrink: 0, lineHeight: 1.5 }}>{c.icon}</span>
              <span style={{ fontSize: 13, color: "#7f1d1d", fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.55 }}>{c.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Primary CTA */}
      <Link to="/ApplyForPermit"
        style={{ display: "block", textAlign: "center", background: PRIMARY, color: "white", padding: "15px", borderRadius: 14, fontWeight: 800, fontSize: 16, textDecoration: "none", fontFamily: "'Manrope', sans-serif", letterSpacing: "-0.01em" }}>
        Start My Permit Application →
      </Link>

      {/* Secondary buttons */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Link to="/FeeCalculator"
          style={{ flex: 1, minWidth: 130, display: "block", textAlign: "center", background: "white", color: PRIMARY, border: `1px solid #dbeafe`, padding: "11px", borderRadius: 10, fontWeight: 700, fontSize: 13, textDecoration: "none", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Calculate Exact Fee
        </Link>
        <button onClick={() => alert("Contractor directory coming soon!")}
          style={{ flex: 1, minWidth: 130, background: "white", color: "#374151", border: "1px solid #e0e4f0", borderRadius: 10, padding: "11px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Find a Contractor
        </button>
        <button onClick={onReset}
          style={{ flex: 1, minWidth: 130, background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 10, padding: "11px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Check Another Project
        </button>
      </div>

      {/* City contact */}
      <ContactCard cityInfo={cityInfo} city={answers.city} />

      {/* Save */}
      {currentUser && !saved && (
        <button onClick={handleSave} disabled={saving}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "#f0f4ff", color: PRIMARY, border: "1px solid #dbeafe", borderRadius: 12, padding: "11px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Result
        </button>
      )}
      {saved && <p style={{ textAlign: "center", fontSize: 12, color: "#059669", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>✓ Saved!</p>}
    </div>
  );
}