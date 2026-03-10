import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Download, Upload, FileJson, Trash2, CheckCircle2, AlertCircle,
  Settings2, ChevronDown, ChevronUp, Plus, Pencil
} from "lucide-react";

// ── Surcharge Panel ─────────────────────────────────────────────────────────
function SurchargePanel({ city }) {
  const queryClient = useQueryClient();
  const { data: surcharges = [] } = useQuery({
    queryKey: ["citySurcharges", city.id],
    queryFn: () => base44.entities.CitySurcharge.filter({ city_id: city.id }),
  });
  const surcharge = surcharges[0];
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
    if (surcharge?.id) await base44.entities.CitySurcharge.update(surcharge.id, data);
    else await base44.entities.CitySurcharge.create(data);
    queryClient.invalidateQueries({ queryKey: ["citySurcharges", city.id] });
    setSaving(false);
    setEditing(false);
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
  const [importResult, setImportResult] = useState(null); // { success, count, error }
  const [previewData, setPreviewData] = useState(null);

  const WESTON_TEMPLATE = {
    city: "Weston",
    resolution: "2024-128",
    effective_date: "October 1, 2024",
    surcharges: {
      technology_admin: 127.00,
      board_of_rules_rate: 0.52,
      educational_rate: 0.0003,
      dca_rate: 0.01,
      dbpr_rate: 0.015
    },
    fee_rules: [
      // ── BUILDING / STRUCTURES ──────────────────────────────────────
      {
        permit_id: "new_construction",
        permit_name: "New Construction / Addition",
        category: "building",
        description: "New residential or commercial structure, or addition to existing structure",
        calc_type: "tiered_cost",
        base_fee: 115.79,
        cost_threshold: 1000,
        tiers_config: JSON.stringify([
          { min: 1000, max: 1250000, base: 0, rate: 0.0155 },
          { min: 1250000, max: 3000000, base: 19359.50, rate: 0.0135 },
          { min: 3000000, max: null, base: 42954.50, rate: 0.0120 }
        ]),
        include_city_surcharges: true,
        sort_order: 1
      },
      {
        permit_id: "residential_alteration",
        permit_name: "Residential Remodel / Alteration",
        category: "building",
        description: "Interior or exterior renovation of an existing residential structure",
        calc_type: "tiered_cost",
        base_fee: 115.79,
        cost_threshold: 1000,
        tiers_config: JSON.stringify([
          { min: 1000, max: 1250000, base: 0, rate: 0.0155 },
          { min: 1250000, max: 3000000, base: 19359.50, rate: 0.0135 },
          { min: 3000000, max: null, base: 42954.50, rate: 0.0120 }
        ]),
        include_city_surcharges: true,
        sort_order: 2
      },
      {
        permit_id: "commercial_buildout",
        permit_name: "Commercial Build-Out / Tenant Improvement",
        category: "building",
        description: "Commercial interior tenant improvements or build-out",
        calc_type: "tiered_cost",
        base_fee: 115.79,
        cost_threshold: 1000,
        tiers_config: JSON.stringify([
          { min: 1000, max: 1250000, base: 0, rate: 0.0155 },
          { min: 1250000, max: 3000000, base: 19359.50, rate: 0.0135 },
          { min: 3000000, max: null, base: 42954.50, rate: 0.0120 }
        ]),
        planning_zoning_fee: 650.00,
        include_city_surcharges: true,
        sort_order: 3
      },
      {
        permit_id: "demolition_sfr",
        permit_name: "Demolition – Single Family Residential",
        category: "building",
        description: "Demolition of a single-family residential structure (per structure per trade)",
        calc_type: "flat",
        flat_fee: 117.26,
        include_city_surcharges: false,
        sort_order: 4
      },
      {
        permit_id: "demolition_other",
        permit_name: "Demolition – Commercial / Multi-Family",
        category: "building",
        description: "Demolition of commercial or multi-family structure (per floor per structure per trade)",
        calc_type: "flat_per_unit",
        input_field: "floors",
        fee_per_unit: 158.30,
        unit_label: "floors",
        include_city_surcharges: false,
        sort_order: 5
      },
      // ── NON-STRUCTURES ─────────────────────────────────────────────
      {
        permit_id: "hurricane_shutters",
        permit_name: "Hurricane Shutters",
        category: "building",
        description: "Residential hurricane shutters (up to two stories) – first opening + each additional",
        calc_type: "flat_plus_units",
        input_field: "openings",
        base_fee: 112.57,
        unit_threshold: 1,
        rate_per_unit: 9.38,
        unit_label: "openings",
        technology_admin_fee: 127.00,
        include_city_surcharges: false,
        sort_order: 6
      },
      {
        permit_id: "garage_door",
        permit_name: "Garage Door Replacement",
        category: "building",
        description: "Residential garage door replacement (per door)",
        calc_type: "flat_per_unit",
        input_field: "units",
        fee_per_unit: 199.34,
        unit_label: "doors",
        technology_admin_fee: 127.00,
        include_city_surcharges: false,
        sort_order: 7
      },
      {
        permit_id: "ac_unit",
        permit_name: "A/C Unit Replacement",
        category: "building",
        description: "Residential ground-mounted air conditioning unit (up to 5 tons)",
        calc_type: "flat",
        flat_fee: 199.34,
        technology_admin_fee: 127.00,
        include_city_surcharges: false,
        sort_order: 8
      },
      {
        permit_id: "water_heater",
        permit_name: "Water Heater Replacement",
        category: "plumbing",
        description: "Residential water heater replacement (up to 80 gallons)",
        calc_type: "flat",
        flat_fee: 199.34,
        technology_admin_fee: 127.00,
        include_city_surcharges: false,
        sort_order: 9
      },
      {
        permit_id: "fence",
        permit_name: "Residential Fence",
        category: "building",
        description: "Residential fence installation (base fee covers first 100 linear ft)",
        calc_type: "flat_plus_linear",
        base_fee: 199.34,
        base_includes_ft: 100,
        rate_per_linear_ft: 0.35,
        technology_admin_fee: 127.00,
        include_city_surcharges: false,
        sort_order: 10
      },
      {
        permit_id: "pool_sfr",
        permit_name: "Swimming Pool / Spa – Single Family",
        category: "building",
        description: "New swimming pool, spa, or hot tub for single-family residential (includes all trades)",
        calc_type: "flat",
        flat_fee: 1113.97,
        technology_admin_fee: 127.00,
        include_city_surcharges: false,
        sort_order: 11
      },
      {
        permit_id: "pool_other",
        permit_name: "Swimming Pool / Spa – Commercial / Multi-Family",
        category: "building",
        description: "New swimming pool, spa, or hot tub for commercial/multi-family (includes all trades)",
        calc_type: "flat",
        flat_fee: 1993.42,
        technology_admin_fee: 127.00,
        include_city_surcharges: false,
        sort_order: 12
      },
      {
        permit_id: "low_voltage_alarm",
        permit_name: "Low Voltage Alarm System",
        category: "electrical",
        description: "Hardwired low-voltage alarm system, home automation, CCTV, access control (per F.S. 553.793)",
        calc_type: "flat",
        flat_fee: 40.00,
        technology_admin_fee: 127.00,
        include_city_surcharges: false,
        sort_order: 13
      },
      // ── FIRE CODE SERVICES ─────────────────────────────────────────
      {
        permit_id: "fire_sprinkler",
        permit_name: "Fire Sprinkler System",
        category: "fire",
        description: "Sprinkler system plan review and inspection (base covers 1-12 heads)",
        calc_type: "flat_plus_units",
        input_field: "sprinklerHeads",
        base_fee: 350.00,
        unit_threshold: 12,
        rate_per_unit: 0.70,
        unit_label: "heads",
        technology_admin_fee: 127.00,
        include_city_surcharges: false,
        sort_order: 14
      },
      {
        permit_id: "fire_alarm",
        permit_name: "Fire Alarm System",
        category: "fire",
        description: "Fire alarm system plan review and inspection (base covers 1-12 devices)",
        calc_type: "flat_plus_units",
        input_field: "alarmDevices",
        base_fee: 350.00,
        unit_threshold: 12,
        rate_per_unit: 0.70,
        unit_label: "devices",
        technology_admin_fee: 127.00,
        include_city_surcharges: false,
        sort_order: 15
      },
      {
        permit_id: "fire_standpipe",
        permit_name: "Fire Standpipe System",
        category: "fire",
        description: "Fire standpipe system plan review",
        calc_type: "flat",
        flat_fee: 350.00,
        technology_admin_fee: 127.00,
        include_city_surcharges: false,
        sort_order: 16
      },
      {
        permit_id: "fire_pump",
        permit_name: "Fire Pump",
        category: "fire",
        description: "Fire pump plan review",
        calc_type: "flat",
        flat_fee: 612.50,
        technology_admin_fee: 127.00,
        include_city_surcharges: false,
        sort_order: 17
      },
      {
        permit_id: "smoke_control",
        permit_name: "Smoke Control System",
        category: "fire",
        description: "Smoke control / smoke evacuation system",
        calc_type: "flat",
        flat_fee: 1400.00,
        technology_admin_fee: 127.00,
        include_city_surcharges: false,
        sort_order: 18
      },
      {
        permit_id: "fire_site_review",
        permit_name: "Fire – Site Development / Building Plan Review",
        category: "fire",
        description: "Multi-family or non-residential fire plan review fee based on square footage",
        calc_type: "per_sqft_tier",
        input_field: "squareFeet",
        tiers_config: JSON.stringify([
          { max: 1500,  fee: 787.50 },
          { max: 2500,  fee: 962.50 },
          { max: 3500,  fee: 1137.50 },
          { max: 5000,  fee: 1312.50 },
          { max: 7500,  fee: 1400.00 },
          { max: 10000, fee: 1487.50 },
          { max: 15000, fee: 1575.00 },
          { max: 20000, fee: 1750.00 },
          { max: null,  base: 1750.00, rate_per_sqft: 0.04 }
        ]),
        technology_admin_fee: 127.00,
        include_city_surcharges: false,
        sort_order: 19
      },
      // ── ENGINEERING ────────────────────────────────────────────────
      {
        permit_id: "eng_paving_sfr",
        permit_name: "Paving / Drainage / Water & Sewer – Single Family",
        category: "engineering",
        description: "Engineering permit for paving, drainage, water & sewer on single-family property",
        calc_type: "flat",
        flat_fee: 375.00,
        include_city_surcharges: false,
        sort_order: 20
      },
      {
        permit_id: "eng_paving_commercial",
        permit_name: "Paving / Drainage / Water & Sewer – Commercial",
        category: "engineering",
        description: "Engineering permit for commercial/multi-family paving & drainage (cost estimate based)",
        calc_type: "eng_cost_tier",
        input_field: "constructionCost",
        tiers_config: JSON.stringify([
          { min: 0,      max: 30000,   base: 550, rate: 0.06 },
          { min: 30000,  max: 100000,  base: 550, rate: 0.05 },
          { min: 100000, max: null,    base: 550, rate: 0.04 }
        ]),
        include_city_surcharges: false,
        sort_order: 21
      },
      {
        permit_id: "eng_pavement_sfr",
        permit_name: "Pavement, Sealcoating & Restriping – Single Family",
        category: "engineering",
        description: "Engineering permit for residential pavement, sealcoating, restriping",
        calc_type: "flat",
        flat_fee: 200.00,
        include_city_surcharges: false,
        sort_order: 22
      },
      {
        permit_id: "eng_earthwork_sfr",
        permit_name: "Earthwork Permit – Single Family",
        category: "engineering",
        description: "Earthwork permit for single-family residential property",
        calc_type: "flat",
        flat_fee: 375.00,
        include_city_surcharges: false,
        sort_order: 23
      },
      // ── PLANNING & ZONING ──────────────────────────────────────────
      {
        permit_id: "pz_sfr_pool_addition",
        permit_name: "Site Plan Review – Single Family (Pool / Addition)",
        category: "planning",
        description: "Planning & zoning site plan review for single-family pool or addition",
        calc_type: "flat",
        flat_fee: 700.00,
        include_city_surcharges: false,
        sort_order: 24
      },
      {
        permit_id: "pz_fence_deck",
        permit_name: "Site Plan Review – Fence, Deck, Enclosure",
        category: "planning",
        description: "Planning & zoning site plan review for fences, decks, enclosures",
        calc_type: "flat",
        flat_fee: 450.00,
        include_city_surcharges: false,
        sort_order: 25
      },
      {
        permit_id: "pz_sign_permit",
        permit_name: "Sign Permit – Planning & Zoning Review",
        category: "planning",
        description: "Site plan review for sign permit (base + 3.75% of cost estimate)",
        calc_type: "flat_plus_pct",
        input_field: "constructionCost",
        base_fee: 450.00,
        rate_percentage: 3.75,
        include_city_surcharges: false,
        sort_order: 26
      },
      {
        permit_id: "vacation_rental",
        permit_name: "Vacation Rental Registration",
        category: "planning",
        description: "Vacation rental property application registration fee",
        calc_type: "flat",
        flat_fee: 500.00,
        include_city_surcharges: false,
        sort_order: 27
      },
      // ── CERTIFICATES ───────────────────────────────────────────────
      {
        permit_id: "cert_occupancy",
        permit_name: "Certificate of Occupancy",
        category: "certificate",
        description: "Certificate of Occupancy issuance",
        calc_type: "flat",
        flat_fee: 117.26,
        include_city_surcharges: false,
        sort_order: 28
      },
      {
        permit_id: "cert_completion",
        permit_name: "Certificate of Completion",
        category: "certificate",
        description: "Certificate of Completion issuance",
        calc_type: "flat",
        flat_fee: 136.02,
        include_city_surcharges: false,
        sort_order: 29
      },
      {
        permit_id: "cert_temp_co",
        permit_name: "Temporary Certificate of Occupancy",
        category: "certificate",
        description: "Temporary Certificate of Occupancy",
        calc_type: "flat",
        flat_fee: 269.70,
        include_city_surcharges: false,
        sort_order: 30
      }
    ]
  };

  const handleExport = () => {
    const exportData = {
      city: city.name,
      city_id: city.id,
      exported_at: new Date().toISOString(),
      fee_rules: rules.map(r => {
        const { id, created_date, updated_date, created_by, city_id, city_name, ...rest } = r;
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

  const handleDownloadTemplate = () => {
    const template = {
      city: city.name,
      city_id: city.id,
      fee_rules: [SAMPLE_RULE]
    };
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fee_rules_template.json`;
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
      for (const rule of rules) {
        await base44.entities.FeeRule.delete(rule.id);
      }
      // Create all new rules from the JSON
      for (const rule of previewData) {
        const { id, ...ruleData } = rule;
        await base44.entities.FeeRule.create({
          ...ruleData,
          city_id: city.id,
          city_name: city.name,
        });
      }
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
        <Button size="sm" variant="outline" className="text-gray-600 border-gray-300 bg-white" onClick={handleDownloadTemplate}>
          <Download className="w-3.5 h-3.5 mr-1" /> Download Template
        </Button>
        <Button size="sm" className="gradient-primary text-white" onClick={() => fileRef.current?.click()}>
          <Upload className="w-3.5 h-3.5 mr-1" /> Upload JSON
        </Button>
        <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} />
      </div>

      {/* Preview before confirming import */}
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

// ── Rule List (read-only view) ───────────────────────────────────────────────
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
    queryKey: ["feeRules", city.id],
    queryFn: () => base44.entities.FeeRule.filter({ city_id: city.id }),
  });

  const onImported = () => queryClient.invalidateQueries({ queryKey: ["feeRules", city.id] });

  return (
    <div>
      <SurchargePanel city={city} />
      <ImportExportPanel city={city} rules={rules} onImported={onImported} />
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-500">{rules.length} fee rule{rules.length !== 1 ? "s" : ""} currently loaded</p>
      </div>
      <RulesList rules={rules} />
    </div>
  );
}