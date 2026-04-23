import React, { useState, useEffect } from "react";
import { Calculator, MapPin, Info, AlertTriangle, RotateCcw, FileText, DollarSign, ExternalLink } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const SUPABASE_URL = "https://gbknnjidqpmjrwlooluw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdia25uamlkcXBtanJ3bG9vbHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NTQzNDIsImV4cCI6MjA5MDIzMDM0Mn0.qwDACgXe3hesxBRQOzP53Hdc44z_UOka1_uYQScyi68";
const SB_HEADERS = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` };

const ALL_CITIES = ["Weston", "Coral Springs", "Fort Lauderdale", "Hollywood", "Cooper City"];

const CITY_NOTES = {
  "Weston": "NOC required if job value over $2,500 (A/C: $15,000). Fees effective October 1, 2025.",
  "Coral Springs": "NOC required if job value over $5,000. Fees effective FY2025.",
  "Hollywood": "Includes 2% city processing fee. NOC required if over $5,000 (A/C: $15,000). Express permits available Wednesday for select types.",
  "Fort Lauderdale": "All permits submitted digitally through LauderBuild. NOC required if over $2,500. Fees based on Broward County base rate.",
  "Cooper City": "All applications must be notarized. NOC required if over $2,500. Hold Harmless Agreement may be required for drainage easements.",
};

const CITY_PORTAL_URLS = {
  "Weston": "https://www.westonfl.org/Permits",
  "Coral Springs": "https://www.coralsprings.gov/Government/Departments/Building/Online-Permitting-eTrakit/Apply-for-Online-Permit",
  "Hollywood": "https://aca-prod.accela.com/HOLLYWOOD/Default.aspx",
  "Fort Lauderdale": "https://lauderbuild.fortlauderdale.gov/",
  "Cooper City": "https://coopercity.gov/?SEC=AD7C348E-C110-425A-B91C-2CA5769BF937",
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

function calculateFee(rule, constructionCost, surcharge) {
  const cost = parseFloat(constructionCost) || 0;
  const breakdown = [];

  // Base permit fee
  let permitFee = 0;
  if (rule.calc_type === "flat_plus_pct") {
    const pctFee = cost * ((rule.rate_percentage || 0) / 100);
    permitFee = Math.max(rule.base_fee || 0, pctFee);
  } else if (rule.calc_type === "flat") {
    permitFee = rule.flat_fee || rule.base_fee || 0;
  } else {
    permitFee = rule.flat_fee || rule.base_fee || 0;
  }
  breakdown.push({ label: "Base Permit Fee", amount: permitFee });

  // Technology & Admin Fee (from rule row)
  const techFee = rule.technology_admin_fee || 0;
  if (techFee > 0) {
    breakdown.push({ label: "Technology & Admin Fee", amount: techFee });
  }

  // State surcharges (from city_surcharges table)
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

export default function FeeCalculator() {
  const urlParams = new URLSearchParams(window.location.search);
  const urlCity = urlParams.get("city") || "";
  const urlCities = urlParams.get("cities");
  const CITIES = urlCity ? [urlCity] : (urlCities ? urlCities.split(",").map(s => s.trim()) : ALL_CITIES);
  const singleCity = CITIES.length === 1;

  const [city, setCity] = useState(urlCity || sessionStorage.getItem("selectedCity") || "Weston");
  const [feeRules, setFeeRules] = useState([]);
  const [surcharge, setSurcharge] = useState(null);
  const [loadingRules, setLoadingRules] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [constructionCost, setConstructionCost] = useState("");
  const [results, setResults] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (city) sessionStorage.setItem("selectedCity", city);
    setSelectedRule(null);
    setConstructionCost("");
    setResults(null);
    setSearch("");
    loadCityData(city);
  }, [city]);

  const loadCityData = async (cityName) => {
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

  const needsCost = selectedRule && selectedRule.calc_type === "flat_plus_pct" && (selectedRule.rate_percentage > 0);
  const canCalculate = selectedRule && (!needsCost || (constructionCost && parseFloat(constructionCost) > 0));

  const handleCalculate = () => {
    if (!selectedRule) return;
    const cost = parseFloat(constructionCost) || 0;
    const result = calculateFee(selectedRule, cost, surcharge);
    setResults(result);
  };

  const handleReset = () => {
    setSelectedRule(null);
    setConstructionCost("");
    setResults(null);
  };

  // Group permits by category
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
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="px-4 md:px-8 pt-8 pb-6" style={{ background: "linear-gradient(135deg, #0D2B5E 0%, #0F3575 100%)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="md:flex md:items-end md:justify-between gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Permit Fee Calculator</h1>
              <p className="text-blue-200 text-sm">Estimate your project costs by adding permit types based on your scope of work.</p>
            </div>
            {/* Desktop city selector in header */}
            <div className="hidden md:block w-64 shrink-0">
              {singleCity ? (
                <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-4 h-11">
                  <MapPin className="w-4 h-4 text-blue-300" />
                  <span className="text-white text-sm font-medium">{city}</span>
                </div>
              ) : (
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger className="w-full h-11 rounded-xl text-sm bg-white border-0 shadow-md">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <SelectValue placeholder="Select Jurisdiction..." />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </div>
      </div>

    <div className="max-w-6xl mx-auto px-4 md:px-8 py-5 pb-24 md:pb-8">
      {/* Mobile city selector */}
      <div className="md:hidden mb-4">
        {singleCity ? (
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 h-11 shadow-sm">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span className="text-gray-800 text-sm font-medium">{city}</span>
          </div>
        ) : (
          <Select value={city} onValueChange={setCity}>
            <SelectTrigger className="w-full h-11 rounded-xl text-sm bg-white">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <SelectValue placeholder="Select city..." />
              </div>
            </SelectTrigger>
            <SelectContent>
              {CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Desktop 3-col layout wrapper */}
      <div className="md:flex md:gap-6 md:items-start">
      {/* Main permit list column */}
      <div className="flex-1 min-w-0">
        {/* City note */}
        {CITY_NOTES[city] && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100 mb-4">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-700">{CITY_NOTES[city]}</p>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-5">
          <Input
            placeholder="Search for permit types (e.g. 'Roofing', 'HVAC')..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-4 rounded-xl bg-white"
          />
        </div>

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

        {/* Permit list by category */}
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
                    {grouped[cat].map(rule => (
                      <button
                        key={rule.id}
                        onClick={() => { setSelectedRule(rule); setConstructionCost(""); setResults(null); }}
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
                        </div>
                        <div className="flex items-center justify-between">
                          {(rule.flat_fee || rule.base_fee) && (
                            <div>
                              <p className="text-xs text-gray-400 uppercase tracking-wider">Base Fee</p>
                              <p className="text-sm font-bold text-gray-900">
                                ${(rule.flat_fee || rule.base_fee || 0).toLocaleString()}
                                {rule.calc_type === "flat_plus_pct" && rule.rate_percentage > 0 ? ` + ${rule.rate_percentage}%` : ""}
                              </p>
                            </div>
                          )}
                          <span className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            selectedRule?.id === rule.id
                              ? "bg-blue-700 text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700"
                          }`}>
                            {selectedRule?.id === rule.id ? "Selected" : "Select"}
                          </span>
                        </div>
                      </button>
                    ))}
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

      {/* Right sidebar — Estimate panel (desktop only inline, mobile below) */}
      <div className="md:w-72 md:shrink-0 mt-5 md:mt-0">
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
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">{(CATEGORY_META[selectedRule.category] || {}).label || selectedRule.category}</p>
                    <p className="font-semibold text-gray-900 text-sm">{selectedRule.permit_name}</p>
                  </div>
                  <button onClick={handleReset} className="text-gray-300 hover:text-gray-500 p-0.5 shrink-0">
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {needsCost && (
                <div className="mb-4">
                  <Label className="text-xs font-medium text-gray-700 mb-1 block">Project Cost ($)</Label>
                  <Input
                    type="number" min="0" placeholder="e.g. 50000"
                    value={constructionCost}
                    onChange={e => setConstructionCost(e.target.value)}
                    className="rounded-xl text-sm"
                  />
                </div>
              )}

              {results && (
                <div className="mb-4 divide-y divide-gray-100">
                  {results.breakdown.map((item, i) => (
                    <div key={i} className="flex justify-between py-2">
                      <span className="text-xs text-gray-600">{item.label}</span>
                      <span className="text-xs font-semibold text-gray-800">${item.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              <Button
                onClick={handleCalculate}
                disabled={!canCalculate}
                className="w-full text-white rounded-xl h-10 text-sm font-semibold disabled:opacity-50 mb-3"
                style={{ background: "linear-gradient(135deg, #0D2B5E 0%, #0F3575 100%)" }}
              >
                <Calculator className="w-4 h-4 mr-1.5" />
                {results ? "Recalculate" : "Calculate Fee"}
              </Button>

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
                  <p className="text-xs text-gray-400 text-center leading-snug">Fees are estimates only and subject to departmental verification.</p>
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

      </div>{/* end desktop layout wrapper */}
    </div>
    </div>
  );
}