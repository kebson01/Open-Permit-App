import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

async function querySupabase(params) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/properties`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Accept": "application/json",
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase query failed (${res.status}): ${text}`);
  }
  return res.json();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { address } = await req.json();
    if (!address) return Response.json({ error: 'address required' }, { status: 400 });

    const query = address.trim().toUpperCase();
    const isFolio = /^\d[\d-]{8,14}$/.test(query.replace(/\s/g, ''));

    let results = [];

    if (isFolio) {
      const folio = query.replace(/[-\s]/g, '');
      results = await querySupabase({
        select: "*",
        folio_number: `eq.${folio}`,
        limit: 10,
      });
    } else {
      // Use ilike search — split tokens and filter by street number first for speed
      const searchTerm = query.replace(/[^A-Z0-9 ]/g, ' ').trim();
      const tokens = searchTerm.split(/\s+/).filter(t => t.length > 1);

      if (tokens.length > 0) {
        // Find the most specific anchor token (street number preferred)
        const streetNum = tokens.find(t => /^\d+$/.test(t));
        const keyToken = streetNum || tokens[0];

        results = await querySupabase({
          select: "*",
          full_address: `ilike.*${keyToken}*`,
          limit: 200,
        });

        // Client-side filter remaining tokens
        if (tokens.length > 1) {
          results = results.filter(p =>
            p.full_address && tokens.every(t => p.full_address.includes(t))
          );
        }

        results = results.slice(0, 25);
      }
    }

    const CITY_NAMES = {
      "WS": "Weston",
      "CS": "Coral Springs",
      "FL": "Fort Lauderdale",
      "HW": "Hollywood",
      "CC": "Cooper City",
      "PB": "Pembroke Pines",
      "MR": "Miramar",
      "SU": "Sunrise",
      "PL": "Plantation",
      "DV": "Davie",
      "DP": "Deerfield Beach",
      "PO": "Pompano Beach",
      "LH": "Lauderhill",
      "TM": "Tamarac",
      "NK": "North Lauderdale",
      "MC": "Margate",
      "CO": "Coconut Creek",
      "LK": "Lauderdale Lakes",
      "OB": "Oakland Park",
      "WP": "Wilton Manors",
      "LB": "Lauderdale-by-the-Sea",
      "HA": "Hallandale Beach",
      "SW": "Southwest Ranches",
      "WR": "West Park",
      "PV": "Pembroke Park",
      "HC": "Hillsboro Beach",
      "LY": "Lazy Lake",
      "SH": "Sea Ranch Lakes",
    };

    // Normalize field names to uppercase (Supabase stores lowercase)
    const normalized = results.map(row => {
      const out = {};
      for (const [k, v] of Object.entries(row)) {
        out[k.toUpperCase()] = v;
      }
      // Expand city abbreviations
      if (out.SITUS_CITY && CITY_NAMES[out.SITUS_CITY]) {
        out.SITUS_CITY = CITY_NAMES[out.SITUS_CITY];
      }
      // Keep lowercase aliases too for permit history lookup
      out.FOLIO_NUMBER = row.folio_number;
      return out;
    });

    return Response.json({ properties: normalized, source: 'supabase' });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});