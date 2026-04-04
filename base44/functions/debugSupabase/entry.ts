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

  // Try Management API with access token
  const mgmtRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/sql`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: "SELECT 1 as test;" }),
  });
  const mgmtBody = await mgmtRes.text();

  // Try PostgREST with service role - list tables
  const pgrestRes = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
    },
  });
  const pgrestSpec = await pgrestRes.json();
  const tables = Object.keys(pgrestSpec.definitions || {});

  return Response.json({
    projectRef,
    tokenInfo,
    mgmtApiStatus: mgmtRes.status,
    mgmtApiBody: mgmtBody,
    pgrestStatus: pgrestRes.status,
    knownTables: tables,
  });
});