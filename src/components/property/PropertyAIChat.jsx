import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Send, Globe, ChevronDown, ChevronUp } from "lucide-react";

const SUGGESTED_QUESTIONS = [
  "Based on this property's history, what should I plan next?",
  "Are there any open or expired permits I should address?",
  "What permits do I need for a roof replacement?",
  "Can I add a pool to this property?",
  "What are the setback requirements here?",
];

function buildPropertyContext(p, permits = []) {
  const address = p.full_address || [p.SITUS_STREET_NUMBER, p.SITUS_STREET_DIRECTION, p.SITUS_STREET_NAME, p.SITUS_STREET_TYPE]
    .filter(Boolean).join(" ");
  const totalValue = (p.JUST_LAND_VALUE || 0) + (p.JUST_BUILDING_VALUE || 0) + (p.JUST_OTHER_VALUE || 0);

  let permitHistory = "";
  if (permits.length > 0) {
    permitHistory = `\n\nPERMIT HISTORY (${permits.length} records):\n` + permits.map(r =>
      `- [${r.issued_date || "Unknown date"}] ${r.permit_type?.replace(/_/g, " ").toUpperCase()} | ${r.permit_description || "No description"} | Status: ${r.status} | City: ${r.city_name}${r.contractor_name ? ` | Contractor: ${r.contractor_name}` : ""}${r.job_value ? ` | Value: $${Number(r.job_value).toLocaleString()}` : ""}`
    ).join("\n");
  } else {
    permitHistory = "\n\nPERMIT HISTORY: No permit records found in our database for this property yet.";
  }

  // Flag open/expired permits
  const openPermits = permits.filter(r => ["issued", "in_review", "pending"].includes(r.status));
  const expiredPermits = permits.filter(r => r.status === "expired");
  let flags = "";
  if (openPermits.length > 0) flags += `\n⚠️ OPEN PERMITS (${openPermits.length}): ${openPermits.map(r => r.permit_description || r.permit_type).join(", ")}`;
  if (expiredPermits.length > 0) flags += `\n⚠️ EXPIRED PERMITS (${expiredPermits.length}): May need re-permitting before sale or future work.`;

  const city = p.city_name || p.SITUS_CITY || "";
  const zip = p.zip_code || p.SITUS_ZIP_CODE || "";
  return `PROPERTY: ${address}, ${city}, FL ${zip}
Folio: ${p.FOLIO_NUMBER} | City: ${city} | Year Built: ${p.year_built || p.BLDG_YEAR_BUILT || "Unknown"}
Use Type: ${p.USE_TYPE || "Unknown"} | ${p.beds || p.BEDS || "—"}bd/${p.baths || p.BATHS || "—"}ba
Under Air: ${p.under_air_sq_footage?.toLocaleString() || p.BLDG_UNDER_AIR_SQ_FOOTAGE?.toLocaleString() || "Unknown"} sqft
Homestead: ${p.HOMESTEAD_FLAG === "Y" ? "Yes" : "No"}${flags}${permitHistory}`;
}

export default function PropertyAIChat({ property, permits = [] }) {
  const [expanded, setExpanded] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const messagesEndRef = useRef(null);

  const shortAddress = property.full_address?.split(",")[0] || [property.SITUS_STREET_NUMBER, property.SITUS_STREET_NAME].filter(Boolean).join(" ");

  useEffect(() => {
    if (expanded && !conversation && !initializing) {
      initConversation();
    }
  }, [expanded, permits.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const initConversation = async () => {
    setInitializing(true);
    const ctx = buildPropertyContext(property, permits);
    const conv = await base44.agents.createConversation({
      agent_name: "property_permit_consultant",
      metadata: {
        name: `${shortAddress} — Permit Consultation`,
        description: ctx,
      },
    });

    // Send initial context message silently
    await base44.agents.addMessage(conv, {
      role: "user",
      content: `[SYSTEM CONTEXT - do not show this to the user, just acknowledge it internally]\n${ctx}\n\nYou are now advising on this specific property. When answering questions, always reference this property's details and search the web for the most current zoning and permit information for ${property.city_name || property.SITUS_CITY || "Broward County"}, Florida.`,
    });

    setConversation(conv);
    setInitializing(false);

    // Subscribe to updates
    base44.agents.subscribeToConversation(conv.id, (data) => {
      const visibleMessages = data.messages.filter(
        m => !m.content?.startsWith("[SYSTEM CONTEXT")
      );
      setMessages(visibleMessages);
    });
  };

  const send = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading || !conversation) return;
    setInput("");
    setLoading(true);

    await base44.agents.addMessage(conversation, {
      role: "user",
      content: userText,
    });

    setLoading(false);
  };

  const handleSuggestedQuestion = async (q) => {
    if (!conversation) return;
    setLoading(true);
    setInput("");
    await base44.agents.addMessage(conversation, { role: "user", content: q });
    setLoading(false);
  };

  const visibleMessages = messages.filter(m => m.role === "user" || m.role === "assistant");
  const isReady = conversation && !initializing;
  const hasChat = visibleMessages.length > 0;

  return (
    <div className="mt-6 bg-white rounded-xl border border-indigo-200 overflow-hidden shadow-sm">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-800 flex items-center gap-2">
              AI Permit Consultant
              <span className="text-xs font-normal bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Globe className="w-3 h-3" /> Web Search
              </span>
            </p>
            <p className="text-xs text-gray-500">Knows this property's permit history · Searches live zoning data</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>

      {expanded && (
        <div className="flex flex-col" style={{ height: 440 }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {initializing && (
              <div className="flex justify-start">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
                <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-sm border border-gray-100 text-sm text-gray-400">
                  Loading property context...
                </div>
              </div>
            )}

            {isReady && !hasChat && (
              <div className="text-center pt-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <p className="font-semibold text-gray-800 text-sm">AI Permit Consultant</p>
                <p className="text-xs text-gray-500 mt-1 mb-4">
                  Ask anything about permits for <strong>{shortAddress}</strong> in <strong>{property.city_name || property.SITUS_CITY || "Broward County"}</strong>.<br />
                  I'll search the web for the latest zoning and permit info.
                </p>
              </div>
            )}

            {visibleMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                )}
                <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-br-md"
                    : "bg-white text-gray-700 shadow-sm border border-gray-100 rounded-bl-md"
                }`}>
                  {(msg.content || "").split("\n").map((line, j, arr) => (
                    <span key={j}>{line}{j < arr.length - 1 && <br />}</span>
                  ))}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
                <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-sm border border-gray-100">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested questions */}
          {isReady && !hasChat && (
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex gap-2 overflow-x-auto">
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestedQuestion(q)}
                  className="flex-shrink-0 text-xs px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 rounded-full hover:bg-indigo-50 transition-colors whitespace-nowrap"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t bg-white flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={isReady ? "Ask about permits, zoning, fees..." : "Initializing..."}
              disabled={!isReady}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400 disabled:opacity-50"
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim() || !isReady}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white flex items-center justify-center disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}