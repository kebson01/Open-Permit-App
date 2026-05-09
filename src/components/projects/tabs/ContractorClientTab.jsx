import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Mail, Phone, Building2, CheckCircle, Clock, Trash2, Loader2 } from "lucide-react";

const STATUS_STYLES = {
  active:   "bg-green-100 text-green-700",
  invited:  "bg-yellow-100 text-yellow-700",
  inactive: "bg-gray-100 text-gray-500",
};

export default function ContractorClientTab({ project, currentUser, onUpdate }) {
  const [showInvite, setShowInvite] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", role: "homeowner" });
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: collaborators = [] } = useQuery({
    queryKey: ["collaborators", project.id],
    queryFn: () => base44.entities.ProjectCollaborator.filter({ project_id: project.id }),
  });

  const handleInvite = async (e) => {
    e.preventDefault();
    setSaving(true);
    await base44.entities.ProjectCollaborator.create({
      project_id: project.id,
      name: form.name,
      email: form.email,
      phone: form.phone || undefined,
      company: form.company || undefined,
      role: form.role,
      status: "invited",
      invited_by: currentUser?.email,
    });
    queryClient.invalidateQueries({ queryKey: ["collaborators", project.id] });
    setForm({ name: "", email: "", phone: "", company: "", role: "homeowner" });
    setShowInvite(false);
    setSaving(false);
  };

  const removeCollaborator = async (id) => {
    await base44.entities.ProjectCollaborator.delete(id);
    queryClient.invalidateQueries({ queryKey: ["collaborators", project.id] });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900">Client & Team</h3>
        <button
          onClick={() => setShowInvite(!showInvite)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
          style={{ background: "#f97316" }}
        >
          <UserPlus className="w-3.5 h-3.5" /> Add Person
        </button>
      </div>

      {(project.client_name || project.client_email) && (
        <div className="mb-4 p-4 bg-orange-50 rounded-xl border border-orange-100">
          <p className="text-xs font-semibold text-orange-700 mb-2">Primary Client</p>
          <div className="space-y-1 text-sm text-gray-700">
            {project.client_name && <p className="font-medium">{project.client_name}</p>}
            {project.client_email && (
              <p className="flex items-center gap-1.5 text-xs text-gray-500">
                <Mail className="w-3.5 h-3.5" /> {project.client_email}
              </p>
            )}
          </div>
        </div>
      )}

      {showInvite && (
        <form onSubmit={handleInvite} className="mb-4 p-4 bg-orange-50 rounded-xl border border-orange-100 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input required placeholder="Full name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-orange-400" />
            <input required type="email" placeholder="Email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-orange-400" />
            <input placeholder="Phone (optional)" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-orange-400" />
            <input placeholder="Company (optional)" value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-orange-400" />
            <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
              className="col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-orange-400">
              <option value="homeowner">Homeowner / Client</option>
              <option value="contractor">Sub-Contractor</option>
              <option value="architect">Architect</option>
              <option value="inspector">Inspector</option>
              <option value="vendor">Vendor</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="px-4 py-1.5 text-xs font-semibold text-white rounded-lg disabled:opacity-60" style={{ background: "#f97316" }}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Add"}
            </button>
            <button type="button" onClick={() => setShowInvite(false)} className="px-4 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600">Cancel</button>
          </div>
        </form>
      )}

      {collaborators.length === 0 && !project.client_name ? (
        <div className="text-center py-8 space-y-2">
          <p className="text-gray-500 text-sm font-medium">No team members added yet.</p>
          <button onClick={() => setShowInvite(true)} className="text-xs text-white px-4 py-2 rounded-xl font-semibold" style={{ background: "#f97316" }}>
            Invite your client
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {collaborators.map(c => (
            <div key={c.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-orange-600">{(c.name || c.email || "?")[0].toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 truncate">{c.name || c.email}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${STATUS_STYLES[c.status] || STATUS_STYLES.invited}`}>
                    {c.status === "active" ? <span className="flex items-center gap-0.5"><CheckCircle className="w-3 h-3" /> Active</span> : <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {c.status}</span>}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                  <span className="capitalize">{c.role}</span>
                  {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</span>}
                  {c.company && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{c.company}</span>}
                  {c.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</span>}
                </div>
              </div>
              <button onClick={() => removeCollaborator(c.id)} className="text-gray-300 hover:text-red-400 p-1 flex-shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}