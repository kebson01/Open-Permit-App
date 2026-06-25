// Project AI assistant backed by Anthropic. Auth is enforced by verify_jwt at deploy.

const MODEL = "claude-sonnet-4-6";

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

    const { messages, projectContext = {}, mode } = await req.json();

    const systemPrompt = mode === "contractor"
      ? `You are a permit management assistant for a licensed contractor using OpenPermit in South Florida. The contractor manages multiple projects. Current project: ${projectContext.name} for client ${projectContext.client_name || "the homeowner"} at ${projectContext.property_address || "their property"} in ${projectContext.city_name || "South Florida"}. Project status: ${projectContext.status}. Project type: ${projectContext.project_type?.replace(/_/g, " ")}. Permits needed: ${projectContext.permits || "to be determined"}. Missing documents: ${projectContext.missingDocs || "none identified"}. Provide efficient, professional responses. Include specific permit numbers, fees, and timelines where relevant. Help the contractor stay on top of deadlines and requirements.`
      : `You are a helpful permit assistant for OpenPermit, a South Florida permitting guidance platform. The user is a homeowner in ${projectContext.city_name || "South Florida"}. Their project is: ${projectContext.description || projectContext.project_type?.replace(/_/g, " ") || "a home improvement project"}. They need these permits: ${projectContext.permits || "to be determined"}. They are missing these documents: ${projectContext.missingDocs || "none identified"}. Answer in plain, simple language. Never use jargon without explaining it. Always tell them the next concrete step they should take.`;

    const anthropicMessages = (messages || []).map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    }));

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages: anthropicMessages,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Anthropic API error");

    return json({ reply: data.content[0].text });
  } catch (error) {
    return json({ error: (error as Error).message }, 500);
  }
});
