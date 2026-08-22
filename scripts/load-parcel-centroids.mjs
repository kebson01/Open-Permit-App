/**
 * scripts/load-parcel-centroids.mjs
 *
 * Loads parcel centroids from the Broward County Property Appraiser's GIS into
 * `parcel_centroids`, then those coordinates are joined onto broward_properties.
 *
 * Why this exists rather than a geocoding bill: Google would charge roughly
 * $3,800 to geocode 758,232 addresses, and would match on street strings. BCPA
 * publishes the parcel polygons for free, keyed by the same folio we store, so
 * the join is exact.
 *
 * Why it runs here rather than in an edge function: BCPA accepts requests from
 * an ordinary host but resets the connection from Supabase's edge runtime. So
 * the fetching happens locally and the `geocode-parcels` function writes the
 * rows with the service role.
 *
 * Resumable — pass a start offset to continue after an interruption:
 *   node scripts/load-parcel-centroids.mjs [startOffset]
 */

const LAYER = 'https://gisweb-adapters.bcpa.net/arcgis/rest/services/BCPA_EXTERNAL_JAN26/MapServer/16/query';
const INGEST = 'https://gbknnjidqpmjrwlooluw.supabase.co/functions/v1/geocode-parcels';
const ANON = process.env.SUPABASE_ANON_KEY
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdia25uamlkcXBtanJ3bG9vbHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NTQzNDIsImV4cCI6MjA5MDIzMDM0Mn0.qwDACgXe3hesxBRQOzP53Hdc44z_UOka1_uYQScyi68';

const PAGE = 1000;

/** Ring vertex mean. These are small lots; good enough to place one. */
function centroidOf(rings) {
  const ring = rings?.[0];
  if (!Array.isArray(ring) || !ring.length) return null;
  let x = 0, y = 0, n = 0;
  for (const p of ring) {
    if (!Array.isArray(p) || p.length < 2) continue;
    if (!Number.isFinite(p[0]) || !Number.isFinite(p[1])) continue;
    x += p[0]; y += p[1]; n++;
  }
  return n ? [x / n, y / n] : null;
}

async function fetchPage(offset) {
  const url = new URL(LAYER);
  url.searchParams.set('where', '1=1');
  url.searchParams.set('outFields', 'FOLIO');
  url.searchParams.set('returnGeometry', 'true');
  url.searchParams.set('outSR', '4326');
  url.searchParams.set('geometryPrecision', '6');
  // Only the centroid matters, so let the server generalise the polygon —
  // this takes a page of 1,000 from ~2.7MB to ~160KB.
  url.searchParams.set('maxAllowableOffset', '0.0005');
  url.searchParams.set('resultOffset', String(offset));
  url.searchParams.set('resultRecordCount', String(PAGE));
  url.searchParams.set('f', 'json');

  const res = await fetch(url);
  if (!res.ok) throw new Error(`BCPA ${res.status} at offset ${offset}`);
  return res.json();
}

async function ingest(rows) {
  const res = await fetch(INGEST, {
    method: 'POST',
    headers: { Authorization: `Bearer ${ANON}`, apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ rows }),
  });
  const out = await res.json();
  if (!res.ok || out.error) throw new Error(`ingest failed: ${out.error || res.status}`);
  return out.upserted || 0;
}

const started = Date.now();
let offset = Number(process.argv[2] || 0);
let totalFetched = 0;
let totalUpserted = 0;
let page = 0;

console.log(`Loading parcel centroids from BCPA, starting at offset ${offset}\n`);

for (;;) {
  let data;
  try {
    data = await fetchPage(offset);
  } catch (e) {
    // Transient network trouble — wait and retry the same offset once.
    console.error(`  ${e.message} — retrying in 5s`);
    await new Promise(r => setTimeout(r, 5000));
    data = await fetchPage(offset);
  }

  const features = Array.isArray(data?.features) ? data.features : [];
  if (!features.length) break;

  // A parcel can appear more than once in a page when its geometry has several
  // parts, and Postgres rejects an upsert that touches the same key twice.
  const byFolio = new Map();
  for (const f of features) {
    const folio = f?.attributes?.FOLIO;
    const c = centroidOf(f?.geometry?.rings);
    if (!folio || !c) continue;
    byFolio.set(String(folio), { folio: String(folio), latitude: c[1], longitude: c[0] });
  }
  const rows = [...byFolio.values()];

  if (rows.length) totalUpserted += await ingest(rows);
  totalFetched += features.length;
  offset += features.length;
  page++;

  if (page % 10 === 0 || !data.exceededTransferLimit) {
    const mins = ((Date.now() - started) / 60000).toFixed(1);
    console.log(`  page ${page}: offset ${offset}, ${totalUpserted} centroids stored, ${mins} min elapsed`);
  }

  if (!data.exceededTransferLimit && features.length < PAGE) break;
}

const mins = ((Date.now() - started) / 60000).toFixed(1);
console.log(`\nDone. Fetched ${totalFetched}, stored ${totalUpserted}, in ${mins} minutes.`);
console.log('Next: join parcel_centroids onto broward_properties.');
