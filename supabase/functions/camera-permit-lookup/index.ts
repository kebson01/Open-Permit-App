// supabase/functions/camera-permit-lookup/index.ts
//
// Open Permit — Live Camera Permit Lookup (backend)
// Point the rear camera at an item -> Claude identifies it -> return permit
// requirements for the user's GPS city + licensed contractors who can do the work.
//
// Request:  { image: base64, mediaType?: "image/jpeg", lat?: number, lng?: number }
// Response shape is consumed verbatim by src/components/CameraPermitScan.jsx.
//
// City resolution reuses the proven GPS->property->city logic from `ar-tools`.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

// Contractor categories the Provider Directory understands (keep in sync with
// src/pages/ProviderDirectory.jsx CATEGORIES). The model picks the best match.
const CONTRACTOR_CATEGORIES = [
  'Roofing', 'HVAC / A/C', 'Plumbing / Gas', 'Pool & Spa', 'Solar',
  'General / Building', 'Specialty / Openings', 'Site / Driveway / Utility',
  'Irrigation', 'Electrical', 'Alarm', 'Engineering / Design', 'Architecture',
]

// Structured output the model must fill. Forcing tool use guarantees valid JSON.
const DETECT_SCHEMA = {
  type: 'object',
  properties: {
    item_label: { type: 'string', description: 'Plain-words name of the main item in view, e.g. "Tankless water heater".' },
    work_type: { type: 'string', description: 'The permittable work this item implies, e.g. "Water heater replacement". Empty if no permit-relevant item is visible.' },
    confidence: { type: 'number', description: '0..1 confidence that item_label is correct.' },
    permit_likely: { type: 'boolean', description: 'Whether this work typically requires a building permit in Florida.' },
    permit_id: { type: 'string', description: 'The matching permit_id from the provided city permit list, if one clearly applies. Empty otherwise.' },
    contractor_category: { type: 'string', description: `Best match from this list for who does this work: ${CONTRACTOR_CATEGORIES.join(', ')}. Empty if none fit.` },
    summary: { type: 'string', description: 'One brief sentence on the permit situation for this item.' },
    documents_needed: { type: 'array', items: { type: 'string' }, description: 'Typical documents for this permit in Florida / Broward County.' },
    typical_requirements: { type: 'array', items: { type: 'string' } },
    inspections_required: { type: 'array', items: { type: 'string' } },
    typical_timeline: { type: 'string', description: 'Rough turnaround, e.g. "1-2 weeks".' },
    no_permit_reason: { type: 'string', description: 'If permit_likely is false, why not. Empty otherwise.' },
  },
  required: ['item_label', 'confidence', 'permit_likely'],
}

// ── GPS -> city resolution (ported from ar-tools) ─────────────────────────────
const SUFFIX_MAP: Record<string, string> = {
  STREET: 'ST', AVENUE: 'AVE', AVENUES: 'AVE', AV: 'AVE', DRIVE: 'DR', COURT: 'CT', COURTS: 'CT',
  TERRACE: 'TER', TERRACES: 'TER', TERR: 'TER', BOULEVARD: 'BLVD', BOULV: 'BLVD',
  ROAD: 'RD', WAY: 'WAY', CIRCLE: 'CIR', CIRC: 'CIR', PLACE: 'PL', LANE: 'LN', HIGHWAY: 'HWY',
  MANOR: 'MNR', MANORS: 'MNR', PARKWAY: 'PKWY', PKWAY: 'PKWY', PKY: 'PKWY', TRAIL: 'TRL',
  POINT: 'PT', CAUSEWAY: 'CSWY', SQUARE: 'SQ', EXTENSION: 'EXT', HOLLOW: 'HOLW',
  CRESCENT: 'CRES', ALLEY: 'ALY', LANDING: 'LNDG', STR: 'ST', BL: 'BLVD',
}

const SITUS_CITY_MAP: Record<string, string> = {
  WS: 'Weston', CS: 'Coral Springs', FL: 'Fort Lauderdale', HW: 'Hollywood',
  CY: 'Cooper City', SU: 'Sunrise', PA: 'Parkland', MM: 'Miramar',
  PB: 'Pembroke Pines', PI: 'Pembroke Pines', DB: 'Deerfield Beach',
  PL: 'Plantation', TM: 'Tamarac', DV: 'Davie', LH: 'Lauderhill',
  DN: 'Dania Beach', CK: 'Coconut Creek', OP: 'Oakland Park',
  HA: 'Hallandale Beach', MG: 'Margate', LL: 'Lauderdale Lakes',
  NL: 'North Lauderdale', LS: 'Lauderdale-by-the-Sea', LP: 'Lighthouse Point',
  WM: 'Wilton Manors', WP: 'West Park', SW: 'Southwest Ranches',
  HB: 'Hillsboro Beach', PK: 'Pembroke Park', SL: 'Sea Ranch Lakes',
  LZ: 'Lazy Lake', BC: 'Unincorporated Broward',
}

