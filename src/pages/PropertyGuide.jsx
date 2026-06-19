import { useState, useEffect } from "react";
import { Search, Building2, Loader2, MapPin, ArrowLeft, Home, ChevronRight, ClipboardList, ExternalLink, Calculator, Info } from "lucide-react";
import { HintBanner } from "@/components/ui/HintTooltip";
import { useCities } from "@/hooks/useCities";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { base44 } from "@/api/base44Client";
import PropertySearchBox from "@/components/property/PropertySearchBox";

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
  "Closed":    { bg: "#ECFDF5", color: "#059669" },
  "Finaled":   { bg: "#ECFDF5", color: "#059669" },
  "Completed": { bg: "#ECFDF5", color: "#059669" },
  "Open":      { bg: "#eaf1f8", color: "#003466" },
  "Issued":    { bg: "#eaf1f8", color: "#003466" },
  "Active":    { bg: "#eaf1f8", color: "#003466" },
  "In Review": { bg: "#FFFBEB", color: "#D97706" },
  "Expired":   { bg: "#FFDAD6", color: "#BA1A1A" },
  "Void":      { bg: "#EDEDF8", color: "#434654" },
  "Voided":    { bg: "#EDEDF8", color: "#434654" },
  "Cancelled": { bg: "#EDEDF8", color: "#434654" },
};

async function getPermitHistory(folioNumber) {
  const { data, error } = await supabase
    .from("weston_permits_view")
    .select("permit_number, permit_name, permit_type, permit_status, status_normalized, open_date")
    .eq("folio_number", folioNumber)
    .order("open_date", { ascending: false })
    .limit(50);

  if (error) return [];
  return data || [];
}

