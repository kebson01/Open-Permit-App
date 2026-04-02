import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

async function upsertToSupabase(table, rows) {
  if (!rows || rows.length === 0) return { count: 0, error: null };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const text = await res.text();
    return { count: 0, error: `${res.status}: ${text}` };
  }
  return { count: rows.length, error: null };
}

// Map Base44 entity names to Supabase table names (snake_case)
const ENTITY_TABLE_MAP = {
  City: "cities",
  Project: "projects",
  PermitType: "permit_types",
  FeeRule: "fee_rules",
  CitySurcharge: "city_surcharges",
  ZoningRule: "zoning_rules",
  CodeOfOrdinance: "code_of_ordinances",
  PermitRecord: "permit_records",
};

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user || user.role !== "admin") {
    return Response.json({ error: "Admin access required" }, { status: 403 });
  }

  const { entity } = await req.json().catch(() => ({}));

  // Determine which entities to migrate
  const entitiesToMigrate = entity
    ? { [entity]: ENTITY_TABLE_MAP[entity] }
    : ENTITY_TABLE_MAP;

  const results = {};

  for (const [entityName, tableName] of Object.entries(entitiesToMigrate)) {
    try {
      // Fetch all records from Base44
      const records = await base44.asServiceRole.entities[entityName].list();

      if (!records || records.length === 0) {
        results[entityName] = { count: 0, table: tableName, status: "empty" };
        continue;
      }

      // Clean up records: remove Base44-internal fields that Supabase may not have
      const cleaned = records.map(r => {
        const row = { ...r };
        // Keep id as-is so we can use it for merge-duplicates upsert
        return row;
      });

      // Upsert in batches of 500
      let totalInserted = 0;
      let lastError = null;
      for (let i = 0; i < cleaned.length; i += 500) {
        const batch = cleaned.slice(i, i + 500);
        const { count, error } = await upsertToSupabase(tableName, batch);
        totalInserted += count;
        if (error) { lastError = error; break; }
      }

      results[entityName] = {
        count: totalInserted,
        total: records.length,
        table: tableName,
        status: lastError ? "error" : "success",
        error: lastError,
      };
    } catch (err) {
      results[entityName] = {
        count: 0,
        table: tableName,
        status: "error",
        error: err.message,
      };
    }
  }

  return Response.json({ results });
});