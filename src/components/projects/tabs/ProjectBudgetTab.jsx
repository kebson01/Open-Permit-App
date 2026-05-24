import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, Plus, TrendingDown, TrendingUp } from "lucide-react";

const PRIMARY = "#004ac6";
const CATEGORIES = ["Labor", "Materials", "Permits & Fees", "Design & Engineering", "Other"];
const STATUSES = ["planned", "committed", "paid"];

export default function ProjectBudgetTab({ project }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: "Labor", description: "", estimated_amount: "", actual_amount: "", status: "planned", notes: "" });
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.from("project_budget_items").select("*").eq("project_id", project.id).order("created_date").then(({ data }) => {
      setItems(data || []);
      setLoading(false);
    });
  }, []);

  const totalEst = items.reduce((s, i) => s + (parseFloat(i.estimated_amount) || 0), 0);
  const totalAct = items.reduce((s, i) => s + (parseFloat(i.actual_amount) || 0), 0);
  const variance = totalAct - totalEst;

  const handleAdd = async () => {
    setError("");
    if (!form.description) { setError("Description is required."); return; }
    setAdding(true);
    const { data, error: e } = await supabase.from("project_budget_items").insert({
      project_id: project.id,
      category: form.category,
      description: form.description,
      estimated_amount: parseFloat(form.estimated_amount) || 0,
      actual_amount: form.actual_amount ? parseFloat(form.actual_amount) : null,
      status: form.status,
      notes: form.notes || null,
    }).select().single();
    setAdding(false);
    if (e) { setError(e.message); return; }
    setItems(prev => [...prev, data]);
    setForm({ category: "Labor", description: "", estimated_amount: "", actual_amount: "", status: "planned", notes: "" });
    setShowForm(false);
  };

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Loader2 className="w-6 h-6 animate-spin" style={{ color: PRIMARY }} /></div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {[
          { label: "Total Estimated", value: totalEst, color: PRIMARY },
          { label: "Total Actual", value: totalAct, color: "#374151" },
          { label: "Variance", value: variance, color: variance > 0 ? "#b91c1c" : "#059669", icon: variance > 0 ? TrendingUp : TrendingDown },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} style={{ background: "white", border: "1px solid #e8eaf0", borderRadius: 14, padding: "16px 18px", boxShadow: "0 1px 4px rgba(15,23,42,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <p style={{ fontSize: 11, color: "#9ca3af", fontFamily: "'Plus Jakarta Sans', sans-serif", margin: "0 0 4px" }}>{s.label}</p>
                {Icon && <Icon className="w-4 h-4" style={{ color: s.color }} />}
              </div>
              <p style={{ fontSize: 20, fontWeight: 800, color: s.color, fontFamily: "'Manrope', sans-serif", margin: 0 }}>
                {variance < 0 && s.label === "Variance" ? "-" : ""}${Math.abs(s.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div style={{ background: "white", border: "1px solid #e8eaf0", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 4px rgba(15,23,42,0.06)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: "#191B23", fontFamily: "'Manrope', sans-serif", margin: 0 }}>Budget Items</h3>
          <button onClick={() => setShowForm(p => !p)}
            style={{ display: "flex", alignItems: "center", gap: 5, background: PRIMARY, color: "white", border: "none", borderRadius: 8, padding: "7px 14px", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <Plus className="w-3 h-3" /> Add Item
          </button>
        </div>

        {showForm && (
          <div style={{ padding: "16px 20px", background: "#f8faff", borderBottom: "1px solid #f0f0f0" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={inp}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Description" style={inp} />
              <input type="number" value={form.estimated_amount} onChange={e => setForm(p => ({ ...p, estimated_amount: e.target.value }))} placeholder="Estimated $" style={inp} />
              <input type="number" value={form.actual_amount} onChange={e => setForm(p => ({ ...p, actual_amount: e.target.value }))} placeholder="Actual $ (opt)" style={inp} />
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} style={{ ...inp, width: "auto" }}>
                {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
              <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Notes (optional)" style={{ ...inp, flex: 1 }} />
              <button onClick={handleAdd} disabled={adding}
                style={{ background: PRIMARY, color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", flexShrink: 0 }}>
                {adding ? "Adding..." : "Add"}
              </button>
            </div>
            {error && <p style={{ fontSize: 12, color: "#b91c1c", marginTop: 8, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{error}</p>}
          </div>
        )}

        {items.length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "#9ca3af", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>No budget items yet. Add your first item above.</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8faff" }}>
                {["Category", "Description", "Estimated", "Actual", "Status"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} style={{ borderTop: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "11px 14px", fontSize: 12, color: "#6b7280", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{item.category}</td>
                  <td style={{ padding: "11px 14px", fontSize: 13, color: "#191B23", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 }}>{item.description}</td>
                  <td style={{ padding: "11px 14px", fontSize: 12, color: "#374151", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>${Number(item.estimated_amount || 0).toLocaleString()}</td>
                  <td style={{ padding: "11px 14px", fontSize: 12, color: "#374151", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{item.actual_amount != null ? `$${Number(item.actual_amount).toLocaleString()}` : "—"}</td>
                  <td style={{ padding: "11px 14px" }}>
                    <span style={{ background: item.status === "paid" ? "#ecfdf5" : item.status === "committed" ? "#eff6ff" : "#f3f4f6", color: item.status === "paid" ? "#047857" : item.status === "committed" ? "#1e40af" : "#374151", borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const inp = { border: "1px solid #e0e4f0", borderRadius: 8, padding: "8px 10px", fontSize: 12, color: "#191B23", fontFamily: "'Plus Jakarta Sans', sans-serif", outline: "none", boxSizing: "border-box", background: "white", width: "100%" };