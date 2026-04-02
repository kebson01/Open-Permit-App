import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Extract project ref from URL like https://xxxx.supabase.co
function getProjectRef() {
  const match = SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match?.[1];
}

async function createTableViaManagementAPI(projectRef, tableName, sampleRow) {
  const columns = Object.entries(sampleRow).map(([key, val]) => {
    let type = "text";
    if (typeof val === "number") type = Number.isInteger(val) ? "int8" : "float8";
    if (typeof val === "boolean") type = "bool";
    return {
      name: key,
      type,
      ...(key === "id" ? { isPrimaryKey: true } : {}),
    };
  });

  const res = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/tables`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: tableName, schema: "public", columns }),
    }
  );
  const text = await res.text();
  return { ok: res.ok, status: res.status, text };
}

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
  const entitiesToMigrate = entity
    ? { [entity]: ENTITY_TABLE_MAP[entity] }
    : ENTITY_TABLE_MAP;

  const projectRef = getProjectRef();
  const results = {};

  for (const [entityName, tableName] of Object.entries(entitiesToMigrate)) {
    try {
      const records = await base44.asServiceRole.entities[entityName].list();

      if (!records || records.length === 0) {
        results[entityName] = { count: 0, table: tableName, status: "empty" };
        continue;
      }

      // Normalize: ensure all rows have the same keys
      const allKeys = [...new Set(records.flatMap(r => Object.keys(r)))];
      const normalized = records.map(r => {
        const row = {};
        for (const k of allKeys) row[k] = r[k] ?? null;
        return row;
      });

      // Try to create the table via Management API
      if (projectRef) {
        const createRes = await createTableViaManagementAPI(projectRef, tableName, normalized[0]);
        if (!createRes.ok && !createRes.text.includes("already exists")) {
          console.log(`Table create note [${tableName}]:`, createRes.text);
        }
        // Small delay to let schema cache refresh
        await new Promise(r => setTimeout(r, 1500));
      }

      // Upsert in batches of 500
      let totalInserted = 0;
      let lastError = null;
      for (let i = 0; i < normalized.length; i += 500) {
        const batch = normalized.slice(i, i + 500);
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