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

// Trades the app treats as always needing a permit (mirrors ALWAYS_PERMIT in
// src/lib/exemptionLogic.js). A photograph cannot tell a like-for-like swap from
// a new installation, and that distinction is usually what decides the answer —
// so for these the scan must not return a bare "no permit needed". It asks the
// question that decides it instead. Without this the scan and the Exemption
// Checker can give opposite answers for the same job.
const REGULATED_TRADES: Array<{ test: RegExp; trade: string; question: string }> = [
  { test: /water heater|plumb|sewer|drain|backflow|irrigation/i, trade: 'plumbing',
    question: 'Is this a like-for-like replacement in the same spot, or does it involve new or relocated pipework?' },
  { test: /a\/?c\b|air condition|hvac|mechanical|furnace|duct|mini.?split/i, trade: 'mechanical',
    question: 'Is this a like-for-like changeout, or new or relocated equipment or ductwork?' },
  { test: /solar|photovoltaic/i, trade: 'solar',
    question: 'Solar almost always needs electrical and structural permits — is any panel, rail or wiring being added or moved?' },
  { test: /pool|spa|hot tub/i, trade: 'pool',
    question: 'Is this equipment being swapped like-for-like, or new construction, new plumbing or new wiring?' },
  { test: /electric|panel|outlet|wiring|circuit|light fixture|ceiling fan|generator|ev charg/i, trade: 'electrical',
    question: 'Is this replacing an existing fixture on wiring that is already there, or adding one where there was not one before?' },
  { test: /roof|shingle|tile re-?roof/i, trade: 'roofing',
    question: 'Is this a small repair, or replacing a section of the roof covering?' },
  { test: /window|exterior door|shutter|garage door/i, trade: 'openings',
    question: 'Is the glass or hardware being serviced only, or is the whole unit being replaced?' },
  { test: /structur|load.?bearing|framing|truss/i, trade: 'structural',
    question: 'Does any structural element change, or is this finish work only?' },
];

function regulatedTrade(...text: string[]) {
  const joined = text.filter(Boolean).join(' ')
  return REGULATED_TRADES.find((t) => t.test.test(joined)) || null
}

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
    alternatives: {
      type: 'array',
      description: 'Other plausible items at the SAME spot whose permit outcome DIFFERS from the main detection (e.g. the window itself when the main guess is the blinds). Empty when the item is unambiguous. Keep each one SHORT — just enough to label the choice; full detail is fetched only if the user picks it.',
      items: {
        type: 'object',
        properties: {
          item_label: { type: 'string' },
          work_type: { type: 'string' },
          permit_likely: { type: 'boolean' },
          permit_id: { type: 'string' },
          contractor_category: { type: 'string' },
          summary: { type: 'string', description: 'One short sentence on this interpretation.' },
        },
        required: ['item_label', 'work_type', 'permit_likely'],
      },
    },
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

    // ── Detail (opt-in: full checklist for a picked alternative) ───────────────
    // Text-only + tiny output, so it's far faster than re-running the vision call.
    if (body.mode === 'detail') {
      const { item_label, work_type, city: dCity } = body
      if (!work_type || !claudeKey) return json({ documents_needed: [], typical_requirements: [], inspections_required: [], typical_timeline: '' })
      const DETAIL_SCHEMA = {
        type: 'object',
        properties: {
          documents_needed: { type: 'array', items: { type: 'string' } },
          typical_requirements: { type: 'array', items: { type: 'string' } },
          inspections_required: { type: 'array', items: { type: 'string' } },
          typical_timeline: { type: 'string' },
        },
        required: ['documents_needed', 'typical_requirements', 'inspections_required'],
      }
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'x-api-key': claudeKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 600,
            system: `You are a Broward County, Florida building-permit expert (HVHZ, 170mph wind). Give typical Florida Building Code permit requirements for the work below in ${dCity || 'Broward County'}. Be brief and specific.`,
            tools: [{ name: 'record_detail', description: 'Record the permit checklist.', input_schema: DETAIL_SCHEMA }],
            tool_choice: { type: 'tool', name: 'record_detail' },
            messages: [{ role: 'user', content: `Work: ${work_type}${item_label ? ` (item: ${item_label})` : ''}.` }],
          }),
        })
        const d = await res.json()
        const tool = (d.content || []).find((b: any) => b.type === 'tool_use')
        return json(tool?.input || { documents_needed: [], typical_requirements: [], inspections_required: [], typical_timeline: '' })
      } catch {
        return json({ documents_needed: [], typical_requirements: [], inspections_required: [], typical_timeline: '' })
      }
    }

    const { image, mediaType, lat, lng, point } = body
    const hint = typeof body.hint === 'string' ? body.hint.trim().slice(0, 200) : ''
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

