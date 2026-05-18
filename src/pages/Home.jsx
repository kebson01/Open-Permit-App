import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import AIDrawer from "../components/ai/AIDrawer";
import { Plus, MapPin, ChevronRight, ShieldCheck, BookOpen, Calculator, Search, Sparkles } from "lucide-react";
import { useCities } from "@/hooks/useCities";
import WhatsNewBanner from "@/components/home/WhatsNewBanner";

const TOOLKIT = [
  { icon: ShieldCheck, title: "Exception Checker",   sub: "See if your project qualifies for a waiver", page: "ExemptionChecker" },
  { icon: BookOpen,    title: "Visual Permit Guide",  sub: "Interactive step-by-step documentation",    page: "PermitGuide" },
  { icon: Calculator,  title: "Fee Calculator",        sub: "Estimate city and county permit costs",     page: "FeeCalculator" },
  { icon: Search,      title: "Property Search",       sub: "Check historical permits by address",       page: "PropertyGuide" },
];

const STEPS = [
  { num: "1", title: "Identify",  body: "Enter your address and project details to see required filings.", dark: true },
  { num: "2", title: "Calculate", body: "Get a detailed breakdown of fees before you spend a dollar.", dark: false },
  { num: "3", title: "Compile",   body: "Generate custom checklists of required contractor licenses and plans.", dark: false },
];

const AI_CHIPS = [
  { label: "Do I need a fence permit?", icon: "🏗️" },
  { label: "Check my zoning", icon: "📍" },
  { label: "What permits for a pool?", icon: "🏊" },
  { label: "Solar panel requirements", icon: "☀️" },
];

