import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SUPABASE_URL = "https://gbknnjidqpmjrwlooluw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdia25uamlkcXBtanJ3bG9vbHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NTQzNDIsImV4cCI6MjA5MDIzMDM0Mn0.qwDACgXe3hesxBRQOzP53Hdc44z_UOka1_uYQScyi68";

const ORDINANCE_URLS = {
  "Weston": "https://codelibrary.amlegal.com/codes/weston/",
  "Hollywood": "https://codelibrary.amlegal.com/codes/hollywood/",
  "Coral Springs": "https://library.municode.com/fl/coral_springs/codes/code_of_ordinances",
  "Fort Lauderdale": "https://library.municode.com/fl/fort_lauderdale/codes/code_of_ordinances",
  "Cooper City": "https://library.municode.com/fl/cooper_city/codes/code_of_ordinances",
};

const CITY_PORTAL_URLS = {
  "Weston": "https://www.westonfl.org/Permits",
  "Coral Springs": "https://www.coralsprings.gov/Government/Departments/Building/Online-Permitting-eTrakit/Apply-for-Online-Permit",
  "Hollywood": "https://aca-prod.accela.com/HOLLYWOOD/Default.aspx",
  "Fort Lauderdale": "https://lauderbuild.fortlauderdale.gov/",
  "Cooper City": "https://coopercity.gov/?SEC=AD7C348E-C110-425A-B91C-2CA5769BF937",
};

const CITY_DEPT_INFO = {
  "Weston": { phone: "(954) 385-2600", hours: "Mon–Fri 8:00AM–4:30PM", noc_threshold: "$2,500" },
  "Coral Springs": { phone: "(954) 344-1025", hours: "Mon–Thu 7:30AM–5:00PM, Fri 7:30AM–2:30PM", noc_threshold: "$5,000" },
  "Fort Lauderdale": { phone: "(954) 828-6520", hours: "Mon–Fri 7:30AM–4:30PM", noc_threshold: "$2,500" },
  "Hollywood": { phone: "(954) 921-3335", hours: "Mon–Thu 7AM–6PM", noc_threshold: "$5,000" },
  "Cooper City": { phone: "(954) 434-4300", hours: "Mon–Fri 8AM–5PM", noc_threshold: "$2,500" },
};

// Only use web search for very specific questions not answerable from local data
const WEB_SEARCH_KEYWORDS = ["hoa rule", "hoa restriction", "deed restriction", "historical district"];

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
    // Fetch relevant FBC sections + all common_questions for matching categories
    const fetches = categories.slice(0, 3).map(cat =>
      fetch(`${SUPABASE_URL}/rest/v1/florida_building_code?category=eq.${cat}&limit=5`,
        { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } })
        .then(r => r.json()).then(d => Array.isArray(d) ? d : []).catch(() => [])
    );
    const results = await Promise.all(fetches);
    const seen = new Set();
    const sections = [];
    results.flat().forEach(s => {
      if (!seen.has(s.id)) { seen.add(s.id); sections.push(s); }
    });

    // Check common_questions for instant match
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
  const lines = ["FLORIDA BUILDING CODE (FBC) SECTIONS:"];
  sections.forEach(s => {
    const keyReqs = Array.isArray(s.key_requirements) ? s.key_requirements
      : (typeof s.key_requirements === "string" ? (() => { try { return JSON.parse(s.key_requirements); } catch { return []; } })() : []);
    const keyNums = Array.isArray(s.key_numbers) ? s.key_numbers
      : (typeof s.key_numbers === "string" ? (() => { try { return JSON.parse(s.key_numbers); } catch { return []; } })() : []);
    lines.push(`- FBC §${s.section_number} "${s.section_title}" [${s.category}]${s.broward_specific ? " ⚠️ BROWARD/HVHZ AMENDMENT" : ""}: ${s.plain_english || ""}${keyNums.length ? ` Key numbers: ${keyNums.join(", ")}` : ""}${keyReqs.length ? ` Requirements: ${keyReqs.join("; ")}` : ""}`);
  });
  return lines.join("\n");
}

function needsWebSearch(message, hasZoningData) {
  if (hasZoningData) return false; // local data covers it
  const lower = message.toLowerCase();
  return WEB_SEARCH_KEYWORDS.some(kw => lower.includes(kw.toLowerCase()));
}

