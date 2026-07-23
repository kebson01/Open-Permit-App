/**
 * cityConfig.js — single source of truth for per-city permit-type tables.
 *
 * These Broward County cities have their permit-type data loaded in Supabase
 * (per-city tables that also carry documents_needed / typical_requirements /
 * inspections_required, which the consolidated all_permit_types table does not).
 *
 * Cities NOT listed here either defer to the Broward County Building Division
 * (no separate building department) or still have data pending, so callers
 * should treat a missing entry as "no guided permit data yet" — never silently
 * fall back to another city's data.
 */
export const CITY_PERMIT_TYPE_TABLE = {
  "Weston":                "weston_permit_types",
  "Coral Springs":         "coral_springs_permit_types",
  "Fort Lauderdale":       "fort_lauderdale_permit_types",
  "Hollywood":             "hollywood_permit_types",
  "Cooper City":           "cooper_city_permit_types",
  "Sunrise":               "sunrise_permit_types",
  "Dania Beach":           "dania_beach_permit_types",
  "Davie":                 "davie_permit_types",
  "Deerfield Beach":       "deerfield_beach_permit_types",
  "Hallandale Beach":      "hallandale_beach_permit_types",
  "Lauderdale Lakes":      "lauderdale_lakes_permit_types",
  "Lauderdale-by-the-Sea": "lauderdale_by_the_sea_permit_types",
  "Lighthouse Point":      "lighthouse_point_permit_types",
  "Margate":               "margate_permit_types",
  "Miramar":               "miramar_permit_types",
  "North Lauderdale":      "north_lauderdale_permit_types",
  "Oakland Park":          "oakland_park_permit_types",
  "Parkland":              "parkland_permit_types",
  "Pembroke Pines":        "pembroke_pines_permit_types",
  "Pompano Beach":         "pompano_beach_permit_types",
  "Tamarac":               "tamarac_permit_types",
  "Wilton Manors":         "wilton_manors_permit_types",
};

/** Names of cities with a loaded permit-type table (fully "live"). */
export const LIVE_CITY_NAMES = Object.keys(CITY_PERMIT_TYPE_TABLE);

/** Resolve a city's permit-type table, or null if the city has no data yet. */
export function permitTypeTable(cityName) {
  return CITY_PERMIT_TYPE_TABLE[cityName] || null;
}
