import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Parse address string into BCPA form fields
function parseAddress(raw) {
  const DIRECTIONS = ["N","S","E","W","NW","NE","SW","SE"];
  const STREET_TYPES = {
    "AVE": "Avenue", "AVENUE": "Avenue",
    "BLVD": "Boulevard", "BOULEVARD": "Boulevard",
    "CIR": "Circle", "CIRCLE": "Circle",
    "CT": "Court", "COURT": "Court",
    "DR": "Drive", "DRIVE": "Drive",
    "HWY": "Highway", "HIGHWAY": "Highway",
    "LN": "Lane", "LANE": "Lane",
    "PKWY": "Parkway", "PARKWAY": "Parkway",
    "PL": "Place", "PLACE": "Place",
    "RD": "Road", "ROAD": "Road",
    "ST": "Street", "STREET": "Street",
    "TER": "Terrace", "TERR": "Terrace", "TERRACE": "Terrace",
    "TR": "Trail", "TRAIL": "Trail",
    "WAY": "Way",
  };

  // Strip city/state/zip (after comma)
  const cleaned = raw.trim().toUpperCase().split(",")[0].trim();
  const parts = cleaned.split(/\s+/);

  const streetNum = /^\d+$/.test(parts[0]) ? parts[0] : "";
  let rest = streetNum ? parts.slice(1) : parts;

  // Extract direction prefix
  let streetDir = "";
  if (rest.length && DIRECTIONS.includes(rest[0])) {
    streetDir = rest[0];
    rest = rest.slice(1);
  }

  // Extract street type suffix
  let streetType = "";
  const lastWord = rest[rest.length - 1];
  if (lastWord && STREET_TYPES[lastWord]) {
    streetType = STREET_TYPES[lastWord];
    rest = rest.slice(0, -1);
  }

  // Strip ordinal suffix from street name parts (107TH -> 107)
  const streetName = rest.map(p => p.replace(/(\d+)(ST|ND|RD|TH)$/, "$1")).join(" ");

  return { streetNum, streetDir, streetName, streetType };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { address } = await req.json();
    if (!address) return Response.json({ error: 'address required' }, { status: 400 });

    const { streetNum, streetDir, streetName, streetType } = parseAddress(address);

    // POST to BCPA address search form
    const formData = new URLSearchParams();
    formData.append("URL_Num", streetNum);
    formData.append("URL_Dir", streetDir);
    formData.append("URL_Name", streetName);
    formData.append("URL_Type", streetType);
    formData.append("URL_PostDir", "");
    formData.append("URL_Unit", "");
    formData.append("URL_City", "");

    const res = await fetch("https://bcpa.net/RecAddr.asp", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://bcpa.net/RecMenu.asp",
      },
      body: formData.toString(),
    });

    const html = await res.text();

    // Parse property rows from BCPA results table
    // Rows look like: <TR><TD>folio</TD><TD>owner</TD><TD>address</TD><TD>city</TD>...
    const properties = [];
    const tagStrip = /<[^>]+>/g;

    // Find all table rows with folio-like content (12-digit or with letters)
    const rowMatches = html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
    for (const rowMatch of rowMatches) {
      const cells = [];
      const cellMatches = rowMatch[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi);
      for (const cell of cellMatches) {
        cells.push(cell[1].replace(tagStrip, '').replace(/&nbsp;/g, ' ').trim());
      }

      if (cells.length >= 3) {
        const folio = cells[0].replace(/\s+/g, '');
        // BCPA folios: 12 chars, digits + optional letters
        if (/^[0-9A-Z]{12}$/.test(folio) && folio !== '000000000000') {
          properties.push({
            FOLIO_NUMBER: folio,
            NAME_LINE_1: cells[1] || '',
            full_address: cells[2] || '',
            SITUS_CITY: cells[3] || '',
            SITUS_ZIP_CODE: cells[4] || '',
            USE_TYPE: cells[5] || '',
            _source: 'bcpa_live',
          });
        }
      }
    }

    return Response.json({ properties, parsed: { streetNum, streetDir, streetName, streetType } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});