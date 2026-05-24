import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { X, CheckCircle2, Loader2 } from "lucide-react";

const PRIMARY = "#004ac6";

export default function RequestServicesModal({ provider, currentUser, onClose }) {
  const [selectedServices, setSelectedServices] = useState([]);
  const [folio, setFolio] = useState("");
  const [permitNumber, setPermitNumber] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const services = Array.isArray(provider.services_offered) ? provider.services_offered : [];
  const cities = Array.isArray(provider.cities) ? provider.cities : [];

  const toggleService = (s) => setSelectedServices(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const handleSubmit = async () => {
    setError("");
    if (!folio) { setError("Property address or folio number is required."); return; }
    setSubmitting(true);
    try {
      const { error: err } = await supabase.from("private_provider_assignments").insert({
        firm_id: provider.id,
        firm_name: provider.firm_name,
        applicant_email: currentUser.email,
        applicant_name: currentUser.user_metadata?.full_name || currentUser.email,
        folio_number: folio,
        permit_number: permitNumber || null,
        city_name: cities[0] || null,
        services_requested: selectedServices,
        status: "requested",
        notes: message || null,
      });
      if (err) throw err;
      setSuccess(true);
    } catch (e) {
      setError(e.message || "Failed to send request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "white", borderRadius: 20, width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        {/* Modal header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#191B23", fontFamily: "'Manrope', sans-serif", margin: 0 }}>Request Services</h3>
            <p style={{ fontSize: 12, color: "#6b7280", fontFamily: "'Plus Jakarta Sans', sans-serif", margin: "2px 0 0" }}>{provider.firm_name}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6 }}>
            <X className="w-5 h-5" style={{ color: "#9ca3af" }} />
          </button>
        </div>

        <div style={{ padding: "20px 24px 24px" }}>
          {success ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3" style={{ color: "#059669" }} />
              <p style={{ fontSize: 15, fontWeight: 700, color: "#191B23", fontFamily: "'Manrope', sans-serif", marginBottom: 8 }}>Request Sent!</p>
              <p style={{ fontSize: 13, color: "#6b7280", fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.6 }}>
                Your request has been sent to <strong>{provider.firm_name}</strong>. They typically respond within 1 business day.
              </p>
              <button onClick={onClose} style={{ marginTop: 20, background: PRIMARY, color: "white", border: "none", borderRadius: 10, padding: "10px 24px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Done
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Pre-filled user info */}
              <div style={{ background: "#f8faff", borderRadius: 10, padding: "12px 14px", border: "1px solid #e0e8ff" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "'Plus Jakarta Sans', sans-serif", margin: "0 0 4px" }}>Applicant</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#191B23", fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0 }}>
                  {currentUser.user_metadata?.full_name || "—"}
                </p>
                <p style={{ fontSize: 12, color: "#6b7280", fontFamily: "'Plus Jakarta Sans', sans-serif", margin: "2px 0 0" }}>{currentUser.email}</p>
              </div>

              <Field label="Property Address or Folio Number *">
                <input value={folio} onChange={e => setFolio(e.target.value)} placeholder="e.g. 504-01-00-0010 or 123 Main St" style={inputStyle} />
              </Field>

              <Field label="Permit Number (if known)">
                <input value={permitNumber} onChange={e => setPermitNumber(e.target.value)} placeholder="e.g. 2024-B-0012" style={inputStyle} />
              </Field>

              {services.length > 0 && (
                <Field label="Services Needed">
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {services.map(s => (
                      <label key={s} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                        <input type="checkbox" checked={selectedServices.includes(s)} onChange={() => toggleService(s)}
                          style={{ accentColor: PRIMARY, width: 15, height: 15 }} />
                        <span style={{ fontSize: 13, color: "#374151", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s}</span>
                      </label>
                    ))}
                  </div>
                </Field>
              )}

              <Field label="Message to Provider (optional)">
                <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3}
                  placeholder="Describe your project or any questions..."
                  style={{ ...inputStyle, resize: "vertical" }} />
              </Field>

              {error && <p style={{ fontSize: 12, color: "#b91c1c", fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 12px" }}>{error}</p>}

              <button onClick={handleSubmit} disabled={submitting}
                style={{ background: PRIMARY, color: "white", border: "none", borderRadius: 10, padding: "12px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: submitting ? 0.7 : 1 }}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {submitting ? "Sending..." : "Send Request"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", border: "1px solid #e0e4f0", borderRadius: 8, padding: "10px 12px",
  fontSize: 13, color: "#191B23", fontFamily: "'Plus Jakarta Sans', sans-serif",
  outline: "none", boxSizing: "border-box", background: "white",
};