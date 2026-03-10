import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Parse BCPA RecInfo HTML into structured data
function parseBCPAHtml(html) {
  const data = {};

  const extract = (pattern) => {
    const m = html.match(pattern);
    return m ? m[1].replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim() : null;
  };

  // Property Address
  const addrMatch = html.match(/Property Address[\s\S]*?<[^>]*>([^<]+(?:BLVD|BOULEVARD|ST|STREET|AVE|AVENUE|DR|DRIVE|LN|LANE|WAY|CT|COURT|CIR|CIRCLE|RD|ROAD|TER|TERRACE|PL|PLACE)[^<]*)<\/A>/i)
    || html.match(/maps\/place\/([^"]+)"/);
  if (addrMatch) data.verified_address = decodeURIComponent(addrMatch[1].replace(/,/g, ', ').replace(/%20/g, ' '));

  // Property Address - simpler parse
  const siteAddr = html.match(/maps\/place\/([^"]+)"/);
  if (siteAddr) {
    data.verified_address = decodeURIComponent(siteAddr[1].replace(/%20/g, ' ').replace(/,/g, ', ').replace(/\+/g, ' '));
  }

  // Owner
  const ownerMatch = html.match(/Property Owner[\s\S]{0,50}?<[TB][^>]*>([A-Z][^<\n]+)<\//);
  if (ownerMatch) data.owner_name = ownerMatch[1].trim();

  // Folio / ID
  const folioMatch = html.match(/ID\s*#[\s\S]{0,50}?(\d{4}\s*\d{2}\s*\d{2}\s*\d{4})/);
  if (folioMatch) data.folio = folioMatch[1].replace(/\s/g, ' ');

  // Year Built / Effective Year
  const yrMatch = html.match(/Eff\.\/?Act\.\s*Year\s*Built[:\s]*(\d{4})\/(\d{4})/i)
    || html.match(/Year Built[:\s]*(\d{4})/i);
  if (yrMatch) data.year_built = parseInt(yrMatch[2] || yrMatch[1]);

  // Adjusted Building SF
  const sfMatch = html.match(/Adj\.\s*Bldg\.\s*S\.F[\s\S]{0,30}?(\d[\d,]+)/i);
  if (sfMatch) data.building_sqft = parseInt(sfMatch[1].replace(/,/g, ''));

  // Land SF (from Land Calculations - look for SF type)
  const landSfMatch = html.match(/(\d[\d,]+)\s*\|\s*SF/i)
    || html.match(/SF[\s\S]{0,20}?(\d[\d,]+)/i);
  if (landSfMatch) data.lot_size_sqft = parseInt(landSfMatch[1].replace(/,/g, ''));

  // Market Value (Just/Market)
  const mktMatch = html.match(/Just\s*\/\s*Market[\s\S]{0,200}?\$\s*([\d,]+)/);
  if (mktMatch) data.market_value = parseInt(mktMatch[1].replace(/,/g, ''));

  // Land Value
  const landValMatch = html.match(/Land[\s\S]{0,30}?\$([\d,]+)/);
  if (landValMatch) data.land_value = parseInt(landValMatch[1].replace(/,/g, ''));

  // Use Code
  const useMatch = html.match(/Use[\s\S]{0,100}?>(\d+)-\s*<[\s\S]{0,30}?>(\d+)</);
  if (useMatch) data.use_code = `${useMatch[1]}-${useMatch[2]}`;

  // Millage
  const millMatch = html.match(/Millage[\s\S]{0,50}?(\d{4})</);
  if (millMatch) data.millage = millMatch[1];

  // City from address
  const cityMatch = (data.verified_address || '').match(/,\s*([A-Z\s]+)\s+FL/i);
  if (cityMatch) data.city = cityMatch[1].trim();

  // Zoning from Land Calculations table
  const zoningMatch = html.match(/Zoning[\s\S]{0,200}?<TD[^>]*>\s*([A-Z0-9\-\*]+)\s*<\/TD>/i);
  if (zoningMatch && zoningMatch[1] !== '--') data.zoning_district = zoningMatch[1];

  return data;
}

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
    let bcpaHtmlData = null;

    // STEP 1: If no folio provided, use LLM to find it from the address
    if (!folio) {
      const folioResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Search BCPA (Broward County Property Appraiser) for the property at: "${address}"

Go to https://bcpa.net/RecAddr.asp or search https://bcpa.net and find the FOLIO number for this address.
The folio is a 12-digit number like: 5141320010770 or formatted as 5141-32-01-0770

Return ONLY the folio number with no dashes or spaces. Example: 5141320010770
If not found, return: NOT_FOUND`,
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

      if (folioResult?.found && folioResult?.folio && folioResult.folio !== 'NOT_FOUND') {
        folio = folioResult.folio.replace(/[\s\-]/g, '');
      }
    }

    // STEP 2: Fetch real BCPA data if we have a folio
    if (folio) {
      const bcpaUrl = `https://bcpa.net/RecInfo.asp?URL_Folio=${folio}`;
      const bcpaResponse = await fetch(bcpaUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });

      if (bcpaResponse.ok) {
        const html = await bcpaResponse.text();
        // Confirm it returned actual property data (not just the search page)
        if (html.includes('Property Owner') && html.includes('Property Address')) {
          bcpaHtmlData = parseBCPAHtml(html);
          bcpaHtmlData.folio = folio;
          bcpaHtmlData.bcpa_url = bcpaUrl;
        }
      }
    }

    // STEP 3: Use LLM to add zoning, setbacks, flood zone, and building projects
    const contextInfo = bcpaHtmlData
      ? `REAL BCPA DATA (verified from bcpa.net):
- Folio: ${bcpaHtmlData.folio}
- Owner: ${bcpaHtmlData.owner_name || 'Unknown'}
- Address: ${bcpaHtmlData.verified_address || address}
- City: ${bcpaHtmlData.city || 'Unknown'}
- Year Built: ${bcpaHtmlData.year_built || 'Unknown'}
- Building SF: ${bcpaHtmlData.building_sqft || 'Unknown'}
- Lot Size SF: ${bcpaHtmlData.lot_size_sqft || 'Unknown'}
- Market Value: ${bcpaHtmlData.market_value || 'Unknown'}
- Zoning from BCPA: ${bcpaHtmlData.zoning_district || 'Unknown'}

Use this REAL data. Do NOT change folio, owner, address, year_built, building_sqft, lot_size_sqft, or market_value.`
      : `No BCPA data retrieved for: "${address}". Use internet search to find BCPA records and set is_estimated=true.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a Broward County, Florida property and zoning expert.

${contextInfo}

Now provide:
1. The zoning district description and EXACT setbacks from the city's municipal code
2. FEMA flood zone for this property (search msc.fema.gov or FEMA NFHL)
3. Building project feasibility based on zoning

SETBACK REFERENCE TABLE (use exactly):
Broward County RS-4*: Front 25, Rear 25, Side 7.5 ft, Height 35 ft, Coverage 40%
Broward County RS-5: Front 25, Rear 20, Side 7.5 ft, Height 35 ft, Coverage 45%
Broward County RS-3: Front 25, Rear 25, Side 7.5 ft, Height 35 ft, Coverage 35%
Weston RS-1/R-1: Front 25, Rear 25, Side 7.5 ft, Height 35 ft, Coverage 40%
Cooper City R-1-A: Front 25, Rear 30, Side 15 ft, Height 30 ft, Coverage 33%
Cooper City R-1-B: Front 25, Rear 25, Side 7.5 ft, Height 30 ft, Coverage 35%
Cooper City RS-4: Front 25, Rear 25, Side 7.5 ft, Height 30 ft, Coverage 40%
Coral Springs RS-3/4/5: Front 25, Rear 25, Side 7.5 ft, Height 35 ft, Coverage 35%
Fort Lauderdale RS-8: Front 25, Rear 25, Side 5 ft, Height 35 ft, Coverage 40%
Hollywood RS-6000: Front 25, Rear 25, Side 7.5 ft, Height 35 ft, Coverage 40%
Davie RS: Front 25, Rear 25, Side 7.5 ft, Height 35 ft, Coverage 40%
Miramar RS: Front 25, Rear 20, Side 7.5 ft, Height 35 ft, Coverage 40%
Pembroke Pines RS: Front 25, Rear 20, Side 7.5 ft, Height 35 ft, Coverage 40%

Provide at least 6 building project types: ADU/Guest House, Swimming Pool, Privacy Fence, Home Addition, Accessory Shed, Solar Panels.
Set status to exactly one of: "allowed", "permit_required", "not_allowed", "conditional"`,
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

    // Merge real BCPA data over LLM result (real data takes priority)
    if (bcpaHtmlData) {
      if (bcpaHtmlData.folio) result.folio = bcpaHtmlData.folio;
      if (bcpaHtmlData.owner_name) result.owner_name = bcpaHtmlData.owner_name;
      if (bcpaHtmlData.verified_address) result.verified_address = bcpaHtmlData.verified_address;
      if (bcpaHtmlData.city) result.city = bcpaHtmlData.city;
      if (bcpaHtmlData.year_built) result.year_built = bcpaHtmlData.year_built;
      if (bcpaHtmlData.building_sqft) result.building_sqft = bcpaHtmlData.building_sqft;
      if (bcpaHtmlData.lot_size_sqft) result.lot_size_sqft = bcpaHtmlData.lot_size_sqft;
      if (bcpaHtmlData.market_value) result.market_value = bcpaHtmlData.market_value;
      if (bcpaHtmlData.zoning_district) result.zoning_district = bcpaHtmlData.zoning_district;
      result.bcpa_url = bcpaHtmlData.bcpa_url;
      result.found = true;
      result.is_estimated = false;
    }

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});