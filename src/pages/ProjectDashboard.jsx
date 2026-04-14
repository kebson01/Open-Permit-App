import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, FolderOpen, Search, Loader2, LayoutGrid, List, TrendingUp, DollarSign, Clock, CheckCircle2, ClipboardCheck } from "lucide-react";
import { Link } from "react-router-dom";
import ProjectCard from "@/components/projects/ProjectCard";
import NewProjectModal from "@/components/projects/NewProjectModal";
import PropertyGroupPanel from "@/components/projects/PropertyGroupPanel";

const STATUS_FILTERS = ["all", "planning", "permitting", "in_progress", "completed", "on_hold"];

export default function ProjectDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeView, setActiveView] = useState("projects"); // "projects" | "groups"
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me()
      .then(setCurrentUser)
      .catch(() => setCurrentUser(null))
      .finally(() => setAuthLoading(false));
  }, []);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects", currentUser?.email],
    queryFn: () => base44.entities.Project.filter({ owner_email: currentUser.email }),
    enabled: !!currentUser,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Project.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });

  const handleDelete = (project) => {
    if (!window.confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
    deleteMutation.mutate(project.id);
  };

  const filtered = projects.filter(p => {
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.property_address?.toLowerCase().includes(search.toLowerCase()) ||
      p.city_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Stats
  const totalBudget = projects.reduce((s, p) => s + (p.estimated_cost || 0), 0);
  const inProgress  = projects.filter(p => p.status === "in_progress").length;
  const completed   = projects.filter(p => p.status === "completed").length;
  const permitting  = projects.filter(p => p.status === "permitting").length;

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
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => base44.auth.redirectToLogin(window.location.href)}
              className="w-full h-11 text-sm font-semibold text-white" style={{ background: "#3B82F6" }}
            >
              Create Account
            </Button>
            <Button
              onClick={() => base44.auth.redirectToLogin(window.location.href)}
              variant="outline"
              className="w-full h-11 text-sm font-semibold border-gray-300 text-gray-700"
            >
              Log In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Project Management</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {currentUser.role === "contractor" ? "Manage your client permit projects" : "Track your home permit projects"}
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/PermitWizard">
              <Button variant="outline" className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-50">
                <ClipboardCheck className="w-4 h-4" /> Permit Wizard
              </Button>
            </Link>
          <Button onClick={() => setShowNew(true)} className="gap-2 text-white" style={{ background: "#3B82F6" }}>
            <Plus className="w-4 h-4" /> New Project
          </Button>
          </div>
        </div>

        {/* Stats row */}
        {projects.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm">
              <p className="text-xs text-gray-400 mb-1">Total Projects</p>
              <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm">
              <p className="text-xs text-gray-400 mb-1 flex items-center justify-center gap-1"><DollarSign className="w-3 h-3" />Total Budget</p>
              <p className="text-2xl font-bold text-blue-600">${totalBudget.toLocaleString()}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm">
              <p className="text-xs text-gray-400 mb-1 flex items-center justify-center gap-1"><Clock className="w-3 h-3" />In Progress</p>
              <p className="text-2xl font-bold text-indigo-600">{inProgress + permitting}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm">
              <p className="text-xs text-gray-400 mb-1 flex items-center justify-center gap-1"><CheckCircle2 className="w-3 h-3" />Completed</p>
              <p className="text-2xl font-bold text-green-600">{completed}</p>
            </div>
          </div>
        )}

        {/* View toggle */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setActiveView("projects")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
              activeView === "projects" ? "bg-blue-600 text-white border-blue-600" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            <List className="w-4 h-4" /> All Projects
          </button>
          <button
            onClick={() => setActiveView("groups")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
              activeView === "groups" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            <LayoutGrid className="w-4 h-4" /> Property Groups
          </button>
        </div>

        {activeView === "groups" ? (
          <PropertyGroupPanel currentUser={currentUser} projects={projects} />
        ) : (
          <>
            {/* Search + filter */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input className="pl-9" placeholder="Search by name, address, or city..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {STATUS_FILTERS.map(s => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      statusFilter === s ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {s === "all" ? "All" : s.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">
                  {projects.length === 0 ? "No projects yet" : "No projects match your filters"}
                </p>
                {projects.length === 0 && (
                  <Button onClick={() => setShowNew(true)} variant="outline" className="mt-4 gap-2">
                    <Plus className="w-4 h-4" /> Create your first project
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(p => (
                  <ProjectCard key={p.id} project={p} onDelete={handleDelete} />
                ))}
              </div>
            )}
          </>
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