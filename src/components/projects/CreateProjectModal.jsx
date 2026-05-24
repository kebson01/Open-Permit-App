import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { X, Loader2, Search } from "lucide-react";

const PRIMARY = "#004ac6";
const CITIES = ["Weston", "Hollywood", "Coral Springs", "Cooper City", "Fort Lauderdale", "Sunrise"];

export default function CreateProjectModal({ currentUser, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [propertyResults, setPropertyResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [city, setCity] = useState("");
  const [projectType, setProjectType] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [startDate, setStartDate] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [priority, setPriority] = useState("medium");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const searchProperties = async (q) => {
    if (q.length < 3) { setPropertyResults([]); return; }
    setSearchLoading(true);
    const { data } = await supabase.rpc("search_properties", { search_query: q }).limit(5).catch(() => ({ data: [] }));
    setPropertyResults(data || []);
    setSearchLoading(false);
  };

  const handleSubmit = async () => {
    setError("");
    if (!name || !city) { setError("Project name and city are required."); return; }
    setSubmitting(true);
    const { data, error: e } = await supabase.from("projects").insert({
      name,
      property_address: selectedProperty?.full_address || address || null,
      folio_number: selectedProperty?.folio_number || null,
      city_name: city,
      project_type: projectType || null,
      estimated_cost: estimatedCost ? parseFloat(estimatedCost) : null,
      start_date: startDate || null,
      target_completion_date: targetDate || null,
      priority,
      notes: notes || null,
      owner_email: currentUser.email,
      status: "planning",
      progress_pct: 0,
    }).select().single();
    setSubmitting(false);
    if (e) { setError(e.message); return; }
    onCreated(data);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "white", borderRadius: 20, width: "100%", maxWidth: 540, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "#191B23", fontFamily: "'Manrope', sans-serif", margin: 0 }}>New Project</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X className="w-5 h-5" style={{ color: "#9ca3af" }} /></button>
        </div>
        <div style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <F label="Project Name *"><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Home Addition 2024" style={inp} /></F>

          <F label="Property Address">
            <div style={{ position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", border: "1px solid #e0e4f0", borderRadius: 8, padding: "0 12px", background: "white" }}>
                <Search className="w-4 h-4" style={{ color: "#9ca3af", flexShrink: 0 }} />
                <input value={selectedProperty ? selectedProperty.full_address : address}
                  onChange={e => { setAddress(e.target.value); setSelectedProperty(null); searchProperties(e.target.value); }}
                  placeholder="Search address or folio..."
                  style={{ flex: 1, border: "none", outline: "none", padding: "9px 8px", fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", background: "transparent" }} />
                {searchLoading && <Loader2 className="w-3 h-3 animate-spin" style={{ color: "#9ca3af" }} />}
              </div>
              {propertyResults.length > 0 && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid #e0e4f0", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", zIndex: 100, maxHeight: 180, overflowY: "auto" }}>
                  {propertyResults.map(p => (
                    <button key={p.folio_number} onClick={() => { setSelectedProperty(p); setPropertyResults([]); }}
                      style={{ width: "100%", textAlign: "left", padding: "10px 12px", border: "none", background: "none", cursor: "pointer", borderBottom: "1px solid #f0f0f0", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f8faff"} onMouseLeave={e => e.currentTarget.style.background = "none"}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#191B23", margin: 0 }}>{p.full_address}</p>
                      <p style={{ fontSize: 11, color: "#9ca3af", margin: "2px 0 0" }}>{p.folio_number}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </F>

          <div className="grid grid-cols-2 gap-3">
            <F label="City *">
              <select value={city} onChange={e => setCity(e.target.value)} style={inp}>
                <option value="">Select city</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </F>
            <F label="Project Type">
              <select value={projectType} onChange={e => setProjectType(e.target.value)} style={inp}>
                <option value="">Select type</option>
                {["Residential", "Commercial", "Mixed Use"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </F>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <F label="Estimated Cost ($)"><input type="number" value={estimatedCost} onChange={e => setEstimatedCost(e.target.value)} placeholder="0" style={inp} /></F>
            <F label="Priority">
              <select value={priority} onChange={e => setPriority(e.target.value)} style={inp}>
                {["low", "medium", "high"].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </F>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <F label="Start Date"><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inp} /></F>
            <F label="Target Completion"><input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} style={inp} /></F>
          </div>

          <F label="Notes"><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{ ...inp, resize: "vertical" }} /></F>

          {error && <p style={{ fontSize: 12, color: "#b91c1c", background: "#fef2f2", borderRadius: 8, padding: "10px 12px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{error}</p>}

          <button onClick={handleSubmit} disabled={submitting}
            style={{ background: PRIMARY, color: "white", border: "none", borderRadius: 10, padding: "12px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: submitting ? 0.7 : 1 }}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {submitting ? "Creating..." : "Create Project"}
          </button>
        </div>
      </div>
    </div>
  );
}

function F({ label, children }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{label}</label>
      {children}
    </div>
  );
}

const inp = { width: "100%", border: "1px solid #e0e4f0", borderRadius: 8, padding: "9px 11px", fontSize: 13, color: "#191B23", fontFamily: "'Plus Jakarta Sans', sans-serif", outline: "none", boxSizing: "border-box", background: "white" };