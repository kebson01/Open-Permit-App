import React, { useEffect, useState } from "react";
import { SUPABASE_URL, SB_HEADERS } from "@/lib/supabase";
import { Loader2, ExternalLink } from "lucide-react";

const CITY_PORTAL_URLS = {
  "Weston": "https://www.westonfl.org/Permits",
  "Coral Springs": "https://www.coralsprings.gov/Government/Departments/Building/Online-Permitting-eTrakit/Apply-for-Online-Permit",
  "Hollywood": "https://aca-prod.accela.com/HOLLYWOOD/Default.aspx",
  "Fort Lauderdale": "https://lauderbuild.fortlauderdale.gov/",
  "Cooper City": "https://coopercity.gov/?SEC=AD7C348E-C110-425A-B91C-2CA5769BF937",
};

async function fetchCount(table, filter = "") {
  try {
    const url = `${SUPABASE_URL}/rest/v1/${table}?select=id${filter}&limit=1`;
    const res = await fetch(url, {
      headers: { ...SB_HEADERS, Prefer: "count=exact" },
    });
    const countHeader = res.headers.get("content-range");
    if (countHeader) {
      const match = countHeader.match(/\/(\d+)/);
      if (match) return parseInt(match[1], 10);
    }
    const data = await res.json();
    return Array.isArray(data) ? data.length : 0;
  } catch {
    return null;
  }
}

export default function CitySupabaseStats({ city }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!city) return;
    setLoading(true);
    setStats(null);

    const encoded = encodeURIComponent(city.name);
    const permitTable = city.permit_table_name;
    const recordsTable = city.permit_records_table_name;

    Promise.all([
      permitTable ? fetchCount(permitTable) : Promise.resolve(null),
      fetchCount("fee_rules", `&city_name=eq.${encoded}`),
      fetchCount("zoning_rules", `&city_name=eq.${encoded}`),
      fetchCount("city_ordinance_sections", `&city_name=eq.${encoded}`),
      recordsTable ? fetchCount(recordsTable) : Promise.resolve(0),
    ]).then(([permitTypes, feeRules, zoningRules, ordinanceSections, permitRecords]) => {
      setStats({ permitTypes, feeRules, zoningRules, ordinanceSections, permitRecords });
      setLoading(false);
    });
  }, [city?.id]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6 text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading Supabase data counts...</span>
      </div>
    );
  }

  if (!stats) return null;

  const rows = [
    {
      label: "Permit Types",
      value: stats.permitTypes,
      note: city.permit_table_name ? `from ${city.permit_table_name}` : "permit_table_name not set",
      ok: stats.permitTypes > 0,
    },
    {
      label: "Fee Rules",
      value: stats.feeRules,
      note: "from fee_rules",
      ok: stats.feeRules > 0,
    },
    {
      label: "Zoning Rules",
      value: stats.zoningRules,
      note: "from zoning_rules",
      ok: stats.zoningRules > 0,
    },
    {
      label: "Ordinance Sections",
      value: stats.ordinanceSections,
      note: "from city_ordinance_sections",
      ok: stats.ordinanceSections > 0,
    },
    {
      label: "Permit Records",
      value: stats.permitRecords,
      note: stats.permitRecords === 0
        ? `0 — pending import · ${city.permit_records_table_name || "table not set"}`
        : city.permit_records_table_name || "table not set",
      ok: stats.permitRecords > 0,
    },
  ];

  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-3">Supabase Data Overview</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {rows.map(row => (
          <div
            key={row.label}
            className={`rounded-xl border p-4 ${row.ok ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}`}
          >
            <p className="text-2xl font-extrabold text-gray-900">
              {row.value === null ? "—" : row.value.toLocaleString()}
            </p>
            <p className="text-sm font-semibold text-gray-700 mt-0.5">{row.label}</p>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{row.note}</p>
          </div>
        ))}
      </div>

      {CITY_PORTAL_URLS[city.name] && (
        <a
          href={CITY_PORTAL_URLS[city.name]}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 mt-4 text-xs text-blue-600 hover:underline"
        >
          <ExternalLink className="w-3 h-3" />
          {city.name} Permit Portal
        </a>
      )}
    </div>
  );
}