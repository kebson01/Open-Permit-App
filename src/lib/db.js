/**
 * lib/db.js — Supabase data layer
 * All table/view names and column names match the actual Supabase schema.
 */

import { supabase } from '@/lib/supabaseClient';

// ── Generic REST helpers ───────────────────────────────────────────────────────

async function rest(table, { filters = {}, select = '*', order, limit, offset } = {}) {
  let query = supabase.from(table).select(select);
  Object.entries(filters).forEach(([k, v]) => {
    if (k === 'or') {
      query = query.or(v);
    } else {
      const opIdx = v.indexOf('.');
      const op = v.slice(0, opIdx);
      const val = v.slice(opIdx + 1);
      query = query.filter(k, op, val);
    }
  });
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

async function restInsert(table, data) {
  const { data: rows, error } = await supabase.from(table).insert(data).select();
  if (error) throw new Error(`Supabase INSERT: ${error.message}`);
  return Array.isArray(rows) ? rows[0] : rows;
}

async function restUpdate(table, id, data) {
  const { data: rows, error } = await supabase.from(table).update(data).eq('id', id).select();
  if (error) throw new Error(`Supabase PATCH: ${error.message}`);
  return Array.isArray(rows) ? rows[0] : rows;
}

async function restDelete(table, id) {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw new Error(`Supabase DELETE: ${error.message}`);
}

// ── Permit type table map ──────────────────────────────────────────────────────
const PERMIT_TYPE_TABLE = {
  'Weston':          'weston_permit_types',
  'Coral Springs':   'coral_springs_permit_types',
  'Fort Lauderdale': 'fort_lauderdale_permit_types',
  'Hollywood':       'hollywood_permit_types',
  'Cooper City':     'cooper_city_permit_types',
  'Sunrise':         'sunrise_permit_types',
};

// ══════════════════════════════════════════════════════════════════════════════
// CITIES
// ══════════════════════════════════════════════════════════════════════════════
export const City = {
  list: () => rest('cities', { order: 'name.asc' }),
  filter: (filters = {}) => {
    const f = {};
    if (filters.name) f['name'] = `eq.${filters.name}`;
    if (filters.city_id) f['id'] = `eq.${filters.city_id}`;
    return rest('cities', { filters: f, order: 'name.asc' });
  },
  create: (data) => restInsert('cities', data),
  update: (id, data) => restUpdate('cities', id, data),
  delete: (id) => restDelete('cities', id),
};

// ══════════════════════════════════════════════════════════════════════════════
// PERMIT TYPES (city-specific tables)
// ══════════════════════════════════════════════════════════════════════════════
export const PermitType = {
  filter: async (filters = {}) => {
    const cityName = filters.city_name;
    if (filters.city_id && !cityName) {
      const cities = await rest('cities', { filters: { id: `eq.${filters.city_id}` }, limit: 1 });
      if (!cities || cities.length === 0) return [];
      const table = PERMIT_TYPE_TABLE[cities[0].name] || 'weston_permit_types';
      return rest(table, { order: 'category.asc,name.asc' });
    }
    const table = PERMIT_TYPE_TABLE[cityName] || 'weston_permit_types';
    const f = {};
    if (filters.category) f.category = `eq.${filters.category}`;
    return rest(table, { filters: f, order: 'category.asc,name.asc' });
  },
  list: () => rest('weston_permit_types', { order: 'category.asc,name.asc' }),
  create: (data) => {
    const table = PERMIT_TYPE_TABLE[data.city_name] || 'weston_permit_types';
    return restInsert(table, data);
  },
  update: (id, data) => {
    const table = PERMIT_TYPE_TABLE[data.city_name] || 'weston_permit_types';
    return restUpdate(table, id, data);
  },
  delete: (id) => {
    // Try all known permit type tables
    const tables = Object.values(PERMIT_TYPE_TABLE);
    const promises = tables.map(t => restDelete(t, id).catch(() => null));
    return Promise.any ? Promise.any(promises) : Promise.allSettled(promises).then(r => r.find(x => x.status === 'fulfilled')?.value);
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// FEE RULES
// Columns: id, city_name, permit_id, permit_name, category, calc_type,
//          input_field, base_fee, flat_fee, rate_percentage,
//          technology_admin_fee, sort_order, description
// All numeric columns are numeric — no casting needed.
// ══════════════════════════════════════════════════════════════════════════════
export const FeeRule = {
  filter: (filters = {}) => {
    const f = {};
    if (filters.city_name)  f.city_name  = `eq.${filters.city_name}`;
    if (filters.city_id)    f.city_id    = `eq.${filters.city_id}`;
    if (filters.category)   f.category   = `eq.${filters.category}`;
    if (filters.permit_name) f.permit_name = `eq.${filters.permit_name}`;
    if (filters.permit_id)  f.permit_id  = `eq.${filters.permit_id}`;
    return rest('fee_rules', { filters: f, order: 'sort_order.asc' });
  },
  list: () => rest('fee_rules', { order: 'city_name.asc,sort_order.asc' }),
  create: (data) => restInsert('fee_rules', data),
  update: (id, data) => restUpdate('fee_rules', id, data),
  delete: (id) => restDelete('fee_rules', id),
};

// ══════════════════════════════════════════════════════════════════════════════
// CITY SURCHARGES
// ══════════════════════════════════════════════════════════════════════════════
export const CitySurcharge = {
  filter: (filters = {}) => {
    const f = {};
    if (filters.city_name) f.city_name = `eq.${filters.city_name}`;
    if (filters.city_id)   f.city_id   = `eq.${filters.city_id}`;
    return rest('city_surcharges', { filters: f });
  },
  getByCity: async (cityName) => {
    const rows = await rest('city_surcharges', { filters: { city_name: `eq.${cityName}` }, limit: 1 });
    return rows[0] || null;
  },
  create: (data) => restInsert('city_surcharges', data),
  update: (id, data) => restUpdate('city_surcharges', id, data),
};

// ══════════════════════════════════════════════════════════════════════════════
// PROPERTIES — use properties_search_view
// Columns: folio_number, full_address, owner_name, homestead_flag,
//          total_sqft, under_air_sqft, year_built, beds, baths,
//          city_code, city_name, zip_code, building_value, latitude, longitude
// ══════════════════════════════════════════════════════════════════════════════
export const Property = {
  search: (q, cityName = null, limit = 10) => {
    const f = { 'or': `(full_address.ilike.*${q}*,folio_number.ilike.*${q}*,owner_name.ilike.*${q}*)` };
    if (cityName && cityName !== 'All Cities') f.city_name = `eq.${cityName}`;
    return rest('properties_search_view', {
      filters: f,
      select: 'folio_number,full_address,owner_name,homestead_flag,total_sqft,under_air_sqft,year_built,beds,baths,city_code,city_name,zip_code,building_value,latitude,longitude',
      limit,
    });
  },
  getByFolio: async (folio) => {
    const rows = await rest('properties_search_view', {
      filters: { folio_number: `eq.${folio}` },
      limit: 1,
    });
    return rows[0] || null;
  },
  filter: (filters = {}, _order, limit = 10) => {
    const f = {};
    if (filters.folio_number) f.folio_number = `eq.${filters.folio_number}`;
    if (filters.city_name)    f.city_name    = `eq.${filters.city_name}`;
    return rest('properties_search_view', { filters: f, limit });
  },
  bulkCreate: async (records) => {
    const results = [];
    for (const record of records) {
      results.push(await restInsert('properties_search_view', record));
    }
    return results;
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// CODE OF ORDINANCES
// ══════════════════════════════════════════════════════════════════════════════
export const CodeOfOrdinance = {
  filter: (filters = {}) => {
    const f = {};
    if (filters.city_name) f.city_name = `eq.${filters.city_name}`;
    if (filters.city_id)   f.city_id   = `eq.${filters.city_id}`;
    if (filters.category)  f.category  = `eq.${filters.category}`;
    if (filters.is_active !== undefined) f.is_active = `eq.${filters.is_active}`;
    return rest('weston_code_of_ordinances', { filters: f, order: 'chapter_number.asc' });
  },
  search: (cityName, q) => rest('weston_code_of_ordinances', {
    filters: { city_name: `eq.${cityName}`, content: `ilike.*${q}*` },
    limit: 20,
  }),
  create: (data) => restInsert('weston_code_of_ordinances', data),
  update: (id, data) => restUpdate('weston_code_of_ordinances', id, data),
  delete: (id) => restDelete('weston_code_of_ordinances', id),
};

// ══════════════════════════════════════════════════════════════════════════════
// CITY APPLICATION QUESTIONS
// Table: city_application_questions
// Filter: city_name, permit_type_name, is_active = true
// Order: display_order ASC
// options column is JSONB — already parsed, no JSON.parse needed
// ══════════════════════════════════════════════════════════════════════════════
export const CityApplicationQuestion = {
  filter: (filters = {}) => {
    const f = {};
    if (filters.city_name)       f.city_name       = `eq.${filters.city_name}`;
    if (filters.permit_type_name) f.permit_type_name = `eq.${filters.permit_type_name}`;
    f.is_active = 'eq.true';
    return rest('city_application_questions', { filters: f, order: 'display_order.asc' });
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// USERS (via Supabase auth)
// For admin user management — queries the users table in Supabase
// ══════════════════════════════════════════════════════════════════════════════
export const User = {
  list: (order = 'created_at.desc', limit = 200) => rest('users', { order, limit }),
  filter: (filters = {}, order = 'created_at.desc', limit = 200) => {
    const f = {};
    if (filters.email) f.email = `eq.${filters.email}`;
    if (filters.role)  f.role  = `eq.${filters.role}`;
    return rest('users', { filters: f, order, limit });
  },
  update: (id, data) => restUpdate('users', id, data),
};

