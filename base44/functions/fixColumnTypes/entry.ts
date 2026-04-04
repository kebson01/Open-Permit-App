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

  // Get all numeric columns in fee_rules and zoning_rules and cast them to double precision
  const fixes = [
    // fee_rules numeric columns
    `ALTER TABLE public."fee_rules" ALTER COLUMN "flat_fee" TYPE double precision USING "flat_fee"::double precision;`,
    `ALTER TABLE public."fee_rules" ALTER COLUMN "fee_per_unit" TYPE double precision USING "fee_per_unit"::double precision;`,
    `ALTER TABLE public."fee_rules" ALTER COLUMN "unit_threshold" TYPE double precision USING "unit_threshold"::double precision;`,
    `ALTER TABLE public."fee_rules" ALTER COLUMN "base_fee" TYPE double precision USING "base_fee"::double precision;`,
    `ALTER TABLE public."fee_rules" ALTER COLUMN "rate_per_unit" TYPE double precision USING "rate_per_unit"::double precision;`,
    `ALTER TABLE public."fee_rules" ALTER COLUMN "base_includes_ft" TYPE double precision USING "base_includes_ft"::double precision;`,
    `ALTER TABLE public."fee_rules" ALTER COLUMN "rate_per_linear_ft" TYPE double precision USING "rate_per_linear_ft"::double precision;`,
    `ALTER TABLE public."fee_rules" ALTER COLUMN "rate_percentage" TYPE double precision USING "rate_percentage"::double precision;`,
    `ALTER TABLE public."fee_rules" ALTER COLUMN "cost_threshold" TYPE double precision USING "cost_threshold"::double precision;`,
    `ALTER TABLE public."fee_rules" ALTER COLUMN "technology_admin_fee" TYPE double precision USING "technology_admin_fee"::double precision;`,
    `ALTER TABLE public."fee_rules" ALTER COLUMN "planning_zoning_fee" TYPE double precision USING "planning_zoning_fee"::double precision;`,
    `ALTER TABLE public."fee_rules" ALTER COLUMN "sort_order" TYPE double precision USING "sort_order"::double precision;`,
    // zoning_rules numeric columns
    `ALTER TABLE public."zoning_rules" ALTER COLUMN "min_lot_size_sqft" TYPE double precision USING "min_lot_size_sqft"::double precision;`,
    `ALTER TABLE public."zoning_rules" ALTER COLUMN "min_lot_width_ft" TYPE double precision USING "min_lot_width_ft"::double precision;`,
    `ALTER TABLE public."zoning_rules" ALTER COLUMN "front_setback_ft" TYPE double precision USING "front_setback_ft"::double precision;`,
    `ALTER TABLE public."zoning_rules" ALTER COLUMN "rear_setback_ft" TYPE double precision USING "rear_setback_ft"::double precision;`,
    `ALTER TABLE public."zoning_rules" ALTER COLUMN "side_setback_ft" TYPE double precision USING "side_setback_ft"::double precision;`,
    `ALTER TABLE public."zoning_rules" ALTER COLUMN "max_height_ft" TYPE double precision USING "max_height_ft"::double precision;`,
    `ALTER TABLE public."zoning_rules" ALTER COLUMN "max_lot_coverage_pct" TYPE double precision USING "max_lot_coverage_pct"::double precision;`,
    `ALTER TABLE public."zoning_rules" ALTER COLUMN "max_floor_area_ratio" TYPE double precision USING "max_floor_area_ratio"::double precision;`,
    `ALTER TABLE public."zoning_rules" ALTER COLUMN "max_impervious_pct" TYPE double precision USING "max_impervious_pct"::double precision;`,
  ];

  const results = [];
  for (const sql of fixes) {
    const r = await execSQL(sql);
    results.push({ sql: sql.substring(0, 60), ok: r.ok, status: r.status });
  }

  return Response.json({ results });
});