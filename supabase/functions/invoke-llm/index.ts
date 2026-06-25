// Generic LLM call backed by Anthropic. Replaces base44 integrations.Core.InvokeLLM.
// Returns the structured object when response_json_schema is provided, else a string.

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

export async function runLLM(opts: {
  prompt: string;
  response_json_schema?: Record<string, unknown>;
  add_context_from_internet?: boolean;
  max_tokens?: number;
  image_base64?: string;
  image_media_type?: string;
}) {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");

  const { prompt, response_json_schema, add_context_from_internet, image_base64, image_media_type } = opts;
  const max_tokens = opts.max_tokens ?? 2048;

  // When an image is supplied, send a multimodal content array (vision).
  // Otherwise keep the plain-string content for backward compatibility.
  const content = image_base64
    ? [
        {
          type: "image",
          source: { type: "base64", media_type: image_media_type || "image/jpeg", data: image_base64 },
        },
        { type: "text", text: prompt },
      ]
    : prompt;

  const body: Record<string, unknown> = {
    model: MODEL,
    max_tokens,
    messages: [{ role: "user", content }],
  };

  if (response_json_schema) {
    // Force a structured response via tool use.
    body.tools = [{
      name: "respond",
      description: "Respond to the user with structured data.",
      input_schema: response_json_schema,
    }];
    body.tool_choice = { type: "tool", name: "respond" };
  } else if (add_context_from_internet) {
    body.tools = [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }];
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Anthropic API error");

  if (response_json_schema) {
    const toolUse = (data.content || []).find((c: { type: string }) => c.type === "tool_use");
    if (!toolUse) throw new Error("Model did not return structured output");
    return toolUse.input;
  }

  const text = (data.content || [])
    .filter((c: { type: string }) => c.type === "text")
    .map((c: { text: string }) => c.text)
    .join("");
  return text;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const { prompt, response_json_schema, add_context_from_internet, image_base64, image_media_type, max_tokens } = await req.json();
    if (!prompt) return json({ error: "prompt is required" }, 400);
    const result = await runLLM({ prompt, response_json_schema, add_context_from_internet, image_base64, image_media_type, max_tokens });
    return json(result);
  } catch (error) {
    return json({ error: (error as Error).message }, 500);
  }
});
