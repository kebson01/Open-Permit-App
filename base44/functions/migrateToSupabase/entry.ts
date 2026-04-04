import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import postgres from 'npm:postgres@3.4.4';

const SUPABASE_DB_URL = Deno.env.get("SUPABASE_DB_URL");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

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

async function createTableIfNeeded(sql, tableName, allKeys, sampleRow) {
  const cols = allKeys.map(key => {
    if (key === "id") return sql`"id" text PRIMARY KEY`;
    const type = getSqlType(sampleRow[key]);
    // Use unsafe for dynamic DDL
    return `"${key}" ${type}`;
  });
  const colDefs = allKeys.map(key => {
    if (key === "id") return `"id" text PRIMARY KEY`;
    const type = getSqlType(sampleRow[key]);
    return `"${key}" ${type}`;
  }).join(", ");
  await sql.unsafe(`CREATE TABLE IF NOT EXISTS public."${tableName}" (${colDefs})`);
}

async function addMissingColumns(sql, tableName, allKeys, sampleRow) {
  // Get existing columns
  const existing = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = ${tableName}
  `;
  const existingSet = new Set(existing.map(r => r.column_name));
  for (const key of allKeys) {
    if (!existingSet.has(key)) {
      const type = getSqlType(sampleRow[key]);
      await sql.unsafe(`ALTER TABLE public."${tableName}" ADD COLUMN IF NOT EXISTS "${key}" ${type}`);
    }
  }
}

async function upsertRows(sql, tableName, rows, allKeys) {
  if (rows.length === 0) return;
  const colList = allKeys.map(k => `"${k}"`).join(", ");
  const conflictUpdate = allKeys.filter(k => k !== "id").map(k => `"${k}" = EXCLUDED."${k}"`).join(", ");

  // Insert in chunks of 100
  for (let i = 0; i < rows.length; i += 100) {
    const chunk = rows.slice(i, i + 100);
    const values = chunk.map(row => allKeys.map(k => row[k] ?? null));
    await sql.unsafe(
      `INSERT INTO public."${tableName}" (${colList}) VALUES ${values.map((_, idx) =>
        `(${allKeys.map((__, ci) => `$${idx * allKeys.length + ci + 1}`).join(", ")})`
      ).join(", ")} ON CONFLICT ("id") DO UPDATE SET ${conflictUpdate}`,
      values.flat()
    );
  }
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user || user.role !== "admin") {
    return Response.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { entity, generateSQL, reloadCache } = body;

  // Generate SQL preview (no DB needed)
  if (generateSQL) {
    const sqlStatements = {};
    const entitiesToCheck = entity ? { [entity]: ENTITY_TABLE_MAP[entity] } : ENTITY_TABLE_MAP;
    for (const [entityName, tableName] of Object.entries(entitiesToCheck)) {
      const records = await base44.asServiceRole.entities[entityName].list();
      if (records && records.length > 0) {
        const allKeys = [...new Set(records.flatMap(r => Object.keys(r)))];
        sqlStatements[entityName] = generateCreateSQL(tableName, allKeys, records[0]);
      }
    }
    return Response.json({ sqlStatements });
  }

  // Reload cache (informational — actual reload happens via pg NOTIFY)
  if (reloadCache) {
    const sql = postgres(SUPABASE_DB_URL, { ssl: "require", max: 1 });
    try {
      await sql`SELECT pg_notify('pgrst', 'reload schema')`;
      await sql.end();
      return Response.json({ reloadResult: { ok: true, status: 200 } });
    } catch (err) {
      await sql.end();
      return Response.json({ reloadResult: { ok: false, error: err.message } });
    }
  }

  // Run migration via direct Postgres connection
  const sql = postgres(SUPABASE_DB_URL, { ssl: "require", max: 1 });
  const entitiesToMigrate = entity
    ? { [entity]: ENTITY_TABLE_MAP[entity] }
    : ENTITY_TABLE_MAP;

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

      // Create table + add any missing columns
      await createTableIfNeeded(sql, tableName, allKeys, records[0]);
      await addMissingColumns(sql, tableName, allKeys, records[0]);

      // Upsert all rows
      await upsertRows(sql, tableName, normalized, allKeys);

      // Notify PostgREST to reload schema
      await sql`SELECT pg_notify('pgrst', 'reload schema')`;

      results[entityName] = {
        count: records.length,
        total: records.length,
        table: tableName,
        status: "success",
      };
    } catch (err) {
      results[entityName] = { count: 0, table: tableName, status: "error", error: err.message };
    }
  }

  await sql.end();
  return Response.json({ results });
});