import { useState } from "react";
import { Search, Building2, Loader2, ArrowLeft, User, MapPin, Home, AlertTriangle, ClipboardList } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const SUPABASE_URL = "https://gbknnjidqpmjrwlooluw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdia25uamlkcXBtanJ3bG9vbHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NTQzNDIsImV4cCI6MjA5MDIzMDM0Mn0.qwDACgXe3hesxBRQOzP53Hdc44z_UOka1_uYQScyi68";

const HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
};

async function searchProperties(query) {
  const q = query.trim().replace(/'/g, "''");
  // Detect folio (all digits)
  const isFolio = /^\d+$/.test(q);
  let url;
  if (isFolio) {
    url = `${SUPABASE_URL}/rest/v1/broward_properties_public?FOLIO_NUMBER=eq.${encodeURIComponent(q)}&limit=10`;
  } else {
    url = `${SUPABASE_URL}/rest/v1/broward_properties_public?full_address=ilike.*${encodeURIComponent(q)}*&limit=10`;
  }
  const res = await fetch(url, { headers: HEADERS });
  return res.json();
}

async function fetchPermits(folioNumber) {
  const url = `${SUPABASE_URL}/rest/v1/weston_permit_records?PARCEL_NBR=eq.${encodeURIComponent(folioNumber)}&order=OPEN_DATE.desc&limit=200`;
  const res = await fetch(url, { headers: HEADERS });
  return res.json();
}

const MODULE_COLORS = {
  Building:    "bg-blue-100 text-blue-700",
  Planning:    "bg-purple-100 text-purple-700",
  Engineering: "bg-orange-100 text-orange-700",
  Enforcement: "bg-red-100 text-red-700",
  Landscaping: "bg-green-100 text-green-700",
};

function PropertyCard({ property, onClick }) {
  const addr = property.full_address ||
    [property.SITUS_STREET_NUMBER, property.SITUS_STREET_DIRECTION, property.SITUS_STREET_NAME, property.SITUS_STREET_TYPE, property.SITUS_UNIT_NUMBER]
      .filter(Boolean).join(" ");

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-md transition-all group"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
          <Home className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{addr || "Unknown Address"}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
            {property.NAME_LINE_1 && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <User className="w-3 h-3" /> {property.NAME_LINE_1}
              </span>
            )}
            {property.SITUS_CITY && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {property.SITUS_CITY}{property.SITUS_ZIP_CODE ? `, FL ${property.SITUS_ZIP_CODE}` : ""}
              </span>
            )}
            {property.USE_TYPE && (
              <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{property.USE_TYPE}</span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5 font-mono">Folio: {property.FOLIO_NUMBER}</p>
        </div>
      </div>
    </button>
  );
}

