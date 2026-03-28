import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const BATCH_SIZE = 100;

// Known permit type keywords for auto-classification
const TYPE_KEYWORDS = {
  roofing:   ["roof", "re-roof", "reroof", "shingle", "tile roof"],
  electrical: ["electric", "panel", "service", "meter", "wiring", "solar", "pv", "ev charger"],
  plumbing:  ["plumb", "water heater", "sewer", "drain", "irrigation", "sprinkler"],
  mechanical: ["hvac", "a/c", "ac unit", "air condition", "mechanical", "duct", "exhaust"],
  pool:      ["pool", "spa", "hot tub"],
  fence:     ["fence", "fencing", "gate"],
  addition:  ["addition", "room addition", "extension", "balcony", "porch"],
  remodel:   ["remodel", "renovation", "kitchen", "bathroom", "interior"],
  demolition:["demo", "demolition", "remove", "tear down"],
  fire:      ["fire", "sprinkler", "alarm", "suppression"],
  certificate_of_occupancy: ["certificate of occupancy", "co ", " co,", "c.o."],
  building:  ["building", "window", "door", "garage", "driveway", "paver", "slab", "patio", "pergola", "shed"],
};

function classifyPermitType(description, rawType) {
  const d = (description || "").toLowerCase();
  const t = (rawType || "").toLowerCase();

  // Check raw type field first
  for (const [ptype, kws] of Object.entries(TYPE_KEYWORDS)) {
    if (kws.some(kw => t.includes(kw))) return ptype;
  }
  // Then check description
  for (const [ptype, kws] of Object.entries(TYPE_KEYWORDS)) {
    if (kws.some(kw => d.includes(kw))) return ptype;
  }
  return "other";
}

function classifyStatus(rawStatus) {
  const s = (rawStatus || "").toLowerCase().trim();
  if (s.includes("final")) return "finaled";
  if (s.includes("expir")) return "expired";
  if (s.includes("void") || s.includes("cancel")) return "voided";
  if (s.includes("review") || s.includes("pending") || s.includes("submitted")) return "in_review";
  if (s.includes("issued") || s.includes("approved") || s.includes("active")) return "issued";
  if (s.includes("open") || s.includes("in progress")) return "issued";
  return "issued";
}

function normalizeDate(val) {
  if (!val) return "";
  const d = val.trim().replace(/["']/g, "");
  if (!d) return "";
  // Try various formats
  const parsed = new Date(d);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }
  // MM/DD/YYYY
  const mmdd = d.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (mmdd) {
    const [, m, day, y] = mmdd;
    const year = y.length === 2 ? (parseInt(y) > 50 ? `19${y}` : `20${y}`) : y;
    return `${year}-${m.padStart(2,"0")}-${day.padStart(2,"0")}`;
  }
  return d;
}

function parseCSV(text) {
  const lines = text.split(/\r\n|\r|\n/).filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  // Detect delimiter
  const sample = lines[0];
  const tabs = (sample.match(/\t/g) || []).length;
  const pipes = (sample.match(/\|/g) || []).length;
  const commas = (sample.match(/,/g) || []).length;
  const delim = tabs >= pipes && tabs >= commas ? "\t" : pipes >= commas ? "|" : ",";

  const splitLine = (line) => {
    const result = [];
    let cur = "", inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === delim && !inQ) { result.push(cur.trim()); cur = ""; }
      else { cur += ch; }
    }
    result.push(cur.trim());
    return result;
  };

  const headers = splitLine(lines[0]).map(h => h.replace(/"/g, "").toLowerCase().trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const vals = splitLine(lines[i]);
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = (vals[idx] || "").replace(/^"|"$/g, "").trim(); });
    rows.push(obj);
  }
  return { headers, rows };
}

// Smart column resolver — tries many common column name variants
function resolve(obj, ...candidates) {
  for (const c of candidates) {
    for (const key of Object.keys(obj)) {
      if (key === c || key.replace(/[\s_\-]/g, "") === c.replace(/[\s_\-]/g, "")) {
        const val = obj[key];
        if (val !== undefined && val !== null && val !== "") return val;
      }
    }
  }
  return "";
}

