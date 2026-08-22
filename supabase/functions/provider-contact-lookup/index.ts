// supabase/functions/provider-contact-lookup/index.ts
//
// Open Permit — On-demand contractor phone lookup.
//
// The Florida DBPR licensee file has name, licence and mailing address but no
// phone or email, so a number has to be matched against a business directory.
//
// Google Places is tried first. Nearly every working contractor keeps a Google
// Business Profile because that is how customers find them, whereas a trade
// contractor who never courted reviews may have no Yelp listing at all. Places
// also runs on the GOOGLE_MAPS_API_KEY this project already uses for geocoding,
// so it needs no new account.
//
// Yelp remains as a fallback and runs only if YELP_API_KEY is set.
//
// Nothing is stored. Both providers restrict caching of their content, and an
// on-demand lookup keeps us inside those terms — the cost is one call per tap
// rather than a directory we own.
//
// Matching is guarded. A text search will happily return *a* business for a
// vague query, and showing the wrong company's phone against a licensed
// contractor's name is worse than showing no phone: someone would ring a
// stranger believing they had reached the licence holder. A result is only
// returned when its name or address plausibly corresponds to what we asked for,
// and what was matched is returned so the caller can show it.
//
// Request:  { name, address?, city?, state?, country? }
// Response: { found, phone?, display_phone?, website?, match_name?, matched_address?,
//             source?, message? }

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

const PLACES = 'https://places.googleapis.com/v1/places:searchText'
const YELP = 'https://api.yelp.com/v3'

// Corporate suffixes and trade words carry no identifying weight — two unrelated
// firms both being "ELECTRIC LLC" must not count as a match.
const NOISE = new Set([
  // Corporate forms.
  'inc', 'llc', 'l.l.c', 'corp', 'corporation', 'co', 'company', 'incorporated',
  'ltd', 'the', 'and', 'of', 'a', 'services', 'service', 'group', 'enterprises',
  'contracting', 'contractors', 'contractor', 'construction', 'systems', 'solutions',
  // Trade words. These are the whole reason a guard is needed: searching for
  // "M&R Priority Electric" returned "Mr. Electric Inc", a different firm in a
  // different city, and the two share only the word "electric".
  'electric', 'electrical', 'plumbing', 'plumber', 'roofing', 'roof', 'roofers',
  'air', 'conditioning', 'hvac', 'heating', 'cooling', 'mechanical', 'pool',
  'spa', 'pools', 'solar', 'glass', 'window', 'windows', 'door', 'doors',
  'pump', 'irrigation', 'alarm', 'fire', 'sprinkler', 'paving', 'concrete',
])

const tokens = (s: string) =>
  (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1 && !NOISE.has(t))

/**
 * True when the returned business plausibly is the one we asked for.
 *
 * Accepts on either a distinctive shared word in the name, or a street-number
 * match in the address — a contractor often trades under a name that differs
 * slightly from the DBPR record, but rarely from a different building.
 */
function isPlausibleMatch(
  wanted: { name: string; address: string; city: string },
  got: { name: string; address: string },
): boolean {
  const want = new Set(tokens(wanted.name))
  const have = tokens(got.name)
  if (have.some(t => want.has(t))) return true

  const wantNum = (wanted.address.match(/\b\d{2,6}\b/) || [])[0]
  const gotNum = (got.address.match(/\b\d{2,6}\b/) || [])[0]
  if (wantNum && gotNum && wantNum === gotNum) {
    return got.address.toLowerCase().includes((wanted.city || '').toLowerCase())
  }
  return false
}

