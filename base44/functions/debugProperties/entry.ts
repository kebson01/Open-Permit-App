import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch first 5 rows to inspect structure
    const res = await fetch(`${SUPABASE_URL}/rest/v1/properties?select=*&limit=5`, {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Accept": "application/json",
      },
    });
    const rows = await res.json();

    // Also get count
    const countRes = await fetch(`${SUPABASE_URL}/rest/v1/properties?select=count`, {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Accept": "application/vnd.pgrst.object+json",
        "Prefer": "count=exact",
      },
    });
    const countHeader = countRes.headers.get("content-range");

    return Response.json({
      total_count: countHeader,
      column_names: rows.length > 0 ? Object.keys(rows[0]) : [],
      sample_rows: rows,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});