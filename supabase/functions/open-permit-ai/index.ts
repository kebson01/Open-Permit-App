// OpenPermit assistant — structured permit Q&A backed by Anthropic.
// Ported from the base44 "openPermitAI" function; the only change is that the
// LLM call now uses Anthropic forced tool-use for structured output.

const MODEL = "claude-sonnet-4-6";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://gbknnjidqpmjrwlooluw.supabase.co";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SB_HEADERS = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` };

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

const CITY_PORTAL_URLS: Record<string, string> = {
  "Weston": "https://www.westonfl.org/Permits",
  "Coral Springs": "https://www.coralsprings.gov/Government/Departments/Building/Online-Permitting-eTrakit/Apply-for-Online-Permit",
  "Hollywood": "https://aca-prod.accela.com/HOLLYWOOD/Default.aspx",
  "Fort Lauderdale": "https://lauderbuild.fortlauderdale.gov/",
  "Cooper City": "https://coopercity.gov/?SEC=AD7C348E-C110-425A-B91C-2CA5769BF937",
  "Sunrise": "https://sunrisefl.gov/openforbusiness",
};

const CITY_DEPT_INFO: Record<string, { phone: string; hours: string; noc_threshold: string; how_to_apply: string }> = {
  "Weston":          { phone: "(954) 385-2600", hours: "Mon–Fri 8:00AM–4:30PM", noc_threshold: "$2,500",            how_to_apply: "Online or in person" },
  "Coral Springs":   { phone: "(954) 344-1025", hours: "Mon–Thu 7:30AM–5PM, Fri 7:30AM–2:30PM", noc_threshold: "$5,000", how_to_apply: "Online or in person" },
  "Fort Lauderdale": { phone: "(954) 828-6520", hours: "Mon–Fri 7:30AM–4:30PM", noc_threshold: "$2,500",            how_to_apply: "Digital only (LauderBuild — no paper accepted)" },
  "Hollywood":       { phone: "(954) 921-3335", hours: "Mon–Thu 7AM–6PM",       noc_threshold: "$5,000 (AC: $15,000)", how_to_apply: "Online (Accela) or in person" },
  "Cooper City":     { phone: "(954) 434-4300", hours: "Mon–Fri 8AM–5PM",       noc_threshold: "$2,500",            how_to_apply: "In person (applications must be notarized)" },
  "Sunrise":         { phone: "(954) 572-2354", hours: "Mon–Thu 8AM–5PM, Fri 8AM–4PM (Wed 8AM–Noon walk-in)", noc_threshold: "$2,500 (A/C: $7,500)", how_to_apply: "Online via sunrisefl.gov/openforbusiness" },
};

const CITY_NOTES: Record<string, string> = {
  "Fort Lauderdale": "All submissions via LauderBuild — no paper accepted.",
  "Hollywood": "Express same-day permits for AC/roof/electrical/water heater — submit Tue 6PM–Wed 9AM.",
  "Cooper City": "Applications must be notarized. Hold Harmless Agreement required for drainage easements.",
  "Sunrise": "Professional Day Wed 8AM–Noon. Flat fees: A/C $208.45, Roof $416.91, Windows $310.01. New construction: 4.4% per trade.",
};

const COMPACT_SYSTEM_PROMPT = `You are OpenPermit, a friendly and conversational building permit assistant for Broward County, Florida. You help homeowners, contractors, and investors understand the permitting process.

PERSONALITY:
- Warm, approachable, and conversational — like a knowledgeable friend, not a government form
- Ask follow-up questions naturally to get the info you need
- Never assume a city — ALWAYS ask which city the property is in if not provided
- Keep answers concise (2-4 sentences) unless the user asks for detail
- Use plain English, not legal or technical jargon

WHEN A USER ASKS A QUESTION:
1. If they haven't told you their city — ask first
2. If they give a city — give a direct, helpful answer for that city
3. If they ask a general question that applies everywhere (like "what is a NOC?") — answer it without asking for a city

BROWARD COUNTY RULES (apply everywhere):
- All of Broward is in the HVHZ — 170mph wind zone. All windows, doors, and roofing must be impact-rated or have an approved shutter system.
- NOC (Notice of Commencement) required for jobs valued at $2,500 or more — must be recorded before the first inspection
- State adds DCA 1.5% + DBPR 1.0% to every permit fee
- Permits expire if no inspection within 180 days
- Pool barrier: 4-ft fence required within 90 days of pool permit (FL Statute §515)
- HOAs cannot ban solar panels (FL Statute §163.04)
- Water heater permits: Broward County Water Heater Data Form required at all cities
- Window/door permits: Broward Fenestration Wind Load Chart required at all cities
- Work without a permit: double fee minimum

City-specific data (fees, hours, special rules) is provided in context below when available.`;

