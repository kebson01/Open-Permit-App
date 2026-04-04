import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const BASE_HEADERS = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

async function execSQL(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: BASE_HEADERS,
    body: JSON.stringify({ sql }),
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, body: text };
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user || user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

  const sqls = [
    `DROP TABLE IF EXISTS public."fee_rules";`,
    `DROP TABLE IF EXISTS public."zoning_rules";`,
    `CREATE TABLE public."fee_rules" (
      "id" text PRIMARY KEY,
      "city_id" text, "city_name" text, "permit_id" text, "permit_name" text,
      "category" text, "description" text, "calc_type" text, "input_field" text,
      "flat_fee" double precision, "fee_per_unit" double precision, "unit_label" text,
      "unit_threshold" double precision, "base_fee" double precision,
      "rate_per_unit" double precision, "base_includes_ft" double precision,
      "rate_per_linear_ft" double precision, "rate_percentage" double precision,
      "cost_threshold" double precision, "tiers_config" text,
      "technology_admin_fee" double precision, "planning_zoning_fee" double precision,
      "include_city_surcharges" boolean, "sort_order" double precision,
      "created_date" text, "updated_date" text, "created_by" text
    );`,
    `CREATE TABLE public."zoning_rules" (
      "id" text PRIMARY KEY,
      "city_id" text, "city_name" text, "zone_code" text, "zone_name" text,
      "use_codes" text, "min_lot_size_sqft" double precision,
      "min_lot_width_ft" double precision, "front_setback_ft" double precision,
      "rear_setback_ft" double precision, "side_setback_ft" double precision,
      "max_height_ft" double precision, "max_lot_coverage_pct" double precision,
      "max_floor_area_ratio" double precision, "max_impervious_pct" double precision,
      "allowed_uses" text, "conditional_uses" text, "notes" text,
      "created_date" text, "updated_date" text, "created_by" text
    );`,
  ];

  const results = [];
  for (const sql of sqls) {
    const r = await execSQL(sql);
    results.push({ sql: sql.substring(0, 50), ok: r.ok, status: r.status, body: r.body });
  }

  return Response.json({ results });
});