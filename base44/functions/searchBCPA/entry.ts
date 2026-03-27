import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { address } = await req.json();
    if (!address) return Response.json({ error: 'address required' }, { status: 400 });

    const query = address.trim().toUpperCase();

    // Check if it's a folio number (10-14 digits, possibly with dashes)
    const isFolio = /^\d[\d-]{8,14}$/.test(query.replace(/\s/g, ''));

    let results = [];

    if (isFolio) {
      const folio = query.replace(/[-\s]/g, '');
      results = await base44.entities.Property.filter({ FOLIO_NUMBER: folio }, 'FOLIO_NUMBER', 10);
    } else {
      // Use full_address field for fuzzy-ish search
      // Tokenize query and find records where full_address contains the key tokens
      const tokens = query.split(/\s+/).filter(t => t.length > 1);

      if (tokens.length === 0) {
        return Response.json({ properties: [], source: 'database' });
      }

      // Search by the most specific token (usually the street number if present)
      const streetNumToken = tokens.find(t => /^\d+$/.test(t));
      const nameTokens = tokens.filter(t => !/^\d+$/.test(t) && !['NW','NE','SW','SE','N','S','E','W','FL','DR','ST','AVE','BLVD','RD','CT','LN','WAY','TER','PL','CIR'].includes(t));

      let candidates = [];

      if (streetNumToken) {
        candidates = await base44.entities.Property.filter(
          { SITUS_STREET_NUMBER: streetNumToken },
          'full_address',
          500
        );
      } else if (nameTokens.length > 0) {
        candidates = await base44.entities.Property.filter(
          { SITUS_STREET_NAME: nameTokens[0] },
          'full_address',
          500
        );
      }

      // Client-side filter: every token must appear in full_address
      results = candidates.filter(p => {
        if (!p.full_address) return false;
        return tokens.every(t => p.full_address.includes(t));
      }).slice(0, 25);

      // If too few results and no street number, try name-only
      if (results.length === 0 && nameTokens.length > 0) {
        const byName = await base44.entities.Property.filter(
          { SITUS_STREET_NAME: nameTokens[0] },
          'full_address',
          100
        );
        results = byName.filter(p => {
          if (!p.full_address) return false;
          return nameTokens.every(t => p.full_address.includes(t));
        }).slice(0, 25);
      }
    }

    return Response.json({ properties: results, source: 'database' });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});