import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gbknnjidqpmjrwlooluw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdia25uamlkcXBtanJ3bG9vbHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NTQzNDIsImV4cCI6MjA5MDIzMDM0Mn0.qwDACgXe3hesxBRQOzP53Hdc44z_UOka1_uYQScyi68';

// Auth client (used for sign-in/sign-out)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    flowType: 'implicit',
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
});

// ── Low-level helper (via supabase client — carries user session token) ───────
async function supabaseQuery(table, { filters, select, order, limit, offset } = {}) {
  let query = supabase.from(table).select(select || '*');
  if (filters) {
    filters.split('&').forEach(f => {
      const eqIdx = f.indexOf('=');
      if (eqIdx === -1) return;
      const col = f.slice(0, eqIdx);
      const val = f.slice(eqIdx + 1);
      if (col === 'or') {
        query = query.or(val);
      } else {
        const opIdx = val.indexOf('.');
        const op = val.slice(0, opIdx);
        const v = val.slice(opIdx + 1);
        query = query.filter(col, op, v);
      }
    });
  }
  if (order) {
    order.split(',').forEach(o => {
      const [col, dir] = o.split('.');
      query = query.order(col, { ascending: dir !== 'desc' });
    });
  }
  if (offset !== undefined && limit !== undefined) {
    query = query.range(offset, offset + limit - 1);
  } else if (limit) {
    query = query.limit(limit);
  }
  const { data, error } = await query;
  if (error) throw new Error(`Supabase error: ${error.message}`);
  return data;
}

// ── Named query helpers ──────────────────────────────────────────────────────
export const db = {
  // Fee Calculator
  getFeeRules: (cityName, category) =>
    supabaseQuery('fee_rules', {
      filters: `city_name=eq.${cityName}${category ? '&category=eq.' + category : ''}`,
      order: 'sort_order.asc',
    }),

  getCitySurcharge: async (cityName) => {
    const rows = await supabaseQuery('city_surcharges', {
      filters: `city_name=eq.${cityName}`,
      limit: 1,
    });
    return rows[0] || null;
  },

  // Property Search
  searchProperties: (q, limit = 20) =>
    supabaseQuery('broward_properties', {
      filters: `full_address=ilike.*${encodeURIComponent(q)}*`,
      select: 'id,FOLIO_NUMBER,full_address,NAME_LINE_1,SITUS_CITY,SITUS_ZIP_CODE,USE_CODE,BLDG_YEAR_BUILT,BEDS,BATHS,BLDG_UNDER_AIR_SQ_FOOTAGE,JUST_LAND_VALUE,JUST_BUILDING_VALUE,COUNTY_TAXABLE',
      limit,
    }),

  getPropertyByFolio: async (folio) => {
    const rows = await supabaseQuery('broward_properties', {
      filters: `FOLIO_NUMBER=eq.${folio}`,
      limit: 1,
    });
    return rows[0] || null;
  },

  // Permit Guide / Types
  getPermitTypes: (cityName, category) => {
    const tableMap = {
      'Weston': 'weston_permit_types',
      'Coral Springs': 'coral_springs_permit_types',
      'Fort Lauderdale': 'fort_lauderdale_permit_types',
      'Hollywood': 'hollywood_permit_types',
      'Cooper City': 'cooper_city_permit_types',
      'Sunrise': 'sunrise_permit_types',
    };
    const table = tableMap[cityName] || 'weston_permit_types';
    return supabaseQuery(table, {
      filters: category ? `category=eq.${category}` : undefined,
      order: 'category.asc,name.asc',
    });
  },

  // Permit Records
  getPermitRecordsByFolio: (folio) =>
    supabaseQuery('weston_permit_records', {
      filters: `PARCEL_NBR=eq.${folio}`,
      order: 'OPEN_DATE.desc',
      limit: 100,
    }),

  getPermitRecordsByAddress: (address) =>
    supabaseQuery('weston_permit_records', {
      filters: `RECORD_NAME=ilike.*${encodeURIComponent(address)}*`,
      order: 'OPEN_DATE.desc',
      limit: 50,
    }),

  // Zoning
  getZoningRules: (cityName, zoneCode) =>
    supabaseQuery('zoning_rules', {
      filters: `city_name=eq.${cityName}${zoneCode ? '&zone_code=eq.' + zoneCode : ''}`,
    }),

  // Cities
  getCities: () => supabaseQuery('cities', { order: 'name.asc' }),

  // Permit Application Requirements (Weston)
  getPermitApplicationRequirements: (cityId) =>
    supabaseQuery('weston_city_permit_application_requirements', {
      filters: `city_id=eq.${cityId}`,
      order: 'sort_order.asc',
    }),

  // Ordinances
  getOrdinances: (cityName, category) =>
    supabaseQuery('weston_code_of_ordinances', {
      filters: `city_name=eq.${cityName}${category ? '&category=eq.' + category : ''}`,
      order: 'chapter_number.asc',
    }),

  searchOrdinances: (cityName, q) =>
    supabaseQuery('weston_code_of_ordinances', {
      filters: `city_name=eq.${cityName}&content=ilike.*${encodeURIComponent(q)}*`,
      limit: 20,
    }),
};