import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Phone, ExternalLink, RefreshCw, Save, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

const PRIMARY = "#004ac6";

const CITY_RULES = {
  Weston: [
    { icon: "✗", text: "Fences of ANY height require a building permit", source: "Weston Code of Ordinances", color: "#b91c1c" },
    { icon: "✗", text: "Accessory structures 100 sq ft or larger require a permit", color: "#b91c1c" },
    { icon: "✓", text: "Structures under 100 sq ft with no utilities are exempt", color: "#059669" },
    { icon: "✓", text: "Cosmetic work (paint, flooring, tile) is exempt", color: "#059669" },
  ],
  Hollywood: [
    { icon: "⚠", text: "Fences may require a permit — verify with building department", color: "#d97706" },
    { icon: "✓", text: "Accessory structures under 150 sq ft with no utilities are generally exempt", color: "#059669" },
    { icon: "✓", text: "Cosmetic work is exempt", color: "#059669" },
  ],
  "Coral Springs": [
    { icon: "✗", text: "Fences require a permit regardless of height", color: "#b91c1c" },
    { icon: "✗", text: "Accessory structures 100 sq ft or larger require a permit", color: "#b91c1c" },
    { icon: "✓", text: "Structures under 100 sq ft with no utilities are exempt", color: "#059669" },
  ],
  "Cooper City": [
    { icon: "✗", text: "Fences require a permit", color: "#b91c1c" },
    { icon: "⚠", text: "All permit applications must be notarized before submission", color: "#d97706" },
    { icon: "✓", text: "Accessory structures under 150 sq ft with no utilities are generally exempt", color: "#059669" },
  ],
  "Fort Lauderdale": [
    { icon: "⚠", text: "Verify all work through LauderBuild at lauderbuild.fortlauderdale.gov", color: "#d97706" },
    { icon: "✓", text: "Accessory structures under 150 sq ft with no utilities are generally exempt", color: "#059669" },
  ],
  Sunrise: [
    { icon: "⚠", text: "Fences may require a permit — verify with building department", color: "#d97706" },
    { icon: "✓", text: "Accessory structures under 150 sq ft with no utilities are generally exempt", color: "#059669" },
  ],
};

const FENCE_STRICT = ["Weston", "Coral Springs", "Cooper City"];

function getRuleRows(answers) {
  const { workType, city, shedSqft, roofWorkType } = answers;
  const sqft = parseFloat(shedSqft) || 0;
  const rows = [];

  if (workType === "fence_gate") {
    if (FENCE_STRICT.includes(city)) {
      rows.push({
        label: "Fence (any height)",
        fbc: { text: "Exempt under FBC-R R105.2", ok: true },
        city: { text: `PERMIT REQUIRED — ${city} requires permits for all fences`, ok: false },
      });
    } else {
      rows.push({
        label: "Fence",
        fbc: { text: "Generally exempt ≤ 6 ft", ok: true },
        city: { text: "Verify with building department — may require permit", ok: null },
      });
    }
  }

  if (workType === "shed_pergola") {
    if (sqft >= 100 && (city === "Weston" || city === "Coral Springs")) {
      rows.push({
        label: `Shed / Accessory Structure (${sqft} sq ft)`,
        fbc: { text: "Exempt under FBC-R R105.2 if no utilities", ok: true },
        city: { text: `PERMIT REQUIRED — ${city} requires permits for structures ≥ 100 sq ft`, ok: false },
      });
    } else if (sqft >= 100 && sqft < 150) {
      rows.push({
        label: `Shed / Accessory Structure (${sqft} sq ft)`,
        fbc: { text: "Exempt under FBC-R R105.2 if no utilities", ok: true },
        city: { text: "Verify with city — approaching 150 sq ft FBC threshold", ok: null },
      });
    }
  }

  if (workType === "roof" && roofWorkType === "partial_repair") {
    rows.push({
      label: "Partial Roof Repair",
      fbc: { text: "May be exempt if under 25% of roof area", ok: null },
      city: { text: "All cities: verify with building department before proceeding", ok: null },
    });
  }

  return rows;
}

const CONSEQUENCES = [
  "Double permit fees (100% penalty) when discovered",
  "Stop-work order until permit obtained",
  "Required to uncover completed work for inspection",
  "Difficulty selling your home — unpermitted work shows up in title search",
  "Homeowner's insurance may not cover damage from unpermitted work",
];

