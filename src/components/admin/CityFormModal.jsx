import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Map, Calculator, Search, Sparkles, ClipboardList, Layers, BookOpen } from "lucide-react";

const FIELDS = [
  { key: "name", label: "City Name", required: true },
  { key: "state", label: "State", required: true },
  { key: "county", label: "County", required: true },
  { key: "slug", label: "URL Slug (e.g. weston, coral-springs)", hint: "Used for the city's unique portal URL" },
  { key: "portal_url", label: "Portal URL" },
  { key: "fee_schedule_effective_date", label: "Fee Schedule Effective Date", type: "date" },
  { key: "building_department_phone", label: "Building Dept. Phone" },
  { key: "building_department_address", label: "Building Dept. Address" },
];

const SERVICES = [
  { key: "permit_guide",        label: "Visual Permit Guide",   icon: Map },
  { key: "fee_calculator",      label: "Fee Calculator",        icon: Calculator },
  { key: "property_search",     label: "Property Search",       icon: Search },
  { key: "ai_assistant",        label: "AI Assistant",          icon: Sparkles },
  { key: "permit_records",      label: "Permit Records",        icon: ClipboardList },
  { key: "zoning_rules",        label: "Zoning Rules",          icon: Layers },
  { key: "code_of_ordinances",  label: "Code of Ordinances",    icon: BookOpen },
];

export default function CityFormModal({ city, onClose, onSaved }) {
  const [form, setForm] = useState(city || {});
  const [saving, setSaving] = useState(false);

  const toggleService = (key) => {
    const current = form.enabled_services || [];
    const updated = current.includes(key) ? current.filter(s => s !== key) : [...current, key];
    setForm({ ...form, enabled_services: updated });
  };

  const handleSave = async () => {
    setSaving(true);
    // Auto-generate slug from name if not set
    const slug = form.slug || form.name?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const data = { ...form, slug };
    if (city?.id) {
      await base44.entities.City.update(city.id, data);
    } else {
      await base44.entities.City.create(data);
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">{city ? "Edit City" : "Add City"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {FIELDS.map(f => (
            <div key={f.key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {f.label}{f.required && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              <Input
                type={f.type || "text"}
                value={form[f.key] || ""}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                placeholder={f.label}
              />
              {f.hint && <p className="text-xs text-gray-400 mt-0.5">{f.hint}</p>}
            </div>
          ))}

          {/* Services */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Enabled Services (Portal)</label>
            <div className="flex gap-3">
              {SERVICES.map(s => {
                const active = (form.enabled_services || []).includes(s.key);
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => toggleService(s.key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                      active
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    <s.icon className="w-4 h-4" />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={saving || !form.name || !form.state || !form.county}
            className="gradient-primary text-white"
          >
            {saving ? "Saving..." : "Save City"}
          </Button>
        </div>
      </div>
    </div>
  );
}