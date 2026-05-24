import { MapPin, Calendar, DollarSign } from "lucide-react";

const STATUS_STYLES = {
  planning:    { bg: "#f3f4f6", color: "#374151", label: "Planning" },
  permitting:  { bg: "#fffbeb", color: "#92400e", label: "Permitting" },
  in_progress: { bg: "#eff6ff", color: "#1e40af", label: "In Progress" },
  completed:   { bg: "#ecfdf5", color: "#047857", label: "Completed" },
  on_hold:     { bg: "#fef2f2", color: "#b91c1c", label: "On Hold" },
};

export default function ProjectCard({ project, onClick }) {
  const st = STATUS_STYLES[project.status] || STATUS_STYLES.planning;
  const pct = Math.min(100, Math.max(0, project.progress_pct || 0));

  return (
    <div onClick={onClick} style={{ background: "white", border: "1px solid #e8eaf0", borderRadius: 16, padding: "20px 22px", boxShadow: "0 1px 4px rgba(15,23,42,0.06)", cursor: "pointer", transition: "box-shadow 0.15s" }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,74,198,0.12)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 4px rgba(15,23,42,0.06)"}>
      {/* Title row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: "#191B23", fontFamily: "'Manrope', sans-serif", margin: 0, lineHeight: 1.3 }}>{project.name}</h3>
        <span style={{ background: st.bg, color: st.color, borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", flexShrink: 0 }}>{st.label}</span>
      </div>

      {/* Address */}
      {project.property_address && (
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
          <MapPin className="w-3 h-3" style={{ color: "#9ca3af", flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: "#6b7280", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{project.property_address}</span>
        </div>
      )}

      {/* City badge + info row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {project.city_name && (
          <span style={{ background: "#f0f4ff", color: "#004ac6", border: "1px solid #dbeafe", borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{project.city_name}</span>
        )}
        {project.estimated_cost > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <DollarSign className="w-3 h-3" style={{ color: "#9ca3af" }} />
            <span style={{ fontSize: 11, color: "#6b7280", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{Number(project.estimated_cost).toLocaleString()}</span>
          </div>
        )}
        {project.start_date && (
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <Calendar className="w-3 h-3" style={{ color: "#9ca3af" }} />
            <span style={{ fontSize: 11, color: "#6b7280", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{project.start_date}</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 10, color: "#9ca3af", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Progress</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#374151", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{pct}%</span>
        </div>
        <div style={{ height: 6, background: "#f0f0f0", borderRadius: 3 }}>
          <div style={{ height: 6, background: pct === 100 ? "#059669" : "#004ac6", borderRadius: 3, width: `${pct}%`, transition: "width 0.3s" }} />
        </div>
      </div>

      <button style={{ width: "100%", background: "#f8faff", color: "#004ac6", border: "1px solid #dbeafe", borderRadius: 8, padding: "8px", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        View Details →
      </button>
    </div>
  );
}