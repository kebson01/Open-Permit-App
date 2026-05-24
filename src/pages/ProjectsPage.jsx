import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Plus, FolderOpen, Loader2, ArrowLeft, ChevronRight } from "lucide-react";
import ProjectCard from "@/components/projects/ProjectCard";
import ProjectDetailView from "@/components/projects/ProjectDetailView";
import CreateProjectModal from "@/components/projects/CreateProjectModal";

const PRIMARY = "#004ac6";
const STATUS_FILTERS = ["All", "planning", "permitting", "in_progress", "completed", "on_hold"];
const STATUS_LABELS = { All: "All", planning: "Planning", permitting: "Permitting", in_progress: "In Progress", completed: "Completed", on_hold: "On Hold" };

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedProject, setSelectedProject] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const user = session?.user ?? null;
      setCurrentUser(user);
      setAuthLoading(false);
      if (!user) { navigate("/login"); return; }
      await loadData(user);
    });
  }, []);

  const loadData = async (user) => {
    setLoading(true);
    const [{ data: p }, { data: g }] = await Promise.all([
      supabase.from("projects").select("*").eq("owner_email", user.email).order("created_date", { ascending: false }),
      supabase.from("submission_guides").select("*").eq("user_email", user.email).order("created_date", { ascending: false }),
    ]);
    setProjects(p || []);
    setGuides(g || []);
    setLoading(false);
  };

  const onProjectCreated = (proj) => {
    setProjects(prev => [proj, ...prev]);
    setShowCreate(false);
    setSelectedProject(proj);
  };

  if (authLoading || loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <Loader2 className="w-7 h-7 animate-spin" style={{ color: PRIMARY }} />
    </div>
  );

  // ── Project detail view ──
  if (selectedProject) return (
    <ProjectDetailView
      project={selectedProject}
      currentUser={currentUser}
      guides={guides}
      onBack={() => setSelectedProject(null)}
      onProjectUpdated={(updated) => {
        setSelectedProject(updated);
        setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
      }}
    />
  );

  const filtered = activeFilter === "All" ? projects : projects.filter(p => p.status === activeFilter);
  const thisYear = new Date().getFullYear();
  const stats = [
    { label: "Total Projects", value: projects.length, color: PRIMARY },
    { label: "Active", value: projects.filter(p => p.status === "in_progress" || p.status === "permitting").length, color: "#006a61" },
    { label: "Completed This Year", value: projects.filter(p => p.status === "completed" && new Date(p.actual_completion_date || p.updated_date).getFullYear() === thisYear).length, color: "#059669" },
    { label: "Pending Permits", value: guides.filter(g => g.overall_status === "in_progress" || g.overall_status === "ready_to_submit").length, color: "#d97706" },
  ];

  return (
    <div style={{ background: "#f8f9ff", minHeight: "100vh", paddingBottom: 48 }}>
      {/* Header */}
      <div style={{ background: "white", borderBottom: "1px solid #e8eaf0", padding: "24px 24px 0" }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <h1 style={{ fontSize: 26, fontWeight: 800, fontFamily: "'Manrope', sans-serif", color: "#191B23", margin: 0 }}>My Projects</h1>
            <button onClick={() => setShowCreate(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, background: PRIMARY, color: "white", border: "none", borderRadius: 10, padding: "9px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <Plus className="w-4 h-4" /> New Project
            </button>
          </div>
          {/* Filter tabs */}
          <div style={{ display: "flex", gap: 2, borderBottom: "2px solid #f0f0f0" }}>
            {STATUS_FILTERS.map(f => (
              <button key={f} onClick={() => setActiveFilter(f)}
                style={{ padding: "8px 14px", border: "none", background: "none", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 13, color: activeFilter === f ? PRIMARY : "#6b7280", borderBottom: activeFilter === f ? `2px solid ${PRIMARY}` : "2px solid transparent", marginBottom: -2, transition: "all 0.15s" }}>
                {STATUS_LABELS[f]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pt-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {stats.map(s => (
            <div key={s.label} style={{ background: "white", border: "1px solid #e8eaf0", borderRadius: 14, padding: "16px 18px", boxShadow: "0 1px 4px rgba(15,23,42,0.06)" }}>
              <p style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: "'Manrope', sans-serif", margin: "0 0 2px" }}>{s.value}</p>
              <p style={{ fontSize: 11, color: "#6b7280", fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Projects grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 24px", background: "white", borderRadius: 16, border: "1px solid #e8eaf0" }}>
            <FolderOpen className="w-12 h-12 mx-auto mb-4" style={{ color: "#d1d5db" }} />
            <p style={{ fontSize: 17, fontWeight: 700, color: "#374151", fontFamily: "'Manrope', sans-serif", marginBottom: 8 }}>
              {activeFilter === "All" ? "No projects yet" : `No ${STATUS_LABELS[activeFilter].toLowerCase()} projects`}
            </p>
            <p style={{ fontSize: 14, color: "#9ca3af", fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 24, maxWidth: 360, margin: "0 auto 24px" }}>
              Start your first permit application to create a project
            </p>
            <Link to="/ApplyForPermit"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, background: PRIMARY, color: "white", padding: "10px 22px", borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: "none", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Apply for Permit <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map(p => (
              <ProjectCard key={p.id} project={p} onClick={() => setSelectedProject(p)} />
            ))}
          </div>
        )}
      </div>

      {showCreate && currentUser && (
        <CreateProjectModal
          currentUser={currentUser}
          onClose={() => setShowCreate(false)}
          onCreated={onProjectCreated}
        />
      )}
    </div>
  );
}