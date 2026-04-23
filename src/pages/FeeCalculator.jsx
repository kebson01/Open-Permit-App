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
      <div className="px-4 pt-8 pb-6" style={{ background: "linear-gradient(135deg, #0D2B5E 0%, #0F3575 100%)" }}>
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-1">Permit Fee Calculator</h1>
          <p className="text-blue-200 text-sm mb-5">Estimate your project costs instantly. Select your city and permit type to view current fee schedules.</p>

          {/* City selector */}
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
                {CITIES.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

    <div className="max-w-2xl mx-auto px-4 py-5 pb-24 md:pb-8">
      {/* City note */}
      {CITY_NOTES[city] && (
        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100 mb-5">
          <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-700">{CITY_NOTES[city]}</p>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Input
          placeholder="Search permit types..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-4 rounded-xl bg-white"
        />
      </div>

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
                <div className="space-y-2">
                  {grouped[cat].map(rule => (
                    <button
                      key={rule.id}
                      onClick={() => { setSelectedRule(rule); setConstructionCost(""); setResults(null); }}
                      className={`w-full text-left px-4 py-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        selectedRule?.id === rule.id
                          ? "border-blue-500 bg-blue-50 shadow-sm"
                          : "border-gray-200 bg-white hover:border-blue-300"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-semibold ${selectedRule?.id === rule.id ? "text-blue-800" : "text-gray-800"}`}>
                          {rule.permit_name}
                        </p>
                        {rule.description && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{rule.description}</p>
                        )}
                        {(rule.flat_fee || rule.base_fee) && (
                          <p className="text-xs font-semibold text-blue-700 mt-1">
                            Est. fee: ${(rule.flat_fee || rule.base_fee || 0).toLocaleString()}
                            {rule.calc_type === "flat_plus_pct" && rule.rate_percentage > 0 ? ` + ${rule.rate_percentage}%` : ""}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); setSelectedRule(rule); setConstructionCost(""); setResults(null); }}
                        className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          selectedRule?.id === rule.id
                            ? "bg-blue-700 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700"
                        }`}
                      >
                        {selectedRule?.id === rule.id ? "Selected" : "Select"}
                      </button>
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

      {/* Step 2: Enter cost + Calculate */}
      {selectedRule && (
        <div className="mt-5 bg-white rounded-2xl border border-blue-200 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-0.5">Selected Permit</p>
              <p className="font-bold text-gray-900 text-sm">{selectedRule.permit_name}</p>
            </div>
            <button onClick={handleReset} className="text-gray-400 hover:text-gray-600 p-1">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
          {needsCost ? (
            <div className="mb-4">
              <Label className="text-sm font-medium text-gray-700 mb-1 block">Estimated Project Cost ($)</Label>
              <Input
                type="number"
                min="0"
                placeholder="e.g. 50000"
                value={constructionCost}
                onChange={e => setConstructionCost(e.target.value)}
                className="rounded-xl"
              />
              <p className="text-xs text-gray-400 mt-1">Contractor estimate is fine.</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500 mb-4">Flat-rate permit — no cost input needed.</p>
          )}
          <Button
            onClick={handleCalculate}
            disabled={!canCalculate}
            className="w-full text-white rounded-xl h-12 text-base font-semibold shadow-md disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #0D2B5E 0%, #0F3575 100%)" }}
          >
            <Calculator className="w-5 h-5 mr-2" />
            Calculate Estimated Fee
          </Button>
        </div>
      )}

      {/* Results */}
      {results && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-5">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
            <div className="px-6 py-7 text-center" style={{ background: "linear-gradient(135deg, #0D2B5E 0%, #0F3575 100%)" }}>
              <p className="text-blue-200 text-sm mb-1">Estimated Total Fee</p>
              <div className="flex items-center justify-center gap-2">
                <DollarSign className="w-8 h-8 text-yellow-300" />
                <span className="text-4xl font-extrabold text-white">{results.total.toFixed(2)}</span>
              </div>
              <p className="text-blue-200 text-xs mt-2">{selectedRule?.permit_name} · {city}</p>
            </div>

            <div className="p-5">
              <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
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

            <div className="mx-5 mb-5 p-3.5 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  <strong>Estimate only.</strong> Actual fees are set at permit issuance. Additional trade permits may add to total.
                </p>
              </div>
            </div>

            <div className="px-5 pb-5 flex flex-col gap-2">
              {CITY_PORTAL_URLS[city] && (
                <Button asChild className="w-full text-white rounded-xl h-11" style={{ background: "linear-gradient(135deg, #0D2B5E 0%, #0F3575 100%)" }}>
                  <a href={CITY_PORTAL_URLS[city]} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Apply for Permit in {city}
                  </a>
                </Button>
              )}
              <Button variant="outline" onClick={handleReset} className="w-full rounded-xl h-11">
                <RotateCcw className="w-4 h-4 mr-2" />
                Calculate Another Permit
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
    </div>
  );
}