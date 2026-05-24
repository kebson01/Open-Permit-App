const CITIES_STRICT_FENCE = ["Weston", "Coral Springs", "Cooper City"];
const CITIES_STRICT_SHED = ["Weston", "Coral Springs"];
const ALWAYS_PERMIT = ["hvac", "water_heater", "electrical", "pool_spa", "solar", "generator", "room_addition", "structural", "hurricane_shutters"];

export function calculateResult(answers) {
  const {
    workType, city, propertyType,
    structuralChanges, newElecPlumbing,
    fenceHeight, fenceFront,
    shedSqft, shedElectricity,
    roofWorkType,
    windowsImpact,
    poolDepth, poolPrefab,
    minorStructural, minorNewWiring,
    projectCost,
    awningCost,
  } = answers;

  const cost = parseFloat(projectCost) || 0;
  const sqft = parseFloat(shedSqft) || 0;
  const height = parseFloat(fenceHeight) || 0;
  const depth = parseFloat(poolDepth) || 0;

  // ── PAINTING / COSMETIC ──
  if (workType === "painting_cosmetic") {
    if (structuralChanges === "No" && newElecPlumbing === "No") {
      return { verdict: "EXEMPT", reason: "Interior and exterior painting, flooring, carpet, tile, countertops, and cabinet replacements are explicitly exempt under Florida Building Code R105.2.", code: "FBC-R R105.2" };
    }
    return { verdict: "PERMIT_REQUIRED", reason: "When cosmetic work involves structural changes or new electrical/plumbing, a permit is required.", code: "FBC-R R105.1" };
  }

  // ── MINOR REPAIRS ──
  if (workType === "minor_repairs") {
    if (minorStructural === "No" && minorNewWiring === "No") {
      return { verdict: "EXEMPT", reason: "Minor repairs to existing fixtures and components that do not involve structural elements or new wiring/plumbing are exempt under FBC-R R105.2.", code: "FBC-R R105.2" };
    }
    return { verdict: "PERMIT_REQUIRED", reason: "Repairs involving structural components or new electrical/plumbing rough-in require a permit.", code: "FBC-R R105.1" };
  }

  // ── LANDSCAPING ──
  if (workType === "landscaping") {
    return { verdict: "EXEMPT", reason: "Landscaping work including lawn maintenance, planting, and irrigation (without structures) is exempt from permitting requirements.", code: "FBC-R R105.2" };
  }

  // ── SHED / PERGOLA ──
  if (workType === "shed_pergola") {
    if (shedElectricity === "Yes") {
      return { verdict: "PERMIT_REQUIRED", reason: "Any accessory structure with electricity or plumbing requires an electrical/plumbing permit regardless of size.", code: "FBC-R R105.1" };
    }
    if (sqft > 150) {
      return { verdict: "PERMIT_REQUIRED", reason: "Detached accessory structures over 150 sq ft require a building permit under FBC-R R105.2.", code: "FBC-R R105.2" };
    }
    if (sqft < 100) {
      return { verdict: "EXEMPT", reason: "Detached accessory structures under 100 sq ft with no utilities are exempt under Florida Building Code.", code: "FBC-R R105.2" };
    }
    // 100–150 sqft
    if (sqft >= 100 && sqft <= 150 && CITIES_STRICT_SHED.includes(city)) {
      return { verdict: "MAY_NEED_PERMIT", reason: `${city} requires a permit for sheds 100 sq ft and larger, which is stricter than the state standard. Verify with the building department.`, code: "Local ordinance" };
    }
    if (sqft >= 100 && sqft <= 150) {
      return { verdict: "MAY_NEED_PERMIT", reason: "Structures between 100–150 sq ft may or may not require a permit depending on city rules. Verify locally.", code: "FBC-R R105.2 / Local ordinance" };
    }
  }

  // ── AWNING / SUNSHADE ──
  if (workType === "awning_sunshade") {
    if (cost < 2500) {
      return { verdict: "EXEMPT", reason: "Low-cost awnings and sunshades under $2,500 are generally exempt from permit requirements in Florida.", code: "FBC-R R105.2" };
    }
    return { verdict: "MAY_NEED_PERMIT", reason: "Awnings and sunshades over $2,500 may require a permit. Verify with your city building department.", code: "Local ordinance" };
  }

  // ── FENCE / GATE ──
  if (workType === "fence_gate") {
    if (height > 6) {
      return { verdict: "PERMIT_REQUIRED", reason: "Fences over 6 feet in height require a building permit under Florida Building Code.", code: "FBC-R R105.1" };
    }
    if (CITIES_STRICT_FENCE.includes(city)) {
      return { verdict: "MAY_NEED_PERMIT", reason: `${city} requires a permit for fences regardless of height. Contact the building department to confirm requirements.`, code: "Local ordinance" };
    }
    return { verdict: "EXEMPT", reason: "Fences 6 feet or under in height are generally exempt in this city under Florida Building Code.", code: "FBC-R R105.2" };
  }

  // ── ROOF ──
  if (workType === "roof") {
    if (roofWorkType === "minor_repair") {
      return { verdict: "EXEMPT", reason: "Minor roof repairs covering less than 25% of the roof area may be exempt. However, always verify with your local building department.", code: "FBC-R R105.2" };
    }
    if (roofWorkType === "partial_repair") {
      return { verdict: "MAY_NEED_PERMIT", reason: "Partial roof repairs over 25% of the roof area typically require a permit. Verify with your building department.", code: "FBC-R R105.1" };
    }
    return { verdict: "PERMIT_REQUIRED", reason: "Full roof replacement requires a roofing permit in all Broward County cities.", code: "FBC-R R105.1" };
  }

  // ── WINDOWS / DOORS ──
  if (workType === "windows_doors") {
    if (windowsImpact === "Yes") {
      return { verdict: "PERMIT_REQUIRED", reason: "Impact-rated (hurricane) windows and doors always require a permit to ensure proper installation per Florida Product Approval.", code: "FBC-R R105.1, SFBC" };
    }
    return { verdict: "MAY_NEED_PERMIT", reason: "Non-impact window and door replacements may require a permit depending on the scope and city requirements.", code: "FBC-R R105.1" };
  }

  // ── POOL / SPA ──
  if (workType === "pool_spa") {
    if (depth < 24 && poolPrefab === "Yes") {
      return { verdict: "EXEMPT", reason: "Pre-fabricated above-ground pools under 24 inches in depth are generally exempt from permit requirements.", code: "FBC-R R105.2" };
    }
    return { verdict: "PERMIT_REQUIRED", reason: "In-ground pools, spas, and above-ground pools over 24 inches depth require a building permit.", code: "FBC-R R105.1" };
  }

  // ── ALWAYS PERMIT REQUIRED ──
  if (ALWAYS_PERMIT.includes(workType)) {
    const reasons = {
      hvac: "HVAC replacement always requires a mechanical permit. No exceptions under Florida Building Code.",
      water_heater: "Water heater replacement requires a plumbing permit in all Florida cities.",
      electrical: "Electrical panel, circuit, or service work always requires an electrical permit.",
      pool_spa: "Pool and spa work requires a building permit.",
      solar: "Solar/photovoltaic installation requires electrical and building permits.",
      generator: "Standby generators require electrical and potentially mechanical permits.",
      room_addition: "Room additions require a full building permit application.",
      structural: "Structural work always requires a permit regardless of scope or cost.",
      hurricane_shutters: "Hurricane shutters and impact-rated openings always require a permit for Florida Product Approval verification.",
    };
    return { verdict: "PERMIT_REQUIRED", reason: reasons[workType] || "This type of work requires a building permit.", code: "FBC-R R105.1" };
  }

  // ── HB 837 LIKELY EXEMPT (catch-all) ──
  const nonPermitWork = !["hvac", "water_heater", "electrical", "pool_spa", "solar", "generator", "room_addition", "structural"].includes(workType);
  if (cost > 0 && cost < 2500 && propertyType === "single_family" && nonPermitWork) {
    return {
      verdict: "LIKELY_EXEMPT",
      reason: "Florida HB 837 (effective July 1, 2024) provides that projects under $2,500 for single-family residential homes may not require a building permit. However, this does NOT apply to electrical, plumbing, mechanical, or structural work.",
      code: "HB 837 (2024)",
    };
  }

  return { verdict: "MAY_NEED_PERMIT", reason: "Based on the information provided, we cannot confirm exemption status. Please verify with your local building department.", code: "FBC-R R105" };
}