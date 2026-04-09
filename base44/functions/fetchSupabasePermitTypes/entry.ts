import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const res = await fetch(`${SUPABASE_URL}/rest/v1/weston_permit_types?select=*&limit=50`, {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Accept": "application/json",
      }
    });

    const data = await res.json();
    return Response.json({ status: res.status, count: Array.isArray(data) ? data.length : null, records: data });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});