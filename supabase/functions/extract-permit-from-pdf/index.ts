// Extracts structured permit data from a city document URL using Anthropic.
// Admin-only: requires the caller's user_metadata.role === "admin".
import { createClient } from "npm:@supabase/supabase-js@2";

const MODEL = "claude-sonnet-4-6";

const SYSTEM_PROMPT = `You are a permit data extraction assistant. Extract structured permit information from a city building department document. Return name (string), category (one of: building/electrical/plumbing/fire/certificate/planning/engineering/additional), map_zone (one of: garage/roof/windows/pool/backyard/fence/hvac/electrical/interior/driveway/structure), description (1 sentence plain English), typical_requirements (array of strings), documents_needed (array of strings), inspections_required (array of strings), typical_timeline (string like '2-3 business days'), noc_threshold (number — dollar amount as integer only e.g. 2500).`;

const SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string" },
    category: { type: "string", enum: ["building", "electrical", "plumbing", "fire", "certificate", "planning", "engineering", "additional"] },
    map_zone: { type: "string", enum: ["garage", "roof", "windows", "pool", "backyard", "fence", "hvac", "electrical", "interior", "driveway", "structure"] },
    description: { type: "string" },
    typical_requirements: { type: "array", items: { type: "string" } },
    documents_needed: { type: "array", items: { type: "string" } },
    inspections_required: { type: "array", items: { type: "string" } },
    typical_timeline: { type: "string" },
    noc_threshold: { type: "number" },
  },
  required: ["name", "category", "map_zone", "description", "typical_requirements", "documents_needed", "inspections_required", "typical_timeline", "noc_threshold"],
};

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) return json({ error: "ANTHROPIC_API_KEY is not configured" }, 500);

    // Verify the caller is an admin (role lives in user_metadata).
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization") || "" } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.user_metadata?.role !== "admin") {
      return json({ error: "Admin access required" }, 403);
    }

    const { pdfUrl, city } = await req.json();
    if (!pdfUrl) return json({ error: "pdfUrl is required" }, 400);

    let documentContext = `City: ${city || "unknown"}\nDocument URL: ${pdfUrl}`;
    try {
      const fetchRes = await fetch(pdfUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; OpenPermit/1.0)", "Accept": "text/html,*/*" },
        signal: AbortSignal.timeout(8000),
      });
      const contentType = fetchRes.headers.get("content-type") || "";
      if (!contentType.includes("pdf")) {
        const text = await fetchRes.text();
        const cleaned = text
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s{3,}/g, "\n")
          .trim()
          .slice(0, 10000);
        documentContext += `\n\nDocument Content:\n${cleaned}`;
      }
    } catch { /* proceed without content */ }

    const prompt = `${SYSTEM_PROMPT}\n\nExtract permit data from this building department document.\n\n${documentContext}`;

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
        tools: [{ name: "respond", description: "Return the extracted permit data.", input_schema: SCHEMA }],
        tool_choice: { type: "tool", name: "respond" },
      }),
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error?.message || "Anthropic API error");

    const toolUse = (result.content || []).find((c: { type: string }) => c.type === "tool_use");
    const data = (toolUse?.input || {}) as Record<string, unknown>;

    const normalizeArray = (val: unknown) => {
      if (Array.isArray(val)) return val.filter(Boolean);
      if (typeof val === "string") return val.split("\n").filter(Boolean);
      return [];
    };
    data.typical_requirements = normalizeArray(data.typical_requirements);
    data.documents_needed = normalizeArray(data.documents_needed);
    data.inspections_required = normalizeArray(data.inspections_required);
    data.noc_threshold = Number(data.noc_threshold) || 2500;
    data.typical_timeline = data.typical_timeline || "3-5 business days";
    data.category = data.category || "building";
    data.map_zone = data.map_zone || "structure";

    return json({ success: true, data });
  } catch (error) {
    return json({ error: (error as Error).message }, 500);
  }
});
