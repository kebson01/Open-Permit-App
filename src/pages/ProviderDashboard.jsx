import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import {
  Shield, CheckCircle2, Loader2, ClipboardList, FileText, User,
  AlertCircle, Plus, X, Phone, Globe, MapPin
} from "lucide-react";

const PRIMARY = "#004ac6";
const TEAL = "#006a61";

const CITIES = ["Weston", "Hollywood", "Coral Springs", "Cooper City", "Fort Lauderdale", "Sunrise"];
const SERVICES_LIST = [
  "Plan Review — Residential", "Plan Review — Commercial", "Structural Inspections",
  "Electrical Inspections", "Plumbing Inspections", "Mechanical Inspections",
  "Fire Inspections", "Threshold Building Inspections",
];
const INSPECTION_TYPES = [
  "Foundation", "Framing", "Rough Electric", "Rough Plumbing", "Rough Mechanical",
  "Insulation", "Final Electric", "Final Plumbing", "Final Mechanical", "Final Building",
  "Fire", "Structural", "Threshold",
];

const STATUS_STYLES = {
  requested: { bg: "#fffbeb", color: "#92400e", border: "#fde68a", label: "Requested" },
  accepted:  { bg: "#eff6ff", color: "#1e40af", border: "#bfdbfe", label: "Accepted" },
  in_progress: { bg: "#f0fdfa", color: "#065f46", border: "#a7f3d0", label: "In Progress" },
  completed:   { bg: "#ecfdf5", color: "#047857", border: "#6ee7b7", label: "Completed" },
  cancelled:   { bg: "#f9fafb", color: "#6b7280", border: "#e5e7eb", label: "Cancelled" },
};

const RESULT_STYLES = {
  passed:                { bg: "#ecfdf5", color: "#047857", label: "Passed" },
  failed:                { bg: "#fef2f2", color: "#b91c1c", label: "Failed" },
  partial:               { bg: "#fffbeb", color: "#92400e", label: "Partial" },
  re_inspection_required:{ bg: "#fff7ed", color: "#c2410c", label: "Re-Inspection" },
};

