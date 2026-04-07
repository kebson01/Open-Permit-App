import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { FolderOpen, Plus, DollarSign, Building2, ChevronRight, Trash2, X } from "lucide-react";

const COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#f97316", "#06b6d4", "#ec4899"];

function GroupCard({ group, projects, onDelete }) {
  const groupProjects = projects.filter(p => p.group_id === group.id);
  const totalCost = groupProjects.reduce((s, p) => s + (p.estimated_cost || 0), 0);
  const statusCounts = groupProjects.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="h-2" style={{ backgroundColor: group.color || "#3b82f6" }} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: (group.color || "#3b82f6") + "20" }}>
              <FolderOpen className="w-5 h-5" style={{ color: group.color || "#3b82f6" }} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{group.name}</h3>
              {group.description && <p className="text-xs text-gray-400 mt-0.5">{group.description}</p>}
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
            onClick={() => onDelete(group)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-gray-50 rounded-lg px-3 py-2">
            <p className="text-xs text-gray-400">Projects</p>
            <p className="text-lg font-bold text-gray-800">{groupProjects.length}</p>
          </div>
          <div className="bg-gray-50 rounded-lg px-3 py-2">
            <p className="text-xs text-gray-400">Total Est. Cost</p>
            <p className="text-lg font-bold text-gray-800">${totalCost.toLocaleString()}</p>
          </div>
        </div>

        {Object.keys(statusCounts).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {Object.entries(statusCounts).map(([status, count]) => (
              <span key={status} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {count} {status.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        )}

        {groupProjects.length > 0 && (
          <div className="space-y-1.5">
            {groupProjects.slice(0, 3).map(p => (
              <Link key={p.id} to={`/ProjectDetail?id=${p.id}`}
                className="flex items-center justify-between gap-2 px-3 py-2 bg-gray-50 hover:bg-blue-50 rounded-lg text-xs transition-colors group">
                <span className="font-medium text-gray-700 truncate group-hover:text-blue-700">{p.name}</span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-500 flex-shrink-0" />
              </Link>
            ))}
            {groupProjects.length > 3 && (
              <p className="text-xs text-gray-400 text-center pt-1">+{groupProjects.length - 3} more projects</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PropertyGroupPanel({ currentUser, projects }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", color: COLORS[0] });

  const { data: groups = [] } = useQuery({
    queryKey: ["groups", currentUser?.email],
    queryFn: () => base44.entities.PropertyGroup.filter({ owner_email: currentUser.email }),
    enabled: !!currentUser,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PropertyGroup.create({ ...data, owner_email: currentUser.email }),
    onSuccess: () => { qc.invalidateQueries(["groups"]); setShowForm(false); setForm({ name: "", description: "", color: COLORS[0] }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PropertyGroup.delete(id),
    onSuccess: () => qc.invalidateQueries(["groups"]),
  });

  const handleDelete = (group) => {
    if (!window.confirm(`Delete group "${group.name}"? Projects in this group will not be deleted.`)) return;
    deleteMutation.mutate(group.id);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Property Groups</h2>
          <p className="text-xs text-gray-400">Group projects by property or portfolio to track combined costs</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="bg-indigo-600 hover:bg-indigo-700 gap-1">
          <Plus className="w-3.5 h-3.5" /> New Group
        </Button>
      </div>

      {showForm && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-medium text-indigo-800 text-sm">Create Property Group</p>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-indigo-400" /></button>
          </div>
          <div className="space-y-3">
            <Input placeholder="Group name (e.g. '123 Main St', 'Rental Portfolio')" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            <Input placeholder="Description (optional)" value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Group color</p>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setForm(p => ({ ...p, color: c }))}
                    className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${form.color === c ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : ""}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <Button size="sm" onClick={() => createMutation.mutate(form)} disabled={!form.name.trim()} className="bg-indigo-600 hover:bg-indigo-700">
              Create Group
            </Button>
          </div>
        </div>
      )}

      {groups.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <FolderOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500 font-medium">No groups yet</p>
          <p className="text-xs text-gray-400 mt-1">Create a group to combine related projects and track their total costs together</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map(g => (
            <GroupCard key={g.id} group={g} projects={projects} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}