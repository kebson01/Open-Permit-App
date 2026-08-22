import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { searchProperties } from "@/lib/searchProperties";
import { useCities } from "@/hooks/useCities";
import { createPageUrl } from "@/utils";
import {
  Search, Building2, MapPin, Loader2, FileText, AlertTriangle,
  Ruler, ArrowRight, CheckCircle2, Clock
} from "lucide-react";

import { C, F, T, RADIUS, SHADOW } from "@/lib/theme";

const PRIMARY = C.brand;

function fmtDate(raw) {
  if (!raw) return "—";
  const d = new Date(String(raw).replace(" ", "T"));
  return isNaN(d) ? String(raw).slice(0, 10) : d.toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

// The appraiser stores ZIP+4 unpunctuated, so "330653626" was reaching the
// page as one nine-digit run that reads as a phone number at a glance.
function fmtZip(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (digits.length === 9) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return digits.slice(0, 5);
}

const STATUS_STYLE = {
  Completed: "bg-green-50 text-green-700 border-green-200",
  Active:    "bg-blue-50 text-blue-700 border-blue-200",
  "In Review": "bg-amber-50 text-amber-800 border-amber-200",
  Cancelled: "bg-gray-100 text-gray-600 border-[#dde4eb]",
  Unknown:   "bg-gray-100 text-gray-500 border-[#dde4eb]",
};

export default function PropertyLookup() {
  const { cities } = useCities();
  const [input, setInput]         = useState("");
  const [results, setResults]     = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError]         = useState("");
  const [report, setReport]       = useState(null);
  const [loadingReport, setLoading] = useState(false);
  const [zoning, setZoning]       = useState(null);

  const runSearch = (e) => {
    e?.preventDefault();
    setReport(null);
    searchProperties(input, setResults, setSearching, setError);
  };

  const openProperty = async (p) => {
    setResults([]);
    setLoading(true);
    setReport(null);
    setZoning(null);
    try {
      const { data } = await supabase.rpc("get_property_report", { p_folio: p.folio_number });
      const r = typeof data === "string" ? JSON.parse(data) : data;
      setReport({ ...r, _fallback: p });

      const cityName = r?.coverage?.city_name || p.city_name;
      if (cityName) {
        const { data: zones } = await supabase
          .from("zoning_rules")
          .select("*")
          .eq("city_name", cityName)
          .eq("zone_type", "residential")
          .limit(6);
        setZoning({ city: cityName, zones: zones || [] });
      }
    } catch {
      setError("Couldn't load that property. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const prop    = report?.property || report?._fallback || null;
  const records = report?.open_items || [];
  const city    = report?.coverage?.city_name || report?._fallback?.city_name || "";
  const cityRow = cities.find(c => c.name === city);

  return (
    <div style={{ background: C.ground, fontFamily: F.body, color: C.ink }}>
      {/* The search is the page, so it sits at the top of the content rather
          than inside a coloured banner that pushed it below the fold. */}
      <div className="mx-auto max-w-[720px] px-4 pt-5">
        <h1 style={{ fontFamily: F.head, fontSize: T.title, fontWeight: 800, letterSpacing: "-0.02em" }}>
          Look up a property
        </h1>
        <p className="mt-1" style={{ color: C.muted, fontSize: T.small, lineHeight: 1.55 }}>
          Search any Broward County address to see what has already been permitted there,
          and the zoning rules that apply.
        </p>

        <form
          onSubmit={runSearch}
          className="mt-4 flex items-center gap-2 px-3"
          style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: RADIUS, boxShadow: SHADOW }}
        >
          <Search className="h-4 w-4 shrink-0" style={{ color: C.faint }} aria-hidden="true" />
          <label htmlFor="property-q" className="sr-only">Street address or folio number</label>
          <input
            id="property-q"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Street address or folio number"
            className="h-12 min-w-0 flex-1 bg-transparent focus:outline-none"
            style={{ fontSize: T.body, color: C.ink }}
          />
          <button
            type="submit"
            disabled={searching}
            className="shrink-0 px-3.5 py-1.5 text-white disabled:opacity-40"
            style={{ background: C.brand, borderRadius: 8, fontFamily: F.head, fontSize: T.small, fontWeight: 700 }}
          >
            {searching ? "Searching…" : "Search"}
          </button>
        </form>
      </div>

      <div className="mx-auto mt-4 max-w-[720px] space-y-4 px-4 pb-10">
        {error && !report && (
          <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
        )}

        {/* Result picker */}
        {results.length > 0 && (
          <div className="rounded-xl border border-[#dde4eb] bg-white overflow-hidden">
            <p className="px-4 pt-3 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
              {results.length} match{results.length === 1 ? "" : "es"}
            </p>
            {results.map(p => (
              <button
                key={p.folio_number}
                onClick={() => openProperty(p)}
                className="flex w-full items-center gap-3 border-t border-[#eef2f6] px-4 py-3 text-left hover:bg-gray-50"
              >
                <MapPin className="h-4 w-4 shrink-0" style={{ color: PRIMARY }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-gray-900">{p.full_address || "—"}</span>
                  <span className="block text-xs text-gray-500">
                    Folio {p.folio_number}{p.city_name ? ` · ${p.city_name}` : ""}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-gray-300" />
              </button>
            ))}
          </div>
        )}

        {loadingReport && (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-[#dde4eb] bg-white p-8 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading property record…
          </div>
        )}

        {/* Property */}
        {prop && !loadingReport && (
          <>
            <div className="rounded-xl border border-[#dde4eb] bg-white p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eaf1f8]">
                  <Building2 className="h-5 w-5" style={{ color: PRIMARY }} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold text-gray-900">
                    {prop.full_address || prop.FOLIO_NUMBER}
                  </h2>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Folio {prop.FOLIO_NUMBER || prop.folio_number}
                    {city ? ` · ${city}` : ""}
                    {prop.SITUS_ZIP_CODE ? ` · ${fmtZip(prop.SITUS_ZIP_CODE)}` : ""}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-gray-600">
                    {prop.BLDG_YEAR_BUILT && prop.BLDG_YEAR_BUILT !== "0" && <span>Built {prop.BLDG_YEAR_BUILT}</span>}
                    {prop.BLDG_TOT_SQ_FOOTAGE && <span>{Number(prop.BLDG_TOT_SQ_FOOTAGE).toLocaleString()} sq ft</span>}
                    {prop.BEDS && prop.BEDS !== "0.0" && <span>{prop.BEDS} bed</span>}
                    {prop.BATHS && prop.BATHS !== "0.0" && <span>{prop.BATHS} bath</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Permit history */}
            <div className="rounded-xl border border-[#dde4eb] bg-white p-5">
              <div className="mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" style={{ color: PRIMARY }} />
                <h3 className="font-bold text-gray-900">Permit history</h3>
                <span className="ml-auto text-xs text-gray-400">
                  {records.length} record{records.length === 1 ? "" : "s"}
                </span>
              </div>

              {records.length === 0 ? (
                <p className="text-sm text-gray-500">
                  {report?.coverage?.has_permit_records
                    ? `No permits on file for this property in ${city}.`
                    : `We don't have permit records for ${city || "this city"} — only Weston's are loaded so far. The city can tell you what's on file.`}
                </p>
              ) : (
                <ul className="divide-y divide-[#eef2f6]">
                  {records.slice(0, 40).map(r => (
                    <li key={r.id} className="flex items-start gap-3 py-2.5">
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-gray-900">{r.PERMIT_TYPE || r.RECORD_NAME}</span>
                        <span className="block text-xs text-gray-500">
                          {r.RECORD_ID} · {fmtDate(r.OPEN_DATE)}
                        </span>
                      </span>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLE[r.STATUS_NORMALIZED] || STATUS_STYLE.Unknown}`}>
                        {r.STATUS_NORMALIZED || "Unknown"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {records.length > 40 && (
                <p className="mt-3 text-xs text-gray-400">Showing the 40 most recent of {records.length}.</p>
              )}
            </div>

            {/* Zoning — honest about what we can and can't confirm */}
            {zoning?.zones?.length > 0 && (
              <div className="rounded-xl border border-[#dde4eb] bg-white p-5">
                <div className="mb-1 flex items-center gap-2">
                  <Ruler className="h-4 w-4" style={{ color: PRIMARY }} />
                  <h3 className="font-bold text-gray-900">Residential zoning in {zoning.city}</h3>
                </div>
                <p className="mb-4 text-xs leading-relaxed text-gray-500">
                  We hold {zoning.city}&rsquo;s zoning districts, but not which one this parcel sits in —
                  that comes from the city. Find your district below, or ask {zoning.city} to confirm it.
                </p>

                <div className="space-y-3">
                  {zoning.zones.map(z => (
                    <div key={z.id} className="rounded-xl border border-[#eef2f6] bg-gray-50 p-3">
                      <p className="text-sm font-semibold text-gray-900">
                        {z.zone_code}{z.zone_name ? ` — ${z.zone_name}` : ""}
                      </p>
                      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600 sm:grid-cols-3">
                        {z.front_setback_ft != null && <span>Front setback <strong>{z.front_setback_ft} ft</strong></span>}
                        {z.rear_setback_ft != null && <span>Rear setback <strong>{z.rear_setback_ft} ft</strong></span>}
                        {z.side_setback_ft != null && <span>Side setback <strong>{z.side_setback_ft} ft</strong></span>}
                        {z.max_height_ft != null && <span>Max height <strong>{z.max_height_ft} ft</strong></span>}
                        {z.pool_rear_setback_ft != null && <span>Pool rear <strong>{z.pool_rear_setback_ft} ft</strong></span>}
                        {z.fence_max_height_rear_ft != null && <span>Fence (rear) <strong>{z.fence_max_height_rear_ft} ft</strong></span>}
                        {z.shed_max_size_sqft != null && <span>Shed max <strong>{z.shed_max_size_sqft} sq ft</strong></span>}
                        {z.max_lot_coverage_pct != null && <span>Lot coverage <strong>{z.max_lot_coverage_pct}%</strong></span>}
                      </div>
                      {z.ordinance_reference && (
                        <p className="mt-2 text-[11px] text-gray-400">{z.ordinance_reference}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next step */}
            <div className="rounded-xl border border-[#dde4eb] bg-white p-5">
              <h3 className="font-bold text-gray-900">Planning work here?</h3>
              <p className="mt-1 text-sm text-gray-600">
                See what {city || "this city"} requires for the job you have in mind.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  to={createPageUrl("PermitGuide") + `?city=${encodeURIComponent(city)}`}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white no-underline"
                  style={{ background: PRIMARY }}
                >
                  <CheckCircle2 className="h-4 w-4" /> Open the permit guide
                </Link>
                {cityRow?.portal_url && (
                  <a
                    href={cityRow.portal_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-[#dde4eb] px-4 py-2 text-sm font-semibold text-gray-700 no-underline hover:bg-gray-50"
                  >
                    <Clock className="h-4 w-4" /> {city} building department
                  </a>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-sm leading-relaxed text-amber-800">
                Property and permit data comes from the Broward County Property Appraiser and city
                open-data feeds, and can lag behind the city&rsquo;s own records. Confirm anything you
                intend to rely on with {city || "the city"} directly.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
