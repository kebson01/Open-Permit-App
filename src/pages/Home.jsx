import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import CitySelector from "../components/home/CitySelector";
import HomeAISection from "../components/home/HomeAISection";
import AIDrawer from "../components/ai/AIDrawer";
import { MousePointerClick, DollarSign, Building2, Sparkles, BookOpen, CheckCircle, ArrowRight, Lock, Info, X } from "lucide-react";

const HOW_IT_WORKS = [
  { num: "1", title: "Identify your permit", body: "Click on the part of your home you're improving to see exactly what permits apply", page: "PermitGuide" },
  { num: "2", title: "Estimate your costs", body: "Get a transparent fee estimate based on official city fee schedules", page: "FeeCalculator" },
  { num: "3", title: "Gather your documents", body: "Get a checklist of exactly what to bring — no surprises at the counter", page: "PermitGuide" },
];

const FEATURE_CARDS = [
  { icon: MousePointerClick, title: "Identify the permit you need", body: "Click on any part of your home in our visual guide", page: "PermitGuide" },
  { icon: DollarSign, title: "Estimate costs in advance", body: "Live fee calculator powered by official city schedules", page: "FeeCalculator" },
  { icon: Building2, title: "Search any property", body: "Look up permit history on all 758,232 Broward parcels", page: "PropertyGuide" },
  { icon: Sparkles, title: "Let AI do the work", body: "Instant answers on requirements and local rules", page: "PermitGuide" },
  { icon: CheckCircle, title: "Save your checklist", body: "Create a free account to track your document progress", page: "ProjectDashboard" },
  { icon: BookOpen, title: "5 cities covered", body: "Weston & Coral Springs live now — more Broward cities coming soon", page: "PermitGuide" },
];

const STATS = [
  { value: "758K+", label: "Broward properties" },
  { value: "115K+", label: "Permit records" },
  { value: "37", label: "Permit types" },
  { value: "5", label: "Cities" },
];

const CITIES = [
  { name: "Weston", available: true },
  { name: "Coral Springs", available: true },
  { name: "Fort Lauderdale", available: false },
  { name: "Cooper City", available: false },
  { name: "Hollywood", available: false },
];

