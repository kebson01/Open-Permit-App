import { useState, useEffect } from "react";
import { Search, Building2, Loader2, MapPin, ArrowLeft, Home, ChevronRight, ClipboardList, ExternalLink, Calculator } from "lucide-react";
import { useCities } from "@/hooks/useCities";
import { searchProperties } from "@/utils/supabaseData";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

const CITY_PORTALS = {
  "Weston": "https://www.westonfl.org/Permits",
  "Coral Springs": "https://www.coralsprings.gov/Government/Departments/Building/Online-Permitting-eTrakit",
  "Fort Lauderdale": "https://lauderbuild.fortlauderdale.gov/",
  "Hollywood": "https://aca-prod.accela.com/HOLLYWOOD/Default.aspx",
  "Cooper City": "https://coopercity.gov/?SEC=AD7C348E-C110-425A-B91C-2CA5769BF937",
  "Sunrise": "https://sunrisefl.gov/openforbusiness",
};



const STATUS_STYLES = {
  "Completed": { bg: "#DCFCE7", color: "#166534" },
  "Active":    { bg: "#EFF6FF", color: "#1D4ED8" },
  "In Review": { bg: "#FFFBEB", color: "#92400E" },
  "Expired":   { bg: "#F1F5F9", color: "#475569" },
  "Cancelled": { bg: "#FEF2F2", color: "#991B1B" },
};

function isFolioSearch(term) {
  return /^[0-9A-Za-z]{8,15}$/.test(term.trim()) && !/\s/.test(term.trim());
}

async function getPermitHistory(folioNumber) {
  const { data, error } = await supabase
    .from("weston_permit_records")
    .select("RECORD_ID, PERMIT_TYPE, PERMIT_STATUS, STATUS_NORMALIZED, OPEN_DATE, PARCEL_NBR")
    .eq("PARCEL_NBR", folioNumber)
    .order("OPEN_DATE", { ascending: false })
    .limit(50);

  if (error) return [];
  return data || [];
}

