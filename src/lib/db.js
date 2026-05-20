/**
 * lib/db.js — Supabase data layer
 * Replaces all base44.entities.* calls throughout the app.
 * Auth still uses base44.auth.* (unchanged).
 */
import { supabase } from './supabaseClient';

// ── Generic helpers ────────────────────────────────────────────────────────────

const SUPABASE_URL = 'https://gbknnjidqpmjrwlooluw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdia25uamlkcXBtanJ3bG9vbHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NTQzNDIsImV4cCI6MjA5MDIzMDM0Mn0.qwDACgXe3hesxBRQOzP53Hdc44z_UOka1_uYQScyi68';

async function rest(table, { filters = {}, select = '*', order, limit, offset } = {}) {
  const params = new URLSearchParams();
  params.set('select', select);
  if (order) params.set('order', order);
  if (limit) params.set('limit', String(limit));
  if (offset) params.set('offset', String(offset));
  Object.entries(filters).forEach(([k, v]) => params.set(k, v));

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error(`Supabase REST ${res.status}: ${res.statusText}`);
  return res.json();
}

async function restInsert(table, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase INSERT ${res.status}: ${err}`);
  }
  const rows = await res.json();
  return Array.isArray(rows) ? rows[0] : rows;
}

async function restUpdate(table, id, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase PATCH ${res.status}: ${err}`);
  }
  const rows = await res.json();
  return Array.isArray(rows) ? rows[0] : rows;
}

async function restDelete(table, id) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'DELETE',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`Supabase DELETE ${res.status}`);
}

// ── Permit type table map ──────────────────────────────────────────────────────
const PERMIT_TYPE_TABLE = {
  'Weston': 'weston_permit_types',
  'Coral Springs': 'coral_springs_permit_types',
  'Fort Lauderdale': 'fort_lauderdale_permit_types',
  'Hollywood': 'hollywood_permit_types',
  'Cooper City': 'cooper_city_permit_types',
  'Sunrise': 'sunrise_permit_types',
};

// ── Permit record table map ────────────────────────────────────────────────────
const PERMIT_RECORD_TABLE = {
  'Weston': 'weston_permit_records',
  'Coral Springs': 'coral_springs_permit_records',
  'Fort Lauderdale': 'fort_lauderdale_permit_records',
  'Hollywood': 'hollywood_permit_records',
  'Cooper City': 'cooper_city_permit_records',
};

