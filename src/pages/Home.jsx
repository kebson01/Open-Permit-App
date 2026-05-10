import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import AIDrawer from "../components/ai/AIDrawer";
import { ArrowRight, ChevronRight, BookOpen, Calculator, Search, ClipboardList, Sparkles, MapPin, ChevronDown } from "lucide-react";
import { useCities } from "@/hooks/useCities";

const AI_CHIPS = [
  { label: "Do I need a fence permit?", icon: "🏗️" },
  { label: "Check my zoning", icon: "📍" },
  { label: "What permits for a pool?", icon: "🏊" },
  { label: "Solar panel requirements", icon: "☀️" },
];

const TOOLKIT = [
  { icon: BookOpen,     title: "Visual Permit Guide",  sub: "Browse residential requirements",    page: "PermitGuide" },
  { icon: Calculator,  title: "Fee Calculator",        sub: "Estimate municipal filing costs",    page: "FeeCalculator" },
  { icon: Search,      title: "Property Search",       sub: "Check zoning & permit history",      page: "PropertyGuide" },
  { icon: ClipboardList, title: "Document Checklist",  sub: "Generate required file list",        page: "PermitGuide" },
];

const STEPS = [
  { num: "1", color: "#00020c", title: "Identify",  body: "Enter your address and project details to see required filings." },
  { num: "2", color: "#0058be", title: "Calculate", body: "Get a detailed breakdown of fees before you spend a dollar." },
  { num: "3", color: "#2170e4", title: "Compile",   body: "Generate custom checklists of required contractor licenses and plans." },
];