const SKIP = new Set(['93', '94', '95', '96', '97', '98', '99', '00', '10', '20', '30', '40', '88', '89', '86'])
const COLS = 'FOLIO_NUMBER,full_address,city_name,SITUS_CITY,use_type_label,USE_CODE,BLDG_YEAR_BUILT,BLDG_TOT_SQ_FOOTAGE,SITUS_ZIP_CODE,latitude,longitude'

const norm = (raw: string) =>
  raw.toUpperCase().trim().replace(/\b(\d+)(?:ST|ND|RD|TH)\b/g, '$1').split(/\s+/).map((w) => SUFFIX_MAP[w] ?? w).join(' ')

const toRad = (d: number) => (d * Math.PI) / 180
function hav(la1: number, lo1: number, la2: number, lo2: number) {
  const R = 3958.8, dL = toRad(la2 - la1), dO = toRad(lo2 - lo1)
  const a = Math.sin(dL / 2) ** 2 + Math.cos(toRad(la1)) * Math.cos(toRad(la2)) * Math.sin(dO / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function validBuilding(p: any): boolean {
  if (!p || SKIP.has(p.USE_CODE)) return false
  if (!/^\d/.test((p.full_address || '').trim())) return false
  if (Number(p.BLDG_TOT_SQ_FOOTAGE || 0) === 0 && Number(p.BLDG_YEAR_BUILT || 0) === 0) return false
  return true
}

function resolveCity(prop: any, gm: any): string {
  if (prop?.SITUS_CITY && SITUS_CITY_MAP[prop.SITUS_CITY]) return SITUS_CITY_MAP[prop.SITUS_CITY]
  if (prop?.city_name && prop.city_name !== 'Unincorporated Broward') return prop.city_name
  const loc = gm?.results?.[0]?.address_components?.find((c: any) => c.types.includes('locality'))?.long_name
  return loc || 'Broward County'
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const sb = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
  const gmKey = Deno.env.get('GOOGLE_MAPS_API_KEY') ?? ''
  const claudeKey = Deno.env.get('ANTHROPIC_API_KEY') ?? ''

  const googleGeo = async (la: number, lo: number) => {
    if (!gmKey) return null
    try { return await (await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${la},${lo}&key=${gmKey}`)).json() } catch { return null }
  }

  const gmAddr = (gm: any): string => {
    if (!gm?.results?.[0]) return ''
    const c = gm.results[0].address_components
    const num = c.find((x: any) => x.types.includes('street_number'))?.long_name || ''
    const str = c.find((x: any) => x.types.includes('route'))?.long_name || ''
    return num ? norm(`${num} ${str}`.trim()) : ''
  }

  const findProp = async (la: number, lo: number) => {
    const d = 0.003
    const { data: near } = await sb.from('broward_properties_public').select(COLS)
      .gte('latitude', la - d).lte('latitude', la + d).gte('longitude', lo - d).lte('longitude', lo + d)
      .not('latitude', 'is', null).limit(20)
    if (near?.length) {
      const v = near.filter(validBuilding)
      if (v.length) {
        const s = v.map((p) => ({ ...p, _d: hav(la, lo, Number(p.latitude), Number(p.longitude)) })).sort((a, b) => a._d - b._d)
        return { prop: s[0], gm: await googleGeo(la, lo) }
      }
    }
    const gm = await googleGeo(la, lo)
    const ga = gmAddr(gm)
    if (ga.length >= 5) {
      const { data: r } = await sb.from('broward_properties_public').select(COLS).ilike('full_address', `${ga}%`).limit(5)
      const v = (r || []).filter(validBuilding)
      if (v.length) return { prop: v[0], gm }
    }
    return { prop: null, gm }
  }

  try {
    const body = await req.json()

    // ── Contractors (opt-in: fetched only when the user asks) ──────────────────
    if (body.mode === 'contractors') {
      const category = body.contractor_category
      if (!category) return json({ contractors: [] })
      const { data: pros } = await sb.rpc('search_professionals', {
        p_query: null, p_type: 'contractor', p_category: category,
        p_active_only: true, p_statewide_only: false, p_limit: 8,
      })
      const contractors = (pros || []).map((c: any) => ({
        name: c.name,
        license_type: c.category || category,
        license: c.license_number || '',
        city: c.city || '',
        expires: c.expiration_date || '',
      }))
      return json({
        contractors,
        external_contractor_lookup: contractors.length === 0
          ? `No ${category} contractors on file yet. Search the Provider Directory or your city's licensed-contractor list.`
          : undefined,
      })
    }

    const { image, mediaType, lat, lng, point } = body
    if (!image || image.length < 100) return json({ error: 'No image. Try again.' }, 400)

    // 1. Resolve city from GPS (best effort — falls back to Broward County).
    let prop: any = null, gm: any = null
    if (lat && lng) { const r = await findProp(lat, lng); prop = r.prop; gm = r.gm }
    const city = resolveCity(prop, gm)

    // 2. Is the city onboarded? Pull its city record + permit fee rules.
    const { data: cityRow } = await sb.from('cities')
      .select('name,building_department_phone,portal_url')
      .ilike('name', `%${city}%`).limit(1).maybeSingle()

    let feeRules: any[] = []
    if (cityRow?.name) {
      const { data: fr } = await sb.from('fee_rules')
        .select('permit_id,permit_name,category,base_fee,rate_percentage')
        .eq('city_name', cityRow.name).order('sort_order')
      feeRules = fr || []
    }
    const supported = !!cityRow?.name && feeRules.length > 0

    // 3. Vision: identify the item and produce permit guidance.
    const permitCtx = feeRules.map((p) => `${p.permit_id}|${p.permit_name}|${p.category}`).join('\n')
    const sys = `You are a Broward County, Florida building-permit expert (HVHZ, 170mph wind).
City: ${cityRow?.name || city}${supported ? '' : ' (not yet fully onboarded — give general Florida Building Code / Broward County guidance)'}
Permits available in this city (permit_id|name|category):
${permitCtx || 'None on file — use general Florida Building Code knowledge.'}

Call record_detection for the permit-relevant item the user is asking about.
- Set permit_id ONLY to an id from the list above that clearly matches; otherwise leave it empty.
- contractor_category must be the closest match from the provided list.
- Always fill documents_needed / typical_requirements / inspections_required / typical_timeline from Florida Building Code general knowledge, even when the city has no specific permit on file.
- If nothing permit-relevant is visible, set work_type empty and permit_likely false. Keep all text brief.`

    let det: any
    try {
      if (!claudeKey) throw new Error('ANTHROPIC_API_KEY missing')
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': claudeKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1200,
          system: sys,
          tools: [{ name: 'record_detection', description: 'Record the identified item and its permit guidance.', input_schema: DETECT_SCHEMA }],
          tool_choice: { type: 'tool', name: 'record_detection' },
          messages: [{ role: 'user', content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: image } },
            { type: 'text', text: point
              ? `The user dropped a marker at x=${Number(point.x).toFixed(3)}, y=${Number(point.y).toFixed(3)} (fractions of the image: x 0=left..1=right, y 0=top..1=bottom). Identify the item located at EXACTLY that spot — not the most prominent item. Location: ${gm?.results?.[0]?.formatted_address || prop?.full_address || city}.`
              : `Identify the main item. Location: ${gm?.results?.[0]?.formatted_address || prop?.full_address || city}.` },
          ] }],
        }),
      })
      const d = await res.json()
      console.log('Claude:', res.status, d.error?.message || 'ok', 'usage:', JSON.stringify(d.usage || {}))
      if (d.error) throw new Error(d.error.message)
      const tool = (d.content || []).find((b: any) => b.type === 'tool_use')
      if (!tool?.input) throw new Error('No structured detection returned')
      det = tool.input
    } catch (e: any) {
      console.error('Claude fail:', e.message)
      return json({
        detected: null, city, supported,
        message: `Couldn't analyze the image right now. Call ${cityRow?.name || city} Building Dept${cityRow?.building_department_phone ? ` at ${cityRow.building_department_phone}` : ''}.`,
        permits: [], contractors: [], verified_contractors: [],
      })
    }

    // 4. No permit-relevant item found.
    if (!det.work_type || det.permit_likely === false) {
      return json({
        detected: det.item_label ? { item_label: det.item_label, work_type: det.work_type || '', confidence: det.confidence ?? 0 } : null,
        city, supported,
        message: det.no_permit_reason || det.summary || 'No permit-relevant item identified. Try pointing at a specific fixture, structure, or system.',
        permits: [], contractors: [], verified_contractors: [],
      })
    }

    // 5. Build the permit entry — DB fee rules (authoritative) + AI guidance.
    const dbMatch = det.permit_id ? feeRules.find((p) => p.permit_id === det.permit_id) : null
    const categoryFees = dbMatch
      ? feeRules.filter((p) => p.category === dbMatch.category)
      : []
    const permit = {
      permit_type_id: dbMatch?.permit_id || det.contractor_category || det.work_type,
      name: dbMatch?.permit_name || det.work_type,
      description: det.summary || '',
      typical_timeline: det.typical_timeline || '',
      documents_needed: det.documents_needed || [],
      typical_requirements: det.typical_requirements || [],
      inspections_required: det.inspections_required || [],
      fee_rules: categoryFees,
    }

    // Contractors are NOT fetched here — they're loaded on demand (opt-in) via
    // the `mode: 'contractors'` path above, keeping the scan fast.
    return json({
      detected: {
        item_label: det.item_label,
        work_type: det.work_type,
        confidence: det.confidence ?? 0,
      },
      city,
      supported,
      contractor_category: det.contractor_category || '',
      message: supported ? undefined : `${city} isn't fully onboarded yet — showing general Florida Building Code guidance. Confirm specifics with the ${city} Building Department${cityRow?.building_department_phone ? ` (${cityRow.building_department_phone})` : ''}.`,
      permits: [permit],
    })
  } catch (err: any) {
    console.error('Error:', err.message)
    return json({ error: err.message }, 400)
  }
})
