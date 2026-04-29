const SUPABASE_URL = "https://gbknnjidqpmjrwlooluw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdia25uamlkcXBtanJ3bG9vbHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NTQzNDIsImV4cCI6MjA5MDIzMDM0Mn0.qwDACgXe3hesxBRQOzP53Hdc44z_UOka1_uYQScyi68";

// ── Property search — via edge function ──────────────────────────────────────
export async function searchProperties(rawQuery, city = "All Cities", type = "address") {
  const q = rawQuery?.trim();
  if (!q || q.length < 3) return [];
  const params = new URLSearchParams({ q, city, type });
  const res = await fetch(`${SUPABASE_URL}/functions/v1/property-search?${params}`);
  if (!res.ok) return [];
  const { data } = await res.json();
  return data ?? [];
}