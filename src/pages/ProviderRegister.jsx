import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Shield, CheckCircle2, Loader2, ChevronRight } from "lucide-react";

const PRIMARY = "#004ac6";
const TEAL = "#006a61";

const CITIES = ["Weston", "Hollywood", "Coral Springs", "Cooper City", "Fort Lauderdale", "Sunrise"];
const SERVICES = [
  "Plan Review — Residential",
  "Plan Review — Commercial",
  "Structural Inspections",
  "Electrical Inspections",
  "Plumbing Inspections",
  "Mechanical Inspections",
  "Fire Inspections",
  "Threshold Building Inspections",
];

export default function ProviderRegister() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [checkingFirm, setCheckingFirm] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [firmName, setFirmName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [flCertified, setFlCertified] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedCities, setSelectedCities] = useState([]);
  const [certChecked, setCertChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const user = session?.user ?? null;
      setCurrentUser(user);
      setAuthLoading(false);
      if (!user) { navigate("/login"); return; }
      // Check if firm already exists
      const { data } = await supabase.from("private_provider_firms").select("id").eq("owner_email", user.email).maybeSingle();
      if (data) navigate("/provider-dashboard");
      setCheckingFirm(false);
    });
  }, []);

  const toggleService = (s) => setSelectedServices(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const toggleCity = (c) => setSelectedCities(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  const handleSubmit = async () => {
    setError("");
    if (!firmName || !licenseNumber || !phone) { setError("Firm name, license number, and phone are required."); return; }
    if (!certChecked) { setError("You must certify your credentials before submitting."); return; }
    setSubmitting(true);
    try {
      const { data: firm, error: firmErr } = await supabase.from("private_provider_firms").insert({
        owner_email: currentUser.email,
        firm_name: firmName,
        license_number: licenseNumber,
        phone,
        website: website || null,
        address: address || null,
        services_offered: selectedServices,
        cities: selectedCities,
        fl_statute_certified: flCertified,
        status: "active",
        verified: false,
      }).select("id").single();
      if (firmErr) throw firmErr;

      if (selectedCities.length > 0) {
        await supabase.from("private_provider_city_assignments").insert(
          selectedCities.map(city => ({ firm_id: firm.id, city_name: city, is_active: true }))
        );
      }
      setSuccess(true);
    } catch (e) {
      setError(e.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || checkingFirm) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <Loader2 className="w-7 h-7 animate-spin" style={{ color: PRIMARY }} />
    </div>
  );

  if (success) return (
    <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f9ff", padding: 24 }}>
      <div style={{ background: "white", borderRadius: 20, padding: "48px 40px", maxWidth: 480, width: "100%", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <CheckCircle2 className="w-10 h-10" style={{ color: "#059669" }} />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, fontFamily: "'Manrope', sans-serif", color: "#191B23", marginBottom: 12 }}>Firm Registered!</h2>
        <p style={{ fontSize: 14, color: "#6b7280", fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.7, marginBottom: 28 }}>
          Your firm profile is now live in the Open Permit directory. Our team will verify your credentials within <strong>1–2 business days</strong>.
        </p>
        <button onClick={() => navigate("/provider-dashboard")}
          style={{ background: PRIMARY, color: "white", border: "none", borderRadius: 10, padding: "12px 28px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", display: "inline-flex", alignItems: "center", gap: 6 }}>
          View My Dashboard <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ background: "#f8f9ff", minHeight: "100vh", paddingBottom: 48 }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #006a61 0%, #004d45 100%)", padding: "40px 24px 32px" }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-white opacity-80" />
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Provider Registration</span>
          </div>
          <h1 style={{ color: "white", fontSize: 28, fontWeight: 800, fontFamily: "'Manrope', sans-serif", marginBottom: 8 }}>Register as a Private Provider</h1>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Complete your firm profile to appear in the Open Permit directory
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 pt-8 space-y-6">
        {/* Section 1 */}
        <FormCard title="Firm Information">
          <FormField label="Firm / Company Name *">
            <input value={firmName} onChange={e => setFirmName(e.target.value)} placeholder="e.g. South Florida Plan Review LLC" style={inputStyle} />
          </FormField>
          <FormField label="State License Number *">
            <input value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} placeholder="e.g. BN1234567" style={inputStyle} />
          </FormField>
          <FormField label="Phone Number *">
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(954) 000-0000" style={inputStyle} />
          </FormField>
          <FormField label="Website (optional)">
            <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://yourfirm.com" style={inputStyle} />
          </FormField>
          <FormField label="Business Address (optional)">
            <input value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main St, Weston, FL 33326" style={inputStyle} />
          </FormField>
        </FormCard>

        {/* Section 2 */}
        <FormCard title="Services & Coverage">
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginBottom: 4 }}>
            <input type="checkbox" checked={flCertified} onChange={e => setFlCertified(e.target.checked)} style={{ marginTop: 2, accentColor: TEAL, width: 16, height: 16 }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#191B23", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              I am certified under Florida Statute 553.791
            </span>
          </label>

          <div style={{ marginTop: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Services Offered</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SERVICES.map(s => (
                <label key={s} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "8px 10px", borderRadius: 8, background: selectedServices.includes(s) ? "#f0f9ff" : "transparent", border: selectedServices.includes(s) ? "1px solid #bfdbfe" : "1px solid transparent" }}>
                  <input type="checkbox" checked={selectedServices.includes(s)} onChange={() => toggleService(s)} style={{ accentColor: PRIMARY, width: 15, height: 15 }} />
                  <span style={{ fontSize: 13, color: "#374151", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s}</span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Cities Served</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CITIES.map(c => (
                <label key={c} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "8px 10px", borderRadius: 8, background: selectedCities.includes(c) ? "#f0f9ff" : "transparent", border: selectedCities.includes(c) ? "1px solid #bfdbfe" : "1px solid transparent" }}>
                  <input type="checkbox" checked={selectedCities.includes(c)} onChange={() => toggleCity(c)} style={{ accentColor: PRIMARY, width: 15, height: 15 }} />
                  <span style={{ fontSize: 13, color: "#374151", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{c}</span>
                </label>
              ))}
            </div>
          </div>
        </FormCard>

        {/* Section 3 */}
        <FormCard title="Certification Statement">
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", padding: "14px", background: "#f8faff", borderRadius: 10, border: "1px solid #e0e8ff" }}>
            <input type="checkbox" checked={certChecked} onChange={e => setCertChecked(e.target.checked)} style={{ marginTop: 2, accentColor: PRIMARY, width: 16, height: 16, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: "#374151", fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.6 }}>
              I certify that I am a licensed professional in good standing with the State of Florida, authorized to provide private provider services under <strong>Florida Statute 553.791</strong>.
            </span>
          </label>
        </FormCard>

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px" }}>
            <p style={{ fontSize: 13, color: "#b91c1c", fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0 }}>{error}</p>
          </div>
        )}

        <button onClick={handleSubmit} disabled={submitting}
          style={{ width: "100%", background: PRIMARY, color: "white", border: "none", borderRadius: 12, padding: "14px", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: submitting ? 0.7 : 1 }}>
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {submitting ? "Submitting..." : "Submit Registration"}
        </button>
      </div>
    </div>
  );
}

function FormCard({ title, children }) {
  return (
    <div style={{ background: "white", border: "1px solid #e8eaf0", borderRadius: 16, padding: "24px", boxShadow: "0 1px 4px rgba(15,23,42,0.06)" }}>
      <h2 style={{ fontSize: 15, fontWeight: 800, color: "#191B23", fontFamily: "'Manrope', sans-serif", marginBottom: 18, paddingBottom: 12, borderBottom: "1px solid #f0f0f0" }}>{title}</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>{children}</div>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 6, fontFamily: "'Plus Jakarta Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", border: "1px solid #e0e4f0", borderRadius: 8, padding: "10px 12px",
  fontSize: 13, color: "#191B23", fontFamily: "'Plus Jakarta Sans', sans-serif",
  outline: "none", boxSizing: "border-box", background: "white",
};