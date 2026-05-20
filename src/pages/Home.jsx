import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import AIDrawer from "../components/ai/AIDrawer";
import { ChevronRight, MapPin, ExternalLink, Send, ShieldCheck, BookOpen, Calculator, Search, Home as HomeIcon, Layers, Timer, Wrench } from "lucide-react";
import { useCities } from "@/hooks/useCities";

const LAW_CARDS = [
  {
    icon: ShieldCheck,
    title: "HB 837 - Permit Exemptions",
    body: "Projects under $2,500 for single-family homes may no longer require a permit (Effective July 1, 2024).",
  },
  {
    icon: Layers,
    title: "Roof Partial Repair Rule",
    body: "Only the damaged portion may need repair if the rest of the roof meets 2023 FBC re-roofing rules.",
  },
  {
    icon: Wrench,
    title: "Private Providers (HB 635)",
    body: "Homeowners can use licensed private providers to speed up plan reviews to 10–15 business days.",
  },
  {
    icon: Timer,
    title: "Permit Expiration - 180 Days",
    body: "Permits must remain active. No inspections within 180 days may result in expiration and new fees.",
  },
];

const TOOLS = [
  { icon: ShieldCheck, title: "Exception Checker",  sub: "See if your project qualifies for a waiver",      page: "ExemptionChecker" },
  { icon: BookOpen,   title: "Visual Permit Guide",  sub: "Interactive step-by-step documentation",          page: "PermitGuide" },
  { icon: Calculator, title: "Fee Calculator",        sub: "Estimate city and county permit costs",           page: "FeeCalculator" },
  { icon: Search,     title: "Property Search",       sub: "Check historical permits by address",             page: "PropertyGuide" },
];

const STEPS = [
  { num: "1", title: "Identify",   body: "Pinpoint your address and project details to see required filings and specific municipal codes." },
  { num: "2", title: "Calculate",  body: "Get a detailed breakdown of all fees and estimated processing times before you spend a dollar." },
  { num: "3", title: "Compile",    body: "Generate custom checklists of required contractor licenses, insurance forms, and site plans." },
];

const AI_CHIPS = [
  "Do I need a fence permit?",
  "Check my zoning",
  "Solar panel requirements",
  "What permits for a pool?",
];

