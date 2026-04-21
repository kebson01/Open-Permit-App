import React, { useState } from "react";
import { Sparkles } from "lucide-react";
import AIDrawer from "./AIDrawer";

export default function FloatingAIButton({ currentPageName }) {
  const [open, setOpen] = useState(false);
  const [initialMessage, setInitialMessage] = useState("");

  const handleOpen = (msg = "") => {
    setInitialMessage(msg);
    setOpen(true);
  };

  return (
    <>
      <style>{`
        @keyframes ai-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.5); }
          50% { box-shadow: 0 0 0 10px rgba(59,130,246,0); }
        }
        .ai-pulse {
          animation: ai-pulse 3s ease-in-out infinite;
        }
        .ai-fab:hover .ai-label {
          opacity: 1;
          transform: translateX(0);
        }
        .ai-label {
          opacity: 0;
          transform: translateX(4px);
          transition: opacity 0.2s ease, transform 0.2s ease;
          pointer-events: none;
        }
      `}</style>

      {/* Floating button */}
      <div className="fixed z-50 flex items-center gap-2" style={{ bottom: 88, right: 24 }}>
        <div className="ai-label absolute right-full mr-3 whitespace-nowrap">
          <span className="text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg" style={{ background: "#3B82F6" }}>
            Ask AI
          </span>
        </div>
        <button
          onClick={() => handleOpen()}
          className="ai-fab ai-pulse w-14 h-14 md:w-14 md:h-14 rounded-full text-white shadow-xl flex items-center justify-center hover:scale-105 transition-transform relative"
          style={{ background: "#3B82F6", width: 56, height: 56 }}
          aria-label="Open AI Assistant"
        >
          <Sparkles className="w-6 h-6" />
        </button>
      </div>

      <AIDrawer
        open={open}
        onClose={() => setOpen(false)}
        currentPageName={currentPageName}
        initialMessage={initialMessage}
      />
    </>
  );
}

// Export a hook so the Home page hero can trigger the drawer
export { FloatingAIButton };