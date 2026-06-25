// Invites a user by email and seeds their role/city in user_metadata.
// Replaces base44.users.inviteUser. Uses the service-role key (admin API).
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceKey) return json({ error: "SUPABASE_SERVICE_ROLE_KEY is not configured" }, 500);

    // Only an existing admin or city_admin may invite users.
    const caller = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
    });
    const { data: { user } } = await caller.auth.getUser();
    const callerRole = user?.user_metadata?.role;
    if (!user || (callerRole !== "admin" && callerRole !== "city_admin")) {
      return json({ error: "Not authorized to invite users" }, 403);
    }

    const { email, role = "user", city_name } = await req.json();
    if (!email) return json({ error: "email is required" }, 400);

    const metadata: Record<string, unknown> = { role };
    if (city_name) metadata.city_name = city_name;

    const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { data: metadata });
    if (error) throw error;

    return json({ success: true, user_id: data.user?.id });
  } catch (error) {
    return json({ error: (error as Error).message }, 500);
  }
});
