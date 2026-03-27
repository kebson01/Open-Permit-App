import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle2, Loader2, Trash2, Database } from "lucide-react";

function detectDelimiter(firstLine) {
  if (!firstLine) return "\t";
  const tabs = (firstLine.match(/\t/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  const pipes = (firstLine.match(/\|/g) || []).length;
  if (tabs >= commas && tabs >= pipes) return "\t";
  if (pipes >= commas) return "|";
  return ",";
}

function parseCSVLine(line, delimiter) {
  if (!line) return [];
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function buildRecord(headers, vals, delimiter) {
  if (vals.length < 5) return null;
  const rec = {};
  headers.forEach((h, idx) => {
    if (!KEEP_FIELDS.has(h)) return;
    let val = (vals[idx] ?? "").trim();
    if (val === "") {
      rec[h] = NUMBER_FIELDS.has(h) ? null : "";
    } else if (NUMBER_FIELDS.has(h)) {
      const n = parseFloat(val.replace(/,/g, ""));
      rec[h] = isNaN(n) ? null : n;
    } else {
      rec[h] = val;
    }
  });
  if (!rec.FOLIO_NUMBER) return null;
  rec.full_address = [
    rec.SITUS_STREET_NUMBER,
    rec.SITUS_STREET_DIRECTION,
    rec.SITUS_STREET_NAME,
    rec.SITUS_STREET_TYPE,
    rec.SITUS_UNIT_NUMBER ? `UNIT ${rec.SITUS_UNIT_NUMBER}` : null,
    rec.SITUS_CITY,
    rec.SITUS_ZIP_CODE,
  ].filter(Boolean).join(" ").toUpperCase();
  return rec;
}

const NUMBER_FIELDS = new Set([
  "JUST_LAND_VALUE","JUST_BUILDING_VALUE","JUST_OTHER_VALUE","LY_JUSTVAL",
  "PREV_SOH_VALUE","NEW_SOH_VALUE","HE1_AMOUNT","HE2_AMOUNT","HE3_AMOUNT",
  "WVD_AMOUNT","EXEMPTION_AMOUNT","COUNTY_TAXABLE","SCHOOL_TAXABLE",
  "CITY_TAXABLE","INDEP_TAXABLE","STAMP_AMOUNT_1","STAMP_AMOUNT_2",
  "STAMP_AMOUNT_3","STAMP_AMOUNT_4","STAMP_AMOUNT_5","BLDG_ADJ_SQ_FOOTAGE",
  "BLDG_TOT_SQ_FOOTAGE","BLDG_UNITS","BLDG_YEAR_BUILT","BLDG_NUM_OF",
  "BEDS","BATHS","GIS_SQUARE_FOOT","LAND_CALC_FACT_1","LAND_CALC_PRC_PER_FACT_UNIT_1",
  "PRELIM_JUST_VALUE","TRUE_MARKET","LAND_VALUE","FIRE_ASSESSMENT",
  "GARBAGE_ASSESSMENT","DRAINAGE_DISTRICT_ASSESSMENT","STORM_ASSESSMENT",
  "SAFE_NEIGHORHOOD_ASSESSMENT","CLASSIFIED_AG_VALUE","BLDG_UNDER_AIR_SQ_FOOTAGE",
  "AFFORDABLE_HOUSING_PERCENT","PORTED_VAL","SOH_YEAR","ACTUAL_YEAR_BUILT",
  "HE_PERCENT","LAND_CALC_FACT_2","LAND_CALC_FACT_3","LAND_CALC_FACT_4",
]);

const KEEP_FIELDS = new Set([
  "FOLIO_NUMBER","NAME_LINE_1","NAME_LINE_2","ADDRESS_LINE_1","ADDRESS_LINE_2",
  "CITY","STATE","ZIP","ZIP4","LEGAL_LINE_1","LEGAL_LINE_2","LEGAL_LINE_3",
  "LEGAL_LINE_4","LEGAL_LINE_5","LEGAL_LINE_6","LEGAL_LINE_7","LEGAL_LINE_8",
  "USE_CODE","USE_TYPE","MILLAGE_CODE","MILLAGE_CODE_EXPANDED","MARKET_AREA",
  "SUBMARKET_AREA","JUST_LAND_VALUE","JUST_BUILDING_VALUE","JUST_OTHER_VALUE",
  "LY_JUSTVAL","PRELIM_JUST_VALUE","TRUE_MARKET","LAND_VALUE","COUNTY_TAXABLE",
  "SCHOOL_TAXABLE","CITY_TAXABLE","INDEP_TAXABLE","EXEMPTION_AMOUNT","EXEMPTION_TYPE",
  "EXEMPTION_TYPE_EXPANDED","HE1_AMOUNT","HE2_AMOUNT","HE3_AMOUNT","HE_PERCENT",
  "HOMESTEAD_FLAG","WVD_AMOUNT","WVD_TYPE","SENIOR","SOH_YEAR","PREV_SOH_VALUE",
  "NEW_SOH_VALUE","PORTABILITY","PORTED_VAL","SALE_DATE_1","DEED_TYPE_1",
  "STAMP_AMOUNT_1","BOOK_1","PAGE_1","SALE1_QUAL_CODE","SALE_DATE_2","DEED_TYPE_2",
  "STAMP_AMOUNT_2","SALE_DATE_3","STAMP_AMOUNT_3","SALE_DATE_4","STAMP_AMOUNT_4",
  "SALE_DATE_5","STAMP_AMOUNT_5","BLDG_ADJ_SQ_FOOTAGE","BLDG_TOT_SQ_FOOTAGE",
  "BLDG_UNDER_AIR_SQ_FOOTAGE","BLDG_UNITS","BLDG_YEAR_BUILT","BLDG_IMPROVE_QUAL",
  "BLDG_CCLASS","BLDG_NUM_OF","BLDG_USE_CODE","BEDS","BATHS","GIS_SQUARE_FOOT",
  "LAND_CALC_FACT_1","LAND_CALC_TYPE_1","LAND_CALC_PRC_PER_FACT_UNIT_1",
  "SITUS_STREET_NUMBER","SITUS_STREET_NUMBER_END","SITUS_STREET_DIRECTION",
  "SITUS_STREET_POST_DIR","SITUS_STREET_NAME","SITUS_STREET_TYPE","SITUS_CITY",
  "SITUS_ZIP_CODE","SITUS_UNIT_NUMBER","FIRE_DISTRICT","FIRE_CLASS","FIRE_ASSESSMENT",
  "GARBAGE_DISTRICT","GARBAGE_ASSESSMENT","DRAINAGE_DISTRICT",
  "DRAINAGE_DISTRICT_ASSESSMENT","STORM_DISTRICT","STORM_ASSESSMENT",
  "LIGHT_DISTRICT","SAFE_NEIGHBORHOOD_DISTRICT","SAFE_NEIGHORHOOD_ASSESSMENT",
  "CRA","CENSUS_BLOCK","OWNERS_DOMICILE","LAST_PHYSICAL_INSPECTION","COMB_SPLIT",
  "COMB_SPLIT_DATE","AFFORDABLE_HOUSING","AFFORDABLE_HOUSING_PERCENT",
  "CLASSIFIED_AG_VALUE","ACTUAL_YEAR_BUILT",
]);

// Read file line-by-line in chunks to avoid memory crash on large files
function readFileLineByLine(file, onLine, onDone, onError) {
  const CHUNK_SIZE = 4 * 1024 * 1024; // 4MB chunks
  const decoder = new TextDecoder("utf-8");
  let offset = 0;
  let leftover = "";

  function readNextChunk() {
    const slice = file.slice(offset, offset + CHUNK_SIZE);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = decoder.decode(e.target.result, { stream: true });
      const combined = leftover + text;
      const lines = combined.split(/\r\n|\r|\n/);
      leftover = lines.pop(); // last partial line
      for (const line of lines) {
        onLine(line);
      }
      offset += CHUNK_SIZE;
      if (offset < file.size) {
        // Yield to browser between chunks
        setTimeout(readNextChunk, 0);
      } else {
        // Flush leftover
        if (leftover.trim()) onLine(leftover);
        onDone();
      }
    };
    reader.onerror = onError;
    reader.readAsArrayBuffer(slice);
  }

  readNextChunk();
}

const BATCH_SIZE = 200;
const IMPORT_BATCH_SIZE = 200;

export default function AdminPropertyImport() {
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState({ current: 0, total: 0, parsed: 0 });
  const [log, setLog] = useState([]);
  const [clearing, setClearing] = useState(false);
  const fileRef = useRef();
  const logRef = useRef([]);

  const addLog = (msg) => {
    logRef.current = [...logRef.current.slice(-50), msg];
    setLog([...logRef.current]);
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setStatus("parsing");
    setLog([]);
    logRef.current = [];
    setProgress({ current: 0, total: 0, parsed: 0 });

    addLog(`Reading file: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`);
    addLog(`Processing in 4MB chunks to avoid memory issues...`);

    let headers = null;
    let delimiter = "\t";
    let batch = [];
    let totalParsed = 0;
    let totalImported = 0;
    let lineCount = 0;
    let importQueue = Promise.resolve();

    const flushBatch = (batchToFlush) => {
      importQueue = importQueue.then(async () => {
        await base44.entities.Property.bulkCreate(batchToFlush);
        totalImported += batchToFlush.length;
        setProgress(p => ({ ...p, current: totalImported }));
      });
    };

    const onLine = (rawLine) => {
      const line = rawLine.trim();
      if (!line) return;
      lineCount++;

      if (!headers) {
        delimiter = detectDelimiter(line);
        addLog(`Header detected. Delimiter: ${delimiter === "\t" ? "TAB" : delimiter === "|" ? "PIPE" : "COMMA"}`);
        addLog(`First 80 chars: ${line.substring(0, 80)}`);
        headers = parseCSVLine(line, delimiter);
        addLog(`${headers.length} columns found`);
        return;
      }

      const vals = parseCSVLine(line, delimiter);
      const rec = buildRecord(headers, vals, delimiter);
      if (!rec) return;

      totalParsed++;
      batch.push(rec);

      if (batch.length >= IMPORT_BATCH_SIZE) {
        flushBatch(batch);
        batch = [];
        setProgress(p => ({ ...p, parsed: totalParsed }));
        if (totalParsed % 10000 === 0) {
          addLog(`Parsed ${totalParsed.toLocaleString()} records so far...`);
        }
      }
    };

    const onDone = async () => {
      if (batch.length > 0) {
        flushBatch(batch);
        batch = [];
      }

      addLog(`Parsing complete: ${totalParsed.toLocaleString()} records. Waiting for imports to finish...`);
      setStatus("importing");
      setProgress(p => ({ ...p, total: totalParsed }));

      await importQueue;
      addLog(`✅ Done! ${totalImported.toLocaleString()} properties imported.`);
      setStatus("done");
    };

    const onError = (err) => {
      addLog(`ERROR reading file: ${err.message || err}`);
      setStatus("error");
    };

    readFileLineByLine(file, onLine, onDone, onError);
  };

  const handleClearAll = async () => {
    if (!window.confirm("This will DELETE ALL existing property records. Are you sure?")) return;
    setClearing(true);
    addLog("Clearing all existing property records...");
    try {
      const res = await base44.functions.invoke("clearAllProperties", {});
      addLog(`Cleared: ${res.data?.deleted || "all"} records removed.`);
    } catch (err) {
      addLog(`Note: Could not auto-clear. Please use Admin → Database to clear manually.`);
    }
    setClearing(false);
  };

  const pct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Database className="w-7 h-7 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Property Data Import</h1>
          <p className="text-gray-500 text-sm">Upload the BCPA export file — streamed in chunks, any size</p>
        </div>
      </div>

      {/* Clear existing */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center justify-between">
        <div>
          <p className="font-medium text-red-800 text-sm">Clear existing data before importing?</p>
          <p className="text-red-600 text-xs mt-0.5">Recommended if replacing last year's data with a new export</p>
        </div>
        <Button variant="destructive" size="sm" onClick={handleClearAll} disabled={clearing || status === "importing"}>
          {clearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          Clear All
        </Button>
      </div>

      {/* Upload */}
      <div
        className="border-2 border-dashed border-blue-300 rounded-xl p-10 text-center cursor-pointer hover:bg-blue-50 transition-colors mb-6"
        onClick={() => status !== "importing" && fileRef.current?.click()}
      >
        <Upload className="w-10 h-10 text-blue-400 mx-auto mb-3" />
        <p className="font-semibold text-gray-700">Click to select BCPA export file</p>
        <p className="text-sm text-gray-400 mt-1">Tab-delimited or CSV — any size (streamed, won't crash)</p>
        <input ref={fileRef} type="file" accept=".txt,.csv,.tsv" className="hidden" onChange={handleFile} />
      </div>

      {/* Progress */}
      {(status === "parsing" || status === "importing" || status === "done") && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {status === "done" ? "Import complete" : status === "parsing" ? "Parsing & importing..." : "Finalizing imports..."}
            </span>
            <span className="text-sm text-gray-500">{pct > 0 ? `${pct}%` : "—"}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className="bg-blue-500 h-3 rounded-full transition-all duration-300"
              style={{ width: pct > 0 ? `${pct}%` : "4px" }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {progress.current.toLocaleString()} imported · {progress.parsed.toLocaleString()} parsed
          </p>
        </div>
      )}

      {status === "done" && (
        <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium">Import complete! Property search is now powered by the database.</span>
        </div>
      )}

      {/* Log */}
      {log.length > 0 && (
        <div className="bg-gray-900 text-green-400 rounded-xl p-4 font-mono text-xs space-y-1 max-h-48 overflow-y-auto">
          {log.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}
    </div>
  );
}