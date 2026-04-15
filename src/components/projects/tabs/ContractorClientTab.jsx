import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Phone, Mail, Shield, Send, Loader2, Trash2 } from "lucide-react";

export default function ContractorClientTab({ project, currentUser, onUpdate }) {
  const [editingClient, setEditingClient] = useState(false);
  const [clientForm, setClientForm] = useState({
    client_name: project.client_name || "",
    client_email: project.client_email || "",
    contractor_license: project.contractor_license || "",
  });
  const [saving, setSaving] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberForm, setMemberForm] = useState({ name: "", role: "contractor", email: "", phone: "", company: "", license_number: "" });
  const queryClient = useQueryClient();

  const { data: collaborators = [] } = useQuery({
    queryKey: ["collaborators", project.id],
    queryFn: () => base44.entities.ProjectCollaborator.filter({ project_id: project.id }),
  });

  const saveClient = async () => {
    setSaving(true);
    await base44.entities.Project.update(project.id, clientForm);
    onUpdate && onUpdate(prev => ({ ...prev, ...clientForm }));
    setEditingClient(false);
    setSaving(false);
  };

  const addMember = async (e) => {
    e.preventDefault();
    setSaving(true);
    await base44.entities.ProjectCollaborator.create({
      ...memberForm,
      project_id: project.id,
      invited_by: currentUser?.email,
      status: "active",
    });
    queryClient.invalidateQueries({ queryKey: ["collaborators", project.id] });
    setMemberForm({ name: "", role: "contractor", email: "", phone: "", company: "", license_number: "" });
    setShowAddMember(false);
    setSaving(false);
  };

  const deleteMember = async (id) => {
    await base44.entities.ProjectCollaborator.delete(id);
    queryClient.invalidateQueries({ queryKey: ["collaborators", project.id] });
  };

  return (
    <div className="space-y-5">
      {/* Client Card */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900">Client</h3>
          <button onClick={() => setEditingClient(!editingClient)} className="text-xs text-blue-600 hover:underline">
            {editingClient ? "Cancel" : "Edit"}
          </button>
        </div>

        {editingClient ? (
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-2">
            <input placeholder="Client name" value={clientForm.client_name} onChange={e => setClientForm(p => ({ ...p, client_name: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white" />
            <input type="email" placeholder="Client email" value={clientForm.client_email} onChange={e => setClientForm(p => ({ ...p, client_email: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white" />
            <input placeholder="Your license number" value={clientForm.contractor_license} onChange={e => setClientForm(p => ({ ...p, contractor_license: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white" />
            <button onClick={saveClient} disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white rounded-xl disabled:opacity-60 flex items-center gap-1.5"
              style={{ background: "#3B82F6" }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save
            </button>
          </div>
        ) : project.client_name ? (
          <div className="p-4 bg-white rounded-xl border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <span className="font-bold text-blue-700 text-sm">{project.client_name[0]?.toUpperCase()}</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{project.client_name}</p>
                {project.client_email && (
                  <a href={`mailto:${project.client_email}`} className="text-xs text-blue-600 flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {project.client_email}
                  </a>
                )}
              </div>
            </div>
            {project.contractor_license && (
              <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                <Shield className="w-3.5 h-3.5 text-green-600" />
                License: <span className="font-semibold text-gray-700">{project.contractor_license}</span>
              </div>
            )}
            {project.client_email && (
              <button className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-xl border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors">
                <Send className="w-3.5 h-3.5" /> Send project invite to client
              </button>
            )}
          </div>
        ) : (
          <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center">
            <p className="text-sm text-gray-400">No client info yet</p>
            <button onClick={() => setEditingClient(true)} className="text-xs text-blue-600 mt-1 hover:underline">Add client details</button>
          </div>
        )}
      </div>

      {/* Subcontractors / Team */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900">Team & subcontractors</h3>
          <button onClick={() => setShowAddMember(!showAddMember)}
            className="flex items-center gap-1 text-xs font-semibold text-white px-3 py-1.5 rounded-xl"
            style={{ background: "#3B82F6" }}>
            <UserPlus className="w-3.5 h-3.5" /> Add
          </button>
        </div>

        {showAddMember && (
          <form onSubmit={addMember} className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input required placeholder="Name" value={memberForm.name} onChange={e => setMemberForm(p => ({ ...p, name: e.target.value }))}
                className="col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" />
              <select value={memberForm.role} onChange={e => setMemberForm(p => ({ ...p, role: e.target.value }))}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="contractor">Subcontractor</option>
                <option value="inspector">Inspector</option>
                <option value="architect">Architect</option>
                <option value="vendor">Vendor</option>
              </select>
              <input placeholder="License #" value={memberForm.license_number} onChange={e => setMemberForm(p => ({ ...p, license_number: e.target.value }))}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" />
              <input placeholder="Email" value={memberForm.email} onChange={e => setMemberForm(p => ({ ...p, email: e.target.value }))}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" />
              <input placeholder="Phone" value={memberForm.phone} onChange={e => setMemberForm(p => ({ ...p, phone: e.target.value }))}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="px-4 py-1.5 text-xs font-semibold text-white rounded-lg disabled:opacity-60" style={{ background: "#3B82F6" }}>Add</button>
              <button type="button" onClick={() => setShowAddMember(false)} className="px-4 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600">Cancel</button>
            </div>
          </form>
        )}

        {collaborators.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-sm text-gray-400">
            No team members yet
          </div>
        ) : (
          <div className="space-y-2">
            {collaborators.map(c => (
              <div key={c.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200">
                <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-orange-700">{c.name?.[0]?.toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-400 capitalize">{c.role} {c.license_number ? `· ${c.license_number}` : ""}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {c.phone && <a href={`tel:${c.phone}`}><Phone className="w-3.5 h-3.5 text-gray-400 hover:text-blue-600" /></a>}
                  {c.email && <a href={`mailto:${c.email}`}><Mail className="w-3.5 h-3.5 text-gray-400 hover:text-blue-600" /></a>}
                  <button onClick={() => deleteMember(c.id)}><Trash2 className="w-3.5 h-3.5 text-gray-300 hover:text-red-400" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}