function PropertyDetail({ property, permits, permitsLoading, onBack }) {
  const addr = property.full_address ||
    [property.SITUS_STREET_NUMBER, property.SITUS_STREET_DIRECTION, property.SITUS_STREET_NAME, property.SITUS_STREET_TYPE, property.SITUS_UNIT_NUMBER]
      .filter(Boolean).join(" ");

  const hasOpenCodeCase = permits.some(p => p.HAS_OPEN_CODE_CASE === "true");

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 mb-5 font-medium">
        <ArrowLeft className="w-4 h-4" /> Back to results
      </button>

      {/* Property header */}
      <div className="rounded-2xl p-5 mb-5 text-white" style={{ background: "linear-gradient(135deg, #0D2B5E, #0F3575)" }}>
        <div className="flex items-start gap-3">
          <Building2 className="w-6 h-6 text-blue-300 flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="text-xl font-bold leading-tight">{addr}</h2>
            <p className="text-blue-200 text-sm mt-0.5">{property.SITUS_CITY}, FL {property.SITUS_ZIP_CODE}</p>
            <p className="text-blue-300 text-xs mt-1 font-mono">Folio: {property.FOLIO_NUMBER}</p>
          </div>
        </div>
        {hasOpenCodeCase && (
          <div className="mt-3 flex items-center gap-2 bg-red-500/20 border border-red-400/40 rounded-lg px-3 py-2">
            <AlertTriangle className="w-4 h-4 text-red-300" />
            <span className="text-red-200 text-sm font-medium">Open Code Enforcement Case on file</span>
          </div>
        )}
      </div>

      {/* Details grid */}
      <div className="grid sm:grid-cols-2 gap-4 mb-5">
        {/* Ownership & Use */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Ownership & Use</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-gray-500">Owner</dt><dd className="font-medium text-gray-800 text-right max-w-[60%] truncate">{property.NAME_LINE_1 || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Use Type</dt><dd className="text-gray-700">{property.USE_TYPE || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Use Code</dt><dd className="text-gray-700">{property.USE_CODE || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Homestead</dt><dd className="text-gray-700">{property.HOMESTEAD_FLAG === "T" ? "Yes" : "No"}</dd></div>
            {property.EXEMPTION_TYPE && <div className="flex justify-between"><dt className="text-gray-500">Exemption</dt><dd className="text-gray-700">{property.EXEMPTION_TYPE}</dd></div>}
          </dl>
        </div>

        {/* Building Info */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Building Details</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-gray-500">Year Built</dt><dd className="font-medium text-gray-800">{property.BLDG_YEAR_BUILT || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Total Sq Ft</dt><dd className="text-gray-700">{property.BLDG_TOT_SQ_FOOTAGE ? Number(property.BLDG_TOT_SQ_FOOTAGE).toLocaleString() : "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Under Air</dt><dd className="text-gray-700">{property.BLDG_UNDER_AIR_SQ_FOOTAGE ? Number(property.BLDG_UNDER_AIR_SQ_FOOTAGE).toLocaleString() : "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Beds / Baths</dt><dd className="text-gray-700">{property.BEDS || "—"} / {property.BATHS || "—"}</dd></div>
          </dl>
        </div>

      </div>

      {/* Permit History */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-blue-600" />
          <h3 className="font-semibold text-gray-800 text-sm">Permit History</h3>
          {!permitsLoading && (
            <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {permits.length} record{permits.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {permitsLoading ? (
          <div className="flex items-center justify-center gap-2 text-gray-400 py-8">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading permits...
          </div>
        ) : permits.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">No permit records found for this parcel.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Record ID", "Description", "Module", "Status", "Opened"].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {permits.map((p, i) => (
                  <tr key={p.id ?? i} className="hover:bg-blue-50/30">
                    <td className="px-4 py-2.5 font-mono text-xs text-blue-700 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {p.RECORD_ID || "—"}
                        {p.HAS_OPEN_CODE_CASE === "true" && <AlertTriangle className="w-3 h-3 text-red-500" title="Open Code Case" />}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-gray-700 max-w-xs"><span className="line-clamp-1">{p.RECORD_NAME || "—"}</span></td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${MODULE_COLORS[p.RECORD_MODULE] || "bg-gray-100 text-gray-600"}`}>
                        {p.RECORD_MODULE || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-600 whitespace-nowrap">{p.PERMIT_STATUS || "—"}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-400 whitespace-nowrap">{p.OPEN_DATE || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PropertyGuide() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [permits, setPermits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [permitsLoading, setPermitsLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    setSelected(null);
    setResults([]);
    const data = await searchProperties(query);
    setResults(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const selectProperty = async (prop) => {
    setSelected(prop);
    setPermits([]);
    setPermitsLoading(true);
    const data = await fetchPermits(prop.FOLIO_NUMBER);
    setPermits(Array.isArray(data) ? data : []);
    setPermitsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="py-10 px-4" style={{ background: "linear-gradient(135deg, #0D2B5E 0%, #0F3575 100%)" }}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Building2 className="w-7 h-7 text-blue-300" />
            <h1 className="text-3xl font-bold text-white">Property Search</h1>
          </div>
          <p className="text-blue-200 text-sm mb-6">
            Look up any Broward County property to see its permit history, zoning details, and ownership information.
          </p>
          <div className="flex gap-2 bg-white rounded-xl p-2 shadow-lg">
            <div className="flex-1 flex items-center gap-2 px-3">
              <Search className="w-5 h-5 text-gray-400 shrink-0" />
              <Input
                className="border-0 shadow-none focus-visible:ring-0 text-base p-0"
                placeholder="e.g. 654 Nandina Dr  or  514204012090"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && doSearch()}
              />
            </div>
            <Button onClick={doSearch} disabled={loading} className="px-6 text-white" style={{ background: "#3B82F6" }}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
            </Button>
          </div>
          <p className="text-white/60 text-xs mt-3">Search by address or folio number · Showing up to 10 results</p>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {selected ? (
          <PropertyDetail
            property={selected}
            permits={permits}
            permitsLoading={permitsLoading}
            onBack={() => { setSelected(null); setPermits([]); }}
          />
        ) : (
          <>
            {loading && (
              <div className="flex items-center justify-center gap-2 text-blue-600 py-12">
                <Loader2 className="w-5 h-5 animate-spin" /> Searching properties...
              </div>
            )}
            {searched && !loading && (
              <p className="text-sm text-gray-500 mb-4">
                {results.length === 0
                  ? "No properties found. Try a different address or folio number."
                  : `${results.length} propert${results.length === 1 ? "y" : "ies"} found`}
              </p>
            )}
            <div className="grid gap-3">
              {results.map((prop, i) => (
                <PropertyCard key={prop.FOLIO_NUMBER || i} property={prop} onClick={() => selectProperty(prop)} />
              ))}
            </div>
            {!searched && !loading && (
              <div className="text-center py-16 text-gray-400">
                <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                <p className="font-medium text-gray-500">Search for a Broward County property</p>
                <p className="text-sm mt-1">Enter an address or folio number above to get started</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}