import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import * as db from "@/lib/db";
import { supabase } from "@/lib/supabaseClient";
import {
  Search, Building2, FileText, ArrowRight, Loader2,
  Hash, History, Lightbulb, Home, LayoutDashboard, FolderOpen, Bell
} from "lucide-react";

const PRIMARY = "#2563EB";
const CITIES = ["All Cities", "Miami", "Weston", "Coral Springs", "Hollywood", "Fort Lauderdale", "Hialeah", "Doral"];

// ── Search box inlined (uses PropertySearchBox logic directly) ──────────────
function SearchBar({ onSelect, cityFilter }) {
  const [input, setInput]     = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function handleSearch() {
    const q = input.trim();
    if (!q || q.length < 3) { setError("Enter at least 3 characters"); return; }
    setLoading(true); setError(""); setResults([]);
    try {
      const { data, error: err } = await supabase.rpc("search_properties", { search_query: q });
      if (err) throw err;
      if (!data || data.length === 0) { setError("No properties found. Try a different address, folio number, or owner name."); return; }
      setResults(data);
    } catch (e) {
      setError("Search unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center bg-white rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center gap-2 flex-1 px-4 py-3.5">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            value={input}
            onChange={e => { setInput(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="Enter an address, owner name, or folio..."
            className="flex-1 text-sm focus:outline-none text-gray-800 bg-transparent"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-5 py-3.5 bg-blue-600 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
        </button>
      </div>

      {error && (
        <p className="mt-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">{error}</p>
      )}

      {results.length > 0 && (
        <div className="mt-2 rounded-2xl border border-gray-200 bg-white shadow-lg overflow-hidden">
          {results.map((p, i) => (
            <button key={p.folio_number || i}
              onClick={() => { onSelect(p); setResults([]); setInput(""); }}
              className="w-full text-left px-4 py-3.5 hover:bg-blue-50 border-b border-gray-50 last:border-0 transition-colors">
              <p className="font-semibold text-sm text-gray-900 truncate">{p.full_address || p.folio_number}</p>
              <p className="text-xs text-gray-400 mt-0.5">{p.owner_name} · {p.city_name} · {p.folio_number}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Property detail view (unchanged logic, restyled) ────────────────────────
function PropertyDetail({ property, onBack }) {
  const [tab, setTab]           = useState("overview");
  const [permits, setPermits]   = useState([]);
  const [guides, setGuides]     = useState([]);
  const [loadingPermits, setLoadingPermits] = useState(false);

  useEffect(() => {
    setLoadingPermits(true);
    const isWeston = (property.city_name || "").toLowerCase() === "weston";
    Promise.all([
      isWeston
        ? supabase.from("weston_permits_view")
            .select("permit_number, permit_name, permit_type, permit_status, open_date")
            .eq("folio_number", property.folio_number)
            .order("open_date", { ascending: false })
            .limit(50)
            .then(({ data }) => data || [])
        : Promise.resolve([]),
      db.SubmissionGuide.filter({ folio_number: property.folio_number }),
    ]).then(([p, g]) => {
      setPermits(Array.isArray(p) ? p : []);
      setGuides(Array.isArray(g) ? g : []);
      setLoadingPermits(false);
    });
  }, [property.folio_number]);

  const STATUS_COLORS = {
    "Closed":  "bg-green-100 text-green-700",
    "Open":    "bg-blue-100 text-blue-700",
    "Expired": "bg-red-100 text-red-700",
    "Void":    "bg-gray-100 text-gray-600",
  };
  const getStatusColor = s => STATUS_COLORS[s] || "bg-amber-100 text-amber-700";

  const TABS = [
    { key: "overview",      label: "Overview" },
    { key: "permits",       label: `Permit History (${permits.length})` },
    { key: "applications",  label: `Applications (${guides.length})` },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white px-5 pt-10 pb-5 border-b border-gray-100">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-4">
          ← Back to search
        </button>
        <h2 className="font-extrabold text-xl text-gray-900 leading-tight">{property.full_address || property.folio_number}</h2>
        <p className="text-sm text-gray-400 mt-1">{property.city_name}, FL · Folio: {property.folio_number}</p>
        <Link
          to={`/ApplyForPermit?folio=${property.folio_number}&city=${encodeURIComponent(property.city_name || "")}`}
          className="inline-flex items-center gap-2 mt-4 px-4 py-2.5 rounded-2xl text-white font-bold text-sm no-underline"
          style={{ background: PRIMARY }}
        >
          <FileText className="w-4 h-4" /> Start Permit Application
        </Link>
      </div>

      <div className="px-4 pt-4 max-w-lg mx-auto">
        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-white rounded-2xl border border-gray-100 p-1 shadow-sm">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${tab === t.key ? "text-white shadow-sm" : "text-gray-500"}`}
              style={{ background: tab === t.key ? PRIMARY : "transparent" }}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          {tab === "overview" && (
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Owner", value: property.owner_name || null },
                { label: "Year Built", value: property.year_built || null },
                { label: "Total SF", value: parseInt(property.total_sqft) ? parseInt(property.total_sqft).toLocaleString() + " SF" : null },
                { label: "Beds / Baths", value: (parseInt(property.beds) || parseInt(property.baths)) ? `${parseInt(property.beds) || "—"} bed / ${parseInt(property.baths) || "—"} bath` : null },
                { label: "Homestead", value: property.homestead_flag === "Y" ? "Yes" : property.homestead_flag === "N" ? "No" : null },
                { label: "ZIP Code", value: property.zip_code || null },
                { label: "Building Value", value: parseInt(property.building_value) ? `$${parseInt(property.building_value).toLocaleString()}` : null },
              ].filter(f => f.value).map(field => (
                <div key={field.label} className="py-2 border-b border-gray-50 last:border-0">
                  <p className="text-xs text-gray-400 mb-0.5">{field.label}</p>
                  <p className="text-sm font-semibold text-gray-800">{field.value}</p>
                </div>
              ))}
            </div>
          )}

          {tab === "permits" && (
            loadingPermits ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-blue-500" /></div>
            ) : permits.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">No permit records found for this property.</p>
            ) : (
              <div className="space-y-3">
                {permits.map((p, i) => (
                  <div key={p.permit_number || i} className="flex items-start justify-between gap-3 py-3 border-b border-gray-50 last:border-0">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${getStatusColor(p.permit_status)}`}>{p.permit_status || "—"}</span>
                        <span className="text-xs text-gray-400 font-mono">{p.permit_number}</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800">{p.permit_name || p.permit_type}</p>
                    </div>
                    <p className="text-xs text-gray-400 shrink-0">{p.open_date}</p>
                  </div>
                ))}
              </div>
            )
          )}

          {tab === "applications" && (
            <div className="space-y-3">
              {guides.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm mb-3">No applications for this property yet.</p>
                  <Link to={`/ApplyForPermit?folio=${property.folio_number}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold no-underline"
                    style={{ background: PRIMARY }}>
                    <FileText className="w-4 h-4" /> Start Application
                  </Link>
                </div>
              ) : guides.map(g => (
                <Link key={g.id} to={`/ApplyForPermit?resume=${g.id}`}
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all no-underline">
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{g.permit_type_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{g.city_name} · {g.phase?.replace("_", " ")}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

function BottomNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-2 z-50">
      <Link to="/" className="flex flex-col items-center gap-1 px-4 py-1 no-underline">
        <Home className="w-5 h-5 text-gray-400 mt-1.5" />
        <span className="text-xs text-gray-400">Home</span>
      </Link>
      <Link to="/ApplyForPermit" className="flex flex-col items-center gap-1 px-4 py-1 no-underline">
        <LayoutDashboard className="w-5 h-5 text-gray-400 mt-1.5" />
        <span className="text-xs text-gray-400">Dashboard</span>
      </Link>
      <Link to="/MyProjects" className="flex flex-col items-center gap-1 px-4 py-1 no-underline">
        <FolderOpen className="w-5 h-5 text-gray-400 mt-1.5" />
        <span className="text-xs text-gray-400">Projects</span>
      </Link>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function MyProperties() {
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [cityFilter, setCityFilter] = useState("All Cities");

  if (selectedProperty) {
    return <PropertyDetail property={selectedProperty} onBack={() => setSelectedProperty(null)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Blue hero header */}
      <div className="px-5 pt-12 pb-8" style={{ background: "linear-gradient(135deg, #1e40af 0%, #2563eb 100%)" }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-white font-bold text-xs">OP</span>
            </div>
            <span className="text-white font-bold text-base">HomeAssist</span>
          </div>
          <Bell className="w-5 h-5 text-white/70" />
        </div>

        <h1 className="text-2xl font-extrabold text-white mb-1">Property Records</h1>
        <p className="text-blue-200 text-sm mb-5 leading-relaxed">Access historical permits, zoning data, and official building details instantly.</p>

        <SearchBar onSelect={setSelectedProperty} cityFilter={cityFilter} />

        {/* City filter chips */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-hide">
          {CITIES.map(c => (
            <button key={c}
              onClick={() => setCityFilter(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                cityFilter === c ? "bg-white text-blue-700" : "bg-white/20 text-white hover:bg-white/30"
              }`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-6 max-w-lg mx-auto">
        {/* How to search tips */}
        <h2 className="text-base font-bold text-gray-900 mb-4">How to search effectively</h2>
        <div className="space-y-3 mb-8">
          {[
            {
              icon: Hash,
              title: "Use Folio Numbers",
              desc: "For the most accurate results, use the unique 13-digit folio number assigned to the property.",
            },
            {
              icon: History,
              title: "Historical Data",
              desc: "Permit history dating back to 1995 is currently available for digitized parcels.",
            },
            {
              icon: Lightbulb,
              title: "Search Shortcuts",
              desc: 'Omit street suffixes (like "St" or "Ave") if your search doesn\'t return immediate results.',
            },
          ].map(tip => {
            const Icon = tip.icon;
            return (
              <div key={tip.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-sm mb-1">{tip.title}</p>
                  <p className="text-xs text-gray-400 leading-relaxed">{tip.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        <div className="text-center py-8">
          <div className="relative w-24 h-24 mx-auto mb-4">
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
              <Search className="w-10 h-10 text-gray-300" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center border-2 border-white">
              <Building2 className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <h3 className="font-bold text-gray-700 text-base mb-2">Search for a property</h3>
          <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">
            Your results will appear here once you enter a search query above. We'll show you ownership, tax assessments, and open violations.
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}