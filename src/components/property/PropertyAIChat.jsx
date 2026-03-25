import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Send, Loader2, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";

const SUGGESTED_QUESTIONS = [
  "What permits do I need for a roof replacement?",
  "Can I add a pool to this property?",
  "What's the permit fee for window replacements?",
  "Do I need a permit for a new fence?",
  "What are the setback requirements here?",
];

function buildPropertyContext(p) {
  const address = [p.SITUS_STREET_NUMBER, p.SITUS_STREET_DIRECTION, p.SITUS_STREET_NAME, p.SITUS_STREET_TYPE]
    .filter(Boolean).join(" ");
  const totalValue = (p.JUST_LAND_VALUE || 0) + (p.JUST_BUILDING_VALUE || 0) + (p.JUST_OTHER_VALUE || 0);

  return `PROPERTY CONTEXT:
- Address: ${address}, ${p.SITUS_CITY}, FL ${p.SITUS_ZIP_CODE || ""}
- Folio: ${p.FOLIO_NUMBER}
- City: ${p.SITUS_CITY}
- Year Built: ${p.BLDG_YEAR_BUILT || p.ACTUAL_YEAR_BUILT || "Unknown"}
- Use Type: ${p.USE_TYPE || "Unknown"}
- Bedrooms/Baths: ${p.BEDS || "—"} bd / ${p.BATHS || "—"} ba
- Under Air Sq Ft: ${p.BLDG_UNDER_AIR_SQ_FOOTAGE?.toLocaleString() || "Unknown"}
- Total Sq Ft: ${p.BLDG_TOT_SQ_FOOTAGE?.toLocaleString() || "Unknown"}
- Lot Sq Ft (GIS): ${p.GIS_SQUARE_FOOT?.toLocaleString() || "Unknown"}
- Construction Class: ${p.BLDG_CCLASS || "Unknown"}
- Improvement Quality: ${p.BLDG_IMPROVE_QUAL || "Unknown"}
- Total Just Value: $${totalValue.toLocaleString()}
- Homestead: ${p.HOMESTEAD_FLAG === "Y" ? "Yes" : "No"}
- Owner: ${p.NAME_LINE_1 || "Unknown"}`;
}

export default function PropertyAIChat({ property }) {
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `I'm your AI permit consultant for **${[property.SITUS_STREET_NUMBER, property.SITUS_STREET_NAME].filter(Boolean).join(" ")}** in **${property.SITUS_CITY}**. Ask me anything about permits, fees, setbacks, or feasibility for this specific property.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (expanded) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, expanded]);

  const send = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userText }]);
    setLoading(true);

    const history = messages.slice(-6).map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n");
    const propertyCtx = buildPropertyContext(property);

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert building permit consultant for South Florida (Broward County, Florida). You help homeowners and contractors understand permit requirements, fees, setbacks, and feasibility for specific properties.

${propertyCtx}

Previous conversation:
${history}

User question: ${userText}

Answer based on the specific property context above. Reference the city (${property.SITUS_CITY}), lot size, year built, and use type where relevant. Be concise, practical, and specific. If you mention fees, note they vary and suggest using the Fee Calculator for exact amounts. Always recommend confirming with the local building department for final decisions.`,
      model: "claude_sonnet_4_6",
    });

    setMessages(prev => [...prev, { role: "assistant", content: response }]);
    setLoading(false);
  };

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
              <span className="text-xs font-normal bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">Property-Aware</span>
            </p>
            <p className="text-xs text-gray-500">Ask anything about permits for this property</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>

      {expanded && (
        <div className="flex flex-col" style={{ height: 420 }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg, i) => (
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
                  {msg.content.split("\n").map((line, j) => (
                    <span key={j}>{line}{j < msg.content.split("\n").length - 1 && <br />}</span>
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

          {/* Suggested questions (only on first open) */}
          {messages.length === 1 && (
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex gap-2 overflow-x-auto">
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => send(q)}
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
              placeholder="Ask about permits for this property..."
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400"
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
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