function ClickCard({ to, children, className, style }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      to={to}
      className={className}
      style={{
        ...style,
        borderColor: hovered ? "#BFDBFE" : "#E2E8F0",
        cursor: "pointer",
        transition: "border-color 0.15s ease",
        textDecoration: "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children(hovered)}
    </Link>
  );
}

export default function Home() {
  const [aiOpen, setAiOpen] = useState(false);
  const [aiInitialMessage, setAiInitialMessage] = useState("");
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const handleAsk = (msg) => {
    setAiInitialMessage(msg);
    setAiOpen(true);
  };

  return (
    <div className="pb-16 md:pb-0" style={{ backgroundColor: "#F8FAFC" }}>

      {/* ── HERO ── */}
      <section style={{ backgroundColor: "#0F3575", padding: "52px 32px 96px", textAlign: "center" }}>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-5"
          style={{ backgroundColor: "#1E4D99", color: "#93B8F4" }}>
          🏛️ Trusted by Broward County municipalities
        </div>

        <h1 className="font-bold leading-tight" style={{ color: "#FFFFFF", fontSize: "clamp(26px, 5vw, 38px)", maxWidth: 560, margin: "0 auto 16px" }}>
          Permits made simple for{" "}
          <span style={{ color: "#60A5FA" }}>South Florida.</span>
        </h1>

        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 15, maxWidth: 480, margin: "0 auto 32px", lineHeight: 1.65 }}>
          Know exactly what permits you need, estimate your costs upfront, and search any Broward County property — all in one place.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link to={createPageUrl("PermitGuide")} className="font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#3B82F6", color: "#fff", padding: "11px 24px", borderRadius: 8, fontSize: 14 }}>
            Start Planning Your Permit
          </Link>
          <Link to={createPageUrl("FeeCalculator")} className="font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: "transparent", color: "#fff", border: "1.5px solid rgba(255,255,255,0.35)", padding: "11px 24px", borderRadius: 8, fontSize: 14 }}>
            Estimate Costs
          </Link>
        </div>
      </section>

      {/* ── CITY SELECTOR ── */}
      <div className="flex justify-center px-4" style={{ marginTop: -36, position: "relative", zIndex: 10, marginBottom: 16 }}>
        <CitySelector />
      </div>

      {/* ── PERMIT EXPLAINER BANNER ── */}
      {!bannerDismissed && (
        <div className="flex justify-center px-4 mb-6">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
            <Info className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#1E3A8A" }} />
            <span style={{ color: "#1E3A8A", fontSize: 13, fontWeight: 500 }}>A permit is official approval from the city before you start home improvements.</span>
            <button onClick={() => setBannerDismissed(true)} className="ml-1 hover:opacity-70 transition-opacity flex-shrink-0" style={{ color: "#1E3A8A" }}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── AI SECTION ── */}
      <HomeAISection onAsk={handleAsk} />

      {/* AI Drawer */}
      <AIDrawer
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        currentPageName="Home"
        initialMessage={aiInitialMessage}
      />

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: "48px 32px", textAlign: "center" }}>
        <p className="font-semibold uppercase tracking-widest mb-2" style={{ color: "#3B82F6", fontSize: 11 }}>HOW IT WORKS</p>
        <h2 className="font-bold mb-2" style={{ color: "#0F172A", fontSize: 22 }}>Three steps to permit-ready</h2>
        <p className="mb-10" style={{ color: "#475569", fontSize: 14 }}>No more guessing. Know exactly what you need before you apply.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mx-auto" style={{ maxWidth: 700 }}>
          {HOW_IT_WORKS.map(step => (
            <ClickCard
              key={step.num}
              to={createPageUrl(step.page)}
              className="bg-white rounded-xl border p-5 text-left block relative"
              style={{ borderColor: "#E2E8F0" }}
            >
              {(hovered) => (
                <>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mb-3"
                    style={{ backgroundColor: "#EFF6FF", color: "#1E4D99" }}>
                    {step.num}
                  </div>
                  <p className="font-bold mb-1" style={{ color: "#0F172A", fontSize: 13 }}>{step.title}</p>
                  <p style={{ color: "#475569", fontSize: 11, lineHeight: 1.6 }}>{step.body}</p>
                  <ArrowRight
                    className="absolute bottom-4 right-4 w-3.5 h-3.5 transition-opacity duration-150"
                    style={{ color: "#3B82F6", opacity: hovered ? 1 : 0 }}
                  />
                </>
              )}
            </ClickCard>
          ))}
        </div>
      </section>

      {/* ── WHAT YOU CAN DO ── */}
      <section style={{ padding: "0 32px 48px", textAlign: "center" }}>
        <p className="font-semibold uppercase tracking-widest mb-2" style={{ color: "#3B82F6", fontSize: 11 }}>WHAT YOU CAN DO</p>
        <h2 className="font-bold mb-2" style={{ color: "#0F172A", fontSize: 22 }}>Everything in one place</h2>
        <p className="mb-8" style={{ color: "#475569", fontSize: 14 }}>Built for Broward County homeowners and contractors.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mx-auto" style={{ maxWidth: 700 }}>
          {FEATURE_CARDS.map(card => (
            <ClickCard
              key={card.title}
              to={createPageUrl(card.page)}
              className="bg-white rounded-xl border p-4 text-left flex items-start gap-3 relative"
              style={{ borderColor: "#E2E8F0" }}
            >
              {(hovered) => (
                <>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#EFF6FF" }}>
                    <card.icon className="w-4 h-4" style={{ color: "#1E4D99" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold mb-0.5" style={{ color: "#0F172A", fontSize: 13 }}>{card.title}</p>
                    <p style={{ color: "#475569", fontSize: 11, lineHeight: 1.6 }}>{card.body}</p>
                  </div>
                  <ArrowRight
                    className="absolute bottom-3 right-3 w-3.5 h-3.5 transition-opacity duration-150 flex-shrink-0"
                    style={{ color: "#3B82F6", opacity: hovered ? 1 : 0 }}
                  />
                </>
              )}
            </ClickCard>
          ))}
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <div style={{ backgroundColor: "#0D2B5E", padding: "24px 32px" }}>
        <div className="flex flex-wrap items-center justify-center gap-10 sm:gap-16">
          {STATS.map(s => (
            <div key={s.label} className="text-center">
              <p className="font-bold" style={{ color: "#FFFFFF", fontSize: 22 }}>{s.value}</p>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>{s.label}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-2 mt-5">
          {CITIES.map(c => (
            <span key={c.name} className="flex items-center gap-1 px-3 py-1 rounded-full"
              style={{ backgroundColor: "rgba(255,255,255,0.1)", color: c.available ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.4)", fontSize: 11 }}>
              {!c.available && <Lock className="w-2.5 h-2.5 flex-shrink-0" />}
              {c.name}
            </span>
          ))}
        </div>
      </div>

    </div>
  );
}