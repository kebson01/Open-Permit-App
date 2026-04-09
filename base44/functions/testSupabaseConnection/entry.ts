import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

async function queryTable(tableName, limit = 3) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?limit=${limit}`, {
    headers: {
      "apikey": SUPABASE_SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    }
  });
  const data = await res.json();
  return { status: res.status, count: Array.isArray(data) ? data.length : null, error: res.ok ? null : data };
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') {
    return Response.json({ error: 'Admin only' }, { status: 403 });
  }

  const tables = ['cities', 'projects', 'weston_fee_rules', 'weston_permit_types', 'broward_properties', 'weston_code_of_ordinances', 'weston_zoning_rules', 'weston_permit_records', 'project_cost_items'];
  const results = {};

  for (const table of tables) {
    results[table] = await queryTable(table);
  }

  return Response.json({
    supabase_url: SUPABASE_URL ? "✅ Set" : "❌ Missing",
    service_role_key: SUPABASE_SERVICE_ROLE_KEY ? "✅ Set" : "❌ Missing",
    tables: results
  });
});