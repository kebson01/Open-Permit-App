import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Pencil, ChevronDown, ChevronUp, X } from "lucide-react";

const SUPABASE_URL = "https://gbknnjidqpmjrwlooluw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdia25uamlkcXBtanJ3bG9vbHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NTQzNDIsImV4cCI6MjA5MDIzMDM0Mn0.qwDACgXe3hesxBRQOzP53Hdc44z_UOka1_uYQScyi68";
const SB_HEADERS = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" };

async function getPermitTable(cityName, permitTableName) {
  if (permitTableName) return permitTableName;
  return `${cityName.toLowerCase().replace(/ /g, "_")}_permit_types`;
}

async function sbGet(table) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&order=category,name`, { headers: SB_HEADERS });
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

const CATEGORIES = ["building", "electrical", "plumbing", "fire", "certificate", "planning", "engineering", "additional"];

function TagsInput({ label, value = [], onChange, placeholder }) {
  const [input, setInput] = useState("");
  const add = () => {
    const v = input.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setInput("");
  };
  return (
    <div>
      <label className="text-xs text-gray-500 mb-1 block">{label}</label>
      <div className="flex gap-2 mb-2">
        <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), add())} placeholder={placeholder} className="text-sm" />
        <Button type="button" size="sm" variant="outline" onClick={add}>Add</Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {value.map((item, i) => (
          <span key={i} className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full border border-blue-200">
            {item}
            <button onClick={() => onChange(value.filter((_, idx) => idx !== i))} className="hover:text-red-500">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

function PermitTypeForm({ permit, cityId, cityName, cityTableName, onSaved, onCancel }) {
  const [form, setForm] = useState(permit || {
    city_name: cityName,
    name: "",
    category: "building",
    description: "",
    typical_requirements: [],
    documents_needed: [],
    inspections_required: [],
    typical_timeline: "",
    map_zone: ""
  });
  const [saving, setSaving] = useState(false);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    const table = cityTableName || `${cityName.toLowerCase().replace(/ /g, "_")}_permit_types`;
    const { id, city_id, ...rest } = form;
    if (permit?.id) {
      await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${permit.id}`, {
        method: "PATCH", headers: SB_HEADERS, body: JSON.stringify(rest),
      });
    } else {
      await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: "POST", headers: SB_HEADERS, body: JSON.stringify(rest),
      });
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="bg-white border border-blue-200 rounded-xl p-5 mt-2 space-y-4">
      <h4 className="font-semibold text-gray-800 text-sm">{permit ? "Edit Permit Type" : "Add Permit Type"}</h4>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Permit Name *</label>
          <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. New Construction" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Category *</label>
          <select className="w-full h-9 border border-input rounded-md px-3 text-sm bg-background" value={form.category} onChange={e => set("category", e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="text-xs text-gray-500 mb-1 block">Description</label>
          <textarea
            className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background min-h-[70px] resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            value={form.description}
            onChange={e => set("description", e.target.value)}
            placeholder="Describe what this permit covers..."
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Typical Timeline</label>
          <Input value={form.typical_timeline} onChange={e => set("typical_timeline", e.target.value)} placeholder="e.g. 10-15 business days" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Map Zone</label>
          <Input value={form.map_zone} onChange={e => set("map_zone", e.target.value)} placeholder="e.g. Roof, Interior" />
        </div>
      </div>

      <TagsInput label="Requirements" value={form.typical_requirements} onChange={v => set("typical_requirements", v)} placeholder="Add a requirement and press Enter" />
      <TagsInput label="Documents Needed" value={form.documents_needed} onChange={v => set("documents_needed", v)} placeholder="Add a document and press Enter" />
      <TagsInput label="Inspections Required" value={form.inspections_required} onChange={v => set("inspections_required", v)} placeholder="Add an inspection and press Enter" />

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={handleSave} disabled={saving || !form.name} className="gradient-primary text-white">
          {saving ? "Saving..." : "Save Permit Type"}
        </Button>
      </div>
    </div>
  );
}

