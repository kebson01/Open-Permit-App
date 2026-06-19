import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as db from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Users, Trash2, Phone, Mail, Building2, Shield } from "lucide-react";

const ROLES = ["contractor", "homeowner", "vendor", "inspector", "architect", "viewer"];

const ROLE_STYLES = {
  contractor: "bg-purple-100 text-purple-700",
  homeowner:  "bg-blue-100 text-blue-700",
  vendor:     "bg-orange-100 text-orange-700",
  inspector:  "bg-yellow-100 text-yellow-700",
  architect:  "bg-pink-100 text-pink-700",
  viewer:     "bg-gray-100 text-gray-600",
};

const EMPTY_FORM = { email: "", name: "", role: "contractor", company: "", phone: "", license_number: "" };

export default function ProjectCollaboratorsTab({ project, currentUser }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: collaborators = [] } = useQuery({
    queryKey: ["collaborators", project.id],
    queryFn: () => db.ProjectCollaborator.filter({ project_id: project.id }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => db.ProjectCollaborator.create({ ...data, project_id: project.id, invited_by: currentUser?.email }),
    onSuccess: () => { qc.invalidateQueries(["collaborators", project.id]); setShowForm(false); setForm(EMPTY_FORM); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.ProjectCollaborator.delete(id),
    onSuccess: () => qc.invalidateQueries(["collaborators", project.id]),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-800">Team & Collaborators</h3>
          <p className="text-xs text-gray-400 mt-0.5">Contractors, vendors, inspectors, and other contacts on this project</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700 gap-1">
          <Plus className="w-3.5 h-3.5" /> Add Person
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <Input placeholder="Full name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            <Input type="email" placeholder="Email address *" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Role *</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>
            <Input placeholder="Phone number" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Input placeholder="Company / Business name" value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} />
            <Input placeholder="License number (if contractor)" value={form.license_number} onChange={e => setForm(p => ({ ...p, license_number: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700">Add to Project</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {collaborators.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No collaborators yet. Add your contractors, vendors, and team members.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {collaborators.map(c => (
            <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {(c.name || c.email || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{c.name || c.email}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${ROLE_STYLES[c.role] || "bg-gray-100 text-gray-500"}`}>
                      {c.role}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
                  onClick={() => deleteMutation.mutate(c.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="mt-3 space-y-1.5">
                {c.email && (
                  <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-xs text-gray-500 hover:text-blue-600 transition-colors">
                    <Mail className="w-3.5 h-3.5" /> {c.email}
                  </a>
                )}
                {c.phone && (
                  <a href={`tel:${c.phone}`} className="flex items-center gap-2 text-xs text-gray-500 hover:text-blue-600 transition-colors">
                    <Phone className="w-3.5 h-3.5" /> {c.phone}
                  </a>
                )}
                {c.company && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Building2 className="w-3.5 h-3.5" /> {c.company}
                  </div>
                )}
                {c.license_number && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Shield className="w-3.5 h-3.5" /> License: {c.license_number}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}