function PropertyCard({ property: p, onClick }) {
  const zip = p.zip_code || "";
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all flex items-start justify-between gap-3"
      style={{ borderColor: "#C3C5D7" }}
    >
      <div className="flex gap-3 items-start min-w-0">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#eaf1f8" }}>
          <Home className="w-4 h-4" style={{ color: "#003466" }} />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 text-sm leading-snug truncate">{p.full_address || p.folio_number}</p>
          <p className="text-gray-500 text-xs flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 shrink-0" />
            {p.city_name}{zip ? `, FL ${zip}` : p.city_name ? ", FL" : ""}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {p.year_built && <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">Built {p.year_built}</span>}
            {p.beds && <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{p.beds} bd / {p.baths || "?"} ba</span>}
            {p.under_air_sqft && <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{Number(p.under_air_sqft).toLocaleString()} sqft</span>}
          </div>
          <p className="text-xs text-gray-400 mt-1 font-mono">Folio: {p.folio_number}</p>
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
      getPermitHistory(p.folio_number).then(data => {
        setPermits(data);
        setLoadingPermits(false);
      });
    }
  }, [p.folio_number]);

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 -ml-1 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to results
      </button>

      {/* Header */}
      <div className="rounded-2xl p-5 mb-5 text-white" style={{ background: "#003466" }}>
        <div className="flex items-start gap-3">
          <Building2 className="w-6 h-6 text-white shrink-0 mt-0.5" />
          <div>
            <h2 className="text-xl font-bold leading-tight">{p.full_address || p.folio_number}</h2>
            <p className="text-sm mt-0.5 flex items-center gap-1" style={{ color: "rgba(255,255,255,0.8)" }}>
              <MapPin className="w-3.5 h-3.5" />
              {p.city_name}{p.zip_code ? `, FL ${p.zip_code}` : p.city_name ? ", FL" : ""}
            </p>
            <p className="text-xs mt-1 font-mono" style={{ color: "rgba(255,255,255,0.7)" }}>Folio: {p.folio_number}</p>
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid sm:grid-cols-2 gap-4 mb-5">
        <div className="bg-white rounded-xl p-4" style={{ border: "1px solid #C3C5D7" }}>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#434654" }}>Property Type</h3>
          {p.use_type && (
            <div className="flex justify-between py-1.5">
              <span className="text-sm text-gray-500">Property Type</span>
              <span className="text-sm font-medium text-gray-900">{p.use_type}</span>
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl p-4" style={{ border: "1px solid #C3C5D7" }}>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#434654" }}>Building Details</h3>
          {p.year_built && <div className="flex justify-between py-1.5 border-b border-gray-50"><span className="text-sm text-gray-500">Year Built</span><span className="text-sm font-medium text-gray-900">{p.year_built}</span></div>}
          {p.total_sqft && <div className="flex justify-between py-1.5 border-b border-gray-50"><span className="text-sm text-gray-500">Total Sq Ft</span><span className="text-sm font-medium text-gray-900">{Number(p.total_sqft).toLocaleString()}</span></div>}
          {p.under_air_sqft && <div className="flex justify-between py-1.5 border-b border-gray-50"><span className="text-sm text-gray-500">Under Air</span><span className="text-sm font-medium text-gray-900">{Number(p.under_air_sqft).toLocaleString()}</span></div>}
          {(p.beds || p.baths) && <div className="flex justify-between py-1.5"><span className="text-sm text-gray-500">Beds / Baths</span><span className="text-sm font-medium text-gray-900">{p.beds || "—"} / {p.baths || "—"}</span></div>}
        </div>
      </div>

      {/* Permit History */}
      <div className="bg-white rounded-xl overflow-hidden mb-5" style={{ border: "1px solid #C3C5D7" }}>
        <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid #C3C5D7" }}>
          <ClipboardList className="w-4 h-4" style={{ color: "#003466" }} />
          <h3 className="font-semibold text-sm" style={{ color: "#191B23" }}>Permit History</h3>
          <span className="ml-1 group relative">
            <Info className="w-3.5 h-3.5 cursor-pointer" style={{ color: "#003466" }} />
            <span className="hidden group-hover:block absolute left-4 top-0 z-50 w-56 bg-white rounded-xl shadow-xl p-3 text-xs text-gray-700 leading-relaxed" style={{ borderColor: "#C3C5D7", border: "1px solid #C3C5D7" }}>
              Showing permits on record for this property from the City of Weston's permit database. Records from other cities will be added as they become available.
            </span>
          </span>
          {permits && permits.length > 0 && (
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: "#EDEDF8", color: "#434654" }}>
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
                className="inline-flex items-center gap-1 mt-3 text-sm hover:underline font-medium" style={{ color: "#003466" }}>
                <ExternalLink className="w-3.5 h-3.5" /> {p.city_name} Permit Portal →
              </a>
            )}
          </div>
        ) : loadingPermits ? (
          <div className="flex items-center justify-center gap-2 py-8" style={{ color: "#434654" }}>
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
              <thead style={{ background: "#EDEDF8", borderBottom: "1px solid #C3C5D7" }}>
                <tr>
                  {["Record ID", "Type", "Status", "Opened"].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium uppercase tracking-wide whitespace-nowrap" style={{ color: "#434654" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody style={{ borderColor: "#C3C5D7" }}>
                {permits.map((r, i) => (
                  <tr key={r.permit_number || i} style={{ borderBottom: "1px solid #C3C5D7" }}>
                    <td className="px-4 py-2.5 font-mono text-xs whitespace-nowrap" style={{ color: "#003466" }}>{r.permit_number || "—"}</td>
                    <td className="px-4 py-2.5 text-gray-700 max-w-xs"><span className="line-clamp-1">{r.permit_name || r.permit_type || "—"}</span></td>
                    <td className="px-4 py-2.5">
                      {r.status_normalized ? (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
                          style={{
                            backgroundColor: STATUS_STYLES[r.status_normalized]?.bg || "#F1F5F9",
                            color: STATUS_STYLES[r.status_normalized]?.color || "#475569",
                          }}>
                          {r.status_normalized}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">{r.permit_status || "—"}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-400 whitespace-nowrap">{formatDate(r.open_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap justify-center gap-3 mt-5">
        <Link
           to={`/ApplyForPermit?city=${encodeURIComponent(p.city_name || "")}&folio=${encodeURIComponent(p.folio_number || "")}`}
           className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
           style={{ background: "#003466" }}
         >
           <Home className="w-4 h-4" /> Start a Permit for This Property →
         </Link>
         <Link
           to={`/FeeCalculator?city=${encodeURIComponent(p.city_name || "")}`}
           className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors hover:opacity-90"
           style={{ color: "#003466", borderColor: "#cfe0f0", background: "#eaf1f8", border: "1px solid #cfe0f0" }}
         >
          <Calculator className="w-4 h-4" /> Estimate Permit Costs →
        </Link>
        {portalUrl && (
          <a href={portalUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-colors" style={{ color: "#434654", borderColor: "#C3C5D7", border: "1px solid #C3C5D7", background: "#FFFFFF" }}>
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
  const [selectedCity, setSelectedCity] = useState(urlCity || "All Cities");
  const [selected, setSelected] = useState(null);

  return (
    <div className="min-h-screen" style={{ background: "#f7f9fb" }}>
      {/* Header */}
      <div className="px-5 pt-8 pb-7" style={{ background: "linear-gradient(135deg, #003466 0%, #00489a 100%)" }}>
      <div className="max-w-2xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.45)" }}>Property Search</p>
          <h1 className="font-bold text-white leading-tight mb-2" style={{ fontSize: "clamp(22px, 4vw, 30px)" }}>Search Any Property</h1>
          <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.55)" }}>
            Search Broward County's property database to find property details, ownership information, building characteristics, and permit history — all in one place.
          </p>

          {/* City filter row */}
          <div className="flex items-center gap-2 rounded-xl px-3 h-11 mb-3" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}>
            <MapPin className="w-4 h-4 text-white shrink-0" />
            <select
              value={selectedCity}
              onChange={e => setSelectedCity(e.target.value)}
              className="flex-1 bg-transparent text-white text-sm focus:outline-none"
            >
              <option value="All Cities" className="text-gray-800">All Cities</option>
              {!citiesLoading && cities.map(c => (
                <option key={c.name} value={c.name} className="text-gray-800">{c.name}</option>
              ))}
            </select>
          </div>

          {/* Search box */}
          <PropertySearchBox
            onSelect={(p) => setSelected(p)}
            cityFilter={selectedCity}
            placeholder="Enter an address, owner name, or folio number..."
          />

          {/* Search tips */}
          <div className="mt-3 px-3 py-3 rounded-xl text-xs space-y-1" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.85)" }}>
            <p className="font-semibold flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> Tips for better results:</p>
            <p>• Search by street address: <span className="font-mono">'2600 Glades'</span> or <span className="font-mono">'123 Main St Weston'</span></p>
            <p>• Search by folio number: <span className="font-mono">'514016150070'</span></p>
            <p>• Partial addresses work — try just the street name</p>
            <p>• Data sourced from the Broward County Property Appraiser (BCPA)</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 pb-24 md:pb-8">
        <div className="md:flex md:gap-6 md:items-start">

          {/* Left sidebar (desktop only) */}
          {!selected && (
            <div className="hidden md:block w-56 shrink-0">
              <div className="rounded-xl p-4" style={{ background: "#eaf1f8", border: "1px solid #cfe0f0" }}>
                <p className="text-xs font-bold mb-1" style={{ color: "#003466" }}>Public Access Records</p>
                <p className="text-xs leading-relaxed" style={{ color: "#003466" }}>Look up historical permits, zoning classifications, and building details for any registered property.</p>
              </div>
            </div>
          )}

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {selected ? (
              <PropertyDetail property={selected} onBack={() => setSelected(null)} />
            ) : (
              <div className="text-center py-16" style={{ color: "#434654" }}>
                <Search className="w-12 h-12 mx-auto mb-3" style={{ color: "#EDEDF8" }} />
                <p className="font-medium text-lg" style={{ color: "#191B23" }}>Search for a property</p>
                <p className="text-sm mt-2 max-w-sm mx-auto" style={{ color: "#434654" }}>
                  Enter an address or folio number to look up any Broward County property and its permit history.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}