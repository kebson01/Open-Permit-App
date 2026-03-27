import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { address } = await req.json();
    if (!address) return Response.json({ error: 'address required' }, { status: 400 });

    // Use LLM with web search to find BCPA property data
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Go to https://web.bcpa.net/bcpaclient/#/Record-Search and search for the property: "${address}" in Broward County, Florida. Fetch the LIVE, CURRENT data directly from the BCPA website (bcpa.net or web.bcpa.net) right now in ${new Date().getFullYear()}. Do NOT use cached or old data.

Return a JSON array of matching properties found. For each property include as many of these fields as you can find from the BCPA website:
- FOLIO_NUMBER (the BCPA folio/parcel ID, typically 12 digits)
- NAME_LINE_1 (current owner name)
- full_address (the site/property address as listed on BCPA)
- SITUS_STREET_NUMBER
- SITUS_STREET_DIRECTION (N/S/E/W/NW/NE/SW/SE)
- SITUS_STREET_NAME (just the name, no ordinal suffix — e.g. "107" not "107TH")
- SITUS_STREET_TYPE (e.g. AVE, DR, ST)
- SITUS_CITY
- SITUS_ZIP_CODE
- USE_TYPE (property use description)
- BLDG_YEAR_BUILT
- BEDS
- BATHS
- BLDG_UNDER_AIR_SQ_FOOTAGE
- GIS_SQUARE_FOOT (lot size)
- JUST_LAND_VALUE (current assessed value)
- JUST_BUILDING_VALUE (current assessed value)
- HOMESTEAD_FLAG (Y or N)

If no properties are found, return an empty array. Return ONLY valid JSON, no explanation.`,
      add_context_from_internet: true,
      model: "gemini_3_pro",
      response_json_schema: {
        type: "object",
        properties: {
          properties: {
            type: "array",
            items: {
              type: "object",
              properties: {
                FOLIO_NUMBER: { type: "string" },
                NAME_LINE_1: { type: "string" },
                full_address: { type: "string" },
                SITUS_STREET_NUMBER: { type: "string" },
                SITUS_STREET_DIRECTION: { type: "string" },
                SITUS_STREET_NAME: { type: "string" },
                SITUS_STREET_TYPE: { type: "string" },
                SITUS_CITY: { type: "string" },
                SITUS_ZIP_CODE: { type: "string" },
                USE_TYPE: { type: "string" },
                BLDG_YEAR_BUILT: { type: "number" },
                BEDS: { type: "number" },
                BATHS: { type: "number" },
                BLDG_UNDER_AIR_SQ_FOOTAGE: { type: "number" },
                GIS_SQUARE_FOOT: { type: "number" },
                JUST_LAND_VALUE: { type: "number" },
                JUST_BUILDING_VALUE: { type: "number" },
                HOMESTEAD_FLAG: { type: "string" },
              }
            }
          }
        }
      }
    });

    const properties = (result?.properties || []).map(p => ({ ...p, _source: 'bcpa_live' }));
    return Response.json({ properties });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});