const TOPIC_TAGS: Record<string, string[]> = {
  "roof": ["hvhz", "roofing"],
  "window": ["hvhz", "windows", "forms"],
  "door": ["hvhz", "doors", "forms"],
  "pool": ["pool", "safety"],
  "solar": ["solar", "hoa"],
  "fence": ["process"],
  "ac": ["process", "noc"],
  "water heater": ["water_heater", "forms"],
  "demo": ["demolition", "asbestos"],
  "tree": ["environmental", "tree"],
  "permit": ["process", "permits"],
  "contractor": ["licensing", "contractor"],
  "noc": ["noc"],
  "fee": ["fees", "surcharges"],
};

function getRelevantTags(userMessage: string) {
  const msg = userMessage.toLowerCase();
  const tags = new Set(["all"]);
  for (const [keyword, topicTags] of Object.entries(TOPIC_TAGS)) {
    if (msg.includes(keyword)) topicTags.forEach((t) => tags.add(t));
  }
  return Array.from(tags);
}

function getFBCCategories(message: string) {
  const lower = message.toLowerCase();
  const cats = new Set<string>();
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

async function fetchFBCData(message: string) {
  const categories = getFBCCategories(message);
  if (categories.length === 0) return { sections: [], commonQA: null };
  try {
    const fetches = categories.slice(0, 3).map((cat) =>
      fetch(`${SUPABASE_URL}/rest/v1/florida_building_code?category=eq.${cat}&limit=5`, { headers: SB_HEADERS })
        .then((r) => r.json()).then((d) => Array.isArray(d) ? d : []).catch(() => [])
    );
    const results = await Promise.all(fetches);
    const seen = new Set();
    const sections: any[] = [];
    results.flat().forEach((s: any) => { if (!seen.has(s.id)) { seen.add(s.id); sections.push(s); } });

    const lower = message.toLowerCase().trim();
    let commonQA: any = null;
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

function formatFBCForPrompt(sections: any[]) {
  if (!sections.length) return "";
  const lines = ["FBC SECTIONS:"];
  sections.forEach((s) => {
    const keyReqs = Array.isArray(s.key_requirements) ? s.key_requirements : (typeof s.key_requirements === "string" ? (() => { try { return JSON.parse(s.key_requirements); } catch { return []; } })() : []);
    const keyNums = Array.isArray(s.key_numbers) ? s.key_numbers : (typeof s.key_numbers === "string" ? (() => { try { return JSON.parse(s.key_numbers); } catch { return []; } })() : []);
    lines.push(`- §${s.section_number} "${s.section_title}"${s.broward_specific ? " [HVHZ]" : ""}: ${s.plain_english || ""}${keyNums.length ? ` Nums: ${keyNums.join(", ")}` : ""}${keyReqs.length ? ` Reqs: ${keyReqs.join("; ")}` : ""}`);
  });
  return lines.join("\n");
}

async function getPermitTableName(city: string) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/cities?name=eq.${encodeURIComponent(city)}&select=permit_table_name&limit=1`, { headers: SB_HEADERS });
    const data = await res.json();
    return (Array.isArray(data) && data[0]?.permit_table_name) || `${city.toLowerCase().replace(/ /g, "_")}_permit_types`;
  } catch {
    return `${city.toLowerCase().replace(/ /g, "_")}_permit_types`;
  }
}

function parseArray(val: unknown) {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") { try { return JSON.parse(val); } catch { return []; } }
  return [];
}

async function fetchLocalPermitData(city: string) {
  try {
    const table = await getPermitTableName(city);
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?select=name,category,description,typical_requirements,documents_needed,inspections_required,typical_timeline&limit=500`,
      { headers: { ...SB_HEADERS, Prefer: "count=none" } },
    );
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function formatPermitDataForPrompt(permits: any[]) {
  if (!permits.length) return "";
  return permits.map((p) => {
    const reqs = parseArray(p.typical_requirements);
    const docs = parseArray(p.documents_needed);
    const inspections = parseArray(p.inspections_required);
    return `- ${p.name} (${p.category}): ${p.description || ""}. Timeline: ${p.typical_timeline || "varies"}. Reqs: ${reqs.join("; ") || "see dept"}. Docs: ${docs.join("; ") || "see dept"}. Inspections: ${inspections.join("; ") || "varies"}.`;
  }).join("\n");
}

async function fetchZoningData(city: string) {
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

function formatZoningForPrompt(zoning: any[], ordinances: any[]) {
  const parts: string[] = [];
  if (zoning.length > 0) {
    parts.push("ZONING:");
    zoning.forEach((z) => {
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
    ordinances.forEach((o) => parts.push(`- §${o.section_number} ${o.section_title}: ${o.plain_english_summary || ""}`));
  }
  return parts.join("\n");
}

async function getRelevantCountyRequirements(userMessage: string) {
  try {
    const tags = getRelevantTags(userMessage);
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/county_requirements?select=title,short_summary,tags&order=sort_order.asc`,
      { headers: SB_HEADERS },
    );
    if (!res.ok) return "";
    const all = await res.json();
    if (!Array.isArray(all) || all.length === 0) return "";
    const filtered = all.filter((r: any) => Array.isArray(r.tags) && r.tags.some((t: string) => tags.includes(t)));
    if (filtered.length === 0) return "";
    return "\nCOUNTY REQUIREMENTS:\n" + filtered.map((r: any) => `- ${r.title}: ${r.short_summary || ""}`).join("\n");
  } catch {
    return "";
  }
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
      },
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
          download_url: { type: "string" },
        },
      },
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
    fbc_code_ref: { type: "string" },
  },
  required: ["direct_answer", "is_plain_text"],
};

async function invokeStructured(prompt: string) {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
      tools: [{ name: "respond", description: "Respond to the user with structured permit guidance.", input_schema: responseSchema }],
      tool_choice: { type: "tool", name: "respond" },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Anthropic API error");
  const toolUse = (data.content || []).find((c: { type: string }) => c.type === "tool_use");
  return toolUse?.input || null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const { message, history, city } = await req.json();
    if (!message) return json({ error: "message is required" }, 400);

    const currentCity = city || "Weston";
    const cityInfo = CITY_DEPT_INFO[currentCity] || CITY_DEPT_INFO["Weston"];
    const portalUrl = CITY_PORTAL_URLS[currentCity] || CITY_PORTAL_URLS["Weston"];

    const [permitData, zoningData, fbcData] = await Promise.all([
      fetchLocalPermitData(currentCity),
      fetchZoningData(currentCity),
      fetchFBCData(message),
    ]);

    if (fbcData.commonQA) {
      const qa = fbcData.commonQA;
      return json({
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

    const cityCtx = `City: ${currentCity} | Phone: ${cityInfo.phone} | Hours: ${cityInfo.hours} | NOC: ${cityInfo.noc_threshold} | How to apply: ${cityInfo.how_to_apply} | Portal: ${portalUrl}${CITY_NOTES[currentCity] ? ` | Note: ${CITY_NOTES[currentCity]}` : ""}`;
    const permitSection = permitData.length ? `\nPERMIT DATABASE (${currentCity}, ${permitData.length} types):\n${formatPermitDataForPrompt(permitData)}` : "";
    const zoningSection = hasZoningData ? `\n${formatZoningForPrompt(zoningData.zoning, zoningData.ordinances)}` : "";
    const fbcSection = fbcData.sections.length > 0 ? `\n${formatFBCForPrompt(fbcData.sections)}` : "";
    const countySection = await getRelevantCountyRequirements(message);

    const systemPrompt = `${COMPACT_SYSTEM_PROMPT}\n\n${cityCtx}${permitSection}${zoningSection}${fbcSection}${countySection}\n\nRules: portal_url="${portalUrl}", city_name="${currentCity}", dept_phone="${cityInfo.phone}", dept_hours="${cityInfo.hours}", how_to_apply="${cityInfo.how_to_apply}". Add HOA caveat for residential projects. Max 6 docs/reqs. is_plain_text=true only for greetings.`;

    const recentHistory = Array.isArray(history) ? history.slice(-6) : [];
    const historyStr = recentHistory.length > 0
      ? `\nRecent conversation:\n${recentHistory.map((m: any) => `${m.role}: ${m.content}`).join("\n")}`
      : (typeof history === "string" && history ? `\nRecent conversation:\n${history}` : "");

    const prompt = `${systemPrompt}${historyStr}\n\nUser: ${message}\nProvide your answer by calling the respond tool.`;

    const structured = await invokeStructured(prompt);
    if (!structured) {
      return json({ reply: "I had trouble formatting that response. Please try again.", structured: null });
    }

    return json({ structured, usedWebSearch: false });
  } catch (error) {
    return json({ error: (error as Error).message }, 500);
  }
});
