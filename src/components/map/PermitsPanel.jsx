import React, { useState, useEffect } from "react";
import { X, Search, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";

const CATEGORY_ORDER = ["building", "electrical", "plumbing", "fire", "certificate", "planning", "engineering", "additional"];

const CATEGORY_META = {
  building:    { label: "Building Permits",     color: "bg-blue-500",   dot: "bg-blue-500" },
  electrical:  { label: "Electrical Permits",   color: "bg-yellow-500", dot: "bg-yellow-500" },
  plumbing:    { label: "Plumbing Permits",     color: "bg-cyan-500",   dot: "bg-cyan-500" },
  fire:        { label: "Fire & Safety",         color: "bg-red-500",    dot: "bg-red-500" },
  certificate: { label: "Certificates",          color: "bg-green-500",  dot: "bg-green-500" },
  planning:    { label: "Planning & Zoning",     color: "bg-purple-500", dot: "bg-purple-500" },
  engineering: { label: "Engineering Permits",   color: "bg-orange-500", dot: "bg-orange-500" },
  additional:  { label: "Additional Services",   color: "bg-gray-500",   dot: "bg-gray-500" },
};

export default function PermitsPanel({ permits, open, onClose, onSelectPermit, initialSearch = "" }) {
  const [search, setSearch] = useState("");

  // Apply initialSearch when panel opens
  useEffect(() => {
    if (open && initialSearch) setSearch(initialSearch);
    if (!open) setSearch("");
  }, [open, initialSearch]);

  const filtered = permits.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = {};
  filtered.forEach(p => {
    const cat = p.category || "additional";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(p);
  });

  const orderedCats = CATEGORY_ORDER.filter(c => grouped[c]);
  const otherCats = Object.keys(grouped).filter(c => !CATEGORY_ORDER.includes(c));

  const totalCount = permits.length;

  return (
    <div
      className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between flex-shrink-0" style={{ background: "linear-gradient(135deg, #0D2B5E 0%, #0F3575 100%)" }}>
        <div>
          <h3 className="text-white font-bold text-base">All Permit Types</h3>
          <p className="text-blue-200 text-xs mt-0.5">{totalCount} permits · Weston, FL</p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search permits..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 rounded-xl bg-gray-50 border-gray-200"
            autoFocus={open}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {search && (
          <p className="text-xs text-gray-400 mt-2 px-1">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""} for "{search}"
          </p>
        )}
      </div>

      {/* Permit list */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {[...orderedCats, ...otherCats].map(cat => {
          const items = grouped[cat];
          const meta = CATEGORY_META[cat] || { label: cat, dot: "bg-gray-400" };
          return (
            <div key={cat} className="mb-5">
              <div className="flex items-center gap-2 mb-2 sticky top-0 bg-white py-1 z-10">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${meta.dot}`} />
                <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider flex-1">
                  {meta.label}
                </h4>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                  {items.length}
                </span>
              </div>
              <div className="space-y-0.5">
                {items.map(permit => (
                  <button
                    key={permit.id}
                    onClick={() => onSelectPermit(permit)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-blue-50 hover:border-blue-100 border border-transparent text-left transition-all group"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-sm font-medium text-gray-800 group-hover:text-blue-800 leading-snug">
                        {permit.name}
                      </p>
                      {permit.description && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{permit.description}</p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 flex-shrink-0 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        {Object.keys(grouped).length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm font-medium text-gray-500 mb-1">No permits found</p>
            <p className="text-xs text-gray-400">Try a different search term</p>
          </div>
        )}
      </div>
    </div>
  );
}