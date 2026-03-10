import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { address, folio: providedFolio } = await req.json();
    if (!address?.trim() && !providedFolio?.trim()) {
      return Response.json({ error: 'Address or folio is required' }, { status: 400 });
    }

    let folio = providedFolio?.replace(/[\s\-]/g, '') || null;
    let bcpaHtml = null;

    // STEP 1: If no folio provided, find it from the address via LLM web search
    if (!folio) {
      const folioResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Search BCPA (Broward County Property Appraiser) at bcpa.net for the property at: "${address}"

Find the exact 12-digit FOLIO number for this property. The folio looks like: 5141320010770 or 504209090700

Return the folio number digits only (no dashes, no spaces).
If not found, set found=false.`,
        add_context_from_internet: true,
        model: "gemini_3_flash",
        response_json_schema: {
          type: "object",
          properties: {
            folio: { type: "string" },
            found: { type: "boolean" }
          }
        }
      });

      if (folioResult?.found && folioResult?.folio) {
        folio = folioResult.folio.replace(/[\s\-]/g, '');
      }
    }

    // STEP 2: Fetch real BCPA RecInfo page
    if (folio) {
      const bcpaUrl = `https://bcpa.net/RecInfo.asp?URL_Folio=${folio}`;
      const bcpaResponse = await fetch(bcpaUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      if (bcpaResponse.ok) {
        const html = await bcpaResponse.text();
        if (html.includes('Property Owner') && html.includes('Property Address')) {
          // Strip scripts/styles to reduce size, keep text content
          bcpaHtml = html
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/<img[^>]*>/gi, '')
            .replace(/\s{3,}/g, ' ')
            .substring(0, 15000);
        }
      }
    }

    // STEP 3: Use LLM to parse BCPA data AND add zoning/flood/projects
    const bcpaContext = bcpaHtml
      ? `REAL BCPA PAGE HTML (from bcpa.net/RecInfo.asp?URL_Folio=${folio}):
${bcpaHtml}

Extract ALL property data from the HTML above. This is real official data - use it exactly as shown.`
      : `No BCPA page retrieved. Use internet search to find BCPA records for: "${address}". Set is_estimated=true.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a Broward County, Florida property expert.

${bcpaContext}

FROM THE BCPA HTML, extract:
- Property Address (situs address)
- Owner name
- Folio/ID number  
- Year Built (actual year, not effective year)
- Adjusted Building Square Footage
- Lot size in SF (from Land Calculations - look for SF factor/units)
- Just/Market Value (most recent year)
- Zoning code (from Land Calculations table "Zoning" column)
- City

THEN use internet search to add:
1. Zoning description and EXACT setbacks from city municipal code
2. FEMA flood zone from msc.fema.gov

SETBACK REFERENCE (use exactly, do not invent):
Broward County RS-4*: Front 25, Rear 25, Side 7.5 ft, Height 35 ft, Coverage 40%
Broward County RS-5: Front 25, Rear 20, Side 7.5 ft, Height 35 ft, Coverage 45%
Broward County RS-3: Front 25, Rear 25, Side 7.5 ft, Height 35 ft, Coverage 35%
Weston R-1/RS: Front 25, Rear 25, Side 7.5 ft, Height 35 ft, Coverage 40%
Cooper City R-1-A: Front 25, Rear 30, Side 15 ft, Height 30 ft, Coverage 33%
Cooper City R-1-B: Front 25, Rear 25, Side 7.5 ft, Height 30 ft, Coverage 35%
Cooper City RS-4: Front 25, Rear 25, Side 7.5 ft, Height 30 ft, Coverage 40%
Coral Springs RS-3/4/5: Front 25, Rear 25, Side 7.5 ft, Height 35 ft, Coverage 35%
Fort Lauderdale RS-8: Front 25, Rear 25, Side 5 ft, Height 35 ft, Coverage 40%
Hollywood RS-6000: Front 25, Rear 25, Side 7.5 ft, Height 35 ft, Coverage 40%
Davie RS: Front 25, Rear 25, Side 7.5 ft, Height 35 ft, Coverage 40%
Miramar RS: Front 25, Rear 20, Side 7.5 ft, Height 35 ft, Coverage 40%
Pembroke Pines RS: Front 25, Rear 20, Side 7.5 ft, Height 35 ft, Coverage 40%

ALSO provide building_projects: at least 6 types including ADU/Guest House, Swimming Pool, Privacy Fence, Home Addition, Accessory Shed, Solar Panels.
Status must be exactly one of: "allowed", "permit_required", "not_allowed", "conditional"`,
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

    // Always stamp the folio and source URL
    if (folio) {
      result.folio = folio;
      result.bcpa_url = `https://bcpa.net/RecInfo.asp?URL_Folio=${folio}`;
      result.found = true;
      if (bcpaHtml) result.is_estimated = false;
    }

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});