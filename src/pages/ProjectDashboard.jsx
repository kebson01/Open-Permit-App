import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, FolderOpen, Search, Filter, Loader2 } from "lucide-react";
import ProjectCard from "@/components/projects/ProjectCard";
import NewProjectModal from "@/components/projects/NewProjectModal";

const STATUS_FILTERS = ["all", "planning", "permitting", "in_progress", "completed", "on_hold"];

export default function ProjectDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-sm">
          <FolderOpen className="w-14 h-14 text-blue-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Sign In to View Projects</h2>
          <p className="text-gray-500 mb-6 text-sm">Create and manage your permit projects, track requirements, and estimate fees — all in one place.</p>
          <Button onClick={() => base44.auth.redirectToLogin(window.location.href)} className="bg-blue-600 hover:bg-blue-700 w-full">
            Sign In / Register
          </Button>
        </div>
      </div>
    );
  }

  const isContractor = currentUser.role === "contractor";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Projects</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {isContractor ? "Manage your client permit projects" : "Track your home permit projects"}
            </p>
          </div>
          <Button onClick={() => setShowNew(true)} className="bg-blue-600 hover:bg-blue-700 gap-2">
            <Plus className="w-4 h-4" /> New Project
          </Button>
        </div>

        {/* Contractor badge */}
        {isContractor && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 mb-5 flex items-center gap-3">
            <span className="text-purple-700 text-sm font-medium">Contractor Account</span>
            <span className="text-purple-500 text-xs">You have access to client management, license tracking, and multi-project features.</span>
          </div>
        )}

        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              className="pl-9"
              placeholder="Search by name, address, or city..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
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

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto" />
          </div>
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