import React, { useState, useEffect } from "react";
import * as db from "@/lib/db";
import { BookOpen, Search, ChevronDown, ChevronRight, ExternalLink, Loader2, FileText, Filter } from "lucide-react";

const CITY_ORDER = ["Weston", "Hollywood", "Coral Springs", "Cooper City", "Fort Lauderdale"];

const CATEGORY_META = {
  zoning:         { label: "Zoning",        icon: "🏘️", color: "bg-purple-50 text-purple-700 border-purple-200" },
  building:       { label: "Building",       icon: "🏗️", color: "bg-blue-50 text-blue-700 border-blue-200" },
  fire_safety:    { label: "Fire Safety",    icon: "🔥", color: "bg-red-50 text-red-700 border-red-200" },
  electrical:     { label: "Electrical",     icon: "⚡", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  plumbing:       { label: "Plumbing",       icon: "🔧", color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  environmental:  { label: "Environmental",  icon: "🌿", color: "bg-green-50 text-green-700 border-green-200" },
  administrative: { label: "Administrative", icon: "📋", color: "bg-gray-50 text-gray-700 border-gray-200" },
  land_use:       { label: "Land Use",       icon: "🗺️", color: "bg-orange-50 text-orange-700 border-orange-200" },
  subdivision:    { label: "Subdivision",    icon: "📐", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  signs:          { label: "Signs",          icon: "🪧", color: "bg-pink-50 text-pink-700 border-pink-200" },
  other:          { label: "Other",          icon: "📄", color: "bg-slate-50 text-slate-700 border-slate-200" },
};

function OrdCard({ ord }) {
  const [expanded, setExpanded] = useState(false);
  const meta = CATEGORY_META[ord.category] || { label: ord.category, icon: "📄", color: "bg-gray-50 text-gray-700 border-gray-200" };

  return (
    <div className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${expanded ? "border-blue-200 shadow-md" : "border-gray-100 hover:border-gray-200 hover:shadow-sm"}`}>
      <button onClick={() => setExpanded(p => !p)} className="w-full text-left p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl shrink-0">
            {meta.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-1">
              <p className="font-semibold text-sm text-gray-900 leading-snug">{ord.section_title}</p>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${meta.color}`}>
                  {meta.label}
                </span>
                {expanded
                  ? <ChevronDown className="w-4 h-4 text-gray-400" />
                  : <ChevronRight className="w-4 h-4 text-gray-400" />}
              </div>
            </div>
            {ord.chapter_title && (
              <p className="text-xs text-gray-400">
                {ord.chapter_title}{ord.section_number ? ` · §${ord.section_number}` : ""}
              </p>
            )}
          </div>
        </div>
      </button>
      {expanded && (
        <div className="px-5 pb-5 pt-0 border-t border-gray-50">
          <div className="mt-4 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-xl p-4">
            {ord.content}
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-4">
            {ord.effective_date && (
              <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg">
                📅 Effective: {ord.effective_date}
              </span>
            )}
            {ord.ordinance_number && (
              <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg">
                📋 {ord.ordinance_number}
              </span>
            )}
            {ord.reference_url && (
              <a
                href={ord.reference_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline ml-auto"
              >
                <ExternalLink className="w-3 h-3" /> Full text →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BuildingCodes() {
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [ordinances, setOrdinances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");

  useEffect(() => {
    db.City.list().then(all => {
      const filtered = CITY_ORDER.map(n => all.find(c => c.name === n)).filter(Boolean);
      setCities(filtered);
      if (filtered.length > 0) { setSelectedCity(filtered[0]); loadOrdinances(filtered[0].name); }
    });
  }, []);

  const loadOrdinances = async (cityName) => {
    setLoading(true);
    const ords = await db.CodeOfOrdinance.filter({ city_name: cityName });
    setOrdinances(Array.isArray(ords) ? ords : []);
    setLoading(false);
  };

  const handleCityChange = (city) => {
    setSelectedCity(city);
    setSearch("");
    setCatFilter("all");
    loadOrdinances(city.name);
  };

  const filtered = ordinances.filter(o => {
    const matchCat = catFilter === "all" || o.category === catFilter;
    const matchSearch = !search ||
      o.section_title?.toLowerCase().includes(search.toLowerCase()) ||
      o.chapter_title?.toLowerCase().includes(search.toLowerCase()) ||
      o.content?.toLowerCase().includes(search.toLowerCase()) ||
      o.tags?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const grouped = {};
  filtered.forEach(o => {
    const key = o.chapter_title || "Other";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(o);
  });

  const usedCategories = [...new Set(ordinances.map(o => o.category).filter(Boolean))];

  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>
      {/* Header */}
      <div className="px-5 pt-8 pb-7" style={{ background: "linear-gradient(135deg, #0D2B5E 0%, #0F3575 100%)" }}>
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest mb-2 text-blue-300">Reference</p>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-white text-2xl">Building Codes & Ordinances</h1>
          </div>
          <p className="text-blue-200 text-sm mb-6 max-w-md">
            Browse local building codes, zoning rules, and city ordinances for South Florida municipalities.
          </p>

          {/* City tabs */}
          <div className="flex gap-2 flex-wrap">
            {cities.map(c => (
              <button
                key={c.id}
                onClick={() => handleCityChange(c)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  selectedCity?.id === c.id
                    ? "bg-white text-blue-900 shadow-md"
                    : "bg-white/10 text-white/80 hover:bg-white/20 border border-white/10"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 pb-20">
        {/* Search + filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search codes, sections, keywords..."
              className="flex-1 bg-transparent text-sm focus:outline-none text-gray-800 placeholder-gray-400"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-gray-300 hover:text-gray-500 text-xs">✕</button>
            )}
          </div>
          <div className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={catFilter}
              onChange={e => setCatFilter(e.target.value)}
              className="bg-transparent text-sm focus:outline-none text-gray-700 pr-2"
            >
              <option value="all">All Categories</option>
              {usedCategories.map(c => (
                <option key={c} value={c}>{CATEGORY_META[c]?.label || c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats bar */}
        {!loading && ordinances.length > 0 && (
          <div className="flex items-center gap-4 mb-5 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <strong className="text-gray-800">{filtered.length}</strong> section{filtered.length !== 1 ? "s" : ""}
              {search && ` matching "${search}"`}
            </span>
            {catFilter !== "all" && (
              <button onClick={() => setCatFilter("all")} className="text-xs text-blue-600 hover:underline">
                Clear filter
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
            <p className="text-sm text-gray-400">Loading ordinances for {selectedCity?.name}...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-14 h-14 text-gray-200 mx-auto mb-4" />
            <p className="font-semibold text-gray-600 text-lg mb-1">
              {search ? `No results for "${search}"` : `No ordinances loaded for ${selectedCity?.name}`}
            </p>
            <p className="text-sm text-gray-400">Try adjusting your search or category filter.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([chapter, items]) => (
              <div key={chapter}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px flex-1 bg-gray-200" />
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider px-2">{chapter}</p>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>
                <div className="space-y-2">
                  {items.map(o => <OrdCard key={o.id} ord={o} />)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}