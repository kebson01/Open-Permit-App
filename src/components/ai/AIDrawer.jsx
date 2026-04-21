import React, { useState, useEffect, useRef } from "react";
import { X, Send, Sparkles, Building2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const PAGE_PROMPTS = {
  Home: [
    "What permits do I need to remodel my bathroom?",
    "How much does a roofing permit cost in Weston?",
    "What documents do I need for a pool permit?",
  ],
  PermitGuide: [
    "What's the difference between requirements and documents?",
    "How long does permit review take?",
    "Do I need a contractor for this permit?",
  ],
  PropertyGuide: [
    "What does an expired permit mean?",
    "How do I resolve an open code case?",
    "Can I renovate a property with an expired permit?",
  ],
  FeeCalculator: [
    "Why is my fee so high?",
    "Are there any fee exemptions?",
    "What's included in the technology fee?",
  ],
  ProjectDashboard: [
    "What's my next step?",
    "What documents am I missing?",
    "How do I add my contractor?",
  ],
};

const DEFAULT_PROMPTS = [
  "What permits do I need to remodel my bathroom?",
  "How much does a roofing permit cost in Weston?",
  "What documents do I need for a pool permit?",
];

const PAGE_DISPLAY_NAMES = {
  Home: "Home",
  PermitGuide: "Visual Permit Guide",
  PropertyGuide: "Property Search",
  FeeCalculator: "Fee Calculator",
  ProjectDashboard: "My Projects",
  ProjectDetail: "Project Details",
};

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#0F3575" }}>
          <Sparkles className="w-3 h-3 text-white" />
        </div>
        <div className="px-4 py-3 rounded-xl bg-gray-100 flex gap-1">
          <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

export default function AIDrawer({ open, onClose, currentPageName, initialMessage }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm OpenPermit AI. Ask me anything about permits, fees, and requirements in South Florida — I specialize in Broward County." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const initialSent = useRef(false);

  const suggestions = PAGE_PROMPTS[currentPageName] || DEFAULT_PROMPTS;
  const pageDisplay = PAGE_DISPLAY_NAMES[currentPageName] || currentPageName || "General";

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Handle initialMessage (from hero prompt chip or input bar)
  useEffect(() => {
    if (open && initialMessage && !initialSent.current) {
      initialSent.current = true;
      sendMessage(initialMessage);
    }
    if (!open) {
      initialSent.current = false;
    }
  }, [open, initialMessage]);

  const sendMessage = async (text) => {
    const content = (text || input).trim();
    if (!content || loading) return;

    setInput("");
    setMessages(prev => [...prev, { role: "user", content }]);
    setLoading(true);

    const history = messages.slice(-8).map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n");

    const response = await base44.functions.invoke("openPermitAI", {
      message: content,
      history,
      pageName: pageDisplay,
    });

    const reply = response.data?.reply || "I'm sorry, I had trouble answering that. Please try again.";
    setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    setLoading(false);
  };

  const handleChip = (chip) => {
    sendMessage(chip);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-[55] md:hidden"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full z-[60] flex flex-col bg-white shadow-2xl transition-transform duration-300 ease-out w-full md:w-[420px]`}
        style={{ transform: open ? "translateX(0)" : "translateX(100%)" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 flex-shrink-0" style={{ background: "#0F3575" }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.2)" }}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-white font-bold text-sm">OpenPermit AI</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.75)" }}>Ask me anything about permits in South Florida</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
            aria-label="Close AI chat"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-1" style={{ background: "#0F3575" }}>
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              )}
              <div
                className="max-w-[82%] px-4 py-2.5 text-sm leading-relaxed"
                style={msg.role === "user"
                  ? { background: "#3B82F6", color: "#fff", borderRadius: "12px 12px 2px 12px" }
                  : { background: "#F8FAFC", color: "#0F172A", borderRadius: "12px 12px 12px 2px", border: "1px solid #E2E8F0" }
                }
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div className="px-4 py-3 border-t border-gray-100 bg-white flex-shrink-0">
            <p className="text-xs text-gray-400 mb-2 font-medium">Try asking:</p>
            <div className="flex flex-col gap-1.5">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleChip(s)}
                  className="text-left text-xs px-3 py-2 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800 text-gray-700 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="px-4 py-3 border-t border-gray-200 bg-white flex-shrink-0">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 bg-gray-50"
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="w-10 h-10 rounded-xl text-white flex items-center justify-center disabled:opacity-40 transition-opacity hover:opacity-90 flex-shrink-0"
              style={{ background: "#3B82F6" }}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}