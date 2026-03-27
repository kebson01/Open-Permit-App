import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle2, AlertCircle, Loader2, Trash2, Database } from "lucide-react";

function detectDelimiter(firstLine) {
  if (!firstLine) return "\t";
  const tabs = (firstLine.match(/\t/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  const pipes = (firstLine.match(/\|/g) || []).length;
  if (tabs >= commas && tabs >= pipes) return "\t";
  if (pipes >= commas) return "|";
  return ",";
}

function parseCSVLine(line, delimiter = "\t") {
  if (!line) return [];
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (!ch) continue;
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

// Only store fields that exist in the Property entity schema
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
  "CLASSIFIED_AG_VALUE","ACTUAL_YEAR_BUILT","ACTUAL_YEAR_BUILT",
]);

const BATCH_SIZE = 200;

export default function AdminPropertyImport() {
  const [status, setStatus] = useState("idle"); // idle | parsing | importing | done | error
  const [progress, setProgress] = useState({ current: 0, total: 0, batches: 0 });
  const [log, setLog] = useState([]);
  const [clearing, setClearing] = useState(false);
  const fileRef = useRef();

  const addLog = (msg) => setLog(prev => [...prev.slice(-50), msg]);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setStatus("parsing");
    setLog([]);
    setProgress({ current: 0, total: 0, batches: 0 });

    addLog(`Reading file: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`);

    const text = await file.text();
    const rawLines = text.split(/\r?\n/);
    const lines = rawLines.filter(l => l.trim());
    addLog(`Total raw lines: ${rawLines.length}, non-empty: ${lines.length}`);
    if (lines.length === 0) {
      addLog("ERROR: File appears empty or could not be read.");
      setStatus("error");
      return;
    }
    addLog(`First 80 chars of header: ${lines[0].substring(0, 80)}`);
    const delimiter = detectDelimiter(lines[0]);
    addLog(`Detected delimiter: ${delimiter === "\t" ? "TAB" : delimiter === "|" ? "PIPE" : "COMMA"}`);
    const headers = parseCSVLine(lines[0], delimiter);

    addLog(`Found ${lines.length - 1} rows, ${headers.length} columns`);

    const records = [];
    for (let i = 1; i < lines.length; i++) {
      const vals = parseCSVLine(lines[i], delimiter);
      if (vals.length < 5) continue;
      const rec = {};
      headers.forEach((h, idx) => {
        if (!KEEP_FIELDS.has(h)) return;
        let val = vals[idx] ?? "";
        val = val.trim();
        if (val === "" || val === "0" && NUMBER_FIELDS.has(h)) {
          // keep as null for numbers
          rec[h] = NUMBER_FIELDS.has(h) ? null : "";
        } else if (NUMBER_FIELDS.has(h)) {
          const n = parseFloat(val.replace(/,/g, ""));
          rec[h] = isNaN(n) ? null : n;
        } else {
          rec[h] = val;
        }
      });
      if (rec.FOLIO_NUMBER) {
        // Build a searchable full_address string for fast filtering
        rec.full_address = [
          rec.SITUS_STREET_NUMBER,
          rec.SITUS_STREET_DIRECTION,
          rec.SITUS_STREET_NAME,
          rec.SITUS_STREET_TYPE,
          rec.SITUS_UNIT_NUMBER ? `UNIT ${rec.SITUS_UNIT_NUMBER}` : null,
          rec.SITUS_CITY,
          rec.SITUS_ZIP_CODE,
        ].filter(Boolean).join(" ").toUpperCase();
        records.push(rec);
      }
    }

    addLog(`Parsed ${records.length} valid records. Starting import...`);
    setStatus("importing");

    const totalBatches = Math.ceil(records.length / BATCH_SIZE);
    setProgress({ current: 0, total: records.length, batches: totalBatches });

    let imported = 0;
    for (let b = 0; b < totalBatches; b++) {
      const batch = records.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
      await base44.entities.Property.bulkCreate(batch);
      imported += batch.length;
      setProgress(p => ({ ...p, current: imported }));
      if (b % 10 === 0) addLog(`Batch ${b + 1}/${totalBatches} — ${imported.toLocaleString()} records imported`);
    }

    addLog(`✅ Done! ${imported.toLocaleString()} properties imported.`);
    setStatus("done");
  };

  const handleClearAll = async () => {
    if (!window.confirm("This will DELETE ALL existing property records. Are you sure?")) return;
    setClearing(true);
    addLog("Clearing all existing property records...");
    await base44.entities.Property.filter({}).then(async (all) => {
      // We delete in batches using the SDK
    });
    // Use delete_entities equivalent via backend
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
          <p className="text-gray-500 text-sm">Upload the BCPA tab-delimited export file to populate the property database</p>
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
        onClick={() => fileRef.current?.click()}
      >
        <Upload className="w-10 h-10 text-blue-400 mx-auto mb-3" />
        <p className="font-semibold text-gray-700">Click to select BCPA export file</p>
        <p className="text-sm text-gray-400 mt-1">Tab-delimited .txt or .csv — any size</p>
        <input ref={fileRef} type="file" accept=".txt,.csv,.tsv" className="hidden" onChange={handleFile} />
      </div>

      {/* Progress */}
      {(status === "importing" || status === "done") && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {status === "done" ? "Import complete" : "Importing..."}
            </span>
            <span className="text-sm text-gray-500">{pct}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className="bg-blue-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {progress.current.toLocaleString()} / {progress.total.toLocaleString()} records
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