/**
 * lib/db.js — Supabase data layer
 * All table/view names and column names match the actual Supabase schema.
 * Auth still uses base44.auth.* (unchanged).
 */

const SUPABASE_URL = 'https://gbknnjidqpmjrwlooluw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdia25uamlkcXBtanJ3bG9vbHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NTQzNDIsImV4cCI6MjA5MDIzMDM0Mn0.qwDACgXe3hesxBRQOzP53Hdc44z_UOka1_uYQScyi68';

// ── Generic REST helpers ───────────────────────────────────────────────────────

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
    return rest('cities', { filters: f, order: 'name.asc' });
  },
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
    if (filters.category)   f.category   = `eq.${filters.category}`;
    if (filters.permit_name) f.permit_name = `eq.${filters.permit_name}`;
    if (filters.permit_id)  f.permit_id  = `eq.${filters.permit_id}`;
    return rest('fee_rules', { filters: f, order: 'sort_order.asc' });
  },
  list: () => rest('fee_rules', { order: 'city_name.asc,sort_order.asc' }),
};

// ══════════════════════════════════════════════════════════════════════════════
// CITY SURCHARGES
// ══════════════════════════════════════════════════════════════════════════════
export const CitySurcharge = {
  filter: (filters = {}) => {
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
};

// ══════════════════════════════════════════════════════════════════════════════
// PERMIT RECORDS — Weston uses weston_permits_view
// Columns: folio_number, permit_number, permit_name, permit_type,
//          permit_status, status_normalized, open_date, has_open_code_case
// ══════════════════════════════════════════════════════════════════════════════
export const PermitRecord = {
  getByFolio: (folio, cityName = 'Weston') => {
    // Only Weston has a view currently; extend map as other cities are added
    const VIEW_MAP = { 'Weston': 'weston_permits_view' };
    const table = VIEW_MAP[cityName] || 'weston_permits_view';
    return rest(table, {
      filters: { folio_number: `eq.${folio}` },
      order: 'open_date.desc',
      limit: 200,
    });
  },
  filter: (filters = {}, _order, limit = 50) => {
    const table = 'weston_permits_view';
    const f = {};
    if (filters.folio_number) f.folio_number = `eq.${filters.folio_number}`;
    return rest(table, { filters: f, limit });
  },
  list: (limit = 20) => rest('weston_permits_view', { order: 'open_date.desc', limit }),
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
    if (filters.category)  f.category  = `eq.${filters.category}`;
    return rest('weston_code_of_ordinances', { filters: f, order: 'chapter_number.asc' });
  },
  search: (cityName, q) => rest('weston_code_of_ordinances', {
    filters: { city_name: `eq.${cityName}`, content: `ilike.*${q}*` },
    limit: 20,
  }),
};

// ══════════════════════════════════════════════════════════════════════════════
// PROJECTS
// Columns: id, name, description, project_type, status, city_name,
//          folio_number, property_address, estimated_cost, square_footage,
//          owner_email, progress_pct, start_date, target_completion_date, created_at
// ══════════════════════════════════════════════════════════════════════════════
export const Project = {
  filter: (filters = {}, order = 'created_at.desc', limit = 50) => {
    const f = {};
    if (filters.owner_email) f.owner_email = `eq.${filters.owner_email}`;
    if (filters.id)          f.id          = `eq.${filters.id}`;
    return rest('projects', { filters: f, order, limit });
  },
  list: (order = 'created_at.desc', limit = 50) => rest('projects', { order, limit }),
  create: (data) => restInsert('projects', { ...data, created_at: new Date().toISOString() }),
  update: (id, data) => restUpdate('projects', id, data),
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
    if (filters.project_id)  f.project_id  = `eq.${filters.project_id}`;
    return rest('permit_wizard_sessions', { filters: f, order: 'created_at.desc' });
  },
  create: (data) => restInsert('permit_wizard_sessions', data),
  update: (id, data) => restUpdate('permit_wizard_sessions', id, data),
};

// ══════════════════════════════════════════════════════════════════════════════
// CONTRACTOR PROFILES
// Columns: id, user_id, user_email, company_name, license_number,
//          license_type, license_expiration, insurance_expiration,
//          phone, address, status, verified
// ══════════════════════════════════════════════════════════════════════════════
export const ContractorProfile = {
  filter: (filters = {}) => {
    const f = {};
    if (filters.user_email) f.user_email = `eq.${filters.user_email}`;
    if (filters.user_id)    f.user_id    = `eq.${filters.user_id}`;
    return rest('contractor_profiles', { filters: f });
  },
  create: (data) => restInsert('contractor_profiles', data),
  update: (id, data) => restUpdate('contractor_profiles', id, data),
};

// ══════════════════════════════════════════════════════════════════════════════
// SUBMISSION GUIDES
// Columns: user_email, user_role, city_name, city_portal_url, permit_type_name,
//          folio_number, target_system, phase, overall_status, questions_total,
//          questions_answered, questions_prefilled, estimated_fee, fee_breakdown,
//          field_mapping_snapshot, started_date, submitted_date, confirmation_number
// Insert requires: user_email, user_role, city_name, permit_type_name, target_system
// Guest users: is_guest = true, user_id = null
// ══════════════════════════════════════════════════════════════════════════════
export const SubmissionGuide = {
  filter: (filters = {}, order = 'created_at.desc', limit = 50) => {
    const f = {};
    if (filters.user_email)  f.user_email  = `eq.${filters.user_email}`;
    if (filters.folio_number) f.folio_number = `eq.${filters.folio_number}`;
    if (filters.project_id)  f.project_id  = `eq.${filters.project_id}`;
    if (filters.id)          f.id          = `eq.${filters.id}`;
    return rest('submission_guides', { filters: f, order, limit });
  },
  list: (order = 'created_at.desc', limit = 50) => rest('submission_guides', { order, limit }),
  create: (data) => restInsert('submission_guides', { ...data, created_at: new Date().toISOString() }),
  update: (id, data) => restUpdate('submission_guides', id, data),
  delete: (id) => restDelete('submission_guides', id),
};

// ══════════════════════════════════════════════════════════════════════════════
// SUBMISSION ANSWERS
// Columns: guide_id, question_id, question_key, question_text, answer_value,
//          was_prefilled, prefill_source, was_edited, answered_by,
//          answered_date, is_flagged
// ══════════════════════════════════════════════════════════════════════════════
export const SubmissionAnswer = {
  filter: (filters = {}) => {
    const f = {};
    if (filters.guide_id)          f.guide_id          = `eq.${filters.guide_id}`;
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
// PERMIT MILESTONES
// ══════════════════════════════════════════════════════════════════════════════
export const PermitMilestone = {
  filter: (filters = {}) => {
    const f = {};
    if (filters.project_id)   f.project_id   = `eq.${filters.project_id}`;
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
    if (filters.project_id)   f.project_id   = `eq.${filters.project_id}`;
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
    if (filters.project_id)  f.project_id  = `eq.${filters.project_id}`;
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