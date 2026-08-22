/**
 * lib/countyRules.js — Broward County requirements, with their sources.
 *
 * Every row in `county_requirements` carries a statute reference, a source URL
 * and a last-verified date. That matters: the app should attribute rules to the
 * authority that issued them and link out, rather than restating them in its
 * own voice, where a paraphrase or a stale figure becomes the app's claim.
 *
 * Render `summary` / `key_numbers` as stored. Do not reword them here.
 */
import { useEffect, useState } from "react";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase";

const SB_HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
};

let _cache = null;
let _inflight = null;

export async function loadCountyRules() {
  if (_cache) return _cache;
  if (_inflight) return _inflight;

  _inflight = fetch(
    `${SUPABASE_URL}/rest/v1/county_requirements?select=requirement_id,category,tags,applies_to,title,short_summary,summary,key_numbers,statute_ref,source_url,effective_date,last_verified,last_verified_on,city_overrides&order=sort_order.asc`,
    { headers: SB_HEADERS }
  )
    .then(r => (r.ok ? r.json() : []))
    .then(data => {
      _cache = Array.isArray(data) ? data : [];
      _inflight = null;
      return _cache;
    })
    .catch(() => {
      _inflight = null;
      return [];
    });

  return _inflight;
}

export function useCountyRules() {
  const [rules, setRules] = useState(_cache || []);
  const [loading, setLoading] = useState(!_cache);

  useEffect(() => {
    if (_cache) { setRules(_cache); setLoading(false); return; }
    let alive = true;
    loadCountyRules().then(r => {
      if (!alive) return;
      setRules(r);
      setLoading(false);
    });
    return () => { alive = false; };
  }, []);

  return { rules, loading };
}

// Matches the county_requirement_freshness view, so the app and the admin
// page agree on what counts as stale.
const AGING_DAYS = 180;
const STALE_DAYS = 365;

/** Days since a rule was last checked against its source, or null if unknown. */
export function daysSinceVerified(rule) {
  if (!rule?.last_verified_on) return null;
  const then = new Date(rule.last_verified_on + "T00:00:00");
  if (isNaN(then)) return null;
  return Math.floor((Date.now() - then.getTime()) / 86400000);
}

/** "fresh" | "aging" | "stale" | "unknown" */
export function freshness(rule) {
  const d = daysSinceVerified(rule);
  if (d === null) return "unknown";
  if (d > STALE_DAYS) return "stale";
  if (d > AGING_DAYS) return "aging";
  return "fresh";
}

/** Human date for display — falls back to the legacy free-text field. */
export function verifiedLabel(rule) {
  if (rule?.last_verified_on) {
    const d = new Date(rule.last_verified_on + "T00:00:00");
    if (!isNaN(d)) return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }
  return rule?.last_verified || null;
}

const asArray = v => (Array.isArray(v) ? v : []);

/** Rules whose id is listed, in the order given. */
export function rulesByIds(rules, ids = []) {
  return ids.map(id => rules.find(r => r.requirement_id === id)).filter(Boolean);
}

/** Rules carrying any of these tags, in table order. */
export function rulesByTags(rules, tags = []) {
  if (tags.length === 0) return [];
  const want = new Set(tags);
  return rules.filter(r => asArray(r.tags).some(t => want.has(t)));
}

/**
 * Which county rules bear on a given permit.
 *
 * Keyed off the permit's category and map zone rather than its name, because
 * cities name the same permit differently — the whole reason PermitInfo showed
 * the wrong city's rules before.
 */
export function rulesForPermit(rules, { category, mapZone, name } = {}) {
  const ids = ["fbc_8th_edition", "uniform_permit_application", "notice_of_commencement"];
  const n = (name || "").toLowerCase();
  const zone = mapZone || "";

  if (zone === "roof" || n.includes("roof")) ids.push("hvhz_roofing");
  if (zone === "windows" || zone === "garage" || n.includes("window") || n.includes("door") || n.includes("shutter")) {
    ids.push("fenestration_wind_load_chart", "hvhz_all_broward");
  }
  if (zone === "pool" || n.includes("pool") || n.includes("spa")) ids.push("pool_barrier_law");
  if (n.includes("water heater")) ids.push("water_heater_data_form");
  if (n.includes("demolition") || n.includes("demo")) ids.push("asbestos_requirements");
  if (n.includes("solar")) ids.push("solar_hoa_protection");
  if (n.includes("tree")) ids.push("tree_removal_general");
  if (category === "certificate" || n.includes("certificate of occupancy")) ids.push("certificate_of_occupancy");

  // Anything structural enough to need inspections beyond a final.
  if (category === "building") ids.push("inspections");

  return rulesByIds(rules, [...new Set(ids)]);
}

/** County rules that bear on an exemption answer. */
export function rulesForExemption(rules) {
  return rulesByIds(rules, ["permit_exempt_work", "work_without_permit", "fbc_8th_edition"]);
}
