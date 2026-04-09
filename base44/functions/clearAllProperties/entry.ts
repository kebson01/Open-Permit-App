import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Delete all rows from the properties table in Supabase
    const res = await fetch(`${SUPABASE_URL}/rest/v1/broward_properties?folio_number=neq.IMPOSSIBLE_VALUE_THAT_MATCHES_ALL`, {
      method: "DELETE",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
      },
    });

    // Use TRUNCATE via RPC for a faster wipe
    const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/truncate_broward_properties`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    if (!rpcRes.ok) {
      // Fallback: delete with a catch-all filter
      const delRes = await fetch(`${SUPABASE_URL}/rest/v1/broward_properties?folio_number=gte.0`, {
        method: "DELETE",
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
        },
      });
      if (!delRes.ok) {
        const text = await delRes.text();
        return Response.json({ error: `Delete failed: ${text}` }, { status: 500 });
      }
    }

    return Response.json({ success: true, deleted: 0, done: true });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});