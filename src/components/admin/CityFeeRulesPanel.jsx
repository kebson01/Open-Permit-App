import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Pencil, ChevronDown, ChevronUp, Settings2, AlertCircle } from "lucide-react";

const CATEGORIES = ["building", "electrical", "plumbing", "fire", "certificate", "planning", "engineering", "additional"];
const CALC_TYPES = [
  { value: "flat", label: "Flat Fee" },
  { value: "flat_per_unit", label: "Flat Fee × Units" },
  { value: "flat_plus_units", label: "Base + Per Additional Unit" },
  { value: "flat_plus_linear", label: "Base + Per Linear Foot" },
  { value: "flat_plus_pct", label: "Base + % of Cost" },
  { value: "tiered_cost", label: "Tiered Construction Cost" },
  { value: "per_sqft_tier", label: "Tiered Square Footage" },
  { value: "eng_cost_tier", label: "Engineering Cost Tier" },
];
const INPUT_FIELDS = [
  { value: "constructionCost", label: "Construction Cost ($)" },
  { value: "openings", label: "Openings / Devices" },
  { value: "units", label: "Units / Count" },
  { value: "floors", label: "Floors" },
  { value: "linearFeet", label: "Linear Feet" },
  { value: "sprinklerHeads", label: "Sprinkler Heads" },
  { value: "alarmDevices", label: "Alarm Devices" },
  { value: "squareFeet", label: "Square Feet" },
];

