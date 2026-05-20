import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { BookOpen, Search, ChevronDown, ChevronRight, ExternalLink, Loader2, MapPin } from "lucide-react";

const PRIMARY = "#004ac6";
const FONTS = { h: "'Manrope', system-ui, sans-serif", b: "'Plus Jakarta Sans', system-ui, sans-serif" };

const CITY_ORDER = ["Weston", "Hollywood", "Coral Springs", "Cooper City", "Fort Lauderdale"];

const CATEGORY_META = {
  zoning:          { label: "Zoning",          icon: "🏘️" },
  building:        { label: "Building",         icon: "🏗️" },
  fire_safety:     { label: "Fire Safety",      icon: "🔥" },
  electrical:      { label: "Electrical",       icon: "⚡" },
  plumbing:        { label: "Plumbing",         icon: "🔧" },
  environmental:   { label: "Environmental",    icon: "🌿" },
  administrative:  { label: "Administrative",   icon: "📋" },
  land_use:        { label: "Land Use",         icon: "🗺️" },
  subdivision:     { label: "Subdivision",      icon: "📐" },
  signs:           { label: "Signs",            icon: "🪧" },
  other:           { label: "Other",            icon: "📄" },
};

function OrdCard({ ord }) {
  const [expanded, setExpanded] = useState(false);
  const meta = CATEGORY_META[ord.category] || { label: ord.category, icon: "📄" };

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <button onClick={() => setExpanded(p => !p)} className="w-full text-left p-4 hover:bg-gray-50 transition-colors">
        <div className="flex items-start gap-3">
          <span className="text-lg shrink-0 mt-0.5">{meta.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-sm text-gray-800" style={{ fontFamily: FONTS.b }}>{ord.section_title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {ord.chapter_title && `${ord.chapter_title} · `}
                  {ord.section_number && `§${ord.section_number}`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">{meta.label}</span>
                {expanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
              </div>
            </div>
          </div>
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-50">
          <div className="pt-3 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap" style={{ fontFamily: FONTS.b }}>
            {ord.content}
          </div>
          {ord.effective_date && (
            <p className="text-xs text-gray-400 mt-3">Effective: {ord.effective_date}</p>
          )}
          {ord.ordinance_number && (
            <p className="text-xs text-gray-400">Ordinance: {ord.ordinance_number}</p>
          )}
          {ord.reference_url && (
            <a href={ord.reference_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-blue-600 hover:underline">
              <ExternalLink className="w-3 h-3" /> View full text on city website
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default function BuildingCodes() {
  const [cities, setCities]       = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [ordinances, setOrdinances] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [search, setSearch]       = useState("");
  const [catFilter, setCatFilter] = useState("all");

  useEffect(() => {
    base44.entities.City.list().then(all => {
      const filtered = CITY_ORDER.map(n => all.find(c => c.name === n)).filter(Boolean);
      setCities(filtered);
      if (filtered.length > 0) { setSelectedCity(filtered[0]); loadOrdinances(filtered[0].id); }
    });
  }, []);

  const loadOrdinances = async (cityId) => {
    setLoading(true);
    const ords = await base44.entities.CodeOfOrdinance.filter({ city_id: cityId, is_active: true }, "chapter_number", 100);
    setOrdinances(Array.isArray(ords) ? ords : []);
    setLoading(false);
  };

  const handleCityChange = (city) => {
    setSelectedCity(city);
    setSearch("");
    setCatFilter("all");
    loadOrdinances(city.id);
  };

  const filtered = ordinances.filter(o => {
    const matchCat = catFilter === "all" || o.category === catFilter;
    const matchSearch = !search || o.section_title?.toLowerCase().includes(search.toLowerCase())
      || o.chapter_title?.toLowerCase().includes(search.toLowerCase())
      || o.content?.toLowerCase().includes(search.toLowerCase())
      || o.tags?.toLowerCase().includes(search.toLowerCase());
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
    <div className="min-h-screen pb-8" style={{ background: "#f8f9ff" }}>
      <div className="px-4 pt-7 pb-5 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest mb-1 text-gray-400" style={{ fontFamily: FONTS.b }}>Tools</p>
          <h1 className="font-extrabold text-2xl text-gray-900 mb-4" style={{ fontFamily: FONTS.h }}>
            <BookOpen className="inline w-6 h-6 mr-2" style={{ color: PRIMARY }} />Building Codes & Ordinances
          </h1>

          {/* City tabs */}
          <div className="flex gap-1 flex-wrap">
            {cities.map(c => (
              <button key={c.id} onClick={() => handleCityChange(c)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${selectedCity?.id === c.id ? "text-white" : "text-gray-600 bg-gray-100 hover:bg-gray-200"}`}
                style={{ background: selectedCity?.id === c.id ? PRIMARY : undefined, fontFamily: FONTS.b }}>
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-5">
        {/* Search + category filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ordinances..."
              className="flex-1 bg-transparent text-sm focus:outline-none" style={{ fontFamily: FONTS.b }} />
          </div>
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none" style={{ fontFamily: FONTS.b }}>
            <option value="all">All Categories</option>
            {usedCategories.map(c => (
              <option key={c} value={c}>{CATEGORY_META[c]?.label || c}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="font-semibold text-gray-600" style={{ fontFamily: FONTS.h }}>
              {search ? `No results for "${search}"` : `No ordinances loaded for ${selectedCity?.name}`}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([chapter, items]) => (
              <div key={chapter}>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2" style={{ fontFamily: FONTS.b }}>{chapter}</p>
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