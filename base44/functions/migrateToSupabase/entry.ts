import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const BASE_HEADERS = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

// Reload PostgREST schema cache via NOTIFY
async function reloadSchemaCache() {
  // Extract project ref from URL e.g. https://abcdef.supabase.co -> abcdef
  const projectRef = SUPABASE_URL.replace("https://", "").split(".")[0];
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: "NOTIFY pgrst, 'reload schema';" }),
  });
  return { status: res.status, ok: res.ok };
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

function generateCreateSQL(tableName, sampleRow) {
  const cols = Object.entries(sampleRow).map(([key, val]) => {
    if (key === "id") return `  "id" text PRIMARY KEY`;
    let type = "text";
    if (typeof val === "number") type = Number.isInteger(val) ? "bigint" : "double precision";
    if (typeof val === "boolean") type = "boolean";
    return `  "${key}" ${type}`;
  }).join(",\n");
  return `CREATE TABLE IF NOT EXISTS public."${tableName}" (\n${cols}\n);`;
}

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

  const body = await req.json().catch(() => ({}));
  const { entity, generateSQL, reloadCache } = body;

  // Just reload schema cache
  if (reloadCache) {
    const result = await reloadSchemaCache();
    return Response.json({ reloadResult: result });
  }

  const entitiesToMigrate = entity
    ? { [entity]: ENTITY_TABLE_MAP[entity] }
    : ENTITY_TABLE_MAP;

  // Generate SQL for table creation
  if (generateSQL) {
    const sqlStatements = {};
    for (const [entityName, tableName] of Object.entries(entitiesToMigrate)) {
      const records = await base44.asServiceRole.entities[entityName].list();
      if (records && records.length > 0) {
        const allKeys = [...new Set(records.flatMap(r => Object.keys(r)))];
        const sampleRow = {};
        for (const k of allKeys) sampleRow[k] = records[0][k] ?? null;
        sqlStatements[entityName] = generateCreateSQL(tableName, sampleRow);
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