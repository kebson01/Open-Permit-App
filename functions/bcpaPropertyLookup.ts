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
2. The specific city's zoning code for setbacks, height limits, coverage. Use these EXACT Broward County zoning setbacks:

BROWARD COUNTY zoning districts (applies when city uses county code, marked with * on BCPA):
- RS-1: Front 25, Rear 25, Side 10 ft, Height 35 ft, Coverage 33%
- RS-2: Front 25, Rear 25, Side 7.5 ft, Height 35 ft, Coverage 33%
- RS-3: Front 25, Rear 25, Side 7.5 ft, Height 35 ft, Coverage 35%
- RS-4: Front 25, Rear 25, Side 7.5 ft, Height 35 ft, Coverage 40%
- RS-5: Front 25, Rear 20, Side 7.5 ft, Height 35 ft, Coverage 45%

WESTON (uses own code): Front 25, Rear 20, Side 7.5 ft, Height 35 ft, Coverage 40%
CORAL SPRINGS RS-3/4/5: Front 25, Rear 25, Side 7.5 ft, Height 35 ft, Coverage 35%
FORT LAUDERDALE RS-8: Front 25, Rear 25, Side 5 ft, Height 35 ft, Coverage 40%
COOPER CITY R-1-A: Front 25, Rear 30, Side 15 ft, Height 30 ft, Coverage 33%
COOPER CITY R-1-B: Front 25, Rear 25, Side 7.5 ft, Height 30 ft, Coverage 35%
HOLLYWOOD RS-6000: Front 25, Rear 25, Side 7.5 ft, Height 35 ft, Coverage 40%
DAVIE RS-4: Front 25, Rear 25, Side 7.5 ft, Height 35 ft, Coverage 40%
MIRAMAR RS: Front 25, Rear 20, Side 7.5 ft, Height 35 ft, Coverage 40%
PEMBROKE PINES RS: Front 25, Rear 20, Side 7.5 ft, Height 35 ft, Coverage 40%

3. FEMA NFHL for flood zone designation (search the address on msc.fema.gov)

IMPORTANT: Use the setback table above. Do NOT invent setbacks. If the zoning district is not listed, use the closest match and note it.

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