import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Building2, Map, Calculator, Menu, X, MessageCircle, Send, Settings, LayoutDashboard } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

const navLinks = [
  { name: "Home", page: "Home", icon: Building2 },
  { name: "Property Guide", page: "PropertyGuide", icon: Map },
  { name: "Visual Permit Guide", page: "PermitGuide", icon: Map },
  { name: "Fee Calculator", page: "FeeCalculator", icon: Calculator },
];

// Role-based nav links added dynamically below

function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! I'm your permitting assistant. Ask me anything about building permits, fees, or requirements across South Florida cities." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const conversationContext = messages.slice(-6).map(m => `${m.role}: ${m.content}`).join("\n");
    
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert building permit assistant for South Florida cities (Weston, Coral Springs, Fort Lauderdale, Hollywood, Cooper City) in Broward County, Florida. You help people understand permit requirements, fees, and processes.

Previous conversation:
${conversationContext}

User question: ${input}

Provide a helpful, concise answer. If you don't know specific city details, suggest they check the fee calculator or contact the local building department.`,
    });
    
    setMessages(prev => [...prev, { role: "assistant", content: response }]);
    setLoading(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full gradient-primary text-white shadow-xl flex items-center justify-center hover:scale-105 transition-transform"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-48px)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden" style={{ height: 480 }}>
          <div className="gradient-primary px-5 py-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Permit Assistant</p>
              <p className="text-blue-200 text-xs">Ask about permits, fees & more</p>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user" 
                    ? "bg-[#2c5282] text-white rounded-br-md" 
                    : "bg-white text-gray-700 shadow-sm border border-gray-100 rounded-bl-md"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-sm border border-gray-100">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="p-3 border-t bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Ask about permits..."
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="w-10 h-10 rounded-xl gradient-primary text-white flex items-center justify-center disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function Layout({ children, currentPageName }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [navVisible, setNavVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY < 10) {
        setNavVisible(true);
      } else if (currentY > lastScrollY.current) {
        setNavVisible(false);
        setMobileOpen(false);
      } else {
        setNavVisible(true);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const adminLinks = currentUser?.role === "admin"
    ? [{ name: "City Manager", page: "AdminCityManager", icon: Settings }]
    : currentUser?.role === "city_admin"
    ? [
        { name: "City Settings", page: "AdminCityManager", icon: Settings },
        { name: "My City Portal", page: "CityPortal", icon: LayoutDashboard }
      ]
    : [];

  const isCityPortal = currentPageName === "CityPortalPublic";

  if (isCityPortal) {
    return <>{children}</>;
  }

  const allLinks = [...navLinks, ...adminLinks];

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 shadow-lg transition-transform duration-300" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)", transform: navVisible ? "translateY(0)" : "translateY(-100%)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link to="/" className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-400" />
              <span className="text-white font-bold text-sm sm:text-base hidden xs:block">Saint's Permits</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {allLinks.map(link => (
                <Link
                  key={link.page}
                  to={createPageUrl(link.page)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    currentPageName === link.page
                      ? "bg-white/20 text-white"
                      : "text-blue-100 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <link.icon className="w-4 h-4" />
                  {link.name}
                </Link>
              ))}
            </div>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden text-white p-2 rounded-lg hover:bg-white/10"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-white/10" style={{ backgroundColor: "rgba(15,23,42,0.98)" }}>
            {allLinks.map(link => (
              <Link
                key={link.page}
                to={createPageUrl(link.page)}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-5 py-4 text-sm font-medium border-b border-white/5 ${
                  currentPageName === link.page
                    ? "bg-white/15 text-white"
                    : "text-blue-100"
                }`}
              >
                <link.icon className="w-4 h-4" />
                {link.name}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Bottom nav for mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 flex">
        {navLinks.slice(0, 4).map(link => (
          <Link
            key={link.page}
            to={createPageUrl(link.page)}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors ${
              currentPageName === link.page ? "text-blue-600" : "text-gray-500"
            }`}
          >
            <link.icon className={`w-5 h-5 ${currentPageName === link.page ? "text-blue-600" : "text-gray-400"}`} />
            <span className="truncate text-[10px]">{link.name}</span>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <footer className="gradient-navy text-gray-400 py-8 pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Building2 className="w-5 h-5 text-blue-400" />
            <span className="text-white font-semibold">Saint's Permitting System</span>
          </div>
          <p className="text-sm">© {new Date().getFullYear()} Saint's Interactive Permitting System. All rights reserved.</p>
          <p className="text-xs mt-1 text-gray-500">Supporting Broward County municipalities</p>
        </div>
      </footer>

      {/* Chatbot */}
      <Chatbot />
    </div>
  );
}