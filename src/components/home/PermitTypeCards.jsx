import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const permitCategories = [
  {
    title: "Building Permits",
    emoji: "🏗️",
    items: ["New construction", "Additions", "Roofing", "Pools", "Fences", "Hurricane shutters"],
  },
  {
    title: "Electrical",
    emoji: "⚡",
    items: ["Service upgrades", "Wiring", "A/C units", "Solar panels", "Generators"],
  },
  {
    title: "Plumbing",
    emoji: "🔧",
    items: ["Water heaters", "Gas lines", "Irrigation", "Backflow prevention"],
  },
  {
    title: "Zoning & Planning",
    emoji: "📐",
    items: ["Land use", "Variances", "Site plans", "Sign permits"],
  },
];

export default function PermitTypeCards() {
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {permitCategories.map((cat, i) => (
        <div key={cat.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === i ? null : i)}
            className="w-full p-4 text-left flex flex-col gap-2"
          >
            <span className="text-2xl">{cat.emoji}</span>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800 text-xs sm:text-sm leading-tight">{cat.title}</h3>
              {expanded === i ? <ChevronUp className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
            </div>
          </button>
          {expanded === i && (
            <div className="px-4 pb-4 border-t border-gray-50">
              <ul className="mt-2 space-y-1.5">
                {cat.items.map(item => (
                  <li key={item} className="text-xs text-gray-500 flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-blue-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}