// Fetch permit table name from cities
async function getPermitTableName(city) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/cities?name=eq.${encodeURIComponent(city)}&select=permit_table_name&limit=1`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
    );
    const data = await res.json();
    return (Array.isArray(data) && data[0]?.permit_table_name) || `${city.toLowerCase().replace(/ /g, "_")}_permit_types`;
  } catch {
    return `${city.toLowerCase().replace(/ /g, "_")}_permit_types`;
  }
}

async function fetchLocalPermitData(city = "Weston") {
  try {
    const table = await getPermitTableName(city);
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?select=name,category,description,typical_requirements,documents_needed,inspections_required,typical_timeline&limit=500`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, Prefer: "count=none" } }
    );
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function fetchZoningData(city) {
  try {
    const [zoningRes, ordinanceRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/zoning_rules?city_name=eq.${encodeURIComponent(city)}&limit=50`,
        { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }),
      fetch(`${SUPABASE_URL}/rest/v1/city_ordinance_sections?city_name=eq.${encodeURIComponent(city)}&limit=100`,
        { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }),
    ]);
    const zoning = await zoningRes.json();
    const ordinances = await ordinanceRes.json();
    return {
      zoning: Array.isArray(zoning) ? zoning : [],
      ordinances: Array.isArray(ordinances) ? ordinances : [],
    };
  } catch {
    return { zoning: [], ordinances: [] };
  }
}

function formatZoningForPrompt(zoning, ordinances) {
  const parts = [];
  if (zoning.length > 0) {
    parts.push("ZONING RULES:");
    zoning.forEach(z => {
      const details = [
        z.zone_code && `Zone: ${z.zone_code} (${z.zone_name || ""})`,
        z.min_lot_size_sqft && `Min lot: ${z.min_lot_size_sqft.toLocaleString()} sq ft`,
        z.front_setback_ft && `Front setback: ${z.front_setback_ft} ft`,
        z.rear_setback_ft && `Rear setback: ${z.rear_setback_ft} ft`,
        z.side_setback_ft && `Side setback: ${z.side_setback_ft} ft`,
        z.max_height_ft && `Max height: ${z.max_height_ft} ft`,
        z.max_lot_coverage_pct && `Max lot coverage: ${z.max_lot_coverage_pct}%`,
        z.max_impervious_pct && `Max impervious: ${z.max_impervious_pct}%`,
        z.notes && `Notes: ${z.notes}`,
      ].filter(Boolean).join(" | ");
      parts.push(`- ${details}`);
    });
  }
  if (ordinances.length > 0) {
    parts.push("\nORDINANCE SECTIONS:");
    ordinances.forEach(o => {
      const keyNums = (() => {
        try { return Array.isArray(o.key_numbers) ? o.key_numbers.join(", ") : ""; } catch { return ""; }
      })();
      parts.push(`- §${o.section_number} ${o.section_title} (${o.category}): ${o.plain_english_summary || ""}${keyNums ? ` Key numbers: ${keyNums}` : ""}`);
    });
  }
  return parts.join("\n");
}

function parseArray(val) {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try { return JSON.parse(val); } catch { return []; }
  }
  return [];
}

function formatPermitDataForPrompt(permits) {
  if (!permits.length) return "";
  return permits.map(p => {
    const reqs = parseArray(p.typical_requirements);
    const docs = parseArray(p.documents_needed);
    const inspections = parseArray(p.inspections_required);
    return `- ${p.name} (${p.category}): ${p.description || ""}. Timeline: ${p.typical_timeline || "varies"}. Requirements: ${reqs.join("; ") || "see dept"}. Docs: ${docs.join("; ") || "see dept"}. Inspections: ${inspections.join("; ") || "varies"}.`;
  }).join("\n");
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { message, history, pageName, city } = await req.json();

    if (!message) {
      return Response.json({ error: "message is required" }, { status: 400 });
    }

    const currentCity = city || "Weston";
    const portalUrl = CITY_PORTAL_URLS[currentCity] || CITY_PORTAL_URLS["Weston"];

    // Fetch permit data, zoning data, and FBC data in parallel
    const [permitData, zoningData, fbcData] = await Promise.all([
      fetchLocalPermitData(currentCity),
      fetchZoningData(currentCity),
      fetchFBCData(message),
    ]);

    const localDataSection = permitData.length
      ? `\n\nCOMPLETE PERMIT DATABASE FOR ${currentCity.toUpperCase()} (${permitData.length} permit types):\n${formatPermitDataForPrompt(permitData)}`
      : "";

    const hasZoningData = zoningData.zoning.length > 0 || zoningData.ordinances.length > 0;
    const zoningSection = hasZoningData
      ? `\n\nLOCAL ZONING & ORDINANCE DATA FOR ${currentCity.toUpperCase()}:\n${formatZoningForPrompt(zoningData.zoning, zoningData.ordinances)}`
      : "";

    // Instant answer from common_questions
    if (fbcData.commonQA) {
      const qa = fbcData.commonQA;
      return Response.json({
        structured: {
          direct_answer: qa.a,
          description: `Based on Florida Building Code §${qa.section_number} — ${qa.section_title}.`,
          is_plain_text: false,
          portal_url: CITY_PORTAL_URLS[currentCity],
          city_name: currentCity,
          dept_phone: (CITY_DEPT_INFO[currentCity] || CITY_DEPT_INFO["Weston"]).phone,
          dept_hours: (CITY_DEPT_INFO[currentCity] || CITY_DEPT_INFO["Weston"]).hours,
          fbc_instant: true,
        },
        usedWebSearch: false,
      });
    }

    const fbcSection = fbcData.sections.length > 0
      ? `\n\n${formatFBCForPrompt(fbcData.sections)}`
      : "";

    const useWebSearch = needsWebSearch(message, hasZoningData);

    const responseSchema = {
      type: "object",
      properties: {
        direct_answer: { type: "string", description: "One sentence direct answer. Example: 'Yes — you need a Fence permit in Weston.'" },
        description: { type: "string", description: "One sentence plain-English context beneath the direct answer." },
        quick_facts: {
          type: "object",
          properties: {
            review_time: { type: "string", description: "e.g. '3–5 business days' or null" },
            cost_estimate: { type: "string", description: "e.g. '~$150–$400' or null" },
            contractor_required: { type: "string", description: "'Yes', 'No', 'Optional', or null" },
            how_to_apply: { type: "string", description: "e.g. 'Online or in person', 'In person only', or null" },
          }
        },
        documents: {
          type: "array",
          description: "Up to 6 documents needed. Each item has plain_name, official_name, description (one sentence: what it is and why needed), where_to_get (source), and optionally download_url.",
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
        requirements: {
          type: "array",
          description: "Up to 6 plain-English requirements from the database. Include specific thresholds and numbers where relevant.",
          items: { type: "string" }
        },
        requirements_note: { type: "string", description: "Short note e.g. 'These are Weston requirements. Your HOA may have additional rules.' or null" },
        zoning_info: { type: "string", description: "2-3 sentences about relevant zoning rules including key numbers (setbacks, height limits, lot coverage %). Null if not relevant." },
        zoning_url: { type: "string", description: "Link to ordinance source, or null" },
        caveats: {
          type: "array",
          description: "Up to 3 important caveats. Always include HOA note for residential Weston projects.",
          items: { type: "string" }
        },
        portal_url: { type: "string", description: "City permit portal URL" },
        portal_label: { type: "string", description: "Button label e.g. 'Apply Online →'" },
        city_name: { type: "string", description: "City name e.g. 'Weston'" },
        dept_phone: { type: "string", description: "Building department phone e.g. '(954) 385-2600'" },
        dept_hours: { type: "string", description: "Hours e.g. 'Mon–Fri 8AM–4:30PM'" },
        is_plain_text: { type: "boolean", description: "Set to true ONLY for greetings or meta questions." },
        plain_text_reply: { type: "string", description: "Only populated when is_plain_text is true" },
        fbc_code_ref: { type: "string", description: "FBC section reference if applicable e.g. 'FBC-R §R905.2, FBC-R §R301.2.1.2 (HVHZ)'. Null if not applicable." }
      },
      required: ["direct_answer", "is_plain_text"]
    };

    const cityDeptInfo = CITY_DEPT_INFO[currentCity] || CITY_DEPT_INFO["Weston"];

    const HOW_TO_APPLY = {
      "Weston": "Online or in person",
      "Coral Springs": "Online or in person",
      "Fort Lauderdale": "Digital only (LauderBuild — no paper accepted)",
      "Hollywood": "Online (Accela) or in person",
      "Cooper City": "In person (applications must be notarized)",
    };

    const CITY_NOTES = {
      "Fort Lauderdale": "All permit submissions must be made digitally through LauderBuild — no paper applications accepted.",
      "Hollywood": "Express same-day permits available for AC, roof, electrical, and water heater — submit Tuesday 6PM to Wednesday 9AM.",
      "Cooper City": "All applications must be notarized. Hold Harmless Agreement required for drainage easements.",
    };

    const systemContext = `You are OpenPermit AI, a permit assistant for Broward County, South Florida. You have access to a comprehensive permit database covering 5 cities with 122 total permit types, all sourced from official municipal documents. Current city: ${currentCity}.

City reference data:
- Weston: 39 permit types | Phone: (954) 385-2600 | Hours: Mon–Fri 8AM–4:30PM | NOC threshold: $2,500 | Portal: westonfl.org/Permits | Ordinance: codelibrary.amlegal.com/codes/weston/
- Coral Springs: 22 permit types | Phone: (954) 344-1025 | Hours: Mon–Thu 7:30AM–5PM, Fri 7:30AM–2:30PM | NOC threshold: $5,000 | Portal: eTrakit (coralsprings.gov) | Ordinance: library.municode.com/fl/coral_springs
- Fort Lauderdale: 17 permit types | Phone: (954) 828-6520 | Hours: Mon–Fri 7:30AM–4:30PM | NOC threshold: $2,500 | Portal: LauderBuild (digital only — no paper) | Ordinance: library.municode.com/fl/fort_lauderdale
- Hollywood: 23 permit types | Phone: (954) 921-3335 | Hours: Mon–Thu 7AM–6PM | NOC threshold: $5,000 (AC: $15,000) | Portal: Accela | Express Wed permits for AC/roof/electrical/water heater | Ordinance: codelibrary.amlegal.com/codes/hollywood/
- Cooper City: 21 permit types | Phone: (954) 434-4300 | Hours: Mon–Fri 8AM–5PM | NOC threshold: $2,500 | Portal: coopercity.gov | All applications must be notarized | Ordinance: library.municode.com/fl/cooper_city

Ordinance platforms: Weston & Hollywood → American Legal Publishing (codelibrary.amlegal.com). Coral Springs, Fort Lauderdale, Cooper City → Municode (library.municode.com).
${localDataSection}${zoningSection}${fbcSection}

INSTRUCTIONS:
- You have been provided with the complete permit database, local zoning/ordinance data, AND Florida Building Code (FBC) sections above. Use all of these to answer questions.
- For permit types, documents, requirements, timelines, fees, setbacks, heights, lot coverage, FBC code sections, and HVHZ requirements: answer ONLY from the provided local data. Do NOT use web search for these.
- When FBC sections are provided, cite the section number (e.g. "per FBC §R905.2") and include relevant key_numbers.
- All Broward County properties are in the HVHZ (High Velocity Hurricane Zone) — always mention 170+ mph wind requirements and Florida Product Approval for any exterior work.
- Only use web search for HOA-specific rules, deed restrictions, or historical district requirements not in the local data.
- Never fetch ordinance URLs directly — reference them as links only.
- Always respond with structured JSON matching the schema.
- portal_url="${portalUrl}", city_name="${currentCity}", dept_phone="${cityDeptInfo.phone}", dept_hours="${cityDeptInfo.hours}".
- quick_facts.how_to_apply: "${HOW_TO_APPLY[currentCity] || "Online or in person"}".
- Notice of Commencement threshold for ${currentCity}: ${cityDeptInfo.noc_threshold}. Use the correct threshold when mentioning NOC requirements.
- requirements_note: always add "These are ${currentCity}'s requirements. Your HOA may have additional rules." for residential projects.
- caveats: always include HOA note for residential projects.${CITY_NOTES[currentCity] ? `\n- Important note for ${currentCity}: ${CITY_NOTES[currentCity]}` : ""}
- For conversational/meta questions: set is_plain_text=true and populate plain_text_reply only.
- Max 6 documents and 6 requirements. direct_answer is one sentence.`;

    const conversationContext = history ? `\nConversation:\n${history}` : "";

    const reply = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `${systemContext}${conversationContext}\n\nUser: ${message}\nAssistant (respond with JSON only):`,
      add_context_from_internet: useWebSearch,
      model: useWebSearch ? "gemini_3_flash" : "gpt_5_mini",
      response_json_schema: responseSchema,
    });

    const structured = typeof reply === "object" ? reply : null;

    if (!structured) {
      return Response.json({ reply: "I'm sorry, I had trouble formatting that response. Please try again.", structured: null });
    }

    return Response.json({ structured, usedWebSearch: useWebSearch });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});