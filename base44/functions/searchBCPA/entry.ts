import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { address } = await req.json();
    if (!address) return Response.json({ error: 'address required' }, { status: 400 });

    // Use BCPA's public property search API
    const encoded = encodeURIComponent(address);
    const url = `https://bcpa.net/RecAddr.asp?URL_Addr=${encoded}`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'text/html',
      }
    });

    const html = await res.text();

    // Parse property rows from BCPA HTML table
    const properties = [];

    // BCPA returns a table with folio, owner, address info
    // Match rows like: folio number, owner name, situs address
    const rowRegex = /<tr[^>]*>[\s\S]*?<\/tr>/gi;
    const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const tagRegex = /<[^>]+>/g;

    const rows = html.match(rowRegex) || [];
    for (const row of rows) {
      const cells = [];
      let m;
      const cellRe = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      while ((m = cellRe.exec(row)) !== null) {
        cells.push(m[1].replace(tagRegex, '').trim());
      }

      // BCPA table: folio | owner | site address | city | zip | use
      if (cells.length >= 4 && /^\d{12}$/.test(cells[0].replace(/[-\s]/g, ''))) {
        const folio = cells[0].replace(/[-\s]/g, '');
        const owner = cells[1] || '';
        const siteAddr = cells[2] || '';
        const city = cells[3] || '';
        const zip = cells[4] || '';

        if (folio && siteAddr) {
          properties.push({
            FOLIO_NUMBER: folio,
            NAME_LINE_1: owner,
            full_address: siteAddr,
            SITUS_CITY: city,
            SITUS_ZIP_CODE: zip,
            _source: 'bcpa_live'
          });
        }
      }
    }

    // Also try the BCPA JSON search API as a fallback
    if (properties.length === 0) {
      const apiUrl = `https://bcpa.net/api/search?address=${encoded}&type=address`;
      try {
        const apiRes = await fetch(apiUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (apiRes.ok) {
          const data = await apiRes.json();
          if (Array.isArray(data)) {
            for (const item of data.slice(0, 20)) {
              properties.push({ ...item, _source: 'bcpa_api' });
            }
          }
        }
      } catch (_) {}
    }

    return Response.json({ properties, html_length: html.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});