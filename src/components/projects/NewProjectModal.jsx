import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Loader2 } from "lucide-react";

const PROJECT_TYPES = [
  { value: "new_construction", label: "New Construction" },
  { value: "addition", label: "Addition" },
  { value: "remodel", label: "Remodel / Renovation" },
  { value: "roofing", label: "Roofing" },
  { value: "electrical", label: "Electrical" },
  { value: "plumbing", label: "Plumbing" },
  { value: "pool", label: "Pool" },
  { value: "fence", label: "Fence" },
  { value: "demolition", label: "Demolition" },
  { value: "commercial", label: "Commercial" },
  { value: "other", label: "Other" },
];

export default function NewProjectModal({ user, onClose, onCreated }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    project_type: "",
    city_id: "",
    city_name: "",
    property_address: "",
    folio_number: "",
    estimated_cost: "",
    description: "",
    group_id: "",
    is_contractor_project: false,
    contractor_license: "",
    client_name: "",
    client_email: "",
  });
  const [saving, setSaving] = useState(false);

  const { data: cities = [] } = useQuery({
    queryKey: ["cities"],
    queryFn: () => base44.entities.City.list(),
  });

  const { data: groups = [] } = useQuery({
    queryKey: ["groups", user?.email],
    queryFn: () => base44.entities.PropertyGroup.filter({ owner_email: user.email }),
    enabled: !!user?.email,
  });

  const isContractor = user?.role === "contractor";

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleCityChange = (cityId) => {
    const city = cities.find(c => c.id === cityId);
    set("city_id", cityId);
    set("city_name", city?.name || "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.project_type || !form.city_name) return;
    setSaving(true);
    const payload = {
      ...form,
      estimated_cost: form.estimated_cost ? parseFloat(form.estimated_cost) : null,
      owner_email: user?.email,
      is_contractor_project: isContractor || form.is_contractor_project,
      status: "planning",
    };
    // Remove empty strings
    Object.keys(payload).forEach(k => { if (payload[k] === "") delete payload[k]; });
    const created = await base44.entities.Project.create(payload);
    setSaving(false);
    onCreated(created);
    navigate(`/ProjectDetail?id=${created.id}`);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">New Project</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Name */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Project Name *</label>
            <Input placeholder="e.g. Master Bath Remodel" value={form.name} onChange={e => set("name", e.target.value)} required />
          </div>

          {/* Type */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Project Type *</label>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
              value={form.project_type}
              onChange={e => set("project_type", e.target.value)}
              required
            >
              <option value="">Select type...</option>
              {PROJECT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {/* City */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">City / Municipality *</label>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
              value={form.city_id}
              onChange={e => handleCityChange(e.target.value)}
              required
            >
              <option value="">Select city...</option>
              {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Address (optional) */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Property Address <span className="text-gray-400 font-normal">(optional)</span></label>
            <Input placeholder="123 Main St, Weston, FL" value={form.property_address} onChange={e => set("property_address", e.target.value)} />
          </div>

          {/* Folio (optional) */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Folio Number <span className="text-gray-400 font-normal">(optional)</span></label>
            <Input placeholder="e.g. 504010010010" value={form.folio_number} onChange={e => set("folio_number", e.target.value)} />
          </div>

          {/* Estimated cost */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Estimated Cost <span className="text-gray-400 font-normal">(optional)</span></label>
            <Input type="number" placeholder="e.g. 25000" value={form.estimated_cost} onChange={e => set("estimated_cost", e.target.value)} />
          </div>

          {/* Group */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Property Group <span className="text-gray-400 font-normal">(optional)</span></label>
            {groups.length === 0 ? (
              <p className="text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                No groups yet — create one from <strong>My Projects → Property Groups</strong> tab first.
              </p>
            ) : (
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                value={form.group_id}
                onChange={e => set("group_id", e.target.value)}
              >
                <option value="">No group</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Description <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
              rows={3}
              placeholder="Brief description of the project..."
              value={form.description}
              onChange={e => set("description", e.target.value)}
            />
          </div>

          {/* Contractor extras */}
          {isContractor && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Contractor Details</p>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">License Number</label>
                <Input placeholder="CGC123456" value={form.contractor_license} onChange={e => set("contractor_license", e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Client Name</label>
                <Input placeholder="Client's full name" value={form.client_name} onChange={e => set("client_name", e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Client Email</label>
                <Input type="email" placeholder="client@email.com" value={form.client_email} onChange={e => set("client_email", e.target.value)} />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Project"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}