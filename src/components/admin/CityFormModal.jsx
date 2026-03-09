import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

const FIELDS = [
  { key: "name", label: "City Name", required: true },
  { key: "state", label: "State", required: true },
  { key: "county", label: "County", required: true },
  { key: "portal_url", label: "Portal URL" },
  { key: "fee_schedule_effective_date", label: "Fee Schedule Effective Date", type: "date" },
  { key: "building_department_phone", label: "Building Dept. Phone" },
  { key: "building_department_address", label: "Building Dept. Address" },
];

export default function CityFormModal({ city, onClose, onSaved }) {
  const [form, setForm] = useState(city || {});
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    if (city?.id) {
      await base44.entities.City.update(city.id, form);
    } else {
      await base44.entities.City.create(form);
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
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
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.name || !form.state || !form.county} className="gradient-primary text-white">
            {saving ? "Saving..." : "Save City"}
          </Button>
        </div>
      </div>
    </div>
  );
}