import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Loader2 } from "lucide-react";

const PROJECT_TYPES = [
  { value: "new_construction", label: "New Construction" },
  { value: "addition", label: "Addition" },
  { value: "remodel", label: "Remodel" },
  { value: "roofing", label: "Roofing" },
  { value: "electrical", label: "Electrical" },
  { value: "plumbing", label: "Plumbing" },
  { value: "pool", label: "Pool" },
  { value: "fence", label: "Fence" },
  { value: "demolition", label: "Demolition" },
  { value: "commercial", label: "Commercial" },
  { value: "other", label: "Other" },
];

const CITIES = ["Weston", "Coral Springs", "Fort Lauderdale", "Hollywood", "Cooper City", "Pembroke Pines", "Miramar", "Davie", "Plantation", "Sunrise"];

export default function NewProjectModal({ user, onClose, onCreated }) {
  const [form, setForm] = useState({
    name: "",
    project_type: "remodel",
    property_address: "",
    city_name: "Weston",
    estimated_cost: "",
    client_email: "",
    client_name: "",
  });
  const [saving, setSaving] = useState(false);

  const isContractor = user?.role === "contractor";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name,
      project_type: form.project_type,
      property_address: form.property_address || undefined,
      city_name: form.city_name,
      estimated_cost: form.estimated_cost ? parseFloat(form.estimated_cost) : undefined,
      owner_email: user.email,
      status: "planning",
    };
    if (isContractor) {
      payload.is_contractor_project = true;
      payload.client_email = form.client_email || undefined;
      payload.client_name = form.client_name || undefined;
    }
    const created = await base44.entities.Project.create(payload);
    setSaving(false);
    onCreated(created);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">
            {isContractor ? "New Client Project" : "Start New Project"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Project Name *</label>
            <input
              required
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Kitchen Remodel"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Project Type *</label>
            <select
              value={form.project_type}
              onChange={e => setForm(p => ({ ...p, project_type: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              {PROJECT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Property Address</label>
            <input
              value={form.property_address}
              onChange={e => setForm(p => ({ ...p, property_address: e.target.value }))}
              placeholder="123 Main St"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">City *</label>
            <select
              value={form.city_name}
              onChange={e => setForm(p => ({ ...p, city_name: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Estimated Cost ($)</label>
            <input
              type="number"
              value={form.estimated_cost}
              onChange={e => setForm(p => ({ ...p, estimated_cost: e.target.value }))}
              placeholder="50000"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>

          {isContractor && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Client Name</label>
                <input
                  value={form.client_name}
                  onChange={e => setForm(p => ({ ...p, client_name: e.target.value }))}
                  placeholder="Jane Smith"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Client Email</label>
                <input
                  type="email"
                  value={form.client_email}
                  onChange={e => setForm(p => ({ ...p, client_email: e.target.value }))}
                  placeholder="client@example.com"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: "#3B82F6" }}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}