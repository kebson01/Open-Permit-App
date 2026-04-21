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
  "Hollywood": "https://www.hollywoodfl.org/permits",
  "Coral Springs": "https://www.coralsprings.org/departments/development-services/building",
  "Fort Lauderdale": "https://www.fortlauderdale.gov/departments/sustainable-development/building-services",
  "Cooper City": "https://www.coopercityfl.org/building",
};

const ORDINANCE_KEYWORDS = ["setback", "zoning", "height limit", "allowed use", "ordinance", "section", "code of", "land use", "impervious", "floor area ratio", "FAR", "easement", "right of way"];

function needsWebSearch(message) {
  const lower = message.toLowerCase();
  return ORDINANCE_KEYWORDS.some(kw => lower.includes(kw.toLowerCase()));
}

async function fetchLocalPermitData() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/weston_permit_types?select=name,category,description,typical_requirements,documents_needed,inspections_required,typical_timeline`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
    );
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
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
    return `- ${p.name} (${p.category}): ${p.description || ""}. Timeline: ${p.typical_timeline || "varies"}. Requirements: ${reqs.slice(0,3).join("; ") || "see dept"}. Docs: ${docs.slice(0,4).join("; ") || "see dept"}.`;
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
    const useWebSearch = needsWebSearch(message);
    const ordinanceUrl = ORDINANCE_URLS[currentCity] || ORDINANCE_URLS["Weston"];
    const portalUrl = CITY_PORTAL_URLS[currentCity] || CITY_PORTAL_URLS["Weston"];

    const permitData = await fetchLocalPermitData();
    const localDataSection = permitData.length
      ? `\nAVAILABLE PERMIT TYPES (use this data first):\n${formatPermitDataForPrompt(permitData)}`
      : "";

    const responseSchema = {
      type: "object",
      properties: {
        direct_answer: { type: "string", description: "One sentence direct answer. Example: 'Yes — you need a Shed / Pergola / Gazebo permit in Weston.'" },
        description: { type: "string", description: "One sentence plain-English context beneath the direct answer. Example: 'A permit ensures your shed meets Florida wind and safety requirements.'" },
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
              description: { type: "string", description: "One sentence: what this document is and why it's needed." },
              where_to_get: { type: "string", description: "Where to obtain this document, e.g. 'Download from Broward County website' or 'Your licensed contractor provides this'" },
              download_url: { type: "string", description: "Direct download URL if available, otherwise null" }
            }
          }
        },
        requirements: {
          type: "array",
          description: "Up to 6 plain-English requirements. Include specific thresholds and numbers where relevant (e.g. '$2,500 threshold for Notice of Commencement').",
          items: { type: "string" }
        },
        requirements_note: { type: "string", description: "A short note at the bottom of requirements, e.g. 'These are Weston requirements. Your HOA may have additional rules.' or null" },
        zoning_info: { type: "string", description: "2-3 sentences about relevant zoning rules including key numbers (setbacks, height limits, lot coverage %). Null if not relevant." },
        zoning_url: { type: "string", description: "Link to ordinance source, or null" },
        caveats: {
          type: "array",
          description: "Up to 3 important caveats. Always include HOA note if applicable. Example: 'Most Weston properties have an HOA — get written HOA approval BEFORE applying for the city permit.'",
          items: { type: "string" }
        },
        portal_url: { type: "string", description: "City permit portal URL" },
        portal_label: { type: "string", description: "Button label e.g. 'Apply Online →' or 'Visit Weston Portal →'" },
        city_name: { type: "string", description: "City name for contact strip, e.g. 'Weston'" },
        dept_phone: { type: "string", description: "Building department phone, e.g. '(954) 385-2600'" },
        dept_hours: { type: "string", description: "Hours, e.g. 'Mon–Fri 8AM–4:30PM'" },
        is_plain_text: { type: "boolean", description: "Set to true ONLY for greetings or meta questions that don't fit the card format." },
        plain_text_reply: { type: "string", description: "Only populated when is_plain_text is true" }
      },
      required: ["direct_answer", "is_plain_text"]
    };

    const systemContext = `You are OpenPermit AI, a permit assistant for Broward County, South Florida. Current city: ${currentCity}.${localDataSection}

Ordinance URLs (reference only, never fetch): Weston: ${ORDINANCE_URLS["Weston"]} | Coral Springs: ${ORDINANCE_URLS["Coral Springs"]} | Fort Lauderdale: ${ORDINANCE_URLS["Fort Lauderdale"]} | Hollywood: ${ORDINANCE_URLS["Hollywood"]} | Cooper City: ${ORDINANCE_URLS["Cooper City"]}

Rules:
- Answer from local permit data above first. Only use web search for specific ordinance sections not covered.
- Never fetch ordinance URLs directly — reference them as links only.
- Always respond with structured JSON matching the provided schema.
- For permit questions: populate all fields. portal_url="${portalUrl}", city_name="${currentCity}", dept_phone="(954) 385-2600" (for Weston), dept_hours="Mon–Fri 8AM–4:30PM".
- description: one plain-English sentence explaining WHY the permit is needed (safety, code compliance, etc.).
- quick_facts.how_to_apply: "Online or in person" for Weston.
- documents: for each, include description (what it is + why needed), where_to_get (where to obtain), and download_url if you know a real one.
- requirements_note: always add "These are ${currentCity}'s requirements. Your HOA may have additional rules." for residential projects.
- caveats: always include HOA note for residential Weston projects.
- For conversational/meta questions: set is_plain_text=true and populate plain_text_reply only.
- Max 6 documents and 6 requirements. direct_answer is one sentence answering the question directly.`;

    const conversationContext = history ? `\nConversation:\n${history}` : "";

    const reply = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `${systemContext}${conversationContext}\n\nUser: ${message}\nAssistant (respond with JSON only):`,
      add_context_from_internet: useWebSearch,
      model: useWebSearch ? "gemini_3_flash" : "gpt_5_mini",
      response_json_schema: responseSchema,
    });

    // reply is already a parsed object when response_json_schema is set
    const structured = typeof reply === "object" ? reply : null;

    if (!structured) {
      return Response.json({ reply: "I'm sorry, I had trouble formatting that response. Please try again.", structured: null });
    }

    return Response.json({ structured, usedWebSearch: useWebSearch });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});