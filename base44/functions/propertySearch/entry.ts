import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const PROPERTY_SEARCH_URL = "https://gbknnjidqpmjrwlooluw.supabase.co/functions/v1/property-search";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdia25uamlkcXBtanJ3bG9vbHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NTQzNDIsImV4cCI6MjA5MDIzMDM0Mn0.qwDACgXe3hesxBRQOzP53Hdc44z_UOka1_uYQScyi68";

Deno.serve(async (req) => {
  try {
    const { q, city, type } = await req.json();

    if (!q || q.trim().length < 3) {
      return Response.json({ data: [], error: null });
    }

    const params = new URLSearchParams({
      q: q.trim(),
      city: city || "All Cities",
      type: type || "address",
    });

    const res = await fetch(`${PROPERTY_SEARCH_URL}?${params}`, {
      headers: {
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        apikey: SUPABASE_ANON_KEY,
      },
    });

    const json = await res.json();
    return Response.json(json);
  } catch (error) {
    return Response.json({ data: [], error: error.message }, { status: 500 });
  }
});