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
  // HE_PERCENT intentionally excluded — stores values like "10%", kept as string
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

// ~30MB per chunk — safe to process within timeout
const CHUNK_BYTES = 30 * 1024 * 1024;
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

function buildRecord(headers, vals, delimiter) {
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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { file_url, byte_offset = 0, headers_line = null } = await req.json();
    if (!file_url) return Response.json({ error: 'file_url required' }, { status: 400 });

    const rangeEnd = byte_offset + CHUNK_BYTES - 1;
    const fetchHeaders = {
      Range: `bytes=${byte_offset}-${rangeEnd}`,
      'Accept-Encoding': 'identity', // Prevent compressed response so Range requests work
    };

    const fileResp = await fetch(file_url, { headers: fetchHeaders });
    if (!fileResp.ok && fileResp.status !== 206) {
      return Response.json({ error: `Could not fetch file chunk: ${fileResp.status}` }, { status: 400 });
    }

    // Check if server returned full content (no range support) or partial
    const contentRange = fileResp.headers.get('content-range');
    const totalBytes = contentRange
      ? parseInt(contentRange.split('/')[1])
      : parseInt(fileResp.headers.get('content-length') || '0') + byte_offset;

    const chunkText = await fileResp.text();

    // Split into lines — but be careful: first and last lines may be partial
    const allLines = chunkText.split(/\r\n|\r|\n/);

    let headers = null;
    let delimiter = "\t";
    let resolvedHeadersLine = headers_line;

    // First chunk: first line is the header
    if (byte_offset === 0) {
      delimiter = detectDelimiter(allLines[0]);
      resolvedHeadersLine = allLines[0];
      headers = parseLine(resolvedHeadersLine, delimiter);
    } else {
      // Subsequent chunks: first line may be a partial line — skip it (it was handled by previous chunk's "leftover")
      // headers_line is passed in from frontend
      headers = parseLine(resolvedHeadersLine, detectDelimiter(resolvedHeadersLine));
      delimiter = detectDelimiter(resolvedHeadersLine);
    }

    const startLine = byte_offset === 0 ? 1 : 1; // skip first partial line for non-first chunks
    const lines = byte_offset === 0 ? allLines.slice(1) : allLines.slice(1); // always skip first line of chunk (partial or header)

    // The last line of the chunk is likely partial — skip it, it'll be re-read in the next chunk
    // We do this by ending the range overlap: the next chunk starts 1 line back
    // Instead, we track the last newline position to know the "safe" byte offset for next call
    const decoder = new TextEncoder();
    // Calculate how many bytes the "safe" portion (all complete lines) is
    const completeLines = lines.slice(0, -1); // drop last line (possibly partial)
    const lastLine = lines[lines.length - 1];

    const batch = [];
    let imported = 0;

    const flush = async () => {
      if (batch.length === 0) return;
      await base44.asServiceRole.entities.Property.bulkCreate([...batch]);
      imported += batch.length;
      batch.length = 0;
    };

    for (const line of completeLines) {
      if (!line.trim()) continue;
      const vals = parseLine(line, delimiter);
      if (vals.length < 5) continue;
      const rec = buildRecord(headers, vals, delimiter);
      if (rec) {
        batch.push(rec);
        if (batch.length >= BATCH_SIZE) await flush();
      }
    }
    await flush();

    // Calculate next byte offset: current offset + bytes of all complete lines consumed
    // The safe next offset = byte_offset + bytes up to and including the last complete newline
    const chunkBytes = new TextEncoder().encode(chunkText);
    // Find byte position of last newline in chunk
    let lastNewlineBytePos = -1;
    for (let i = chunkBytes.length - 1; i >= 0; i--) {
      if (chunkBytes[i] === 10 || chunkBytes[i] === 13) { // \n or \r
        lastNewlineBytePos = i;
        break;
      }
    }

    const nextOffset = lastNewlineBytePos >= 0
      ? byte_offset + lastNewlineBytePos + 1
      : byte_offset + chunkBytes.length;

    const done = nextOffset >= totalBytes;

    return Response.json({
      success: true,
      imported,
      next_offset: done ? null : nextOffset,
      total_bytes: totalBytes,
      headers_line: resolvedHeadersLine,
      done,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});