import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowRight, Shield } from "lucide-react";
import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <section className="relative gradient-navy overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-white blur-3xl" />
        <div className="absolute bottom-10 right-20 w-96 h-96 rounded-full bg-[#3182ce] blur-3xl" />
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-28 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 text-blue-200 text-sm mb-6">
            <Shield className="w-4 h-4 text-[#ffcc00]" />
            Trusted by South Florida Municipalities
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight tracking-tight">
            Saint's Interactive
            <span className="block text-[#ffcc00] mt-1">Permitting System</span>
          </h1>
          
          <p className="mt-6 text-lg md:text-xl text-blue-200/80 max-w-2xl mx-auto leading-relaxed">
            Your comprehensive guide to permitting across multiple cities — streamline your 
            permitting process with ease and efficiency.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={createPageUrl("InteractiveMap")}
              className="group inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-[#3182ce] hover:bg-[#2b6cb0] text-white font-semibold text-base shadow-lg shadow-blue-900/30 transition-all hover:shadow-xl"
            >
              Explore Permits
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              to={createPageUrl("FeeCalculator")}
              className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-base border border-white/15 transition-all"
            >
              Calculate Fees
            </Link>
          </div>
        </motion.div>
      </div>
      
      {/* Wave divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" className="w-full h-auto" fill="#f8fafc">
          <path d="M0,40 C480,80 960,0 1440,40 L1440,60 L0,60 Z" />
        </svg>
      </div>
    </section>
  );
}