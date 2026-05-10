import React, { useState, useEffect } from "react";
import { Calculator, MapPin, Info, RotateCcw, ExternalLink, Phone, Mail, Clock, Loader2 } from "lucide-react";
import { useCities, cityHasFeeData, cityUsesBrowardCounty } from "@/hooks/useCities";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const SUPABASE_URL = "https://gbknnjidqpmjrwlooluw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdia25uamlkcXBtanJ3bG9vbHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NTQzNDIsImV4cCI6MjA5MDIzMDM0Mn0.qwDACgXe3hesxBRQOzP53Hdc44z_UOka1_uYQScyi68";
const SB_HEADERS = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` };



// Sunrise surcharge calculation helper
function calcSunriseSurcharges(permitFee, constructionValue) {
  const bcaib = Math.max(permitFee * 0.015, 2.00);
  const fbc = Math.max(permitFee * 0.010, 2.00);
  const bra = Math.max((constructionValue / 1000) * 0.52, 2.00);
  return { bcaib, fbc, bra };
}

const CITY_NOTES = {
  "Weston": "NOC required if job value over $2,500 (A/C: $15,000). Fees effective October 2025.",
  "Coral Springs": "NOC required if job value over $5,000 (A/C: $15,000).",
  "Hollywood": "NOC required if job value over $5,000 (A/C: $15,000). Process fee: 25% of job cost charged separately. Express Review: Wednesdays.",
  "Fort Lauderdale": "NOC required if job value over $2,500 (A/C: $15,000). Digital submissions only via LauderBuild.",
  "Cooper City": "NOC required if job value over $2,500 (A/C: $15,000). All applications must be NOTARIZED. Hold Harmless Agreement required.",
  "Sunrise": "NOC required if job value over $2,500 (A/C: $7,500). Fees effective October 1, 2024.",
};

const CITY_FEE_SUMMARY = {
  "Weston": "Flat 1.5% rate on all permit types. Technology fee: $75.",
  "Coral Springs": "Variable rates by permit type: 0.14%–5.30%. Lowest minimum fee in Broward ($54.55).",
  "Fort Lauderdale": "1.85% rate. Digital submissions only via LauderBuild. Walk-Thru available for small projects.",
  "Hollywood": "2.20% tiered rate + separate 25% process fee. Express Review every Wednesday.",
  "Cooper City": "1.85% rate. ALL applications must be notarized. Hold Harmless Agreement required.",
  "Sunrise": "Fixed flat fees per permit type. No percentage calculation for most residential permits.",
};

const CITY_ACCENT = {
  "Weston":          { bg: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-800",   dot: "bg-blue-500" },
  "Coral Springs":   { bg: "bg-green-50",  border: "border-green-200",  text: "text-green-800",  dot: "bg-green-500" },
  "Fort Lauderdale": { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-800", dot: "bg-purple-500" },
  "Hollywood":       { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-800", dot: "bg-orange-500" },
  "Cooper City":     { bg: "bg-red-50",    border: "border-red-200",    text: "text-red-800",    dot: "bg-red-500" },
  "Sunrise":         { bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-800",  dot: "bg-amber-500" },
};

const CITY_PORTAL_URLS = {
  "Weston": "https://www.westonfl.org/Permits",
  "Coral Springs": "https://www.coralsprings.gov/Government/Departments/Building/Online-Permitting-eTrakit/Apply-for-Online-Permit",
  "Hollywood": "https://aca-prod.accela.com/HOLLYWOOD/Default.aspx",
  "Fort Lauderdale": "https://lauderbuild.fortlauderdale.gov/",
  "Cooper City": "https://coopercity.gov/?SEC=AD7C348E-C110-425A-B91C-2CA5769BF937",
  "Sunrise": "https://sunrisefl.gov/openforbusiness",
};

const CATEGORY_ORDER = ["building", "electrical", "plumbing", "fire", "certificate", "planning", "engineering", "additional"];
const CATEGORY_META = {
  building:    { label: "Building Permits",      icon: "🏗️" },
  electrical:  { label: "Electrical Permits",    icon: "⚡" },
  plumbing:    { label: "Plumbing Permits",       icon: "🔧" },
  fire:        { label: "Fire Code Services",     icon: "🔥" },
  certificate: { label: "Certificates",           icon: "📜" },
  planning:    { label: "Planning & Zoning",      icon: "📐" },
  engineering: { label: "Engineering Permits",    icon: "🛣️" },
  additional:  { label: "Additional Services",    icon: "➕" },
};

// ── Standard fee calculation (Weston, Coral Springs, Ft Laud, Hollywood, Cooper City) ──
function calculateStandardFee(rule, constructionCost, surcharge) {
  const cost = parseFloat(constructionCost) || 0;
  const breakdown = [];

  let permitFee = 0;
  if (rule.rate_percentage > 0) {
    // base_fee is the minimum; if pct of job value exceeds it, use that
    const pctFee = cost * (rule.rate_percentage / 100);
    permitFee = Math.max(rule.base_fee || 0, pctFee);
  } else {
    // flat fee — base_fee is the full fee
    permitFee = rule.base_fee || 0;
  }
  breakdown.push({ label: "Base Permit Fee", amount: permitFee });

  const techFee = rule.technology_admin_fee || 0;
  if (techFee > 0) breakdown.push({ label: "Technology & Admin Fee", amount: techFee });

  let dcaFee = 0, dbprFee = 0, eduFee = 0;
  if (surcharge) {
    if (surcharge.dca_rate) {
      dcaFee = permitFee * surcharge.dca_rate;
      breakdown.push({ label: `State DCA Surcharge (${(surcharge.dca_rate * 100).toFixed(1)}%)`, amount: dcaFee });
    }
    if (surcharge.dbpr_rate) {
      dbprFee = permitFee * surcharge.dbpr_rate;
      breakdown.push({ label: `State DBPR Surcharge (${(surcharge.dbpr_rate * 100).toFixed(1)}%)`, amount: dbprFee });
    }
    if (surcharge.educational_rate && cost > 0) {
      eduFee = cost * surcharge.educational_rate;
      breakdown.push({ label: "Educational & Training Fee", amount: eduFee });
    }
  }

  const total = permitFee + techFee + dcaFee + dbprFee + eduFee;
  return { total, breakdown };
}

// ── Sunrise fee calculation ──
function calculateSunriseFee(rule, constructionCost, roofSqFt) {
  const cost = parseFloat(constructionCost) || 0;
  const breakdown = [];

  let permitFee = 0;
  const isPercentage = rule.calc_type === "percentage";

  if (isPercentage) {
    const calculated = cost * ((rule.rate_percentage || 4.40) / 100);
    const minFee = 208.46;
    permitFee = Math.max(calculated, minFee);
    breakdown.push({ label: `Permit Fee (${rule.rate_percentage || 4.40}% of construction value)`, amount: permitFee });
    if (calculated < minFee) {
      breakdown.push({ label: "  (Minimum fee applied)", amount: 0 });
    }
  } else {
    // flat
    permitFee = rule.base_fee || 0;
    breakdown.push({ label: "Permit Fee", amount: permitFee });

    // Roof overage: $101.56 per 1,000 SF over 3,000 SF
    const sqft = parseFloat(roofSqFt) || 0;
    if (rule.permit_name?.toLowerCase().includes("roof") && sqft > 3000) {
      const overageSqft = sqft - 3000;
      const overage = Math.ceil(overageSqft / 1000) * 101.56;
      breakdown.push({ label: `Roof overage (${Math.ceil(overageSqft / 1000)} × $101.56/1,000 SF)`, amount: overage });
      permitFee += overage;
    }
  }

  const techFee = rule.technology_admin_fee || 0;
  if (techFee > 0) breakdown.push({ label: "Technology & Admin Fee", amount: techFee });

  // BRA: use constructionValue for percentage permits, base_fee for flat permits
  const braBase = isPercentage ? cost : (rule.base_fee || 0);
  const { bcaib: bcaibFee, fbc: fbcFee, bra: braFee } = calcSunriseSurcharges(permitFee, braBase);
  breakdown.push({ label: "BRA Surcharge ($0.52/$1,000)", amount: braFee });
  breakdown.push({ label: "BCAIB Surcharge (1.5%)", amount: bcaibFee });
  breakdown.push({ label: "FBC Surcharge (1.0%)", amount: fbcFee });

  const total = permitFee + techFee + braFee + bcaibFee + fbcFee;
  return { total, breakdown };
}

function SunriseCityInfo() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-4">
      <div className="px-4 py-3 border-b border-gray-100" style={{ background: "linear-gradient(135deg, #0D2B5E, #0F3575)" }}>
        <p className="text-white font-bold text-sm">Sunrise Building Department</p>
      </div>
      <div className="p-4 space-y-2.5 text-sm">
        <a href="tel:9545722354" className="flex items-center gap-2 text-gray-700 hover:text-blue-600">
          <Phone className="w-4 h-4 text-blue-500 shrink-0" />
          (954) 572-2354
        </a>
        <a href="mailto:askbuilding@sunrisefl.gov" className="flex items-center gap-2 text-gray-700 hover:text-blue-600 break-all">
          <Mail className="w-4 h-4 text-blue-500 shrink-0" />
          askbuilding@sunrisefl.gov
        </a>
        <div className="flex items-start gap-2 text-gray-600">
          <Clock className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs">Mon–Thu: 8:00 AM – 5:00 PM</p>
            <p className="text-xs">Fri: 8:00 AM – 4:00 PM</p>
            <p className="text-xs font-semibold text-blue-700 mt-1">📋 Professional Day: Wed 8AM–Noon (walk-in plan review)</p>
          </div>
        </div>
        <a href="https://sunrisefl.gov/openforbusiness" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 text-blue-600 hover:underline text-xs font-medium">
          <ExternalLink className="w-3.5 h-3.5" />
          sunrisefl.gov/openforbusiness
        </a>
      </div>
    </div>
  );
}

export default function FeeCalculator() {
  const urlParams = new URLSearchParams(window.location.search);
  const urlCity = urlParams.get("city") || "";
  const singleCity = !!urlCity;

  const { cities, loading: citiesLoading } = useCities();
  const [city, setCity] = useState(urlCity || sessionStorage.getItem("selectedCity") || "Weston");

  // Find the current city object from the cities list
  const cityObj = cities.find(c => c.name === city) || null;
  const hasFeeData = cityHasFeeData(cityObj);
  const usesBroward = cityUsesBrowardCounty(cityObj);
  const [feeRules, setFeeRules] = useState([]);
  const [surcharge, setSurcharge] = useState(null);
  const [loadingRules, setLoadingRules] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [constructionCost, setConstructionCost] = useState("");
  const [roofSqFt, setRoofSqFt] = useState("");
  const [results, setResults] = useState(null);
  const [search, setSearch] = useState("");

  const isSunrise = city === "Sunrise";

  useEffect(() => {
    if (city) sessionStorage.setItem("selectedCity", city);
    setSelectedRule(null);
    setConstructionCost("");
    setRoofSqFt("");
    setResults(null);
    setSearch("");
    loadCityData(city, cities.find(c => c.name === city) || null);
  }, [city]);

  const loadCityData = async (cityName, cityRecord) => {
    // Skip DB fetch for cities without fee data
    if (cityRecord && !cityHasFeeData(cityRecord)) {
      setFeeRules([]);
      setSurcharge(null);
      setLoadingRules(false);
      return;
    }
    setLoadingRules(true);
    const encoded = encodeURIComponent(cityName);
    const [rulesRes, surchargeRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/fee_rules?city_name=eq.${encoded}&order=sort_order.asc`, { headers: SB_HEADERS }),
      fetch(`${SUPABASE_URL}/rest/v1/city_surcharges?city_name=eq.${encoded}&limit=1`, { headers: SB_HEADERS }),
    ]);
    const rules = await rulesRes.json();
    const surcharges = await surchargeRes.json();
    setFeeRules(Array.isArray(rules) ? rules : []);
    setSurcharge(Array.isArray(surcharges) && surcharges.length > 0 ? surcharges[0] : null);
    setLoadingRules(false);
  };

  // For Sunrise: flat fees are immediately calculable; percentage needs cost input
  const isSunriseFlat = isSunrise && selectedRule?.calc_type === "flat";
  const isSunrisePct = isSunrise && selectedRule?.calc_type === "percentage";
  const isRoofPermit = isSunriseFlat && selectedRule?.permit_name?.toLowerCase().includes("roof");

  const needsCost = isSunrise
    ? isSunrisePct
    : (selectedRule?.rate_percentage > 0);

  const canCalculate = selectedRule && (isSunriseFlat || (needsCost ? (constructionCost && parseFloat(constructionCost) > 0) : true));

  const handleCalculate = () => {
    if (!selectedRule) return;
    let result;
    if (isSunrise) {
      result = calculateSunriseFee(selectedRule, constructionCost, roofSqFt);
    } else {
      result = calculateStandardFee(selectedRule, constructionCost, surcharge);
    }
    setResults(result);
  };

  const handleReset = () => {
    setSelectedRule(null);
    setConstructionCost("");
    setRoofSqFt("");
    setResults(null);
  };

  // Auto-calculate for Sunrise flat fees when selected
  useEffect(() => {
    if (isSunriseFlat && selectedRule) {
      const result = calculateSunriseFee(selectedRule, "", "");
      setResults(result);
    }
  }, [selectedRule, isSunriseFlat]);

  // Real-time calculation for standard (non-Sunrise) permits as user types
  useEffect(() => {
    if (!isSunrise && selectedRule) {
      if (selectedRule.rate_percentage > 0 && (!constructionCost || parseFloat(constructionCost) <= 0)) {
        setResults(null);
        return;
      }
      const result = calculateStandardFee(selectedRule, constructionCost, surcharge);
      setResults(result);
    }
  }, [constructionCost, selectedRule, surcharge, isSunrise]);

  const filtered = feeRules.filter(r =>
    !search || r.permit_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.description?.toLowerCase().includes(search.toLowerCase())
  );
  const grouped = {};
  filtered.forEach(r => {
    const cat = r.category || "additional";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(r);
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f9f9fc" }}>
      {/* Hero Header */}
      <div className="px-5 pt-8 pb-7" style={{ background: "#00020c" }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.45)" }}>Fee Calculator</p>
              <h1 className="font-bold text-white leading-tight mb-2" style={{ fontSize: "clamp(22px, 4vw, 30px)" }}>Estimate Permit Costs</h1>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.55)", maxWidth: 400 }}>Select a permit type to get a detailed fee breakdown before you spend a dollar.</p>
            </div>
            <div className="shrink-0 mt-1">
              {singleCity ? (
                <div className="flex items-center gap-2 rounded-xl px-4 h-11" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>
                  <MapPin className="w-4 h-4" style={{ color: "rgba(255,255,255,0.5)" }} />
                  <span className="text-white text-sm font-medium">{city}</span>
                </div>
              ) : (
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger className="w-52 h-11 rounded-xl text-sm bg-white border-0 shadow-md">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      {citiesLoading ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" /> : <SelectValue placeholder="Select city..." />}
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-5 pb-24 md:pb-8">
        {/* Mobile city selector — hidden on desktop since header has it */}
        <div className="md:hidden mb-4">
          {!singleCity && (
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="w-full h-11 rounded-xl text-sm bg-white border-gray-200">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  {citiesLoading ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" /> : <SelectValue placeholder="Select city..." />}
                </div>
              </SelectTrigger>
              <SelectContent>
                {cities.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="md:flex md:gap-6 md:items-start">
          {/* Main permit list column */}
          <div className="flex-1 min-w-0">
            {/* City accent badge + NOC note */}
            {(() => {
              const accent = CITY_ACCENT[city] || CITY_ACCENT["Weston"];
              return (
                <div className="mb-4 space-y-2">
                  {/* City badge */}
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${accent.bg} ${accent.border} ${accent.text}`}>
                    <span className={`w-2 h-2 rounded-full ${accent.dot}`} />
                    {city} Fee Schedule
                  </div>
                  {/* NOC banner */}
                  {CITY_NOTES[city] && (
                    <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-blue-700">{CITY_NOTES[city]}</p>
                    </div>
                  )}
                  {/* Fee structure summary */}
                  {CITY_FEE_SUMMARY[city] && (
                    <div className={`flex items-start gap-2 p-3 rounded-xl border ${accent.bg} ${accent.border}`}>
                      <Calculator className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${accent.text}`} />
                      <p className={`text-xs font-medium ${accent.text}`}>{CITY_FEE_SUMMARY[city]}</p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Coming Soon / Broward County message for cities without fee data */}
            {cityObj && !hasFeeData && !loadingRules && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3">
                  <Info className="w-6 h-6 text-blue-500" />
                </div>
                {usesBroward ? (
                  <>
                    <p className="font-semibold text-gray-800 mb-1">{city} uses Broward County Building Division</p>
                    <p className="text-sm text-gray-500 leading-relaxed mb-3">
                      Permitting for {city} is handled directly by Broward County. Contact the Broward County Building Division for fee schedules and permit applications.
                    </p>
                    <a href="tel:9547655200" className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm hover:underline">
                      <Phone className="w-4 h-4" /> (954) 765-5200
                    </a>
                    <p className="text-xs text-gray-400 mt-1">
                      <a href="https://www.broward.org/Building" target="_blank" rel="noopener noreferrer" className="hover:underline">broward.org/Building</a>
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-gray-800 mb-1">Fee schedule coming soon for {city}</p>
                    <p className="text-sm text-gray-500 leading-relaxed mb-3">
                      For current permit fees, contact the {city} Building Department directly.
                    </p>
                    {cityObj.building_department_phone && (
                      <a href={`tel:${cityObj.building_department_phone.replace(/\D/g, "")}`} className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm hover:underline">
                        <Phone className="w-4 h-4" /> {cityObj.building_department_phone}
                      </a>
                    )}
                    {cityObj.portal_url && (
                      <p className="text-xs text-gray-400 mt-1">
                        <a href={cityObj.portal_url} target="_blank" rel="noopener noreferrer" className="hover:underline">{cityObj.portal_url.replace(/^https?:\/\//, "")}</a>
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Search — only show if city has fee data */}
            {hasFeeData && (
            <div className="relative mb-5">
              <Input
                placeholder="Search for permit types (e.g. 'Roofing', 'HVAC')..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-4 rounded-xl bg-white"
              />
            </div>
            )}

            {/* Category filter pills */}
            {!loadingRules && Object.keys(grouped).length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {CATEGORY_ORDER.filter(c => grouped[c]).map(cat => {
                  const meta = CATEGORY_META[cat] || { label: cat, icon: "📋" };
                  return (
                    <span key={cat} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700">
                      {meta.icon} {meta.label.replace(" Permits", "").replace(" Code Services", "")}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Permit list */}
            {loadingRules ? (
              <div className="text-center py-12">
                <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-400">Loading permits for {city}...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {CATEGORY_ORDER.map(cat => {
                  if (!grouped[cat]) return null;
                  const meta = CATEGORY_META[cat] || { label: cat, icon: "📋" };
                  return (
                    <div key={cat}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-base">{meta.icon}</span>
                        <h4 className="text-sm font-bold text-gray-700">{meta.label}</h4>
                      </div>
                      <div className="grid md:grid-cols-2 gap-3">
                        {grouped[cat].map(rule => {
                          const isSunriseFlat = isSunrise && rule.calc_type === "flat";
                          const isSunrisePctCard = isSunrise && rule.calc_type === "percentage";
                          return (
                            <button
                              key={rule.id}
                              onClick={() => { setSelectedRule(rule); setConstructionCost(""); setRoofSqFt(""); setResults(null); }}
                              className={`text-left px-4 py-4 rounded-2xl border transition-all flex flex-col justify-between ${
                                selectedRule?.id === rule.id
                                  ? "border-blue-500 bg-blue-50 shadow-sm"
                                  : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm"
                              }`}
                            >
                              <div className="mb-3">
                                <p className={`text-sm font-semibold ${selectedRule?.id === rule.id ? "text-blue-800" : "text-gray-800"}`}>
                                  {rule.permit_name}
                                </p>
                                {rule.description && (
                                  <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{rule.description}</p>
                                )}
                                {isSunriseFlat && rule.permit_name?.toLowerCase().includes("roof") && (
                                  <p className="text-xs text-amber-600 mt-1">+ $101.56/1,000 SF over 3,000 SF</p>
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                <div>
                                  {isSunriseFlat && (
                                     <>
                                       <p className="text-xs text-gray-400 uppercase tracking-wider">Flat Fee</p>
                                       <p className="text-sm font-bold text-gray-900">${(rule.base_fee || 0).toFixed(2)}</p>
                                     </>
                                   )}
                                  {isSunrisePctCard && (
                                    <>
                                      <p className="text-xs text-gray-400 uppercase tracking-wider">Rate</p>
                                      <p className="text-sm font-bold text-gray-900">{rule.rate_percentage || 4.40}% of job value</p>
                                    </>
                                  )}
                                  {!isSunrise && (
                                    <>
                                      {(rule.rate_percentage > 0) ? (
                                        <>
                                          <p className="text-xs text-gray-400 uppercase tracking-wider">Base Fee</p>
                                          <p className="text-sm font-bold text-gray-900">${(rule.base_fee || 0).toLocaleString()} + {rule.rate_percentage}%</p>
                                        </>
                                      ) : (
                                        <>
                                          <p className="text-xs text-gray-400 uppercase tracking-wider">Flat Fee</p>
                                          <p className="text-sm font-bold text-gray-900">${(rule.base_fee || 0).toLocaleString()}</p>
                                        </>
                                      )}
                                    </>
                                  )}
                                </div>
                                <span className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                  selectedRule?.id === rule.id
                                    ? "bg-blue-700 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700"
                                }`}>
                                  {selectedRule?.id === rule.id ? "Selected" : "Select"}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {Object.keys(grouped).length === 0 && !loadingRules && (
                  <p className="text-center text-gray-400 py-6">No permits found{search ? ` matching "${search}"` : " for this city"}.</p>
                )}
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="md:w-72 md:shrink-0 mt-5 md:mt-0">
            {/* Sunrise city info */}
            {isSunrise && <SunriseCityInfo />}

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden sticky top-4">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-gray-800 text-sm">Estimate</h3>
              </div>

              {!selectedRule ? (
                <div className="px-4 py-8 text-center text-gray-400">
                  <Calculator className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                  <p className="text-sm">Select a permit type to calculate your estimated fee.</p>
                </div>
              ) : (
                <div className="p-4">
                  <div className="bg-gray-50 rounded-xl p-3 mb-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
                          {(CATEGORY_META[selectedRule.category] || {}).label || selectedRule.category}
                        </p>
                        <p className="font-semibold text-gray-900 text-sm">{selectedRule.permit_name}</p>
                      </div>
                      <button onClick={handleReset} className="text-gray-300 hover:text-gray-500 p-0.5 shrink-0">
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Construction cost input */}
                  {needsCost && (
                    <div className="mb-4">
                      <Label className="text-xs font-medium text-gray-700 mb-1.5 block">Enter Job / Construction Value ($)</Label>
                      <Input
                        type="number" min="0" placeholder="e.g. 25000"
                        value={constructionCost}
                        onChange={e => setConstructionCost(e.target.value)}
                        className="rounded-xl text-sm"
                        autoFocus
                      />
                      {constructionCost && parseFloat(constructionCost) > 0 && selectedRule?.rate_percentage > 0 && (() => {
                        const jobVal = parseFloat(constructionCost);
                        const baseFee = parseFloat(selectedRule.base_fee) || 150;
                        const rate = parseFloat(selectedRule.rate_percentage) || 1.5;
                        const pctFee = jobVal * rate / 100;
                        if (pctFee < baseFee) {
                          return (
                            <p className="text-xs text-amber-600 mt-1.5 font-medium">
                              Minimum permit fee of ${baseFee.toFixed(2)} applies.
                            </p>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}

                  {/* Roof SF input (Sunrise roof permits) */}
                  {isRoofPermit && (
                    <div className="mb-4">
                      <Label className="text-xs font-medium text-gray-700 mb-1 block">Roof Area (SF) — optional</Label>
                      <Input
                        type="number" min="0" placeholder="e.g. 2500"
                        value={roofSqFt}
                        onChange={e => { setRoofSqFt(e.target.value); setResults(null); }}
                        className="rounded-xl text-sm"
                      />
                      <p className="text-xs text-gray-400 mt-1">+$101.56 per 1,000 SF over 3,000 SF</p>
                    </div>
                  )}

                  {results && (
                    <div className="mb-4 divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                      {results.breakdown.filter(i => i.amount > 0 || i.label.startsWith("  ")).map((item, i) => (
                        <div key={i} className={`flex justify-between px-3 py-2 ${item.label.startsWith("  ") ? "opacity-50 bg-gray-50" : "bg-white"}`}>
                          <span className="text-xs text-gray-600">{item.label}</span>
                          {item.amount > 0 && <span className="text-xs font-semibold text-gray-800">${item.amount.toFixed(2)}</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Show calculate button only for Sunrise (non-real-time) */}
                  {isSunrise && (!isSunriseFlat || isRoofPermit) && (
                    <Button
                      onClick={handleCalculate}
                      disabled={!canCalculate}
                      className="w-full text-white rounded-xl h-10 text-sm font-semibold disabled:opacity-50 mb-3"
                      style={{ background: "linear-gradient(135deg, #0D2B5E 0%, #0F3575 100%)" }}
                    >
                      <Calculator className="w-4 h-4 mr-1.5" />
                      {results ? "Recalculate" : "Calculate Fee"}
                    </Button>
                  )}

                  {results && (
                    <>
                      <div className="rounded-xl p-3 text-center mb-3" style={{ background: "linear-gradient(135deg, #0D2B5E 0%, #0F3575 100%)" }}>
                        <p className="text-blue-200 text-xs mb-0.5">Estimated Total</p>
                        <p className="text-2xl font-extrabold text-white">${results.total.toFixed(2)}</p>
                      </div>
                      {CITY_PORTAL_URLS[city] && (
                        <Button asChild className="w-full text-white rounded-xl h-10 text-sm mb-2" style={{ background: "#1E4D99" }}>
                          <a href={CITY_PORTAL_URLS[city]} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Apply for Permit
                          </a>
                        </Button>
                      )}
                      <p className="text-xs text-gray-400 text-center leading-snug">This is an estimate only. Final fees determined at permit issuance.</p>
                    </>
                  )}

                  {!results && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 mt-2">
                      <p className="text-xs text-amber-700">Fees are estimates based on official schedules. Professional review may result in adjustments.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}