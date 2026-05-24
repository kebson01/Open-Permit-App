import React from "react";

const stats = [
  { value: "6", label: "Cities" },
  { value: "11+", label: "Guided Permit Types" },
];

const cities = [
  { name: "Weston",          badge: "Full Coverage",       badgeColor: "bg-green-400/20 text-green-200 border-green-400/30" },
  { name: "Hollywood",       badge: "Guided",              badgeColor: "bg-teal-400/20 text-teal-200 border-teal-400/30" },
  { name: "Coral Springs",   badge: "Guided",              badgeColor: "bg-teal-400/20 text-teal-200 border-teal-400/30" },
  { name: "Cooper City",     badge: "Guided",              badgeColor: "bg-teal-400/20 text-teal-200 border-teal-400/30" },
  { name: "Fort Lauderdale", badge: "Guided",              badgeColor: "bg-teal-400/20 text-teal-200 border-teal-400/30" },
  { name: "Sunrise",         badge: "Guided",              badgeColor: "bg-teal-400/20 text-teal-200 border-teal-400/30" },
];

export default function StatsSection() {
  return (
    <section className="py-12 pb-24 md:pb-12" style={{ background: "linear-gradient(135deg, #0D2B5E 0%, #0F3575 100%)" }}>
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
            <span key={c.name} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-medium border border-white/20">
              {c.name}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${c.badgeColor}`}>{c.badge}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}