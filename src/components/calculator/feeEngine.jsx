/**
 * Fee calculation engine that works with Supabase weston_fee_rules rows.
 * Row fields: calc_type, flat_fee, fee_per_unit, unit_label, unit_threshold,
 *   base_fee, rate_per_unit, base_includes_ft, rate_per_linear_ft,
 *   rate_percentage, cost_threshold, tiers_config, technology_admin_fee,
 *   planning_zoning_fee, input_field
 * 
 * Surcharges (Weston city-wide):
 *   technology_admin: 127.00 per permit per trade
 *   board_of_rules_rate: 0.52 per $1,000 construction cost (min $2.00)
 *   educational_rate: 0.0003 of construction cost
 *   dca_rate: 0.01 of permit subtotal (min $2.00)
 *   dbpr_rate: 0.015 of permit subtotal (min $2.00)
 */

const WESTON_SURCHARGES = {
  technology_admin: 127.00,
  board_of_rules_rate: 0.52,   // per $1,000
  educational_rate: 0.0003,
  dca_rate: 0.01,
  dbpr_rate: 0.015,
};

export function calculateFeeFromRule(row, details) {
  const breakdown = [];
  let permitSubtotal = 0;
  const calc = row.calc_type;

  if (calc === "tiered_cost") {
    const cost = details.constructionCost || 0;
    const base = row.base_fee || 0;
    let tiers = [];
    try { tiers = row.tiers_config ? JSON.parse(row.tiers_config) : []; } catch {}
    let tierFee = 0;
    const threshold = row.cost_threshold || 1000;
    if (cost > threshold && tiers.length) {
      for (const tier of tiers) {
        if (cost > tier.min) {
          const taxable = Math.min(cost, tier.max ?? Infinity) - tier.min;
          tierFee = (tier.base ?? 0) + taxable * (tier.rate ?? 0);
        }
      }
    }
    permitSubtotal = base + tierFee;
    breakdown.push({ label: "Base Permit Fee", amount: base });
    if (tierFee > 0) breakdown.push({ label: "Tiered Construction Cost Fee", amount: tierFee });
    if (row.planning_zoning_fee) {
      breakdown.push({ label: "Planning & Zoning Review", amount: row.planning_zoning_fee });
      permitSubtotal += row.planning_zoning_fee;
    }
    // City surcharges
    const s = WESTON_SURCHARGES;
    breakdown.push({ label: "Technology & Administration Fee", amount: s.technology_admin });
    const boardFee = Math.max(2.00, (cost / 1000) * s.board_of_rules_rate);
    breakdown.push({ label: "Board of Rules & Appeals Fee", amount: boardFee });
    const eduFee = cost * s.educational_rate;
    breakdown.push({ label: "Educational Fee (0.03%)", amount: eduFee });
    const dcaFee = Math.max(2.00, permitSubtotal * s.dca_rate);
    breakdown.push({ label: "DCA Surcharge (1.0%)", amount: dcaFee });
    const dbprFee = Math.max(2.00, permitSubtotal * s.dbpr_rate);
    breakdown.push({ label: "DBPR / BCAIF Fee (1.5%)", amount: dbprFee });
    const total = permitSubtotal + s.technology_admin + boardFee + eduFee + dcaFee + dbprFee;
    return { total, breakdown, permitSubtotal };
  }

  if (calc === "flat") {
    const fee = row.flat_fee || 0;
    breakdown.push({ label: "Permit Fee", amount: fee });
    permitSubtotal = fee;
    const techFee = row.technology_admin_fee ?? WESTON_SURCHARGES.technology_admin;
    if (techFee) {
      breakdown.push({ label: "Technology & Administration Fee", amount: techFee });
      permitSubtotal += techFee;
    }
    return { total: permitSubtotal, breakdown };
  }

  if (calc === "flat_per_unit") {
    const inputKey = row.input_field || "units";
    const qty = details[inputKey] || details.units || details.floors || 1;
    const fee = (row.fee_per_unit || 0) * qty;
    breakdown.push({ label: `Permit Fee (${qty} ${row.unit_label || "units"})`, amount: fee });
    permitSubtotal = fee;
    const techFee = row.technology_admin_fee ?? WESTON_SURCHARGES.technology_admin;
    if (techFee) {
      breakdown.push({ label: "Technology & Administration Fee", amount: techFee });
      permitSubtotal += techFee;
    }
    return { total: permitSubtotal, breakdown };
  }

  if (calc === "flat_plus_units") {
    const inputKey = row.input_field || "openings";
    const qty = details[inputKey] || 1;
    const base = row.base_fee || 0;
    const threshold = row.unit_threshold || 1;
    const extra = Math.max(0, qty - threshold) * (row.rate_per_unit || 0);
    permitSubtotal = base + extra;
    breakdown.push({ label: `Base Fee (first ${threshold} ${row.unit_label || "units"})`, amount: base });
    if (extra > 0) breakdown.push({ label: `Additional ${row.unit_label || "units"} fee`, amount: extra });
    const techFee = row.technology_admin_fee ?? WESTON_SURCHARGES.technology_admin;
    if (techFee) {
      breakdown.push({ label: "Technology & Administration Fee", amount: techFee });
      permitSubtotal += techFee;
    }
    return { total: permitSubtotal, breakdown };
  }

  if (calc === "flat_plus_linear") {
    const ft = details.linearFeet || 0;
    const base = row.base_fee || 0;
    const baseFt = row.base_includes_ft || 100;
    const extra = Math.max(0, ft - baseFt) * (row.rate_per_linear_ft || 0);
    permitSubtotal = base + extra;
    breakdown.push({ label: `Base Fee (first ${baseFt} linear ft)`, amount: base });
    if (extra > 0) breakdown.push({ label: `Additional linear footage (${ft - baseFt} ft @ $${row.rate_per_linear_ft}/ft)`, amount: extra });
    const techFee = row.technology_admin_fee ?? WESTON_SURCHARGES.technology_admin;
    if (techFee) {
      breakdown.push({ label: "Technology & Administration Fee", amount: techFee });
      permitSubtotal += techFee;
    }
    return { total: permitSubtotal, breakdown };
  }

  if (calc === "per_sqft_tier") {
    const sqft = details.squareFeet || 0;
    let tiers = [];
    try { tiers = row.tiers_config ? JSON.parse(row.tiers_config) : []; } catch {}
    let fee = 0;
    for (const tier of tiers) {
      if (sqft <= (tier.max ?? Infinity)) {
        fee = tier.base ? tier.base + (sqft - 20000) * (tier.rate_per_sqft || 0) : (tier.fee || 0);
        break;
      }
    }
    breakdown.push({ label: `Fire Plan Review Fee (${sqft.toLocaleString()} sq ft)`, amount: fee });
    permitSubtotal = fee;
    const techFee = row.technology_admin_fee ?? WESTON_SURCHARGES.technology_admin;
    if (techFee) {
      breakdown.push({ label: "Technology & Administration Fee", amount: techFee });
      permitSubtotal += techFee;
    }
    return { total: permitSubtotal, breakdown };
  }

  if (calc === "eng_cost_tier") {
    const cost = details.constructionCost || 0;
    let tiers = [];
    try { tiers = row.tiers_config ? JSON.parse(row.tiers_config) : []; } catch {}
    let fee = 0;
    for (const tier of tiers) {
      if (cost >= (tier.min || 0) && cost <= (tier.max ?? Infinity)) {
        fee = (tier.base || 0) + cost * (tier.rate || 0);
        break;
      }
    }
    breakdown.push({ label: "Engineering Permit Fee", amount: fee });
    return { total: fee, breakdown };
  }

  if (calc === "flat_plus_pct") {
    const cost = details.constructionCost || 0;
    const base = row.base_fee || 0;
    const rate = row.rate_percentage ? row.rate_percentage / 100 : 0;
    const pct = cost * rate;
    permitSubtotal = base + pct;
    breakdown.push({ label: "Base Fee", amount: base });
    if (pct > 0) breakdown.push({ label: `Cost-based Fee (${(rate * 100).toFixed(2)}%)`, amount: pct });
    return { total: permitSubtotal, breakdown };
  }

  return { total: 0, breakdown: [] };
}