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
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-8 pb-20 md:pb-8">
      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #0D2B5E 0%, #0F3575 100%)" }}>
          <Calculator className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-800 leading-tight">Permit Fee Calculator</h1>
          <p className="text-gray-500 text-xs sm:text-sm">Select your city and permit type to get an instant cost estimate based on official fee schedules.</p>
        </div>
      </div>

      {/* City Selector */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-700">City:</span>
          {singleCity ? (
            <span className="font-semibold text-blue-700">{city}</span>
          ) : (
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="w-44 sm:w-52 rounded-xl text-sm">
                <SelectValue placeholder="Choose city..." />
              </SelectTrigger>
              <SelectContent>
                {CITIES.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* City-specific note */}
        {CITY_NOTES[city] && (
          <div className="mt-3 flex items-start gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-700">{CITY_NOTES[city]}</p>
          </div>
        )}
      </div>

      {/* Permit Selector */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-1">Step 1: Select Permit Type</h3>
        <p className="text-sm text-gray-500 mb-4">Choose the permit that best matches your project</p>

        {loadingRules ? (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-400">Loading permits for {city}...</p>
          </div>
        ) : (
          <>
            <div className="relative mb-5">
              <Input
                placeholder="Search permits..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-4 rounded-xl"
              />
            </div>

            <div className="space-y-6">
              {CATEGORY_ORDER.map(cat => {
                if (!grouped[cat]) return null;
                const meta = CATEGORY_META[cat] || { label: cat, icon: "📋" };
                return (
                  <div key={cat}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">{meta.icon}</span>
                      <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">{meta.label}</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {grouped[cat].map(rule => (
                        <button
                          key={rule.id}
                          onClick={() => { setSelectedRule(rule); setConstructionCost(""); setResults(null); }}
                          className={`text-left px-4 py-3 rounded-xl border transition-all ${
                            selectedRule?.id === rule.id
                              ? "border-[#2c5282] bg-blue-50 shadow-sm"
                              : "border-gray-200 hover:border-blue-300 bg-white hover:bg-gray-50"
                          }`}
                        >
                          <p className={`text-sm font-medium ${selectedRule?.id === rule.id ? "text-[#2c5282]" : "text-gray-800"}`}>
                            {rule.permit_name}
                          </p>
                          {rule.description && (
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{rule.description}</p>
                          )}
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
          </>
        )}
      </div>

      {/* Step 2: Enter cost if needed */}
      {selectedRule && (
        <div className="mt-4 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-1">Step 2: {needsCost ? "Enter Project Cost" : "Ready to Calculate"}</h3>
          {needsCost ? (
            <>
              <p className="text-sm text-gray-500 mb-4">Enter the total estimated cost of labor and materials.</p>
              <div>
                <Label className="text-sm font-medium text-gray-700">Estimated Construction / Project Cost ($)</Label>
                <p className="text-xs text-gray-400 mt-0.5 mb-1.5">If unsure, get a contractor estimate first. Estimates are fine here.</p>
                <Input
                  type="number"
                  min="0"
                  placeholder="e.g. 50000"
                  value={constructionCost}
                  onChange={e => setConstructionCost(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500 mb-4">This is a flat-rate permit. No additional details needed.</p>
          )}
          <Button
            onClick={handleCalculate}
            disabled={!canCalculate}
            className="mt-5 w-full text-white rounded-xl h-12 text-base font-semibold shadow-md disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #0D2B5E 0%, #0F3575 100%)" }}
          >
            <Calculator className="w-5 h-5 mr-2" />
            Calculate Estimated Fee
          </Button>
        </div>
      )}

      {/* Results */}
      {results && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
            {/* Total Header */}
            <div className="px-6 py-7 text-center" style={{ background: "linear-gradient(135deg, #0D2B5E 0%, #0F3575 100%)" }}>
              <p className="text-blue-200 text-sm mb-1">Estimated Total Fee</p>
              <div className="flex items-center justify-center gap-2">
                <DollarSign className="w-8 h-8 text-yellow-300" />
                <span className="text-4xl font-extrabold text-white">{results.total.toFixed(2)}</span>
              </div>
              <p className="text-blue-200 text-xs mt-2">{selectedRule?.permit_name} · {city}</p>
            </div>

            {/* Breakdown */}
            <div className="p-6">
              <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" />
                Fee Breakdown
              </h4>
              <div className="divide-y divide-gray-100">
                {results.breakdown.map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-2.5">
                    <span className="text-sm text-gray-600">{item.label}</span>
                    <span className="text-sm font-semibold text-gray-800 ml-4">${item.amount.toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm font-bold text-gray-800">Estimated Total</span>
                  <span className="text-base font-extrabold text-blue-700">${results.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="mx-6 mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  This is an <strong>estimate only</strong>. Actual fees are set at time of permit issuance. Additional trade permits (electrical, plumbing, mechanical) may be required and will add to the total.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex flex-wrap gap-3">
              {CITY_PORTAL_URLS[city] && (
                <Button asChild className="flex-1 text-white rounded-xl" style={{ background: "linear-gradient(135deg, #0D2B5E 0%, #0F3575 100%)" }}>
                  <a href={CITY_PORTAL_URLS[city]} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Apply for Permit
                  </a>
                </Button>
              )}
              <Button variant="outline" onClick={handleReset} className="rounded-xl">
                <RotateCcw className="w-4 h-4 mr-2" />
                Calculate Another
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}