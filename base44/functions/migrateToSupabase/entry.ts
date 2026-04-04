import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const BASE_HEADERS = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

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

// Extract project ref from Supabase URL
function getProjectRef() {
  return SUPABASE_URL.replace("https://", "").split(".")[0];
}

// Run SQL via Supabase Management API
async function runSQL(sql) {
  const projectRef = getProjectRef();
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, body: text };
}

function getSqlType(val) {
  if (typeof val === "number") return Number.isInteger(val) ? "bigint" : "double precision";
  if (typeof val === "boolean") return "boolean";
  return "text";
}

function generateCreateSQL(tableName, allKeys, sampleRow) {
  const cols = allKeys.map(key => {
    if (key === "id") return `"id" text PRIMARY KEY`;
    const type = getSqlType(sampleRow[key]);
    return `"${key}" ${type}`;
  }).join(",\n  ");
  return `CREATE TABLE IF NOT EXISTS public."${tableName}" (\n  ${cols}\n);`;
}

async function ensureTable(tableName, allKeys, sampleRow) {
  const sql = generateCreateSQL(tableName, allKeys, sampleRow);
  const result = await runSQL(sql);
  if (!result.ok) throw new Error(`Create table failed (${result.status}): ${result.body}`);

  // Add any missing columns
  for (const key of allKeys) {
    if (key === "id") continue;
    const type = getSqlType(sampleRow[key]);
    await runSQL(`ALTER TABLE public."${tableName}" ADD COLUMN IF NOT EXISTS "${key}" ${type};`);
  }

  // Notify PostgREST to reload schema
  await runSQL(`SELECT pg_notify('pgrst', 'reload schema');`);
}

async function upsertBatch(table, rows) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...BASE_HEADERS, "Prefer": "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const text = await res.text();
    return { error: `${res.status}: ${text}` };
  }
  return { error: null };
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user || user.role !== "admin") {
    return Response.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { entity, generateSQL, reloadCache } = body;

  // Reload schema cache via Management API
  if (reloadCache) {
    const result = await runSQL(`SELECT pg_notify('pgrst', 'reload schema');`);
    return Response.json({ reloadResult: { ok: result.ok, status: result.status, body: result.body } });
  }

  const entitiesToMigrate = entity
    ? { [entity]: ENTITY_TABLE_MAP[entity] }
    : ENTITY_TABLE_MAP;

  // Generate SQL preview only
  if (generateSQL) {
    const sqlStatements = {};
    for (const [entityName, tableName] of Object.entries(entitiesToMigrate)) {
      const records = await base44.asServiceRole.entities[entityName].list();
      if (records && records.length > 0) {
        const allKeys = [...new Set(records.flatMap(r => Object.keys(r)))];
        sqlStatements[entityName] = generateCreateSQL(tableName, allKeys, records[0]);
      }
    }
    return Response.json({ sqlStatements });
  }

  const results = {};

  for (const [entityName, tableName] of Object.entries(entitiesToMigrate)) {
    try {
      const records = await base44.asServiceRole.entities[entityName].list();

      if (!records || records.length === 0) {
        results[entityName] = { count: 0, table: tableName, status: "empty" };
        continue;
      }

      const allKeys = [...new Set(records.flatMap(r => Object.keys(r)))];
      const normalized = records.map(r => {
        const row = {};
        for (const k of allKeys) row[k] = r[k] ?? null;
        return row;
      });

      // Ensure table exists with correct columns
      await ensureTable(tableName, allKeys, records[0]);

      // Upsert in batches of 200
      let totalInserted = 0;
      let lastError = null;
      for (let i = 0; i < normalized.length; i += 200) {
        const batch = normalized.slice(i, i + 200);
        const { error } = await upsertBatch(tableName, batch);
        if (error) { lastError = error; break; }
        totalInserted += batch.length;
      }

      results[entityName] = {
        count: totalInserted,
        total: records.length,
        table: tableName,
        status: lastError ? "error" : "success",
        error: lastError,
      };
    } catch (err) {
      results[entityName] = { count: 0, table: tableName, status: "error", error: err.message };
    }
  }

  return Response.json({ results });
});