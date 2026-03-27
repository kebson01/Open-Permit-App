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

// Fetch a byte range from a URL, forcing no compression
async function fetchRange(url, start, end) {
  const resp = await fetch(url, {
    headers: {
      'Range': `bytes=${start}-${end}`,
      'Accept-Encoding': 'identity',
    }
  });
  if (!resp.ok && resp.status !== 206) {
    throw new Error(`Range fetch failed: ${resp.status}`);
  }
  return await resp.arrayBuffer();
}

// Get the total file size via HEAD request
async function getFileSize(url) {
  // Try HEAD first
  let resp = await fetch(url, {
    method: 'HEAD',
    headers: { 'Accept-Encoding': 'identity' }
  });
  if (resp.ok) {
    const cl = resp.headers.get('content-length');
    if (cl) return parseInt(cl, 10);
  }
  // Fall back to a Range request for first byte to get Content-Range
  resp = await fetch(url, {
    headers: { 'Range': 'bytes=0-0', 'Accept-Encoding': 'identity' }
  });
  const cr = resp.headers.get('content-range');
  if (cr) {
    const m = cr.match(/\/(\d+)$/);
    if (m) return parseInt(m[1], 10);
  }
  throw new Error('Could not determine file size');
}

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

const CHUNK_BYTES = 8 * 1024 * 1024; // 8MB per call — fast to fetch + parse
const BATCH_SIZE = 500;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { file_url, byte_offset = 0, headers_csv = null, leftover = "" } = body;
    if (!file_url) return Response.json({ error: 'file_url required' }, { status: 400 });

    // On first call, get total file size
    let total_bytes = body.total_bytes || null;
    if (!total_bytes) {
      total_bytes = await getFileSize(file_url);
    }

    const rangeStart = byte_offset;
    const rangeEnd = Math.min(byte_offset + CHUNK_BYTES - 1, total_bytes - 1);

    const buffer = await fetchRange(file_url, rangeStart, rangeEnd);
    const decoder = new TextDecoder('utf-8');
    const chunkText = leftover + decoder.decode(buffer);

    // Split into lines, keep last partial line as next leftover
    const lines = chunkText.split(/\r\n|\r|\n/);
    const isLastChunk = rangeEnd >= total_bytes - 1;
    const nextLeftover = isLastChunk ? "" : lines.pop(); // last line may be incomplete

    // Parse headers from first chunk
    let headers = null;
    let startIdx = 0;
    if (!headers_csv) {
      // First line is header
      const headerLine = lines[0];
      const delimiter = detectDelimiter(headerLine);
      headers = parseLine(headerLine, delimiter);
      startIdx = 1;
    } else {
      headers = headers_csv.split("|||");
    }

    const delimiter = detectDelimiter(headers.join("\t") + "\t"); // reconstruct delimiter hint
    // Re-detect delimiter from a data line instead
    const sampleLine = lines[startIdx] || lines[0];
    const detectedDelim = detectDelimiter(sampleLine);

    let batch = [];
    let imported = 0;

    const flush = async () => {
      if (batch.length === 0) return;
      await base44.asServiceRole.entities.Property.bulkCreate([...batch]);
      imported += batch.length;
      batch = [];
    };

    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i];
      if (!line || !line.trim()) continue;
      const vals = parseLine(line, detectedDelim);
      if (vals.length < 5) continue;
      const rec = buildRecord(headers, vals, detectedDelim);
      if (!rec) continue;
      batch.push(rec);
      if (batch.length >= BATCH_SIZE) await flush();
    }
    await flush();

    const nextByteOffset = rangeEnd + 1;
    const done = isLastChunk;

    return Response.json({
      success: true,
      imported,
      next_byte_offset: done ? null : nextByteOffset,
      total_bytes,
      processed_bytes: nextByteOffset,
      headers_csv: headers.join("|||"),
      next_leftover: nextLeftover,
      done,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});