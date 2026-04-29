import { useState, useEffect } from "react";
import { getCities } from "@/utils/supabaseData";

export { getCities };

export function useCities() {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCities().then(data => {
      setCities(data);
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