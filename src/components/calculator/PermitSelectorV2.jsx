import React, { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const CATEGORY_META = {
  building:    { label: "Building Permits",      icon: "🏗️" },
  electrical:  { label: "Electrical Permits",    icon: "⚡" },
  plumbing:    { label: "Plumbing Permits",       icon: "🔧" },
  fire:        { label: "Fire Code Services",     icon: "🔥" },
  certificate: { label: "Certificates",           icon: "📜" },
  planning:    { label: "Planning & Zoning",      icon: "📐" },
  engineering: { label: "Engineering Permits",    icon: "🛣️" },
  additional:  { label: "Additional Services",    icon: "➕" },
};

const CATEGORY_ORDER = ["building", "electrical", "plumbing", "fire", "certificate", "planning", "engineering", "additional"];

export default function PermitSelectorV2({ permits, selectedPermitId, onSelect }) {
  const [search, setSearch] = useState("");

  const filtered = permits.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = {};
  filtered.forEach(p => {
    const cat = p.category || "additional";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(p);
  });

  return (
    <div>
      <h3 className="text-lg font-bold text-gray-800 mb-1">Step 1: Select Permit Type</h3>
      <p className="text-sm text-gray-500 mb-4">Choose the permit that best matches your project</p>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search permits..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 rounded-xl"
        />
      </div>

      <div className="space-y-6">
        {CATEGORY_ORDER.map(cat => {
          if (!grouped[cat]) return null;
          const meta = CATEGORY_META[cat] || { label: cat, icon: "📋" };
          return (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{meta.icon}</span>
                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">{meta.label}</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {grouped[cat].map(permit => (
                  <button
                    key={permit.id}
                    onClick={() => onSelect(permit.id)}
                    className={`text-left px-4 py-3 rounded-xl border transition-all ${
                      selectedPermitId === permit.id
                        ? "border-[#2c5282] bg-blue-50 shadow-sm"
                        : "border-gray-200 hover:border-blue-300 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <p className={`text-sm font-medium ${selectedPermitId === permit.id ? "text-[#2c5282]" : "text-gray-800"}`}>
                      {permit.name}
                    </p>
                    {permit.description && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{permit.description}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {Object.keys(grouped).length === 0 && (
        <p className="text-center text-gray-400 py-6">No permits found matching "{search}"</p>
      )}
    </div>
  );
}