import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import AIDrawer from "../components/ai/AIDrawer";
import {
  ChevronRight, MapPin, Send, ShieldCheck, BookOpen,
  Calculator, Search, Layers, Timer, Wrench, Bell, Clock,
  Menu, X, User, Zap
} from "lucide-react";
import { useCities } from "@/hooks/useCities";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  primary: "#004ac6",
  primaryContainer: "#2563eb",
  secondary: "#006a61",
  bg: "#f8f9ff",
  surface: "#ffffff",
  surfaceContainer: "#e6eeff",
  surfaceContainerHigh: "#dce9ff",
  onSurface: "#0d1c2e",
  onSurfaceVariant: "#434655",
  outline: "#737686",
  outlineVariant: "#c3c6d7",
  navy: "#233144",
};

// ─── Static data ──────────────────────────────────────────────────────────────
const LAW_CARDS = [
  { emoji: "✓", title: "HB 837 – Permit Exemptions", body: "Projects under $2,500 for single-family homes may no longer require a permit (Effective July 1, 2024)." },
  { emoji: "🏠", title: "Roof Partial Repair Rule", body: "Only the damaged portion may need repair if the rest of the roof meets 2023 FBC re-roofing rules." },
  { emoji: "👤", title: "Private Providers (HB 635)", body: "Homeowners can use licensed private providers to speed up plan reviews to 10–16 business days." },
  { emoji: "⏱", title: "Permit Expiration – 180 Days", body: "Permits must remain active. No inspections within 180 days may result in expiration and new fees." },
];

