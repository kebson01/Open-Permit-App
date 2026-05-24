import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import ProjectOverviewTab from "./tabs/ProjectOverviewTab";
import ProjectPermitsTab from "./tabs/ProjectPermitsTab";
import ProjectTimelineTab from "./tabs/ProjectTimelineTab";
import ProjectTeamTab from "./tabs/ProjectTeamTab";
import ProjectBudgetTab from "./tabs/ProjectBudgetTab";

const PRIMARY = "#004ac6";

const STATUS_STYLES = {
  planning:    { bg: "#f3f4f6", color: "#374151", label: "Planning" },
  permitting:  { bg: "#fffbeb", color: "#92400e", label: "Permitting" },
  in_progress: { bg: "#eff6ff", color: "#1e40af", label: "In Progress" },
  completed:   { bg: "#ecfdf5", color: "#047857", label: "Completed" },
  on_hold:     { bg: "#fef2f2", color: "#b91c1c", label: "On Hold" },
};

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "permits", label: "Permit Applications" },
  { key: "timeline", label: "Timeline" },
  { key: "team", label: "Team" },
  { key: "budget", label: "Budget" },
];

export default function ProjectDetailView({ project, currentUser, guides, onBack, onProjectUpdated }) {
  const [activeTab, setActiveTab] = useState("overview");

  const st = STATUS_STYLES[project.status] || STATUS_STYLES.planning;
  const pct = Math.min(100, Math.max(0, project.progress_pct || 0));

  return (
    <div style={{ background: "#f8f9ff", minHeight: "100vh", paddingBottom: 48 }}>
      {/* Header */}
      <div style={{ background: "white", borderBottom: "1px solid #e8eaf0", padding: "16px 24px 0" }}>
        <div className="max-w-5xl mx-auto">
          <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", padding: "0 0 12px", fontWeight: 600 }}>
            <ArrowLeft className="w-4 h-4" /> My Projects
          </button>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Manrope', sans-serif", color: "#191B23", margin: 0 }}>{project.name}</h1>
                <span style={{ background: st.bg, color: st.color, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{st.label}</span>
              </div>
              {project.property_address && <p style={{ fontSize: 13, color: "#6b7280", fontFamily: "'Plus Jakarta Sans', sans-serif", margin: "0 0 8px" }}>{project.property_address}</p>}
              {/* Progress bar */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, maxWidth: 320 }}>
                <div style={{ flex: 1, height: 6, background: "#f0f0f0", borderRadius: 3 }}>
                  <div style={{ height: 6, background: pct === 100 ? "#059669" : PRIMARY, borderRadius: 3, width: `${pct}%` }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#374151", fontFamily: "'Plus Jakarta Sans', sans-serif", flexShrink: 0 }}>{pct}%</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 0, overflow: "auto" }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                style={{ padding: "10px 16px", border: "none", background: "none", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 13, color: activeTab === t.key ? PRIMARY : "#6b7280", borderBottom: activeTab === t.key ? `2px solid ${PRIMARY}` : "2px solid transparent", whiteSpace: "nowrap", transition: "all 0.15s" }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pt-6">
        {activeTab === "overview" && <ProjectOverviewTab project={project} onProjectUpdated={onProjectUpdated} />}
        {activeTab === "permits" && <ProjectPermitsTab project={project} guides={guides} currentUser={currentUser} />}
        {activeTab === "timeline" && <ProjectTimelineTab project={project} />}
        {activeTab === "team" && <ProjectTeamTab project={project} currentUser={currentUser} />}
        {activeTab === "budget" && <ProjectBudgetTab project={project} />}
      </div>
    </div>
  );
}