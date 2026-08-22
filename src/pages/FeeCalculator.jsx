import React, { useState, useEffect } from "react";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase";
import {
  Calculator, Info, Loader2,
  Check, ChevronDown, Save
} from "lucide-react";
import { useCities, cityHasFeeData } from "@/hooks/useCities";
import { Link } from "react-router-dom";

const SB_HEADERS = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` };

const CITY_PORTAL_URLS = {
  "Weston": "https://www.westonfl.org/Permits",
  "Coral Springs": "https://www.coralsprings.gov/Government/Departments/Building/Online-Permitting-eTrakit/Apply-for-Online-Permit",
  "Hollywood": "https://aca-prod.accela.com/HOLLYWOOD/Default.aspx",
  "Fort Lauderdale": "https://lauderbuild.fortlauderdale.gov/",
  "Cooper City": "https://coopercity.gov/?SEC=AD7C348E-C110-425A-B91C-2CA5769BF937",
  "Sunrise": "https://sunrisefl.gov/openforbusiness",
};

const CITY_NOTES = {
  "Weston": "NOC required if job value over $2,500. Fees effective October 2025.",
  "Coral Springs": "NOC required if job value over $5,000.",
  "Hollywood": "NOC required if job value over $5,000. Express Review: Wednesdays.",
  "Fort Lauderdale": "NOC required if job value over $2,500. Digital submissions only via LauderBuild.",
  "Cooper City": "NOC required if job value over $2,500. All applications must be NOTARIZED.",
  "Sunrise": "NOC required if job value over $2,500. Fees effective October 1, 2024.",
};

const PERMIT_CATEGORIES = [
  { key: "building",    label: "Building",     icon: "🏗️" },
  { key: "electrical",  label: "Electrical",   icon: "⚡" },
  { key: "plumbing",    label: "Plumbing",     icon: "🔧" },
  { key: "engineering", label: "Engineering",  icon: "🛣️" },
  { key: "fire",        label: "Fire",         icon: "🔥" },
  { key: "certificate", label: "Certificate",  icon: "📜" },
  { key: "planning",    label: "Planning",     icon: "📐" },
  { key: "additional",  label: "Additional",   icon: "➕" },
];

function calcSunriseSurcharges(permitFee, constructionValue) {
  const bcaib = Math.max(permitFee * 0.015, 2.00);
  const fbc   = Math.max(permitFee * 0.010, 2.00);
  const bra   = Math.max((constructionValue / 1000) * 0.52, 2.00);
  return { bcaib, fbc, bra };
}

function calculateStandardFee(rule, constructionCost, surcharge) {
  const cost = parseFloat(constructionCost) || 0;
  const breakdown = [];
  const flatFee  = parseFloat(rule.flat_fee)  || 0;
  const baseFee  = parseFloat(rule.base_fee)  || 0;
  const rate     = parseFloat(rule.rate_percentage) || 0;
  const calcType = rule.calc_type || "flat";
  let permitFee  = 0;

  if (calcType === "flat") {
    permitFee = flatFee > 0 ? flatFee : baseFee;
    breakdown.push({ label: "Base Application Fee", amount: permitFee });
  } else if (calcType === "flat_plus_pct") {
    const pctAmount = (rate / 100) * cost;
    permitFee = baseFee + pctAmount;
    if (baseFee > 0) breakdown.push({ label: "Base Application Fee", amount: baseFee });
    if (pctAmount > 0) breakdown.push({ label: `Plan Review (${rate}%)`, amount: pctAmount });
  } else if (calcType === "flat_plus_linear") {
    const linearFeet     = cost;
    const baseIncludes   = parseFloat(rule.base_includes_ft) || 0;
    const ratePerFt      = parseFloat(rule.rate_per_linear_ft) || 0;
    const overFt         = Math.max(0, linearFeet - baseIncludes);
    const linearExtra    = overFt * ratePerFt;
    permitFee = baseFee + linearExtra;
    breakdown.push({ label: "Base Application Fee", amount: baseFee });
    if (linearExtra > 0) breakdown.push({ label: `Linear Footage Add-on`, amount: linearExtra });
  } else {
    if (rate > 0) {
      const pctFee = cost * (rate / 100);
      permitFee = Math.max(baseFee, pctFee);
    } else {
      permitFee = flatFee > 0 ? flatFee : baseFee;
    }
    breakdown.push({ label: "Base Application Fee", amount: permitFee });
  }

  const techFee = parseFloat(rule.technology_admin_fee) || (surcharge ? parseFloat(surcharge.technology_admin) || 0 : 0);
  if (techFee > 0) breakdown.push({ label: "Administrative Processing", amount: techFee });

  let stateFees = 0;
  if (surcharge) {
    const dcaRate  = parseFloat(surcharge.dca_rate)  || 0;
    const dbprRate = parseFloat(surcharge.dbpr_rate) || 0;
    const eduRate  = parseFloat(surcharge.educational_rate) || 0;
    const borRate  = parseFloat(surcharge.board_of_rules_rate) || 0;
    if (dcaRate > 0)  { const f = permitFee * dcaRate;  stateFees += f; breakdown.push({ label: "State DCA Surcharge", amount: f, isState: true }); }
    if (dbprRate > 0) { const f = permitFee * dbprRate; stateFees += f; breakdown.push({ label: "State DBPR Surcharge", amount: f, isState: true }); }
    if (eduRate > 0)  { const f = permitFee * eduRate;  stateFees += f; breakdown.push({ label: "Educational & Training Fee", amount: f, isState: true }); }
    if (borRate > 0)  { const f = permitFee * borRate;  stateFees += f; breakdown.push({ label: "Board of Rules Surcharge", amount: f, isState: true }); }
  }

  const cityFees = permitFee + techFee;
  const total    = cityFees + stateFees;
  return { total, cityFees, stateFees, breakdown };
}

function calculateSunriseFee(rule, constructionCost, roofSqFt) {
  const cost = parseFloat(constructionCost) || 0;
  const breakdown = [];
  let permitFee  = 0;
  const isPercentage = rule.calc_type === "percentage";

  if (isPercentage) {
    const calculated = cost * ((rule.rate_percentage || 4.40) / 100);
    const minFee = 208.46;
    permitFee = Math.max(calculated, minFee);
    breakdown.push({ label: "Base Application Fee", amount: permitFee });
  } else {
    permitFee = rule.base_fee || 0;
    breakdown.push({ label: "Base Application Fee", amount: permitFee });
    const sqft = parseFloat(roofSqFt) || 0;
    if (rule.permit_name?.toLowerCase().includes("roof") && sqft > 3000) {
      const overage = Math.ceil((sqft - 3000) / 1000) * 101.56;
      breakdown.push({ label: "Roof Overage", amount: overage });
      permitFee += overage;
    }
  }

  const techFee = parseFloat(rule.technology_admin_fee) || 0;
  if (techFee > 0) breakdown.push({ label: "Administrative Processing", amount: techFee });

  const braBase = isPercentage ? cost : (rule.base_fee || 0);
  const { bcaib, fbc, bra } = calcSunriseSurcharges(permitFee, braBase);
  let stateFees = bra + bcaib + fbc;
  breakdown.push({ label: "State Surcharge (BRA)", amount: bra, isState: true });
  breakdown.push({ label: "State Surcharge (BCAIB)", amount: bcaib, isState: true });
  breakdown.push({ label: "State Surcharge (FBC)", amount: fbc, isState: true });

  const cityFees = permitFee + techFee;
  const total    = cityFees + stateFees;
  return { total, cityFees, stateFees, breakdown };
}


export default function FeeCalculator() {
  const urlParams  = new URLSearchParams(window.location.search);
  const urlCity    = urlParams.get("city") || "";
  const { cities, loading: citiesLoading } = useCities();
  const [city, setCity]           = useState(urlCity || sessionStorage.getItem("selectedCity") || "Weston");
  const [feeRules, setFeeRules]   = useState([]);
  const [surcharge, setSurcharge] = useState(null);
  const [loadingRules, setLoadingRules] = useState(false);
  const [activeCategory, setActiveCategory] = useState("building");
  const [selectedRule, setSelectedRule]     = useState(null);
  const [constructionCost, setConstructionCost] = useState("");
  const [results, setResults]     = useState(null);
  const [copied, setCopied]       = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);

  const cityObj   = cities.find(c => c.name === city) || null;
  const hasFeeData = cityHasFeeData(cityObj);
  const isSunrise  = city === "Sunrise";

  useEffect(() => {
    if (city) sessionStorage.setItem("selectedCity", city);
    setSelectedRule(null);
    setConstructionCost("");
    setResults(null);
    if (cityObj && !hasFeeData) { setFeeRules([]); setSurcharge(null); return; }
    setLoadingRules(true);
    const encoded = encodeURIComponent(city);
    Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/fee_rules?city_name=eq.${encoded}&order=sort_order.asc`, { headers: SB_HEADERS }),
      fetch(`${SUPABASE_URL}/rest/v1/city_surcharges?city_name=eq.${encoded}&limit=1`, { headers: SB_HEADERS }),
    ]).then(async ([r, s]) => {
      const rules = await r.json();
      const surcharges = await s.json();
      setFeeRules(Array.isArray(rules) ? rules : []);
      setSurcharge(Array.isArray(surcharges) && surcharges.length > 0 ? surcharges[0] : null);
      setLoadingRules(false);
    });
  }, [city]);

  const rulesForCategory = feeRules.filter(r => r.category === activeCategory);

  const isSunriseFlat = isSunrise && selectedRule?.calc_type === "flat";
  const needsCost     = isSunrise ? selectedRule?.calc_type === "percentage" : (selectedRule?.rate_percentage > 0);

  // Auto-calculate
  useEffect(() => {
    if (!selectedRule) { setResults(null); return; }
    if (needsCost && (!constructionCost || parseFloat(constructionCost) <= 0)) {
      if (!(selectedRule.calc_type === "flat" || (!selectedRule.rate_percentage && (selectedRule.flat_fee > 0 || selectedRule.base_fee > 0)))) {
        setResults(null); return;
      }
    }
    const res = isSunrise
      ? calculateSunriseFee(selectedRule, constructionCost, "")
      : calculateStandardFee(selectedRule, constructionCost, surcharge);
    setResults(res);
  }, [selectedRule, constructionCost, surcharge, isSunrise]);

  const cityFeeItems    = results?.breakdown.filter(i => !i.isState && i.amount > 0) || [];
  const stateFeeItems   = results?.breakdown.filter(i => i.isState && i.amount > 0) || [];

  return (
    <div className="min-h-screen bg-[#f7f9fb] pb-24">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-5">
        <div className="flex items-center gap-2 mb-4">
          <Link to="/" className="no-underline">
            <div className="flex items-center gap-1.5 text-[#003466] font-bold text-lg">
              <span className="font-extrabold text-xl no-underline" style={{ color: "#003466", fontFamily: "'Hanken Grotesk', sans-serif" }}>OpenPermit</span>
            </div>
          </Link>
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900">Permit Cost Estimator</h1>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
          Calculate estimated regulatory fees for your next renovation project across major municipalities.
        </p>
      </div>

      <div className="px-4 py-5 space-y-5">
        {/* City Selector */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Select City</p>
          <div className="relative">
            <button
              onClick={() => setShowCityPicker(!showCityPicker)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-800"
            >
              <span>{city || "Select a city..."}</span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showCityPicker ? "rotate-180" : ""}`} />
            </button>
            {showCityPicker && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                {citiesLoading ? (
                  <div className="p-4 text-center"><Loader2 className="w-4 h-4 animate-spin mx-auto text-[#003466]" /></div>
                ) : cities.map(c => (
                  <button key={c.name}
                    onClick={() => { setCity(c.name); setShowCityPicker(false); }}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-[#eaf1f8] border-b border-gray-50 last:border-0 transition-colors ${city === c.name ? "text-[#003466] font-semibold bg-[#eaf1f8]" : "text-gray-700"}`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          {CITY_NOTES[city] && (
            <div className="mt-3 flex items-start gap-2 bg-[#eaf1f8] rounded-xl px-3 py-2">
              <Info className="w-3.5 h-3.5 text-[#003466] mt-0.5 shrink-0" />
              <p className="text-xs text-[#003466]">{CITY_NOTES[city]}</p>
            </div>
          )}
        </div>

        {/* Permit Type Category Grid */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Permit Type</p>
          <div className="grid grid-cols-2 gap-2">
            {PERMIT_CATEGORIES.map(cat => {
              const hasRules = feeRules.some(r => r.category === cat.key);
              const isActive = activeCategory === cat.key;
              return (
                <button key={cat.key}
                  onClick={() => { setActiveCategory(cat.key); setSelectedRule(null); setResults(null); }}
                  disabled={!hasRules && !loadingRules}
                  className={`flex flex-col items-center gap-1.5 py-4 px-3 rounded-2xl border-2 transition-all text-center ${
                    isActive ? "border-[#003466] bg-[#003466] text-white shadow-sm" :
                    hasRules ? "border-gray-200 bg-white text-gray-700 hover:border-[#a9c5e0]" :
                    "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
                  }`}
                >
                  <span className="text-xl">{cat.icon}</span>
                  <span className="text-xs font-semibold">{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Permit list within category */}
          {!loadingRules && rulesForCategory.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Select Permit</p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {rulesForCategory.map(rule => (
                  <button key={rule.id}
                    onClick={() => { setSelectedRule(rule); setConstructionCost(""); setResults(null); }}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                      selectedRule?.id === rule.id
                        ? "border-[#003466] bg-[#eaf1f8]"
                        : "border-gray-200 bg-white hover:border-[#a9c5e0]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-semibold ${selectedRule?.id === rule.id ? "text-[#003466]" : "text-gray-800"}`}>
                        {rule.permit_name}
                      </p>
                      <span className="text-xs text-gray-400 shrink-0 ml-2">
                        {rule.rate_percentage > 0 ? `${rule.rate_percentage}%` :
                          rule.flat_fee > 0 ? `$${rule.flat_fee}` :
                          rule.base_fee > 0 ? `$${rule.base_fee}` : ""}
                      </span>
                    </div>
                    {rule.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{rule.description}</p>}
                  </button>
                ))}
              </div>
            </div>
          )}
          {loadingRules && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-[#003466]" />
            </div>
          )}
        </div>

        {/* Project Value Input */}
        {selectedRule && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Estimated Project Value ($)</p>
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
              <span className="px-4 py-3 bg-gray-50 text-gray-500 font-semibold border-r border-gray-200">$</span>
              <input
                type="number"
                value={constructionCost}
                onChange={e => setConstructionCost(e.target.value)}
                placeholder="50000"
                className="flex-1 px-4 py-3 text-sm focus:outline-none text-gray-800 font-semibold"
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {needsCost ? "Used to calculate percentage-based administrative and state fees." : "Optional — overrides minimum fee if higher."}
            </p>
          </div>
        )}

        {/* Fee Breakdown */}
        {results && (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Estimated Fee Breakdown</p>
              <div className="space-y-2">
                {cityFeeItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-700">{item.label}</span>
                    <span className="text-sm font-semibold text-gray-900">${item.amount.toFixed(2)}</span>
                  </div>
                ))}
                {stateFeeItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <span className="text-sm text-gray-700">{item.label}</span>
                      <p className="text-[10px] text-orange-500 font-medium">Mandatory state development tax</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">${item.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Grand Total */}
            <div className="bg-[#eaf1f8] rounded-2xl border border-[#cfe0f0] p-5">
              <p className="text-sm font-extrabold text-gray-900 mb-3">Estimated Total</p>
              <div className="space-y-1.5 mb-4">
                {results.cityFees > 0 && (
                  <div className="flex justify-between">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">City Fees</span>
                    <span className="text-sm font-bold text-gray-700">${results.cityFees.toFixed(2)}</span>
                  </div>
                )}
                {results.stateFees > 0 && (
                  <div className="flex justify-between">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">State Fees</span>
                    <span className="text-sm font-bold text-gray-700">${results.stateFees.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-[#cfe0f0] pt-2 mt-2 flex justify-between items-center">
                  <span className="text-sm font-extrabold text-gray-900">Grand Total</span>
                  <span className="text-2xl font-extrabold text-[#003466]">${results.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Save button */}
              <button
                onClick={() => {
                  const lines = [
                    `OpenPermit Fee Estimate`,
                    `City: ${city} | Permit: ${selectedRule?.permit_name}`,
                    ``,
                    ...results.breakdown.map(i => `  ${i.label}: $${i.amount.toFixed(2)}`),
                    ``,
                    `Grand Total: $${results.total.toFixed(2)}`,
                    ``,
                    `Estimate only. Final fees per ${city} Building Dept.`,
                  ].join("\n");
                  navigator.clipboard.writeText(lines).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm"
                style={{ background: "#003466" }}
              >
                {copied ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {copied ? "Copied to clipboard!" : "Save Estimate"}
              </button>

              <div className="flex items-start gap-2 mt-4">
                <Info className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                <p className="text-xs text-gray-400 leading-relaxed">
                  Estimates are based on published 2024 municipal fee schedules. Final costs may vary based on structural specifics or zoning variances.
                </p>
              </div>
            </div>

            {/* Download / Portal links */}
            {CITY_PORTAL_URLS[city] && (
              <a href={CITY_PORTAL_URLS[city]} target="_blank" rel="noopener noreferrer"
                className="block w-full text-center py-3.5 rounded-2xl border-2 border-gray-200 bg-white text-sm font-bold text-gray-700 hover:border-[#a9c5e0] hover:text-[#003466] transition-all no-underline">
                View City Fee Schedule PDF ↗
              </a>
            )}
          </>
        )}

        {/* Empty state */}
        {!selectedRule && !loadingRules && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <Calculator className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-500">Select a permit type above to see your fee estimate.</p>
          </div>
        )}
      </div>

    </div>
  );
}