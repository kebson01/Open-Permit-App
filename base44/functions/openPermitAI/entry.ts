import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SUPABASE_URL = "https://gbknnjidqpmjrwlooluw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdia25uamlkcXBtanJ3bG9vbHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NTQzNDIsImV4cCI6MjA5MDIzMDM0Mn0.qwDACgXe3hesxBRQOzP53Hdc44z_UOka1_uYQScyi68";
const SB_HEADERS = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` };

const CITY_PORTAL_URLS = {
  "Weston": "https://www.westonfl.org/Permits",
  "Coral Springs": "https://www.coralsprings.gov/Government/Departments/Building/Online-Permitting-eTrakit/Apply-for-Online-Permit",
  "Hollywood": "https://aca-prod.accela.com/HOLLYWOOD/Default.aspx",
  "Fort Lauderdale": "https://lauderbuild.fortlauderdale.gov/",
  "Cooper City": "https://coopercity.gov/?SEC=AD7C348E-C110-425A-B91C-2CA5769BF937",
  "Sunrise": "https://sunrisefl.gov/openforbusiness",
};

const CITY_DEPT_INFO = {
  "Weston":          { phone: "(954) 385-2600", hours: "Mon–Fri 8:00AM–4:30PM", noc_threshold: "$2,500",            how_to_apply: "Online or in person" },
  "Coral Springs":   { phone: "(954) 344-1025", hours: "Mon–Thu 7:30AM–5PM, Fri 7:30AM–2:30PM", noc_threshold: "$5,000", how_to_apply: "Online or in person" },
  "Fort Lauderdale": { phone: "(954) 828-6520", hours: "Mon–Fri 7:30AM–4:30PM", noc_threshold: "$2,500",            how_to_apply: "Digital only (LauderBuild — no paper accepted)" },
  "Hollywood":       { phone: "(954) 921-3335", hours: "Mon–Thu 7AM–6PM",       noc_threshold: "$5,000 (AC: $15,000)", how_to_apply: "Online (Accela) or in person" },
  "Cooper City":     { phone: "(954) 434-4300", hours: "Mon–Fri 8AM–5PM",       noc_threshold: "$2,500",            how_to_apply: "In person (applications must be notarized)" },
  "Sunrise":         { phone: "(954) 572-2354", hours: "Mon–Thu 8AM–5PM, Fri 8AM–4PM (Wed 8AM–Noon walk-in)", noc_threshold: "$2,500 (A/C: $7,500)", how_to_apply: "Online via sunrisefl.gov/openforbusiness" },
};

const CITY_NOTES = {
  "Fort Lauderdale": "All submissions via LauderBuild — no paper accepted.",
  "Hollywood": "Express same-day permits for AC/roof/electrical/water heater — submit Tue 6PM–Wed 9AM.",
  "Cooper City": "Applications must be notarized. Hold Harmless Agreement required for drainage easements.",
  "Sunrise": "Professional Day Wed 8AM–Noon. Flat fees: A/C $208.45, Roof $416.91, Windows $310.01. New construction: 4.4% per trade.",
};

// Compact system prompt — ~2,000 tokens shorter than previous version
const COMPACT_SYSTEM_PROMPT = `You are OpenPermit AI, a building permit expert for all 31 Broward County, FL municipalities.

BROWARD COUNTY BASELINE (all cities):
- HVHZ: entire county, 170mph wind design, all windows/doors/roofing must be impact-rated
- FBC: 8th Edition (2023) effective Jan 1, 2024
- NOC: required for jobs ≥$2,500, recorded at Broward County Records before first inspection
- State surcharges: DCA 1.5% + DBPR 1.0% on every permit fee
- Permit validity: 180 days from issuance
- Work without permit: double fee minimum
- Pool barrier: 4-ft fence within 90 days (FL Statute §515)
- Solar: HOA cannot ban (FL Statute §163.04)
- Water heater: Broward County Water Heater Data Form required countywide
- Windows/doors: Broward Fenestration Wind Load Chart required countywide