// Tier editor for tiered configs
function TierEditor({ tiers, onChange, columns }) {
  const addTier = () => onChange([...tiers, {}]);
  const updateTier = (i, key, val) => {
    const updated = tiers.map((t, idx) => idx === i ? { ...t, [key]: val === "" ? undefined : parseFloat(val) || val } : t);
    onChange(updated);
  };
  const removeTier = (i) => onChange(tiers.filter((_, idx) => idx !== i));

  return (
    <div>
      <label className="text-xs text-gray-500 mb-1.5 block font-medium">Fee Tiers</label>
      <div className="space-y-2">
        {tiers.map((tier, i) => (
          <div key={i} className="flex gap-2 items-center bg-gray-50 rounded-lg p-2">
            {columns.map(col => (
              <div key={col.key} className="flex-1">
                <label className="text-xs text-gray-400 block mb-0.5">{col.label}</label>
                <Input
                  type="number"
                  className="h-8 text-xs"
                  value={tier[col.key] === Infinity || tier[col.key] == null ? "" : tier[col.key]}
                  onChange={e => updateTier(i, col.key, e.target.value)}
                  placeholder={col.placeholder || ""}
                />
              </div>
            ))}
            <button onClick={() => removeTier(i)} className="mt-4 p-1 text-red-400 hover:text-red-600">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      <button onClick={addTier} className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
        <Plus className="w-3 h-3" /> Add Tier
      </button>
    </div>
  );
}

function FeeRuleForm({ rule, cityId, cityName, onSaved, onCancel }) {
  const [form, setForm] = useState(rule || {
    city_id: cityId, city_name: cityName,
    calc_type: "flat", category: "building",
    include_city_surcharges: false,
  });
  const [tiers, setTiers] = useState(() => {
    try { return JSON.parse(rule?.tiers_config || "[]"); } catch { return []; }
  });
  const [saving, setSaving] = useState(false);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  const num = (key) => form[key] ?? "";

  const tierColumns = {
    tiered_cost: [
      { key: "min", label: "Min Cost ($)", placeholder: "0" },
      { key: "max", label: "Max Cost (blank=∞)", placeholder: "∞" },
      { key: "base", label: "Tier Base ($)", placeholder: "0" },
      { key: "rate", label: "Rate (decimal)", placeholder: "0.0155" },
    ],
    per_sqft_tier: [
      { key: "max", label: "Max Sq Ft (blank=∞)", placeholder: "∞" },
      { key: "fee", label: "Flat Fee ($)", placeholder: "0" },
      { key: "base", label: "Or Base ($)", placeholder: "" },
      { key: "rate_per_sqft", label: "Rate/sqft ($)", placeholder: "" },
    ],
    eng_cost_tier: [
      { key: "min", label: "Min Cost ($)", placeholder: "0" },
      { key: "max", label: "Max Cost (blank=∞)", placeholder: "∞" },
      { key: "base", label: "Base Fee ($)", placeholder: "0" },
      { key: "rate", label: "Rate (decimal)", placeholder: "0.05" },
    ],
  };

  const isTiered = ["tiered_cost", "per_sqft_tier", "eng_cost_tier"].includes(form.calc_type);
  const needsInput = form.calc_type !== "flat";

  const handleSave = async () => {
    setSaving(true);
    const data = { ...form };
    const numFields = ["flat_fee","fee_per_unit","base_fee","rate_per_unit","base_includes_ft",
      "rate_per_linear_ft","rate_percentage","cost_threshold","technology_admin_fee","planning_zoning_fee",
      "unit_threshold","sort_order"];
    numFields.forEach(k => { if (data[k] !== "" && data[k] !== undefined) data[k] = parseFloat(data[k]); else delete data[k]; });
    if (isTiered) {
      const cleanTiers = tiers.map(t => {
        const clean = { ...t };
        Object.keys(clean).forEach(k => { if (clean[k] !== "" && clean[k] !== undefined) clean[k] = parseFloat(clean[k]) || clean[k]; });
        if (clean.max == null || clean.max === "") clean.max = null; // null = Infinity placeholder
        return clean;
      });
      data.tiers_config = JSON.stringify(cleanTiers);
    }
    if (!data.permit_id) data.permit_id = data.permit_name?.toLowerCase().replace(/[^a-z0-9]+/g, "_") || data.id;
    if (rule?.id) await base44.entities.FeeRule.update(rule.id, data);
    else await base44.entities.FeeRule.create(data);
    setSaving(false);
    onSaved();
  };

  return (
    <div className="bg-white border border-blue-200 rounded-xl p-5 mt-2 space-y-4">
      <h4 className="font-semibold text-gray-800 text-sm">{rule ? "Edit Fee Rule" : "Add Fee Rule"}</h4>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Permit Name *</label>
          <Input value={form.permit_name || ""} onChange={e => set("permit_name", e.target.value)} placeholder="e.g. New Construction" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Category</label>
          <select className="w-full h-9 border border-input rounded-md px-3 text-sm bg-background" value={form.category || "building"} onChange={e => set("category", e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="text-xs text-gray-500 mb-1 block">Description</label>
          <Input value={form.description || ""} onChange={e => set("description", e.target.value)} placeholder="What this permit covers" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Calculation Method *</label>
          <select className="w-full h-9 border border-input rounded-md px-3 text-sm bg-background" value={form.calc_type} onChange={e => set("calc_type", e.target.value)}>
            {CALC_TYPES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        {needsInput && !isTiered && (
          <div>
            <label className="text-xs text-gray-500 mb-1 block">User Input Field</label>
            <select className="w-full h-9 border border-input rounded-md px-3 text-sm bg-background" value={form.input_field || ""} onChange={e => set("input_field", e.target.value)}>
              <option value="">Select...</option>
              {INPUT_FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Flat fee fields based on calc type */}
      <div className="grid grid-cols-3 gap-3">
        {form.calc_type === "flat" && (
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Flat Fee ($)</label>
            <Input type="number" value={num("flat_fee")} onChange={e => set("flat_fee", e.target.value)} placeholder="0.00" />
          </div>
        )}
        {form.calc_type === "flat_per_unit" && (<>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Fee Per Unit ($)</label>
            <Input type="number" value={num("fee_per_unit")} onChange={e => set("fee_per_unit", e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Unit Label</label>
            <Input value={form.unit_label || ""} onChange={e => set("unit_label", e.target.value)} placeholder="doors, floors..." />
          </div>
        </>)}
        {form.calc_type === "flat_plus_units" && (<>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Base Fee ($)</label>
            <Input type="number" value={num("base_fee")} onChange={e => set("base_fee", e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Units in Base</label>
            <Input type="number" value={num("unit_threshold")} onChange={e => set("unit_threshold", e.target.value)} placeholder="1" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Rate / Extra Unit ($)</label>
            <Input type="number" value={num("rate_per_unit")} onChange={e => set("rate_per_unit", e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Unit Label</label>
            <Input value={form.unit_label || ""} onChange={e => set("unit_label", e.target.value)} placeholder="heads, openings..." />
          </div>
        </>)}
        {form.calc_type === "flat_plus_linear" && (<>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Base Fee ($)</label>
            <Input type="number" value={num("base_fee")} onChange={e => set("base_fee", e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Feet in Base</label>
            <Input type="number" value={num("base_includes_ft")} onChange={e => set("base_includes_ft", e.target.value)} placeholder="100" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Rate / Linear Ft ($)</label>
            <Input type="number" value={num("rate_per_linear_ft")} onChange={e => set("rate_per_linear_ft", e.target.value)} placeholder="0.00" />
          </div>
        </>)}
        {form.calc_type === "tiered_cost" && (
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Base Fee ($)</label>
            <Input type="number" value={num("base_fee")} onChange={e => set("base_fee", e.target.value)} placeholder="119.11" />
          </div>
        )}
        {form.calc_type === "flat_plus_pct" && (<>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Base Fee ($)</label>
            <Input type="number" value={num("base_fee")} onChange={e => set("base_fee", e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Rate (%)</label>
            <Input type="number" value={num("rate_percentage")} onChange={e => set("rate_percentage", e.target.value)} placeholder="3.75" />
          </div>
        </>)}
        {(form.calc_type === "tiered_cost") && (
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Cost Threshold ($)</label>
            <Input type="number" value={num("cost_threshold")} onChange={e => set("cost_threshold", e.target.value)} placeholder="1000" />
          </div>
        )}
      </div>

      {isTiered && (
        <TierEditor
          tiers={tiers}
          onChange={setTiers}
          columns={tierColumns[form.calc_type] || []}
        />
      )}

      <div className="grid grid-cols-3 gap-3 border-t pt-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Technology Fee ($)</label>
          <Input type="number" value={num("technology_admin_fee")} onChange={e => set("technology_admin_fee", e.target.value)} placeholder="127.00" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Planning/Zoning Fee ($)</label>
          <Input type="number" value={num("planning_zoning_fee")} onChange={e => set("planning_zoning_fee", e.target.value)} placeholder="0.00" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Sort Order</label>
          <Input type="number" value={num("sort_order")} onChange={e => set("sort_order", e.target.value)} placeholder="0" />
        </div>
        <div className="col-span-3 flex items-center gap-2">
          <input type="checkbox" id="surcharges" checked={!!form.include_city_surcharges} onChange={e => set("include_city_surcharges", e.target.checked)} className="w-4 h-4" />
          <label htmlFor="surcharges" className="text-sm text-gray-700">Apply city-wide surcharges (Board of Rules, DCA, DBPR, Educational)</label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={handleSave} disabled={saving || !form.permit_name} className="gradient-primary text-white">
          {saving ? "Saving..." : "Save Fee Rule"}
        </Button>
      </div>
    </div>
  );
}

function SurchargePanel({ city }) {
  const queryClient = useQueryClient();
  const { data: surcharges = [] } = useQuery({
    queryKey: ["citySurcharges", city.id],
    queryFn: () => base44.entities.CitySurcharge.filter({ city_id: city.id }),
  });
  const surcharge = surcharges[0];
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const edit = () => setForm(surcharge || { city_id: city.id, city_name: city.name });
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const num = (k) => form?.[k] ?? "";

  const handleSave = async () => {
    setSaving(true);
    const data = { ...form };
    ["technology_admin","board_of_rules_rate","educational_rate","dca_rate","dbpr_rate"]
      .forEach(k => { if (data[k] !== "" && data[k] !== undefined) data[k] = parseFloat(data[k]); else delete data[k]; });
    if (surcharge?.id) await base44.entities.CitySurcharge.update(surcharge.id, data);
    else await base44.entities.CitySurcharge.create(data);
    queryClient.invalidateQueries({ queryKey: ["citySurcharges", city.id] });
    setSaving(false);
    setForm(null);
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-semibold text-amber-800">City-Wide Surcharges</span>
          {surcharge && <span className="text-xs text-amber-600 bg-amber-100 rounded-full px-2 py-0.5">{surcharge.effective_date}</span>}
        </div>
        <Button size="sm" variant="outline" className="text-amber-700 border-amber-300" onClick={edit}>
          {surcharge ? <Pencil className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {surcharge ? " Edit" : " Configure"}
        </Button>
      </div>
      {!surcharge && !form && (
        <div className="flex items-center gap-2 text-xs text-amber-700">
          <AlertCircle className="w-3.5 h-3.5" /> No surcharges configured. Tiered-cost permits won't include city-wide fees until this is set.
        </div>
      )}
      {surcharge && !form && (
        <div className="grid grid-cols-5 gap-3 text-xs text-amber-800">
          <div><p className="text-amber-500">Technology Admin</p><p className="font-semibold">${surcharge.technology_admin}</p></div>
          <div><p className="text-amber-500">Board of Rules</p><p className="font-semibold">${surcharge.board_of_rules_rate}/1000</p></div>
          <div><p className="text-amber-500">Educational</p><p className="font-semibold">{(surcharge.educational_rate * 100).toFixed(3)}%</p></div>
          <div><p className="text-amber-500">DCA Rate</p><p className="font-semibold">{(surcharge.dca_rate * 100).toFixed(1)}%</p></div>
          <div><p className="text-amber-500">DBPR Rate</p><p className="font-semibold">{(surcharge.dbpr_rate * 100).toFixed(1)}%</p></div>
        </div>
      )}
      {form && (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-amber-700 mb-1 block">Effective Date</label>
              <Input value={form.effective_date || ""} onChange={e => set("effective_date", e.target.value)} placeholder="October 1, 2025" className="bg-white" />
            </div>
            <div>
              <label className="text-xs text-amber-700 mb-1 block">Resolution #</label>
              <Input value={form.resolution || ""} onChange={e => set("resolution", e.target.value)} placeholder="2026-07" className="bg-white" />
            </div>
            <div>
              <label className="text-xs text-amber-700 mb-1 block">Technology Admin Fee ($)</label>
              <Input type="number" value={num("technology_admin")} onChange={e => set("technology_admin", e.target.value)} placeholder="127.00" className="bg-white" />
            </div>
            <div>
              <label className="text-xs text-amber-700 mb-1 block">Board of Rules (per $1,000)</label>
              <Input type="number" value={num("board_of_rules_rate")} onChange={e => set("board_of_rules_rate", e.target.value)} placeholder="0.52" className="bg-white" />
            </div>
            <div>
              <label className="text-xs text-amber-700 mb-1 block">Educational Rate (decimal)</label>
              <Input type="number" value={num("educational_rate")} onChange={e => set("educational_rate", e.target.value)} placeholder="0.0003" className="bg-white" />
            </div>
            <div>
              <label className="text-xs text-amber-700 mb-1 block">DCA Rate (decimal)</label>
              <Input type="number" value={num("dca_rate")} onChange={e => set("dca_rate", e.target.value)} placeholder="0.01" className="bg-white" />
            </div>
            <div>
              <label className="text-xs text-amber-700 mb-1 block">DBPR Rate (decimal)</label>
              <Input type="number" value={num("dbpr_rate")} onChange={e => set("dbpr_rate", e.target.value)} placeholder="0.015" className="bg-white" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setForm(null)}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="bg-amber-600 hover:bg-amber-700 text-white">
              {saving ? "Saving..." : "Save Surcharges"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function FeeRuleRow({ rule, onEdit, onDelete }) {
  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-white transition-colors group">
      <div className="flex-1 min-w-0">
        <span className="font-medium text-gray-800 text-sm">{rule.permit_name}</span>
        <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{rule.category}</span>
        <span className="ml-1 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{CALC_TYPES.find(t => t.value === rule.calc_type)?.label || rule.calc_type}</span>
        <p className="text-xs text-gray-500 mt-0.5">{rule.description || ""}</p>
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

  const grouped = rules.sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)).reduce((acc, r) => {
    const cat = r.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(r);
    return acc;
  }, {});

  return (
    <div>
      <SurchargePanel city={city} />

      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-600">{rules.length} fee rule{rules.length !== 1 ? "s" : ""} configured</p>
        <Button size="sm" variant="outline" onClick={() => { setEditingRule(null); setShowAddForm(true); }}>
          <Plus className="w-3.5 h-3.5" /> Add Fee Rule
        </Button>
      </div>

      {showAddForm && !editingRule && (
        <FeeRuleForm cityId={city.id} cityName={city.name} onSaved={onSaved} onCancel={() => setShowAddForm(false)} />
      )}

      {rules.length === 0 && !showAddForm && (
        <p className="text-sm text-gray-400 text-center py-4">No fee rules yet. Add your first fee rule above.</p>
      )}

      {Object.entries(grouped).map(([cat, catRules]) => (
        <div key={cat} className="mb-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 px-3">{cat}</p>
          {catRules.map(rule =>
            editingRule?.id === rule.id ? (
              <FeeRuleForm key={rule.id} rule={editingRule} cityId={city.id} cityName={city.name} onSaved={onSaved} onCancel={() => setEditingRule(null)} />
            ) : (
              <FeeRuleRow key={rule.id} rule={rule} onEdit={setEditingRule} onDelete={(id) => deleteRule.mutate(id)} />
            )
          )}
        </div>
      ))}
    </div>
  );
}