const TOOLS = [
  { icon: ShieldCheck, title: "Exception Checker",   sub: "See if your project qualifies for a waiver",   page: "ExemptionChecker" },
  { icon: BookOpen,    title: "Visual Permit Guide",  sub: "Interactive step-by-step documentation",       page: "PermitGuide" },
  { icon: Calculator,  title: "Fee Calculator",       sub: "Estimate city and county permit costs",        page: "FeeCalculator" },
  { icon: Search,      title: "Property Search",      sub: "Check historical permits by address",          page: "PropertyGuide" },
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

// ─── Fade-in hook ─────────────────────────────────────────────────────────────
function useFadeIn() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

// ─── Animated section wrapper ─────────────────────────────────────────────────
function FadeSection({ children, className = "", style = {} }) {
  const [ref, visible] = useFadeIn();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        transition: "opacity 700ms ease, transform 700ms ease",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Home() {
  const { cities, loading: citiesLoading } = useCities();
  const [jurisdiction, setJurisdiction] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiInitialMessage, setAiInitialMessage] = useState("");
  const [question, setQuestion] = useState("");

  const handleAsk = (msg) => { setAiInitialMessage(msg); setAiOpen(true); };

  const heroSearch = () => {
    const city = jurisdiction || (cities[0]?.name ?? "");
    window.location.href = createPageUrl("PermitGuide") + (city ? `?city=${encodeURIComponent(city)}` : "");
  };

  const fonts = { headline: "'Manrope', system-ui, sans-serif", body: "'Plus Jakarta Sans', system-ui, sans-serif" };

  return (
    <div style={{ background: C.bg, fontFamily: fonts.body, color: C.onSurface }} className="pb-24 md:pb-0">

      {/* ══ 2. HERO ══════════════════════════════════════════════════════════ */}
      <section className="relative flex items-center justify-center overflow-hidden" style={{ minHeight: 520 }}>
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
            alt="City"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(0,74,198,0.88) 0%, rgba(0,106,97,0.65) 100%)" }} />
        </div>
        <div className="relative z-10 w-full max-w-3xl mx-auto px-6 py-20 text-center">
          <h1
            className="font-extrabold text-white mb-4 leading-tight"
            style={{ fontFamily: fonts.headline, fontSize: "clamp(32px,5vw,48px)", letterSpacing: "-0.02em" }}
          >
            Permits made simple &amp; stress-free
          </h1>
          <p className="mb-10 max-w-xl mx-auto" style={{ fontFamily: fonts.body, fontSize: 18, color: "rgba(255,255,255,0.82)", lineHeight: 1.6 }}>
            Navigate building codes, estimate costs, and track your project with confidence and ease.
          </p>
          {/* Glass search bar */}
          <div
            className="flex items-center overflow-hidden mx-auto"
            style={{
              maxWidth: 640,
              background: "rgba(255,255,255,0.95)",
              backdropFilter: "blur(12px)",
              borderRadius: 16,
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            }}
          >
            <div className="flex items-center gap-2 flex-1 px-5 py-1 min-w-0">
              <MapPin className="w-4 h-4 shrink-0" style={{ color: C.primary }} />
              <select
                value={jurisdiction}
                onChange={e => setJurisdiction(e.target.value)}
                className="flex-1 bg-transparent text-sm focus:outline-none appearance-none cursor-pointer py-3 min-w-0"
                style={{ color: C.onSurfaceVariant, fontFamily: fonts.body }}
              >
                <option value="">City / Municipality (e.g. Fort Lauderdale)</option>
                {!citiesLoading && cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <button
              onClick={heroSearch}
              className="shrink-0 flex items-center gap-2 m-1.5 px-5 py-3 text-white text-sm font-bold transition-all active:scale-[0.98] hover:opacity-90"
              style={{ background: C.primary, borderRadius: 12, fontFamily: fonts.headline }}
            >
              Find Permits For Your Project
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ══ 3. FLORIDA LAW CHANGES BANNER ══════════════════════════════════ */}
      <FadeSection className="px-6 pt-8 max-w-5xl mx-auto">
        <div style={{ background: C.navy, borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.12)" }} className="overflow-hidden">
          {/* Header row */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-3">
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: "#006a61", color: "#fff", fontFamily: fonts.headline, letterSpacing: "0.04em" }}
              >
                NEW
              </span>
              <span className="font-bold text-white" style={{ fontFamily: fonts.headline, fontSize: 15 }}>
                2023–2024 Florida Law Changes
              </span>
            </div>
            <Link
              to={createPageUrl("ExemptionChecker")}
              className="flex items-center gap-1.5 text-xs font-semibold transition-colors hover:opacity-80"
              style={{ color: "#86f2e4", fontFamily: fonts.body }}
            >
              Check your project eligibility →
            </Link>
          </div>
          {/* 4 law cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {LAW_CARDS.map((card, i) => (
              <div
                key={card.title}
                className="px-5 py-5 transition-colors hover:bg-white/5"
                style={{ borderRight: i < 3 ? "1px solid rgba(255,255,255,0.06)" : "none" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">{card.emoji}</span>
                  <p className="text-xs font-bold leading-tight" style={{ color: "#86f2e4", fontFamily: fonts.headline }}>{card.title}</p>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.62)", fontFamily: fonts.body }}>{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </FadeSection>

      {/* ══ 4. ESSENTIAL PLANNING TOOLS ════════════════════════════════════ */}
      <FadeSection className="px-6 mt-20 max-w-5xl mx-auto">
        <h2 className="text-center font-extrabold mb-10" style={{ fontFamily: fonts.headline, fontSize: 32, color: C.onSurface }}>
          Essential Planning Tools
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {TOOLS.map(tool => (
            <Link
              key={tool.title}
              to={createPageUrl(tool.page)}
              className="group flex flex-col items-start gap-4 p-5 transition-all"
              style={{
                background: C.surface,
                borderRadius: 12,
                boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
                textDecoration: "none",
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,74,198,0.15)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 16px rgba(0,0,0,0.06)"}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center transition-all group-hover:bg-[#004ac6]"
                style={{ background: C.surfaceContainerHigh }}
              >
                <tool.icon
                  className="w-5 h-5 transition-colors group-hover:text-white"
                  style={{ color: C.primary }}
                />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm mb-1" style={{ fontFamily: fonts.headline, color: C.onSurface }}>{tool.title}</p>
                <p className="text-xs leading-relaxed" style={{ color: C.onSurfaceVariant, fontFamily: fonts.body }}>{tool.sub}</p>
              </div>
              <ChevronRight className="w-4 h-4 transition-colors" style={{ color: C.outlineVariant }} />
            </Link>
          ))}
        </div>
      </FadeSection>

      {/* ══ 5. YOUR PATH TO APPROVAL ════════════════════════════════════════ */}
      <FadeSection className="mt-20" style={{ background: "#eff4ff" }}>
        <div className="px-6 py-16 max-w-5xl mx-auto">
          <h2 className="text-center font-extrabold mb-14" style={{ fontFamily: fonts.headline, fontSize: 32, color: C.onSurface }}>
            Your Path to Approval
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div
              className="hidden md:block absolute top-7 h-px"
              style={{ left: "calc(33.33% - 28px)", right: "calc(33.33% - 28px)", background: C.outlineVariant }}
            />
            {STEPS.map(step => (
              <div key={step.num} className="flex flex-col items-center text-center">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center font-extrabold text-xl text-white mb-5 relative z-10 transition-transform hover:scale-110"
                  style={{ background: C.primary, boxShadow: "0 4px 20px rgba(0,74,198,0.35)", fontFamily: fonts.headline }}
                >
                  {step.num}
                </div>
                <h3 className="font-bold mb-2" style={{ fontFamily: fonts.headline, fontSize: 16, color: C.onSurface }}>{step.title}</h3>
                <p className="text-sm leading-relaxed max-w-[220px]" style={{ color: C.onSurfaceVariant, fontFamily: fonts.body }}>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </FadeSection>

      {/* ══ 6. AI SUPPORT ═══════════════════════════════════════════════════ */}
      <FadeSection className="px-6 mt-20 max-w-3xl mx-auto">
        <div
          style={{
            background: C.surface,
            borderRadius: 16,
            boxShadow: "0 8px 40px rgba(0,0,0,0.10)",
            overflow: "hidden",
          }}
        >
          {/* Blue header */}
          <div className="flex items-center gap-4 px-6 py-5" style={{ background: C.primary }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.15)" }}>
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-white" style={{ fontFamily: fonts.headline, fontSize: 15 }}>Intelligent Permit Support</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.65)", fontFamily: fonts.body }}>Ask anything about local requirements</p>
            </div>
          </div>
          {/* Body */}
          <div className="px-6 py-5">
            <div className="flex flex-wrap gap-2 mb-5">
              {AI_CHIPS.map(chip => (
                <button
                  key={chip}
                  onClick={() => handleAsk(chip)}
                  className="px-3.5 py-2 rounded-full text-xs font-semibold transition-all hover:bg-[#004ac6] hover:text-white active:scale-95"
                  style={{ background: C.surfaceContainerHigh, color: C.primary, fontFamily: fonts.body }}
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
                className="w-full h-12 pl-4 pr-14 rounded-xl text-sm focus:outline-none transition-all"
                style={{
                  background: C.bg,
                  border: `1px solid ${C.outlineVariant}`,
                  color: C.onSurface,
                  fontFamily: fonts.body,
                }}
                onFocus={e => e.target.style.boxShadow = `0 0 0 3px rgba(0,74,198,0.18)`}
                onBlur={e => e.target.style.boxShadow = "none"}
              />
              <button
                onClick={() => { if (question.trim()) { handleAsk(question.trim()); setQuestion(""); } }}
                className="absolute right-2 top-1.5 h-9 w-9 rounded-lg flex items-center justify-center transition-opacity hover:opacity-80 active:scale-95"
                style={{ background: C.primary }}
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      </FadeSection>

      {/* ══ 7. READY TO START CTA ═══════════════════════════════════════════ */}
      <FadeSection className="px-6 mt-20 mb-16 max-w-5xl mx-auto">
        <div
          className="relative overflow-hidden text-center"
          style={{ background: C.primaryContainer, borderRadius: 16, padding: "80px 32px" }}
        >
          {/* Decorative blurred circles */}
          <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full blur-3xl" style={{ background: "rgba(0,40,120,0.3)" }} />
          <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full blur-3xl" style={{ background: "rgba(0,106,97,0.25)" }} />
          <div className="relative z-10">
            <h2
              className="font-extrabold text-white mb-3"
              style={{ fontFamily: fonts.headline, fontSize: "clamp(32px,4vw,48px)", letterSpacing: "-0.02em" }}
            >
              Ready to start?
            </h2>
            <p className="mb-8 mx-auto max-w-md" style={{ fontFamily: fonts.body, fontSize: 16, color: "rgba(255,255,255,0.7)" }}>
              Simplifying permits for Broward and Miami-Dade counties.
            </p>
            <Link
              to={createPageUrl("PermitGuide")}
              className="inline-flex items-center gap-2 font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
              style={{
                background: "#ffffff",
                color: C.primary,
                padding: "14px 32px",
                borderRadius: 12,
                fontFamily: fonts.headline,
                boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
              }}
            >
              Get Started Now
            </Link>
          </div>
        </div>
      </FadeSection>

      {/* ══ 8. FOOTER ═══════════════════════════════════════════════════════ */}
      <footer style={{ background: "#eff4ff", borderTop: `1px solid ${C.outlineVariant}` }}>
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-bold" style={{ fontFamily: fonts.headline, fontSize: 16, color: C.primary }}>Open Permit</p>
            <p className="text-xs mt-0.5" style={{ color: C.outline, fontFamily: fonts.body }}>
              © 2024 Open Permit. Guiding you through every step.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            {["Privacy Policy", "Terms of Service", "Accessibility", "Contact Support"].map(l => (
              <a key={l} href="#" className="text-xs hover:underline transition-colors" style={{ color: C.onSurfaceVariant, fontFamily: fonts.body }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>

      <AIDrawer
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        currentPageName="Home"
        initialMessage={aiInitialMessage}
      />
    </div>
  );
}