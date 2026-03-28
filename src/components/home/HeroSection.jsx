import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowRight, Map, Calculator } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #111827 100%)" }}>
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-48 h-48 rounded-full bg-blue-500 blur-3xl" />
        <div className="absolute bottom-0 right-10 w-64 h-64 rounded-full bg-blue-700 blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-blue-200 text-xs sm:text-sm mb-5">
          🏛️ Trusted by South Florida Municipalities
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight">
          Saint's Interactive
          <span className="block text-blue-400 mt-1">Permitting System</span>
        </h1>

        <p className="mt-4 text-sm sm:text-lg text-blue-200/80 max-w-xl mx-auto leading-relaxed px-2">
          Your complete guide to permitting across South Florida — find out what permits you need, estimate costs, check zoning rules, and get AI-powered help with required documents.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 px-4">
          <Link
            to={createPageUrl("PermitGuide")}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-lg transition-all"
          >
            <Map className="w-4 h-4" />
            Visual Permit Guide
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to={createPageUrl("FeeCalculator")}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white text-blue-900 hover:bg-blue-50 font-semibold text-sm shadow transition-all"
          >
            <Calculator className="w-4 h-4" />
            Calculate Fees
          </Link>
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