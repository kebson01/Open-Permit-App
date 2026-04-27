import React, { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Download, Upload, FileJson, CheckCircle2, AlertCircle,
  Settings2, ChevronDown, ChevronUp, Plus, Pencil
} from "lucide-react";
import { SUPABASE_URL, SB_HEADERS, sbInsert, sbUpdate, sbDeleteWhere } from "@/lib/supabase";

const SB_WRITE_HEADERS = { ...SB_HEADERS, Prefer: "return=representation" };

// ── Supabase fetch helpers ────────────────────────────────────────────────────
async function fetchFeeRules(cityName) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/fee_rules?city_name=eq.${encodeURIComponent(cityName)}&order=sort_order.asc`,
    { headers: SB_HEADERS }
  );
  return res.json();
}

async function fetchSurcharge(cityName) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/city_surcharges?city_name=eq.${encodeURIComponent(cityName)}&limit=1`,
    { headers: SB_HEADERS }
  );
  const data = await res.json();
  return Array.isArray(data) && data.length > 0 ? data[0] : null;
}

async function upsertSurcharge(surcharge, cityName, cityId) {
  const data = { ...surcharge, city_id: cityId, city_name: cityName };
  if (surcharge?.id) {
    return sbUpdate("city_surcharges", surcharge.id, data);
  }
  return sbInsert("city_surcharges", data);
}

