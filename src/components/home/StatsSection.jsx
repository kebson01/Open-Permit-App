import React from "react";
import { motion } from "framer-motion";

const stats = [
  { value: "4+", label: "Cities Supported" },
  { value: "30+", label: "Permit Types" },
  { value: "100+", label: "Helpful Links" },
  { value: "Live", label: "Dynamic Data" },
];

const cities = ["Weston", "Coral Springs", "Fort Lauderdale", "Cooper City", "Hollywood"];

export default function StatsSection() {
  return (
    <section className="gradient-navy py-16 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#3182ce] blur-3xl" />
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-3xl md:text-4xl font-extrabold text-[#ffcc00]">{s.value}</div>
              <div className="text-sm text-blue-200 mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-3">
          {cities.map(c => (
            <span key={c} className="px-4 py-1.5 rounded-full bg-white/10 text-blue-200 text-sm font-medium border border-white/5">
              {c}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}