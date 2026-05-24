import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";

const PRIMARY = "#004ac6";
const CITIES = ["Weston", "Hollywood", "Coral Springs", "Cooper City", "Fort Lauderdale", "Sunrise"];

export default function ProjectOverviewTab({ project, onProjectUpdated }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...project });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true); setError("");
    const { data, error: e } = await supabase.from("projects").update({
      name: form.name, property_address: form.property_address, city_name: form.city_name,
      project_type: form.project_type, estimated_cost: form.estimated_cost,
      start_date: form.start_date, target_completion_date: form.target_completion_date,
      priority: form.priority, notes: form.notes, status: form.status, progress_pct: form.progress_pct,
    }).eq("id", project.id).select().single();
    setSaving(false);
    if (e) { setError(e.message); return; }
    onProjectUpdated(data);
    setEditing(false);
  };

  const fields = [
    { label: "Property Address", key: "property_address", type: "text" },
    { label: "Folio Number", key: "folio_number", type: "readonly" },
    { label: "City", key: "city_name", type: "city" },
    { label: "Status", key: "status", type: "status" },
    { label: "Priority", key: "priority", type: "priority" },
    { label: "Progress %", key: "progress_pct", type: "number" },
    { label: "Estimated Cost ($)", key: "estimated_cost", type: "number" },
    { label: "Start Date", key: "start_date", type: "date" },
    { label: "Target Completion", key: "target_completion_date", type: "date" },
    { label: "Notes", key: "notes", type: "textarea" },
  ];

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ background: "white", border: "1px solid #e8eaf0", borderRadius: 16, padding: "24px", boxShadow: "0 1px 4px rgba(15,23,42,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: "#191B23", fontFamily: "'Manrope', sans-serif", margin: 0 }}>Project Details</h3>
          {!editing ? (
            <button onClick={() => setEditing(true)}
              style={{ background: "#f0f4ff", color: PRIMARY, border: "1px solid #dbeafe", borderRadius: 8, padding: "6px 14px", fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Edit Project
            </button>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setEditing(false); setForm({ ...project }); }} style={{ background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 8, padding: "6px 14px", fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ background: PRIMARY, color: "white", border: "none", borderRadius: 8, padding: "6px 14px", fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex", alignItems: "center", gap: 4 }}>
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : null} Save
              </button>
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 24px" }}>
          {fields.map(f => (
            <div key={f.key} style={f.key === "notes" ? { gridColumn: "1 / -1" } : {}}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{f.label}</label>
              {!editing || f.type === "readonly" ? (
                <p style={{ fontSize: 13, color: "#191B23", fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0, whiteSpace: "pre-wrap" }}>
                  {f.type === "number" && form[f.key] ? Number(form[f.key]).toLocaleString() : form[f.key] || "—"}
                </p>
              ) : f.type === "textarea" ? (
                <textarea value={form[f.key] || ""} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} rows={3} style={inp} />
              ) : f.type === "city" ? (
                <select value={form[f.key] || ""} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={inp}>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              ) : f.type === "status" ? (
                <select value={form[f.key] || ""} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={inp}>
                  {["planning", "permitting", "in_progress", "completed", "on_hold"].map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                </select>
              ) : f.type === "priority" ? (
                <select value={form[f.key] || ""} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={inp}>
                  {["low", "medium", "high"].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : (
                <input type={f.type} value={form[f.key] || ""} onChange={e => setForm(p => ({ ...p, [f.key]: f.type === "number" ? parseFloat(e.target.value) || "" : e.target.value }))} style={inp} />
              )}
            </div>
          ))}
        </div>

        {error && <p style={{ fontSize: 12, color: "#b91c1c", background: "#fef2f2", borderRadius: 8, padding: "10px 12px", marginTop: 14, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{error}</p>}
      </div>
    </div>
  );
}

const inp = { width: "100%", border: "1px solid #e0e4f0", borderRadius: 8, padding: "8px 10px", fontSize: 13, color: "#191B23", fontFamily: "'Plus Jakarta Sans', sans-serif", outline: "none", boxSizing: "border-box", background: "white" };