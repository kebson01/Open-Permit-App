const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

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

function buildRecord(headers, vals, delim) {
  const rec = {};
  headers.forEach((h, idx) => {
    if (!KEEP_FIELDS.has(h)) return;
    const val = (vals[idx] ?? "").trim();
    if (val === "") {
      rec[h] = NUMBER_FIELDS.has(h) ? null : null;
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

  // Lowercase keys for Supabase (table columns are lowercase)
  const row = {};
  for (const [k, v] of Object.entries(rec)) {
    row[k.toLowerCase()] = v;
  }
  // folio_number is the primary key
  row.folio_number = rec.FOLIO_NUMBER;
  return row;
}

// Upsert a batch to Supabase via PostgREST
async function upsertBatch(rows) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/properties`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "resolution=merge-duplicates",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase upsert failed (${res.status}): ${text}`);
  }
}

// Expects: { headers_csv: string, lines: string[] }
Deno.serve(async (req) => {
  try {
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
      await upsertBatch(batch);
    }

    return Response.json({ success: true, imported: batch.length });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});