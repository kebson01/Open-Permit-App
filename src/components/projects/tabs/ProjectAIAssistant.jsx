import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Send, Loader2, RotateCcw } from "lucide-react";

const HOMEOWNER_PROMPTS = (project) => [
  `What permits do I need for ${project.project_type?.replace(/_/g, ' ') || 'my project'} in ${project.city_name || 'my city'}?`,
  `What documents am I still missing?`,
  `How long does permit review take in ${project.city_name || 'my city'}?`,
  `What's the first step I should take right now?`,
];

const CONTRACTOR_PROMPTS = (project) => [
  `Which items need attention on this project today?`,
  `Generate a permit status update for ${project.client_name || 'my client'}`,
  `What's the fee estimate for ${project.project_type?.replace(/_/g, ' ') || 'this project type'} in ${project.city_name || 'my city'}?`,
  `What inspections are required for this permit type?`,
  `Find licensed subcontractors for electrical work in ${project.city_name || 'my city'}`,
];

export default function ProjectAIAssistant({ project, mode = "homeowner" }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const prompts = mode === "contractor" ? CONTRACTOR_PROMPTS(project) : HOMEOWNER_PROMPTS(project);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput("");

    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);

    const response = await base44.functions.invoke("projectAIAssistant", {
      messages: newMessages,
      projectContext: {
        name: project.name,
        city_name: project.city_name,
        project_type: project.project_type,
        description: project.description,
        status: project.status,
        client_name: project.client_name,
        property_address: project.property_address,
        permits: project.permit_checklist ? (() => {
          try { return JSON.parse(project.permit_checklist).map(i => i.label).join(", "); } catch { return ""; }
        })() : "",
        missingDocs: project.permit_checklist ? (() => {
          try { return JSON.parse(project.permit_checklist).filter(i => !i.checked).map(i => i.label).join(", "); } catch { return ""; }
        })() : "",
      },
      mode,
    });

    const reply = response.data?.reply || "Sorry, I couldn't get a response. Please try again.";
    setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#3B82F6" }}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">
              {mode === "contractor" ? "Project Manager AI" : "Your Permit Assistant"}
            </p>
            <p className="text-xs text-gray-400">OpenPermit AI · Powered by Claude</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* Suggested prompts */}
      {messages.length === 0 && (
        <div className="mb-4 space-y-2">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Suggested questions</p>
          <div className="flex flex-col gap-2">
            {prompts.map((p, i) => (
              <button
                key={i}
                onClick={() => sendMessage(p)}
                className="text-left text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-xl border border-blue-100 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat messages */}
      {messages.length > 0 && (
        <div className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-80">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "text-white rounded-br-md"
                    : "text-gray-700 rounded-bl-md border border-blue-100"
                }`}
                style={msg.role === "user" ? { background: "#3B82F6" } : { background: "#EFF6FF" }}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="px-4 py-3 rounded-2xl rounded-bl-md border border-blue-100" style={{ background: "#EFF6FF" }}>
                <div className="flex gap-1">
                  {[0, 150, 300].map(d => (
                    <div key={d} className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 mt-auto">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder={mode === "contractor" ? "Ask about permits, clients, or deadlines..." : "Ask anything about your project..."}
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400"
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          className="w-10 h-10 rounded-xl text-white flex items-center justify-center disabled:opacity-40 transition-opacity"
          style={{ background: "#3B82F6" }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>

      {messages.length > 0 && (
        <p className="text-xs text-center text-gray-400 mt-3">
          Not satisfied? <button onClick={() => setMessages([])} className="text-blue-500 hover:underline">Start over</button>
        </p>
      )}
    </div>
  );
}