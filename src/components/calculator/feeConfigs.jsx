/**
 * Fee Schedule Configuration
 * Each municipality can have its own config object.
 * Swap or extend this file to support additional cities.
 *
 * calcType options:
 *   "tiered_cost"    - construction cost with tiered percentage (building/structure permits)
 *   "flat"           - single flat fee
 *   "flat_plus_units"- flat base + per-unit fee (e.g., shutters, fences by unit)
 *   "flat_plus_linear"- flat base (first N ft) + per linear ft beyond
 *   "per_sqft_tier"  - flat fee selected from sq ft tier table (fire plan review)
 *   "flat_per_unit"  - flat fee × number of units (garage doors, etc.)
 */

// ─── Weston FY 2025-2026 Fee Schedule ────────────────────────────────────────
// Resolution No. 2025-111 (Oct 1 2025) / Revised 2026-07 (Jan 20 2026)
export const WESTON_CONFIG = {
  city: "Weston",
  effective_date: "October 1, 2025 (Revised January 20, 2026)",
  resolution: "2026-07",
  portal_url: "https://www.westonfl.org",

  // City-wide surcharges applied on top of tiered-cost structure permits
  surcharges: {
    technology_admin: 127.00,            // per permit per trade
    board_of_rules_rate: 0.52,           // per $1,000 of construction cost (min $2.00)
    educational_rate: 0.0003,            // 0.03% of construction cost
    dca_rate: 0.01,                      // 1% of permit fee subtotal (min $2.00)
    dbpr_rate: 0.015,                    // 1.5% of permit fee subtotal (min $2.00)
  },

  permits: [
    // ── BUILDING / STRUCTURE PERMITS ──────────────────────────────────────────
    {
      id: "new_construction",
      name: "New Construction / Addition",
      category: "building",
      description: "New residential or commercial structure, or addition to existing structure",
      calcType: "tiered_cost",
      inputs: ["constructionCost"],
      feeConfig: {
        base_fee: 119.11,
        tiers: [
          { min: 1000,      max: 1250000,  base: 0,          rate: 0.0155 }, // 1.55% over $1,000
          { min: 1250000,   max: 3000000,  base: 19359.50,   rate: 0.0135 }, // + 1.35% over $1.25M
          { min: 3000000,   max: Infinity, base: 42954.50,   rate: 0.0120 }, // + 1.20% over $3M
        ],
        threshold: 1000, // costs ≤ $1,000 pay base only
        include_surcharges: true,
      },
    },
    {
      id: "residential_alteration",
      name: "Residential Remodel / Alteration",
      category: "building",
      description: "Interior or exterior renovation of an existing residential structure",
      calcType: "tiered_cost",
      inputs: ["constructionCost"],
      feeConfig: {
        base_fee: 119.11,
        tiers: [
          { min: 1000,      max: 1250000,  base: 0,          rate: 0.0155 },
          { min: 1250000,   max: 3000000,  base: 19359.50,   rate: 0.0135 },
          { min: 3000000,   max: Infinity, base: 42954.50,   rate: 0.0120 },
        ],
        threshold: 1000,
        include_surcharges: true,
      },
    },
    {
      id: "commercial_buildout",
      name: "Commercial Build-Out / Tenant Improvement",
      category: "building",
      description: "Commercial interior tenant improvements or build-out",
      calcType: "tiered_cost",
      inputs: ["constructionCost"],
      feeConfig: {
        base_fee: 119.11,
        tiers: [
          { min: 1000,      max: 1250000,  base: 0,          rate: 0.0155 },
          { min: 1250000,   max: 3000000,  base: 19359.50,   rate: 0.0135 },
          { min: 3000000,   max: Infinity, base: 42954.50,   rate: 0.0120 },
        ],
        threshold: 1000,
        include_surcharges: true,
        planning_zoning_fee: 650.00, // Interior Tenant Improvements P&Z Review
      },
    },
    {
      id: "demolition_sfr",
      name: "Demolition – Single Family Residential",
      category: "building",
      description: "Demolition of a single-family residential structure",
      calcType: "flat",
      inputs: [],
      feeConfig: { fee: 120.61, include_surcharges: false },
    },
    {
      id: "demolition_other",
      name: "Demolition – Commercial / Multi-Family",
      category: "building",
      description: "Demolition of commercial or multi-family structure (per floor per structure per trade)",
      calcType: "flat_per_unit",
      inputs: ["floors"],
      feeConfig: { fee_per_unit: 162.83, unit_label: "floors", include_surcharges: false },
    },

    // ── NON-STRUCTURE PERMITS ─────────────────────────────────────────────────
    {
      id: "hurricane_shutters",
      name: "Hurricane Shutters",
      category: "building",
      description: "Residential hurricane shutters (up to two stories) – first opening + each additional",
      calcType: "flat_plus_units",
      inputs: ["openings"],
      feeConfig: {
        base_fee: 115.79,       // first opening
        rate_per_unit: 9.65,    // each additional opening
        unit_label: "openings",
        unit_threshold: 1,      // first 1 included in base
        include_surcharges: false,
        technology_admin: 127.00,
      },
    },
    {
      id: "garage_door",
      name: "Garage Door Replacement",
      category: "building",
      description: "Residential garage door replacement (per door)",
      calcType: "flat_per_unit",
      inputs: ["units"],
      feeConfig: {
        fee_per_unit: 205.04,
        unit_label: "doors",
        include_surcharges: false,
        technology_admin: 127.00,
      },
    },
    {
      id: "ac_unit",
      name: "A/C Unit Replacement",
      category: "building",
      description: "Residential ground-mounted air conditioning unit (up to 5 tons)",
      calcType: "flat",
      inputs: [],
      feeConfig: { fee: 205.04, include_surcharges: false, technology_admin: 127.00 },
    },
    {
      id: "water_heater",
      name: "Water Heater Replacement",
      category: "plumbing",
      description: "Residential water heater replacement (up to 80 gallons)",
      calcType: "flat",
      inputs: [],
      feeConfig: { fee: 205.04, include_surcharges: false, technology_admin: 127.00 },
    },
    {
      id: "fence",
      name: "Residential Fence",
      category: "building",
      description: "Residential fence installation",
      calcType: "flat_plus_linear",
      inputs: ["linearFeet"],
      feeConfig: {
        base_fee: 205.04,           // first 100 linear feet
        base_includes_ft: 100,
        rate_per_linear_ft: 0.36,   // each additional foot
        include_surcharges: false,
        technology_admin: 127.00,
      },
    },
    {
      id: "pool_sfr",
      name: "Swimming Pool / Spa – Single Family",
      category: "building",
      description: "New swimming pool, spa, or hot tub for single-family residential (includes all trades)",
      calcType: "flat",
      inputs: [],
      feeConfig: { fee: 1145.83, include_surcharges: false, technology_admin: 127.00 },
    },
    {
      id: "pool_other",
      name: "Swimming Pool / Spa – Commercial / Multi-Family",
      category: "building",
      description: "New swimming pool, spa, or hot tub for commercial/multi-family (includes all trades)",
      calcType: "flat",
      inputs: [],
      feeConfig: { fee: 2050.44, include_surcharges: false, technology_admin: 127.00 },
    },
    {
      id: "low_voltage_alarm",
      name: "Low Voltage Alarm System",
      category: "electrical",
      description: "Hardwired low-voltage alarm system, home automation, CCTV, access control",
      calcType: "flat",
      inputs: [],
      feeConfig: { fee: 40.00, include_surcharges: false, technology_admin: 127.00 },
    },

    // ── FIRE CODE SERVICES ────────────────────────────────────────────────────
    {
      id: "fire_sprinkler",
      name: "Fire Sprinkler System",
      category: "fire",
      description: "Sprinkler system plan review and inspection",
      calcType: "flat_plus_units",
      inputs: ["sprinklerHeads"],
      feeConfig: {
        base_fee: 350.00,       // 1–12 heads
        rate_per_unit: 0.70,    // each additional head beyond 12
        unit_label: "heads",
        unit_threshold: 12,
        include_surcharges: false,
        technology_admin: 127.00,
      },
    },
    {
      id: "fire_alarm",
      name: "Fire Alarm System",
      category: "fire",
      description: "Fire alarm system plan review and inspection",
      calcType: "flat_plus_units",
      inputs: ["alarmDevices"],
      feeConfig: {
        base_fee: 350.00,       // 1–12 devices
        rate_per_unit: 0.70,    // each additional device beyond 12
        unit_label: "devices",
        unit_threshold: 12,
        include_surcharges: false,
        technology_admin: 127.00,
      },
    },
    {
      id: "fire_standpipe",
      name: "Fire Standpipe System",
      category: "fire",
      description: "Fire standpipe system plan review",
      calcType: "flat",
      inputs: [],
      feeConfig: { fee: 350.00, include_surcharges: false, technology_admin: 127.00 },
    },
    {
      id: "fire_pump",
      name: "Fire Pump",
      category: "fire",
      description: "Fire pump plan review",
      calcType: "flat",
      inputs: [],
      feeConfig: { fee: 612.50, include_surcharges: false, technology_admin: 127.00 },
    },
    {
      id: "smoke_control",
      name: "Smoke Control System",
      category: "fire",
      description: "Smoke control / smoke evacuation system",
      calcType: "flat",
      inputs: [],
      feeConfig: { fee: 1400.00, include_surcharges: false, technology_admin: 127.00 },
    },
    {
      id: "fire_site_review",
      name: "Fire – Site Development / Building Plan Review",
      category: "fire",
      description: "Multi-family or non-residential fire plan review fee based on square footage",
      calcType: "per_sqft_tier",
      inputs: ["squareFeet"],
      feeConfig: {
        tiers: [
          { max: 1500,  fee: 787.50 },
          { max: 2500,  fee: 962.50 },
          { max: 3500,  fee: 1137.50 },
          { max: 5000,  fee: 1312.50 },
          { max: 7500,  fee: 1400.00 },
          { max: 10000, fee: 1487.50 },
          { max: 15000, fee: 1575.00 },
          { max: 20000, fee: 1750.00 },
          { max: Infinity, base: 1750.00, rate_per_sqft: 0.04 }, // >20,000
        ],
        include_surcharges: false,
        technology_admin: 127.00,
      },
    },

    // ── ENGINEERING ───────────────────────────────────────────────────────────
    {
      id: "eng_paving_sfr",
      name: "Paving / Drainage / Water & Sewer – Single Family",
      category: "engineering",
      description: "Engineering permit for paving, drainage, water & sewer on single-family property",
      calcType: "flat",
      inputs: [],
      feeConfig: { fee: 375.00, include_surcharges: false },
    },
    {
      id: "eng_paving_commercial",
      name: "Paving / Drainage / Water & Sewer – Commercial",
      category: "engineering",
      description: "Engineering permit for commercial/multi-family paving & drainage (cost estimate based)",
      calcType: "eng_cost_tier",
      inputs: ["constructionCost"],
      feeConfig: {
        tiers: [
          { min: 0,      max: 30000,   base: 550, rate: 0.06 },
          { min: 30000,  max: 100000,  base: 550, rate: 0.05 },
          { min: 100000, max: Infinity,base: 550, rate: 0.04 },
        ],
        include_surcharges: false,
      },
    },
    {
      id: "eng_pavement_sfr",
      name: "Pavement, Sealcoating & Restriping – Single Family",
      category: "engineering",
      description: "Engineering permit for residential pavement, sealcoating, restriping",
      calcType: "flat",
      inputs: [],
      feeConfig: { fee: 200.00, include_surcharges: false },
    },
    {
      id: "eng_earthwork_sfr",
      name: "Earthwork Permit – Single Family",
      category: "engineering",
      description: "Earthwork permit for single-family residential property",
      calcType: "flat",
      inputs: [],
      feeConfig: { fee: 375.00, include_surcharges: false },
    },

    // ── PLANNING & ZONING ────────────────────────────────────────────────────
    {
      id: "pz_sfr_pool_addition",
      name: "Site Plan Review – Single Family (Pool / Addition)",
      category: "planning",
      description: "Planning & zoning site plan review for single-family pool or addition",
      calcType: "flat",
      inputs: [],
      feeConfig: { fee: 700.00, include_surcharges: false },
    },
    {
      id: "pz_fence_deck",
      name: "Site Plan Review – Fence, Deck, Enclosure",
      category: "planning",
      description: "Planning & zoning site plan review for fences, decks, enclosures",
      calcType: "flat",
      inputs: [],
      feeConfig: { fee: 450.00, include_surcharges: false },
    },
    {
      id: "pz_sign_permit",
      name: "Sign Permit – Planning & Zoning Review",
      category: "planning",
      description: "Site plan review for sign permit (base + 3.75% of cost estimate)",
      calcType: "flat_plus_pct",
      inputs: ["constructionCost"],
      feeConfig: {
        base_fee: 450.00,
        rate: 0.0375,
        include_surcharges: false,
      },
    },
    {
      id: "vacation_rental",
      name: "Vacation Rental Registration",
      category: "planning",
      description: "Vacation rental property application registration fee",
      calcType: "flat",
      inputs: [],
      feeConfig: { fee: 500.00, include_surcharges: false },
    },

    // ── CERTIFICATES ──────────────────────────────────────────────────────────
    {
      id: "cert_occupancy",
      name: "Certificate of Occupancy",
      category: "certificate",
      description: "Certificate of Occupancy issuance",
      calcType: "flat",
      inputs: [],
      feeConfig: { fee: 120.61, include_surcharges: false },
    },
    {
      id: "cert_completion",
      name: "Certificate of Completion",
      category: "certificate",
      description: "Certificate of Completion issuance",
      calcType: "flat",
      inputs: [],
      feeConfig: { fee: 139.91, include_surcharges: false },
    },
    {
      id: "cert_temp_co",
      name: "Temporary Certificate of Occupancy",
      category: "certificate",
      description: "Temporary Certificate of Occupancy",
      calcType: "flat",
      inputs: [],
      feeConfig: { fee: 277.41, include_surcharges: false },
    },
  ],
};

