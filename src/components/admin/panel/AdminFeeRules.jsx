import { useState, useEffect } from "react";
import { SUPABASE_URL as SB_URL, SUPABASE_ANON_KEY as SB_KEY } from "@/lib/supabase";
import { Plus, Pencil, Trash2, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SB_HEADERS = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" };

const CATEGORIES = ["building", "mechanical", "electrical", "plumbing", "engineering"];
const CALC_TYPES = ["flat", "flat_plus_pct", "percentage", "flat_per_unit", "flat_plus_units", "tiered_cost", "per_sqft_tier", "eng_cost_tier", "flat_plus_linear"];
const INPUT_FIELDS = ["construction_value", "openings", "sq_footage", "constructionCost", "units", "floors", "linearFeet", "squareFeet"];

const CAT_COLORS = {
  building: "bg-blue-100 text-blue-700",
  mechanical: "bg-orange-100 text-orange-700",
  electrical: "bg-yellow-100 text-yellow-700",
  plumbing: "bg-cyan-100 text-cyan-700",
  engineering: "bg-purple-100 text-purple-700",
};

const EMPTY_FORM = {
  permit_id: "", permit_name: "", category: "building", description: "",
  calc_type: "flat", input_field: "", base_fee: "", rate_percentage: "",
  flat_fee: "", technology_admin_fee: "", sort_order: "", effective_date: "", source_url: "",
};

function FeeRuleForm({ initial, cityName, onSave, onCancel }) {
  const [form, setForm] = useState(initial ? { ...initial } : { ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, city_name: cityName };
    ["base_fee", "rate_percentage", "flat_fee", "technology_admin_fee", "sort_order"].forEach(k => {
      if (payload[k] !== "" && payload[k] !== null && payload[k] !== undefined) payload[k] = parseFloat(payload[k]);
      else delete payload[k];
    });
    await onSave(payload);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-slate-800">{initial?.id ? "Edit Fee Rule" : "Add Fee Rule"}</h2>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Permit ID (slug)</label>
              <Input value={form.permit_id || ""} onChange={e => set("permit_id", e.target.value)} placeholder="ws_new_construction" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Permit Name *</label>
              <Input required value={form.permit_name || ""} onChange={e => set("permit_name", e.target.value)} placeholder="New Construction" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Category *</label>
              <select required value={form.category} onChange={e => set("category", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Calc Type *</label>
              <select required value={form.calc_type} onChange={e => set("calc_type", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                {CALC_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Input Field</label>
              <select value={form.input_field || ""} onChange={e => set("input_field", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                <option value="">— none —</option>
                {INPUT_FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Sort Order</label>
              <Input type="number" value={form.sort_order ?? ""} onChange={e => set("sort_order", e.target.value)} placeholder="1" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Base Fee ($)</label>
              <Input type="number" step="0.01" value={form.base_fee ?? ""} onChange={e => set("base_fee", e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Rate %</label>
              <Input type="number" step="0.001" value={form.rate_percentage ?? ""} onChange={e => set("rate_percentage", e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Flat Fee ($)</label>
              <Input type="number" step="0.01" value={form.flat_fee ?? ""} onChange={e => set("flat_fee", e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Tech/Admin Fee ($)</label>
              <Input type="number" step="0.01" value={form.technology_admin_fee ?? ""} onChange={e => set("technology_admin_fee", e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Effective Date</label>
              <Input type="date" value={form.effective_date || ""} onChange={e => set("effective_date", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Source URL</label>
              <Input value={form.source_url || ""} onChange={e => set("source_url", e.target.value)} placeholder="https://..." />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Description</label>
            <textarea value={form.description || ""} onChange={e => set("description", e.target.value)} rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400" placeholder="What this permit covers..." />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
              {saving ? "Saving..." : "Save Rule"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminFeeRules() {
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState("");
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetch(`${SB_URL}/rest/v1/cities?select=id,name&order=name.asc`, { headers: SB_HEADERS })
      .then(r => r.json()).then(d => { if (Array.isArray(d)) setCities(d); });
  }, []);

  const loadRules = async (cityName) => {
    if (!cityName) return;
    setLoading(true);
    const res = await fetch(`${SB_URL}/rest/v1/fee_rules?city_name=eq.${encodeURIComponent(cityName)}&order=sort_order.asc`, { headers: SB_HEADERS });
    const data = await res.json();
    setRules(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const handleCityChange = (name) => { setSelectedCity(name); loadRules(name); };

  const handleSave = async (payload) => {
    if (editingRule?.id) {
      const { id, ...data } = payload;
      await fetch(`${SB_URL}/rest/v1/fee_rules?id=eq.${editingRule.id}`, {
        method: "PATCH", headers: { ...SB_HEADERS, Prefer: "return=minimal" }, body: JSON.stringify(data),
      });
    } else {
      await fetch(`${SB_URL}/rest/v1/fee_rules`, {
        method: "POST", headers: { ...SB_HEADERS, Prefer: "return=minimal" }, body: JSON.stringify(payload),
      });
    }
    setEditingRule(null); setShowAddForm(false);
    loadRules(selectedCity);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this fee rule?")) return;
    await fetch(`${SB_URL}/rest/v1/fee_rules?id=eq.${id}`, { method: "DELETE", headers: SB_HEADERS });
    loadRules(selectedCity);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Fee Rules</h2>
          <p className="text-sm text-slate-500 mt-0.5">Manage permit fee rules per city</p>
        </div>
        {selectedCity && (
          <Button onClick={() => { setEditingRule(null); setShowAddForm(true); }} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Plus className="w-4 h-4" /> Add Rule
          </Button>
        )}
      </div>

      {/* City selector */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">Select City</label>
        <select
          value={selectedCity}
          onChange={e => handleCityChange(e.target.value)}
          className="w-full max-w-xs border border-slate-200 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">— Select a city —</option>
          {cities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
      </div>

      {!selectedCity && (
        <div className="text-center py-16 text-slate-400">
          <p className="font-medium">Select a city to view its fee rules</p>
        </div>
      )}

      {selectedCity && loading && (
        <div className="flex items-center gap-2 text-slate-500 py-8 justify-center"><Loader2 className="w-5 h-5 animate-spin" /> Loading fee rules...</div>
      )}

      {selectedCity && !loading && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <span className="font-semibold text-slate-700">{selectedCity}</span>
            <span className="text-xs text-slate-400">{rules.length} rules</span>
          </div>
          {rules.length === 0 ? (
            <div className="text-center py-12 text-slate-400">No fee rules yet. Add the first one.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {["Permit Name", "Category", "Calc Type", "Base Fee", "Rate %", "Sort", "Actions"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rules.map(rule => (
                    <tr key={rule.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800 max-w-[200px]">
                        <span className="block truncate">{rule.permit_name}</span>
                        {rule.permit_id && <span className="text-xs text-slate-400 font-mono">{rule.permit_id}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CAT_COLORS[rule.category] || "bg-slate-100 text-slate-600"}`}>{rule.category}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 font-mono">{rule.calc_type}</td>
                      <td className="px-4 py-3 text-slate-700">{rule.base_fee != null ? `$${rule.base_fee}` : "—"}</td>
                      <td className="px-4 py-3 text-slate-700">{rule.rate_percentage != null ? `${rule.rate_percentage}%` : "—"}</td>
                      <td className="px-4 py-3 text-slate-500">{rule.sort_order ?? "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <Button size="sm" variant="outline" onClick={() => { setEditingRule(rule); setShowAddForm(false); }} className="h-7 text-xs">
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDelete(rule.id)} className="h-7 text-xs text-red-500 hover:text-red-700 hover:border-red-300">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {(showAddForm || editingRule) && (
        <FeeRuleForm
          initial={editingRule || null}
          cityName={selectedCity}
          onSave={handleSave}
          onCancel={() => { setEditingRule(null); setShowAddForm(false); }}
        />
      )}
    </div>
  );
}