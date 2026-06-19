import { useState, useRef } from "react";
import * as db from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle2, Loader2, AlertCircle, Eye, X } from "lucide-react";

// All importable Property fields with friendly labels
const PROPERTY_FIELDS = [
  { key: "FOLIO_NUMBER", label: "Folio Number *", required: true },
  { key: "NAME_LINE_1", label: "Owner Name" },
  { key: "ADDRESS_LINE_1", label: "Mailing Address" },
  { key: "CITY", label: "Mailing City" },
  { key: "STATE", label: "Mailing State" },
  { key: "ZIP", label: "Mailing ZIP" },
  { key: "SITUS_STREET_NUMBER", label: "Site Street #" },
  { key: "SITUS_STREET_NAME", label: "Site Street Name" },
  { key: "SITUS_STREET_TYPE", label: "Site Street Type" },
  { key: "SITUS_CITY", label: "Site City" },
  { key: "SITUS_ZIP_CODE", label: "Site ZIP" },
  { key: "SITUS_UNIT_NUMBER", label: "Site Unit #" },
  { key: "USE_CODE", label: "Use Code" },
  { key: "USE_TYPE", label: "Use Type" },
  { key: "BLDG_YEAR_BUILT", label: "Year Built" },
  { key: "BEDS", label: "Bedrooms" },
  { key: "BATHS", label: "Bathrooms" },
  { key: "BLDG_UNDER_AIR_SQ_FOOTAGE", label: "Under-Air SqFt" },
  { key: "BLDG_TOT_SQ_FOOTAGE", label: "Total SqFt" },
  { key: "JUST_LAND_VALUE", label: "Land Value" },
  { key: "JUST_BUILDING_VALUE", label: "Building Value" },
  { key: "COUNTY_TAXABLE", label: "County Taxable Value" },
  { key: "EXEMPTION_TYPE", label: "Exemption Type" },
  { key: "HOMESTEAD_FLAG", label: "Homestead Flag" },
  { key: "SALE_DATE_1", label: "Last Sale Date" },
  { key: "STAMP_AMOUNT_1", label: "Last Sale Amount" },
];

function detectDelimiter(line) {
  const tabs = (line.match(/\t/g) || []).length;
  const pipes = (line.match(/\|/g) || []).length;
  const commas = (line.match(/,/g) || []).length;
  if (tabs >= pipes && tabs >= commas) return "\t";
  if (pipes >= commas) return "|";
  return ",";
}

function parseCsvLine(line, delim) {
  const result = [];
  let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQ = !inQ; }
    else if (ch === delim && !inQ) { result.push(cur.trim()); cur = ""; }
    else { cur += ch; }
  }
  result.push(cur.trim());
  return result;
}

// Auto-guess mapping: if CSV header closely matches a property field, pre-select it
function guessMapping(csvHeaders) {
  const mapping = {};
  for (const field of PROPERTY_FIELDS) {
    const normalized = field.key.toLowerCase().replace(/_/g, "");
    const match = csvHeaders.find(h => {
      const hn = h.toLowerCase().replace(/[^a-z0-9]/g, "");
      return hn === normalized || hn.includes(normalized) || normalized.includes(hn);
    });
    if (match) mapping[field.key] = match;
  }
  return mapping;
}

