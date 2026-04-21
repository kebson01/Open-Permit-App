import React, { useState, useRef } from "react";
import { Sparkles, Send } from "lucide-react";

const CHIPS = [
  "What permits do I need to add a room?",
  "How much does a pool permit cost?",
  "What documents are needed for a re-roof?",
  "Do I need a permit to replace my AC?",
  "How long does permit approval take in Weston?",
  "Can I pull my own permit as a homeowner?",
];

export default function HomeAISection({ onAsk }) {
  const [input, setInput] = useState("");
  const inputRef = useRef(null);

  const handleAsk = (text) => {
    const q = (text || input).trim();
    if (!q) return;
    onAsk(q);
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleAsk();
  };

  return (
    <section style={{ background: "#fff", padding: "40px 32px" }}>
      <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
        {/* Label */}
        <p className="font-semibold uppercase tracking-widest mb-2" style={{ color: "#3B82F6", fontSize: 11 }}>
          AI-POWERED GUIDANCE
        </p>

        {/* Heading */}
        <h2 className="font-bold mb-2" style={{ color: "#0F172A", fontSize: 24 }}>
          Not sure where to start? Just ask.
        </h2>
        <p style={{ color: "#475569", fontSize: 15, marginBottom: 24 }}>
          Our AI knows Broward County permitting inside and out.
        </p>

        {/* Chips */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => handleAsk(chip)}
              className="group text-sm px-4 py-2 rounded-full border transition-all"
              style={{
                background: "#fff",
                borderColor: "#E2E8F0",
                color: "#0F172A",
                fontSize: 13,
                borderRadius: 20,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "#EFF6FF";
                e.currentTarget.style.borderColor = "#3B82F6";
                e.currentTarget.style.color = "#3B82F6";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "#fff";
                e.currentTarget.style.borderColor = "#E2E8F0";
                e.currentTarget.style.color = "#0F172A";
              }}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input bar */}
        <div
          className="flex items-center gap-3 px-4 bg-white transition-all"
          style={{
            border: "1.5px solid #E2E8F0",
            borderRadius: 12,
            height: 52,
            maxWidth: 700,
            margin: "0 auto",
          }}
          onFocusCapture={e => e.currentTarget.style.borderColor = "#3B82F6"}
          onBlurCapture={e => e.currentTarget.style.borderColor = "#E2E8F0"}
        >
          <Sparkles className="w-5 h-5 flex-shrink-0" style={{ color: "#3B82F6" }} />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about permits in South Florida..."
            className="flex-1 text-sm bg-transparent focus:outline-none"
            style={{ color: "#0F172A" }}
          />
          <button
            onClick={() => handleAsk()}
            disabled={!input.trim()}
            className="px-4 py-1.5 rounded-lg text-sm font-semibold text-white disabled:opacity-40 transition-opacity hover:opacity-90 flex-shrink-0"
            style={{ background: "#3B82F6" }}
          >
            Ask
          </button>
        </div>

        {/* Trust line */}
        <p className="mt-3" style={{ color: "#94A3B8", fontSize: 12 }}>
          Powered by AI · Always verify requirements with your local building department
        </p>
      </div>
    </section>
  );
}