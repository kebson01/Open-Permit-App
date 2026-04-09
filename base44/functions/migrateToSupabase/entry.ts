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
  PermitType: "weston_permit_types",
  FeeRule: "weston_fee_rules",
  CitySurcharge: "weston_city_surcharges",
  ZoningRule: "weston_zoning_rules",
  CodeOfOrdinance: "weston_code_of_ordinances",
  PermitRecord: "weston_permit_records",
};

function getSqlType(val) {
  if (typeof val === "boolean") return "boolean";
  if (typeof val === "number") return "double precision";
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

async function execSQL(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: BASE_HEADERS,
    body: JSON.stringify({ sql }),
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

  // Reload PostgREST schema cache
  if (reloadCache) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: "GET",
      headers: { ...BASE_HEADERS, "Accept": "application/json" },
    });
    return Response.json({ reloadResult: { ok: res.ok, status: res.status } });
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

      // Ensure table exists and has all columns via exec_sql RPC
      const createSQL = generateCreateSQL(tableName, allKeys, records[0]);
      await execSQL(createSQL);

      // Add any missing columns
      const addColSQLs = allKeys
        .filter(k => k !== "id")
        .map(k => `ALTER TABLE public."${tableName}" ADD COLUMN IF NOT EXISTS "${k}" ${getSqlType(records[0][k])};`)
        .join("\n");
      await execSQL(addColSQLs);

      // Reload schema cache so PostgREST sees new columns
      await fetch(`${SUPABASE_URL}/rest/v1/`, { headers: BASE_HEADERS });

      // Upsert via PostgREST in batches of 200
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