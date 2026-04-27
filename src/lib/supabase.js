export const SUPABASE_URL = "https://gbknnjidqpmjrwlooluw.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdia25uamlkcXBtanJ3bG9vbHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NTQzNDIsImV4cCI6MjA5MDIzMDM0Mn0.qwDACgXe3hesxBRQOzP53Hdc44z_UOka1_uYQScyi68";
export const SB_HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
  Prefer: "count=none",
};

// Cache for city records (permit_table_name, permit_records_table_name etc.)
const _cityCache = {};

export async function fetchCityRecord(cityName) {
  if (_cityCache[cityName]) return _cityCache[cityName];
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/cities?name=eq.${encodeURIComponent(cityName)}&limit=1`,
    { headers: SB_HEADERS }
  );
  const data = await res.json();
  const record = Array.isArray(data) && data.length > 0 ? data[0] : null;
  if (record) _cityCache[cityName] = record;
  return record;
}

export const CITY_PORTAL_URLS = {
  "Weston": "https://www.westonfl.org/Permits",
  "Coral Springs": "https://www.coralsprings.gov/Government/Departments/Building/Online-Permitting-eTrakit/Apply-for-Online-Permit",
  "Hollywood": "https://aca-prod.accela.com/HOLLYWOOD/Default.aspx",
  "Fort Lauderdale": "https://lauderbuild.fortlauderdale.gov/",
  "Cooper City": "https://coopercity.gov/?SEC=AD7C348E-C110-425A-B91C-2CA5769BF937",
};

// ── Supabase admin helpers (use anon key — RLS policies handle auth) ──────────

export async function sbGet(table, params = "") {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, { headers: SB_HEADERS });
  return res.json();
}

export async function sbInsert(table, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...SB_HEADERS, Prefer: "return=representation" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function sbUpdate(table, id, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: "PATCH",
    headers: { ...SB_HEADERS, Prefer: "return=representation" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function sbDelete(table, id) {
  await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: "DELETE",
    headers: SB_HEADERS,
  });
}

export async function sbDeleteWhere(table, field, value) {
  await fetch(`${SUPABASE_URL}/rest/v1/${table}?${field}=eq.${encodeURIComponent(value)}`, {
    method: "DELETE",
    headers: SB_HEADERS,
  });
}

export const CITY_DEPT_INFO = {
  "Weston":          { phone: "(954) 385-2600", hours: "Mon–Fri 8:00AM–4:30PM", noc_threshold: "$2,500" },
  "Coral Springs":   { phone: "(954) 344-1025", hours: "Mon–Thu 7:30AM–5:00PM, Fri 7:30AM–2:30PM", noc_threshold: "$5,000" },
  "Fort Lauderdale": { phone: "(954) 828-6520", hours: "Mon–Fri 7:30AM–4:30PM", noc_threshold: "$2,500" },
  "Hollywood":       { phone: "(954) 921-3335", hours: "Mon–Thu 7AM–6PM", noc_threshold: "$5,000" },
  "Cooper City":     { phone: "(954) 434-4300", hours: "Mon–Fri 8AM–5PM", noc_threshold: "$2,500" },
};