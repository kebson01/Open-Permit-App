import { useState } from "react";
import { Search, Building2, Loader2, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PropertyCard from "@/components/property/PropertyCard";
import PropertyDetail from "@/components/property/PropertyDetail";

const SUPABASE_URL = "https://gbknnjidqpmjrwlooluw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdia25uamlkcXBtanJ3bG9vbHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NTQzNDIsImV4cCI6MjA5MDIzMDM0Mn0.qwDACgXe3hesxBRQOzP53Hdc44z_UOka1_uYQScyi68";

const HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
};

const CITIES = ["All Cities", "Weston", "Coral Springs", "Fort Lauderdale", "Hollywood", "Cooper City"];

const CITY_PORTAL_URLS = {
  "Weston":          "https://www.westonfl.org/Permits",
  "Coral Springs":   "https://www.coralsprings.gov/Government/Departments/Building/Online-Permitting-eTrakit/Apply-for-Online-Permit",
  "Fort Lauderdale": "https://lauderbuild.fortlauderdale.gov/",
  "Hollywood":       "https://aca-prod.accela.com/HOLLYWOOD/Default.aspx",
  "Cooper City":     "https://coopercity.gov/?SEC=AD7C348E-C110-425A-B91C-2CA5769BF937",
};

// Detect folio: 8-15 chars, mostly digits/letters, no spaces
function isFolioNumber(q) {
  return /^[0-9A-Z]{8,15}$/i.test(q.trim());
}

async function searchProperties(query, cityFilter) {
  const term = query.trim();
  let url;
  if (isFolioNumber(term)) {
    url = `${SUPABASE_URL}/rest/v1/broward_properties_public?FOLIO_NUMBER=eq.${encodeURIComponent(term)}&limit=1`;
  } else {
    const encoded = encodeURIComponent(`%${term.toUpperCase()}%`);
    if (cityFilter && cityFilter !== "All Cities") {
      url = `${SUPABASE_URL}/rest/v1/broward_properties_public?full_address=ilike.${encoded}&city_name=eq.${encodeURIComponent(cityFilter)}&limit=20&order=full_address.asc`;
    } else {
      url = `${SUPABASE_URL}/rest/v1/broward_properties_public?full_address=ilike.${encoded}&limit=20&order=full_address.asc`;
    }
  }
  const res = await fetch(url, { headers: HEADERS });
  return res.json();
}

export async function fetchPermitHistory(folioNumber, cityName) {
  // Only Weston has permit records; all other cities show portal link
  if (cityName !== "Weston") {
    return { records: [], noData: true, cityName, portalUrl: CITY_PORTAL_URLS[cityName] };
  }
  const url = `${SUPABASE_URL}/rest/v1/weston_permit_records?PARCEL_NBR=eq.${encodeURIComponent(folioNumber)}&order=OPEN_DATE.desc&limit=50`;
  const res = await fetch(url, { headers: HEADERS });
  const data = await res.json();
  return { records: Array.isArray(data) ? data : [], noData: false, cityName, portalUrl: CITY_PORTAL_URLS[cityName] };
}

export default function PropertyGuide() {
  const urlParams = new URLSearchParams(window.location.search);
  const urlCity = urlParams.get("city") || "";

  const [query, setQuery] = useState("");
  const [cityFilter, setCityFilter] = useState(urlCity || "All Cities");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [permitData, setPermitData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [permitsLoading, setPermitsLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    setSelected(null);
    setResults([]);
    const data = await searchProperties(query, cityFilter);
    setResults(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const selectProperty = async (prop) => {
    setSelected(prop);
    setPermitData(null);
    setPermitsLoading(true);
    const result = await fetchPermitHistory(prop.FOLIO_NUMBER, prop.city_name);
    setPermitData(result);
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
            Look up any Broward County property to see its permit history and building details.
          </p>

          {/* Search bar */}
          <div className="flex gap-2 bg-white rounded-xl p-2 shadow-lg mb-3">
            <div className="flex-1 flex items-center gap-2 px-3">
              <Search className="w-5 h-5 text-gray-400 shrink-0" />
              <Input
                className="border-0 shadow-none focus-visible:ring-0 text-base p-0"
                placeholder="Enter address or folio number..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && doSearch()}
              />
            </div>
            <Button onClick={doSearch} disabled={loading} className="px-6 text-white shrink-0" style={{ background: "#3B82F6" }}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
            </Button>
          </div>

          {/* City filter */}
          <div className="flex items-center justify-center gap-2">
            <MapPin className="w-4 h-4 text-blue-300" />
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-48 bg-white/10 border-white/20 text-white text-sm rounded-xl h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <p className="text-white/50 text-xs mt-3">Search by address or folio number · Up to 20 results</p>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-4xl mx-auto px-4 py-8 pb-24 md:pb-8">
        {selected ? (
          <PropertyDetail
            property={selected}
            permitData={permitData}
            permitsLoading={permitsLoading}
            onBack={() => { setSelected(null); setPermitData(null); }}
          />
        ) : (
          <>
            {loading && (
              <div className="flex items-center justify-center gap-2 text-blue-600 py-12">
                <Loader2 className="w-5 h-5 animate-spin" /> Searching properties...
              </div>
            )}
            {searched && !loading && results.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
                <Search className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                <p className="font-semibold text-gray-700">No properties found</p>
                <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">Try a shorter address or folio number. Only Broward County properties are available.</p>
              </div>
            )}
            {searched && !loading && results.length > 0 && (
              <p className="text-sm text-gray-500 mb-4">{results.length} propert{results.length === 1 ? "y" : "ies"} found</p>
            )}
            <div className="grid gap-3">
              {results.map((prop, i) => (
                <PropertyCard key={prop.FOLIO_NUMBER || i} property={prop} onClick={() => selectProperty(prop)} />
              ))}
            </div>
            {!searched && !loading && (
              <div className="text-center py-16 text-gray-400">
                <Search className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                <p className="font-medium text-gray-700 text-lg">Search for a property</p>
                <p className="text-sm mt-2 text-gray-500 max-w-sm mx-auto">Enter an address or folio number to look up any Broward County property and its permit history.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}