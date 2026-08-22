/**
 * scripts/run-geocode-join.mjs
 *
 * Copies parcel_centroids coordinates onto broward_properties, which is what
 * lets the camera scan resolve a city from GPS against a local bounding-box
 * index instead of paying Google for a reverse geocode on every scan.
 *
 * A single UPDATE over half a million rows exceeds every timeout in the path
 * (Postgres statement, PostgREST, the HTTP gateway), so the work is driven from
 * here in keyset batches — each call walks forward from the last folio seen,
 * which keeps every batch on an index and makes the run resumable from wherever
 * it stopped. Batching on `where latitude is null` instead would re-scan the
 * whole table on every call.
 *
 * This repo tracks no SQL, so the server side it depends on is recorded here.
 * Run once before the first use:
 *
 *   create or replace function public.geocode_batch(after_folio text, n int)
 *   returns table(last_folio text, updated int)
 *   language plpgsql security definer set search_path = public as $$
 *   declare v_last text; v_cnt int;
 *   begin
 *     create temp table _b on commit drop as
 *       select folio, latitude, longitude from parcel_centroids
 *       where folio > after_folio order by folio limit n;
 *     select max(folio) into v_last from _b;
 *     if v_last is null then return query select null::text, 0; return; end if;
 *     update broward_properties p
 *        set latitude = b.latitude, longitude = b.longitude, geocoded_at = now()
 *       from _b b where p."FOLIO_NUMBER" = b.folio;
 *     get diagnostics v_cnt = row_count;
 *     return query select v_last, v_cnt;
 *   end $$;
 *
 *   -- The anon role's own statement_timeout is a few seconds, far short of a
 *   -- 5,000-row batch, so the function carries its own.
 *   alter function public.geocode_batch(text, int) set statement_timeout = '50s';
 *
 *   -- Postgres grants EXECUTE to PUBLIC by default. This is a SECURITY DEFINER
 *   -- function that writes to broward_properties, so it must not be reachable
 *   -- with the anon key; revoking from anon alone is not enough.
 *   revoke execute on function public.geocode_batch(text, int) from public, anon, authenticated;
 *
 * Because of that last line this needs the service role key, not the anon key:
 *
 *   SUPABASE_SERVICE_ROLE_KEY=... node scripts/run-geocode-join.mjs [afterFolio]
 */

const URL_ = 'https://gbknnjidqpmjrwlooluw.supabase.co/rest/v1/rpc/geocode_batch';
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!KEY) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY — geocode_batch is not callable with the anon key.');
  process.exit(1);
}

const N = 5000;

async function batch(after) {
  const res = await fetch(URL_, {
    method: 'POST',
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ after_folio: after, n: N }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`rpc ${res.status}: ${JSON.stringify(body)}`);
  return Array.isArray(body) ? body[0] : body;
}

const started = Date.now();
let after = process.argv[2] || '';
let updated = 0;
let calls = 0;

console.log(`Joining centroids onto broward_properties from folio "${after}"\n`);

for (;;) {
  let row;
  try {
    row = await batch(after);
  } catch (e) {
    console.error(`  ${e.message} — retrying in 5s`);
    await new Promise(r => setTimeout(r, 5000));
    row = await batch(after);
  }

  if (!row || !row.last_folio) break;

  after = row.last_folio;
  updated += row.updated || 0;
  calls++;

  if (calls % 10 === 0) {
    const mins = ((Date.now() - started) / 60000).toFixed(1);
    console.log(`  ${calls} batches, ${updated} properties geocoded, at folio ${after}, ${mins} min`);
  }
}

const mins = ((Date.now() - started) / 60000).toFixed(1);
console.log(`\nDone. ${updated} properties geocoded in ${calls} batches, ${mins} minutes.`);
