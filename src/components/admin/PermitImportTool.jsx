import React, { useState, useEffect } from "react";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, Download, Check, X, Plus, Trash2, ExternalLink, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const HEADERS = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json" };

const CITY_TABLES = {
  "Weston": "weston_permit_types",
  "Coral Springs": "coral_springs_permit_types",
  "Fort Lauderdale": "fort_lauderdale_permit_types",
  "Hollywood": "hollywood_permit_types",
  "Cooper City": "cooper_city_permit_types",
};

const CITIES = Object.keys(CITY_TABLES);

const CATEGORIES = ["building", "electrical", "plumbing", "fire", "certificate", "planning", "engineering", "additional"];
const MAP_ZONES = ["garage", "roof", "windows", "pool", "backyard", "fence", "hvac", "electrical", "interior", "driveway", "structure"];

// ── Helpers ──────────────────────────────────────────────────────────────────

async function supabaseGet(table) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&order=name.asc`, { headers: HEADERS });
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function supabaseInsert(table, row) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...HEADERS, Prefer: "return=representation" },
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  return await res.json();
}

async function supabaseDelete(table, id) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: "DELETE",
    headers: HEADERS,
  });
  if (!res.ok) throw new Error(await res.text());
}

// ── Array field editor ───────────────────────────────────────────────────────

function ArrayFieldEditor({ label, items, onChange }) {
  const [newItem, setNewItem] = useState("");

  const add = () => {
    if (!newItem.trim()) return;
    onChange([...items, newItem.trim()]);
    setNewItem("");
  };

  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const update = (i, val) => onChange(items.map((it, idx) => (idx === i ? val : it)));

  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">{label}</label>
      <div className="space-y-1.5 mb-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-1.5">
            <input
              value={item}
              onChange={e => update(i, e.target.value)}
              className="flex-1 px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            <button onClick={() => remove(i)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-1.5">
        <input
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => e.key === "Enter" && add()}
          placeholder="Add item..."
          className="flex-1 px-2.5 py-1.5 text-sm border border-dashed border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-gray-50"
        />
        <button onClick={add} className="p-1.5 text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Preview / Edit form ──────────────────────────────────────────────────────

function PermitPreviewForm({ data, onChange, city, onImport, onCancel, importing, importSuccess }) {
  const field = (key) => ({
    value: data[key] || "",
    onChange: e => onChange({ ...data, [key]: e.target.value }),
    className: "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400",
  });

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between" style={{ background: "linear-gradient(135deg, #0D2B5E 0%, #0F3575 100%)" }}>
        <div>
          <p className="text-white font-bold text-sm">Preview & Edit Extracted Data</p>
          <p className="text-blue-200 text-xs mt-0.5">Review and correct before importing to {city}</p>
        </div>
        <button onClick={onCancel} className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
          <X className="w-4 h-4 text-white" />
        </button>
      </div>

      <div className="p-5 space-y-4">
        {/* Name */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Permit Name</label>
          <input {...field("name")} placeholder="e.g. Roof / Re-Roof" />
        </div>

        {/* Category + Map Zone */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Category</label>
            <select
              value={data.category || "building"}
              onChange={e => onChange({ ...data, category: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Map Zone</label>
            <select
              value={data.map_zone || "structure"}
              onChange={e => onChange({ ...data, map_zone: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
            >
              {MAP_ZONES.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Description</label>
          <textarea {...field("description")} rows={2} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none" placeholder="One-sentence description..." />
        </div>

        {/* Timeline + NOC */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Typical Timeline</label>
            <input {...field("typical_timeline")} placeholder="e.g. 3-5 business days" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">NOC Threshold ($)</label>
            <input
              type="number"
              value={data.noc_threshold || 2500}
              onChange={e => onChange({ ...data, noc_threshold: Number(e.target.value) })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
        </div>

        {/* Array fields */}
        <ArrayFieldEditor
          label="Typical Requirements"
          items={data.typical_requirements || []}
          onChange={val => onChange({ ...data, typical_requirements: val })}
        />
        <ArrayFieldEditor
          label="Documents Needed"
          items={data.documents_needed || []}
          onChange={val => onChange({ ...data, documents_needed: val })}
        />
        <ArrayFieldEditor
          label="Inspections Required"
          items={data.inspections_required || []}
          onChange={val => onChange({ ...data, inspections_required: val })}
        />

        {/* Actions */}
        {importSuccess ? (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
            <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
            <p className="text-sm font-semibold text-green-700">Permit imported successfully!</p>
          </div>
        ) : (
          <div className="flex gap-3 pt-2">
            <Button
              onClick={onImport}
              disabled={importing || !data.name}
              className="flex-1 text-white rounded-xl"
              style={{ background: "#0D2B5E" }}
            >
              {importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
              Looks good — Import
            </Button>
            <Button variant="outline" onClick={onCancel} className="rounded-xl">
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Permits table ────────────────────────────────────────────────────────────

function PermitsTable({ city, refreshKey }) {
  const [permits, setPermits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const load = async () => {
    if (!city) return;
    setLoading(true);
    const table = CITY_TABLES[city];
    const data = await supabaseGet(table);
    setPermits(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [city, refreshKey]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this permit type?")) return;
    setDeletingId(id);
    await supabaseDelete(CITY_TABLES[city], id);
    setPermits(prev => prev.filter(p => p.id !== id));
    setDeletingId(null);
  };

  const CATEGORY_COLORS = {
    building: "bg-blue-100 text-blue-700",
    electrical: "bg-yellow-100 text-yellow-700",
    plumbing: "bg-cyan-100 text-cyan-700",
    fire: "bg-red-100 text-red-700",
    certificate: "bg-green-100 text-green-700",
    planning: "bg-purple-100 text-purple-700",
    engineering: "bg-orange-100 text-orange-700",
    additional: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <p className="font-bold text-gray-800 text-sm">All Permits — {city}</p>
          <p className="text-xs text-gray-400 mt-0.5">{permits.length} permit type{permits.length !== 1 ? "s" : ""} in database</p>
        </div>
        <button onClick={load} className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
        </div>
      ) : permits.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No permits found for {city}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Zone</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Timeline</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {permits.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800 text-sm">{p.name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[p.category] || "bg-gray-100 text-gray-600"}`}>
                      {p.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden sm:table-cell">{p.map_zone || "—"}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">{p.typical_timeline || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(p.id)}
                      disabled={deletingId === p.id}
                      className="p-1.5 text-gray-300 hover:text-red-500 transition-colors disabled:opacity-40"
                      title="Delete permit"
                    >
                      {deletingId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function PermitImportTool() {
  const [city, setCity] = useState("Weston");
  const [pdfUrl, setPdfUrl] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importError, setImportError] = useState(null);
  const [tableRefreshKey, setTableRefreshKey] = useState(0);

  const handleExtract = async () => {
    if (!pdfUrl.trim()) return;
    setExtracting(true);
    setExtractError(null);
    setPreviewData(null);
    setImportSuccess(false);

    const res = await supabase.functions.invoke("extract-permit-from-pdf", { body: { pdfUrl: pdfUrl.trim(), city } });
    const data = res.data;

    if (data?.error) {
      setExtractError(data.error + (data.raw ? `\n\nAI raw response:\n${data.raw}` : ""));
    } else if (data?.data) {
      setPreviewData(data.data);
    } else {
      setExtractError("Unexpected response from extraction service.");
    }
    setExtracting(false);
  };

  const handleImport = async () => {
    if (!previewData || !city) return;
    setImporting(true);
    setImportError(null);

    const table = CITY_TABLES[city];
    const row = {
      name: previewData.name,
      category: previewData.category,
      map_zone: previewData.map_zone,
      description: previewData.description,
      typical_requirements: JSON.stringify(previewData.typical_requirements || []),
      documents_needed: JSON.stringify(previewData.documents_needed || []),
      inspections_required: JSON.stringify(previewData.inspections_required || []),
      typical_timeline: previewData.typical_timeline,
    };

    try {
      await supabaseInsert(table, row);
      setImportSuccess(true);
      setTableRefreshKey(k => k + 1);
      setTimeout(() => {
        setPreviewData(null);
        setPdfUrl("");
        setImportSuccess(false);
      }, 2500);
    } catch (err) {
      setImportError(err.message);
    }
    setImporting(false);
  };

  const handleCancel = () => {
    setPreviewData(null);
    setExtractError(null);
    setImportSuccess(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-800">Import Permit Checklist</h2>
        <p className="text-sm text-gray-500 mt-0.5">Paste the URL of an official city permit checklist PDF to automatically extract and import the requirements.</p>
      </div>

      {/* Step 1: URL Input */}
      {!previewData && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">City</label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                PDF / Document URL
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className={`ml-2 inline-flex items-center gap-0.5 text-blue-500 ${!pdfUrl ? "hidden" : ""}`}>
                  <ExternalLink className="w-3 h-3" /> open
                </a>
              </label>
              <input
                type="url"
                value={pdfUrl}
                onChange={e => setPdfUrl(e.target.value)}
                placeholder="https://city.gov/permits/checklist.pdf"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
          </div>

          <Button
            onClick={handleExtract}
            disabled={extracting || !pdfUrl.trim()}
            className="text-white rounded-xl px-6"
            style={{ background: "#3B82F6" }}
          >
            {extracting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            {extracting ? "Extracting..." : "Extract & Preview"}
          </Button>

          {extractError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <pre className="text-xs text-red-700 whitespace-pre-wrap font-sans">{extractError}</pre>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Preview */}
      {previewData && (
        <>
          <PermitPreviewForm
            data={previewData}
            onChange={setPreviewData}
            city={city}
            onImport={handleImport}
            onCancel={handleCancel}
            importing={importing}
            importSuccess={importSuccess}
          />
          {importError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{importError}</p>
            </div>
          )}
        </>
      )}

      {/* View all permits table */}
      <PermitsTable city={city} refreshKey={tableRefreshKey} />
    </div>
  );
}