export default function Home() {
  const { cities, loading: citiesLoading } = useCities();
  const [jurisdiction, setJurisdiction] = useState("");
  const [aiOpen, setAiOpen] = useState(false);
  const [aiInitialMessage, setAiInitialMessage] = useState("");
  const [question, setQuestion] = useState("");

  const handleAsk = (msg) => {
    setAiInitialMessage(msg);
    setAiOpen(true);
  };

  const heroSearch = () => {
    const city = jurisdiction || (cities[0]?.name ?? "");
    window.location.href = createPageUrl("PermitGuide") + (city ? `?city=${encodeURIComponent(city)}` : "");
  };

  return (
    <div className="pb-24 md:pb-0 bg-[#f8f9ff]" style={{ fontFamily: "'Manrope', 'Segoe UI', system-ui, sans-serif" }}>

      {/* ── HERO ── */}
      <section className="relative flex items-center justify-center overflow-hidden" style={{ minHeight: 320 }}>
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1400&q=80"
            alt="City skyline"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, rgba(0,42,91,0.82) 0%, rgba(0,74,150,0.78) 100%)" }} />
        </div>
        <div className="relative z-10 w-full max-w-2xl mx-auto px-5 py-16 text-center">
          <h1 className="font-extrabold text-white mb-3 leading-tight" style={{ fontSize: "clamp(26px,6vw,42px)", letterSpacing: "-0.01em" }}>
            Permits made simple &amp; stress-free
          </h1>
          <p className="text-sm mb-8" style={{ color: "rgba(255,255,255,0.7)" }}>
            Navigate building codes, estimate costs, and track your project with confidence and ease.
          </p>
          {/* Search bar */}
          <div className="flex items-center bg-white rounded-full shadow-2xl overflow-hidden max-w-lg mx-auto border border-white/20">
            <div className="flex items-center gap-2 flex-1 px-5 py-1 min-w-0">
              <MapPin className="w-4 h-4 shrink-0 text-[#025799]" />
              <select
                value={jurisdiction}
                onChange={e => setJurisdiction(e.target.value)}
                className="flex-1 bg-transparent text-sm text-gray-600 focus:outline-none appearance-none cursor-pointer py-2 min-w-0"
              >
                <option value="">City / Municipality (e.g. Fort Lauderdale)</option>
                {!citiesLoading && cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <button
              onClick={heroSearch}
              className="shrink-0 flex items-center gap-1.5 px-5 py-3.5 text-white text-sm font-bold transition-opacity hover:opacity-90 rounded-full m-1"
              style={{ background: "#025799" }}
            >
              Find Permits For Your Project
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── FLORIDA LAW CHANGES BANNER ── */}
      <section className="px-4 pt-6 max-w-4xl mx-auto">
        <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm">
          {/* Banner header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100" style={{ background: "#022A5B" }}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white border border-white/30" style={{ background: "rgba(255,255,255,0.12)" }}>NEW</span>
              <span className="text-sm font-bold text-white">2023–2024 Florida Law Changes</span>
            </div>
            <Link to={createPageUrl("ExemptionChecker")}
              className="flex items-center gap-1.5 text-xs text-blue-200 hover:text-white transition-colors">
              <ExternalLink className="w-3 h-3" /> Check your project eligibility
            </Link>
          </div>
          {/* 4 cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
            {LAW_CARDS.map(card => (
              <div key={card.title} className="px-5 py-4 hover:bg-[#f0f6ff] transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <card.icon className="w-4 h-4 text-[#025799] shrink-0" />
                  <p className="text-xs font-bold text-[#025799] leading-tight">{card.title}</p>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ESSENTIAL PLANNING TOOLS ── */}
      <section className="px-4 mt-10 max-w-4xl mx-auto">
        <h2 className="font-extrabold text-center text-gray-900 mb-6" style={{ fontSize: 22 }}>Essential Planning Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TOOLS.map(tool => (
            <Link
              key={tool.title}
              to={createPageUrl(tool.page)}
              className="flex flex-col items-start gap-3 bg-white border border-gray-200 rounded-2xl px-5 py-5 hover:shadow-md hover:border-blue-200 transition-all group"
              style={{ textDecoration: "none" }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#EBF5FF" }}>
                <tool.icon className="w-5 h-5 text-[#025799]" />
              </div>
              <div>
                <p className="font-bold text-sm text-gray-900 mb-0.5">{tool.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{tool.sub}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#025799] transition-colors mt-auto" />
            </Link>
          ))}
        </div>
      </section>

      {/* ── YOUR PATH TO APPROVAL ── */}
      <section className="px-4 mt-14 max-w-4xl mx-auto">
        <h2 className="font-extrabold text-center text-gray-900 mb-10" style={{ fontSize: 22 }}>Your Path to Approval</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Connector line (desktop only) */}
          <div className="hidden md:block absolute top-7 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px" style={{ background: "linear-gradient(90deg,#d0d4dc,#d0d4dc)" }} />
          {STEPS.map((step, i) => (
            <div key={step.num} className="flex flex-col items-center text-center">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center font-extrabold text-xl text-white mb-4 shadow-lg relative z-10"
                style={{ background: i === 0 ? "#022A5B" : "#025799" }}
              >
                {step.num}
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed max-w-[220px]">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── AI ASSISTANT ── */}
      <section className="px-4 mt-14 max-w-4xl mx-auto">
        <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: "#022A5B" }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#025799" }}>
              <span className="text-lg">🤖</span>
            </div>
            <div>
              <p className="font-bold text-white text-sm">Intelligent Permit Support</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Ask anything about local requirements</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {AI_CHIPS.map(chip => (
              <button
                key={chip}
                onClick={() => handleAsk(chip)}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:bg-white/20 active:scale-95"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)", color: "#fff" }}
              >
                {chip}
              </button>
            ))}
          </div>
          <div className="relative">
            <input
              type="text"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && question.trim()) { handleAsk(question.trim()); setQuestion(""); } }}
              placeholder="Type your questions here..."
              className="w-full h-12 pl-4 pr-14 rounded-xl text-sm focus:outline-none"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)", color: "#fff" }}
            />
            <button
              onClick={() => { if (question.trim()) { handleAsk(question.trim()); setQuestion(""); } }}
              className="absolute right-2 top-1.5 h-9 w-9 rounded-lg flex items-center justify-center transition-opacity hover:opacity-80"
              style={{ background: "#025799" }}
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </section>

      {/* ── READY TO START CTA ── */}
      <section className="px-4 mt-10 mb-12 max-w-4xl mx-auto">
        <div className="rounded-2xl p-10 text-center relative overflow-hidden" style={{ background: "#025799" }}>
          <div className="absolute -left-10 -bottom-10 w-48 h-48 rounded-full blur-3xl" style={{ background: "rgba(0,40,120,0.4)" }} />
          <div className="relative z-10">
            <h2 className="font-extrabold text-white mb-2" style={{ fontSize: 24 }}>Ready to start?</h2>
            <p className="text-sm mb-7" style={{ color: "rgba(255,255,255,0.65)" }}>
              Simplifying permits for Broward and Miami-Dade counties.
            </p>
            <Link
              to={createPageUrl("PermitGuide")}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-95"
              style={{ background: "#ffffff", color: "#022A5B" }}
            >
              Get Started Now
            </Link>
          </div>
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