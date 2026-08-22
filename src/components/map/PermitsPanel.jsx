import React, { useState, useEffect } from "react";
import { X, Search, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { C, F, T } from "@/lib/theme";

const CATEGORY_ORDER = ["building", "electrical", "plumbing", "mechanical", "fire", "certificate", "planning", "engineering", "additional"];
const FILTER_TABS = ["all", "building", "electrical", "plumbing", "mechanical", "engineering"];

const CATEGORY_META = {
  building:    { label: "Building Permits",     color: "bg-blue-500",   dot: "bg-blue-500" },
  electrical:  { label: "Electrical Permits",   color: "bg-yellow-500", dot: "bg-yellow-500" },
  plumbing:    { label: "Plumbing Permits",     color: "bg-cyan-500",   dot: "bg-cyan-500" },
  mechanical:  { label: "Mechanical Permits",    color: "bg-teal-500",   dot: "bg-teal-500" },
  fire:        { label: "Fire & Safety",         color: "bg-red-500",    dot: "bg-red-500" },
  certificate: { label: "Certificates",          color: "bg-green-500",  dot: "bg-green-500" },
  planning:    { label: "Planning & Zoning",     color: "bg-purple-500", dot: "bg-purple-500" },
  engineering: { label: "Engineering Permits",   color: "bg-orange-500", dot: "bg-orange-500" },
  additional:  { label: "Additional Services",   color: "bg-gray-500",   dot: "bg-gray-500" },
};

export default function PermitsPanel({ permits, open, onClose, onSelectPermit, initialSearch = "", city = "Weston" }) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  // Apply initialSearch when panel opens
  useEffect(() => {
    if (open && initialSearch) setSearch(initialSearch);
    if (!open) { setSearch(""); setActiveFilter("all"); }
  }, [open, initialSearch]);

  const filtered = permits.filter(p => {
    const matchSearch = !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = activeFilter === "all" || p.category === activeFilter;
    return matchSearch && matchFilter;
  });

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
      role="dialog"
      aria-label="All permit types"
      aria-hidden={!open}
      // Closed, this stays in the DOM off to the right — so it also has to be
      // taken out of the tab order, or keyboard focus wanders into an invisible
      // list of permits.
      inert={open ? undefined : ""}
      className={`fixed top-0 right-0 h-full w-full sm:w-[420px] shadow-2xl z-50 transform transition-transform duration-300 flex flex-col ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
      style={{ background: C.surface, fontFamily: F.body }}
    >
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between flex-shrink-0" style={{ background: C.brand }}>
        <div>
          <h3 className="text-white" style={{ fontFamily: F.head, fontSize: T.body, fontWeight: 700 }}>
            All permit types
          </h3>
          <p className="mt-0.5" style={{ color: "rgba(255,255,255,0.7)", fontSize: T.caption }}>
            {totalCount} permits · {city}, FL
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Category filter tabs */}
      <div className="px-4 pt-3 pb-2 flex-shrink-0 overflow-x-auto" style={{ borderBottom: `1px solid ${C.line}` }}>
        <div className="flex gap-1.5 min-w-max">
          {FILTER_TABS.map(tab => {
            const count = tab === "all" ? permits.length : permits.filter(p => p.category === tab).length;
            const meta = CATEGORY_META[tab];
            const on = activeFilter === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                aria-pressed={on}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
                style={{
                  background: on ? C.brand : C.surface,
                  color: on ? "#fff" : C.muted,
                  border: `1px solid ${on ? C.brand : C.line}`,
                  fontFamily: F.head,
                  fontSize: T.caption,
                  fontWeight: 700,
                }}
              >
                {tab === "all" ? "All" : (meta?.label?.replace(" Permits", "").replace(" & Safety", "") || tab)}
                <span
                  className="px-1.5 py-0.5 rounded-full"
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    fontVariantNumeric: "tabular-nums",
                    background: on ? "rgba(255,255,255,0.22)" : C.ground,
                    color: on ? "#fff" : C.faint,
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: `1px solid ${C.line}` }}>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: C.faint }}
            aria-hidden="true"
          />
          <label htmlFor="permits-panel-search" className="sr-only">Search permits</label>
          <Input
            id="permits-panel-search"
            placeholder="Search permits…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 rounded-xl"
            style={{ background: C.ground, borderColor: C.line, color: C.ink }}
            autoFocus={open}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: C.faint }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {search && (
          <p className="mt-2 px-1" style={{ color: C.faint, fontSize: T.caption }}>
            {filtered.length} result{filtered.length !== 1 ? "s" : ""} for &ldquo;{search}&rdquo;
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
              {/* The category dot keeps its own hue — it encodes which trade
                  this is, which is information, not decoration. */}
              <div className="flex items-center gap-2 mb-2 sticky top-0 py-1 z-10" style={{ background: C.surface }}>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${meta.dot}`} aria-hidden="true" />
                <h4
                  className="uppercase flex-1"
                  style={{ color: C.muted, fontFamily: F.head, fontSize: T.caption, fontWeight: 700, letterSpacing: "0.06em" }}
                >
                  {meta.label}
                </h4>
                <span
                  className="px-2 py-0.5 rounded-full"
                  style={{ background: C.ground, color: C.faint, fontSize: T.caption, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}
                >
                  {items.length}
                </span>
              </div>
              <div className="space-y-0.5">
                {items.map(permit => (
                  <button
                    key={permit.id}
                    onClick={() => onSelectPermit(permit)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-transparent text-left transition-colors hover:bg-[#e7eef6]"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <p style={{ color: C.ink, fontSize: T.small, fontWeight: 600, lineHeight: 1.35 }}>
                        {permit.name}
                      </p>
                      {permit.description && (
                        <p className="mt-0.5 truncate" style={{ color: C.faint, fontSize: T.caption }}>
                          {permit.description}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: C.faint }} aria-hidden="true" />
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