export default function PropertyCsvImport() {
  const [status, setStatus] = useState("idle"); // idle | parsed | importing | done | error
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [previewRows, setPreviewRows] = useState([]);
  const [allLines, setAllLines] = useState([]);
  const [delimiter, setDelimiter] = useState(",");
  const [mapping, setMapping] = useState({});
  const [imported, setImported] = useState(0);
  const [total, setTotal] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const fileRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const lines = text.split(/\r\n|\r|\n/).filter(l => l.trim());
      if (lines.length < 2) { setErrorMsg("File is empty or has no data rows."); setStatus("error"); return; }

      const delim = detectDelimiter(lines[0]);
      const headers = parseCsvLine(lines[0], delim);
      const preview = lines.slice(1, 6).map(l => parseCsvLine(l, delim));

      setDelimiter(delim);
      setCsvHeaders(headers);
      setPreviewRows(preview);
      setAllLines(lines);
      setMapping(guessMapping(headers));
      setTotal(lines.length - 1);
      setStatus("parsed");
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const runImport = async () => {
    if (!mapping["FOLIO_NUMBER"]) {
      setErrorMsg("You must map the Folio Number column.");
      return;
    }

    setStatus("importing");
    setImported(0);

    const dataLines = allLines.slice(1);
    const BATCH = 50;
    let done = 0;

    for (let i = 0; i < dataLines.length; i += BATCH) {
      const chunk = dataLines.slice(i, i + BATCH);
      const records = chunk.map(line => {
        const vals = parseCsvLine(line, delimiter);
        const rec = {};
        for (const [fieldKey, csvCol] of Object.entries(mapping)) {
          if (!csvCol) continue;
          const colIdx = csvHeaders.indexOf(csvCol);
          if (colIdx === -1) continue;
          const val = (vals[colIdx] || "").trim();
          if (!val) continue;
          // Numeric fields
          const numericFields = new Set([
            "JUST_LAND_VALUE","JUST_BUILDING_VALUE","COUNTY_TAXABLE",
            "BLDG_UNDER_AIR_SQ_FOOTAGE","BLDG_TOT_SQ_FOOTAGE",
            "BLDG_YEAR_BUILT","BEDS","BATHS","STAMP_AMOUNT_1",
          ]);
          rec[fieldKey] = numericFields.has(fieldKey) ? (parseFloat(val.replace(/,/g, "")) || null) : val;
        }
        // Build full_address
        rec.full_address = [
          rec.SITUS_STREET_NUMBER, rec.SITUS_STREET_NAME,
          rec.SITUS_STREET_TYPE, rec.SITUS_CITY, rec.SITUS_ZIP_CODE,
        ].filter(Boolean).join(" ").toUpperCase();
        return rec;
      }).filter(r => r.FOLIO_NUMBER);

      if (records.length > 0) {
        await db.Property.bulkCreate(records);
      }

      done += chunk.length;
      setImported(done);
    }

    setStatus("done");
  };

  const reset = () => {
    setStatus("idle"); setCsvHeaders([]); setPreviewRows([]); setAllLines([]);
    setMapping({}); setImported(0); setTotal(0); setErrorMsg("");
  };

  if (status === "idle") {
    return (
      <div
        className="border-2 border-dashed border-purple-300 rounded-xl p-10 text-center cursor-pointer hover:bg-purple-50 transition-colors"
        onClick={() => fileRef.current?.click()}
      >
        <Upload className="w-10 h-10 text-purple-400 mx-auto mb-3" />
        <p className="font-semibold text-gray-700">Click to select your CSV / TSV file</p>
        <p className="text-sm text-gray-400 mt-1">You'll map columns to Property fields before importing</p>
        <input ref={fileRef} type="file" accept=".csv,.txt,.tsv" className="hidden" onChange={handleFile} />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
        <AlertCircle className="w-5 h-5" />
        <span className="font-medium">{errorMsg}</span>
        <Button variant="outline" size="sm" onClick={reset} className="ml-auto">Try Again</Button>
      </div>
    );
  }

  if (status === "importing") {
    const pct = total > 0 ? Math.round((imported / total) * 100) : 0;
    return (
      <div className="text-center py-10">
        <Loader2 className="w-10 h-10 text-purple-500 mx-auto mb-3 animate-spin" />
        <p className="font-semibold text-purple-700">Importing properties...</p>
        <div className="mt-4 mx-auto max-w-xs">
          <div className="h-2 bg-purple-100 rounded-full overflow-hidden">
            <div className="h-2 bg-purple-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-sm text-purple-600 mt-1">{pct}% · {imported.toLocaleString()} / {total.toLocaleString()} rows</p>
        </div>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div>
        <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-3">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium">{imported.toLocaleString()} property records imported successfully.</span>
        </div>
        <Button variant="outline" onClick={reset}>Import Another File</Button>
      </div>
    );
  }

  // "parsed" state — show column mapping UI
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-semibold text-gray-800">Map CSV Columns → Property Fields</p>
          <p className="text-xs text-gray-400 mt-0.5">{total.toLocaleString()} data rows · {csvHeaders.length} columns detected · delimiter: {delimiter === "\t" ? "TAB" : delimiter}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={reset}><X className="w-4 h-4" /></Button>
      </div>

      {/* Mapping grid */}
      <div className="grid sm:grid-cols-2 gap-3 mb-6 max-h-80 overflow-y-auto pr-1">
        {PROPERTY_FIELDS.map(field => (
          <div key={field.key} className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-600 w-36 flex-shrink-0">{field.label}</label>
            <select
              className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-purple-400"
              value={mapping[field.key] || ""}
              onChange={e => setMapping(prev => ({ ...prev, [field.key]: e.target.value }))}
            >
              <option value="">— skip —</option>
              {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
        ))}
      </div>

      {/* Preview table */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2">
          <Eye className="w-4 h-4 text-purple-500" />
          <span className="text-sm font-medium text-gray-700">Preview (first 5 rows, mapped fields only)</span>
        </div>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {Object.entries(mapping).filter(([, v]) => v).map(([k]) => (
                  <th key={k} className="text-left px-3 py-2 font-medium text-gray-500 whitespace-nowrap">{k}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {previewRows.map((row, ri) => (
                <tr key={ri} className="hover:bg-gray-50">
                  {Object.entries(mapping).filter(([, v]) => v).map(([fieldKey, csvCol]) => {
                    const colIdx = csvHeaders.indexOf(csvCol);
                    return (
                      <td key={fieldKey} className="px-3 py-2 text-gray-600 max-w-[140px] truncate">
                        {row[colIdx] || "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2 mb-3 text-sm">
          <AlertCircle className="w-4 h-4" /> {errorMsg}
        </div>
      )}

      <Button onClick={runImport} className="bg-purple-600 hover:bg-purple-700">
        <Upload className="w-4 h-4 mr-2" /> Import {total.toLocaleString()} Records
      </Button>
    </div>
  );
}