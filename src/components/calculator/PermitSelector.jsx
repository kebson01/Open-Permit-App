import React, { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const CATEGORY_LABELS = {
  building: "Building Permits",
  electrical: "Electrical Permits",
  plumbing: "Plumbing Permits",
  fire: "Fire Code Services",
  certificate: "Certificates",
  planning: "Planning & Zoning",
  engineering: "Engineering Permits",
  additional: "Additional Services",
};

const CATEGORY_ICONS = {
  building: "🏗️",
  electrical: "⚡",
  plumbing: "🔧",
  fire: "🔥",
  certificate: "📜",
  planning: "📐",
  engineering: "🛣️",
  additional: "➕",
};

export default function PermitSelector({ permits, selectedPermit, onSelect }) {
  const [search, setSearch] = useState("");

  const filtered = permits.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = {};
  filtered.forEach(p => {
    const cat = p.category || "other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(p);
  });

  const categoryOrder = ["building", "electrical", "plumbing", "fire", "certificate", "planning", "engineering", "additional"];

  return (
    <div>
      <h3 className="text-lg font-bold text-gray-800 mb-1">Step 1: Select Permit Type</h3>
      <p className="text-sm text-gray-500 mb-4">Choose the type of permit you need</p>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search permit types..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 rounded-xl"
        />
      </div>

      <RadioGroup value={selectedPermit} onValueChange={onSelect}>
        <div className="space-y-6">
          {categoryOrder.map(cat => {
            if (!grouped[cat]) return null;
            return (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{CATEGORY_ICONS[cat]}</span>
                  <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                    {CATEGORY_LABELS[cat]}
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {grouped[cat].map(permit => (
                    <label
                      key={permit.name}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                        selectedPermit === permit.name
                          ? "border-[#2c5282] bg-blue-50 shadow-sm"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <RadioGroupItem value={permit.name} id={permit.name} />
                      <Label htmlFor={permit.name} className="text-sm text-gray-700 cursor-pointer font-medium">
                        {permit.name}
                      </Label>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </RadioGroup>

      {Object.keys(grouped).length === 0 && (
        <p className="text-center text-gray-400 py-6">No permit types found matching "{search}"</p>
      )}
    </div>
  );
}