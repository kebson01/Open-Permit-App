import React from "react";

const stats = [
  { value: "4+", label: "Cities" },
  { value: "30+", label: "Permit Types" },
  { value: "100+", label: "Resources" },
  { value: "Live", label: "Data" },
];

const cities = ["Weston", "Coral Springs", "Fort Lauderdale", "Cooper City", "Hollywood"];

export default function StatsSection() {
  return (
    <section className="gradient-navy py-12 pb-24 md:pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-4 gap-4 mb-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-white">{s.value}</div>
              <div className="text-xs sm:text-sm text-blue-300 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {cities.map(c => (
            <span key={c} className="px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-medium border border-white/10">
              {c}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}