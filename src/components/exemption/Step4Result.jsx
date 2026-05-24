import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { CheckCircle2, XCircle, AlertTriangle, Phone, ExternalLink, RefreshCw, Save, Loader2 } from "lucide-react";
import { calculateResult } from "@/lib/exemptionLogic";
import { Link } from "react-router-dom";
import ResultMayNeedPermit from "./ResultMayNeedPermit";
import ResultPermitRequired from "./ResultPermitRequired";

const PRIMARY = "#004ac6";

const VERDICT_CONFIG = {
  EXEMPT: {
    bg: "#ecfdf5", border: "#86efac", headingColor: "#047857",
    Icon: CheckCircle2, iconColor: "#059669",
    heading: "Good news — a permit is likely NOT required",
  },
  LIKELY_EXEMPT: {
    bg: "#f0fdfa", border: "#5eead4", headingColor: "#0d9488",
    Icon: CheckCircle2, iconColor: "#0d9488",
    heading: "This project may qualify for a permit exemption under HB 837",
  },
  MAY_NEED_PERMIT: {
    bg: "#fffbeb", border: "#fde68a", headingColor: "#92400e",
    Icon: AlertTriangle, iconColor: "#d97706",
    heading: "It depends — you should verify with the city",
  },
  PERMIT_REQUIRED: {
    bg: "#fef2f2", border: "#fca5a5", headingColor: "#b91c1c",
    Icon: XCircle, iconColor: "#dc2626",
    heading: "A permit IS required for this work",
  },
};

export default function Step4Result({ answers, currentUser, onReset }) {
  const [cityInfo, setCityInfo] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const { verdict, reason, code } = calculateResult(answers);
  const cfg = VERDICT_CONFIG[verdict];

  useEffect(() => {
    if (!answers.city) return;
    supabase.from("cities").select("name,building_department_phone,building_department_address,portal_url").eq("name", answers.city).single().then(({ data }) => setCityInfo(data));
  }, [answers.city]);

  // Delegate to detailed screens for these verdicts
  if (verdict === "MAY_NEED_PERMIT") return <ResultMayNeedPermit answers={answers} cityInfo={cityInfo} currentUser={currentUser} onReset={onReset} />;
  if (verdict === "PERMIT_REQUIRED") return <ResultPermitRequired answers={answers} cityInfo={cityInfo} currentUser={currentUser} onReset={onReset} />;

  const VerdictIcon = cfg.Icon;

  const handleSave = async () => {
    setSaving(true);
    await supabase.from("exemption_checks").insert({
      user_email: currentUser?.email || null,
      city_name: answers.city,
      property_type: answers.propertyType,
      work_type: answers.workType,
      project_cost: parseFloat(answers.projectCost) || null,
      answers: JSON.stringify(answers),
      result: verdict,
      result_reason: reason,
    });
    setSaving(false); setSaved(true);
  };

  return (
    <div>
      {/* Main verdict card */}
      <div style={{ background: cfg.bg, border: `2px solid ${cfg.border}`, borderRadius: 16, padding: "28px 24px", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <VerdictIcon className="w-10 h-10 flex-shrink-0" style={{ color: cfg.iconColor, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: cfg.headingColor, fontFamily: "'Manrope', sans-serif", marginBottom: 10, lineHeight: 1.3 }}>{cfg.heading}</h2>
            <p style={{ fontSize: 14, color: "#374151", fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.6, marginBottom: 12 }}>{reason}</p>
            {code && (
              <span style={{ display: "inline-block", background: "rgba(0,0,0,0.06)", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700, color: "#374151", fontFamily: "monospace" }}>📋 {code}</span>
            )}

            {verdict === "EXEMPT" && (
              <div style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, padding: "12px 14px", marginTop: 14 }}>
                <p style={{ fontSize: 12, color: "#374151", fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.5, margin: 0 }}>
                  <strong>Note:</strong> Even exempt work must comply with building codes. HOA approval may still be required. Verify with your city before starting work.
                </p>
              </div>
            )}

            {verdict === "LIKELY_EXEMPT" && (
              <div style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 10, padding: "12px 14px", marginTop: 14 }}>
                <p style={{ fontSize: 12, color: "#374151", fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.5, margin: 0 }}>
                  Verify with your city building department before starting work. This exemption does NOT apply to electrical, plumbing, mechanical, or structural work.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>



      {/* City contact card */}
      <div style={{ background: "white", border: "1px solid #e8eaf0", borderRadius: 14, padding: "18px 20px", marginBottom: 16, boxShadow: "0 1px 4px rgba(15,23,42,0.06)" }}>
        <h3 style={{ fontSize: 13, fontWeight: 800, color: "#191B23", fontFamily: "'Manrope', sans-serif", marginBottom: 10 }}>{answers.city} Building Department</h3>
        {cityInfo ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {cityInfo.building_department_phone && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Phone className="w-4 h-4" style={{ color: PRIMARY, flexShrink: 0 }} />
                <a href={`tel:${cityInfo.building_department_phone}`} style={{ fontSize: 13, color: PRIMARY, fontFamily: "'Plus Jakarta Sans', sans-serif", textDecoration: "none", fontWeight: 600 }}>{cityInfo.building_department_phone}</a>
              </div>
            )}
            {cityInfo.building_department_address && (
              <p style={{ fontSize: 12, color: "#6b7280", fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0 }}>{cityInfo.building_department_address}</p>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              {cityInfo.building_department_phone && (
                <a href={`tel:${cityInfo.building_department_phone}`}
                  style={{ flex: 1, display: "block", textAlign: "center", background: "#eff6ff", color: PRIMARY, border: "1px solid #dbeafe", borderRadius: 8, padding: "8px", fontWeight: 700, fontSize: 12, textDecoration: "none", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  📞 Call to Verify
                </a>
              )}
              {cityInfo.portal_url && (
                <a href={cityInfo.portal_url} target="_blank" rel="noopener noreferrer"
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, background: "#f3f4f6", color: "#374151", borderRadius: 8, padding: "8px", fontWeight: 700, fontSize: 12, textDecoration: "none", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  <ExternalLink className="w-3 h-3" /> Permit Portal
                </a>
              )}
            </div>
          </div>
        ) : (
          <p style={{ fontSize: 13, color: "#9ca3af", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Contact your local building department to verify this result before starting work.</p>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onReset}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 12, padding: "12px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <RefreshCw className="w-4 h-4" /> Check Another Project
        </button>
        {currentUser && !saved && (
          <button onClick={handleSave} disabled={saving}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "#f0f4ff", color: PRIMARY, border: "1px solid #dbeafe", borderRadius: 12, padding: "12px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Result
          </button>
        )}
        {saved && <p style={{ flex: 1, textAlign: "center", fontSize: 12, color: "#059669", fontFamily: "'Plus Jakarta Sans', sans-serif", padding: "12px" }}>✓ Saved!</p>}
      </div>
    </div>
  );
}