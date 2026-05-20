import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import * as db from "@/lib/db";
import { supabase } from "@/lib/supabaseClient";
import { Search, Building2, MapPin, Calendar, FileText, ArrowRight, Loader2, ChevronRight } from "lucide-react";

const PRIMARY = "#004ac6";
const FONTS = { h: "'Manrope', system-ui, sans-serif", b: "'Plus Jakarta Sans', system-ui, sans-serif" };

function PropertyCard({ property, onClick }) {
  return (
    <button
      onClick={() => onClick(property)}
      className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all p-5"
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#eff4ff" }}>
          <Building2 className="w-5 h-5" style={{ color: PRIMARY }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-sm leading-tight truncate" style={{ fontFamily: FONTS.h }}>{property.full_address || "Address not available"}</p>
          <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: FONTS.b }}>
            {property.city_name} · Folio: {property.folio_number}
          </p>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {property.year_built && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Built {property.year_built}
              </span>
            )}
            {property.total_sqft && (
              <span className="text-xs text-gray-500">{Number(property.total_sqft).toLocaleString()} SF</span>
            )}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
      </div>
    </button>
  );
}

function PropertyDetail({ property, onBack }) {
  const [tab, setTab] = useState("overview");
  const [permits, setPermits] = useState([]);
  const [guides, setGuides] = useState([]);
  const [loadingPermits, setLoadingPermits] = useState(false);
  const navigate = useNavigate();

  const addr = property.full_address || property.folio_number;

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
  const getStatusColor = (status) => STATUS_COLORS[status] || "bg-amber-100 text-amber-700";

  const TABS = [
    { key: "overview", label: "Overview" },
    { key: "permits",  label: `Permit History (${permits.length})` },
    { key: "applications", label: `Applications (${guides.length})` },
  ];

  return (
    <div>
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-4 transition-colors" style={{ fontFamily: FONTS.b }}>
          ← Back to search
        </button>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-extrabold text-xl text-gray-900" style={{ fontFamily: FONTS.h }}>{addr}</h2>
            <p className="text-sm text-gray-500 mt-0.5" style={{ fontFamily: FONTS.b }}>{property.city_name}, FL · Folio: {property.folio_number}</p>
          </div>
          <Link
            to={`/ApplyForPermit?folio=${property.folio_number}&city=${encodeURIComponent(property.city_name || "")}`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-bold text-sm"
            style={{ background: PRIMARY, fontFamily: FONTS.h, textDecoration: "none" }}
          >
            <FileText className="w-4 h-4" /> Start Permit Application
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-white rounded-xl border border-gray-100 p-1 shadow-sm">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t.key ? "text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            style={{ background: tab === t.key ? PRIMARY : "transparent", fontFamily: FONTS.b }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        {tab === "overview" && (
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { label: "Owner", value: property.owner_name },
              { label: "Year Built", value: property.year_built },
              { label: "Total SF", value: property.total_sqft ? Number(property.total_sqft).toLocaleString() + " SF" : null },
              { label: "Under-Air SF", value: property.under_air_sqft ? Number(property.under_air_sqft).toLocaleString() + " SF" : null },
              { label: "Beds / Baths", value: property.beds && property.baths ? `${property.beds} bed / ${property.baths} bath` : null },
              { label: "Homestead", value: property.homestead_flag === "Y" || property.homestead_flag === true ? "Yes" : property.homestead_flag === "N" || property.homestead_flag === false ? "No" : null },
              { label: "ZIP Code", value: property.zip_code },
              { label: "Building Value", value: property.building_value ? `$${Number(property.building_value).toLocaleString()}` : null },
            ].filter(f => f.value).map(field => (
              <div key={field.label} className="py-2 border-b border-gray-50 last:border-0">
                <p className="text-xs text-gray-400 mb-0.5" style={{ fontFamily: FONTS.b }}>{field.label}</p>
                <p className="text-sm font-semibold text-gray-800" style={{ fontFamily: FONTS.b }}>{field.value}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "permits" && (
          loadingPermits ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-blue-500" /></div>
          ) : permits.length === 0 ? (
            <p className="text-center text-gray-400 py-8" style={{ fontFamily: FONTS.b }}>No permit records found for this property.</p>
          ) : (
            <div className="space-y-3">
              {permits.map((p, i) => (
                <div key={p.permit_number || i} className="flex items-start justify-between gap-3 py-3 border-b border-gray-50 last:border-0">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${getStatusColor(p.permit_status)}`}>
                        {p.permit_status || "—"}
                      </span>
                      <span className="text-xs text-gray-400 font-mono">{p.permit_number}</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800" style={{ fontFamily: FONTS.b }}>{p.permit_name || p.permit_type}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-400">{p.open_date}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {tab === "applications" && (
          <div className="space-y-3">
            {guides.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm mb-3" style={{ fontFamily: FONTS.b }}>No applications for this property yet.</p>
                <Link to={`/ApplyForPermit?folio=${property.folio_number}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold"
                  style={{ background: PRIMARY, textDecoration: "none" }}>
                  <FileText className="w-4 h-4" /> Start Application
                </Link>
              </div>
            ) : guides.map(g => (
              <Link key={g.id} to={`/ApplyForPermit?resume=${g.id}`}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all"
                style={{ textDecoration: "none" }}>
                <div>
                  <p className="font-semibold text-sm text-gray-800" style={{ fontFamily: FONTS.b }}>{g.permit_type_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{g.city_name} · Phase: {g.phase?.replace("_", " ")}</p>
                  {g.questions_total > 0 && (
                    <div className="mt-2">
                      <div className="h-1.5 bg-gray-100 rounded-full w-40 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${Math.round((g.questions_answered / g.questions_total) * 100)}%`, background: PRIMARY }} />
                      </div>
                    </div>
                  )}
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyProperties() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q") || "";
    if (q) { setQuery(q); doSearch(q); }
    base44.auth.me().then(u => setCurrentUser(u || null)).catch(() => {});
  }, []);

  const doSearch = async (q) => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    try {
      const resp = await base44.functions.invoke("propertySearch", { q: q.trim() });
      setResults(Array.isArray(resp.data?.data) ? resp.data.data : []);
    } catch {
      setResults([]);
    }
    setSearching(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    doSearch(query);
  };

  if (selectedProperty) {
    return (
      <div className="min-h-screen pb-8" style={{ background: "#f8f9ff" }}>
        <div className="max-w-4xl mx-auto px-4 pt-6">
          <PropertyDetail property={selectedProperty} onBack={() => setSelectedProperty(null)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8" style={{ background: "#f8f9ff" }}>
      {/* Header */}
      <div className="px-4 pt-7 pb-6 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest mb-1 text-gray-400" style={{ fontFamily: FONTS.b }}>My Properties</p>
          <h1 className="font-extrabold text-2xl text-gray-900 mb-4" style={{ fontFamily: FONTS.h }}>Property Search</h1>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by address, owner name, or folio number..."
                className="flex-1 bg-transparent text-sm focus:outline-none text-gray-800"
                style={{ fontFamily: FONTS.b }}
              />
            </div>
            <button type="submit" disabled={searching}
              className="px-5 py-2.5 rounded-xl text-white font-bold text-sm flex items-center gap-2 disabled:opacity-60"
              style={{ background: PRIMARY, fontFamily: FONTS.h }}>
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-5">
        {searching && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500 mr-2" />
            <span className="text-gray-500 text-sm" style={{ fontFamily: FONTS.b }}>Searching properties...</span>
          </div>
        )}

        {!searching && results.length === 0 && query && (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="font-semibold text-gray-600" style={{ fontFamily: FONTS.h }}>No properties found</p>
            <p className="text-sm text-gray-400 mt-1" style={{ fontFamily: FONTS.b }}>Try a different address or folio number</p>
          </div>
        )}

        {!searching && results.length === 0 && !query && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "#eff4ff" }}>
              <Building2 className="w-8 h-8" style={{ color: PRIMARY }} />
            </div>
            <h3 className="font-bold text-gray-700 text-lg mb-2" style={{ fontFamily: FONTS.h }}>Search for a Property</h3>
            <p className="text-gray-400 text-sm max-w-sm mx-auto" style={{ fontFamily: FONTS.b }}>
              Enter an address, owner name, or folio number to find property records and permit history.
            </p>
          </div>
        )}

        {results.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 mb-3" style={{ fontFamily: FONTS.b }}>{results.length} result{results.length !== 1 ? "s" : ""} found</p>
            <div className="space-y-3">
              {results.map((property, i) => (
                <PropertyCard key={property.folio_number || i} property={property} onClick={setSelectedProperty} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}