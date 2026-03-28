import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { ClipboardList, Plus, Upload, Search, Trash2, ChevronDown, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const PERMIT_TYPES = [
  "building","electrical","plumbing","mechanical","roofing",
  "demolition","fence","pool","addition","remodel","fire",
  "certificate_of_occupancy","other"
];

const STATUSES = ["issued","finaled","expired","voided","in_review","pending"];

const STATUS_COLORS = {
  issued: "bg-blue-100 text-blue-700",
  finaled: "bg-green-100 text-green-700",
  expired: "bg-gray-100 text-gray-600",
  voided: "bg-red-100 text-red-600",
  in_review: "bg-yellow-100 text-yellow-700",
  pending: "bg-orange-100 text-orange-700",
};

const BLANK = {
  folio_number: "", city_name: "", permit_number: "", permit_type: "building",
  permit_description: "", status: "issued", issued_date: "", finaled_date: "",
  expiration_date: "", contractor_name: "", contractor_license: "",
  job_value: "", square_footage: "", notes: "", source: "manual"
};

function AddPermitForm({ onSaved, onCancel }) {
  const [form, setForm] = useState({ ...BLANK });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.folio_number || !form.city_name || !form.permit_type) return;
    setSaving(true);
    const data = { ...form };
    if (data.job_value) data.job_value = parseFloat(data.job_value);
    if (data.square_footage) data.square_footage = parseFloat(data.square_footage);
    await base44.entities.PermitRecord.create(data);
    setSaving(false);
    onSaved();
  };

  return (
    <div className="bg-white border border-blue-200 rounded-xl p-5 mb-6">
      <h3 className="font-semibold text-gray-800 mb-4">Add Permit Record</h3>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Folio Number *</label>
          <Input placeholder="e.g. 514204012090" value={form.folio_number} onChange={e => set("folio_number", e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">City *</label>
          <Input placeholder="e.g. Weston" value={form.city_name} onChange={e => set("city_name", e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Permit Number</label>
          <Input placeholder="e.g. 2024-BLD-00123" value={form.permit_number} onChange={e => set("permit_number", e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Permit Type *</label>
          <select className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm" value={form.permit_type} onChange={e => set("permit_type", e.target.value)}>
            {PERMIT_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Status</label>
          <select className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm" value={form.status} onChange={e => set("status", e.target.value)}>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Issued Date</label>
          <Input type="date" value={form.issued_date} onChange={e => set("issued_date", e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Finaled Date</label>
          <Input type="date" value={form.finaled_date} onChange={e => set("finaled_date", e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Job Value ($)</label>
          <Input type="number" placeholder="e.g. 25000" value={form.job_value} onChange={e => set("job_value", e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Sq Footage</label>
          <Input type="number" placeholder="e.g. 1200" value={form.square_footage} onChange={e => set("square_footage", e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Contractor Name</label>
          <Input placeholder="Contractor LLC" value={form.contractor_name} onChange={e => set("contractor_name", e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Contractor License</label>
          <Input placeholder="CGC-123456" value={form.contractor_license} onChange={e => set("contractor_license", e.target.value)} />
        </div>
        <div className="sm:col-span-2 md:col-span-3">
          <label className="text-xs text-gray-500 mb-1 block">Description of Work</label>
          <Input placeholder="e.g. Roof replacement, 25 squares shingle" value={form.permit_description} onChange={e => set("permit_description", e.target.value)} />
        </div>
        <div className="sm:col-span-2 md:col-span-3">
          <label className="text-xs text-gray-500 mb-1 block">Notes</label>
          <Input placeholder="Internal notes..." value={form.notes} onChange={e => set("notes", e.target.value)} />
        </div>
      </div>
      <div className="flex gap-2 mt-4 justify-end">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={save} disabled={saving || !form.folio_number || !form.city_name}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          Save Permit
        </Button>
      </div>
    </div>
  );
}

function CSVImportPanel({ onDone }) {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    setResult(null);

    const text = await file.text();
    const lines = text.split(/\r\n|\r|\n/).filter(l => l.trim());
    if (lines.length < 2) { setResult({ error: "File appears empty." }); setImporting(false); return; }

    const rawHeaders = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/"/g, ""));
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(",").map(v => v.trim().replace(/^"|"$/g, ""));
      const obj = {};
      rawHeaders.forEach((h, idx) => { obj[h] = vals[idx] || ""; });

      const rec = {
        folio_number: obj.folio_number || obj.folio || obj.parcel || "",
        city_name: obj.city_name || obj.city || "",
        permit_number: obj.permit_number || obj.permit_no || "",
        permit_type: obj.permit_type || obj.type || "other",
        permit_description: obj.permit_description || obj.description || obj.desc || "",
        status: obj.status || "issued",
        issued_date: obj.issued_date || obj.issue_date || obj.issued || "",
        finaled_date: obj.finaled_date || obj.final_date || obj.finaled || "",
        contractor_name: obj.contractor_name || obj.contractor || "",
        contractor_license: obj.contractor_license || obj.license || "",
        job_value: parseFloat(obj.job_value || obj.value || "0") || null,
        square_footage: parseFloat(obj.square_footage || obj.sq_ft || "0") || null,
        source: "import",
      };
      if (rec.folio_number) rows.push(rec);
    }

    if (rows.length === 0) { setResult({ error: "No valid rows found. Make sure 'folio_number' column exists." }); setImporting(false); return; }

    // Bulk create in batches of 200
    let imported = 0;
    for (let i = 0; i < rows.length; i += 200) {
      await base44.entities.PermitRecord.bulkCreate(rows.slice(i, i + 200));
      imported += Math.min(200, rows.length - i);
    }

    setResult({ imported });
    setImporting(false);
    onDone();
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="bg-white border border-dashed border-blue-300 rounded-xl p-5 mb-6">
      <h3 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
        <Upload className="w-4 h-4 text-blue-500" /> Bulk Import from CSV
      </h3>
      <p className="text-xs text-gray-500 mb-3">
        CSV must have columns: <code className="bg-gray-100 px-1 rounded">folio_number, city_name, permit_type, status, issued_date, permit_description</code> (others optional)
      </p>
      {result?.error && <div className="flex items-center gap-2 text-red-600 text-sm mb-3"><AlertCircle className="w-4 h-4" />{result.error}</div>}
      {result?.imported && <div className="flex items-center gap-2 text-green-600 text-sm mb-3"><CheckCircle2 className="w-4 h-4" />{result.imported.toLocaleString()} records imported.</div>}
      <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={importing}>
        {importing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
        {importing ? "Importing..." : "Select CSV File"}
      </Button>
      <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
    </div>
  );
}

export default function AdminPermitRecords() {
  const [permits, setPermits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [filterCity, setFilterCity] = useState("all");
  const [filterType, setFilterType] = useState("all");

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.PermitRecord.list("-issued_date", 500);
    setPermits(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const cities = [...new Set(permits.map(p => p.city_name).filter(Boolean))].sort();

  const filtered = permits.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.folio_number?.includes(q) || p.permit_number?.toLowerCase().includes(q) || p.permit_description?.toLowerCase().includes(q) || p.contractor_name?.toLowerCase().includes(q);
    const matchCity = filterCity === "all" || p.city_name === filterCity;
    const matchType = filterType === "all" || p.permit_type === filterType;
    return matchSearch && matchCity && matchType;
  });

  const deletePermit = async (id) => {
    if (!window.confirm("Delete this permit record?")) return;
    await base44.entities.PermitRecord.delete(id);
    setPermits(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ClipboardList className="w-7 h-7 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Permit Records</h1>
            <p className="text-gray-500 text-sm">Manage municipal permit data by parcel/folio number</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setShowImport(!showImport); setShowAdd(false); }}>
            <Upload className="w-4 h-4 mr-1" /> Import CSV
          </Button>
          <Button size="sm" onClick={() => { setShowAdd(!showAdd); setShowImport(false); }}>
            <Plus className="w-4 h-4 mr-1" /> Add Permit
          </Button>
        </div>
      </div>

      {showAdd && <AddPermitForm onSaved={() => { setShowAdd(false); load(); }} onCancel={() => setShowAdd(false)} />}
      {showImport && <CSVImportPanel onDone={() => { setShowImport(false); load(); }} />}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input className="pl-9" placeholder="Search folio, permit #, description..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="h-9 rounded-md border border-input bg-white px-3 text-sm" value={filterCity} onChange={e => setFilterCity(e.target.value)}>
          <option value="all">All Cities</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="h-9 rounded-md border border-input bg-white px-3 text-sm" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="all">All Types</option>
          {PERMIT_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
        </select>
      </div>

      {/* Stats bar */}
      <div className="flex gap-4 mb-4 text-sm text-gray-500">
        <span className="font-medium text-gray-700">{filtered.length.toLocaleString()}</span> records
        {filterCity !== "all" && <span>· {filterCity}</span>}
        {filterType !== "all" && <span>· {filterType.replace(/_/g, " ")}</span>}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center gap-2 text-gray-400 py-10 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p>No permit records yet. Add one manually or import a CSV.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Folio</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">City</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Issued</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Permit #</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-blue-700">{p.folio_number}</td>
                    <td className="px-4 py-3 text-gray-700">{p.city_name}</td>
                    <td className="px-4 py-3"><span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">{p.permit_type?.replace(/_/g, " ")}</span></td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{p.permit_description || "—"}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[p.status] || "bg-gray-100 text-gray-600"}`}>{p.status?.replace(/_/g, " ")}</span></td>
                    <td className="px-4 py-3 text-gray-500">{p.issued_date || "—"}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.permit_number || "—"}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => deletePermit(p.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}