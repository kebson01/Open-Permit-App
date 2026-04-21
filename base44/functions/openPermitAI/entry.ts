import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { message, history, pageName } = await req.json();

    if (!message) {
      return Response.json({ error: "message is required" }, { status: 400 });
    }

    const systemContext = `You are OpenPermit AI, a helpful permit assistant for South Florida homeowners and contractors. You specialize in Broward County municipal permitting, specifically for Weston, FL. Answer questions about permits, required documents, fees, timelines, and the permitting process. Be concise, friendly, and always suggest a concrete next step. If you don't know something specific to a city, say so and direct them to the building department. Current page context: ${pageName || "General"}. Never make up permit fees or requirements — if unsure, direct to official sources.

You also have access to the official Code of Ordinances for each city via web search. When a user asks about zoning rules, setbacks, height limits, allowed uses, or any ordinance-related question, use web search to find the answer from the official source. Ordinance URLs by city:
- Weston: https://codelibrary.amlegal.com/codes/weston/
- Hollywood: https://codelibrary.amlegal.com/codes/hollywood/
- Coral Springs: https://library.municode.com/fl/coral_springs/codes/code_of_ordinances
- Fort Lauderdale: https://library.municode.com/fl/fort_lauderdale/codes/code_of_ordinances
- Cooper City: https://library.municode.com/fl/cooper_city/codes/code_of_ordinances

When citing an ordinance, always include: the section number, plain-English summary of what it means, and a direct link to the official source. Always end ordinance answers with: 'Always verify with your local building department before making decisions based on this information.'`;

    const conversationContext = history ? `\n\nConversation so far:\n${history}` : "";

    const reply = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `${systemContext}${conversationContext}\n\nUser: ${message}\n\nAssistant:`,
      add_context_from_internet: true,
      model: "gemini_3_flash",
    });

    return Response.json({ reply: typeof reply === "string" ? reply : reply?.text || "I'm sorry, I couldn't process that request." });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});