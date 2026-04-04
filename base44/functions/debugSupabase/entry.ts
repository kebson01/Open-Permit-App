import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user || user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const ACCESS_TOKEN = Deno.env.get("SUPABASE_ACCESS_TOKEN");

  const projectRef = SUPABASE_URL?.replace("https://", "").split(".")[0];

  // Show token info (first/last 8 chars only for security)
  const tokenInfo = ACCESS_TOKEN
    ? `${ACCESS_TOKEN.substring(0, 8)}...${ACCESS_TOKEN.substring(ACCESS_TOKEN.length - 8)} (length: ${ACCESS_TOKEN.length})`
    : "NOT SET";

  // Try PostgREST with service role - list tables
  const pgrestRes = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
    },
  });
  const pgrestSpec = await pgrestRes.json();
  const tables = Object.keys(pgrestSpec.definitions || {});

  // Try exec_sql RPC (requires the function to exist in Supabase)
  const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql: "SELECT 1 as test;" }),
  });
  const rpcBody = await rpcRes.text();

  // Try DB URL connection string
  const DB_URL = Deno.env.get("SUPABASE_DB_URL");
  const dbUrlInfo = DB_URL ? `set (length: ${DB_URL.length}, starts: ${DB_URL.substring(0, 15)})` : "NOT SET";

  return Response.json({
    projectRef,
    tokenInfo,
    pgrestStatus: pgrestRes.status,
    knownTables: tables,
    rpcStatus: rpcRes.status,
    rpcBody,
    dbUrlInfo,
  });
});