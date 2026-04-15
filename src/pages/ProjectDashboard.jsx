import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, FolderOpen, Search, Loader2, UserPlus } from "lucide-react";
import NewProjectModal from "@/components/projects/NewProjectModal";
import RoleToggle from "@/components/projects/RoleToggle";
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

export default function ProjectDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [viewRole, setViewRole] = useState("homeowner");
  const [showNew, setShowNew] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("created_desc");
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me()
      .then(u => {
        setCurrentUser(u);
        if (u?.role === "contractor") setViewRole("contractor");
      })
      .catch(() => setCurrentUser(null))
      .finally(() => setAuthLoading(false));
  }, []);

  const handleRoleChange = async (role) => {
    setViewRole(role);
    if (currentUser) {
      try { await base44.auth.updateMe({ preferred_view: role }); } catch {}
    }
  };

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects", currentUser?.email],
    queryFn: () => base44.entities.Project.filter({ owner_email: currentUser.email }),
    enabled: !!currentUser,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Project.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
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
      return new Date(b.created_date || 0) - new Date(a.created_date || 0);
    });

  const activeProjects = projects.filter(p => p.status !== "completed" && p.status !== "on_hold").length;
  const activeClients = [...new Set(projects.map(p => p.client_name).filter(Boolean))].length;

  const goToProject = (p) => { window.location.href = `/ProjectDetail?id=${p.id}`; };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-5">
            <FolderOpen className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Track Your Permit Projects</h2>
          <p className="text-gray-500 mb-6 text-sm leading-relaxed">
            Create a free account to start tracking your permit projects, save your document checklist, and manage timelines.
          </p>
          <button onClick={() => base44.auth.redirectToLogin(window.location.href)}
            className="w-full h-11 text-sm font-semibold text-white rounded-xl" style={{ background: "#3B82F6" }}>
            Create Account / Log In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Role Toggle */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <RoleToggle role={viewRole} onChange={handleRoleChange} />
          <div className="flex gap-2">
            {viewRole === "contractor" && (
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:border-gray-300">
                <UserPlus className="w-4 h-4" /> Import Client
              </button>
            )}
            <button
              onClick={() => setShowNew(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: "#3B82F6" }}
            >
              <Plus className="w-4 h-4" />
              {viewRole === "contractor" ? "New Project" : "Start New Project"}
            </button>
          </div>
        </div>

        {/* Page Header */}
        <div className="mb-6">
          {viewRole === "homeowner" ? (
            <>
              <h1 className="text-2xl font-bold text-gray-900">My Permit Projects</h1>
              <p className="text-gray-500 text-sm mt-0.5">Track your permits, documents, and next steps</p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900">Project Portfolio</h1>
              <p className="text-gray-500 text-sm mt-0.5">
                Managing {activeProjects} active project{activeProjects !== 1 ? "s" : ""}
                {activeClients > 0 ? ` across ${activeClients} client${activeClients !== 1 ? "s" : ""}` : ""}
              </p>
            </>
          )}
        </div>

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