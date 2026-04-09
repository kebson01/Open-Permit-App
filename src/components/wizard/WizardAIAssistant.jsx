import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { MessageCircle, Send, X, Sparkles, ChevronDown } from "lucide-react";

export default function WizardAIAssistant({ context }) {
  const [open, setOpen] = useState(false);
  const [conv, setConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open && !conv && !initializing) initChat();
  }, [open]);

  const initChat = async () => {
    setInitializing(true);
    const c = await base44.agents.createConversation({
      agent_name: "property_permit_consultant",
      metadata: { name: "Permit Wizard Assistant", description: context || "Permit guidance" },
    });
    if (context) {
      await base44.agents.addMessage(c, {
        role: "user",
        content: `[SYSTEM CONTEXT - internal only]\n${context}\n\nYou are a permit assistant helping the user understand what permits they need. Reference the above project context when answering. Search the web for current local requirements.`,
      });
    }
    base44.agents.subscribeToConversation(c.id, (data) => {
      const visible = data.messages.filter(m => !m.content?.startsWith("[SYSTEM CONTEXT"));
      setMessages(visible);
    });
    setConv(c);
    setInitializing(false);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading || !conv) return;
    setInput("");
    setLoading(true);
    await base44.agents.addMessage(conv, { role: "user", content: text });
    setLoading(false);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-24 md:bottom-8 right-6 z-50 w-14 h-14 rounded-full text-white shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)" }}
        title="Ask AI Assistant"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {open && (
        <div className="fixed bottom-40 md:bottom-24 right-6 z-50 w-80 max-w-[calc(100vw-48px)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden" style={{ height: 420 }}>
          <div className="px-4 py-3 flex items-center gap-3" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)" }}>
            <Sparkles className="w-4 h-4 text-white" />
            <div>
              <p className="text-white font-semibold text-sm">Permit AI Assistant</p>
              <p className="text-blue-200 text-xs">Ask anything about your permits</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-gray-50">
            {(initializing || (!conv && !messages.length)) && (
              <div className="text-center pt-6 text-sm text-gray-400">
                {initializing ? "Initializing..." : "Ask any question about permits, documents, or next steps."}
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                  msg.role === "user" ? "text-white rounded-br-none" : "bg-white text-gray-700 border border-gray-100 shadow-sm rounded-bl-none"
                }`} style={msg.role === "user" ? { background: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)" } : {}}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white px-3 py-2.5 rounded-xl rounded-bl-none border border-gray-100 shadow-sm">
                  <div className="flex gap-1">
                    {[0, 150, 300].map(d => (
                      <div key={d} className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="p-2.5 border-t bg-white flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Ask a question..."
              disabled={!conv}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 disabled:opacity-50"
            />
            <button
              onClick={send}
              disabled={loading || !input.trim() || !conv}
              className="w-9 h-9 rounded-lg text-white flex items-center justify-center disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)" }}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}