async function tryGooglePlaces(
  key: string,
  wanted: { name: string; address: string; city: string; state: string },
) {
  const textQuery = [wanted.name, wanted.address, wanted.city, wanted.state]
    .filter(Boolean).join(', ')

  const res = await fetch(PLACES, {
    method: 'POST',
    headers: {
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask':
        'places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ textQuery, maxResultCount: 3 }),
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    // Surface Google's own wording — when the API simply is not switched on for
    // the project it says so precisely, which is the fastest thing to act on.
    const detail = data?.error?.message || `Places request failed (${res.status}).`
    return { ok: false as const, message: detail }
  }

  const places = Array.isArray(data?.places) ? data.places : []
  for (const p of places) {
    const name = p?.displayName?.text || ''
    const address = p?.formattedAddress || ''
    const phone = p?.nationalPhoneNumber || p?.internationalPhoneNumber || ''
    if (!phone) continue
    if (!isPlausibleMatch({ name: wanted.name, address: wanted.address, city: wanted.city }, { name, address })) continue

    return {
      ok: true as const,
      found: true,
      phone: p?.internationalPhoneNumber || phone,
      display_phone: p?.nationalPhoneNumber || phone,
      website: p?.websiteUri || '',
      match_name: name,
      matched_address: address,
      source: 'google',
    }
  }

  return { ok: true as const, found: false, message: 'No confident business match with a listed phone number.' }
}

async function tryYelp(
  key: string,
  wanted: { name: string; address: string; city: string; state: string; country: string },
) {
  const auth = { Authorization: `Bearer ${key}`, accept: 'application/json' }

  const matchUrl = new URL(`${YELP}/businesses/matches`)
  matchUrl.searchParams.set('name', wanted.name)
  matchUrl.searchParams.set('address1', wanted.address)
  matchUrl.searchParams.set('city', wanted.city)
  matchUrl.searchParams.set('state', wanted.state)
  matchUrl.searchParams.set('country', wanted.country)
  matchUrl.searchParams.set('limit', '1')
  matchUrl.searchParams.set('match_threshold', 'default')

  const matchRes = await fetch(matchUrl, { headers: auth })
  if (!matchRes.ok) {
    return { found: false, message: matchRes.status === 429 ? 'Yelp rate limit reached — try again shortly.' : `Yelp lookup failed (${matchRes.status}).` }
  }

  const matchData = await matchRes.json()
  const biz = Array.isArray(matchData?.businesses) ? matchData.businesses[0] : null
  if (!biz?.id) return { found: false, message: 'No confident match for this business.' }

  const detRes = await fetch(`${YELP}/businesses/${encodeURIComponent(biz.id)}`, { headers: auth })
  const det = detRes.ok ? await detRes.json() : {}

  const phone = det.phone || biz.phone || ''
  const display_phone = det.display_phone || biz.display_phone || phone || ''
  if (!phone && !display_phone) {
    return { found: false, message: 'Matched a business, but no phone number is listed for it.' }
  }

  return {
    found: true,
    phone,
    display_phone,
    website: det.url || '',
    match_name: det.name || biz.name || wanted.name,
    matched_address: (det.location?.display_address || []).join(', '),
    source: 'yelp',
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const googleKey = Deno.env.get('GOOGLE_MAPS_API_KEY') ?? ''
  const yelpKey = Deno.env.get('YELP_API_KEY') ?? ''

  if (!googleKey && !yelpKey) {
    return json({ found: false, message: 'Phone lookup is not configured (no GOOGLE_MAPS_API_KEY or YELP_API_KEY).' })
  }

  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch { /* empty body */ }

  const wanted = {
    name: String(body.name ?? '').trim(),
    address: String(body.address ?? '').trim(),
    city: String(body.city ?? '').trim(),
    state: String(body.state ?? 'FL').trim() || 'FL',
    country: String(body.country ?? 'US').trim() || 'US',
  }

  if (!wanted.name || !wanted.city) {
    return json({ found: false, message: 'Need at least a business name and city to search.' })
  }

  let googleNote = ''

  try {
    if (googleKey) {
      const g = await tryGooglePlaces(googleKey, wanted)
      if (g.ok && g.found) {
        const { ok: _ok, ...payload } = g   // ok is internal control flow
        return json(payload)
      }
      googleNote = g.ok ? (g.message || '') : (g.message || '')
      // A Places failure is worth carrying forward: if Yelp is not configured
      // either, the caller should see why Google did not answer.
    }

    if (yelpKey) {
      const y = await tryYelp(yelpKey, wanted)
      if (y.found) return json(y)
      return json({ found: false, message: y.message || googleNote || 'No listing found.' })
    }

    return json({ found: false, message: googleNote || 'No listing found.' })
  } catch (err) {
    return json({ found: false, message: `Lookup error: ${err instanceof Error ? err.message : String(err)}` })
  }
})
