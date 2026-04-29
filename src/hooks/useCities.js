import { useState, useEffect } from "react";

const SUPABASE_URL = "https://gbknnjidqpmjrwlooluw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdia25uamlkcXBtanJ3bG9vbHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NTQzNDIsImV4cCI6MjA5MDIzMDM0Mn0.qwDACgXe3hesxBRQOzP53Hdc44z_UOka1_uYQScyi68";
const SB_HEADERS = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` };

export function useCities() {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(
      `${SUPABASE_URL}/rest/v1/cities?select=name,slug,building_department_phone,portal_url,fee_source,enabled_services,building_department_address&order=name.asc`,
      { headers: SB_HEADERS }
    )
      .then(r => r.json())
      .then(data => {
        setCities(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  return { cities, loading };
}

export function cityHasFeeData(city) {
  if (!city) return false;
  const src = city.fee_source || "";
  return !src.includes("Pending") && !src.includes("Broward County Building Division");
}

export function cityUsesBrowardCounty(city) {
  if (!city) return false;
  return (city.fee_source || "").includes("Broward County Building Division");
}

export function cityHasService(city, service) {
  if (!city) return false;
  const services = Array.isArray(city.enabled_services)
    ? city.enabled_services
    : (typeof city.enabled_services === "string" ? JSON.parse(city.enabled_services || "[]") : []);
  return services.includes(service);
}