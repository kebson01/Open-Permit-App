import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const NUMBER_FIELDS = new Set([
  "JUST_LAND_VALUE","JUST_BUILDING_VALUE","COUNTY_TAXABLE",
  "STAMP_AMOUNT_1","BLDG_TOT_SQ_FOOTAGE","BLDG_YEAR_BUILT",
  "BEDS","BATHS","BLDG_UNDER_AIR_SQ_FOOTAGE",
]);

const KEEP_FIELDS = new Set([
  "FOLIO_NUMBER","NAME_LINE_1","USE_CODE","USE_TYPE",
  "JUST_LAND_VALUE","JUST_BUILDING_VALUE","COUNTY_TAXABLE",
  "EXEMPTION_TYPE","HOMESTEAD_FLAG","SALE_DATE_1","STAMP_AMOUNT_1",
  "BLDG_TOT_SQ_FOOTAGE","BLDG_UNDER_AIR_SQ_FOOTAGE","BLDG_YEAR_BUILT",
  "BEDS","BATHS","SITUS_STREET_NUMBER","SITUS_STREET_DIRECTION",
  "SITUS_STREET_NAME","SITUS_STREET_TYPE","SITUS_CITY",
  "SITUS_ZIP_CODE","SITUS_UNIT_NUMBER","source_city_id",
]);

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

function buildRecord(headers, vals, detectedDelim) {
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
    rec.SITUS_STREET_NUMBER, rec.SITUS_STREET_DIRECTION, rec.SITUS_STREET_NAME,
    rec.SITUS_STREET_TYPE, rec.SITUS_UNIT_NUMBER ? `UNIT ${rec.SITUS_UNIT_NUMBER}` : null,
    rec.SITUS_CITY, rec.SITUS_ZIP_CODE,
  ].filter(Boolean).join(" ").toUpperCase();
  return rec;
}

// Expects: { headers_csv: string, lines: string[] }
// Parses the lines and bulk-inserts them. No URL fetching, no sleeping.
// Frontend is responsible for chunking the file and throttling between calls.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { headers_csv, lines } = body;

    if (!headers_csv || !Array.isArray(lines)) {
      return Response.json({ error: 'headers_csv and lines[] are required' }, { status: 400 });
    }

    const headers = headers_csv.split("|||");
    const sampleLine = lines.find(l => l && l.trim()) || "";
    const delim = detectDelimiter(sampleLine);

    const batch = [];
    for (const line of lines) {
      if (!line || !line.trim()) continue;
      const vals = parseLine(line, delim);
      if (vals.length < 5) continue;
      const rec = buildRecord(headers, vals, delim);
      if (rec) batch.push(rec);
    }

    if (batch.length > 0) {
      await base44.asServiceRole.entities.Property.bulkCreate(batch);
    }

    return Response.json({ success: true, imported: batch.length });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});