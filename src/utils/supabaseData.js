const SUPABASE_URL = "https://gbknnjidqpmjrwlooluw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdia25uamlkcXBtanJ3bG9vbHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NTQzNDIsImV4cCI6MjA5MDIzMDM0Mn0.qwDACgXe3hesxBRQOzP53Hdc44z_UOka1_uYQScyi68";
const HEADERS = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` };

// ── Cities — fetched exactly once per session ─────────────────────────────────
let _citiesCache = null;
let _citiesPromise = null;

export async function getCities() {
  if (_citiesCache) return _citiesCache;
  if (_citiesPromise) return _citiesPromise;

  _citiesPromise = fetch(
    `${SUPABASE_URL}/rest/v1/cities?select=name,slug,building_department_phone,portal_url,fee_source,fee_schedule_status,fee_schedule_year,enabled_services,building_department_address&order=name.asc`,
    { headers: HEADERS }
  )
    .then(r => r.json())
    .then(data => {
      _citiesCache = Array.isArray(data) ? data : [];
      _citiesPromise = null;
      return _citiesCache;
    });

  return _citiesPromise;
}

// ── Fee rules — cached per city ───────────────────────────────────────────────
const _feeRulesCache = {};
const _feeRulesPromise = {};

export async function getFeeRules(cityName) {
  if (_feeRulesCache[cityName]) return _feeRulesCache[cityName];
  if (_feeRulesPromise[cityName]) return _feeRulesPromise[cityName];

  _feeRulesPromise[cityName] = fetch(
    `${SUPABASE_URL}/rest/v1/fee_rules?city_name=eq.${encodeURIComponent(cityName)}&order=sort_order.asc`,
    { headers: HEADERS }
  )
    .then(r => r.json())
    .then(data => {
      _feeRulesCache[cityName] = Array.isArray(data) ? data : [];
      delete _feeRulesPromise[cityName];
      return _feeRulesCache[cityName];
    });

  return _feeRulesPromise[cityName];
}

// ── City surcharges — cached per city ─────────────────────────────────────────
const _surchargesCache = {};

export async function getCitySurcharge(cityName) {
  if (cityName in _surchargesCache) return _surchargesCache[cityName];

  const data = await fetch(
    `${SUPABASE_URL}/rest/v1/city_surcharges?city_name=eq.${encodeURIComponent(cityName)}&limit=1`,
    { headers: HEADERS }
  ).then(r => r.json());

  _surchargesCache[cityName] = Array.isArray(data) && data.length > 0 ? data[0] : null;
  return _surchargesCache[cityName];
}

// ── Property search — always via edge function ────────────────────────────────
export async function searchProperties(rawQuery, city = "All Cities", type = "address") {
  const q = rawQuery?.trim();
  if (!q || q.length < 3) return [];
  const params = new URLSearchParams({ q, city, type });
  const res = await fetch(`${SUPABASE_URL}/functions/v1/property-search?${params}`);
  if (!res.ok) return [];
  const { data } = await res.json();
  return data ?? [];
}