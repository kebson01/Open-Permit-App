import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Phone, Mail, Building2, Loader2, Trash2 } from "lucide-react";

export default function HomeownerTeamTab({ project, currentUser }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", company: "", phone: "", email: "", role: "contractor" });
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: collaborators = [] } = useQuery({
    queryKey: ["collaborators", project.id],
    queryFn: () => base44.entities.ProjectCollaborator.filter({ project_id: project.id }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProjectCollaborator.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["collaborators", project.id] }),
  });

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    await base44.entities.ProjectCollaborator.create({
      ...form,
      project_id: project.id,
      invited_by: currentUser?.email,
      status: "active",
    });
    queryClient.invalidateQueries({ queryKey: ["collaborators", project.id] });
    setForm({ name: "", company: "", phone: "", email: "", role: "contractor" });
    setShowForm(false);
    setSaving(false);
  };

  const contractors = collaborators.filter(c => c.role === "contractor" || c.role === "architect");

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-900">Your team</h3>
          <p className="text-sm text-gray-500">Contractors and professionals on this project</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-white"
          style={{ background: "#3B82F6" }}
        >
          <UserPlus className="w-4 h-4" /> Add contractor
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="mb-5 p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-3">
          <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide">Add Team Member</p>
          <input
            required
            placeholder="Full name"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
          />
          <input
            placeholder="Company name (optional)"
            value={form.company}
            onChange={e => setForm(p => ({ ...p, company: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
          />
          <input
            placeholder="Phone number"
            value={form.phone}
            onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
          />
          <input
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
          />
          <select
            value={form.role}
            onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
          >
            <option value="contractor">Contractor</option>
            <option value="architect">Architect</option>
            <option value="inspector">Inspector</option>
            <option value="vendor">Vendor</option>
            <option value="viewer">Other</option>
          </select>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white flex items-center gap-1.5 disabled:opacity-60"
              style={{ background: "#3B82F6" }}
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Add to project
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-sm border border-gray-200 text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      )}

      {collaborators.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <UserPlus className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No team members yet</p>
          <p className="text-xs text-gray-400 mt-1">Add your contractor to keep their contact info handy</p>
        </div>
      ) : (
        <div className="space-y-3">
          {collaborators.map(c => (
            <div key={c.id} className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-200">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-blue-700">{c.name?.[0]?.toUpperCase() || "?"}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm text-gray-900">{c.name}</p>
                  <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full capitalize">{c.role}</span>
                </div>
                {c.company && (
                  <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><Building2 className="w-3 h-3" />{c.company}</p>
                )}
                <div className="flex flex-wrap gap-3 mt-1">
                  {c.phone && <a href={`tel:${c.phone}`} className="text-xs text-blue-600 flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</a>}
                  {c.email && <a href={`mailto:${c.email}`} className="text-xs text-blue-600 flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</a>}
                </div>
              </div>
              <button onClick={() => deleteMutation.mutate(c.id)} className="text-gray-300 hover:text-red-400 transition-colors p-1">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}