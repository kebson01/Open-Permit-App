import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, UserMinus } from "lucide-react";

const PRIMARY = "#004ac6";
const ROLES = ["Contractor", "Private Provider", "Co-Owner", "View Only"];

export default function ProjectTeamTab({ project, currentUser }) {
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("View Only");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.from("project_collaborators").select("*").eq("project_id", project.id).then(({ data }) => {
      setCollaborators(data || []);
      setLoading(false);
    });
  }, []);

  const handleAdd = async () => {
    setError("");
    if (!email) { setError("Email is required."); return; }
    setAdding(true);
    const { data, error: e } = await supabase.from("project_collaborators").insert({
      project_id: project.id, email, role, added_by: currentUser.email,
    }).select().single();
    setAdding(false);
    if (e) { setError(e.message); return; }
    setCollaborators(prev => [...prev, data]);
    setEmail(""); setRole("View Only");
  };

  const handleRemove = async (id) => {
    await supabase.from("project_collaborators").delete().eq("id", id);
    setCollaborators(prev => prev.filter(c => c.id !== id));
  };

  const getInitials = (str) => (str || "?").slice(0, 2).toUpperCase();

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Loader2 className="w-6 h-6 animate-spin" style={{ color: PRIMARY }} /></div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 600 }}>
      {/* Collaborators list */}
      <div style={{ background: "white", border: "1px solid #e8eaf0", borderRadius: 16, padding: "20px 24px", boxShadow: "0 1px 4px rgba(15,23,42,0.06)" }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: "#191B23", fontFamily: "'Manrope', sans-serif", marginBottom: 14 }}>Team Members</h3>
        {collaborators.length === 0 ? (
          <p style={{ fontSize: 13, color: "#9ca3af", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>No team members added yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {collaborators.map(c => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "#f8faff", borderRadius: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: PRIMARY, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                  {getInitials(c.name || c.email)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#191B23", fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name || c.email}</p>
                  {c.name && <p style={{ fontSize: 11, color: "#9ca3af", fontFamily: "'Plus Jakarta Sans', sans-serif", margin: "1px 0 0" }}>{c.email}</p>}
                </div>
                <span style={{ background: "#f0f4ff", color: PRIMARY, borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", flexShrink: 0 }}>{c.role}</span>
                {currentUser?.email === project.owner_email && (
                  <button onClick={() => handleRemove(c.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#9ca3af" }}>
                    <UserMinus className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add collaborator */}
      <div style={{ background: "white", border: "1px solid #e8eaf0", borderRadius: 16, padding: "20px 24px", boxShadow: "0 1px 4px rgba(15,23,42,0.06)" }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: "#191B23", fontFamily: "'Manrope', sans-serif", marginBottom: 14 }}>Add Team Member</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" style={{ ...inp, flex: 2, minWidth: 180 }} />
          <select value={role} onChange={e => setRole(e.target.value)} style={{ ...inp, flex: 1, minWidth: 140 }}>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <button onClick={handleAdd} disabled={adding}
            style={{ background: PRIMARY, color: "white", border: "none", borderRadius: 8, padding: "9px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex", alignItems: "center", gap: 4, opacity: adding ? 0.7 : 1 }}>
            {adding ? <Loader2 className="w-3 h-3 animate-spin" /> : null} Add
          </button>
        </div>
        {error && <p style={{ fontSize: 12, color: "#b91c1c", background: "#fef2f2", borderRadius: 8, padding: "8px 12px", marginTop: 10, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{error}</p>}
      </div>
    </div>
  );
}

const inp = { border: "1px solid #e0e4f0", borderRadius: 8, padding: "9px 11px", fontSize: 13, color: "#191B23", fontFamily: "'Plus Jakarta Sans', sans-serif", outline: "none", boxSizing: "border-box", background: "white" };