City-specific data (fees, hours, special rules) is provided in context below.
Be concise. Answer the question asked. Do not volunteer information not asked for.`;

// Topic tags for filtering county requirements
const TOPIC_TAGS = {
  'roof':         ['hvhz', 'roofing'],
  'window':       ['hvhz', 'windows', 'forms'],
  'door':         ['hvhz', 'doors', 'forms'],
  'pool':         ['pool', 'safety'],
  'solar':        ['solar', 'hoa'],
  'fence':        ['process'],
  'ac':           ['process', 'noc'],
  'water heater': ['water_heater', 'forms'],
  'demo':         ['demolition', 'asbestos'],
  'tree':         ['environmental', 'tree'],
  'permit':       ['process', 'permits'],
  'contractor':   ['licensing', 'contractor'],
  'noc':          ['noc'],
  'fee':          ['fees', 'surcharges'],
};

function getRelevantTags(userMessage) {
  const msg = userMessage.toLowerCase();
  const tags = new Set(['all']);
  for (const [keyword, topicTags] of Object.entries(TOPIC_TAGS)) {
    if (msg.includes(keyword)) topicTags.forEach(t => tags.add(t));
  }
  return Array.from(tags);
}

// Map message keywords to FBC categories
function getFBCCategories(message) {
  const lower = message.toLowerCase();
  const cats = new Set();
  if (/roof|re.roof|shingle|tile roof|flat roof/.test(lower)) { cats.add("roofing"); cats.add("hvhz"); }
  if (/window|door|sliding|impact|glass/.test(lower)) { cats.add("windows_doors"); cats.add("hvhz"); }
  if (/pool|spa|swimming/.test(lower)) cats.add("pool");
  if (/a\/c|hvac|air condition|heat pump|mechanical/.test(lower)) cats.add("permit_required");
  if (/solar|photovoltaic|pv panel/.test(lower)) { cats.add("permit_required"); cats.add("energy"); }
  if (/energy|insulation|r.value|blower door/.test(lower)) cats.add("energy");
  if (/hvhz|hurricane|wind|impact|product approval/.test(lower)) cats.add("hvhz");
  if (/permit required|do i need a permit|need a permit/.test(lower)) cats.add("permit_required");
  if (/fee|cost|how much/.test(lower)) cats.add("fees");
  return [...cats];
}

async function fetchFBCData(message) {
  const categories = getFBCCategories(message);
  if (categories.length === 0) return { sections: [], commonQA: null };
  try {
    const fetches = categories.slice(0, 3).map(cat =>
      fetch(`${SUPABASE_URL}/rest/v1/florida_building_code?category=eq.${cat}&limit=5`, { headers: SB_HEADERS })
        .then(r => r.json()).then(d => Array.isArray(d) ? d : []).catch(() => [])
    );
    const results = await Promise.all(fetches);
    const seen = new Set();
    const sections = [];
    results.flat().forEach(s => { if (!seen.has(s.id)) { seen.add(s.id); sections.push(s); } });

    const lower = message.toLowerCase().trim();
    let commonQA = null;
    for (const section of sections) {
      const qs = Array.isArray(section.common_questions) ? section.common_questions
        : (typeof section.common_questions === "string" ? (() => { try { return JSON.parse(section.common_questions); } catch { return []; } })() : []);
      for (const qa of qs) {
        if (qa?.q && lower.includes(qa.q.toLowerCase().slice(0, 20))) {
          commonQA = { q: qa.q, a: qa.a, section_number: section.section_number, section_title: section.section_title };
          break;
        }
      }
      if (commonQA) break;
    }
    return { sections, commonQA };
  } catch {
    return { sections: [], commonQA: null };
  }
}

function formatFBCForPrompt(sections) {
  if (!sections.length) return "";
  const lines = ["FBC SECTIONS:"];
  sections.forEach(s => {
    const keyReqs = Array.isArray(s.key_requirements) ? s.key_requirements : (typeof s.key_requirements === "string" ? (() => { try { return JSON.parse(s.key_requirements); } catch { return []; } })() : []);
    const keyNums = Array.isArray(s.key_numbers) ? s.key_numbers : (typeof s.key_numbers === "string" ? (() => { try { return JSON.parse(s.key_numbers); } catch { return []; } })() : []);
    lines.push(`- §${s.section_number} "${s.section_title}"${s.broward_specific ? " [HVHZ]" : ""}: ${s.plain_english || ""}${keyNums.length ? ` Nums: ${keyNums.join(", ")}` : ""}${keyReqs.length ? ` Reqs: ${keyReqs.join("; ")}` : ""}`);
  });
  return lines.join("\n");
}

async function getPermitTableName(city) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/cities?name=eq.${encodeURIComponent(city)}&select=permit_table_name&limit=1`, { headers: SB_HEADERS });
    const data = await res.json();
    return (Array.isArray(data) && data[0]?.permit_table_name) || `${city.toLowerCase().replace(/ /g, "_")}_permit_types`;
  } catch {
    return `${city.toLowerCase().replace(/ /g, "_")}_permit_types`;
  }
}

