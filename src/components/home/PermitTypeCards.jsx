import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion } from "framer-motion";

const permitCategories = [
  {
    title: "Building Permits",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=250&fit=crop",
    items: ["New construction", "Additions", "Roofing", "Pools", "Fences", "Hurricane shutters"],
  },
  {
    title: "Electrical Permits",
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=250&fit=crop",
    items: ["Service upgrades", "Wiring", "A/C units", "Solar panels", "Generators"],
  },
  {
    title: "Plumbing Permits",
    image: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&h=250&fit=crop",
    items: ["Water heaters", "Gas lines", "Irrigation", "Backflow prevention"],
  },
  {
    title: "Zoning & Planning",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=250&fit=crop",
    items: ["Land use", "Variances", "Site plans", "Sign permits"],
  },
];

export default function PermitTypeCards() {
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory -mx-4 px-4 scrollbar-thin">
      {permitCategories.map((cat, i) => (
        <motion.div
          key={cat.title}
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="flex-shrink-0 w-72 snap-start"
        >
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="relative h-40">
              <img src={cat.image} alt={cat.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <h3 className="absolute bottom-4 left-4 text-white font-bold text-lg">{cat.title}</h3>
            </div>
            <div className="p-4">
              <button
                onClick={() => setExpanded(expanded === i ? null : i)}
                className="flex items-center justify-between w-full text-sm text-gray-600 hover:text-[#2c5282] transition-colors"
              >
                <span>{expanded === i ? "Hide details" : "View common types"}</span>
                {expanded === i ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {expanded === i && (
                <ul className="mt-3 space-y-1.5">
                  {cat.items.map(item => (
                    <li key={item} className="text-sm text-gray-500 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#3182ce]" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}