function PermitTypeRow({ permit, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-white border border-gray-100 rounded-xl mb-2 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 group">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-800 text-sm">{permit.name}</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{permit.category}</span>
            {permit.typical_timeline && <span className="text-xs text-gray-400">{permit.typical_timeline}</span>}
          </div>
          {permit.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{permit.description}</p>}
        </div>
        <div className="flex gap-1 items-center">
          <button onClick={() => onEdit(permit)} className="p-1.5 rounded hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
            <Pencil className="w-3.5 h-3.5 text-gray-500" />
          </button>
          <button onClick={() => onDelete(permit.id)} className="p-1.5 rounded hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity">
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
          </button>
          <button onClick={() => setExpanded(!expanded)} className="p-1.5 rounded hover:bg-gray-100">
            {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 grid grid-cols-3 gap-4 text-xs">
          {permit.typical_requirements?.length > 0 && (
            <div>
              <p className="font-semibold text-gray-600 mb-1.5">Requirements</p>
              <ul className="space-y-1">
                {permit.typical_requirements.map((r, i) => <li key={i} className="text-gray-600 flex gap-1.5"><span className="text-blue-400">•</span>{r}</li>)}
              </ul>
            </div>
          )}
          {permit.documents_needed?.length > 0 && (
            <div>
              <p className="font-semibold text-gray-600 mb-1.5">Documents Needed</p>
              <ul className="space-y-1">
                {permit.documents_needed.map((d, i) => <li key={i} className="text-gray-600 flex gap-1.5"><span className="text-green-400">•</span>{d}</li>)}
              </ul>
            </div>
          )}
          {permit.inspections_required?.length > 0 && (
            <div>
              <p className="font-semibold text-gray-600 mb-1.5">Inspections Required</p>
              <ul className="space-y-1">
                {permit.inspections_required.map((p, i) => <li key={i} className="text-gray-600 flex gap-1.5"><span className="text-orange-400">•</span>{p}</li>)}
              </ul>
            </div>
          )}
          {!permit.typical_requirements?.length && !permit.documents_needed?.length && !permit.inspections_required?.length && (
            <p className="col-span-3 text-gray-400 text-center py-2">No details added yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function CityPermitTypesPanel({ city }) {
  const [editingPermit, setEditingPermit] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const queryClient = useQueryClient();
  const table = city.permit_table_name || `${city.name.toLowerCase().replace(/ /g, "_")}_permit_types`;

  const { data: permits = [] } = useQuery({
    queryKey: ["permitTypes", city.id],
    queryFn: () => sbGet(table),
  });

  const deletePermit = useMutation({
    mutationFn: (id) => fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, { method: "DELETE", headers: { ...SB_HEADERS, Prefer: "return=minimal" } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["permitTypes", city.id] }),
  });

  const onSaved = () => {
    queryClient.invalidateQueries({ queryKey: ["permitTypes", city.id] });
    setEditingPermit(null);
    setShowAddForm(false);
  };

  const grouped = permits.reduce((acc, p) => {
    const cat = p.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-600">{permits.length} permit type{permits.length !== 1 ? "s" : ""} configured</p>
        <Button size="sm" variant="outline" onClick={() => { setEditingPermit(null); setShowAddForm(true); }}>
          <Plus className="w-3.5 h-3.5" /> Add Permit Type
        </Button>
      </div>

      {showAddForm && !editingPermit && (
        <PermitTypeForm cityId={city.id} cityName={city.name} cityTableName={table} onSaved={onSaved} onCancel={() => setShowAddForm(false)} />
      )}

      {permits.length === 0 && !showAddForm && (
        <p className="text-sm text-gray-400 text-center py-4">No permit types yet. Add your first permit type above.</p>
      )}

      {Object.entries(grouped).map(([cat, catPermits]) => (
        <div key={cat} className="mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">{cat}</p>
          {catPermits.map(permit =>
            editingPermit?.id === permit.id ? (
              <PermitTypeForm key={permit.id} permit={editingPermit} cityId={city.id} cityName={city.name} cityTableName={table} onSaved={onSaved} onCancel={() => setEditingPermit(null)} />
            ) : (
              <PermitTypeRow key={permit.id} permit={permit} onEdit={setEditingPermit} onDelete={(id) => deletePermit.mutate(id)} />
            )
          )}
        </div>
      ))}
    </div>
  );
}