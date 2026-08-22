// supabase/functions/geocode-parcels/index.ts
//
// Open Permit — ingest endpoint for parcel centroids.
//
// Every camera scan resolves the user's city from GPS. broward_properties has
// latitude/longitude columns and a bounding-box lookup ready to use them, but
// none were populated, so every scan fell through to a Google reverse-geocode.
//
// Google geocoding of 758,232 addresses would cost roughly $3,800 and match on
// street strings. The Broward County Property Appraiser publishes the parcel
// polygons for free, keyed by the same folio number we already store, so the
// join is exact rather than fuzzy.
//
// This function does NOT fetch from BCPA. Their server accepts requests from an
// ordinary client but resets the connection from Supabase's edge runtime — a
// datacenter-IP block, not a user-agent one (verified: every UA succeeds from a
// normal host, and the reset is immediate). So the paging and centroid maths run
// wherever the operator is, and this endpoint exists purely to write the result
// with the service role.
//
// See scripts/load-parcel-centroids.mjs for the driver.
//
// Request:  { rows: [{ folio, latitude, longitude }, ...] }
// Response: { upserted }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

// Broward sits well inside this box; anything outside is bad geometry.
const inBroward = (lat: number, lng: number) =>
  lat >= 25.5 && lat <= 26.7 && lng >= -80.9 && lng <= -79.9

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const sb = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  try {
    const body = await req.json()
    const incoming = Array.isArray(body?.rows) ? body.rows : []
    if (incoming.length === 0) return json({ upserted: 0 })
    if (incoming.length > 5000) return json({ error: 'Send at most 5000 rows per call.' }, 400)

    const rows: { folio: string; latitude: number; longitude: number }[] = []
    for (const r of incoming) {
      const folio = String(r?.folio ?? '').trim()
      const lat = Number(r?.latitude)
      const lng = Number(r?.longitude)
      if (!folio || !Number.isFinite(lat) || !Number.isFinite(lng)) continue
      if (!inBroward(lat, lng)) continue
      rows.push({ folio, latitude: lat, longitude: lng })
    }

    if (rows.length === 0) return json({ upserted: 0 })

    const { error } = await sb.from('parcel_centroids').upsert(rows, { onConflict: 'folio' })
    if (error) return json({ error: error.message }, 500)

    return json({ upserted: rows.length })
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 400)
  }
})
