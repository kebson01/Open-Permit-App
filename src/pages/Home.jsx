import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import AIDrawer from "../components/ai/AIDrawer";
import {
  ChevronRight, MapPin, Send, ShieldCheck, BookOpen,
  Calculator, Search, Layers, Timer, Wrench, Zap, ExternalLink
} from "lucide-react";
import { useCities } from "@/hooks/useCities";

const LAW_CARDS = [
  { emoji: "✓", title: "HB 837 – Permit Exemptions", body: "Projects under $2,500 for single-family homes may no longer require a permit (Effective July 1, 2024)." },
  { emoji: "🏠", title: "Roof Partial Repair Rule", body: "Only the damaged portion may need repair if the rest of the roof meets 2023 FBC re-roofing rules." },
  { emoji: "👤", title: "Private Providers (HB 635)", body: "Homeowners can use licensed private providers to speed up plan reviews to 10–15 business days." },
  { emoji: "⏱", title: "Permit Expiration – 180 Days", body: "Permits must remain active. No inspections within 180 days may result in expiration and new fees." },
];

const TOOLS = [
  { icon: ShieldCheck, title: "Exception Checker",  sub: "See if your project qualifies for a waiver",  page: "ExemptionChecker" },
  { icon: BookOpen,    title: "Visual Permit Guide", sub: "Interactive step-by-step documentation",      page: "PermitGuide" },
  { icon: Calculator,  title: "Fee Calculator",      sub: "Estimate city and county permit costs",       page: "FeeCalculator" },
  { icon: Search,      title: "Property Search",     sub: "Check historical permits by address",         page: "PropertyGuide" },
];

const STEPS = [
  { num: "1", title: "Identify",  body: "Pinpoint your address and project details to see required filings and specific municipal codes." },
  { num: "2", title: "Calculate", body: "Get a detailed breakdown of all fees and estimated processing times before you spend a dollar." },
  { num: "3", title: "Compile",   body: "Generate custom checklists of required contractor licenses, insurance forms, and site plans." },
];

const AI_CHIPS = [
  "Do I need a fence permit?",
  "Check my zoning",
  "Solar panel requirements",
  "What permits for a pool?",
];

const PRIMARY = "#004ac6";
const FONTS = { headline: "'Manrope', system-ui, sans-serif", body: "'Plus Jakarta Sans', system-ui, sans-serif" };

// Fade-in on scroll
function useFadeIn() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

