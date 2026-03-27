import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { address } = await req.json();
    if (!address) return Response.json({ error: 'address required' }, { status: 400 });

    const query = address.trim().toUpperCase();

    // Check if we have local property data
    const countCheck = await base44.entities.Property.list('FOLIO_NUMBER', 1);
    if (!countCheck || countCheck.length === 0) {
      return Response.json({ properties: [], source: 'empty_db' });
    }

    // Determine if it's a folio number (all digits)
    const isFolio = /^\d{10,14}$/.test(query.replace(/-/g, ''));

    let results = [];

    if (isFolio) {
      // Exact folio lookup
      const folio = query.replace(/-/g, '');
      results = await base44.entities.Property.filter({ FOLIO_NUMBER: folio }, 'FOLIO_NUMBER', 10);
    } else {
      // Parse address components from query
      // Try to extract street number if present
      const streetNumberMatch = query.match(/^(\d+)\s+/);
      const streetNumber = streetNumberMatch ? streetNumberMatch[1] : null;

      // Extract street name — remove number prefix, direction suffixes, street types
      let streetName = query
        .replace(/^\d+\s+/, '')           // remove leading number
        .replace(/\b(NW|NE|SW|SE|N|S|E|W)\s+/g, '') // remove directions
        .replace(/\b(ST|AVE|DR|BLVD|RD|CT|LN|WAY|TER|PL|CIR|PKWY|HWY)\b.*$/i, '') // remove type+rest
        .trim();

      if (streetNumber && streetName) {
        // Filter by street number + name
        results = await base44.entities.Property.filter(
          { SITUS_STREET_NUMBER: streetNumber },
          'SITUS_STREET_NAME',
          100
        );
        // Client-side filter by street name match
        const namePart = streetName.split(' ')[0]; // first word of street name
        results = results.filter(p =>
          p.SITUS_STREET_NAME && p.SITUS_STREET_NAME.toUpperCase().includes(namePart.toUpperCase())
        ).slice(0, 20);
      } else if (streetName) {
        // Street name only search
        results = await base44.entities.Property.filter(
          { SITUS_STREET_NAME: streetName.split(' ')[0] },
          'SITUS_STREET_NUMBER',
          20
        );
      }
    }

    return Response.json({ properties: results, source: 'database' });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});