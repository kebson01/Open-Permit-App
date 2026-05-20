import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SUPABASE_URL = "https://gbknnjidqpmjrwlooluw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdia25uamlkcXBtanJ3bG9vbHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NTQzNDIsImV4cCI6MjA5MDIzMDM0Mn0.qwDACgXe3hesxBRQOzP53Hdc44z_UOka1_uYQScyi68";

Deno.serve(async (req) => {
  try {
    const { q, city } = await req.json();

    if (!q || q.trim().length < 3) {
      return Response.json({ data: [] });
    }

    const query = q.trim();
    const params = new URLSearchParams({
      select: 'folio_number,full_address,owner_name,homestead_flag,total_sqft,under_air_sqft,year_built,beds,baths,city_code,city_name,zip_code,building_value,latitude,longitude',
      or: `(full_address.ilike.*${query}*,folio_number.ilike.*${query}*,owner_name.ilike.*${query}*)`,
      limit: '10',
    });

    // Filter by city if specified
    if (city && city !== 'All Cities') {
      params.set('city_name', `eq.${city}`);
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/properties_search_view?${params}`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      return Response.json({ data: [], error: errText }, { status: res.status });
    }

    const rows = await res.json();
    return Response.json({ data: rows });
  } catch (error) {
    return Response.json({ data: [], error: error.message }, { status: 500 });
  }
});