// ══════════════════════════════════════════════════════════════════════════════
// CITIES
// ══════════════════════════════════════════════════════════════════════════════
export const City = {
  list: () => rest('cities', { order: 'name.asc' }),
  filter: (filters = {}) => {
    const f = {};
    if (filters.name) f['name'] = `eq.${filters.name}`;
    return rest('cities', { filters: f, order: 'name.asc' });
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// PERMIT TYPES
// ══════════════════════════════════════════════════════════════════════════════
export const PermitType = {
  filter: async (filters = {}) => {
    const cityName = filters.city_name;
    // If we have a city_id, we need to look up the city name first
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
};

// ══════════════════════════════════════════════════════════════════════════════
// FEE RULES
// ══════════════════════════════════════════════════════════════════════════════
export const FeeRule = {
  filter: (filters = {}) => {
    const f = {};
    if (filters.city_name) f.city_name = `eq.${filters.city_name}`;
    if (filters.category) f.category = `eq.${filters.category}`;
    if (filters.permit_name) f.permit_name = `eq.${filters.permit_name}`;
    return rest('fee_rules', { filters: f, order: 'sort_order.asc' });
  },
  list: () => rest('fee_rules', { order: 'city_name.asc,sort_order.asc' }),
};

// ══════════════════════════════════════════════════════════════════════════════
// CITY SURCHARGES
// ══════════════════════════════════════════════════════════════════════════════
export const CitySurcharge = {
  filter: async (filters = {}) => {
    const f = {};
    if (filters.city_name) f.city_name = `eq.${filters.city_name}`;
    return rest('city_surcharges', { filters: f });
  },
  getByCity: async (cityName) => {
    const rows = await rest('city_surcharges', { filters: { city_name: `eq.${cityName}` }, limit: 1 });
    return rows[0] || null;
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// PROPERTIES (broward_properties — 758k rows, always filter/limit)
// ══════════════════════════════════════════════════════════════════════════════
export const Property = {
  search: (q, limit = 10) => rest('broward_properties', {
    filters: { full_address: `ilike.*${q}*` },
    select: 'id,FOLIO_NUMBER,full_address,NAME_LINE_1,SITUS_CITY,SITUS_ZIP_CODE,USE_CODE,USE_TYPE,SITUS_STREET_NUMBER,SITUS_STREET_DIRECTION,SITUS_STREET_NAME,SITUS_STREET_TYPE,SITUS_UNIT_NUMBER,BLDG_YEAR_BUILT,BEDS,BATHS,BLDG_UNDER_AIR_SQ_FOOTAGE,BLDG_TOT_SQ_FOOTAGE,JUST_LAND_VALUE,JUST_BUILDING_VALUE,COUNTY_TAXABLE,HOMESTEAD_FLAG',
    limit,
  }),
  getByFolio: async (folio) => {
    const rows = await rest('broward_properties', { filters: { FOLIO_NUMBER: `eq.${folio}` }, limit: 1 });
    return rows[0] || null;
  },
  filter: (filters = {}, order, limit = 10) => {
    const f = {};
    if (filters.FOLIO_NUMBER) f.FOLIO_NUMBER = `eq.${filters.FOLIO_NUMBER}`;
    if (filters.SITUS_CITY) f.SITUS_CITY = `eq.${filters.SITUS_CITY}`;
    return rest('broward_properties', { filters: f, limit });
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// PERMIT RECORDS (city-specific tables — always filter by folio)
// ══════════════════════════════════════════════════════════════════════════════
export const PermitRecord = {
  filter: (filters = {}, order = 'OPEN_DATE.desc', limit = 50) => {
    const cityName = filters.city_name || 'Weston';
    const table = PERMIT_RECORD_TABLE[cityName] || 'weston_permit_records';
    const f = {};
    if (filters.folio_number || filters.PARCEL_NBR) {
      const folio = filters.folio_number || filters.PARCEL_NBR;
      f.PARCEL_NBR = `eq.${folio}`;
    }
    return rest(table, { filters: f, order, limit });
  },
  list: (order = 'OPEN_DATE.desc', limit = 20) =>
    rest('weston_permit_records', { order, limit }),
  getByFolio: (folio, cityName = 'Weston') => {
    const table = PERMIT_RECORD_TABLE[cityName] || 'weston_permit_records';
    return rest(table, { filters: { PARCEL_NBR: `eq.${folio}` }, order: 'OPEN_DATE.desc', limit: 100 });
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// ZONING RULES
// ══════════════════════════════════════════════════════════════════════════════
export const ZoningRule = {
  filter: (filters = {}) => {
    const f = {};
    if (filters.city_name) f.city_name = `eq.${filters.city_name}`;
    if (filters.zone_code) f.zone_code = `eq.${filters.zone_code}`;
    return rest('zoning_rules', { filters: f });
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// CODE OF ORDINANCES
// ══════════════════════════════════════════════════════════════════════════════
export const CodeOfOrdinance = {
  filter: (filters = {}) => {
    const f = {};
    if (filters.city_name) f.city_name = `eq.${filters.city_name}`;
    if (filters.category) f.category = `eq.${filters.category}`;
    return rest('weston_code_of_ordinances', { filters: f, order: 'chapter_number.asc' });
  },
  search: (cityName, q) => rest('weston_code_of_ordinances', {
    filters: { city_name: `eq.${cityName}`, content: `ilike.*${q}*` },
    limit: 20,
  }),
};

// ══════════════════════════════════════════════════════════════════════════════
// PROJECTS
// ══════════════════════════════════════════════════════════════════════════════
export const Project = {
  filter: (filters = {}, order = 'updated_at.desc', limit = 50) => {
    const f = {};
    if (filters.owner_email) f.owner_email = `eq.${filters.owner_email}`;
    if (filters.id) f.id = `eq.${filters.id}`;
    return rest('projects', { filters: f, order, limit });
  },
  list: (order = 'updated_at.desc', limit = 50) => rest('projects', { order, limit }),
  create: (data) => restInsert('projects', { ...data, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }),
  update: (id, data) => restUpdate('projects', id, { ...data, updated_at: new Date().toISOString() }),
  delete: (id) => restDelete('projects', id),
};

// ══════════════════════════════════════════════════════════════════════════════
// PROPERTY GROUPS
// ══════════════════════════════════════════════════════════════════════════════
export const PropertyGroup = {
  filter: (filters = {}) => {
    const f = {};
    if (filters.owner_email) f.owner_email = `eq.${filters.owner_email}`;
    return rest('property_groups', { filters: f });
  },
  create: (data) => restInsert('property_groups', data),
  update: (id, data) => restUpdate('property_groups', id, data),
  delete: (id) => restDelete('property_groups', id),
};

// ══════════════════════════════════════════════════════════════════════════════
// PROJECT BUDGET ITEMS
// ══════════════════════════════════════════════════════════════════════════════
export const ProjectBudgetItem = {
  filter: (filters = {}) => {
    const f = {};
    if (filters.project_id) f.project_id = `eq.${filters.project_id}`;
    return rest('project_budget_items', { filters: f });
  },
  create: (data) => restInsert('project_budget_items', data),
  update: (id, data) => restUpdate('project_budget_items', id, data),
  delete: (id) => restDelete('project_budget_items', id),
};

// ══════════════════════════════════════════════════════════════════════════════
// PROJECT MESSAGES
// ══════════════════════════════════════════════════════════════════════════════
export const ProjectMessage = {
  filter: (filters = {}) => {
    const f = {};
    if (filters.project_id) f.project_id = `eq.${filters.project_id}`;
    return rest('project_messages', { filters: f, order: 'created_at.asc' });
  },
  create: (data) => restInsert('project_messages', data),
};

// ══════════════════════════════════════════════════════════════════════════════
// PROJECT COLLABORATORS
// ══════════════════════════════════════════════════════════════════════════════
export const ProjectCollaborator = {
  filter: (filters = {}) => {
    const f = {};
    if (filters.project_id) f.project_id = `eq.${filters.project_id}`;
    return rest('project_collaborators', { filters: f });
  },
  create: (data) => restInsert('project_collaborators', data),
  update: (id, data) => restUpdate('project_collaborators', id, data),
  delete: (id) => restDelete('project_collaborators', id),
};

// ══════════════════════════════════════════════════════════════════════════════
// PERMIT WIZARD SESSIONS
// ══════════════════════════════════════════════════════════════════════════════
export const PermitWizardSession = {
  filter: (filters = {}) => {
    const f = {};
    if (filters.owner_email) f.owner_email = `eq.${filters.owner_email}`;
    if (filters.project_id) f.project_id = `eq.${filters.project_id}`;
    return rest('permit_wizard_sessions', { filters: f, order: 'created_at.desc' });
  },
  create: (data) => restInsert('permit_wizard_sessions', data),
  update: (id, data) => restUpdate('permit_wizard_sessions', id, data),
};

// ══════════════════════════════════════════════════════════════════════════════
// CONTRACTOR PROFILES
// ══════════════════════════════════════════════════════════════════════════════
export const ContractorProfile = {
  filter: (filters = {}) => {
    const f = {};
    if (filters.user_email) f.user_email = `eq.${filters.user_email}`;
    return rest('contractor_profiles', { filters: f });
  },
  create: (data) => restInsert('contractor_profiles', data),
  update: (id, data) => restUpdate('contractor_profiles', id, data),
};

// ══════════════════════════════════════════════════════════════════════════════
// SUBMISSION GUIDES
// ══════════════════════════════════════════════════════════════════════════════
export const SubmissionGuide = {
  filter: (filters = {}, order = 'updated_at.desc', limit = 50) => {
    const f = {};
    if (filters.user_email) f.user_email = `eq.${filters.user_email}`;
    if (filters.folio_number) f.folio_number = `eq.${filters.folio_number}`;
    if (filters.project_id) f.project_id = `eq.${filters.project_id}`;
    if (filters.id) f.id = `eq.${filters.id}`;
    return rest('submission_guides', { filters: f, order, limit });
  },
  list: (order = 'updated_at.desc', limit = 50) => rest('submission_guides', { order, limit }),
  create: (data) => restInsert('submission_guides', { ...data, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }),
  update: (id, data) => restUpdate('submission_guides', id, { ...data, updated_at: new Date().toISOString() }),
  delete: (id) => restDelete('submission_guides', id),
};

// ══════════════════════════════════════════════════════════════════════════════
// SUBMISSION ANSWERS
// ══════════════════════════════════════════════════════════════════════════════
export const SubmissionAnswer = {
  filter: (filters = {}) => {
    const f = {};
    if (filters.guide_id) f.guide_id = `eq.${filters.guide_id}`;
    if (filters.wizard_session_id) f.wizard_session_id = `eq.${filters.wizard_session_id}`;
    return rest('submission_answers', { filters: f });
  },
  create: (data) => restInsert('submission_answers', data),
  update: (id, data) => restUpdate('submission_answers', id, data),
};

// ══════════════════════════════════════════════════════════════════════════════
// SUBMISSION DOCUMENTS
// ══════════════════════════════════════════════════════════════════════════════
export const SubmissionDocument = {
  filter: (filters = {}) => {
    const f = {};
    if (filters.guide_id) f.guide_id = `eq.${filters.guide_id}`;
    return rest('submission_documents', { filters: f });
  },
  create: (data) => restInsert('submission_documents', data),
  update: (id, data) => restUpdate('submission_documents', id, data),
};

// ══════════════════════════════════════════════════════════════════════════════
// CITY APPLICATION QUESTIONS
// ══════════════════════════════════════════════════════════════════════════════
export const CityApplicationQuestion = {
  filter: (filters = {}) => {
    const f = {};
    if (filters.city_id) f.city_id = `eq.${filters.city_id}`;
    if (filters.city_name) f.city_name = `eq.${filters.city_name}`;
    if (filters.permit_type_name) f.permit_type_name = `eq.${filters.permit_type_name}`;
    return rest('city_application_questions', { filters: f, order: 'sort_order.asc' });
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// PERMIT MILESTONES
// ══════════════════════════════════════════════════════════════════════════════
export const PermitMilestone = {
  filter: (filters = {}) => {
    const f = {};
    if (filters.project_id) f.project_id = `eq.${filters.project_id}`;
    if (filters.permit_number) f.permit_number = `eq.${filters.permit_number}`;
    return rest('permit_milestones', { filters: f, order: 'milestone_date.asc' });
  },
  create: (data) => restInsert('permit_milestones', data),
  update: (id, data) => restUpdate('permit_milestones', id, data),
};

// ══════════════════════════════════════════════════════════════════════════════
// PERMIT STATUS LOG
// ══════════════════════════════════════════════════════════════════════════════
export const PermitStatusLog = {
  filter: (filters = {}, order = 'change_date.desc', limit = 20) => {
    const f = {};
    if (filters.project_id) f.project_id = `eq.${filters.project_id}`;
    if (filters.permit_number) f.permit_number = `eq.${filters.permit_number}`;
    return rest('permit_status_logs', { filters: f, order, limit });
  },
  create: (data) => restInsert('permit_status_logs', data),
};

// ══════════════════════════════════════════════════════════════════════════════
// USER ONBOARDING
// ══════════════════════════════════════════════════════════════════════════════
export const UserOnboarding = {
  filter: (filters = {}) => {
    const f = {};
    if (filters.user_email) f.user_email = `eq.${filters.user_email}`;
    return rest('user_onboarding', { filters: f, limit: 1 });
  },
  create: (data) => restInsert('user_onboarding', data),
  update: (id, data) => restUpdate('user_onboarding', id, data),
};

// ══════════════════════════════════════════════════════════════════════════════
// PRIVATE PROVIDER FIRMS
// ══════════════════════════════════════════════════════════════════════════════
export const PrivateProviderFirm = {
  filter: (filters = {}) => {
    const f = {};
    if (filters.owner_email) f.owner_email = `eq.${filters.owner_email}`;
    return rest('private_provider_firms', { filters: f });
  },
  list: () => rest('private_provider_firms', {}),
  create: (data) => restInsert('private_provider_firms', data),
  update: (id, data) => restUpdate('private_provider_firms', id, data),
};

// ══════════════════════════════════════════════════════════════════════════════
// INSPECTION REPORTS
// ══════════════════════════════════════════════════════════════════════════════
export const InspectionReport = {
  filter: (filters = {}) => {
    const f = {};
    if (filters.project_id) f.project_id = `eq.${filters.project_id}`;
    if (filters.folio_number) f.folio_number = `eq.${filters.folio_number}`;
    return rest('inspection_reports', { filters: f, order: 'inspection_date.desc' });
  },
  create: (data) => restInsert('inspection_reports', data),
  update: (id, data) => restUpdate('inspection_reports', id, data),
};

// ══════════════════════════════════════════════════════════════════════════════
// SUBMISSION GUIDE STEPS
// ══════════════════════════════════════════════════════════════════════════════
export const SubmissionGuideStep = {
  filter: (filters = {}) => {
    const f = {};
    if (filters.guide_id) f.guide_id = `eq.${filters.guide_id}`;
    return rest('submission_guide_steps', { filters: f, order: 'step_order.asc' });
  },
  create: (data) => restInsert('submission_guide_steps', data),
  update: (id, data) => restUpdate('submission_guide_steps', id, data),
};