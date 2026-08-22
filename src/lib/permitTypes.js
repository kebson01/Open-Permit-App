/**
 * lib/permitTypes.js — the one place permit types are resolved and fetched.
 *
 * Each city keeps its permit types in its own table, named by
 * `cities.permit_table_name`. Every page that shows permit types must resolve
 * that table from the user's city; hardcoding one city's table silently serves
 * the wrong municipality's requirements, which is what this module exists to
 * prevent.
 */
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase";

const SB_HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  Prefer: "count=none",
  Range: "0-999",
};

export const DEFAULT_CITY = "Weston";

/** The city to show when none was passed: URL param, then last choice, then default. */
export function resolveCity(urlCity) {
  return urlCity || sessionStorage.getItem("selectedCity") || DEFAULT_CITY;
}

/** Remember the city so the guide, detail page and fee calculator stay in sync. */
export function rememberCity(city) {
  if (city) sessionStorage.setItem("selectedCity", city);
}

const _cityTableCache = {};

/** Look up a city's permit-types table name, falling back to the naming convention. */
export async function getPermitTable(cityName) {
  if (_cityTableCache[cityName]) return _cityTableCache[cityName];
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/cities?name=eq.${encodeURIComponent(cityName)}&select=permit_table_name&limit=1`,
    { headers: SB_HEADERS }
  );
  const data = await res.json();
  const table =
    (Array.isArray(data) && data[0]?.permit_table_name) ||
    `${cityName.toLowerCase().replace(/ /g, "_")}_permit_types`;
  _cityTableCache[cityName] = table;
  return table;
}

// These arrive as JSON strings in text columns on some city tables and as real
// arrays on others, so every caller would otherwise need the same guard.
function toArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try { const v = JSON.parse(value); return Array.isArray(v) ? v : []; }
    catch { return []; }
  }
  return [];
}

/**
 * Fetch one city's permit types, normalised.
 * Returns [] rather than throwing when a city has no table yet — several cities
 * are listed before their data is loaded.
 */
export async function fetchPermitTypes(city = DEFAULT_CITY) {
  const table = await getPermitTable(city);
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?select=*&order=category,name`,
    { headers: SB_HEADERS }
  );
  if (!res.ok) return [];
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data.map(p => ({
    ...p,
    typical_requirements: toArray(p.typical_requirements),
    documents_needed:     toArray(p.documents_needed),
    inspections_required: toArray(p.inspections_required),
  }));
}