export default function ResultMayNeedPermit({ answers, cityInfo, currentUser, onReset }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const ruleRows = getRuleRows(answers);
  const cityRules = CITY_RULES[answers.city] || [];
  const phone = cityInfo?.building_department_phone;

  const handleSave = async () => {
    setSaving(true);
    await supabase.from("exemption_checks").insert({
      user_email: currentUser?.email || null,
      city_name: answers.city,
      property_type: answers.propertyType,
      work_type: answers.workType,
      project_cost: parseFloat(answers.projectCost) || null,
      answers: JSON.stringify(answers),
      result: "MAY_NEED_PERMIT",
      result_reason: "Work type and city combination requires verification",
    });
    setSaving(false); setSaved(true);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Header card */}
      <div style={{ background: "#FDF3E0", border: "4px solid #F59E0B", borderLeft: "6px solid #F59E0B", borderRadius: 16, padding: "24px 22px", display: "flex", alignItems: "flex-start", gap: 16 }}>
        <AlertTriangle className="w-10 h-10 flex-shrink-0" style={{ color: "#D97706", marginTop: 2 }} />
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#92400E", fontFamily: "'Manrope', sans-serif", marginBottom: 8, lineHeight: 1.25 }}>
            It depends — verify before you start
          </h2>
          <p style={{ fontSize: 14, color: "#78350F", fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.65, margin: 0 }}>
            Florida Building Code may allow this work without a permit, but your city has stricter requirements that could apply.
          </p>
        </div>
      </div>

      {/* Rule comparison table */}
      {ruleRows.length > 0 && (
        <div style={{ background: "white", border: "1px solid #e8eaf0", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 6px rgba(15,23,42,0.07)" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0f0f0", background: "#fafafa" }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: "#191B23", fontFamily: "'Manrope', sans-serif", margin: 0 }}>Rule Breakdown</h3>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8f9ff" }}>
                  {["Work", "Florida Building Code", `${answers.city} Rule`].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b7280", fontFamily: "'Plus Jakarta Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid #f0f0f0", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ruleRows.map((row, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f5f5f5" }}>
                    <td style={{ padding: "12px 14px", fontSize: 12, fontWeight: 600, color: "#374151", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{row.label}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <RuleCell ok={row.fbc.ok} text={row.fbc.text} />
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <RuleCell ok={row.city.ok} text={row.city.text} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Code citation */}
      <div style={{ background: "#EFF4FF", border: "1px solid #c7d7fd", borderRadius: 14, padding: "18px 20px" }}>
        <p style={{ fontSize: 12, fontWeight: 800, color: "#1e40af", fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 8 }}>📖 Florida Building Code Reference</p>
        <p style={{ fontSize: 12, color: "#1e3a8a", fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.7, marginBottom: 8 }}>
          <strong>FBC-R R105.2</strong> — Work Exempt from Permit states that certain work is exempt at the state level. However, Section R105.2 also provides:
        </p>
        <blockquote style={{ borderLeft: "3px solid #3b82f6", marginLeft: 0, paddingLeft: 14, fontFamily: "monospace", fontSize: 11, color: "#1e3a8a", lineHeight: 1.7, margin: "0 0 8px" }}>
          "Permits shall not be required for the following... except as otherwise required or allowed by the Authority Having Jurisdiction (AHJ)."
        </blockquote>
        <p style={{ fontSize: 12, color: "#1e3a8a", fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.65, margin: 0 }}>
          This means your city (the AHJ) <strong>can and does require permits</strong> for work that the state code would otherwise exempt.
        </p>
      </div>

      {/* City-specific rules */}
      {cityRules.length > 0 && (
        <div style={{ background: "white", border: "1px solid #e8eaf0", borderRadius: 16, padding: "18px 20px", boxShadow: "0 1px 6px rgba(15,23,42,0.06)" }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: "#191B23", fontFamily: "'Manrope', sans-serif", marginBottom: 14 }}>{answers.city} Specific Requirements</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {cityRules.map((rule, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 12px", background: "#fafafa", borderRadius: 8 }}>
                <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{rule.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, color: rule.color, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, margin: 0, lineHeight: 1.4 }}>{rule.text}</p>
                  {rule.source && <p style={{ fontSize: 10, color: "#9ca3af", fontFamily: "'Plus Jakarta Sans', sans-serif", margin: "2px 0 0" }}>Source: {rule.source}</p>}
                </div>
              </div>
            ))}
            {phone && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px" }}>
                <span style={{ fontSize: 14 }}>📞</span>
                <span style={{ fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#374151" }}>Verify: <a href={`tel:${phone}`} style={{ color: PRIMARY, fontWeight: 700, textDecoration: "none" }}>{phone}</a></span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Consequences */}
      <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 14, padding: "18px 20px" }}>
        <p style={{ fontSize: 13, fontWeight: 800, color: "#92400E", fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 12 }}>⚠ If you proceed without a permit and one IS required:</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {CONSEQUENCES.map((c, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <span style={{ color: "#d97706", fontWeight: 800, flexShrink: 0, marginTop: 1 }}>•</span>
              <span style={{ fontSize: 13, color: "#78350f", fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.5 }}>{c}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA buttons */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {phone && (
          <a href={`tel:${phone}`}
            style={{ flex: 1, minWidth: 140, display: "block", textAlign: "center", background: PRIMARY, color: "white", padding: "12px 16px", borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: "none", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            📞 Call to Verify
          </a>
        )}
        <Link to="/ApplyForPermit"
          style={{ flex: 1, minWidth: 140, display: "block", textAlign: "center", background: "white", color: PRIMARY, border: `2px solid ${PRIMARY}`, padding: "12px 16px", borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: "none", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Start Application Anyway
        </Link>
        <button onClick={onReset}
          style={{ flex: 1, minWidth: 140, background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 12, padding: "12px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Check Another Project
        </button>
      </div>

      {/* Building dept contact */}
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

function RuleCell({ ok, text }) {
  const color = ok === true ? "#047857" : ok === false ? "#b91c1c" : "#92400e";
  const bg = ok === true ? "#ecfdf5" : ok === false ? "#fef2f2" : "#fffbeb";
  return (
    <span style={{ display: "inline-block", background: bg, color, borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.4 }}>
      {ok === true ? "✓ " : ok === false ? "✗ " : "⚠ "}{text}
    </span>
  );
}

export function ContactCard({ cityInfo, city }) {
  return (
    <div style={{ background: "white", border: "1px solid #e8eaf0", borderRadius: 14, padding: "18px 20px", boxShadow: "0 1px 6px rgba(15,23,42,0.06)" }}>
      <h3 style={{ fontSize: 13, fontWeight: 800, color: "#191B23", fontFamily: "'Manrope', sans-serif", marginBottom: 12 }}>{city} Building Department</h3>
      {cityInfo ? (
        <>
          {cityInfo.building_department_phone && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Phone className="w-4 h-4" style={{ color: PRIMARY, flexShrink: 0 }} />
              <a href={`tel:${cityInfo.building_department_phone}`} style={{ fontSize: 13, color: PRIMARY, fontFamily: "'Plus Jakarta Sans', sans-serif", textDecoration: "none", fontWeight: 700 }}>{cityInfo.building_department_phone}</a>
            </div>
          )}
          {cityInfo.building_department_address && (
            <p style={{ fontSize: 12, color: "#6b7280", fontFamily: "'Plus Jakarta Sans', sans-serif", margin: "0 0 6px" }}>{cityInfo.building_department_address}</p>
          )}
          <p style={{ fontSize: 11, color: "#9ca3af", fontFamily: "'Plus Jakarta Sans', sans-serif", margin: "0 0 12px" }}>Hours: Monday–Friday, 8:00 AM – 4:30 PM</p>
          <div style={{ display: "flex", gap: 8 }}>
            {cityInfo.building_department_phone && (
              <a href={`tel:${cityInfo.building_department_phone}`} style={{ flex: 1, display: "block", textAlign: "center", background: "#eff6ff", color: PRIMARY, border: "1px solid #dbeafe", borderRadius: 8, padding: "8px", fontWeight: 700, fontSize: 12, textDecoration: "none", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                📞 Call
              </a>
            )}
            {cityInfo.portal_url && (
              <a href={cityInfo.portal_url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, background: "#f3f4f6", color: "#374151", borderRadius: 8, padding: "8px", fontWeight: 700, fontSize: 12, textDecoration: "none", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <ExternalLink className="w-3 h-3" /> Permit Portal
              </a>
            )}
          </div>
        </>
      ) : (
        <p style={{ fontSize: 13, color: "#9ca3af", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Contact your local building department to verify this result.</p>
      )}
    </div>
  );
}