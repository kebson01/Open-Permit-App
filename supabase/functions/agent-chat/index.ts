// Property permit consultant chat backed by Anthropic with web search.
// Replaces the base44 "property_permit_consultant" agent. Stateless: the client
// sends the full visible message history each turn.

const MODEL = "claude-sonnet-4-6";

const SYSTEM_PROMPT = `You are an expert building permit consultant for Broward County, Florida (cities include Weston, Coral Springs, Fort Lauderdale, Hollywood, Cooper City, Pembroke Pines, Miramar, Davie, Dania Beach, Hallandale Beach, and more).

You may receive a SYSTEM CONTEXT block containing full property details and complete permit history for a specific property.

When answering questions:
1. ALWAYS reference the property's actual permit history when provided. If a similar permit was pulled in the past (e.g., a roof replaced 8 years ago), mention it and factor it into your advice.
2. Use permit history to make intelligent suggestions (e.g., a driveway permit from 15 years ago — suggest evaluating replacement vs. resurfacing).
3. Search the web for current zoning codes, permit requirements, fee schedules, and municipal ordinances specific to the city (city websites, Municode, official Florida building code).

Always:
- Reference the specific city and property details in your answers
- Give personalized, context-aware advice
- Be concise, practical, and proactive
- Recommend confirming with the local building department for final decisions
- Mention specific code sections or ordinance numbers when found
- Suggest using the Fee Calculator in the app for exact fee estimates
- Flag any open or expired permits, as they may affect future permitting or sale`;

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

    const { messages, context } = await req.json();

    const system = context
      ? `${SYSTEM_PROMPT}\n\nSYSTEM CONTEXT (do not echo verbatim):\n${context}`
      : SYSTEM_PROMPT;

    const anthropicMessages = (messages || [])
      .filter((m: { role: string }) => m.role === "user" || m.role === "assistant")
      .map((m: { role: string; content: string }) => ({ role: m.role, content: m.content }));

    if (anthropicMessages.length === 0) {
      return json({ error: "messages is required" }, 400);
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        system,
        messages: anthropicMessages,
        tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }],
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Anthropic API error");

    const reply = (data.content || [])
      .filter((c: { type: string }) => c.type === "text")
      .map((c: { text: string }) => c.text)
      .join("\n")
      .trim();

    return json({ reply });
  } catch (error) {
    return json({ error: (error as Error).message }, 500);
  }
});