function PropertyCard({ property: p, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-300 transition-all flex items-start justify-between gap-3"
    >
      <div className="flex gap-3 items-start min-w-0">
        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
          <Home className="w-4 h-4 text-blue-600" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 text-sm leading-snug truncate">{p.full_address || p.FOLIO_NUMBER}</p>
          <p className="text-gray-500 text-xs flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 shrink-0" />
            {p.city_name}{p.SITUS_ZIP_CODE ? `, FL ${p.SITUS_ZIP_CODE}` : p.city_name ? ", FL" : ""}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {p.USE_TYPE && <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{p.USE_TYPE}</span>}
            {p.BLDG_YEAR_BUILT && <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">Built {p.BLDG_YEAR_BUILT}</span>}
            {p.BEDS && <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{p.BEDS} bd / {p.BATHS || "?"} ba</span>}
            {p.BLDG_TOT_SQ_FOOTAGE && <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{Number(p.BLDG_TOT_SQ_FOOTAGE).toLocaleString()} sqft</span>}
          </div>
          <p className="text-xs text-gray-400 mt-1 font-mono">Folio: {p.FOLIO_NUMBER}</p>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 mt-1" />
    </button>
  );
}

function PropertyDetail({ property: p, onBack }) {
  const [permits, setPermits] = useState(null);
  const [loadingPermits, setLoadingPermits] = useState(false);

  const isWeston = p.city_name === "Weston";
  const portalUrl = CITY_PORTALS[p.city_name];

  // Load permits for Weston on mount
  useEffect(() => {
    if (isWeston) {
      setLoadingPermits(true);
      getPermitHistory(p.FOLIO_NUMBER).then(data => {
        setPermits(data);
        setLoadingPermits(false);
      });
    }
  }, [p.FOLIO_NUMBER]);

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 -ml-1 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to results
      </button>

      {/* Header */}
      <div className="rounded-2xl p-5 mb-5 text-white" style={{ background: "linear-gradient(135deg, #0D2B5E, #0F3575)" }}>
        <div className="flex items-start gap-3">
          <Building2 className="w-6 h-6 text-blue-300 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-xl font-bold leading-tight">{p.full_address || p.FOLIO_NUMBER}</h2>
            <p className="text-blue-200 text-sm mt-0.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {p.city_name}{p.SITUS_ZIP_CODE ? `, FL ${p.SITUS_ZIP_CODE}` : p.city_name ? ", FL" : ""}
            </p>
            <p className="text-blue-300 text-xs mt-1 font-mono">Folio: {p.FOLIO_NUMBER}</p>
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid sm:grid-cols-2 gap-4 mb-5">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Property Type</h3>
          {(p.use_type_label || p.USE_TYPE) && (
            <div className="flex justify-between py-1.5">
              <span className="text-sm text-gray-500">Property Type</span>
              <span className="text-sm font-medium text-gray-900">{p.use_type_label || p.USE_TYPE}</span>
            </div>
          )}
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Building Details</h3>
          {p.BLDG_YEAR_BUILT && <div className="flex justify-between py-1.5 border-b border-gray-50"><span className="text-sm text-gray-500">Year Built</span><span className="text-sm font-medium text-gray-900">{p.BLDG_YEAR_BUILT}</span></div>}
          {p.BLDG_TOT_SQ_FOOTAGE && <div className="flex justify-between py-1.5 border-b border-gray-50"><span className="text-sm text-gray-500">Total Sq Ft</span><span className="text-sm font-medium text-gray-900">{Number(p.BLDG_TOT_SQ_FOOTAGE).toLocaleString()}</span></div>}
          {p.BLDG_UNDER_AIR_SQ_FOOTAGE && <div className="flex justify-between py-1.5 border-b border-gray-50"><span className="text-sm text-gray-500">Under Air</span><span className="text-sm font-medium text-gray-900">{Number(p.BLDG_UNDER_AIR_SQ_FOOTAGE).toLocaleString()}</span></div>}
          {(p.BEDS || p.BATHS) && <div className="flex justify-between py-1.5"><span className="text-sm text-gray-500">Beds / Baths</span><span className="text-sm font-medium text-gray-900">{p.BEDS || "—"} / {p.BATHS || "—"}</span></div>}
        </div>
      </div>

      {/* Permit History */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-5">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-blue-600" />
          <h3 className="font-semibold text-gray-800 text-sm">Permit History</h3>
          {permits && permits.length > 0 && (
            <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {permits.length} record{permits.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {!isWeston ? (
          <div className="text-center py-10 px-4">
            <p className="text-gray-700 font-medium">Permit history coming soon</p>
            <p className="text-gray-400 text-sm mt-1">Search directly at the city's permit portal.</p>
            {portalUrl && (
              <a href={portalUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-3 text-sm text-blue-600 hover:underline font-medium">
                <ExternalLink className="w-3.5 h-3.5" /> {p.city_name} Permit Portal →
              </a>
            )}
          </div>
        ) : loadingPermits ? (
          <div className="flex items-center justify-center gap-2 text-gray-400 py-8">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading permits...
          </div>
        ) : permits && permits.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-600 font-medium">No permit records found</p>
            <p className="text-gray-400 text-sm mt-1 max-w-xs mx-auto">No permitted work on file for this folio.</p>
          </div>
        ) : permits && permits.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Record ID", "Type", "Status", "Opened"].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {permits.map((r, i) => (
                  <tr key={r.RECORD_ID || i} className="hover:bg-blue-50/30">
                    <td className="px-4 py-2.5 font-mono text-xs text-blue-700 whitespace-nowrap">{r.RECORD_ID || "—"}</td>
                    <td className="px-4 py-2.5 text-gray-700 max-w-xs"><span className="line-clamp-1">{r.PERMIT_TYPE || "—"}</span></td>
                    <td className="px-4 py-2.5">
                      {r.STATUS_NORMALIZED ? (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
                          style={{
                            backgroundColor: STATUS_STYLES[r.STATUS_NORMALIZED]?.bg || "#F1F5F9",
                            color: STATUS_STYLES[r.STATUS_NORMALIZED]?.color || "#475569",
                          }}>
                          {r.STATUS_NORMALIZED}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">{r.PERMIT_STATUS || "—"}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-400 whitespace-nowrap">{formatDate(r.OPEN_DATE)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap justify-center gap-3 mt-5">
        <Link
          to={`/PermitGuide?city=${encodeURIComponent(p.city_name || "")}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #0D2B5E, #0F3575)" }}
        >
          <Home className="w-4 h-4" /> Start a Permit for This Property →
        </Link>
        <Link
          to={`/FeeCalculator?city=${encodeURIComponent(p.city_name || "")}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-blue-700 border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors"
        >
          <Calculator className="w-4 h-4" /> Estimate Permit Costs →
        </Link>
        {portalUrl && (
          <a href={portalUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
            <ExternalLink className="w-4 h-4" /> Apply / Search Permits at {p.city_name}
          </a>
        )}
      </div>
    </div>
  );
}

export default function PropertyGuide() {
  const urlParams = new URLSearchParams(window.location.search);
  const urlCity = urlParams.get("city") || "";

  const { cities, loading: citiesLoading } = useCities();
  const [query, setQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState(urlCity || "All Cities");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(null);

  const doSearch = async () => {
    if (!query.trim() || query.trim().length < 3) return;
    const type = isFolioSearch(query) ? "folio" : "address";
    setLoading(true);
    setSearched(true);
    setSelected(null);
    setError(null);
    setResults([]);
    const data = await searchProperties(query, selectedCity, type);
    setResults(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="px-4 pt-8 pb-6" style={{ background: "linear-gradient(135deg, #0D2B5E 0%, #0F3575 100%)" }}>
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-1">Property Search</h1>
          <p className="text-blue-200 text-sm mb-5">
            Find public records and assessment details for any Broward County property.
          </p>

          {/* Search bar */}
          <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-3 shadow-lg mb-3">
            <Search className="w-5 h-5 text-gray-400 shrink-0" />
            <input
              className="flex-1 border-0 outline-none text-sm text-gray-800 placeholder-gray-400 bg-transparent"
              placeholder="Enter address or folio number..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && doSearch()}
            />
          </div>

          {/* City filter + Search button row */}
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-3 h-11">
              <MapPin className="w-4 h-4 text-blue-300 shrink-0" />
              <select
                value={selectedCity}
                onChange={e => setSelectedCity(e.target.value)}
                className="flex-1 bg-transparent text-white text-sm focus:outline-none"
              >
                <option value="All Cities" className="text-gray-800">All Cities</option>
              {citiesLoading
                ? null
                : cities.map(c => <option key={c.name} value={c.name} className="text-gray-800">{c.name}</option>)
              }
              </select>
            </div>
            <button
              onClick={doSearch}
              disabled={loading}
              className="px-5 h-11 rounded-xl text-white font-semibold text-sm shrink-0 disabled:opacity-60 transition-opacity hover:opacity-90"
              style={{ background: "#3B82F6" }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
            </button>
          </div>

          {/* Info notice */}
          <div className="mt-3 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-blue-900/40 border border-blue-400/20">
            <Search className="w-3.5 h-3.5 text-blue-300 mt-0.5 shrink-0" />
            <p className="text-blue-200 text-xs">Look up historical permits, zoning classifications, and building details for any registered property.</p>
          </div>
        </div>
      </div>

      {/* Results — desktop has sidebar */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 pb-24 md:pb-8">
        <div className="md:flex md:gap-6 md:items-start">

          {/* Left sidebar (desktop only) */}
          {!selected && (
            <div className="hidden md:block w-56 shrink-0 space-y-4">
              {/* Transparency notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-xs font-bold text-blue-800 mb-1">Public Access Records</p>
                <p className="text-xs text-blue-700 leading-relaxed">Look up historical permits, zoning classifications, and building details for any registered property.</p>
              </div>

              {/* Recent searches hint */}
              {searched && results.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Results</p>
                  <p className="text-sm font-bold text-gray-800">{results.length} propert{results.length === 1 ? "y" : "ies"} found</p>
                </div>
              )}
            </div>
          )}

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {selected ? (
              <PropertyDetail property={selected} onBack={() => setSelected(null)} />
            ) : (
              <>
                {loading && (
                  <div className="flex items-center justify-center gap-2 text-blue-600 py-12">
                    <Loader2 className="w-5 h-5 animate-spin" /> Searching properties...
                  </div>
                )}
                {error && (
                  <div className="text-center py-8 text-red-600 bg-red-50 rounded-xl border border-red-100">
                    <p className="font-medium">Search error</p>
                    <p className="text-sm mt-1">{error}</p>
                  </div>
                )}
                {searched && !loading && !error && results.length === 0 && (
                  <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
                    <Search className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                    <p className="font-semibold text-gray-700">No properties found</p>
                    <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
                      Try a shorter address or folio number. Only Broward County properties are available.
                    </p>
                  </div>
                )}
                {searched && !loading && results.length > 0 && (
                  <p className="text-sm text-gray-500 mb-4 md:hidden">{results.length} propert{results.length === 1 ? "y" : "ies"} found</p>
                )}
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {results.map((prop, i) => (
                    <PropertyCard key={prop.FOLIO_NUMBER || i} property={prop} onClick={() => setSelected(prop)} />
                  ))}
                </div>
                {!searched && !loading && (
                  <div className="text-center py-16 text-gray-400">
                    <Search className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                    <p className="font-medium text-gray-700 text-lg">Search for a property</p>
                    <p className="text-sm mt-2 text-gray-500 max-w-sm mx-auto">
                      Enter an address or folio number to look up any Broward County property and its permit history.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}