import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import * as db from "@/lib/db";
import AuthModal from "@/components/auth/AuthModal";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, FolderOpen, Search, Loader2, Home, Briefcase } from "lucide-react";
import NewProjectModal from "@/components/projects/NewProjectModal.jsx";
import HomeownerProjectCard from "@/components/projects/HomeownerProjectCard";
import ContractorProjectCard from "@/components/projects/ContractorProjectCard";
import AttentionBanner from "@/components/projects/AttentionBanner";

const CONTRACTOR_FILTERS = ["all", "permitting", "in_progress", "planning", "completed"];
const FILTER_LABELS = { all: "All", permitting: "Pending Permits", in_progress: "Active", planning: "Planning", completed: "Completed" };
const SORT_OPTIONS = [
  { value: "created_desc", label: "Date Created" },
  { value: "status", label: "Status" },
  { value: "deadline", label: "Deadline" },
];

function RoleOnboarding({ onSelect, saving }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">How are you using OpenPermit?</h1>
          <p className="text-gray-500 text-sm">We'll tailor your experience based on your answer. You can change this later in account settings.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => onSelect("user")}
            disabled={saving}
            className="group p-6 bg-white rounded-2xl border-2 border-gray-200 hover:border-blue-400 hover:shadow-md transition-all text-left disabled:opacity-60"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
              <Home className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-1">I'm a Homeowner</h3>
            <p className="text-sm text-gray-500 leading-snug">I'm managing permits for my own property</p>
          </button>
          <button
            onClick={() => onSelect("contractor")}
            disabled={saving}
            className="group p-6 bg-white rounded-2xl border-2 border-gray-200 hover:border-orange-400 hover:shadow-md transition-all text-left disabled:opacity-60"
          >
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mb-4 group-hover:bg-orange-100 transition-colors">
              <Briefcase className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-1">I'm a Contractor</h3>
            <p className="text-sm text-gray-500 leading-snug">I manage permits for multiple clients</p>
          </button>
        </div>
        {saving && <div className="flex justify-center mt-6"><Loader2 className="w-5 h-5 animate-spin text-blue-400" /></div>}
      </div>
    </div>
  );
}

export default function ProjectDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [roleSelecting, setRoleSelecting] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("created_desc");
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(user => {
      if (user) setCurrentUser(user);
      else setCurrentUser(null);
    }).catch(() => setCurrentUser(null)).finally(() => setAuthLoading(false));
  }, []);

  const handleRoleSelect = async (role) => {
    setRoleSelecting(true);
    await base44.auth.updateMe({ role });
    setCurrentUser(prev => ({ ...prev, role }));
    setRoleSelecting(false);
  };

  const viewRole = currentUser?.role === "contractor" ? "contractor" : "homeowner";
  const hasSetRole = currentUser?.role === "contractor" || currentUser?.role === "user" || currentUser?.role === "admin";

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects", currentUser?.email],
    queryFn: () => db.Project.filter({ owner_email: currentUser.email }, "-created_date"),
    enabled: !!currentUser,
  });

  const filtered = projects
    .filter(p => {
      const q = search.toLowerCase();
      const matchSearch = !search ||
        p.name?.toLowerCase().includes(q) ||
        p.property_address?.toLowerCase().includes(q) ||
        p.client_name?.toLowerCase().includes(q) ||
        p.city_name?.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sort === "status") return (a.status || "").localeCompare(b.status || "");
      if (sort === "deadline") return (a.target_completion_date || "9999").localeCompare(b.target_completion_date || "9999");
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

  const activeProjects = projects.filter(p => p.status !== "completed" && p.status !== "on_hold").length;
  const activeClients = [...new Set(projects.map(p => p.client_name).filter(Boolean))].length;

  const goToProject = (p) => { window.location.href = `/ProjectDetail?id=${p.id}`; };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  if (!currentUser) {
    return <AuthModal onClose={() => window.location.href = "/"} />;
  }

  // Show onboarding if role not yet determined (new users default to "user" role only after going through this)
  // Admin users skip onboarding
  if (!hasSetRole) {
    return <RoleOnboarding onSelect={handleRoleSelect} saving={roleSelecting} />;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f9f9fc" }}>
      {/* Hero Header */}
      <div className="px-5 pt-8 pb-7" style={{ background: "#00020c" }}>
        <div className="max-w-5xl mx-auto flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.45)" }}>
              {viewRole === "contractor" ? "Contractor Portal" : "My Projects"}
            </p>
            {viewRole === "homeowner" ? (
              <>
                <h1 className="font-bold text-white leading-tight mb-1" style={{ fontSize: "clamp(22px, 4vw, 30px)" }}>My Permit Projects</h1>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>Track your permits, documents, and next steps</p>
              </>
            ) : (
              <>
                <h1 className="font-bold text-white leading-tight mb-1" style={{ fontSize: "clamp(22px, 4vw, 30px)" }}>Project Portfolio</h1>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {activeProjects} active project{activeProjects !== 1 ? "s" : ""}
                  {activeClients > 0 ? ` · ${activeClients} client${activeClients !== 1 ? "s" : ""}` : ""}
                </p>
              </>
            )}
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white mt-1"
            style={{ background: "#0058be" }}
          >
            <Plus className="w-4 h-4" />
            {viewRole === "contractor" ? "New Project" : "New Project"}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Contractor: Attention Banner */}
        {viewRole === "contractor" && projects.length > 0 && (
          <AttentionBanner projects={projects} onProjectClick={goToProject} />
        )}

        {/* Contractor: Filters + sort */}
        {viewRole === "contractor" && (
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                placeholder="Search by client name or address..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {CONTRACTOR_FILTERS.map(f => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap border transition-colors ${
                    statusFilter === f ? "bg-blue-600 text-white border-blue-600" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {FILTER_LABELS[f]}
                </button>
              ))}
            </div>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none text-gray-600"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        )}

        {/* Homeowner: simple search */}
        {viewRole === "homeowner" && projects.length > 0 && (
          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
              placeholder="Search projects..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        )}

        {/* Project list */}
        {isLoading ? (
          <div className="text-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">
              {projects.length === 0 ? "No projects yet" : "No projects match your search"}
            </p>
            {projects.length === 0 && (
              <button
                onClick={() => setShowNew(true)}
                className="mt-4 px-5 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: "#3B82F6" }}
              >
                + {viewRole === "contractor" ? "Add your first project" : "Start your first project"}
              </button>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {filtered.map(p =>
              viewRole === "contractor" ? (
                <ContractorProjectCard key={p.id} project={p} selected={false} onClick={() => goToProject(p)} />
              ) : (
                <HomeownerProjectCard key={p.id} project={p} selected={false} onClick={() => goToProject(p)} />
              )
            )}
          </div>
        )}
      </div>

      {showNew && (
        <NewProjectModal
          user={currentUser}
          onClose={() => setShowNew(false)}
          onCreated={(p) => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            setShowNew(false);
            window.location.href = `/ProjectDetail?id=${p.id}`;
          }}
        />
      )}
    </div>
  );
}