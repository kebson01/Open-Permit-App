import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { address } = await req.json();
    if (!address?.trim()) return Response.json({ error: 'Address is required' }, { status: 400 });

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a Broward County, Florida property expert with access to BCPA (Broward County Property Appraiser) records, municipal zoning codes, and FEMA flood maps.

Look up this property: "${address}"

Provide accurate data using:
1. BCPA.net records for folio, owner, land use, lot size, year built, assessed value
2. The specific city's zoning code (Weston, Coral Springs, Fort Lauderdale, Hollywood, Miramar, Pembroke Pines, Cooper City, Davie, etc.) for setbacks, height limits, coverage
3. FEMA NFHL for flood zone designation

For building_projects, analyze what is allowed based on the property's zoning district and provide at least these 6 types: ADU/Guest House, Swimming Pool, Privacy Fence, Home Addition, Accessory Shed, Solar Panels.

Set status to exactly one of: "allowed", "permit_required", "not_allowed", "conditional"

If the exact property isn't found, use realistic Broward County data and set is_estimated=true.`,
      add_context_from_internet: true,
      model: "gemini_3_flash",
      response_json_schema: {
        type: "object",
        properties: {
          found: { type: "boolean" },
          is_estimated: { type: "boolean" },
          folio: { type: "string" },
          owner_name: { type: "string" },
          verified_address: { type: "string" },
          city: { type: "string" },
          zip: { type: "string" },
          land_use: { type: "string" },
          zoning_district: { type: "string" },
          zoning_description: { type: "string" },
          lot_size_sqft: { type: "number" },
          year_built: { type: "number" },
          building_sqft: { type: "number" },
          market_value: { type: "number" },
          flood_zone: { type: "string" },
          flood_zone_description: { type: "string" },
          flood_insurance_required: { type: "boolean" },
          max_height_ft: { type: "number" },
          max_lot_coverage_pct: { type: "number" },
          setbacks: {
            type: "object",
            properties: {
              front_ft: { type: "number" },
              rear_ft: { type: "number" },
              side_ft: { type: "number" }
            }
          },
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
          },
          code_enforcement_notes: { type: "array", items: { type: "string" } }
        }
      }
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});