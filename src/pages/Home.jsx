import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import CitySelector from "../components/home/CitySelector";
import { MousePointerClick, DollarSign, Building2, Sparkles, BookOpen, CheckCircle } from "lucide-react";

const FEATURE_CARDS = [
  { icon: MousePointerClick, title: "Identify the permit you need", body: "Click on any part of your home in our visual guide" },
  { icon: DollarSign, title: "Estimate costs in advance", body: "Live fee calculator powered by official city schedules" },
  { icon: Building2, title: "Search any property", body: "Look up permit history on all 758,232 Broward parcels" },
  { icon: Sparkles, title: "Let AI do the work", body: "Instant answers on requirements and local rules" },
  { icon: CheckCircle, title: "Save your checklist", body: "Create a free account to track your document progress" },
  { icon: BookOpen, title: "5 cities covered", body: "Weston live now — more Broward cities coming soon" },
];

const STATS = [
  { value: "758K+", label: "Broward properties" },
  { value: "115K+", label: "Permit records" },
  { value: "37", label: "Permit types" },
  { value: "5", label: "Cities" },
];

const CITIES = ["Weston", "Coral Springs", "Fort Lauderdale", "Cooper City", "Hollywood"];

export default function Home() {
  return (
    <div className="pb-16 md:pb-0" style={{ backgroundColor: "#F8FAFC" }}>

      {/* ── HERO ── */}
      <section style={{ backgroundColor: "#0F3575", padding: "52px 32px 96px", textAlign: "center" }}>
        {/* Trust badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-5"
          style={{ backgroundColor: "#1E4D99", color: "#93B8F4" }}>
          🏛️ Trusted by Broward County municipalities
        </div>

        {/* H1 */}
        <h1 className="font-bold leading-tight mb-4" style={{ color: "#FFFFFF", fontSize: "clamp(26px, 5vw, 38px)", maxWidth: 560, margin: "0 auto 16px" }}>
          Permits made simple for{" "}
          <span style={{ color: "#60A5FA" }}>South Florida.</span>
        </h1>

        {/* Subtitle */}
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 15, maxWidth: 480, margin: "0 auto 32px", lineHeight: 1.65 }}>
          Know exactly what permits you need, estimate your costs upfront, and search any Broward County property — all in one place.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to={createPageUrl("PermitGuide")}
            className="font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#3B82F6", color: "#fff", padding: "11px 24px", borderRadius: 8, fontSize: 14 }}
          >
            Start Planning Your Permit
          </Link>
          <Link
            to={createPageUrl("FeeCalculator")}
            className="font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: "transparent", color: "#fff", border: "1.5px solid rgba(255,255,255,0.35)", padding: "11px 24px", borderRadius: 8, fontSize: 14 }}
          >
            Estimate Costs
          </Link>
        </div>
      </section>

      {/* ── CITY SELECTOR (overlapping hero) ── */}
      <div className="flex justify-center px-4" style={{ marginTop: -36, position: "relative", zIndex: 10, marginBottom: 48 }}>
        <CitySelector />
      </div>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: "48px 32px", textAlign: "center" }}>
        <p className="font-semibold uppercase tracking-widest mb-2" style={{ color: "#3B82F6", fontSize: 11 }}>HOW IT WORKS</p>
        <h2 className="font-bold mb-2" style={{ color: "#0F172A", fontSize: 22 }}>Three steps to permit-ready</h2>
        <p className="mb-10" style={{ color: "#475569", fontSize: 14 }}>No more guessing. Know exactly what you need before you apply.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mx-auto" style={{ maxWidth: 700 }}>
          {[
            { num: "1", title: "Identify your permit", body: "Click on the part of your home you're improving to see exactly what permits apply" },
            { num: "2", title: "Estimate your costs", body: "Get a transparent fee estimate based on official city fee schedules" },
            { num: "3", title: "Gather your documents", body: "Get a checklist of exactly what to bring — no surprises at the counter" },
          ].map(step => (
            <div key={step.num} className="bg-white rounded-xl border p-5 text-left" style={{ borderColor: "#E2E8F0" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mb-3"
                style={{ backgroundColor: "#EFF6FF", color: "#1E4D99" }}>
                {step.num}
              </div>
              <p className="font-bold mb-1" style={{ color: "#0F172A", fontSize: 13 }}>{step.title}</p>
              <p style={{ color: "#475569", fontSize: 11, lineHeight: 1.6 }}>{step.body}</p>
            </div>
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
            <div key={card.title} className="bg-white rounded-xl border p-4 text-left flex items-start gap-3" style={{ borderColor: "#E2E8F0" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#EFF6FF" }}>
                <card.icon className="w-4 h-4" style={{ color: "#1E4D99" }} />
              </div>
              <div>
                <p className="font-bold mb-0.5" style={{ color: "#0F172A", fontSize: 13 }}>{card.title}</p>
                <p style={{ color: "#475569", fontSize: 11, lineHeight: 1.6 }}>{card.body}</p>
              </div>
            </div>
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

        {/* City pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-5">
          {CITIES.map(city => (
            <span key={city} className="px-3 py-1 rounded-full text-xs"
              style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", fontSize: 11 }}>
              {city}
            </span>
          ))}
        </div>
      </div>

    </div>
  );
}