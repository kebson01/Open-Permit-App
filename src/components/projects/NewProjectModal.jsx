import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { base44 } from "@/api/base44Client";
import { useCities } from "@/hooks/useCities";
import { X, Loader2, Home, Briefcase, ArrowRight } from "lucide-react";

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



function RoleStep({ onSelect }) {
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleContinue = async () => {
    setSaving(true);
    await supabase.auth.updateUser({ data: { role: selected } });
    onSelect(selected);
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-1">How are you using OpenPermit?</h2>
      <p className="text-sm text-gray-500 mb-6">This helps us show you the right information for your project</p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Homeowner card */}
        <button
          type="button"
          onClick={() => setSelected("user")}
          className="flex flex-col items-center text-center p-5 rounded-2xl transition-all"
          style={{
            border: selected === "user" ? "2px solid #3B82F6" : "1px solid #E2E8F0",
            background: selected === "user" ? "#EFF6FF" : "#fff",
          }}
        >
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${selected === "user" ? "bg-blue-100" : "bg-gray-100"}`}>
            <Home className={`w-7 h-7 ${selected === "user" ? "text-blue-600" : "text-gray-500"}`} />
          </div>
          <p className={`font-bold text-sm mb-1 ${selected === "user" ? "text-blue-800" : "text-gray-900"}`}>I'm a Homeowner</p>
          <p className="text-xs text-gray-500 leading-snug">I'm managing permits for my own property</p>
        </button>

        {/* Contractor card */}
        <button
          type="button"
          onClick={() => setSelected("contractor")}
          className="flex flex-col items-center text-center p-5 rounded-2xl transition-all"
          style={{
            border: selected === "contractor" ? "2px solid #3B82F6" : "1px solid #E2E8F0",
            background: selected === "contractor" ? "#EFF6FF" : "#fff",
          }}
        >
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${selected === "contractor" ? "bg-blue-100" : "bg-gray-100"}`}>
            <Briefcase className={`w-7 h-7 ${selected === "contractor" ? "text-blue-600" : "text-gray-500"}`} />
          </div>
          <p className={`font-bold text-sm mb-1 ${selected === "contractor" ? "text-blue-800" : "text-gray-900"}`}>I'm a Contractor</p>
          <p className="text-xs text-gray-500 leading-snug">I manage permits on behalf of clients</p>
        </button>
      </div>

      {selected && (
        <button
          onClick={handleContinue}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
          style={{ background: "#3B82F6" }}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Continue <ArrowRight className="w-4 h-4" /></>}
        </button>
      )}
    </div>
  );
}

function ProjectForm({ user, isContractor, onClose, onCreated }) {
  const { cities } = useCities();
  const [form, setForm] = useState({
    name: "",
    project_type: "remodel",
    property_address: "",
    city_name: "Weston",
    estimated_cost: "",
    client_email: "",
    client_name: "",
    invite_client: true,
  });
  const [saving, setSaving] = useState(false);

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
    const { data: created, error } = await supabase.from("projects").insert(payload).select().single();
    if (error) throw error;

    // Send invite email to client if contractor checked the box
    if (isContractor && form.invite_client && form.client_email) {
      await base44.integrations.Core.SendEmail({
        to: form.client_email,
        subject: `You've been added to a permit project on OpenPermit`,
        body: `Your contractor has started a permit project for you on OpenPermit.\n\nProject: ${form.name}\nAddress: ${form.property_address || "N/A"}\n\nVisit https://openpermit.base44.app to view your project status and documents.`,
      }).catch(() => {});
    }

    setSaving(false);
    onCreated(created);
  };

  return (
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
          {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Estimated Cost (optional)</label>
        <input
          type="number"
          value={form.estimated_cost}
          onChange={e => setForm(p => ({ ...p, estimated_cost: e.target.value }))}
          placeholder="50000"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        <p className="text-xs text-gray-400 mt-1">Don't worry if you don't know yet — you can update this later</p>
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
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.invite_client}
              onChange={e => setForm(p => ({ ...p, invite_client: e.target.checked }))}
              className="w-4 h-4 accent-blue-500 rounded"
            />
            <span className="text-sm text-gray-700">Invite client to OpenPermit</span>
          </label>
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
  );
}

export default function NewProjectModal({ user, onClose, onCreated }) {
  // Determine if user already has a saved role
  const hasRole = user?.role === "contractor" || user?.role === "user" || user?.role === "admin";
  const [step, setStep] = useState(hasRole ? "form" : "role");
  const [resolvedRole, setResolvedRole] = useState(user?.role);

  const handleRoleSelected = (role) => {
    setResolvedRole(role);
    setStep("form");
  };

  const isContractor = resolvedRole === "contractor";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">
            {step === "role" ? "New Project" : isContractor ? "New Client Project" : "Start New Project"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        {step === "role" ? (
          <RoleStep onSelect={handleRoleSelected} />
        ) : (
          <ProjectForm
            user={user}
            isContractor={isContractor}
            onClose={onClose}
            onCreated={onCreated}
          />
        )}
      </div>
    </div>
  );
}