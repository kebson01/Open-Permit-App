/**
 * AI / serverless helpers — call Supabase Edge Functions.
 * Replaces the former base44 SDK (integrations.Core.InvokeLLM, agents.*, users.inviteUser).
 */
import { supabase } from "@/lib/supabaseClient";

async function callFn(name, body) {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    let detail = error.message;
    try {
      const payload = await error.context?.json?.();
      if (payload?.error) detail = payload.error;
    } catch { /* ignore */ }
    throw new Error(detail);
  }
  return data;
}

/**
 * Replaces base44.integrations.Core.InvokeLLM.
 * Returns the result directly: a parsed object when response_json_schema is
 * provided, otherwise a plain string.
 */
export function invokeLLM({ prompt, response_json_schema, add_context_from_internet, model, image_base64, image_media_type, max_tokens } = {}) {
  return callFn("invoke-llm", { prompt, response_json_schema, add_context_from_internet, model, image_base64, image_media_type, max_tokens });
}

/**
 * Replaces base44.agents.* (createConversation/addMessage/subscribeToConversation).
 * Stateless: pass the full message history each turn. Returns { reply }.
 */
export function agentChat({ messages, context }) {
  return callFn("agent-chat", { messages, context });
}

/** Replaces base44.users.inviteUser. */
export function inviteUser(email, role, extra = {}) {
  return callFn("invite-user", { email, role, ...extra });
}
