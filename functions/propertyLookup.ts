import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { address } = await req.json();
    if (!address?.trim()) {
      return Response.json({ error: 'Address is required' }, { status: 400 });
    }

    // Search local Property dataset by address (case-insensitive partial match)
    const allProperties = await base44.entities.Property.list();
    const searchTerm = address.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();

    // Score each property by how well address matches
    const scored = allProperties.map(p => {
      const pAddr = (p.address || '').toLowerCase().replace(/[^a-z0-9 ]/g, '');
      const searchWords = searchTerm.split(' ').filter(Boolean);
      const matchCount = searchWords.filter(w => pAddr.includes(w)).length;
      return { property: p, score: matchCount };
    }).filter(x => x.score > 0);

    scored.sort((a, b) => b.score - a.score);
    const match = scored[0]?.property || null;

    if (!match) {
      return Response.json({
        found: false,
        error: 'No property found in the city dataset for that address. Please verify the address or contact the building department.'
      });
    }

    // Build base result from dataset
    const base = {
      found: true,
      is_estimated: false,
      folio: match.folio || null,
      owner_name: match.owner_name || null,
      verified_address: match.address,
      city: match.city || null,
      zip: match.zip || null,
      land_use: match.land_use || null,
      zoning_district: match.zoning_district || null,
      zoning_description: match.zoning_description || null,
      lot_size_sqft: match.lot_size_sqft || null,
      year_built: match.year_built || null,
      building_sqft: match.building_sqft || null,
      market_value: match.market_value || null,
      flood_zone: match.flood_zone || null,
      flood_insurance_required: match.flood_insurance_required ?? null,
      max_height_ft: match.max_height_ft || null,
      max_lot_coverage_pct: match.max_lot_coverage_pct || null,
      setbacks: {
        front_ft: match.setback_front_ft || null,
        rear_ft: match.setback_rear_ft || null,
        side_ft: match.setback_side_ft || null
      },
      historic_district: match.historic_district || false,
      code_enforcement_notes: match.notes ? [match.notes] : []
    };

    // Use LLM only to generate building_projects analysis based on the zoning data
    const zoningContext = [
      match.zoning_district && `Zoning: ${match.zoning_district}`,
      match.zoning_description && `Description: ${match.zoning_description}`,
      match.city && `City: ${match.city}`,
      match.setback_front_ft && `Front setback: ${match.setback_front_ft}ft`,
      match.setback_rear_ft && `Rear setback: ${match.setback_rear_ft}ft`,
      match.setback_side_ft && `Side setback: ${match.setback_side_ft}ft`,
      match.max_height_ft && `Max height: ${match.max_height_ft}ft`,
      match.max_lot_coverage_pct && `Max coverage: ${match.max_lot_coverage_pct}%`,
      match.flood_zone && `Flood zone: ${match.flood_zone}`,
      match.historic_district && `Historic district: yes`,
      match.lot_size_sqft && `Lot size: ${match.lot_size_sqft} sqft`,
      match.building_sqft && `Existing building: ${match.building_sqft} sqft`
    ].filter(Boolean).join('\n');

    const projectsResult = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a Broward County, Florida building permit expert.

Property data from the city's official dataset:
${zoningContext}

Based on this zoning and property data, evaluate feasibility for each of these building project types:
ADU/Guest House, Swimming Pool, Privacy Fence, Home Addition, Accessory Shed, Solar Panels, Carport/Garage, Patio/Deck Cover

For each, return:
- name
- category (one of: Residential Accessory, Outdoor Improvement, Site Improvement, Structural)
- status (exactly one of: "allowed", "permit_required", "not_allowed", "conditional")
- permit_required (boolean)
- requirements: list of 2-3 key requirements
- restrictions: list of 1-2 key restrictions based on the zoning data above`,
      response_json_schema: {
        type: "object",
        properties: {
          building_projects: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                category: { type: "string" },
                status: { type: "string" },
                permit_required: { type: "boolean" },
                requirements: { type: "array", items: { type: "string" } },
                restrictions: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      }
    });

    base.building_projects = projectsResult?.building_projects || [];
    return Response.json(base);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});