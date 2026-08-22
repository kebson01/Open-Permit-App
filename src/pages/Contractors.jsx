import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useCities } from "@/hooks/useCities";
import { resolveCity, rememberCity } from "@/lib/permitTypes";
import ContractorCard from "@/components/ContractorCard";
import { HardHat, Search, Loader2, AlertTriangle } from "lucide-react";

const PRIMARY = "#003466";

// Mirrors job_license_map.work_type — the trades the licence mapping covers.
const TRADES = [
  "Roofing", "HVAC / A/C", "Plumbing / Gas", "Electrical", "Pool & Spa",
  "Solar", "General / Building", "Specialty / Openings",
  "Site / Driveway / Utility", "Irrigation", "Alarm", "Fire Sprinkler",
  "Engineering / Design",
];

/**
 * Find a licensed contractor.
 *
 * The licence data was previously reachable only by pointing a camera at
 * something, which is no use to someone who already knows they need a roofer.
 */
export default function Contractors() {
  const { cities } = useCities();
  const urlParams = new URLSearchParams(window.location.search);

  const [trade, setTrade] = useState(urlParams.get("trade") || "Roofing");
  const [city, setCity]   = useState(resolveCity(urlParams.get("city")));
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const run = async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error: err } = await supabase.rpc("search_professionals", {
        p_query: query.trim() || null,
        p_type: "contractor",
        p_category: trade,
        p_active_only: true,
        p_statewide_only: false,
        p_limit: 25,
        p_city: city || null,
      });
      if (err) throw err;
      setResults(
        (data || []).map(r => ({
          name: r.name,
          dba: r.secondary || "",
          license_type: r.category,
          license: r.license_ref || "",
          address: r.address || "",
          city: r.city || "",
          expires: r.expiration_date || "",
          locality: r.locality || "",
        }))
      );
    } catch (e) {
      setError(e.message || "Search failed. Try again.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Run once on load and whenever the trade or city changes; the free-text box
  // is applied on submit so typing doesn't fire a query per keystroke.
  useEffect(() => {
    rememberCity(city);
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trade, city]);

  const inCity = (results || []).filter(r => r.locality === "in_city").length;
  const nearby = (results || []).filter(r => r.locality === "nearby").length;

  return (
    <div className="min-h-screen bg-[#f7f9fb] pb-16">
      <div className="px-4 pt-8 pb-6" style={{ background: "linear-gradient(135deg, #003466 0%, #00489a 100%)" }}>
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Find a licensed contractor
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>
            Every contractor here holds a current Florida licence, from the state&rsquo;s own
            register. Nearest to you first.
          </p>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>Trade</span>
              <select
                value={trade}
                onChange={e => setTrade(e.target.value)}
                className="w-full rounded-xl border-0 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                {TRADES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>Near</span>
              <select
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full rounded-xl border-0 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </label>
          </div>

          <form
            onSubmit={e => { e.preventDefault(); run(); }}
            className="mt-2 flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Optional — a company or person's name"
                className="w-full rounded-xl border-0 py-3 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-white px-5 py-3 text-sm font-bold disabled:opacity-60"
              style={{ color: PRIMARY }}
            >
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="mx-auto mt-5 max-w-3xl space-y-4 px-4">
        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="mb-1 flex items-center gap-2">
            <HardHat className="h-4 w-4" style={{ color: PRIMARY }} />
            <h2 className="font-bold text-gray-900">{trade}</h2>
            {results && !loading && (
              <span className="ml-auto text-xs text-gray-400">
                {results.length} listed{inCity > 0 ? ` · ${inCity} in ${city}` : ""}
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching the licence register…
            </div>
          ) : !results?.length ? (
            <p className="py-6 text-sm text-gray-500">
              No current {trade.toLowerCase()} licences matched
              {query.trim() ? ` "${query.trim()}"` : ""} near {city}. Try another trade, or clear the name.
            </p>
          ) : (
            <>
              {inCity === 0 && (
                <p className="mb-2 text-xs text-gray-500">
                  {nearby > 0
                    ? `None registered in ${city} itself — showing the nearest in Broward County.`
                    : `None near ${city}. These hold a current Florida licence, but are based elsewhere in the state.`}
                </p>
              )}
              <div>
                {results.map((c, i) => <ContractorCard key={`${c.license}-${i}`} c={c} />)}
              </div>
            </>
          )}
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-sm leading-relaxed text-amber-800">
            A licence means the state has registered them — it is not a recommendation, and
            says nothing about price or workmanship. Check the licence number on DBPR, ask
            for proof of insurance, and confirm the person quoting you is the licence holder
            or works for them.
          </p>
        </div>
      </div>
    </div>
  );
}