function parseArray(val) {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") { try { return JSON.parse(val); } catch { return []; } }
  return [];
}

async function fetchLocalPermitData(city) {
  try {
    const table = await getPermitTableName(city);
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?select=name,category,description,typical_requirements,documents_needed,inspections_required,typical_timeline&limit=500`,
      { headers: { ...SB_HEADERS, Prefer: "count=none" } }
    );
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function formatPermitDataForPrompt(permits) {
  if (!permits.length) return "";
  return permits.map(p => {
    const reqs = parseArray(p.typical_requirements);
    const docs = parseArray(p.documents_needed);
    const inspections = parseArray(p.inspections_required);
    return `- ${p.name} (${p.category}): ${p.description || ""}. Timeline: ${p.typical_timeline || "varies"}. Reqs: ${reqs.join("; ") || "see dept"}. Docs: ${docs.join("; ") || "see dept"}. Inspections: ${inspections.join("; ") || "varies"}.`;
  }).join("\n");
}

async function fetchZoningData(city) {
  try {
    const [zoningRes, ordinanceRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/zoning_rules?city_name=eq.${encodeURIComponent(city)}&limit=50`, { headers: SB_HEADERS }),
      fetch(`${SUPABASE_URL}/rest/v1/city_ordinance_sections?city_name=eq.${encodeURIComponent(city)}&limit=100`, { headers: SB_HEADERS }),
    ]);
    const zoning = await zoningRes.json();
    const ordinances = await ordinanceRes.json();
    return { zoning: Array.isArray(zoning) ? zoning : [], ordinances: Array.isArray(ordinances) ? ordinances : [] };
  } catch {
    return { zoning: [], ordinances: [] };
  }
}

function formatZoningForPrompt(zoning, ordinances) {
  const parts = [];
  if (zoning.length > 0) {
    parts.push("ZONING:");
    zoning.forEach(z => {
      const details = [
        z.zone_code && `Zone: ${z.zone_code}`,
        z.front_setback_ft && `Front: ${z.front_setback_ft}ft`,
        z.rear_setback_ft && `Rear: ${z.rear_setback_ft}ft`,
        z.side_setback_ft && `Side: ${z.side_setback_ft}ft`,
        z.max_height_ft && `Height: ${z.max_height_ft}ft`,
        z.max_lot_coverage_pct && `Coverage: ${z.max_lot_coverage_pct}%`,
        z.notes && `Notes: ${z.notes}`,
      ].filter(Boolean).join(" | ");
      parts.push(`- ${details}`);
    });
  }
  if (ordinances.length > 0) {
    parts.push("ORDINANCES:");
    ordinances.forEach(o => parts.push(`- §${o.section_number} ${o.section_title}: ${o.plain_english_summary || ""}`));
  }
  return parts.join("\n");
}

