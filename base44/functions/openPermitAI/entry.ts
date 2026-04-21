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

// ORDINANCE keywords — only these trigger web search
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

function formatPermitDataForPrompt(permits) {
  if (!permits.length) return "";
  return permits.map(p => {
    const reqs = Array.isArray(p.typical_requirements) ? p.typical_requirements : (typeof p.typical_requirements === "string" ? JSON.parse(p.typical_requirements || "[]") : []);
    const docs = Array.isArray(p.documents_needed) ? p.documents_needed : (typeof p.documents_needed === "string" ? JSON.parse(p.documents_needed || "[]") : []);
    return `- ${p.name} (${p.category}): ${p.description || ""}. Timeline: ${p.typical_timeline || "varies"}. Requirements: ${reqs.slice(0,3).join(", ") || "see dept"}. Docs: ${docs.slice(0,4).join(", ") || "see dept"}.`;
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

    // Fetch local permit data in parallel with deciding
    const permitData = await fetchLocalPermitData();
    const localDataSection = permitData.length
      ? `\nAVAILABLE PERMIT TYPES (answer from this first):\n${formatPermitDataForPrompt(permitData)}`
      : "";

    const ordinanceSection = `\nOrdinance URLs (reference only, do not fetch): Weston: ${ORDINANCE_URLS["Weston"]} | Coral Springs: ${ORDINANCE_URLS["Coral Springs"]} | Fort Lauderdale: ${ORDINANCE_URLS["Fort Lauderdale"]} | Hollywood: ${ORDINANCE_URLS["Hollywood"]} | Cooper City: ${ORDINANCE_URLS["Cooper City"]}`;

    const systemContext = `You are OpenPermit AI, a permit assistant for Broward County, South Florida. Current city: ${currentCity}.${localDataSection}${ordinanceSection}

Rules: Answer in plain English. Use the local permit data above first — do not search the web for questions already answered by that data. Only use web search for specific ordinance sections or zoning details not covered above. Never fetch ordinance URLs directly. Always give a concrete next step. End ordinance answers with: "Always verify with your local building department."`;

    const conversationContext = history ? `\nConversation:\n${history}` : "";

    const reply = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `${systemContext}${conversationContext}\n\nUser: ${message}\nAssistant:`,
      add_context_from_internet: useWebSearch,
      model: useWebSearch ? "gemini_3_flash" : "gpt_5_mini",
    });

    return Response.json({ reply: typeof reply === "string" ? reply : reply?.text || "I'm sorry, I couldn't process that request.", usedWebSearch: useWebSearch });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});