import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Database, Upload, Building2, ClipboardList, CheckCircle2,
  Loader2, AlertCircle, Trash2, Eye, ChevronRight, FileText, TableProperties
} from "lucide-react";
import PropertyCsvImport from "@/components/admin/PropertyCsvImport";

// ─── County Property Import ─────────────────────────────────────────────────
// Reads file locally in the browser, sends batches of lines directly to the
// backend function. No URL upload needed — function just parses + inserts.
const LINES_PER_BATCH = 20; // ~20 records per function call

function CountyImportPanel() {
  const [status, setStatus] = useState("idle");
  const [log, setLog] = useState([]);
  const [clearing, setClearing] = useState(false);
  const [imported, setImported] = useState(0);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef();

  const addLog = (msg) => setLog(prev => [...prev.slice(-60), msg]);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setStatus("processing"); setLog([]); setImported(0); setProgress(0);
    addLog(`Reading: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`);

    // Read entire file as text in the browser
    const text = await file.text();
    const allLines = text.split(/\r\n|\r|\n/);
    addLog(`Parsed ${allLines.length.toLocaleString()} lines. Starting import...`);

    if (allLines.length < 2) {
      addLog("ERROR: File appears empty.");
      setStatus("error");
      return;
    }

    // First line is header
    const headerLine = allLines[0];
    const headersCsv = headerLine.split(/\t/).length > headerLine.split(/,/).length
      ? headerLine.split(/\t/).map(h => h.trim()).join("|||")
      : headerLine.split(/,/).map(h => h.trim()).join("|||");

    const dataLines = allLines.slice(1).filter(l => l.trim());
    const totalLines = dataLines.length;
    let totalImported = 0;
    let chunkNum = 0;

    for (let i = 0; i < dataLines.length; i += LINES_PER_BATCH) {
      chunkNum++;
      const batch = dataLines.slice(i, i + LINES_PER_BATCH);

      let res;
      let attempts = 0;
      while (true) {
        attempts++;
        try {
          res = await base44.functions.invoke("importProperties", { headers_csv: headersCsv, lines: batch });
          break;
        } catch (err) {
          const status = err?.response?.status;
          if ((status === 429 || status === 503 || status === 502) && attempts <= 4) {
            const wait = attempts * 5000; // 5s, 10s, 15s, 20s
            addLog(`Server busy (${status}) — retrying in ${wait/1000}s... (attempt ${attempts})`);
            await sleep(wait);
          } else {
            throw err;
          }
        }
      }

      const result = res.data;
      if (result.error) { addLog(`ERROR: ${result.error}`); setStatus("error"); return; }

      totalImported += result.imported || 0;
      setImported(totalImported);
      const pct = Math.min(100, Math.round((i + batch.length) / totalLines * 100));
      setProgress(pct);

      if (chunkNum % 10 === 0) {
        addLog(`Chunk ${chunkNum}: ${totalImported.toLocaleString()} imported | ${pct}%`);
      }

      // Throttle: 2s between each batch call to avoid 503 overload
      await sleep(2000);
    }

    addLog(`✅ Done! ${totalImported.toLocaleString()} properties imported.`);
    setStatus("done"); setProgress(100);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleClear = async () => {
    if (!window.confirm("Delete ALL property records? This cannot be undone.")) return;
    setClearing(true);
    addLog("Clearing all property records...");

    let totalDeleted = 0;
    while (true) {
      const res = await base44.functions.invoke("clearAllProperties", {});
      if (res.data?.error) {
        addLog(`Error: ${res.data.error}`);
        break;
      }
      totalDeleted += res.data?.deleted || 0;
      addLog(`Deleted ${totalDeleted.toLocaleString()} records so far...`);
      if (res.data?.done) {
        addLog(`✅ Done! ${totalDeleted.toLocaleString()} records removed.`);
        break;
      }
    }
    setClearing(false);
  };

  const isProcessing = status === "uploading" || status === "processing";

  return (
    <div>
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-center justify-between">
        <div>
          <p className="font-medium text-red-800 text-sm">Clear existing property data first?</p>
          <p className="text-red-600 text-xs mt-0.5">Recommended when replacing with a new full BCPA export</p>
        </div>
        <Button variant="destructive" size="sm" onClick={handleClear} disabled={clearing || isProcessing}>
          {clearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          Clear All
        </Button>
      </div>

      <div
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
          isProcessing ? "border-blue-400 bg-blue-50 cursor-not-allowed" : "border-blue-300 hover:bg-blue-50"
        }`}
        onClick={() => !isProcessing && fileRef.current?.click()}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-10 h-10 text-blue-500 mx-auto mb-3 animate-spin" />
            <p className="font-semibold text-blue-700">Importing records...</p>
            {status === "processing" && progress > 0 && (
              <div className="mt-4 mx-auto max-w-xs">
                <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                  <div className="h-2 bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-sm text-blue-500 mt-1">{progress}% · {imported.toLocaleString()} rows</p>
              </div>
            )}
          </>
        ) : (
          <>
            <Upload className="w-10 h-10 text-blue-400 mx-auto mb-3" />
            <p className="font-semibold text-gray-700">Click to select BCPA export file</p>
            <p className="text-sm text-gray-400 mt-1">Tab-delimited TXT or CSV — any file size (chunked processing)</p>
          </>
        )}
        <input ref={fileRef} type="file" accept=".txt,.csv,.tsv" className="hidden" onChange={handleFile} />
      </div>

      {status === "done" && (
        <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mt-4">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium">{imported.toLocaleString()} properties imported successfully.</span>
        </div>
      )}
      {status === "error" && (
        <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mt-4">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">Import failed. See log below.</span>
        </div>
      )}
      {log.length > 0 && (
        <div className="mt-4 bg-gray-900 text-green-400 rounded-xl p-4 font-mono text-xs space-y-0.5 max-h-48 overflow-y-auto">
          {log.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}
    </div>
  );
}

// ─── Municipal Permit Import ──────────────────────────────────────────────
const PERMIT_TYPE_OPTIONS = [
  "building","electrical","plumbing","mechanical","roofing",
  "demolition","fence","pool","addition","remodel","fire",
  "certificate_of_occupancy","other"
];

function MunicipalImportPanel() {
  const [cityName, setCityName] = useState("");
  const [status, setStatus] = useState("idle");
  const [preview, setPreview] = useState(null);
  const [log, setLog] = useState([]);
  const [imported, setImported] = useState(0);
  const [progress, setProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [headers, setHeaders] = useState([]);
  const fileRef = useRef();

  const addLog = (msg) => setLog(prev => [...prev.slice(-60), msg]);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!cityName.trim()) { alert("Please enter the city name first."); return; }

    setStatus("uploading"); setPreview(null); setLog([]); setImported(0); setProgress(0);
    addLog(`Uploading: ${file.name}`);

    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setUploadedUrl(file_url);
    addLog("Upload complete. Generating preview...");

    // Preview first 10 rows
    const res = await base44.functions.invoke("importPermitRecords", {
      file_url,
      city_name: cityName.trim(),
      preview_only: true,
      byte_offset: 0,
      leftover: "",
    });

    if (res.data.error) {
      addLog(`Error: ${res.data.error}`);
      setStatus("error");
      return;
    }

    setPreview(res.data.preview || []);
    setHeaders(res.data.headers || []);
    addLog(`Preview: ${res.data.preview?.length} sample rows shown. Total bytes: ${(res.data.total_bytes / 1024 / 1024).toFixed(1)} MB`);
    addLog(`Detected columns: ${(res.data.headers || []).join(" | ")}`);
    setStatus("preview");
    if (fileRef.current) fileRef.current.value = "";
  };

  const runImport = async () => {
    if (!uploadedUrl || !cityName.trim()) return;
    setStatus("processing"); setImported(0); setProgress(0);
    addLog("Starting full import...");

    let byteOffset = 0, totalBytes = null, headersRaw = null, leftover = "", totalImported = 0, chunkNum = 0, rowsSkip = 0;

    while (true) {
      chunkNum++;
      const payload = {
        file_url: uploadedUrl,
        city_name: cityName.trim(),
        preview_only: false,
        byte_offset: byteOffset,
        leftover,
        headers_raw: headersRaw,
        rows_skip: rowsSkip,
      };
      if (totalBytes) payload.total_bytes = totalBytes;

      const res = await base44.functions.invoke("importPermitRecords", payload);
      const result = res.data;
      if (result.error) { addLog(`ERROR: ${result.error}`); setStatus("error"); return; }

      totalImported += result.imported || 0;
      setImported(totalImported);
      if (result.total_bytes) totalBytes = result.total_bytes;
      if (result.headers_raw) headersRaw = result.headers_raw;
      leftover = result.next_leftover || "";
      rowsSkip = result.next_rows_skip || 0;

      if (totalBytes) {
        const pct = Math.min(100, Math.round((result.processed_bytes || 0) / totalBytes * 100));
        setProgress(pct);
        addLog(`Chunk ${chunkNum}: +${result.imported} records | ${totalImported.toLocaleString()} total | ${pct}%`);
      }

      if (result.done || (!result.next_byte_offset && !rowsSkip)) break;
      byteOffset = result.next_byte_offset || byteOffset;
    }

    addLog(`✅ Done! ${totalImported.toLocaleString()} permit records imported for ${cityName}.`);
    setStatus("done"); setProgress(100);
  };

  const reset = () => {
    setStatus("idle"); setPreview(null); setLog([]); setImported(0);
    setProgress(0); setUploadedUrl(null); setHeaders([]);
  };

  const isProcessing = status === "uploading" || status === "processing";

  return (
    <div>
      {/* City name input */}
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 block mb-1">Municipality / City Name *</label>
        <Input
          placeholder="e.g. Weston, Coral Springs, Fort Lauderdale"
          value={cityName}
          onChange={e => setCityName(e.target.value)}
          disabled={isProcessing}
          className="max-w-sm"
        />
        <p className="text-xs text-gray-400 mt-1">This will be stored on every imported permit record.</p>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
        <p className="text-sm font-medium text-blue-800 mb-1">Accepted file formats</p>
        <p className="text-xs text-blue-700">
          CSV, TSV, or pipe-delimited files from any municipal permit portal. The system auto-detects columns
          for folio/parcel number, permit type, status, dates, contractor, and job value — even if column
          names differ between cities. Supported exports: Weston, Coral Springs, Accela Civic Platform,
          Energov, Tyler Munis, and most standard permit portal exports.
        </p>
      </div>

      {status === "idle" && (
        <div
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
            !cityName.trim() ? "border-gray-200 opacity-50" : "border-green-300 hover:bg-green-50"
          }`}
          onClick={() => cityName.trim() && fileRef.current?.click()}
        >
          <Upload className="w-10 h-10 text-green-400 mx-auto mb-3" />
          <p className="font-semibold text-gray-700">Click to select municipal permit export file</p>
          <p className="text-sm text-gray-400 mt-1">A preview will be shown before committing the import</p>
          <input ref={fileRef} type="file" accept=".csv,.txt,.tsv" className="hidden" onChange={handleFile} />
        </div>
      )}

      {status === "uploading" && (
        <div className="text-center py-10">
          <Loader2 className="w-10 h-10 text-green-500 mx-auto mb-3 animate-spin" />
          <p className="font-semibold text-green-700">Uploading file and generating preview...</p>
        </div>
      )}

      {/* Preview table */}
      {status === "preview" && preview && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-gray-800 text-sm">Preview — first {preview.length} records</span>
            <span className="text-xs text-gray-400">({headers.length} columns detected)</span>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["Folio", "Permit #", "Type", "Description", "Status", "Issued", "Contractor", "Value"].map(h => (
                    <th key={h} className="text-left px-3 py-2 font-medium text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {preview.map((p, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-mono text-blue-700">{p.folio_number || "—"}</td>
                    <td className="px-3 py-2 text-gray-600">{p.permit_number || "—"}</td>
                    <td className="px-3 py-2">
                      <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-xs">
                        {p.permit_type?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-600 max-w-xs truncate">{p.permit_description || "—"}</td>
                    <td className="px-3 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                        p.status === "finaled" ? "bg-green-100 text-green-700" :
                        p.status === "expired" ? "bg-gray-100 text-gray-600" :
                        "bg-blue-100 text-blue-700"
                      }`}>{p.status}</span>
                    </td>
                    <td className="px-3 py-2 text-gray-500">{p.issued_date || "—"}</td>
                    <td className="px-3 py-2 text-gray-600 max-w-[120px] truncate">{p.contractor_name || "—"}</td>
                    <td className="px-3 py-2 text-gray-600">{p.job_value ? `$${Number(p.job_value).toLocaleString()}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
            <strong>Column mapping used:</strong> {headers.join(", ")}
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={runImport} className="bg-green-600 hover:bg-green-700">
              <Upload className="w-4 h-4 mr-2" /> Import All Records for {cityName}
            </Button>
            <Button variant="outline" onClick={reset}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Progress */}
      {status === "processing" && (
        <div className="text-center py-8">
          <Loader2 className="w-10 h-10 text-green-500 mx-auto mb-3 animate-spin" />
          <p className="font-semibold text-green-700">Importing permit records for {cityName}...</p>
          {progress > 0 && (
            <div className="mt-4 mx-auto max-w-xs">
              <div className="h-2 bg-green-100 rounded-full overflow-hidden">
                <div className="h-2 bg-green-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-sm text-green-600 mt-1">{progress}% · {imported.toLocaleString()} records</p>
            </div>
          )}
        </div>
      )}

      {status === "done" && (
        <div>
          <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-3">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">{imported.toLocaleString()} permit records imported for {cityName}.</span>
          </div>
          <Button variant="outline" onClick={reset}>Import Another File</Button>
        </div>
      )}

      {status === "error" && (
        <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">Import failed. See log below.</span>
          <Button variant="outline" size="sm" onClick={reset} className="ml-auto">Try Again</Button>
        </div>
      )}

      {log.length > 0 && (
        <div className="mt-4 bg-gray-900 text-green-400 rounded-xl p-4 font-mono text-xs space-y-0.5 max-h-48 overflow-y-auto">
          {log.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────
const TABS = [
  {
    id: "county",
    label: "County Property Data",
    icon: Building2,
    description: "Import BCPA property records for the entire county. This populates the property search database.",
    color: "blue",
  },
  {
    id: "municipal",
    label: "Municipal Permit Records",
    icon: ClipboardList,
    description: "Import permit records from individual city/municipal permit portals. Links to properties by folio number.",
    color: "green",
  },
  {
    id: "csv_property",
    label: "Custom Property CSV",
    icon: TableProperties,
    description: "Upload any CSV file and map its columns to Property fields. Great for importing smaller custom property lists.",
    color: "purple",
  },
];

export default function AdminDataImport() {
  const [activeTab, setActiveTab] = useState("county");
  const tab = TABS.find(t => t.id === activeTab);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
          <Database className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Import Center</h1>
          <p className="text-gray-500 text-sm">Import county property records and municipal permit data</p>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 mb-8">
        <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" /> How the data pipeline works
        </h2>
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
            <div>
              <p className="font-medium text-gray-800">Import County Data</p>
              <p className="text-gray-500 text-xs mt-0.5">Upload the BCPA export to populate all property records with owner, valuation, and structural data.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
            <div>
              <p className="font-medium text-gray-800">Import Municipal Permits</p>
              <p className="text-gray-500 text-xs mt-0.5">Upload each city's permit export. The system auto-maps columns and links permits to properties via folio number.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
            <div>
              <p className="font-medium text-gray-800">Search & AI Analysis</p>
              <p className="text-gray-500 text-xs mt-0.5">Users search any property and instantly see its full permit history on the visual map with AI consultation.</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4 text-xs text-blue-600">
          <ChevronRight className="w-3 h-3" />
          Permit records are linked to properties using the folio/parcel number as the shared key.
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {TABS.map(t => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                active
                  ? t.color === "blue"
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : t.color === "green"
                    ? "bg-green-600 text-white border-green-600 shadow-sm"
                    : "bg-purple-600 text-white border-purple-600 shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:block">{t.label}</span>
              <span className="sm:hidden">{t.id === "county" ? "County" : t.id === "municipal" ? "Permits" : "CSV"}</span>
            </button>
          );
        })}
      </div>

      {/* Tab description */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <p className="text-sm text-gray-600">{tab.description}</p>
      </div>

      {/* Panel */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        {activeTab === "county" && <CountyImportPanel />}
        {activeTab === "municipal" && <MunicipalImportPanel />}
        {activeTab === "csv_property" && <PropertyCsvImport />}
      </div>
    </div>
  );
}