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

async function fetchRange(url, start, end) {
  const resp = await fetch(url, {
    headers: { 'Range': `bytes=${start}-${end}`, 'Accept-Encoding': 'identity' }
  });
  if (!resp.ok && resp.status !== 206) throw new Error(`Range fetch failed: ${resp.status}`);
  return await resp.arrayBuffer();
}

async function getFileSize(url) {
  let resp = await fetch(url, { method: 'HEAD', headers: { 'Accept-Encoding': 'identity' } });
  if (resp.ok) {
    const cl = resp.headers.get('content-length');
    if (cl) return parseInt(cl, 10);
  }
  resp = await fetch(url, { headers: { 'Range': 'bytes=0-0', 'Accept-Encoding': 'identity' } });
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

function buildRecord(headers, vals) {
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

// Each call: fetch one chunk, parse up to BATCH_SIZE records, insert ONE batch, return immediately.
// The frontend loops calling this function — no sleeping inside the function at all.
const CHUNK_BYTES = 512 * 1024; // 512KB per call — small enough to parse quickly
const BATCH_SIZE = 20;          // insert 20 records per call

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { file_url, byte_offset = 0, headers_csv = null, leftover = "", total_bytes: tb = null } = body;

    if (!file_url) return Response.json({ error: 'file_url required' }, { status: 400 });

    const total_bytes = tb || await getFileSize(file_url);
    const rangeStart = byte_offset;
    const rangeEnd = Math.min(byte_offset + CHUNK_BYTES - 1, total_bytes - 1);
    const isLastChunk = rangeEnd >= total_bytes - 1;

    const buffer = await fetchRange(file_url, rangeStart, rangeEnd);
    const decoder = new TextDecoder('utf-8');
    const chunkText = leftover + decoder.decode(buffer);

    const lines = chunkText.split(/\r\n|\r|\n/);
    const nextLeftover = isLastChunk ? "" : (lines.pop() || "");

    // Parse headers
    let headers;
    let startIdx = 0;
    if (!headers_csv) {
      const headerLine = lines[0];
      const delim = detectDelimiter(headerLine);
      headers = parseLine(headerLine, delim);
      startIdx = 1;
    } else {
      headers = headers_csv.split("|||");
    }

    const sampleLine = lines[startIdx] || lines[0] || "";
    const detectedDelim = detectDelimiter(sampleLine);

    // Collect up to BATCH_SIZE valid records
    const batch = [];
    let linesConsumed = 0;
    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i];
      linesConsumed++;
      if (!line || !line.trim()) continue;
      const vals = parseLine(line, detectedDelim);
      if (vals.length < 5) continue;
      const rec = buildRecord(headers, vals);
      if (!rec) continue;
      batch.push(rec);
      if (batch.length >= BATCH_SIZE) break;
    }

    // Calculate how many bytes the consumed lines represent so frontend can resume
    // We count consumed chars and convert back to byte offset increment
    const consumedText = lines.slice(0, startIdx + linesConsumed).join("\n");
    const consumedBytes = new TextEncoder().encode(consumedText).length;
    const nextByteOffset = isLastChunk ? null : rangeStart + Math.min(consumedBytes, CHUNK_BYTES);

    // Insert the batch
    let imported = 0;
    if (batch.length > 0) {
      await base44.asServiceRole.entities.Property.bulkCreate(batch);
      imported = batch.length;
    }

    // Are there more lines in this chunk we haven't processed yet?
    const remainingLines = lines.slice(startIdx + linesConsumed);
    const hasMoreInChunk = remainingLines.some(l => l && l.trim());

    return Response.json({
      success: true,
      imported,
      next_byte_offset: isLastChunk && !hasMoreInChunk ? null : (byte_offset + CHUNK_BYTES),
      total_bytes,
      processed_bytes: byte_offset + CHUNK_BYTES,
      headers_csv: headers.join("|||"),
      next_leftover: isLastChunk ? "" : nextLeftover,
      done: isLastChunk && !hasMoreInChunk,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});