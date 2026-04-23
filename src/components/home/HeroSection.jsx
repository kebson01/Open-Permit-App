import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowRight, Map, Calculator, Sparkles } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0D2B5E 0%, #0F3575 100%)" }}>
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-48 h-48 rounded-full bg-blue-500 blur-3xl" />
        <div className="absolute bottom-0 right-10 w-64 h-64 rounded-full bg-blue-700 blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs sm:text-sm mb-5" style={{ background: "#1E4D99", borderColor: "#1E4D99", color: "#93B8F4" }}>
          🏛️ Trusted by South Florida Municipalities
        </div>

        <div className="flex justify-center mb-4">
          <img
            src="https://media.base44.com/images/public/69ac5571087590fc03d44b73/1be927e0f_generated_image.png"
            alt="OpenPermit"
            style={{ height: '80px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
          />
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight">
          Welcome to OpenPermit
        </h1>

        <p className="mt-4 text-sm sm:text-lg text-white/90 max-w-xl mx-auto leading-relaxed px-2">
          Your complete guide to permitting across South Florida — find out what permits you need, estimate costs, check zoning rules, and get AI-powered help with required documents.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 px-4">
          <Link
            to="/#city-selector"
            onClick={e => { e.preventDefault(); document.getElementById('city-selector')?.scrollIntoView({ behavior: 'smooth' }); }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-base shadow-xl transition-all" style={{ background: "#3B82F6" }} onMouseOver={e => e.currentTarget.style.background="#2563EB"} onMouseOut={e => e.currentTarget.style.background="#3B82F6"}
          >
            <Sparkles className="w-5 h-5" />
            Start Planning Your Permit
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <Link
              to={createPageUrl("PermitGuide")}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 transition-all"
            >
              <Map className="w-4 h-4" />
              Visual Permit Guide
            </Link>
            <Link
              to={createPageUrl("FeeCalculator")}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 transition-all"
            >
              <Calculator className="w-4 h-4" />
              Calculate Fees
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 40" className="w-full h-auto" fill="#f8fafc">
          <path d="M0,20 C480,50 960,0 1440,20 L1440,40 L0,40 Z" />
        </svg>
      </div>
    </section>
  );
}