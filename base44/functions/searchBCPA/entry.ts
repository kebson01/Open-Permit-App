import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { address } = await req.json();
    if (!address) return Response.json({ error: 'address required' }, { status: 400 });

    const trimmed = address.trim();

    // Try BCPA public API - address search endpoint
    // BCPA exposes a search API at this endpoint
    const bcpaUrl = `https://web.bcpa.net/BcpaClient/api/search/address?address=${encodeURIComponent(trimmed)}&pageSize=20`;
    
    const bcpaRes = await fetch(bcpaUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; PropertySearch/1.0)',
        'Referer': 'https://web.bcpa.net/',
        'Origin': 'https://web.bcpa.net',
      }
    });

    if (bcpaRes.ok) {
      const data = await bcpaRes.json();
      // BCPA returns an array of property objects
      const raw = Array.isArray(data) ? data : (data?.results || data?.items || []);
      
      const properties = raw.map(p => ({
        FOLIO_NUMBER: p.folioNumber || p.folio || p.FOLIO_NUMBER || '',
        NAME_LINE_1: p.ownerName || p.owner || p.NAME_LINE_1 || '',
        full_address: p.siteAddress || p.address || p.situsAddress || '',
        SITUS_STREET_NUMBER: p.situsStreetNumber || p.streetNumber || '',
        SITUS_STREET_DIRECTION: p.situsStreetDirection || '',
        SITUS_STREET_NAME: p.situsStreetName || p.streetName || '',
        SITUS_STREET_TYPE: p.situsStreetType || '',
        SITUS_CITY: p.situsCity || p.city || '',
        SITUS_ZIP_CODE: p.situsZip || p.zip || '',
        USE_TYPE: p.useType || p.propertyUse || p.useDescription || '',
        BLDG_YEAR_BUILT: p.yearBuilt || p.buildingYear || null,
        BEDS: p.bedrooms || p.beds || null,
        BATHS: p.bathrooms || p.baths || null,
        BLDG_UNDER_AIR_SQ_FOOTAGE: p.underAirSqFt || p.livingArea || null,
        GIS_SQUARE_FOOT: p.lotSize || p.gisSqFt || null,
        JUST_LAND_VALUE: p.justLandValue || p.landValue || null,
        JUST_BUILDING_VALUE: p.justBuildingValue || p.buildingValue || null,
        HOMESTEAD_FLAG: p.homestead || p.homesteadFlag || '',
        _source: 'bcpa_api',
      })).filter(p => p.FOLIO_NUMBER || p.full_address);

      if (properties.length > 0) {
        return Response.json({ properties });
      }
    }

    // Fallback: try alternate BCPA API endpoint
    const altUrl = `https://web.bcpa.net/BcpaClient/api/search?query=${encodeURIComponent(trimmed)}&type=address`;
    const altRes = await fetch(altUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://web.bcpa.net/',
      }
    });

    if (altRes.ok) {
      const altData = await altRes.json();
      const raw = Array.isArray(altData) ? altData : (altData?.results || altData?.data || []);
      if (raw.length > 0) {
        const properties = raw.map(p => ({
          FOLIO_NUMBER: p.folioNumber || p.folio || '',
          NAME_LINE_1: p.ownerName || p.owner || '',
          full_address: p.siteAddress || p.address || '',
          SITUS_CITY: p.situsCity || p.city || '',
          SITUS_ZIP_CODE: p.situsZip || p.zip || '',
          USE_TYPE: p.useType || p.propertyUse || '',
          BLDG_YEAR_BUILT: p.yearBuilt || null,
          BEDS: p.bedrooms || null,
          BATHS: p.bathrooms || null,
          BLDG_UNDER_AIR_SQ_FOOTAGE: p.underAirSqFt || null,
          GIS_SQUARE_FOOT: p.lotSize || null,
          JUST_LAND_VALUE: p.justLandValue || null,
          JUST_BUILDING_VALUE: p.justBuildingValue || null,
          HOMESTEAD_FLAG: p.homestead || '',
          _source: 'bcpa_api_alt',
        })).filter(p => p.FOLIO_NUMBER || p.full_address);

        return Response.json({ properties });
      }
    }

    // Final fallback: use LLM with a faster model
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Search for Broward County Florida property: "${trimmed}" on the BCPA website (bcpa.net).
      
Return property data as JSON with these fields:
FOLIO_NUMBER, NAME_LINE_1, full_address, SITUS_STREET_NUMBER, SITUS_STREET_DIRECTION, SITUS_STREET_NAME, SITUS_STREET_TYPE, SITUS_CITY, SITUS_ZIP_CODE, USE_TYPE, BLDG_YEAR_BUILT, BEDS, BATHS, BLDG_UNDER_AIR_SQ_FOOTAGE, GIS_SQUARE_FOOT, JUST_LAND_VALUE, JUST_BUILDING_VALUE, HOMESTEAD_FLAG.

Return empty array if not found.`,
      add_context_from_internet: true,
      model: "gemini_3_flash",
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

    const properties = (result?.properties || []).map(p => ({ ...p, _source: 'bcpa_llm' }));
    return Response.json({ properties });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});