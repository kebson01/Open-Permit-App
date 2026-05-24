import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, CheckCircle2, Circle, Clock } from "lucide-react";

const DEFAULT_MILESTONES = [
  { title: "Application Submitted", status: "pending" },
  { title: "Plan Review Started", status: "pending" },
  { title: "Plan Review Approved", status: "pending" },
  { title: "Permit Issued", status: "pending" },
  { title: "Inspections", status: "pending" },
  { title: "Final Approval / C/O", status: "pending" },
];

const RESULT_STYLES = {
  passed: { bg: "#ecfdf5", color: "#047857", label: "Passed" },
  failed: { bg: "#fef2f2", color: "#b91c1c", label: "Failed" },
  partial: { bg: "#fffbeb", color: "#92400e", label: "Partial" },
  re_inspection_required: { bg: "#fff7ed", color: "#c2410c", label: "Re-Inspection" },
};

export default function ProjectTimelineTab({ project }) {
  const [milestones, setMilestones] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [{ data: m }, { data: i }] = await Promise.all([
        supabase.from("permit_milestones").select("*").eq("project_id", project.id).order("display_order"),
        project.folio_number
          ? supabase.from("inspection_reports").select("*").eq("folio_number", project.folio_number).order("inspection_date", { ascending: false }).limit(10)
          : { data: [] },
      ]);
      setMilestones(m || []);
      setInspections(i || []);
      setLoading(false);
    };
    load();
  }, [project.id]);

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Loader2 className="w-6 h-6 animate-spin" style={{ color: "#004ac6" }} /></div>;

  const displayMilestones = milestones.length > 0 ? milestones : DEFAULT_MILESTONES;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 600 }}>
      {/* Timeline */}
      <div style={{ background: "white", border: "1px solid #e8eaf0", borderRadius: 16, padding: "24px", boxShadow: "0 1px 4px rgba(15,23,42,0.06)" }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: "#191B23", fontFamily: "'Manrope', sans-serif", marginBottom: 20 }}>Permit Timeline</h3>
        <div style={{ position: "relative" }}>
          {displayMilestones.map((m, i) => {
            const isDone = m.status === "completed";
            const isActive = m.status === "in_progress";
            return (
              <div key={i} style={{ display: "flex", gap: 14, marginBottom: i < displayMilestones.length - 1 ? 0 : 0 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: isDone ? "#059669" : isActive ? "#004ac6" : "#f3f4f6", border: `2px solid ${isDone ? "#059669" : isActive ? "#004ac6" : "#e0e0e0"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, zIndex: 1 }}>
                    {isDone ? <CheckCircle2 className="w-4 h-4 text-white" /> : isActive ? <Clock className="w-4 h-4 text-white" /> : <Circle className="w-4 h-4" style={{ color: "#d1d5db" }} />}
                  </div>
                  {i < displayMilestones.length - 1 && (
                    <div style={{ width: 2, flex: 1, minHeight: 24, background: isDone ? "#059669" : "#e0e0e0", margin: "2px 0" }} />
                  )}
                </div>
                <div style={{ paddingBottom: i < displayMilestones.length - 1 ? 20 : 0, flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: isDone ? "#059669" : isActive ? "#004ac6" : "#374151", fontFamily: "'Plus Jakarta Sans', sans-serif", margin: "6px 0 2px" }}>{m.title}</p>
                  {m.date && <p style={{ fontSize: 11, color: "#9ca3af", fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0 }}>{m.date}</p>}
                  {m.notes && <p style={{ fontSize: 11, color: "#6b7280", fontFamily: "'Plus Jakarta Sans', sans-serif", margin: "3px 0 0" }}>{m.notes}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inspection activity */}
      {inspections.length > 0 && (
        <div style={{ background: "white", border: "1px solid #e8eaf0", borderRadius: 16, padding: "24px", boxShadow: "0 1px 4px rgba(15,23,42,0.06)" }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: "#191B23", fontFamily: "'Manrope', sans-serif", marginBottom: 14 }}>Inspection Activity</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {inspections.map(i => {
              const rs = RESULT_STYLES[i.result] || { bg: "#f9fafb", color: "#6b7280", label: i.result };
              return (
                <div key={i.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "#f8faff", borderRadius: 10, gap: 10 }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0 }}>{i.inspection_type}</p>
                    <p style={{ fontSize: 11, color: "#9ca3af", fontFamily: "'Plus Jakarta Sans', sans-serif", margin: "2px 0 0" }}>{i.inspection_date} · {i.inspector_name || "—"}</p>
                  </div>
                  <span style={{ background: rs.bg, color: rs.color, borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", flexShrink: 0 }}>{rs.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}