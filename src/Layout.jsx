import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Building2, Menu, X, MessageCircle, Send, Settings, LayoutDashboard, ClipboardList, ChevronDown } from "lucide-react";
import NotificationBell from "@/components/projects/NotificationBell";
import { base44 } from "@/api/base44Client";

const centerNavLinks = [
  { name: "Plan a Permit", page: "PermitGuide" },
  { name: "Estimate Costs", page: "FeeCalculator" },
  { name: "Search Property", page: "PropertyGuide" },
];

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
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full text-white shadow-xl flex items-center justify-center hover:scale-105 transition-transform"
        style={{ background: "linear-gradient(135deg, #0D2B5E 0%, #0F3575 100%)" }}
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-48px)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden" style={{ height: 480 }}>
          <div className="px-5 py-4 flex items-center gap-3" style={{ background: "linear-gradient(135deg, #0D2B5E 0%, #0F3575 100%)" }}>
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
                    ? "bg-[#0F3575] text-white rounded-br-md" 
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
                className="w-10 h-10 rounded-xl text-white flex items-center justify-center disabled:opacity-50 hover:opacity-90 transition-opacity"
                style={{ background: "#3B82F6" }}
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
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [navVisible, setNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  const dropdownRef = useRef(null);

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
        setAccountDropdownOpen(false);
      } else {
        setNavVisible(true);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setAccountDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isAdmin = currentUser?.role === "admin";
  const isCityAdmin = currentUser?.role === "city_admin";

  const adminDropdownLinks = isAdmin
    ? [
        { name: "City Manager", page: "AdminCityManager", icon: Settings },
        { name: "Permit Records", page: "AdminPermitRecords", icon: ClipboardList },
      ]
    : isCityAdmin
    ? [
        { name: "City Settings", page: "AdminCityManager", icon: Settings },
        { name: "My City Portal", page: "CityPortal", icon: LayoutDashboard },
      ]
    : [];

  const mobileLinks = [
    ...centerNavLinks,
    ...(currentUser ? [{ name: "My Projects", page: "ProjectDashboard" }] : []),
    ...adminDropdownLinks,
  ];

  const isCityPortal = currentPageName === "CityPortalPublic";

  if (isCityPortal) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      {/* Navbar */}
      <nav
        className="sticky top-0 z-40 shadow-md transition-transform duration-300"
        style={{ backgroundColor: "#0D2B5E", transform: navVisible ? "translateY(0)" : "translateY(-100%)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">

            {/* LEFT — Brand */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <Building2 className="w-5 h-5 text-blue-400" />
              <span className="text-white font-semibold text-base">OpenPermit</span>
            </Link>

            {/* CENTER — Primary nav (desktop) */}
            <div className="hidden md:flex items-center gap-8">
              {centerNavLinks.map(link => {
                const isActive = currentPageName === link.page;
                return (
                  <Link
                    key={link.page}
                    to={createPageUrl(link.page)}
                    className={`text-sm font-medium transition-colors pb-0.5 ${
                      isActive
                        ? "text-white border-b-2 border-blue-400"
                        : "text-blue-100/80 hover:text-white border-b-2 border-transparent"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>

            {/* RIGHT — User actions (desktop) */}
            <div className="hidden md:flex items-center gap-4">
              {currentUser && (
                <Link
                  to={createPageUrl("ProjectDashboard")}
                  className={`text-sm font-medium transition-colors pb-0.5 ${
                    currentPageName === "ProjectDashboard"
                      ? "text-white border-b-2 border-blue-400"
                      : "text-blue-100/80 hover:text-white border-b-2 border-transparent"
                  }`}
                >
                  My Projects
                </Link>
              )}

              {currentUser && (
                <NotificationBell currentUser={currentUser} />
              )}

              {currentUser ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setAccountDropdownOpen(prev => !prev)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-white/30 text-white text-sm font-medium hover:bg-white/10 transition-colors"
                  >
                    My Account
                    {(isAdmin || isCityAdmin) && <ChevronDown className="w-3.5 h-3.5 opacity-70" />}
                  </button>

                  {accountDropdownOpen && (isAdmin || isCityAdmin) && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 overflow-hidden">
                      {adminDropdownLinks.map(link => (
                        <Link
                          key={link.page}
                          to={createPageUrl(link.page)}
                          onClick={() => setAccountDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <link.icon className="w-4 h-4 text-gray-400" />
                          {link.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => base44.auth.redirectToLogin(window.location.href)}
                  className="px-3 py-1.5 rounded-md border border-white/30 text-white text-sm font-medium hover:bg-white/10 transition-colors"
                >
                  Log In
                </button>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden text-white p-2 rounded-lg hover:bg-white/10"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-white/10" style={{ backgroundColor: "rgba(13,43,94,0.98)" }}>
            {mobileLinks.map(link => (
              <Link
                key={link.page}
                to={createPageUrl(link.page)}
                onClick={() => setMobileOpen(false)}
                className={`block px-5 py-3.5 text-sm font-medium border-b border-white/5 transition-colors ${
                  currentPageName === link.page ? "text-white bg-white/10" : "text-blue-100 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.name}
              </Link>
            ))}
            {!currentUser && (
              <button
                onClick={() => { base44.auth.redirectToLogin(window.location.href); setMobileOpen(false); }}
                className="block w-full text-left px-5 py-3.5 text-sm font-medium text-blue-100 hover:text-white hover:bg-white/5"
              >
                Log In
              </button>
            )}
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Bottom nav for mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 flex">
        {centerNavLinks.map(link => (
          <Link
            key={link.page}
            to={createPageUrl(link.page)}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 text-xs font-medium transition-colors ${
              currentPageName === link.page ? "text-blue-600" : "text-gray-500"
            }`}
          >
            <span className="truncate text-[11px]">{link.name}</span>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <footer className="py-8 pb-20 md:pb-8" style={{ backgroundColor: "#0D2B5E", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-blue-400" />
              <span className="text-white font-bold text-sm">OpenPermit</span>
            </div>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Making permits simple for South Florida homeowners and contractors.</p>
          </div>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>© 2026 OpenPermit. All rights reserved.</p>
        </div>
      </footer>

      {/* Chatbot */}
      <Chatbot />
    </div>
  );
}