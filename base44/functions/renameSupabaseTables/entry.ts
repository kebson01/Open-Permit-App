import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const RENAMES = [
  ["permit_types",       "weston_permit_types"],
  ["fee_rules",          "weston_fee_rules"],
  ["code_of_ordinances", "weston_code_of_ordinances"],
  ["zoning_rules",       "weston_zoning_rules"],
  ["permit_records",     "weston_permit_records"],
  ["city_surcharges",    "weston_city_surcharges"],
  ["properties",         "broward_properties"],
];

async function execSQL(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql }),
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, body: text };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    const results = {};

    for (const [oldName, newName] of RENAMES) {
      const sql = `ALTER TABLE IF EXISTS public."${oldName}" RENAME TO "${newName}";`;
      const result = await execSQL(sql);
      results[oldName] = {
        renamed_to: newName,
        ok: result.ok,
        status: result.status,
        detail: result.body,
      };
    }

    return Response.json({ results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});