// Only fetch county_requirements that are relevant to this message
async function getRelevantCountyRequirements(userMessage) {
  try {
    const tags = getRelevantTags(userMessage);
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/county_requirements?select=title,short_summary,tags&order=sort_order.asc`,
      { headers: SB_HEADERS }
    );
    if (!res.ok) return "";
    const all = await res.json();
    if (!Array.isArray(all) || all.length === 0) return "";
    const filtered = all.filter(r => Array.isArray(r.tags) && r.tags.some(t => tags.includes(t)));
    if (filtered.length === 0) return "";
    return "\nCOUNTY REQUIREMENTS:\n" + filtered.map(r => `- ${r.title}: ${r.short_summary || ""}`).join("\n");
  } catch {
    return "";
  }
}

const WEB_SEARCH_KEYWORDS = ["hoa rule", "hoa restriction", "deed restriction", "historical district"];
function needsWebSearch(message, hasZoningData) {
  if (hasZoningData) return false;
  const lower = message.toLowerCase();
  return WEB_SEARCH_KEYWORDS.some(kw => lower.includes(kw));
}

const responseSchema = {
  type: "object",
  properties: {
    direct_answer: { type: "string", description: "One sentence direct answer." },
    description: { type: "string", description: "One sentence plain-English context." },
    quick_facts: {
      type: "object",
      properties: {
        review_time: { type: "string" },
        cost_estimate: { type: "string" },
        contractor_required: { type: "string" },
        how_to_apply: { type: "string" },
      }
    },
    documents: {
      type: "array",
      description: "Up to 6 documents needed.",
      items: {
        type: "object",
        properties: {
          plain_name: { type: "string" },
          official_name: { type: "string" },
          description: { type: "string" },
          where_to_get: { type: "string" },
          download_url: { type: "string" }
        }
      }
    },
    requirements: { type: "array", description: "Up to 6 requirements.", items: { type: "string" } },
    requirements_note: { type: "string" },
    zoning_info: { type: "string" },
    zoning_url: { type: "string" },
    caveats: { type: "array", items: { type: "string" } },
    portal_url: { type: "string" },
    portal_label: { type: "string" },
    city_name: { type: "string" },
    dept_phone: { type: "string" },
    dept_hours: { type: "string" },
    is_plain_text: { type: "boolean" },
    plain_text_reply: { type: "string" },
    fbc_code_ref: { type: "string" }
  },
  required: ["direct_answer", "is_plain_text"]
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { message, history, city } = await req.json();

    if (!message) return Response.json({ error: "message is required" }, { status: 400 });

    const currentCity = city || "Weston";
    const cityInfo = CITY_DEPT_INFO[currentCity] || CITY_DEPT_INFO["Weston"];
    const portalUrl = CITY_PORTAL_URLS[currentCity] || CITY_PORTAL_URLS["Weston"];

    // Fetch only what's needed for this specific message in parallel
    const [permitData, zoningData, fbcData, countySection] = await Promise.all([
      fetchLocalPermitData(currentCity),
      fetchZoningData(currentCity),
      fetchFBCData(message),
      getRelevantCountyRequirements(message),
    ]);

    // Instant answer from common_questions cache
    if (fbcData.commonQA) {
      const qa = fbcData.commonQA;
      return Response.json({
        structured: {
          direct_answer: qa.a,
          description: `Based on FBC §${qa.section_number} — ${qa.section_title}.`,
          is_plain_text: false,
          portal_url: portalUrl,
          city_name: currentCity,
          dept_phone: cityInfo.phone,
          dept_hours: cityInfo.hours,
          fbc_instant: true,
        },
        usedWebSearch: false,
      });
    }

    const hasZoningData = zoningData.zoning.length > 0 || zoningData.ordinances.length > 0;
    const useWebSearch = needsWebSearch(message, hasZoningData);

    // Build compact context
    const cityCtx = `City: ${currentCity} | Phone: ${cityInfo.phone} | Hours: ${cityInfo.hours} | NOC: ${cityInfo.noc_threshold} | How to apply: ${cityInfo.how_to_apply} | Portal: ${portalUrl}${CITY_NOTES[currentCity] ? ` | Note: ${CITY_NOTES[currentCity]}` : ""}`;

    const permitSection = permitData.length
      ? `\nPERMIT DATABASE (${currentCity}, ${permitData.length} types):\n${formatPermitDataForPrompt(permitData)}`
      : "";

    const zoningSection = hasZoningData
      ? `\n${formatZoningForPrompt(zoningData.zoning, zoningData.ordinances)}`
      : "";

    const fbcSection = fbcData.sections.length > 0 ? `\n${formatFBCForPrompt(fbcData.sections)}` : "";

    const systemPrompt = `${COMPACT_SYSTEM_PROMPT}\n\n${cityCtx}${permitSection}${zoningSection}${fbcSection}${countySection}\n\nRules: portal_url="${portalUrl}", city_name="${currentCity}", dept_phone="${cityInfo.phone}", dept_hours="${cityInfo.hours}", how_to_apply="${cityInfo.how_to_apply}". Add HOA caveat for residential projects. Max 6 docs/reqs. is_plain_text=true only for greetings.`;

    // Cap history to last 4 messages (2 turns)
    const recentHistory = Array.isArray(history) ? history.slice(-4) : [];
    const historyStr = recentHistory.length > 0 ? `\nRecent conversation:\n${recentHistory.map(m => `${m.role}: ${m.content}`).join("\n")}` : "";

    const prompt = `${systemPrompt}${historyStr}\n\nUser: ${message}\nAssistant (JSON only):`;

    const reply = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: useWebSearch,
      model: useWebSearch ? "gemini_3_flash" : "gpt_5_mini",
      response_json_schema: responseSchema,
    });

    const structured = typeof reply === "object" ? reply : null;
    if (!structured) {
      return Response.json({ reply: "I had trouble formatting that response. Please try again.", structured: null });
    }

    return Response.json({ structured, usedWebSearch: useWebSearch });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});