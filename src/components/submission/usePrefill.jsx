/**
 * Prefill helper — resolves prefill_from fields to actual values
 * from Property, ContractorProfile, Project, and User entities.
 */
import * as db from "@/lib/db";

export async function buildPrefillMap(guide, currentUser) {
  const map = {};

  // Load project if linked
  let project = null;
  if (guide.project_id) {
    try {
      const projects = await db.Project.filter({ id: guide.project_id });
      project = projects?.[0] || null;
    } catch {}
  }

  // Load property via folio
  let property = null;
  const folio = guide.folio_number || project?.folio_number;
  if (folio) {
    try {
      const property_row = await db.Property.getByFolio(folio);
      property = property_row || null;
    } catch {}
  }

  // Load contractor profile
  let contractor = null;
  if (guide.user_role === "contractor" && currentUser?.email) {
    try {
      const profiles = await db.ContractorProfile.filter({ user_email: currentUser.email });
      contractor = profiles?.[0] || null;
    } catch {}
  }

  // Build map keyed by prefill_from value
  // Property fields
  if (property) {
    map["property.full_address"]           = property.full_address || "";
    map["property.FOLIO_NUMBER"]           = property.FOLIO_NUMBER || "";
    map["property.NAME_LINE_1"]            = property.NAME_LINE_1 || "";
    map["property.HOMESTEAD_FLAG"]         = property.HOMESTEAD_FLAG || "";
    map["property.BLDG_TOT_SQ_FOOTAGE"]    = property.BLDG_TOT_SQ_FOOTAGE?.toString() || "";
    map["property.BLDG_UNDER_AIR_SQ_FOOTAGE"] = property.BLDG_UNDER_AIR_SQ_FOOTAGE?.toString() || "";
    map["property.BLDG_YEAR_BUILT"]        = property.BLDG_YEAR_BUILT?.toString() || "";
    map["property.SITUS_CITY"]             = property.SITUS_CITY || "";
    map["property.SITUS_ZIP_CODE"]         = property.SITUS_ZIP_CODE || "";
    map["property.USE_TYPE"]               = property.USE_TYPE || "";
  }

  // Project fields
  if (project) {
    map["project.estimated_cost"]  = project.estimated_cost?.toString() || "";
    map["project.square_footage"]  = project.square_footage?.toString() || "";
    map["project.description"]     = project.description || "";
    map["project.property_address"]= project.property_address || "";
  }

  // Contractor fields
  if (contractor) {
    map["contractor.license_number"]      = contractor.license_number || "";
    map["contractor.company_name"]        = contractor.company_name || "";
    map["contractor.phone"]               = contractor.phone || "";
    map["contractor.insurance_expiration"]= contractor.insurance_expiration || "";
  }

  // User fields
  if (currentUser) {
    map["user.email"]     = currentUser.email || "";
    map["user.full_name"] = currentUser.full_name || "";
    map["user.phone"]     = currentUser.phone || "";
  }

  return map;
}