export default function ProviderDashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [firm, setFirm] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("assignments");
  const [showInspectionModal, setShowInspectionModal] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const user = session?.user ?? null;
      if (!user) { navigate("/login"); return; }
      setCurrentUser(user);
      await loadData(user);
    });
  }, []);

  const loadData = async (user) => {
    setLoading(true);
    try {
      const { data: firmData } = await supabase.from("private_provider_firms").select("*").eq("owner_email", user.email).maybeSingle();
      if (!firmData) { navigate("/provider-register"); return; }
      setFirm(firmData);
      const [{ data: asgn }, { data: insp }] = await Promise.all([
        supabase.from("private_provider_assignments").select("*").eq("firm_id", firmData.id).order("created_date", { ascending: false }).limit(20),
        supabase.from("inspection_reports").select("*").eq("firm_id", firmData.id).order("inspection_date", { ascending: false }).limit(20),
      ]);
      setAssignments(asgn || []);
      setInspections(insp || []);
    } finally {
      setLoading(false);
    }
  };

  const updateAssignmentStatus = async (id, status) => {
    await supabase.from("private_provider_assignments").update({ status }).eq("id", id);
    setAssignments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <Loader2 className="w-7 h-7 animate-spin" style={{ color: PRIMARY }} />
    </div>
  );
  if (!firm) return null;

  const activeCount = assignments.filter(a => a.status === "accepted" || a.status === "in_progress").length;
  const pendingCount = assignments.filter(a => a.status === "requested").length;
  const thisMonth = inspections.filter(i => {
    const d = new Date(i.inspection_date || i.created_date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const completedCount = assignments.filter(a => a.status === "completed").length;

  const tabs = [
    { key: "assignments", label: "Assignments", icon: ClipboardList },
    { key: "reports", label: "Inspection Reports", icon: FileText },
    { key: "profile", label: "My Profile", icon: User },
  ];

  return (
    <div style={{ background: "#f8f9ff", minHeight: "100vh", paddingBottom: 48 }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #004ac6 0%, #003399 100%)", padding: "36px 24px 28px" }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 4 }}>Provider Dashboard</p>
              <h1 style={{ color: "white", fontSize: 26, fontWeight: 800, fontFamily: "'Manrope', sans-serif", margin: "0 0 6px" }}>{firm.firm_name}</h1>
              <div className="flex items-center gap-2">
                {firm.verified ? (
                  <span style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    ✓ Verified
                  </span>
                ) : (
                  <span style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    ⏳ Pending Verification
                  </span>
                )}
                {firm.fl_statute_certified && (
                  <span style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    FL 553.791 Certified
                  </span>
                )}
              </div>
            </div>
            <button onClick={() => setShowInspectionModal(true)}
              style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 10, padding: "9px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <Plus className="w-4 h-4" /> Submit Report
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 -mt-6 mb-6">
          {[
            { label: "Active Assignments", value: activeCount, color: PRIMARY },
            { label: "Pending Requests", value: pendingCount, color: "#d97706" },
            { label: "Inspections This Month", value: thisMonth, color: TEAL },
            { label: "Total Completed", value: completedCount, color: "#059669" },
          ].map(stat => (
            <div key={stat.label} style={{ background: "white", borderRadius: 14, padding: "18px 20px", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", border: "1px solid #e8eaf0" }}>
              <p style={{ fontSize: 26, fontWeight: 800, color: stat.color, fontFamily: "'Manrope', sans-serif", margin: "0 0 4px" }}>{stat.value}</p>
              <p style={{ fontSize: 11, color: "#6b7280", fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0 }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "white", padding: "4px", borderRadius: 12, border: "1px solid #e8eaf0", width: "fit-content" }}>
          {tabs.map(t => {
            const Icon = t.icon;
            const active = activeTab === t.key;
            return (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", background: active ? PRIMARY : "transparent", color: active ? "white" : "#6b7280", transition: "all 0.15s" }}>
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab: Assignments */}
        {activeTab === "assignments" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {assignments.length === 0 ? (
              <EmptyState icon={ClipboardList} message="No assignment requests yet. Your profile is live — homeowners and contractors can find you in the directory." />
            ) : assignments.map(a => {
              const st = STATUS_STYLES[a.status] || STATUS_STYLES.requested;
              return (
                <div key={a.id} style={{ background: "white", border: "1px solid #e8eaf0", borderRadius: 14, padding: "18px 20px", boxShadow: "0 1px 4px rgba(15,23,42,0.04)" }}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#191B23", fontFamily: "'Manrope', sans-serif", margin: "0 0 3px" }}>
                        {a.folio_number || "Property TBD"}
                      </p>
                      <p style={{ fontSize: 12, color: "#6b7280", fontFamily: "'Plus Jakarta Sans', sans-serif", margin: "0 0 6px" }}>
                        {a.applicant_name || a.applicant_email} · {a.city_name || "—"}
                      </p>
                      {Array.isArray(a.services_requested) && a.services_requested.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {a.services_requested.map(s => (
                            <span key={s} style={{ background: "#f0f4ff", color: "#004ac6", borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{st.label}</span>
                      {a.status === "requested" && (
                        <button onClick={() => updateAssignmentStatus(a.id, "accepted")}
                          style={{ background: PRIMARY, color: "white", border: "none", borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          Accept
                        </button>
                      )}
                      {a.status === "in_progress" && (
                        <button onClick={() => updateAssignmentStatus(a.id, "completed")}
                          style={{ background: "#059669", color: "white", border: "none", borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          Mark Complete
                        </button>
                      )}
                      <button onClick={() => setShowInspectionModal(true)}
                        style={{ background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        Submit Inspection
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab: Inspection Reports */}
        {activeTab === "reports" && (
          <div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
              <button onClick={() => setShowInspectionModal(true)}
                style={{ background: PRIMARY, color: "white", border: "none", borderRadius: 10, padding: "9px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
                <Plus className="w-4 h-4" /> Submit New Report
              </button>
            </div>
            {inspections.length === 0 ? (
              <EmptyState icon={FileText} message="No inspection reports submitted yet." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {inspections.map(i => {
                  const rs = RESULT_STYLES[i.result] || { bg: "#f9fafb", color: "#6b7280", label: i.result };
                  return (
                    <div key={i.id} style={{ background: "white", border: "1px solid #e8eaf0", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#191B23", fontFamily: "'Manrope', sans-serif", margin: "0 0 2px" }}>
                          {i.inspection_type || "—"} · Folio {i.folio_number || "—"}
                        </p>
                        <p style={{ fontSize: 11, color: "#9ca3af", fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0 }}>
                          {i.permit_number ? `Permit #${i.permit_number} · ` : ""}{i.inspection_date || "—"} · {i.inspector_name || "—"}
                        </p>
                      </div>
                      <span style={{ background: rs.bg, color: rs.color, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{rs.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab: Profile */}
        {activeTab === "profile" && (
          <ProfileTab firm={firm} setFirm={setFirm} />
        )}
      </div>

      {showInspectionModal && (
        <InspectionReportModal
          firm={firm}
          currentUser={currentUser}
          onClose={() => setShowInspectionModal(false)}
          onSubmitted={(report) => { setInspections(prev => [report, ...prev]); setShowInspectionModal(false); }}
        />
      )}
    </div>
  );
}

function ProfileTab({ firm, setFirm }) {
  const [firmName, setFirmName] = useState(firm.firm_name || "");
  const [phone, setPhone] = useState(firm.phone || "");
  const [website, setWebsite] = useState(firm.website || "");
  const [address, setAddress] = useState(firm.address || "");
  const [flCertified, setFlCertified] = useState(firm.fl_statute_certified || false);
  const [selectedServices, setSelectedServices] = useState(Array.isArray(firm.services_offered) ? firm.services_offered : []);
  const [selectedCities, setSelectedCities] = useState(Array.isArray(firm.cities) ? firm.cities : []);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const toggleService = (s) => setSelectedServices(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const toggleCity = (c) => setSelectedCities(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  const handleSave = async () => {
    setSaving(true); setError(""); setSaved(false);
    try {
      const { data, error: e } = await supabase.from("private_provider_firms").update({
        firm_name: firmName, phone, website: website || null, address: address || null,
        fl_statute_certified: flCertified, services_offered: selectedServices, cities: selectedCities,
      }).eq("id", firm.id).select().single();
      if (e) throw e;
      setFirm(data);
      setSaved(true);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 640 }}>
      <div style={{ background: "white", border: "1px solid #e8eaf0", borderRadius: 16, padding: "24px" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontSize: 15, fontWeight: 800, color: "#191B23", fontFamily: "'Manrope', sans-serif", margin: 0 }}>Firm Details</h3>
          <span style={{ fontSize: 11, color: firm.verified ? "#059669" : "#d97706", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, background: firm.verified ? "#ecfdf5" : "#fffbeb", padding: "3px 10px", borderRadius: 20 }}>
            {firm.verified ? "✓ Verified" : "Pending Verification"}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { label: "Firm Name *", value: firmName, set: setFirmName },
            { label: "Phone *", value: phone, set: setPhone },
            { label: "Website", value: website, set: setWebsite },
            { label: "Address", value: address, set: setAddress },
          ].map(f => (
            <div key={f.label}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 5, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{f.label}</label>
              <input value={f.value} onChange={e => f.set(e.target.value)} style={inputStyle} />
            </div>
          ))}
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={flCertified} onChange={e => setFlCertified(e.target.checked)} style={{ accentColor: "#006a61", width: 16, height: 16 }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#374151", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Certified under Florida Statute 553.791</span>
          </label>
        </div>
      </div>

      <div style={{ background: "white", border: "1px solid #e8eaf0", borderRadius: 16, padding: "20px 24px" }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 10 }}>Services Offered</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SERVICES_LIST.map(s => (
            <label key={s} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input type="checkbox" checked={selectedServices.includes(s)} onChange={() => toggleService(s)} style={{ accentColor: PRIMARY, width: 14, height: 14 }} />
              <span style={{ fontSize: 12, color: "#374151", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s}</span>
            </label>
          ))}
        </div>
      </div>

      <div style={{ background: "white", border: "1px solid #e8eaf0", borderRadius: 16, padding: "20px 24px" }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 10 }}>Cities Served</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CITIES.map(c => (
            <label key={c} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input type="checkbox" checked={selectedCities.includes(c)} onChange={() => toggleCity(c)} style={{ accentColor: PRIMARY, width: 14, height: 14 }} />
              <span style={{ fontSize: 12, color: "#374151", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{c}</span>
            </label>
          ))}
        </div>
      </div>

      {error && <p style={{ fontSize: 12, color: "#b91c1c", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 12px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{error}</p>}
      {saved && <p style={{ fontSize: 12, color: "#059669", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 8, padding: "10px 12px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>✓ Changes saved successfully.</p>}

      <button onClick={handleSave} disabled={saving}
        style={{ background: PRIMARY, color: "white", border: "none", borderRadius: 12, padding: "12px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", opacity: saving ? 0.7 : 1 }}>
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}

function InspectionReportModal({ firm, currentUser, onClose, onSubmitted }) {
  const [folio, setFolio] = useState("");
  const [permitNumber, setPermitNumber] = useState("");
  const [city, setCity] = useState("");
  const [inspectionType, setInspectionType] = useState("");
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().split("T")[0]);
  const [inspectorName, setInspectorName] = useState(currentUser?.user_metadata?.full_name || "");
  const [inspectorLicense, setInspectorLicense] = useState(firm.license_number || "");
  const [result, setResult] = useState("passed");
  const [notes, setNotes] = useState("");
  const [certStatement, setCertStatement] = useState("I hereby certify that I have performed the above inspection in accordance with Florida Statute 553.791 and that the work inspected complies with the Florida Building Code.");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    if (!folio || !inspectionType || !city) { setError("Folio, city, and inspection type are required."); return; }
    setSubmitting(true);
    try {
      const { data, error: e } = await supabase.from("inspection_reports").insert({
        firm_id: firm.id,
        firm_name: firm.firm_name,
        folio_number: folio,
        permit_number: permitNumber || null,
        city_name: city,
        inspection_type: inspectionType,
        inspection_date: inspectionDate,
        inspector_name: inspectorName,
        inspector_license: inspectorLicense,
        result,
        notes: notes || null,
        certification_statement: certStatement,
        submitted_by: currentUser.email,
        submitted_date: new Date().toISOString().split("T")[0],
      }).select().single();
      if (e) throw e;
      onSubmitted(data);
    } catch (e) {
      setError(e.message || "Failed to submit report.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "white", borderRadius: 20, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "#191B23", fontFamily: "'Manrope', sans-serif", margin: 0 }}>Submit Inspection Report</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X className="w-5 h-5" style={{ color: "#9ca3af" }} /></button>
        </div>
        <div style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="grid grid-cols-2 gap-3">
            <MField label="Folio Number *"><input value={folio} onChange={e => setFolio(e.target.value)} placeholder="504-01-00-0010" style={inputStyle} /></MField>
            <MField label="Permit Number"><input value={permitNumber} onChange={e => setPermitNumber(e.target.value)} placeholder="Optional" style={inputStyle} /></MField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MField label="City *">
              <select value={city} onChange={e => setCity(e.target.value)} style={inputStyle}>
                <option value="">Select city</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </MField>
            <MField label="Inspection Type *">
              <select value={inspectionType} onChange={e => setInspectionType(e.target.value)} style={inputStyle}>
                <option value="">Select type</option>
                {INSPECTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </MField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MField label="Inspection Date *"><input type="date" value={inspectionDate} onChange={e => setInspectionDate(e.target.value)} style={inputStyle} /></MField>
            <MField label="Inspector Name"><input value={inspectorName} onChange={e => setInspectorName(e.target.value)} style={inputStyle} /></MField>
          </div>
          <MField label="Inspector License Number"><input value={inspectorLicense} onChange={e => setInspectorLicense(e.target.value)} style={inputStyle} /></MField>
          <MField label="Result *">
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {["passed", "failed", "partial", "re_inspection_required"].map(r => (
                <label key={r} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <input type="radio" name="result" value={r} checked={result === r} onChange={() => setResult(r)} style={{ accentColor: PRIMARY }} />
                  <span style={{ fontSize: 13, color: "#374151", fontFamily: "'Plus Jakarta Sans', sans-serif", textTransform: "capitalize" }}>
                    {r.replace(/_/g, " ")}
                  </span>
                </label>
              ))}
            </div>
          </MField>
          <MField label="Notes">
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
          </MField>
          <MField label="Certification Statement">
            <textarea value={certStatement} onChange={e => setCertStatement(e.target.value)} rows={3} style={{ ...inputStyle, fontSize: 11, resize: "vertical" }} />
          </MField>
          {error && <p style={{ fontSize: 12, color: "#b91c1c", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 12px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{error}</p>}
          <button onClick={handleSubmit} disabled={submitting}
            style={{ background: PRIMARY, color: "white", border: "none", borderRadius: 10, padding: "12px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: submitting ? 0.7 : 1 }}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {submitting ? "Submitting..." : "Submit Report"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, message }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px", background: "white", borderRadius: 14, border: "1px solid #e8eaf0" }}>
      <Icon className="w-10 h-10 mx-auto mb-3" style={{ color: "#d1d5db" }} />
      <p style={{ fontSize: 13, color: "#9ca3af", fontFamily: "'Plus Jakarta Sans', sans-serif", maxWidth: 360, margin: "0 auto" }}>{message}</p>
    </div>
  );
}

function MField({ label, children }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", border: "1px solid #e0e4f0", borderRadius: 8, padding: "9px 11px",
  fontSize: 13, color: "#191B23", fontFamily: "'Plus Jakarta Sans', sans-serif",
  outline: "none", boxSizing: "border-box", background: "white",
};