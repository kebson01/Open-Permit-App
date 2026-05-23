import { supabase } from "@/lib/supabaseClient";

const cityMap = {
  WS: 'Weston', HW: 'Hollywood', CS: 'Coral Springs', CY: 'Cooper City',
  FL: 'Fort Lauderdale', SU: 'Sunrise', DV: 'Davie', PL: 'Plantation',
  HA: 'Hallandale Beach', DN: 'Dania Beach', DB: 'Deerfield Beach',
  MG: 'Margate', OP: 'Oakland Park', MM: 'Miramar', CK: 'Coconut Creek',
  SW: 'Southwest Ranches',
};

function normalizeProperty(p) {
  return {
    folio_number: p.FOLIO_NUMBER || p.folio_number,
    full_address: p.full_address,
    owner_name: p.NAME_LINE_1 || p.owner_name,
    city_name: cityMap[p.SITUS_CITY] || p.SITUS_CITY || p.city_name || '',
    homestead_flag: p.HOMESTEAD_FLAG || p.homestead_flag,
    total_sqft: p.BLDG_TOT_SQ_FOOTAGE || p.total_sqft,
    year_built: p.BLDG_YEAR_BUILT || p.year_built,
    beds: p.BEDS || p.beds,
    baths: p.BATHS || p.baths,
    zip_code: p.SITUS_ZIP_CODE || p.zip_code,
  };
}

export async function searchProperties(searchInput, setResults, setIsLoading, setErrorMsg) {
  const query = searchInput.trim();
  if (!query || query.length < 3) {
    setErrorMsg('Please enter at least 3 characters');
    return;
  }

  setIsLoading(true);
  setErrorMsg('');
  setResults([]);

  try {
    // Method 1: Try RPC function
    const { data, error } = await supabase.rpc('search_properties', { search_query: query });

    if (!error && data && data.length > 0) {
      setResults(data.map(normalizeProperty));
      return;
    }

    // Method 2: Fallback — direct table queries
    const [folioRes, addressRes] = await Promise.all([
      supabase
        .from('broward_properties')
        .select('FOLIO_NUMBER, full_address, NAME_LINE_1, SITUS_CITY, HOMESTEAD_FLAG, BLDG_TOT_SQ_FOOTAGE, BLDG_YEAR_BUILT, BEDS, BATHS, SITUS_ZIP_CODE')
        .ilike('FOLIO_NUMBER', `%${query}%`)
        .limit(5),
      supabase
        .from('broward_properties')
        .select('FOLIO_NUMBER, full_address, NAME_LINE_1, SITUS_CITY, HOMESTEAD_FLAG, BLDG_TOT_SQ_FOOTAGE, BLDG_YEAR_BUILT, BEDS, BATHS, SITUS_ZIP_CODE')
        .ilike('full_address', `%${query}%`)
        .limit(5),
    ]);

    const combined = [...(folioRes.data || []), ...(addressRes.data || [])];

    const seen = new Set();
    const unique = combined.filter(p => {
      const key = p.FOLIO_NUMBER;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 10);

    const normalized = unique.map(normalizeProperty);

    if (normalized.length === 0) {
      setErrorMsg('No properties found. Try a different address, folio number, or owner name.');
      return;
    }

    setResults(normalized);
  } catch (err) {
    console.error('Property search error:', err);
    setErrorMsg('Search error: ' + (err.message || 'Please try again'));
  } finally {
    setIsLoading(false);
  }
}