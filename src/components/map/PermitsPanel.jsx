import React, { useState } from "react";
import { X, Search, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";

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

const CATEGORY_COLORS = {
  building: "bg-blue-500",
  electrical: "bg-yellow-500",
  plumbing: "bg-cyan-500",
  fire: "bg-red-500",
  certificate: "bg-green-500",
  planning: "bg-purple-500",
  engineering: "bg-orange-500",
  additional: "bg-gray-500",
};

export default function PermitsPanel({ permits, open, onClose, onSelectPermit }) {
  const [search, setSearch] = useState("");

  const filtered = permits.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = {};
  filtered.forEach(p => {
    const cat = p.category || "other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(p);
  });

  return (
    <div
      className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="gradient-primary px-5 py-4 flex items-center justify-between">
        <h3 className="text-white font-bold">All Permit Types</h3>
        <button onClick={onClose} className="text-white/70 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search permits..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
      </div>
      
      <div className="overflow-y-auto px-4 pb-4" style={{ height: "calc(100% - 140px)" }}>
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${CATEGORY_COLORS[cat] || "bg-gray-400"}`} />
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {CATEGORY_LABELS[cat] || cat}
              </h4>
            </div>
            <div className="space-y-1">
              {items.map(permit => (
                <button
                  key={permit.id}
                  onClick={() => onSelectPermit(permit)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 text-left transition-colors group"
                >
                  <span className="text-sm text-gray-700 group-hover:text-[#2c5282] font-medium">
                    {permit.name}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#2c5282]" />
                </button>
              ))}
            </div>
          </div>
        ))}
        
        {Object.keys(grouped).length === 0 && (
          <p className="text-center text-sm text-gray-400 py-8">No permits found matching "{search}"</p>
        )}
      </div>
    </div>
  );
}