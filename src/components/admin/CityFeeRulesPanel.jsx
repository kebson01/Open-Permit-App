import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Pencil, X, Check } from "lucide-react";

const CALC_METHODS = ["flat", "per_cost", "per_unit", "per_sqft", "per_linear_ft", "tiered"];
const CATEGORIES = ["building", "electrical", "plumbing", "fire", "certificate", "planning", "engineering", "additional"];

function RuleRow({ rule, onEdit, onDelete }) {
  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-white transition-colors group">
      <div className="flex-1 min-w-0">
        <span className="font-medium text-gray-800 text-sm">{rule.permit_type}</span>
        <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{rule.category}</span>
        <p className="text-xs text-gray-500 mt-0.5">
          {rule.calculation_method} · Base: ${rule.base_fee ?? "–"} {rule.rate_per_unit ? `· Rate: $${rule.rate_per_unit}` : ""}
          {rule.minimum_fee ? ` · Min: $${rule.minimum_fee}` : ""}
        </p>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(rule)} className="p-1.5 rounded hover:bg-gray-100">
          <Pencil className="w-3.5 h-3.5 text-gray-500" />
        </button>
        <button onClick={() => onDelete(rule.id)} className="p-1.5 rounded hover:bg-red-50">
          <Trash2 className="w-3.5 h-3.5 text-red-400" />
        </button>
      </div>
    </div>
  );
}

function RuleForm({ rule, cityId, cityName, onSaved, onCancel }) {
  const [form, setForm] = useState(rule || { city_id: cityId, city_name: cityName, calculation_method: "flat" });
  const [saving, setSaving] = useState(false);

  const f = (key) => form[key] || "";
  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    const data = { ...form };
    ["base_fee", "rate_per_unit", "minimum_fee", "technology_surcharge", "rainy_day_surcharge", "plan_review_percentage"]
      .forEach(k => { if (data[k] !== "" && data[k] !== undefined) data[k] = parseFloat(data[k]); });
    if (rule?.id) {
      await base44.entities.FeeRule.update(rule.id, data);
    } else {
      await base44.entities.FeeRule.create(data);
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="bg-white border border-blue-200 rounded-xl p-4 mt-2 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Permit Type *</label>
          <Input value={f("permit_type")} onChange={e => set("permit_type", e.target.value)} placeholder="e.g. New Construction" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Category</label>
          <select className="w-full h-9 border border-input rounded-md px-3 text-sm bg-background" value={f("category")} onChange={e => set("category", e.target.value)}>
            <option value="">Select...</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Calculation Method</label>
          <select className="w-full h-9 border border-input rounded-md px-3 text-sm bg-background" value={f("calculation_method")} onChange={e => set("calculation_method", e.target.value)}>
            {CALC_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Base Fee ($)</label>
          <Input type="number" value={f("base_fee")} onChange={e => set("base_fee", e.target.value)} placeholder="0.00" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Rate Per Unit ($)</label>
          <Input type="number" value={f("rate_per_unit")} onChange={e => set("rate_per_unit", e.target.value)} placeholder="0.00" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Unit Description</label>
          <Input value={f("unit_description")} onChange={e => set("unit_description", e.target.value)} placeholder="e.g. per sq ft" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Minimum Fee ($)</label>
          <Input type="number" value={f("minimum_fee")} onChange={e => set("minimum_fee", e.target.value)} placeholder="0.00" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Plan Review (%)</label>
          <Input type="number" value={f("plan_review_percentage")} onChange={e => set("plan_review_percentage", e.target.value)} placeholder="e.g. 65" />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={handleSave} disabled={saving || !form.permit_type} className="gradient-primary text-white">
          {saving ? "Saving..." : "Save Rule"}
        </Button>
      </div>
    </div>
  );
}

export default function CityFeeRulesPanel({ city }) {
  const [editingRule, setEditingRule] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: rules = [] } = useQuery({
    queryKey: ["feeRules", city.id],
    queryFn: () => base44.entities.FeeRule.filter({ city_id: city.id }),
  });

  const deleteRule = useMutation({
    mutationFn: (id) => base44.entities.FeeRule.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["feeRules", city.id] }),
  });

  const onSaved = () => {
    queryClient.invalidateQueries({ queryKey: ["feeRules", city.id] });
    setEditingRule(null);
    setShowAddForm(false);
  };

  const grouped = rules.reduce((acc, r) => {
    const cat = r.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(r);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-600">{rules.length} fee rule{rules.length !== 1 ? "s" : ""} configured</p>
        <Button size="sm" variant="outline" onClick={() => { setEditingRule(null); setShowAddForm(true); }}>
          <Plus className="w-3.5 h-3.5" /> Add Rule
        </Button>
      </div>

      {showAddForm && !editingRule && (
        <RuleForm cityId={city.id} cityName={city.name} onSaved={onSaved} onCancel={() => setShowAddForm(false)} />
      )}

      {rules.length === 0 && !showAddForm && (
        <p className="text-sm text-gray-400 text-center py-4">No fee rules yet. Add your first rule above.</p>
      )}

      {Object.entries(grouped).map(([cat, catRules]) => (
        <div key={cat} className="mb-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 px-3">{cat}</p>
          {catRules.map(rule =>
            editingRule?.id === rule.id ? (
              <RuleForm key={rule.id} rule={editingRule} cityId={city.id} cityName={city.name} onSaved={onSaved} onCancel={() => setEditingRule(null)} />
            ) : (
              <RuleRow key={rule.id} rule={rule} onEdit={setEditingRule} onDelete={(id) => deleteRule.mutate(id)} />
            )
          )}
        </div>
      ))}
    </div>
  );
}