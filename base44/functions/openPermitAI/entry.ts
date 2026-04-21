import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { message, history, pageName } = await req.json();

    if (!message) {
      return Response.json({ error: "message is required" }, { status: 400 });
    }

    const systemContext = `You are OpenPermit AI, a helpful permit assistant for South Florida homeowners and contractors. You specialize in Broward County municipal permitting, specifically for Weston, FL. Answer questions about permits, required documents, fees, timelines, and the permitting process. Be concise, friendly, and always suggest a concrete next step. If you don't know something specific to a city, say so and direct them to the building department. Current page context: ${pageName || "General"}. Never make up permit fees or requirements — if unsure, direct to official sources.`;

    const conversationContext = history ? `\n\nConversation so far:\n${history}` : "";

    const reply = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `${systemContext}${conversationContext}\n\nUser: ${message}\n\nAssistant:`,
    });

    return Response.json({ reply: typeof reply === "string" ? reply : reply?.text || "I'm sorry, I couldn't process that request." });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});