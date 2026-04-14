import React from "react";

const stats = [
  { value: "4+", label: "Cities" },
  { value: "30+", label: "Permit Types" },
];

const cities = ["Weston", "Coral Springs", "Fort Lauderdale", "Cooper City", "Hollywood"];

export default function StatsSection() {
  return (
    <section className="py-12 pb-24 md:pb-12" style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #111827 100%)" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-4 mb-8 max-w-xs mx-auto">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-white">{s.value}</div>
              <div className="text-xs sm:text-sm text-white/80 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {cities.map(c => (
            <span key={c} className="px-3 py-1 rounded-full bg-white/15 text-white text-xs font-medium border border-white/20">
              {c}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}