${hint ? `The user TOLD YOU what they want to do: "${hint}". Treat this as the primary signal for WHAT the item is — identify and analyze that item even if a covering (blinds, curtain, screen) or a closed state makes something else more visually obvious. If they name a window but blinds cover it, analyze the window; if they name a glass door but it is closed, still treat it as a door. Only override them if their described item is genuinely absent.
` : ''}Call record_detection for the permit-relevant item the user is asking about.
- Set permit_id ONLY to an id from the list above that clearly matches; otherwise leave it empty.
- contractor_category must be the closest match from the provided list.
- Always fill documents_needed / typical_requirements / inspections_required / typical_timeline from Florida Building Code general knowledge, even when the city has no specific permit on file.
- DISAMBIGUATE: if the spot could reasonably be more than one thing with DIFFERENT permit outcomes — e.g. window blinds/coverings (usually NO permit) vs the window itself (permit required for replacement), a light fixture vs the electrical, a faucet vs the plumbing rough-in — put your single best guess as the main detection and list the other plausible interpretation(s) in 'alternatives', each fully filled out, so the user can pick which they mean. Whenever a no-permit item overlaps a permit-requiring one (or vice-versa), include both.
- If nothing permit-relevant is visible, set work_type empty and permit_likely false. Keep all text brief.`

    let det: any
    try {
      if (!claudeKey) throw new Error('ANTHROPIC_API_KEY missing')
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': claudeKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1100,
          system: sys,
          tools: [{ name: 'record_detection', description: 'Record the identified item and its permit guidance.', input_schema: DETECT_SCHEMA }],
          tool_choice: { type: 'tool', name: 'record_detection' },
          messages: [{ role: 'user', content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: image } },
            { type: 'text', text: point
              ? `The user dropped a marker at x=${Number(point.x).toFixed(3)}, y=${Number(point.y).toFixed(3)} (fractions of the image: x 0=left..1=right, y 0=top..1=bottom). Identify the item located at EXACTLY that spot — not the most prominent item.${hint ? ` They describe it as: "${hint}" — use that to resolve what the item at that spot is.` : ''} Location: ${gm?.results?.[0]?.formatted_address || prop?.full_address || city}.`
              : `${hint ? `Identify the item described as "${hint}" in this photo.` : 'Identify the main item.'} Location: ${gm?.results?.[0]?.formatted_address || prop?.full_address || city}.` },
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

    // 4. No permit needed — but only say so outright when the work is not in a
    //    regulated trade. Otherwise the honest answer is "it depends", plus the
    //    question that decides it.
    if (!det.work_type || det.permit_likely === false) {
      // Do NOT key this on work_type. The prompt tells the model to blank
      // work_type whenever it decides nothing is permit-relevant, so that field
      // is empty in exactly the case this guard exists to catch. The item label
      // and the model's own reasoning are what carry the trade here.
      const regulated = regulatedTrade(
        det.work_type, det.item_label, det.contractor_category, det.no_permit_reason, det.summary,
      )

      if (regulated) {
        return json({
          verdict: 'depends',
          detected: { item_label: det.item_label, work_type: det.work_type, confidence: det.confidence ?? 0 },
          city, supported,
          trade: regulated.trade,
          deciding_question: regulated.question,
          message: det.no_permit_reason || det.summary || '',
          permits: [], contractors: [], verified_contractors: [],
        })
      }

      return json({
        verdict: 'none',
        detected: det.item_label ? { item_label: det.item_label, work_type: det.work_type || '', confidence: det.confidence ?? 0 } : null,
        city, supported,
        message: det.no_permit_reason || det.summary || 'No permit-relevant item identified. Try pointing at a specific fixture, structure, or system.',
        permits: [], contractors: [], verified_contractors: [],
      })
    }

    // 5. Build a permit entry from a detection — DB fee rules + AI guidance.
    const buildPermit = (d: any) => {
      const dbMatch = d.permit_id ? feeRules.find((p) => p.permit_id === d.permit_id) : null
      const categoryFees = dbMatch ? feeRules.filter((p) => p.category === dbMatch.category) : []
      return {
        permit_type_id: dbMatch?.permit_id || d.contractor_category || d.work_type,
        name: dbMatch?.permit_name || d.work_type,
        description: d.summary || '',
        typical_timeline: d.typical_timeline || '',
        documents_needed: d.documents_needed || [],
        typical_requirements: d.typical_requirements || [],
        inspections_required: d.inspections_required || [],
        fee_rules: categoryFees,
      }
    }

    // Other plausible items at the same spot, so the UI can ask which they meant.
    const alternatives = (Array.isArray(det.alternatives) ? det.alternatives : [])
      .filter((a: any) => a && a.work_type && a.item_label)
      .slice(0, 3)
      .map((a: any) => ({
        item_label: a.item_label,
        work_type: a.work_type,
        permit_required: a.permit_likely !== false,
        contractor_category: a.contractor_category || '',
        permit: buildPermit(a),
      }))

    // Contractors are NOT fetched here — they're loaded on demand (opt-in) via
    // the `mode: 'contractors'` path above, keeping the scan fast.
    return json({
      verdict: 'permit',
      detected: {
        item_label: det.item_label,
        work_type: det.work_type,
        confidence: det.confidence ?? 0,
      },
      city,
      supported,
      contractor_category: det.contractor_category || '',
      message: supported ? undefined : `${city} isn't fully onboarded yet — showing general Florida Building Code guidance. Confirm specifics with the ${city} Building Department${cityRow?.building_department_phone ? ` (${cityRow.building_department_phone})` : ''}.`,
      permits: [buildPermit(det)],
      alternatives,
    })
  } catch (err: any) {
    console.error('Error:', err.message)
    return json({ error: err.message }, 400)
  }
})
