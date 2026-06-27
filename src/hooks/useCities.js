import { useState, useEffect } from "react";
import { SUPABASE_URL, SUPABASE_ANON_KEY as SUPABASE_KEY } from "@/lib/supabase";

const SB_HEADERS = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

// Module-level cache so cities are only fetched once per app session
let _cachedCities = null;
let _fetchPromise = null;

export async function loadCities() {
  if (_cachedCities) return _cachedCities;
  if (_fetchPromise) return _fetchPromise;

  _fetchPromise = fetch(
    `${SUPABASE_URL}/rest/v1/cities?select=name,slug,building_department_phone,portal_url,fee_source,enabled_services&order=name.asc`,
    { headers: SB_HEADERS }
  )
    .then(r => r.json())
    .then(data => {
      _cachedCities = Array.isArray(data) ? data : [];
      _fetchPromise = null;
      return _cachedCities;
    });

  return _fetchPromise;
}

/**
 * Returns { cities, loading }
 * cities: array of city objects from Supabase
 * loading: boolean
 */
export function useCities() {
  const [cities, setCities] = useState(_cachedCities || []);
  const [loading, setLoading] = useState(!_cachedCities);

  useEffect(() => {
    if (_cachedCities) {
      setCities(_cachedCities);
      setLoading(false);
      return;
    }
    loadCities().then(data => {
      setCities(data);
      setLoading(false);
    });
  }, []);

  return { cities, loading };
}

/** Check if a city has live fee data */
export function cityHasFeeData(city) {
  if (!city) return false;
  const src = city.fee_source || "";
  return !src.includes("Pending") && !src.includes("Broward County Building Division");
}

/** Check if a city uses Broward County Building Division */
export function cityUsesBrowardCounty(city) {
  if (!city) return false;
  return (city.fee_source || "").includes("Broward County Building Division");
}

/** Check if a city has a given service enabled */
export function cityHasService(city, service) {
  if (!city) return false;
  const services = Array.isArray(city.enabled_services)
    ? city.enabled_services
    : (typeof city.enabled_services === "string" ? JSON.parse(city.enabled_services || "[]") : []);
  return services.includes(service);
}