function FadeSection({ children, className = "", style = {} }) {
  const [ref, visible] = useFadeIn();
  return (
    <div ref={ref} className={className} style={{ transition: "opacity 600ms ease, transform 600ms ease", opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(14px)", ...style }}>
      {children}
    </div>
  );
}

export default function Home() {
  const { cities, loading: citiesLoading } = useCities();
  const [jurisdiction, setJurisdiction] = useState("");
  const [aiOpen, setAiOpen] = useState(false);
  const [aiInitialMessage, setAiInitialMessage] = useState("");
  const [question, setQuestion] = useState("");

  const handleAsk = (msg) => { setAiInitialMessage(msg); setAiOpen(true); };
  const heroSearch = () => {
    const city = jurisdiction || (cities[0]?.name ?? "");
    window.location.href = createPageUrl("PermitGuide") + (city ? `?city=${encodeURIComponent(city)}` : "");
  };

  return (
    <div style={{ background: "#f5f7ff", fontFamily: FONTS.body, color: "#0d1c2e" }} className="pb-20 md:pb-0">

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative flex items-center justify-center overflow-hidden" style={{ minHeight: 300 }}>
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1600&q=80"
            alt="City"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, rgba(0,42,91,0.82) 0%, rgba(0,74,198,0.78) 100%)" }} />
        </div>
        <div className="relative z-10 w-full max-w-2xl mx-auto px-5 py-16 text-center">
          <h1
            className="font-extrabold text-white mb-3 leading-tight"
            style={{ fontFamily: FONTS.headline, fontSize: "clamp(26px,5vw,40px)", letterSpacing: "-0.02em" }}
          >
            Permits made simple &amp; stress-free
          </h1>
          <p className="mb-8 text-sm" style={{ color: "rgba(255,255,255,0.78)", fontFamily: FONTS.body, lineHeight: 1.6 }}>
            Navigate building codes, estimate costs, and track your project with confidence and ease.
          </p>

          {/* Search bar — matches screenshot exactly */}
          <div
            className="flex items-center overflow-hidden mx-auto"
            style={{
              maxWidth: 560,
              background: "#fff",
              borderRadius: 10,
              boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
            }}
          >
            <div className="flex items-center gap-2 flex-1 px-4 py-1 min-w-0">
              <MapPin className="w-4 h-4 shrink-0" style={{ color: "#9ca3af" }} />
              <select
                value={jurisdiction}
                onChange={e => setJurisdiction(e.target.value)}
                className="flex-1 bg-transparent text-sm focus:outline-none appearance-none cursor-pointer py-2.5 min-w-0"
                style={{ color: jurisdiction ? "#0d1c2e" : "#9ca3af", fontFamily: FONTS.body }}
              >
                <option value="">City / Municipality (e.g. For...</option>
                {!citiesLoading && cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <button
              onClick={heroSearch}
              className="shrink-0 flex items-center gap-1.5 m-1 px-4 py-2.5 text-white text-sm font-bold transition-opacity hover:opacity-90 active:scale-[0.98]"
              style={{ background: PRIMARY, borderRadius: 7, fontFamily: FONTS.headline, whiteSpace: "nowrap" }}
            >
              Find Permits For You Project
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* ── FLORIDA LAW CHANGES ──────────────────────────────────────── */}
      <FadeSection className="px-4 pt-5 max-w-5xl mx-auto">
        <div style={{ background: "#1e2d4a", borderRadius: 10, overflow: "hidden" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: "#006a61", color: "#fff", fontFamily: FONTS.headline }}>
                ⬛
              </span>
              <span className="text-sm font-bold text-white" style={{ fontFamily: FONTS.headline }}>2023–2024 Florida Law Changes</span>
            </div>
            <Link to={createPageUrl("ExemptionChecker")} className="flex items-center gap-1 text-xs hover:opacity-80 transition-opacity" style={{ color: "#93c5fd", fontFamily: FONTS.body }}>
              <ExternalLink className="w-3 h-3" /> Check your project eligibility
            </Link>
          </div>
          {/* 4 cards grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4">
            {LAW_CARDS.map((card, i) => (
              <div
                key={card.title}
                className="px-4 py-4"
                style={{ borderRight: i < 3 ? "1px solid rgba(255,255,255,0.06)" : "none", borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none" }}
              >
                <p className="text-xs font-bold mb-1.5 leading-tight" style={{ color: "#93c5fd", fontFamily: FONTS.headline }}>{card.emoji} {card.title}</p>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.55)", fontFamily: FONTS.body }}>{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </FadeSection>

      {/* ── ESSENTIAL PLANNING TOOLS ─────────────────────────────────── */}
      <FadeSection className="px-4 mt-14 max-w-5xl mx-auto">
        <h2 className="text-center font-extrabold mb-7" style={{ fontFamily: FONTS.headline, fontSize: 26, color: "#0d1c2e" }}>
          Essential Planning Tools
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {TOOLS.map(tool => (
            <Link
              key={tool.title}
              to={createPageUrl(tool.page)}
              className="flex flex-col items-start gap-3 p-4 transition-all"
              style={{ background: "#fff", borderRadius: 10, boxShadow: "0 1px 8px rgba(0,0,0,0.06)", textDecoration: "none", border: "1px solid #e8eaf0" }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,74,198,0.12)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 8px rgba(0,0,0,0.06)"}
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "#eff4ff" }}>
                <tool.icon className="w-4.5 h-4.5 w-[18px] h-[18px]" style={{ color: PRIMARY }} />
              </div>
              <div>
                <p className="font-bold text-sm mb-0.5" style={{ fontFamily: FONTS.headline, color: "#0d1c2e" }}>{tool.title}</p>
                <p className="text-xs leading-relaxed" style={{ color: "#6b7280", fontFamily: FONTS.body }}>{tool.sub}</p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 mt-auto" style={{ color: "#c3c6d7" }} />
            </Link>
          ))}
        </div>
      </FadeSection>

      {/* ── CITY COVERAGE ────────────────────────────────────────────── */}
      <FadeSection className="px-4 mt-14 max-w-5xl mx-auto">
        <h2 className="text-center font-extrabold mb-2" style={{ fontFamily: FONTS.headline, fontSize: 22, color: "#0d1c2e" }}>
          Coverage by City
        </h2>
        <p className="text-center text-xs mb-6" style={{ color: "#6b7280", fontFamily: FONTS.body }}>
          Guided applications available for all 6 cities. Weston also includes full historical permit records.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { name: "Weston",          badge: "Full Coverage",  badgeCls: "bg-green-100 text-green-700 border-green-200",  detail: "115,959 permit records + guided application" },
            { name: "Hollywood",       badge: "Guided",         badgeCls: "bg-teal-100 text-teal-700 border-teal-200",     detail: "✓ Guided application — 11 permit types" },
            { name: "Coral Springs",   badge: "Guided",         badgeCls: "bg-teal-100 text-teal-700 border-teal-200",     detail: "✓ Guided application — 11 permit types" },
            { name: "Cooper City",     badge: "Guided",         badgeCls: "bg-teal-100 text-teal-700 border-teal-200",     detail: "✓ Guided application — 11 permit types" },
            { name: "Fort Lauderdale", badge: "Guided",         badgeCls: "bg-teal-100 text-teal-700 border-teal-200",     detail: "✓ Guided application — 11 permit types (via LauderBuild)" },
            { name: "Sunrise",         badge: "Guided",         badgeCls: "bg-teal-100 text-teal-700 border-teal-200",     detail: "✓ Guided application — 11 permit types" },
          ].map(city => (
            <Link
              key={city.name}
              to={`/ApplyForPermit`}
              className="flex items-start gap-3 p-4 transition-all"
              style={{ background: "#fff", borderRadius: 10, boxShadow: "0 1px 8px rgba(0,0,0,0.06)", textDecoration: "none", border: "1px solid #e8eaf0" }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,74,198,0.12)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 8px rgba(0,0,0,0.06)"}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#eff4ff" }}>
                <MapPin className="w-4 h-4" style={{ color: PRIMARY }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold text-sm" style={{ fontFamily: FONTS.headline, color: "#0d1c2e" }}>{city.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${city.badgeCls}`}>{city.badge}</span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "#6b7280", fontFamily: FONTS.body }}>{city.detail}</p>
              </div>
            </Link>
          ))}
        </div>
      </FadeSection>

      {/* ── YOUR PATH TO APPROVAL ────────────────────────────────────── */}
      <FadeSection className="mt-14" style={{ background: "#eef2ff" }}>
        <div className="px-4 py-14 max-w-5xl mx-auto">
          <h2 className="text-center font-extrabold mb-12" style={{ fontFamily: FONTS.headline, fontSize: 26, color: "#0d1c2e" }}>
            Your Path to Approval
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-6 h-px" style={{ left: "calc(33.33% + 8px)", right: "calc(33.33% + 8px)", background: "#c3c6d7" }} />
            {STEPS.map(step => (
              <div key={step.num} className="flex flex-col items-center text-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-extrabold text-lg text-white mb-5 relative z-10"
                  style={{ background: PRIMARY, boxShadow: "0 4px 16px rgba(0,74,198,0.3)", fontFamily: FONTS.headline }}
                >
                  {step.num}
                </div>
                <h3 className="font-bold mb-2 text-sm" style={{ fontFamily: FONTS.headline, color: "#0d1c2e" }}>{step.title}</h3>
                <p className="text-xs leading-relaxed max-w-[200px]" style={{ color: "#6b7280", fontFamily: FONTS.body }}>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </FadeSection>

      {/* ── AI SUPPORT ───────────────────────────────────────────────── */}
      <FadeSection className="px-4 mt-14 max-w-2xl mx-auto">
        <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", overflow: "hidden", border: "1px solid #e8eaf0" }}>
          <div className="flex items-center gap-3 px-5 py-4" style={{ background: PRIMARY }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.15)" }}>
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm" style={{ fontFamily: FONTS.headline }}>Intelligent Permit Support</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.65)", fontFamily: FONTS.body }}>Ask anything about local requirements</p>
            </div>
          </div>
          <div className="px-5 py-4">
            <div className="flex flex-wrap gap-2 mb-4">
              {AI_CHIPS.map(chip => (
                <button
                  key={chip}
                  onClick={() => handleAsk(chip)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:bg-[#004ac6] hover:text-white active:scale-95"
                  style={{ background: "#eff4ff", color: PRIMARY, fontFamily: FONTS.body }}
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
                className="w-full h-11 pl-4 pr-12 rounded-lg text-sm focus:outline-none"
                style={{ background: "#f8f9ff", border: "1px solid #e8eaf0", color: "#0d1c2e", fontFamily: FONTS.body }}
                onFocus={e => e.target.style.borderColor = PRIMARY}
                onBlur={e => e.target.style.borderColor = "#e8eaf0"}
              />
              <button
                onClick={() => { if (question.trim()) { handleAsk(question.trim()); setQuestion(""); } }}
                className="absolute right-1.5 top-1.5 h-8 w-8 rounded-lg flex items-center justify-center transition-opacity hover:opacity-80"
                style={{ background: PRIMARY }}
              >
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </FadeSection>

      {/* ── READY TO START CTA ───────────────────────────────────────── */}
      <FadeSection className="px-4 mt-14 mb-12 max-w-5xl mx-auto">
        <div
          className="relative overflow-hidden text-center"
          style={{ background: PRIMARY, borderRadius: 12, padding: "64px 32px" }}
        >
          <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full blur-3xl" style={{ background: "rgba(0,30,100,0.3)" }} />
          <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full blur-3xl" style={{ background: "rgba(0,106,97,0.2)" }} />
          <div className="relative z-10">
            <h2 className="font-extrabold text-white mb-2" style={{ fontFamily: FONTS.headline, fontSize: "clamp(28px,4vw,40px)", letterSpacing: "-0.02em" }}>
              Ready to start?
            </h2>
            <p className="text-sm mb-7" style={{ color: "rgba(255,255,255,0.65)", fontFamily: FONTS.body }}>
              Simplifying permits for Broward and Miami-Dade counties.
            </p>
            <Link
              to={createPageUrl("PermitGuide")}
              className="inline-flex items-center gap-2 font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: "#fff", color: PRIMARY, padding: "12px 28px", borderRadius: 8, fontFamily: FONTS.headline }}
            >
              Get Started Now
            </Link>
          </div>
        </div>
      </FadeSection>

      <AIDrawer
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        currentPageName="Home"
        initialMessage={aiInitialMessage}
      />
    </div>
  );
}