export default function Home() {
  const { cities, loading: citiesLoading } = useCities();
  const [aiOpen, setAiOpen] = useState(false);
  const [aiInitialMessage, setAiInitialMessage] = useState("");
  const [jurisdiction, setJurisdiction] = useState("Fort Lauderdale");
  const [propertyType, setPropertyType] = useState("residential");
  const [customQuestion, setCustomQuestion] = useState("");

  const handleAsk = (msg) => {
    setAiInitialMessage(msg);
    setAiOpen(true);
  };

  return (
    <div style={{ backgroundColor: "#f9f9fc", fontFamily: "'Public Sans', 'Segoe UI', system-ui, sans-serif" }} className="pb-20 md:pb-0">

      {/* ── HERO ── */}
      <section className="relative min-h-[520px] flex items-end overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200&q=80"
            alt="South Florida Architecture"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,2,12,0.55) 0%, rgba(0,2,12,0.80) 60%, rgba(0,2,12,0.92) 100%)" }} />
        </div>

        <div className="relative z-10 w-full px-5 pt-14 pb-8 max-w-lg mx-auto md:max-w-2xl">
          <h1 className="font-bold leading-[1.1] mb-4" style={{ color: "#ffffff", fontSize: "clamp(28px, 6vw, 42px)" }}>
            Permits made simple<br />for South Florida
          </h1>
          <p className="mb-8 max-w-sm" style={{ color: "rgba(255,255,255,0.75)", fontSize: 15, lineHeight: 1.65 }}>
            Navigate zoning codes and building requirements with our intelligent assistant. Fast, transparent, and built for residents.
          </p>

          {/* Selector card */}
          <div className="rounded-2xl p-5 shadow-2xl" style={{ background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)" }}>
            <div className="mb-4">
              <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "#44464f" }}>Not sure what you need?</p>
              <Link
                to={`${createPageUrl("PermitGuide")}?city=${encodeURIComponent(jurisdiction)}&propertyType=${propertyType}`}
                className="w-full h-12 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm text-white hover:opacity-90 transition-opacity"
                style={{ background: "#00020c" }}
              >
                Find Permits for Your Project
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-[12px] mt-2 leading-snug" style={{ color: "#757780" }}>Answer a few questions to see which permits your project needs, what documents to prepare, and estimated costs.</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: "#e8e8ec" }}>
                <div className="flex items-center gap-1.5">
                  <span className="text-base">📋</span>
                  <span className="text-[11px] font-medium" style={{ color: "#44464f" }}>Permit Checklist</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base">📄</span>
                  <span className="text-[11px] font-medium" style={{ color: "#44464f" }}>Required Documents</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base">💰</span>
                  <span className="text-[11px] font-medium" style={{ color: "#44464f" }}>Fee Estimate</span>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#44464f" }}>City / Municipality</label>
              <div className="relative">
                <select
                  value={jurisdiction}
                  onChange={e => setJurisdiction(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border appearance-none text-sm focus:outline-none focus:ring-2"
                  style={{ borderColor: "#c5c6d0", background: "#f3f3f6", color: "#1a1c1e", focusRingColor: "#0058be" }}
                >
                  {citiesLoading ? <option>Loading...</option> : cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 pointer-events-none" style={{ color: "#44464f" }} />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#44464f" }}>Property Type</label>
              <div className="flex p-1 rounded-xl border" style={{ borderColor: "#c5c6d0", background: "#f3f3f6" }}>
                <button
                  onClick={() => setPropertyType("residential")}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    background: propertyType === "residential" ? "#ffffff" : "transparent",
                    color: propertyType === "residential" ? "#0058be" : "#44464f",
                    boxShadow: propertyType === "residential" ? "0 1px 4px rgba(0,0,0,0.12)" : "none",
                  }}
                >
                  Residential
                </button>
                <button
                  onClick={() => setPropertyType("commercial")}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    background: propertyType === "commercial" ? "#ffffff" : "transparent",
                    color: propertyType === "commercial" ? "#0058be" : "#44464f",
                    boxShadow: propertyType === "commercial" ? "0 1px 4px rgba(0,0,0,0.12)" : "none",
                  }}
                >
                  Commercial
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── AI ASSISTANT ── */}
      <section className="px-5 mt-10 max-w-lg mx-auto md:max-w-2xl">
        <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: "#001a48", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="absolute -right-4 -top-4 w-32 h-32 rounded-full blur-3xl" style={{ background: "rgba(0,88,190,0.3)" }} />

          <div className="flex items-center gap-3 mb-5 relative">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#0058be" }}>
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white" style={{ fontSize: 17 }}>Intelligent Permit Support</h3>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>Ask me anything about local requirements</p>
            </div>
          </div>

          {/* Chips */}
          <div className="flex flex-wrap gap-2 mb-5 relative">
            {AI_CHIPS.map(chip => (
              <button
                key={chip.label}
                onClick={() => handleAsk(chip.label)}
                className="px-3 py-2 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all hover:bg-white/20"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)", color: "#fff" }}
              >
                <span>{chip.icon}</span>
                {chip.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="relative">
            <input
              type="text"
              value={customQuestion}
              onChange={e => setCustomQuestion(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && customQuestion.trim()) { handleAsk(customQuestion.trim()); setCustomQuestion(""); } }}
              placeholder="Type your question..."
              className="w-full h-14 pl-4 pr-14 rounded-xl text-sm focus:outline-none"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)", color: "#fff" }}
            />
            <button
              onClick={() => { if (customQuestion.trim()) { handleAsk(customQuestion.trim()); setCustomQuestion(""); } }}
              className="absolute right-2 top-2 h-10 w-10 rounded-lg flex items-center justify-center transition-transform active:scale-90"
              style={{ background: "#0058be" }}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </section>

      {/* ── PROFESSIONAL TOOLKIT ── */}
      <section className="px-5 mt-14 max-w-lg mx-auto md:max-w-2xl">
        <div className="flex items-center justify-between mb-5">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#44464f" }}>Professional Toolkit</p>
          <Link to={createPageUrl("PermitGuide")} className="text-sm font-semibold" style={{ color: "#0058be" }}>View All</Link>
        </div>

        <div className="space-y-3">
          {TOOLKIT.map(item => (
            <Link
              key={item.title}
              to={createPageUrl(item.page)}
              className="flex items-center gap-4 p-5 rounded-2xl border shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
              style={{ background: "#ffffff", borderColor: "#c5c6d0", textDecoration: "none" }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(0,88,190,0.1)" }}>
                <item.icon className="w-5 h-5" style={{ color: "#0058be" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm" style={{ color: "#1a1c1e" }}>{item.title}</p>
                <p className="text-xs mt-0.5" style={{ color: "#44464f" }}>{item.sub}</p>
              </div>
              <ChevronRight className="w-5 h-5 shrink-0" style={{ color: "#757780" }} />
            </Link>
          ))}
        </div>
      </section>

      {/* ── PROCESS WORKFLOW ── */}
      <section className="px-5 mt-16 max-w-lg mx-auto md:max-w-2xl">
        <h2 className="font-bold text-center mb-10" style={{ color: "#00020c", fontSize: 24 }}>Process Workflow</h2>
        <div className="space-y-12">
          {STEPS.map(step => (
            <div key={step.num} className="flex flex-col items-center text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl text-white mb-4 shadow-lg"
                style={{ background: step.color }}
              >
                {step.num}
              </div>
              <h3 className="font-bold mb-2" style={{ color: "#1a1c1e", fontSize: 20 }}>{step.title}</h3>
              <p className="max-w-[280px] text-sm leading-relaxed" style={{ color: "#44464f" }}>{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="px-5 mt-16 mb-12 max-w-lg mx-auto md:max-w-2xl">
        <div className="rounded-3xl p-8 text-center shadow-xl relative overflow-hidden" style={{ background: "#00020c" }}>
          <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full blur-3xl" style={{ background: "rgba(0,88,190,0.2)" }} />
          <h3 className="font-bold text-white mb-3 relative" style={{ fontSize: 22 }}>Ready to start?</h3>
          <p className="mb-8 relative text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
            Streamlining permits for Broward and Miami-Dade counties.
          </p>
          <Link
            to={createPageUrl("PermitGuide")}
            className="block w-full h-14 rounded-xl flex items-center justify-center font-bold text-sm transition-transform active:scale-95 shadow-md relative"
            style={{ background: "#ffffff", color: "#00020c" }}
          >
            Get Started Now
          </Link>
        </div>
      </section>

      {/* AI Drawer */}
      <AIDrawer
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        currentPageName="Home"
        initialMessage={aiInitialMessage}
      />
    </div>
  );
}