export default function Home() {
  const { cities, loading: citiesLoading } = useCities();
  const [aiOpen, setAiOpen] = useState(false);
  const [aiInitialMessage, setAiInitialMessage] = useState("");
  const [jurisdiction, setJurisdiction] = useState("Fort Lauderdale");
  const [customQuestion, setCustomQuestion] = useState("");

  const handleAsk = (msg) => {
    setAiInitialMessage(msg);
    setAiOpen(true);
  };

  return (
    <div className="pb-24 md:pb-0" style={{ backgroundColor: "#f5f5f5", fontFamily: "'Public Sans', 'Segoe UI', system-ui, sans-serif" }}>

      {/* ── HERO ── */}
      <section className="relative flex items-end overflow-hidden" style={{ minHeight: "340px" }}>
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1400&q=80"
            alt="South Florida"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,21,77,0.65) 0%, rgba(0,21,77,0.75) 50%, rgba(0,21,77,0.97) 88%, #f5f5f5 100%)" }} />
        </div>

        <div className="relative z-10 w-full px-5 pt-20 pb-10 max-w-lg mx-auto md:max-w-2xl">
          <h1 className="font-extrabold leading-tight mb-3 text-white" style={{ fontSize: "clamp(28px, 8vw, 44px)", letterSpacing: "-0.01em" }}>
            Permits made simple for<br />South Florida
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.72)" }}>
            Navigate permits, estimate costs, and stay current with Florida's latest building laws.
          </p>
        </div>
      </section>

      {/* ── PROJECT LAUNCHPAD CARD ── */}
      <section className="px-5 max-w-lg mx-auto md:max-w-2xl -mt-4">
        <div className="rounded-2xl bg-white shadow-lg overflow-hidden border border-gray-100">
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#44464f" }}>Project Launchpad</span>
            <span className="text-lg">🚀</span>
          </div>

          {/* CTA button */}
          <div className="px-5 pt-4 pb-3">
            <Link
              to={`${createPageUrl("PermitGuide")}?city=${encodeURIComponent(jurisdiction)}`}
              className="w-full h-12 rounded-xl flex items-center justify-center gap-2 font-bold text-sm text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #025799 0%, #60A9DE 100%)" }}
            >
              Find Permits for Your Project
              <Plus className="w-4 h-4" />
            </Link>
          </div>

          {/* City selector */}
          <div className="px-5 pb-5">
            <div className="flex items-center gap-2 px-4 h-12 rounded-xl border" style={{ borderColor: "#e0e0e0", background: "#f7f7f7" }}>
              <MapPin className="w-4 h-4 shrink-0" style={{ color: "#60A9DE" }} />
              <span className="text-xs font-medium mr-1" style={{ color: "#666" }}>City / Municipality</span>
              <select
                value={jurisdiction}
                onChange={e => setJurisdiction(e.target.value)}
                className="flex-1 bg-transparent text-sm font-semibold focus:outline-none appearance-none"
                style={{ color: "#1a1c1e" }}
              >
                {citiesLoading ? <option>Loading...</option> : cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      </section>

      <WhatsNewBanner />

      {/* ── TOOLKIT LIST ── */}
      <section className="px-5 mt-8 max-w-lg mx-auto md:max-w-2xl">
        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-100">
          {TOOLKIT.map((item) => (
            <Link
              key={item.title}
              to={createPageUrl(item.page)}
              className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors active:bg-gray-100"
              style={{ textDecoration: "none" }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#EBF5FF" }}>
                <item.icon className="w-5 h-5" style={{ color: "#025799" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm" style={{ color: "#1a1c1e" }}>{item.title}</p>
                <p className="text-xs mt-0.5" style={{ color: "#757780" }}>{item.sub}</p>
              </div>
              <ChevronRight className="w-5 h-5 shrink-0" style={{ color: "#b0b0b0" }} />
            </Link>
          ))}
        </div>
      </section>

      {/* ── PROCESS WORKFLOW ── */}
      <section className="px-5 mt-14 max-w-lg mx-auto md:max-w-2xl">
        <h2 className="font-bold text-center mb-10" style={{ color: "#1a1c1e", fontSize: 22 }}>Process Workflow</h2>
        <div className="relative">
          {/* Connector line */}
          <div className="absolute left-1/2 -translate-x-1/2 top-7 bottom-7 w-px" style={{ background: "#d0d4dc" }} />
          <div className="space-y-10 relative">
            {STEPS.map((step) => (
              <div key={step.num} className="flex flex-col items-center text-center relative">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl text-white mb-4 shadow-md relative z-10"
                  style={{ background: step.dark ? "#022A5B" : "#025799" }}
                >
                  {step.num}
                </div>
                <h3 className="font-bold text-lg mb-1" style={{ color: "#1a1c1e" }}>{step.title}</h3>
                <p className="text-sm leading-relaxed max-w-[260px]" style={{ color: "#757780" }}>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI ASSISTANT ── */}
      <section className="px-5 mt-14 max-w-lg mx-auto md:max-w-2xl">
        <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: "#022A5B" }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#025799" }}>
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Intelligent Permit Support</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Ask me anything about local requirements</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {AI_CHIPS.map(chip => (
              <button
                key={chip.label}
                onClick={() => handleAsk(chip.label)}
                className="px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all hover:bg-white/20 active:scale-95"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)", color: "#fff" }}
              >
                <span>{chip.icon}</span>{chip.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <input
              type="text"
              value={customQuestion}
              onChange={e => setCustomQuestion(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && customQuestion.trim()) { handleAsk(customQuestion.trim()); setCustomQuestion(""); } }}
              placeholder="Type your question..."
              className="w-full h-12 pl-4 pr-12 rounded-xl text-sm focus:outline-none"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)", color: "#fff" }}
            />
            <button
              onClick={() => { if (customQuestion.trim()) { handleAsk(customQuestion.trim()); setCustomQuestion(""); } }}
              className="absolute right-2 top-1.5 h-9 w-9 rounded-lg flex items-center justify-center"
              style={{ background: "#025799" }}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="px-5 mt-10 mb-10 max-w-lg mx-auto md:max-w-2xl">
        <div className="rounded-2xl p-7 text-center shadow-lg relative overflow-hidden" style={{ background: "#022A5B" }}>
          <div className="absolute -left-8 -bottom-8 w-36 h-36 rounded-full blur-3xl" style={{ background: "rgba(0,88,190,0.25)" }} />
          <h3 className="font-bold text-white mb-2 relative" style={{ fontSize: 20 }}>Ready to start?</h3>
          <p className="mb-6 relative text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
            Simplifying permits for Broward and Miami-Dade counties.
          </p>
          <Link
            to={createPageUrl("PermitGuide")}
            className="block w-full h-12 rounded-xl flex items-center justify-center font-bold text-sm transition-all active:scale-95 relative"
            style={{ background: "#ffffff", color: "#022A5B" }}
          >
            Get Started Now
          </Link>
        </div>
      </section>

      <AIDrawer
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        currentPageName="Home"
        initialMessage={aiInitialMessage}
      />
    </div>
  );
}