import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import CitySelector from "../components/home/CitySelector";
import HomeAISection from "../components/home/HomeAISection";
import AIDrawer from "../components/ai/AIDrawer";
import { MousePointerClick, DollarSign, Building2, Sparkles, BookOpen, CheckCircle, ArrowRight, Info, X } from "lucide-react";

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
  { icon: BookOpen, title: "5 cities covered", body: "Weston, Coral Springs, Fort Lauderdale, Hollywood & Cooper City — all fully active", page: "PermitGuide" },
];

const STATS = [
  { value: "758K+", label: "Broward properties" },
  { value: "122+", label: "Permit types" },
  { value: "5", label: "Cities covered" },
  { value: "100%", label: "Official sources" },
];

const CITIES = [
  { name: "Weston", available: true },
  { name: "Coral Springs", available: true },
  { name: "Fort Lauderdale", available: true },
  { name: "Hollywood", available: true },
  { name: "Cooper City", available: true },
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
    <div className="pb-20 md:pb-0" style={{ backgroundColor: "#F8FAFC" }}>

      {/* ── HERO ── */}
      <section style={{ backgroundColor: "#0F3575", padding: "40px 20px 48px" }}>
        <div className="max-w-lg mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-4"
            style={{ backgroundColor: "#1E4D99", color: "#93B8F4" }}>
            🏛️ South Florida &amp; Broward County
          </div>

          <h1 className="font-bold leading-tight mb-3" style={{ color: "#FFFFFF", fontSize: "clamp(28px, 7vw, 40px)" }}>
            Permits made simple for{" "}
            <span style={{ color: "#60A5FA" }}>South Florida.</span>
          </h1>

          <p className="mb-6" style={{ color: "rgba(255,255,255,0.75)", fontSize: 15, lineHeight: 1.65 }}>
            Know exactly what you need, estimate costs, and search any Broward County property.
          </p>

          {/* City selector inside hero */}
          <div className="mb-4">
            <CitySelector compact />
          </div>

          <Link to={createPageUrl("PermitGuide")}
            className="block w-full text-center font-semibold transition-opacity hover:opacity-90 mb-3"
            style={{ backgroundColor: "#3B82F6", color: "#fff", padding: "13px 24px", borderRadius: 10, fontSize: 15 }}>
            Start Planning Your Permit
          </Link>
          <Link to={createPageUrl("FeeCalculator")}
            className="block w-full text-center font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: "transparent", color: "#fff", border: "1.5px solid rgba(255,255,255,0.35)", padding: "13px 24px", borderRadius: 10, fontSize: 15 }}>
            Estimate Costs
          </Link>
        </div>
      </section>

      {/* ── PERMIT EXPLAINER BANNER ── */}
      {!bannerDismissed && (
        <div className="px-4 pt-4">
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-2xl" style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#1E3A8A" }} />
            <span style={{ color: "#1E3A8A", fontSize: 13, fontWeight: 500, lineHeight: 1.5 }}>A permit is official city approval before you start home improvements — required by law.</span>
            <button onClick={() => setBannerDismissed(true)} className="ml-auto hover:opacity-70 transition-opacity flex-shrink-0" style={{ color: "#1E3A8A" }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── AI SECTION ── */}
      <div className="px-0">
        <HomeAISection onAsk={handleAsk} />
      </div>

      {/* AI Drawer */}
      <AIDrawer
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        currentPageName="Home"
        initialMessage={aiInitialMessage}
      />

      {/* ── HOW IT WORKS ── */}
      <section className="px-4 py-10">
        <p className="font-semibold uppercase tracking-widest mb-1" style={{ color: "#3B82F6", fontSize: 11 }}>HOW IT WORKS</p>
        <h2 className="font-bold mb-1" style={{ color: "#0F172A", fontSize: 22 }}>Three steps to permit-ready</h2>
        <p className="mb-6" style={{ color: "#475569", fontSize: 14 }}>No more guessing. Know exactly what you need before you apply.</p>

        <div className="space-y-3">
          {HOW_IT_WORKS.map(step => (
            <Link
              key={step.num}
              to={createPageUrl(step.page)}
              className="flex items-start gap-4 bg-white rounded-2xl border p-4 hover:border-blue-200 hover:shadow-sm transition-all"
              style={{ borderColor: "#E2E8F0", textDecoration: "none" }}
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                style={{ backgroundColor: "#EFF6FF", color: "#1E4D99" }}>
                {step.num}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold mb-0.5" style={{ color: "#0F172A", fontSize: 14 }}>{step.title}</p>
                <p style={{ color: "#475569", fontSize: 12, lineHeight: 1.6 }}>{step.body}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-400 flex-shrink-0 mt-1" />
            </Link>
          ))}
        </div>
      </section>

      {/* ── WHAT YOU CAN DO ── */}
      <section className="px-4 pb-10">
        <p className="font-semibold uppercase tracking-widest mb-1" style={{ color: "#3B82F6", fontSize: 11 }}>WHAT YOU CAN DO</p>
        <h2 className="font-bold mb-1" style={{ color: "#0F172A", fontSize: 22 }}>Everything in one place</h2>
        <p className="mb-6" style={{ color: "#475569", fontSize: 14 }}>Built for Broward County homeowners and contractors.</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {FEATURE_CARDS.map(card => (
            <Link
              key={card.title}
              to={createPageUrl(card.page)}
              className="bg-white rounded-2xl border p-4 flex flex-col items-start gap-2 hover:border-blue-200 hover:shadow-sm transition-all"
              style={{ borderColor: "#E2E8F0", textDecoration: "none" }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#EFF6FF" }}>
                <card.icon className="w-4 h-4" style={{ color: "#1E4D99" }} />
              </div>
              <div>
                <p className="font-bold leading-snug" style={{ color: "#0F172A", fontSize: 13 }}>{card.title}</p>
                <p className="mt-0.5" style={{ color: "#475569", fontSize: 11, lineHeight: 1.5 }}>{card.body}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <div style={{ backgroundColor: "#0D2B5E", padding: "24px 20px" }}>
        <div className="grid grid-cols-2 gap-5 max-w-xs mx-auto mb-5">
          {STATS.map(s => (
            <div key={s.label} className="text-center">
              <p className="font-bold" style={{ color: "#FFFFFF", fontSize: 24 }}>{s.value}</p>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>{s.label}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {CITIES.map(c => (
            <span key={c.name} className="flex items-center gap-1 px-3 py-1 rounded-full"
              style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", fontSize: 11 }}>
              {c.name}
            </span>
          ))}
        </div>
      </div>

    </div>
  );
}