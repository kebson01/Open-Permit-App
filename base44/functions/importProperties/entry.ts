import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

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

const BATCH_SIZE = 500;

function detectDelimiter(line) {
  const tabs = (line.match(/\t/g) || []).length;
  const pipes = (line.match(/\|/g) || []).length;
  const commas = (line.match(/,/g) || []).length;
  if (tabs >= pipes && tabs >= commas) return "\t";
  if (pipes >= commas) return "|";
  return ",";
}

function parseLine(line, delimiter) {
  const result = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQ = !inQ; }
    else if (ch === delimiter && !inQ) { result.push(cur.trim()); cur = ""; }
    else { cur += ch; }
  }
  result.push(cur.trim());
  return result;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { file_url, offset = 0 } = body;
    if (!file_url) return Response.json({ error: 'file_url required' }, { status: 400 });

    // Download the entire file to /tmp on first call (offset=0), reuse on subsequent calls
    const tmpPath = '/tmp/bcpa_import.csv';

    if (offset === 0) {
      // Download file to /tmp (streaming, no memory spike)
      const resp = await fetch(file_url);
      if (!resp.ok) return Response.json({ error: `Failed to fetch file: ${resp.status}` }, { status: 400 });
      const fileData = await resp.arrayBuffer();
      await Deno.writeFile(tmpPath, new Uint8Array(fileData));
    }

    // Read the file from /tmp starting at the given line offset
    const fileText = await Deno.readTextFile(tmpPath);
    const allLines = fileText.split(/\r\n|\r|\n/);

    // Parse headers from line 0
    const headerLine = allLines[0];
    const delimiter = detectDelimiter(headerLine);
    const headers = parseLine(headerLine, delimiter);

    // Process lines from offset (skip header line 0)
    const startLine = offset === 0 ? 1 : offset;
    const MAX_LINES_PER_CALL = 15000; // ~15k rows per call, safe within timeout
    const endLine = Math.min(startLine + MAX_LINES_PER_CALL, allLines.length);

    let batch = [];
    let imported = 0;

    const flush = async () => {
      if (batch.length === 0) return;
      await base44.asServiceRole.entities.Property.bulkCreate([...batch]);
      imported += batch.length;
      batch = [];
    };

    for (let i = startLine; i < endLine; i++) {
      const line = allLines[i];
      if (!line || !line.trim()) continue;
      const vals = parseLine(line, delimiter);
      if (vals.length < 5) continue;

      const rec = {};
      headers.forEach((h, idx) => {
        if (!KEEP_FIELDS.has(h)) return;
        const val = (vals[idx] ?? "").trim();
        if (val === "") {
          rec[h] = NUMBER_FIELDS.has(h) ? null : "";
        } else if (NUMBER_FIELDS.has(h)) {
          const n = parseFloat(val.replace(/,/g, ""));
          rec[h] = isNaN(n) ? null : n;
        } else {
          rec[h] = val;
        }
      });

      if (!rec.FOLIO_NUMBER) continue;

      rec.full_address = [
        rec.SITUS_STREET_NUMBER,
        rec.SITUS_STREET_DIRECTION,
        rec.SITUS_STREET_NAME,
        rec.SITUS_STREET_TYPE,
        rec.SITUS_UNIT_NUMBER ? `UNIT ${rec.SITUS_UNIT_NUMBER}` : null,
        rec.SITUS_CITY,
        rec.SITUS_ZIP_CODE,
      ].filter(Boolean).join(" ").toUpperCase();

      batch.push(rec);
      if (batch.length >= BATCH_SIZE) await flush();
    }
    await flush();

    const done = endLine >= allLines.length;
    const totalLines = allLines.length - 1; // exclude header

    return Response.json({
      success: true,
      imported,
      next_offset: done ? null : endLine,
      total_lines: totalLines,
      processed_through: endLine - 1,
      done,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});