// ── Surcharge Panel ─────────────────────────────────────────────────────────
function SurchargePanel({ city, surcharge, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setForm(surcharge || { city_id: city.id, city_name: city.name });
    setEditing(true);
  };
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    const data = { ...form };
    ["technology_admin", "board_of_rules_rate", "educational_rate", "dca_rate", "dbpr_rate"]
      .forEach(k => { if (data[k] !== "" && data[k] !== undefined) data[k] = parseFloat(data[k]); else delete data[k]; });
    await upsertSurcharge(data, city.name, city.id);
    setSaving(false);
    setEditing(false);
    onSaved();
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-semibold text-amber-800">City-Wide Surcharges</span>
          {surcharge?.effective_date && (
            <span className="text-xs text-amber-600 bg-amber-100 rounded-full px-2 py-0.5">{surcharge.effective_date}</span>
          )}
        </div>
        <Button size="sm" variant="outline" className="text-amber-700 border-amber-300" onClick={startEdit}>
          {surcharge ? <><Pencil className="w-3.5 h-3.5 mr-1" />Edit</> : <><Plus className="w-3.5 h-3.5 mr-1" />Configure</>}
        </Button>
      </div>

      {!surcharge && !editing && (
        <p className="text-xs text-amber-700 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" /> No surcharges configured. Tiered-cost permits won't include city-wide fees.
        </p>
      )}

      {surcharge && !editing && (
        <div className="grid grid-cols-5 gap-3 text-xs text-amber-800">
          <div><p className="text-amber-500">Tech Admin</p><p className="font-semibold">${surcharge.technology_admin}</p></div>
          <div><p className="text-amber-500">Board of Rules</p><p className="font-semibold">${surcharge.board_of_rules_rate}/1k</p></div>
          <div><p className="text-amber-500">Educational</p><p className="font-semibold">{((surcharge.educational_rate || 0) * 100).toFixed(3)}%</p></div>
          <div><p className="text-amber-500">DCA</p><p className="font-semibold">{((surcharge.dca_rate || 0) * 100).toFixed(1)}%</p></div>
          <div><p className="text-amber-500">DBPR</p><p className="font-semibold">{((surcharge.dbpr_rate || 0) * 100).toFixed(1)}%</p></div>
        </div>
      )}

      {editing && form && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div><label className="text-xs text-amber-700 mb-1 block">Effective Date</label>
            <Input value={form.effective_date || ""} onChange={e => set("effective_date", e.target.value)} placeholder="October 1, 2025" className="bg-white" /></div>
          <div><label className="text-xs text-amber-700 mb-1 block">Resolution #</label>
            <Input value={form.resolution || ""} onChange={e => set("resolution", e.target.value)} placeholder="2026-07" className="bg-white" /></div>
          <div><label className="text-xs text-amber-700 mb-1 block">Technology Admin ($)</label>
            <Input type="number" value={form.technology_admin ?? ""} onChange={e => set("technology_admin", e.target.value)} placeholder="127.00" className="bg-white" /></div>
          <div><label className="text-xs text-amber-700 mb-1 block">Board of Rules (per $1,000)</label>
            <Input type="number" value={form.board_of_rules_rate ?? ""} onChange={e => set("board_of_rules_rate", e.target.value)} placeholder="0.52" className="bg-white" /></div>
          <div><label className="text-xs text-amber-700 mb-1 block">Educational Rate (decimal)</label>
            <Input type="number" value={form.educational_rate ?? ""} onChange={e => set("educational_rate", e.target.value)} placeholder="0.0003" className="bg-white" /></div>
          <div><label className="text-xs text-amber-700 mb-1 block">DCA Rate (decimal)</label>
            <Input type="number" value={form.dca_rate ?? ""} onChange={e => set("dca_rate", e.target.value)} placeholder="0.01" className="bg-white" /></div>
          <div><label className="text-xs text-amber-700 mb-1 block">DBPR Rate (decimal)</label>
            <Input type="number" value={form.dbpr_rate ?? ""} onChange={e => set("dbpr_rate", e.target.value)} placeholder="0.015" className="bg-white" /></div>
          <div className="col-span-2 flex justify-end gap-2 mt-1">
            <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="bg-amber-600 hover:bg-amber-700 text-white">
              {saving ? "Saving..." : "Save Surcharges"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Import/Export Panel ──────────────────────────────────────────────────────
function ImportExportPanel({ city, rules, onImported }) {
  const fileRef = useRef();
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [previewData, setPreviewData] = useState(null);

  const handleExport = () => {
    const exportData = {
      city: city.name,
      city_id: city.id,
      exported_at: new Date().toISOString(),
      fee_rules: rules.map(r => {
        const { id, created_at, updated_at, city_id, city_name, ...rest } = r;
        return rest;
      })
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${city.name.toLowerCase().replace(/\s+/g, "_")}_fee_rules.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        const feeRules = parsed.fee_rules || parsed;
        if (!Array.isArray(feeRules)) throw new Error("JSON must contain a 'fee_rules' array.");
        setPreviewData(feeRules);
      } catch (err) {
        setImportResult({ success: false, error: err.message });
        setPreviewData(null);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleConfirmImport = async () => {
    if (!previewData) return;
    setImporting(true);
    try {
      // Delete all existing rules for this city
      await sbDeleteWhere("fee_rules", "city_name", city.name);
      // Bulk insert new rules
      const newRules = previewData.map(({ id, ...r }) => ({
        ...r,
        city_id: city.id,
        city_name: city.name,
      }));
      await sbInsert("fee_rules", newRules);
      setImportResult({ success: true, count: previewData.length });
      setPreviewData(null);
      onImported();
    } catch (err) {
      setImportResult({ success: false, error: err.message });
    }
    setImporting(false);
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
      <div className="flex items-center gap-2 mb-3">
        <FileJson className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-semibold text-blue-800">JSON Fee Schedule Management</span>
      </div>
      <p className="text-xs text-blue-700 mb-3">
        Export the current fee schedule as JSON, edit it externally, then re-upload to update all fees at once.
      </p>
      <div className="flex flex-wrap gap-2 mb-3">
        <Button size="sm" variant="outline" className="text-blue-700 border-blue-300 bg-white" onClick={handleExport} disabled={rules.length === 0}>
          <Download className="w-3.5 h-3.5 mr-1" />
          {rules.length > 0 ? `Export ${rules.length} Rules` : "Export (empty)"}
        </Button>
        <Button size="sm" className="gradient-primary text-white" onClick={() => fileRef.current?.click()}>
          <Upload className="w-3.5 h-3.5 mr-1" /> Upload JSON
        </Button>
        <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} />
      </div>

      {previewData && (
        <div className="border border-blue-300 bg-white rounded-lg p-3 mt-2">
          <p className="text-sm font-semibold text-gray-800 mb-1">
            Ready to import {previewData.length} fee rules — this will replace all existing rules for {city.name}.
          </p>
          <div className="max-h-40 overflow-y-auto text-xs text-gray-600 mb-3 space-y-1">
            {previewData.map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                <span className="font-medium">{r.permit_name}</span>
                <span className="text-gray-400">{r.category} · {r.calc_type}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setPreviewData(null)}>Cancel</Button>
            <Button size="sm" onClick={handleConfirmImport} disabled={importing} className="bg-blue-600 hover:bg-blue-700 text-white">
              {importing ? "Importing..." : "Confirm & Replace"}
            </Button>
          </div>
        </div>
      )}

      {importResult?.success && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mt-2">
          <CheckCircle2 className="w-4 h-4" /> Successfully imported {importResult.count} fee rules.
        </div>
      )}
      {importResult?.error && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-2">
          <AlertCircle className="w-4 h-4" /> {importResult.error}
        </div>
      )}
    </div>
  );
}

// ── Rule List ────────────────────────────────────────────────────────────────
function RulesList({ rules }) {
  const [expanded, setExpanded] = useState(null);
  const grouped = rules
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    .reduce((acc, r) => {
      const cat = r.category || "other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(r);
      return acc;
    }, {});

  if (rules.length === 0) return (
    <p className="text-sm text-gray-400 text-center py-6">No fee rules loaded yet. Upload a JSON file above to get started.</p>
  );

  return (
    <div className="space-y-1">
      {Object.entries(grouped).map(([cat, catRules]) => (
        <div key={cat} className="mb-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 px-1">{cat} <span className="text-gray-300">({catRules.length})</span></p>
          {catRules.map(rule => (
            <div key={rule.id}>
              <button
                className="w-full flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 text-left"
                onClick={() => setExpanded(expanded === rule.id ? null : rule.id)}
              >
                <div>
                  <span className="font-medium text-gray-800 text-sm">{rule.permit_name}</span>
                  <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{rule.calc_type}</span>
                </div>
                {expanded === rule.id ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
              </button>
              {expanded === rule.id && (
                <div className="mx-3 mb-2 px-3 py-2 bg-gray-50 rounded-lg text-xs text-gray-600 space-y-1">
                  {rule.description && <p>{rule.description}</p>}
                  {rule.flat_fee != null && <p>Flat Fee: <strong>${rule.flat_fee}</strong></p>}
                  {rule.base_fee != null && <p>Base Fee: <strong>${rule.base_fee}</strong></p>}
                  {rule.fee_per_unit != null && <p>Fee per {rule.unit_label || "unit"}: <strong>${rule.fee_per_unit}</strong></p>}
                  {rule.rate_per_unit != null && <p>Rate per additional {rule.unit_label || "unit"}: <strong>${rule.rate_per_unit}</strong></p>}
                  {rule.rate_percentage != null && <p>Rate: <strong>{rule.rate_percentage}%</strong></p>}
                  {rule.technology_admin_fee != null && <p>Technology Admin Fee: <strong>${rule.technology_admin_fee}</strong></p>}
                  {rule.tiers_config && <p>Tiers: <strong>{JSON.parse(rule.tiers_config || "[]").length} configured</strong></p>}
                  <p>City surcharges: <strong>{rule.include_city_surcharges ? "Yes" : "No"}</strong></p>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Main Panel ───────────────────────────────────────────────────────────────
export default function CityFeeRulesPanel({ city }) {
  const queryClient = useQueryClient();

  const { data: rules = [] } = useQuery({
    queryKey: ["feeRules", city.name],
    queryFn: () => fetchFeeRules(city.name),
  });

  const { data: surcharge, refetch: refetchSurcharge } = useQuery({
    queryKey: ["citySurcharge", city.name],
    queryFn: () => fetchSurcharge(city.name),
  });

  const onImported = () => queryClient.invalidateQueries({ queryKey: ["feeRules", city.name] });
  const onSurchargeSaved = () => refetchSurcharge();

  return (
    <div>
      <SurchargePanel city={city} surcharge={surcharge} onSaved={onSurchargeSaved} />
      <ImportExportPanel city={city} rules={rules} onImported={onImported} />
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-500">{rules.length} fee rule{rules.length !== 1 ? "s" : ""} currently loaded</p>
      </div>
      <RulesList rules={rules} />
    </div>
  );
}