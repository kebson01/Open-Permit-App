/**
 * Converts database FeeRule + CitySurcharge records into the format
 * expected by the calculatePermitFee engine in feeConfigs.js
 */

export function buildCityConfigFromDB(city, feeRules, surcharge) {
  const permits = feeRules
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    .map(rule => buildPermitFromRule(rule));

  return {
    city: city.name,
    effective_date: surcharge?.effective_date || city.fee_schedule_effective_date || "",
    resolution: surcharge?.resolution || "",
    portal_url: city.portal_url || "",
    surcharges: surcharge ? {
      technology_admin: surcharge.technology_admin || 0,
      board_of_rules_rate: surcharge.board_of_rules_rate || 0,
      educational_rate: surcharge.educational_rate || 0,
      dca_rate: surcharge.dca_rate || 0,
      dbpr_rate: surcharge.dbpr_rate || 0,
    } : {},
    permits,
  };
}

function parseTiers(tiersConfig) {
  try {
    const tiers = JSON.parse(tiersConfig || "[]");
    // Replace null max (from JSON.stringify(Infinity)) with Infinity
    return tiers.map(t => ({ ...t, max: t.max == null ? Infinity : t.max }));
  } catch {
    return [];
  }
}

function buildPermitFromRule(rule) {
  const feeConfig = { include_surcharges: rule.include_city_surcharges || false };

  if (rule.technology_admin_fee) feeConfig.technology_admin = rule.technology_admin_fee;
  if (rule.planning_zoning_fee) feeConfig.planning_zoning_fee = rule.planning_zoning_fee;

  switch (rule.calc_type) {
    case "flat":
      feeConfig.fee = rule.flat_fee || 0;
      break;
    case "flat_per_unit":
      feeConfig.fee_per_unit = rule.fee_per_unit || 0;
      feeConfig.unit_label = rule.unit_label || "units";
      break;
    case "flat_plus_units":
      feeConfig.base_fee = rule.base_fee || 0;
      feeConfig.rate_per_unit = rule.rate_per_unit || 0;
      feeConfig.unit_label = rule.unit_label || "units";
      feeConfig.unit_threshold = rule.unit_threshold || 1;
      break;
    case "flat_plus_linear":
      feeConfig.base_fee = rule.base_fee || 0;
      feeConfig.base_includes_ft = rule.base_includes_ft || 100;
      feeConfig.rate_per_linear_ft = rule.rate_per_linear_ft || 0;
      break;
    case "tiered_cost":
      feeConfig.base_fee = rule.base_fee || 0;
      feeConfig.threshold = rule.cost_threshold || 1000;
      feeConfig.tiers = parseTiers(rule.tiers_config);
      break;
    case "per_sqft_tier":
      feeConfig.tiers = parseTiers(rule.tiers_config);
      break;
    case "eng_cost_tier":
      feeConfig.tiers = parseTiers(rule.tiers_config);
      break;
    case "flat_plus_pct":
      feeConfig.base_fee = rule.base_fee || 0;
      feeConfig.rate = (rule.rate_percentage || 0) / 100;
      break;
  }

  // Determine inputs array from calc_type and input_field
  const inputs = getInputsForCalcType(rule.calc_type, rule.input_field);

  return {
    id: rule.permit_id || rule.id,
    name: rule.permit_name,
    category: rule.category,
    description: rule.description || "",
    calcType: rule.calc_type,
    inputs,
    feeConfig,
  };
}

function getInputsForCalcType(calcType, inputField) {
  switch (calcType) {
    case "flat": return [];
    case "flat_per_unit": return [inputField || "units"];
    case "flat_plus_units": return [inputField || "openings"];
    case "flat_plus_linear": return ["linearFeet"];
    case "tiered_cost": return ["constructionCost"];
    case "per_sqft_tier": return ["squareFeet"];
    case "eng_cost_tier": return ["constructionCost"];
    case "flat_plus_pct": return ["constructionCost"];
    default: return [];
  }
}