function buildRecord(row, cityName, headers) {
  const folio = resolve(row,
    "folio_number","folio","parcel","parcelid","parcel_id","parcel number",
    "folio number","parcel no","apn","pin",
    "parcel_nbr","parcel nbr","parcelnbr","parcel_number"
  );
  if (!folio) return null;

  const rawType = resolve(row, "permit_type","type","permittype","work type","worktype","work_type","category","permit type");
  const description = resolve(row,
    "permit_description","description","desc","work_description","work description",
    "scope","scope of work","job description","project description",
    "record_name","record name","recordname","job_name","job name"
  );
  const rawStatus = resolve(row, "status","permit_status","permit status","current status","permit_status");
  const permitNumber = resolve(row,
    "permit_number","permit_no","permit no","permit#","permitnumber","permit number","application number","app_no",
    "record_id","record id","recordid","permit_id"
  );
  const issuedDate = normalizeDate(resolve(row,
    "issued_date","issue_date","issued","issue date","date issued","permit date","application date","app_date",
    "open_date","open date","opendate","start_date","start date"
  ));
  const finaledDate = normalizeDate(resolve(row,
    "finaled_date","final_date","finaled","final date","date finaled","completion date","completed_date"
  ));
  const expirationDate = normalizeDate(resolve(row,
    "expiration_date","expiry_date","expire_date","expiration","expires","exp date"
  ));
  const contractorName = resolve(row,
    "contractor_name","contractor","contractor name","company","business name","applicant"
  );
  const contractorLicense = resolve(row,
    "contractor_license","license","license_number","lic#","license no","contractor lic"
  );
  const jobValueRaw = resolve(row,
    "job_value","value","cost","construction_value","const_value","job cost","estimated cost","fee"
  );
  const sqftRaw = resolve(row,
    "square_footage","sq_ft","sqft","area","sf","square feet","bldg area"
  );

  const jobValue = parseFloat((jobValueRaw || "").replace(/[$,]/g, "")) || null;
  const squareFootage = parseFloat((sqftRaw || "").replace(/,/g, "")) || null;

  return {
    folio_number: folio.trim(),
    city_name: cityName,
    permit_number: permitNumber,
    permit_type: classifyPermitType(description, rawType),
    permit_description: description,
    status: classifyStatus(rawStatus),
    issued_date: issuedDate,
    finaled_date: finaledDate,
    expiration_date: expirationDate,
    contractor_name: contractorName,
    contractor_license: contractorLicense,
    job_value: jobValue,
    square_footage: squareFootage,
    source: "city_data",
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { file_url, city_name, preview_only = false, byte_offset = 0, leftover = "", headers_raw = null } = body;

    if (!file_url) return Response.json({ error: "file_url required" }, { status: 400 });
    if (!city_name) return Response.json({ error: "city_name required" }, { status: 400 });

    // Fetch up to 4MB chunk
    const CHUNK = 4 * 1024 * 1024;
    let total_bytes = body.total_bytes || null;

    // Get file size on first call
    if (!total_bytes) {
      const headResp = await fetch(file_url, { method: "HEAD", headers: { "Accept-Encoding": "identity" } });
      const cl = headResp.headers.get("content-length");
      if (cl) total_bytes = parseInt(cl, 10);
      if (!total_bytes) {
        // Fallback: range request
        const r = await fetch(file_url, { headers: { "Range": "bytes=0-0", "Accept-Encoding": "identity" } });
        const cr = r.headers.get("content-range");
        if (cr) total_bytes = parseInt(cr.match(/\/(\d+)$/)?.[1] || "0", 10);
      }
    }

    const rangeEnd = Math.min(byte_offset + CHUNK - 1, total_bytes - 1);
    const resp = await fetch(file_url, {
      headers: { "Range": `bytes=${byte_offset}-${rangeEnd}`, "Accept-Encoding": "identity" }
    });

    const buffer = await resp.arrayBuffer();
    const text = leftover + new TextDecoder("utf-8").decode(buffer);
    const isLastChunk = rangeEnd >= total_bytes - 1;

    const lines = text.split(/\r\n|\r|\n/);
    const nextLeftover = isLastChunk ? "" : lines.pop();

    let headers = headers_raw ? headers_raw.split("|||") : null;
    let startIdx = 0;

    if (!headers) {
      // Detect delimiter from first line
      const firstLine = lines[0] || "";
      const tabs = (firstLine.match(/\t/g) || []).length;
      const pipes = (firstLine.match(/\|/g) || []).length;
      const commas = (firstLine.match(/,/g) || []).length;
      const delim = tabs >= pipes && tabs >= commas ? "\t" : pipes >= commas ? "|" : ",";

      const splitLine = (line) => {
        const result = []; let cur = "", inQ = false;
        for (const ch of line) {
          if (ch === '"') { inQ = !inQ; }
          else if (ch === delim && !inQ) { result.push(cur.trim()); cur = ""; }
          else { cur += ch; }
        }
        result.push(cur.trim());
        return result;
      };

      headers = splitLine(firstLine).map(h => h.replace(/"/g, "").toLowerCase().trim());
      startIdx = 1;
    }

    // Detect delimiter from data line
    const sampleLine = lines[startIdx] || lines[0] || "";
    const tabs = (sampleLine.match(/\t/g) || []).length;
    const pipes = (sampleLine.match(/\|/g) || []).length;
    const commas = (sampleLine.match(/,/g) || []).length;
    const detectedDelim = tabs >= pipes && tabs >= commas ? "\t" : pipes >= commas ? "|" : ",";

    const splitLine = (line) => {
      const result = []; let cur = "", inQ = false;
      for (const ch of line) {
        if (ch === '"') { inQ = !inQ; }
        else if (ch === detectedDelim && !inQ) { result.push(cur.trim()); cur = ""; }
        else { cur += ch; }
      }
      result.push(cur.trim());
      return result;
    };

    const records = [];
    for (let i = startIdx; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const vals = splitLine(lines[i]);
      const row = {};
      headers.forEach((h, idx) => { row[h] = (vals[idx] || "").replace(/^"|"$/g, "").trim(); });
      const rec = buildRecord(row, city_name, headers);
      if (rec) records.push(rec);
    }

    // Preview mode — just return first 10 rows
    if (preview_only) {
      return Response.json({
        preview: records.slice(0, 10),
        headers,
        total_rows_in_chunk: records.length,
        total_bytes,
      });
    }

    // Bulk insert with delay to avoid rate limits
    let imported = 0;
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      await base44.asServiceRole.entities.PermitRecord.bulkCreate(records.slice(i, i + BATCH_SIZE));
      imported += Math.min(BATCH_SIZE, records.length - i);
      if (i + BATCH_SIZE < records.length) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    const nextByteOffset = rangeEnd + 1;
    const done = isLastChunk;

    return Response.json({
      success: true,
      imported,
      next_byte_offset: done ? null : nextByteOffset,
      total_bytes,
      processed_bytes: nextByteOffset,
      headers_raw: headers.join("|||"),
      next_leftover: nextLeftover,
      done,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});