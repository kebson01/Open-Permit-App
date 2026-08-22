// supabase/functions/provider-contact-lookup/index.ts
//
// Open Permit — On-demand contractor / private-provider phone lookup.
//
// The Florida DBPR licensee data we import has name + license + address but no
// phone number. This function enriches a single record on demand by matching it
// against Yelp's business database:
//   1) GET /v3/businesses/matches  -> best business id for name+address
//   2) GET /v3/businesses/{id}     -> phone, display_phone, Yelp url
//
// On-demand only: the result is returned for display, NOT stored — this keeps us
// inside Yelp's API terms (which restrict long-term caching of their content).
//
// Requires the YELP_API_KEY secret. Without it the function returns
// { found: false } with an explanatory message rather than failing, so the UI
// degrades to name + licence + DBPR verification only.
//
// Request:  { name, address?, city?, state?, country? }
// Response: { found, phone?, display_phone?, yelp_url?, match_name?, message? }

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

const YELP = 'https://api.yelp.com/v3'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const key = Deno.env.get('YELP_API_KEY') ?? ''
  if (!key) {
    return json({ found: false, message: 'Phone lookup is not configured yet (missing YELP_API_KEY).' })
  }

  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch { /* empty body */ }

  const name    = String(body.name ?? '').trim()
  const address = String(body.address ?? '').trim()
  const city    = String(body.city ?? '').trim()
  const state   = String(body.state ?? 'FL').trim() || 'FL'
  const country = String(body.country ?? 'US').trim() || 'US'

  if (!name || !city) {
    return json({ found: false, message: 'Need at least a business name and city to search.' })
  }

  const auth = { Authorization: `Bearer ${key}`, accept: 'application/json' }

  try {
    const matchUrl = new URL(`${YELP}/businesses/matches`)
    matchUrl.searchParams.set('name', name)
    matchUrl.searchParams.set('address1', address)
    matchUrl.searchParams.set('city', city)
    matchUrl.searchParams.set('state', state)
    matchUrl.searchParams.set('country', country)
    matchUrl.searchParams.set('limit', '1')
    matchUrl.searchParams.set('match_threshold', 'default')

    const matchRes = await fetch(matchUrl, { headers: auth })
    if (!matchRes.ok) {
      const detail = matchRes.status === 429 ? 'Yelp rate limit reached — try again shortly.' : `Yelp lookup failed (${matchRes.status}).`
      return json({ found: false, message: detail })
    }
    const matchData = await matchRes.json()
    const biz = Array.isArray(matchData?.businesses) ? matchData.businesses[0] : null
    if (!biz?.id) {
      return json({ found: false, message: 'No confident Yelp match for this business.' })
    }

    const detRes = await fetch(`${YELP}/businesses/${encodeURIComponent(biz.id)}`, { headers: auth })
    const det = detRes.ok ? await detRes.json() : {}

    const phone         = det.phone || biz.phone || ''
    const display_phone = det.display_phone || biz.display_phone || phone || ''

    if (!phone && !display_phone) {
      return json({ found: false, message: 'Matched a business, but Yelp has no phone number listed for it.' })
    }

    return json({
      found: true,
      phone,
      display_phone,
      yelp_url: det.url || '',
      match_name: det.name || biz.name || name,
    })
  } catch (err) {
    return json({ found: false, message: `Lookup error: ${err instanceof Error ? err.message : String(err)}` })
  }
})
