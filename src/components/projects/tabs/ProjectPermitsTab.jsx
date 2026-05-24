import { Link } from "react-router-dom";
import { FileText, ChevronRight } from "lucide-react";

const PHASE_STYLES = {
  application:       { bg: "#f3f4f6", color: "#374151", label: "Application" },
  preparation:       { bg: "#fffbeb", color: "#92400e", label: "Preparation" },
  guided_submission: { bg: "#eff6ff", color: "#1e40af", label: "Guided Submission" },
  completed:         { bg: "#ecfdf5", color: "#047857", label: "Completed" },
};
const STATUS_STYLES = {
  not_started:     { bg: "#f3f4f6", color: "#374151", label: "Not Started" },
  in_progress:     { bg: "#eff6ff", color: "#1e40af", label: "In Progress" },
  ready_to_submit: { bg: "#fffbeb", color: "#92400e", label: "Ready to Submit" },
  submitted:       { bg: "#ecfdf5", color: "#047857", label: "Submitted" },
  approved:        { bg: "#f0fdf4", color: "#166534", label: "Approved" },
  rejected:        { bg: "#fef2f2", color: "#b91c1c", label: "Rejected" },
};
const PRIMARY = "#004ac6";

export default function ProjectPermitsTab({ project, guides, currentUser }) {
  const relevant = guides.filter(g =>
    (project.folio_number && g.folio_number === project.folio_number) ||
    g.user_email === currentUser?.email
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Link to="/ApplyForPermit" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: PRIMARY, color: "white", padding: "9px 18px", borderRadius: 10, fontWeight: 700, fontSize: 13, textDecoration: "none", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          + Start New Application
        </Link>
      </div>

      {relevant.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 24px", background: "white", borderRadius: 14, border: "1px solid #e8eaf0" }}>
          <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: "#d1d5db" }} />
          <p style={{ fontSize: 14, color: "#9ca3af", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>No permit applications linked to this project yet.</p>
        </div>
      ) : relevant.map(g => {
        const ph = PHASE_STYLES[g.phase] || PHASE_STYLES.application;
        const st = STATUS_STYLES[g.overall_status] || STATUS_STYLES.not_started;
        const isSubmitted = g.overall_status === "submitted" || g.overall_status === "approved";
        return (
          <div key={g.id} style={{ background: "white", border: "1px solid #e8eaf0", borderRadius: 14, padding: "18px 20px", boxShadow: "0 1px 4px rgba(15,23,42,0.04)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: "#191B23", fontFamily: "'Manrope', sans-serif", margin: "0 0 4px" }}>{g.permit_type_name || "Permit Application"}</h4>
                <p style={{ fontSize: 12, color: "#6b7280", fontFamily: "'Plus Jakarta Sans', sans-serif", margin: "0 0 8px" }}>{g.city_name}</p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                  <span style={{ background: ph.bg, color: ph.color, borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{ph.label}</span>
                  <span style={{ background: st.bg, color: st.color, borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{st.label}</span>
                </div>
                <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#6b7280", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {g.questions_total > 0 && <span>Questions: {g.questions_answered}/{g.questions_total}</span>}
                  {g.estimated_fee > 0 && <span>Est. fee: ${Number(g.estimated_fee).toFixed(2)}</span>}
                  {g.started_date && <span>Started: {g.started_date}</span>}
                  {g.submitted_date && <span>Submitted: {g.submitted_date}</span>}
                </div>
                {g.confirmation_number && <p style={{ fontSize: 11, color: "#059669", fontFamily: "'Plus Jakarta Sans', sans-serif", marginTop: 4 }}>Confirmation: {g.confirmation_number}</p>}
              </div>
              {!isSubmitted && (
                <Link to={`/ApplyForPermit`}
                  style={{ display: "flex", alignItems: "center", gap: 4, background: "#f0f4ff", color: PRIMARY, border: "1px solid #dbeafe", borderRadius: 8, padding: "7px 12px", fontWeight: 700, fontSize: 12, textDecoration: "none", fontFamily: "'Plus Jakarta Sans', sans-serif", flexShrink: 0 }}>
                  Resume <ChevronRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}