// ─── Fee Calculation Engine ───────────────────────────────────────────────────
export function calculatePermitFee(permit, details, cityConfig) {
  const cfg = permit.feeConfig;
  const surcharges = cityConfig.surcharges;
  const breakdown = [];
  let permitSubtotal = 0;

  if (permit.calcType === "tiered_cost") {
    const cost = details.constructionCost || 0;
    const base = cfg.base_fee;
    let tierFee = 0;
    if (cost > cfg.threshold) {
      for (const tier of cfg.tiers) {
        if (cost > tier.min) {
          const taxable = Math.min(cost, tier.max) - tier.min;
          tierFee = tier.base + taxable * tier.rate;
        }
      }
    }
    permitSubtotal = base + tierFee;
    breakdown.push({ label: "Base Permit Fee", amount: base });
    if (tierFee > 0) breakdown.push({ label: "Tiered Construction Cost Fee", amount: tierFee });

    if (cfg.planning_zoning_fee) {
      breakdown.push({ label: "Planning & Zoning Review", amount: cfg.planning_zoning_fee });
      permitSubtotal += cfg.planning_zoning_fee;
    }

    // City surcharges
    breakdown.push({ label: "Technology & Administration Fee", amount: surcharges.technology_admin });
    const boardFee = Math.max(2.00, (cost / 1000) * surcharges.board_of_rules_rate);
    breakdown.push({ label: "Board of Rules & Appeals Fee", amount: boardFee });
    const eduFee = cost * surcharges.educational_rate;
    breakdown.push({ label: "Educational Fee (0.03%)", amount: eduFee });
    const dcaFee = Math.max(2.00, permitSubtotal * surcharges.dca_rate);
    breakdown.push({ label: "DCA Surcharge (1.0%)", amount: dcaFee });
    const dbprFee = Math.max(2.00, permitSubtotal * surcharges.dbpr_rate);
    breakdown.push({ label: "DBPR / BCAIF Fee (1.5%)", amount: dbprFee });

    const total = permitSubtotal + surcharges.technology_admin + boardFee + eduFee + dcaFee + dbprFee;
    return { total, breakdown, permitSubtotal };
  }

  if (permit.calcType === "flat") {
    permitSubtotal = cfg.fee;
    breakdown.push({ label: "Permit Fee", amount: cfg.fee });
    if (cfg.technology_admin) {
      breakdown.push({ label: "Technology & Administration Fee", amount: cfg.technology_admin });
      permitSubtotal += cfg.technology_admin;
    }
    return { total: permitSubtotal, breakdown };
  }

  if (permit.calcType === "flat_per_unit") {
    const qty = details.units || details.floors || 1;
    permitSubtotal = cfg.fee_per_unit * qty;
    breakdown.push({ label: `Permit Fee (${qty} ${cfg.unit_label})`, amount: permitSubtotal });
    if (cfg.technology_admin) {
      breakdown.push({ label: "Technology & Administration Fee", amount: cfg.technology_admin });
      permitSubtotal += cfg.technology_admin;
    }
    return { total: permitSubtotal, breakdown };
  }

  if (permit.calcType === "flat_plus_units") {
    const qty = details[permit.inputs[0]] || 1;
    const base = cfg.base_fee;
    const extra = Math.max(0, qty - cfg.unit_threshold) * cfg.rate_per_unit;
    permitSubtotal = base + extra;
    breakdown.push({ label: `Base Fee (first ${cfg.unit_threshold} ${cfg.unit_label})`, amount: base });
    if (extra > 0) breakdown.push({ label: `Additional ${cfg.unit_label} fee`, amount: extra });
    if (cfg.technology_admin) {
      breakdown.push({ label: "Technology & Administration Fee", amount: cfg.technology_admin });
      permitSubtotal += cfg.technology_admin;
    }
    return { total: permitSubtotal, breakdown };
  }

  if (permit.calcType === "flat_plus_linear") {
    const ft = details.linearFeet || 0;
    const base = cfg.base_fee;
    const extra = Math.max(0, ft - cfg.base_includes_ft) * cfg.rate_per_linear_ft;
    permitSubtotal = base + extra;
    breakdown.push({ label: `Base Fee (first ${cfg.base_includes_ft} linear ft)`, amount: base });
    if (extra > 0) breakdown.push({ label: `Additional linear footage (${ft - cfg.base_includes_ft} ft @ $${cfg.rate_per_linear_ft}/ft)`, amount: extra });
    if (cfg.technology_admin) {
      breakdown.push({ label: "Technology & Administration Fee", amount: cfg.technology_admin });
      permitSubtotal += cfg.technology_admin;
    }
    return { total: permitSubtotal, breakdown };
  }

  if (permit.calcType === "per_sqft_tier") {
    const sqft = details.squareFeet || 0;
    let fee = 0;
    for (const tier of cfg.tiers) {
      if (sqft <= tier.max) {
        fee = tier.base ? tier.base + (sqft - 20000) * tier.rate_per_sqft : tier.fee;
        break;
      }
    }
    permitSubtotal = fee;
    breakdown.push({ label: `Fire Plan Review Fee (${sqft.toLocaleString()} sq ft)`, amount: fee });
    if (cfg.technology_admin) {
      breakdown.push({ label: "Technology & Administration Fee", amount: cfg.technology_admin });
      permitSubtotal += cfg.technology_admin;
    }
    return { total: permitSubtotal, breakdown };
  }

  if (permit.calcType === "eng_cost_tier") {
    const cost = details.constructionCost || 0;
    let fee = 0;
    for (const tier of cfg.tiers) {
      if (cost >= tier.min && cost <= tier.max) {
        fee = tier.base + cost * tier.rate;
        break;
      }
    }
    permitSubtotal = fee;
    breakdown.push({ label: `Engineering Permit Fee`, amount: fee });
    return { total: permitSubtotal, breakdown };
  }

  if (permit.calcType === "flat_plus_pct") {
    const cost = details.constructionCost || 0;
    const base = cfg.base_fee;
    const pct = cost * cfg.rate;
    permitSubtotal = base + pct;
    breakdown.push({ label: "Base Fee", amount: base });
    if (pct > 0) breakdown.push({ label: `Cost-based Fee (${(cfg.rate * 100).toFixed(2)}%)`, amount: pct });
    return { total: permitSubtotal, breakdown };
  }

  return { total: 0, breakdown: [] };
}

// Registry of all municipality configs — add new cities here
export const CITY_FEE_CONFIGS = {
  "Weston": WESTON_CONFIG,
  // "Coral Springs": CORAL_SPRINGS_CONFIG,
  // "Fort Lauderdale": FORT_LAUDERDALE_CONFIG,
};