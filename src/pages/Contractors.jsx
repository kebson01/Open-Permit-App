import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { resolveCity, rememberCity } from "@/lib/permitTypes";
import CityBar from "@/components/CityBar";
import ContractorCard from "@/components/ContractorCard";
import { Search, Loader2, AlertTriangle, X } from "lucide-react";
import { C, F, T, RADIUS, SHADOW } from "@/lib/theme";

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
 *
 * The trade picker is a scrolling row of chips rather than a dropdown: the
 * choice is the whole point of the page, and a chip row shows what is on offer
 * without a tap. The city moved into the shared bar, so there is now one place
 * in the app that answers "which municipality am I being told about".
 */
export default function Contractors() {
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

  // Run on load and whenever the trade or city changes; the free-text box is
  // applied on submit so typing doesn't fire a query per keystroke.
  useEffect(() => {
    // CityBar persists a change the reader makes here; this covers the other
    // route in — a ?city= link — so the rest of the app follows it too.
    rememberCity(city);
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trade, city]);

  const inCity = (results || []).filter(r => r.locality === "in_city").length;
  const nearby = (results || []).filter(r => r.locality === "nearby").length;

  return (
    <div style={{ background: C.ground, fontFamily: F.body, color: C.ink }}>
      <CityBar value={city} onChange={setCity} />

      <div className="mx-auto max-w-[720px] px-4 pb-10 pt-5">
        <h1 style={{ fontFamily: F.head, fontSize: T.title, fontWeight: 800, letterSpacing: "-0.02em" }}>
          Find a licensed contractor
        </h1>
        <p className="mt-1" style={{ color: C.muted, fontSize: T.small, lineHeight: 1.55 }}>
          Everyone here holds a current Florida licence, from the state&rsquo;s own register.
          Nearest to {city} first.
        </p>

        {/* Trade chips. Full-bleed on a phone so the row can scroll past the
            page gutter rather than being clipped inside it. */}
        <div className="-mx-4 mt-4 overflow-x-auto px-4 pb-1" style={{ scrollbarWidth: "none" }}>
          <div className="flex w-max gap-2">
            {TRADES.map(t => {
              const on = t === trade;
              return (
                <button
                  key={t}
                  onClick={() => setTrade(t)}
                  aria-pressed={on}
                  className="whitespace-nowrap px-3.5 py-2 transition-colors"
                  style={{
                    borderRadius: 999,
                    background: on ? C.brand : C.surface,
                    color: on ? "#fff" : C.muted,
                    border: `1px solid ${on ? C.brand : C.line}`,
                    fontFamily: F.head,
                    fontSize: T.small,
                    fontWeight: 700,
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        <form
          onSubmit={e => { e.preventDefault(); run(); }}
          className="mt-3 flex items-center gap-2 px-3"
          style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: RADIUS, boxShadow: SHADOW }}
        >
          <Search className="h-4 w-4 shrink-0" style={{ color: C.faint }} aria-hidden="true" />
          <label htmlFor="contractor-q" className="sr-only">Company or person&rsquo;s name</label>
          <input
            id="contractor-q"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Optional — a company or person's name"
            className="h-12 min-w-0 flex-1 bg-transparent focus:outline-none"
            style={{ fontSize: T.body, color: C.ink }}
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(""); }}
              aria-label="Clear name"
              className="shrink-0 p-1"
            >
              <X className="h-4 w-4" style={{ color: C.faint }} />
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="shrink-0 px-3.5 py-1.5 text-white disabled:opacity-40"
            style={{ background: C.brand, borderRadius: 8, fontFamily: F.head, fontSize: T.small, fontWeight: 700 }}
          >
            Search
          </button>
        </form>

        {error && (
          <p
            className="mt-3 p-3"
            style={{ background: C.stopSoft, color: C.stop, borderRadius: RADIUS, fontSize: T.small }}
          >
            {error}
          </p>
        )}

        <div
          className="mt-4 overflow-hidden"
          style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: RADIUS }}
        >
          <div
            className="flex items-baseline gap-2 px-4 py-3"
            style={{ borderBottom: `1px solid ${C.line}` }}
          >
            <h2 style={{ fontFamily: F.head, fontSize: T.small, fontWeight: 700 }}>{trade}</h2>
            {results && !loading && (
              <span className="ml-auto" style={{ color: C.faint, fontSize: T.caption, fontVariantNumeric: "tabular-nums" }}>
                {results.length} listed{inCity > 0 ? ` · ${inCity} in ${city}` : ""}
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12" style={{ color: C.muted, fontSize: T.small }}>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Searching the licence register…
            </div>
          ) : !results?.length ? (
            <p className="px-4 py-8" style={{ color: C.muted, fontSize: T.small, lineHeight: 1.6 }}>
              No current {trade.toLowerCase()} licences matched
              {query.trim() ? ` "${query.trim()}"` : ""} near {city}. Try another trade, or clear the name.
            </p>
          ) : (
            <div className="px-4">
              {inCity === 0 && (
                <p className="pt-3" style={{ color: C.muted, fontSize: T.caption, lineHeight: 1.6 }}>
                  {nearby > 0
                    ? `None registered in ${city} itself — showing the nearest in Broward County.`
                    : `None near ${city}. These hold a current Florida licence, but are based elsewhere in the state.`}
                </p>
              )}
              {results.map((c, i) => <ContractorCard key={`${c.license}-${i}`} c={c} />)}
            </div>
          )}
        </div>

        <div
          className="mt-4 flex items-start gap-3 p-4"
          style={{ background: C.warnSoft, borderRadius: RADIUS }}
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: C.warn }} aria-hidden="true" />
          <p style={{ color: C.warn, fontSize: T.small, lineHeight: 1.6 }}>
            A licence means the state has registered them — it is not a recommendation, and says
            nothing about price or workmanship. Check the licence number on DBPR, ask for proof of
            insurance, and confirm the person quoting you is the licence holder or works for them.
          </p>
        </div>
      </div>
    </div>
  );
}
