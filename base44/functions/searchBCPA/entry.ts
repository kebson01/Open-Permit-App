import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const HEADERS = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Accept": "application/json",
  "Prefer": "count=none",
};

async function supabaseGet(table, params) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), { headers: HEADERS });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase ${table} query failed (${res.status}): ${text}`);
  }
  return res.json();
}

const CITY_NAMES = {
  "WS": "Weston", "CS": "Coral Springs", "FL": "Fort Lauderdale",
  "HW": "Hollywood", "CC": "Cooper City", "PB": "Pembroke Pines",
  "MR": "Miramar", "SU": "Sunrise", "PL": "Plantation", "DV": "Davie",
  "DP": "Deerfield Beach", "PO": "Pompano Beach", "LH": "Lauderhill",
  "TM": "Tamarac", "NK": "North Lauderdale", "MC": "Margate",
  "CO": "Coconut Creek", "LK": "Lauderdale Lakes", "OB": "Oakland Park",
  "WP": "Wilton Manors", "LB": "Lauderdale-by-the-Sea", "HA": "Hallandale Beach",
  "SW": "Southwest Ranches", "WR": "West Park", "PV": "Pembroke Park",
  "HC": "Hillsboro Beach", "LY": "Lazy Lake", "SH": "Sea Ranch Lakes",
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { address } = await req.json();
    if (!address) return Response.json({ error: 'address required' }, { status: 400 });

    const query = address.trim().toUpperCase();
    const isFolio = /^\d[\d-]{8,14}$/.test(query.replace(/\s/g, ''));

    let propertyRows = [];

    if (isFolio) {
      const folio = query.replace(/[-\s]/g, '');
      propertyRows = await supabaseGet("properties", {
        select: "*",
        "FOLIO_NUMBER": `eq.${folio}`,
        limit: 10,
      });
    } else {
      const searchTerm = query.replace(/[^A-Z0-9 ]/g, ' ').trim();
      const tokens = searchTerm.split(/\s+/).filter(t => t.length > 1);

      if (tokens.length > 0) {
        const streetNum = tokens.find(t => /^\d+$/.test(t));
        const keyToken = streetNum || tokens[0];

        propertyRows = await supabaseGet("properties", {
          select: "*",
          full_address: `ilike.*${keyToken}*`,
          limit: 200,
        });

        if (tokens.length > 1) {
          propertyRows = propertyRows.filter(p =>
            p.full_address && tokens.every(t => p.full_address.toUpperCase().includes(t))
          );
        }

        propertyRows = propertyRows.slice(0, 25);
      }
    }

    // Collect all folio numbers to fetch permit records in one query
    const folioNumbers = propertyRows
      .map(p => p.FOLIO_NUMBER || p.folio_number)
      .filter(Boolean);

    let permitRows = [];
    if (folioNumbers.length > 0) {
      // permit_records uses PARCEL_NBR to link to properties
      permitRows = await supabaseGet("permit_records", {
        select: "*",
        "PARCEL_NBR": `in.(${folioNumbers.join(",")})`,
        limit: 500,
      });
    }

    // Index permits by parcel number for fast lookup
    const permitsByFolio = {};
    for (const permit of permitRows) {
      const key = permit.PARCEL_NBR || permit.parcel_nbr;
      if (!permitsByFolio[key]) permitsByFolio[key] = [];
      permitsByFolio[key].push(permit);
    }

    // Normalize property field names to uppercase and attach permits
    const normalized = propertyRows.map(row => {
      const out = {};
      for (const [k, v] of Object.entries(row)) {
        out[k.toUpperCase()] = v;
      }
      if (out.SITUS_CITY && CITY_NAMES[out.SITUS_CITY]) {
        out.SITUS_CITY = CITY_NAMES[out.SITUS_CITY];
      }
      // Attach permits for this property
      const folio = row.FOLIO_NUMBER || row.folio_number;
      out.FOLIO_NUMBER = folio;
      out.permit_records = permitsByFolio[folio] || [];
      return out;
    });

    return Response.json({ properties: normalized, source: 'supabase' });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});