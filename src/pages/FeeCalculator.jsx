import React, { useState, useEffect } from "react";
import { Calculator, MapPin, Info, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PermitSelectorV2 from "../components/calculator/PermitSelectorV2";
import ProjectDetailsV2 from "../components/calculator/ProjectDetailsV2";
import FeeResultsV2 from "../components/calculator/FeeResultsV2";
import { calculateFeeFromRule } from "../components/calculator/feeEngine";

const SUPABASE_URL = "https://gbknnjidqpmjrwlooluw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdia25uamlkcXBtanJ3bG9vbHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NTQzNDIsImV4cCI6MjA5MDIzMDM0Mn0.qwDACgXe3hesxBRQOzP53Hdc44z_UOka1_uYQScyi68";

const ALL_CITIES = ["Weston", "Coral Springs", "Fort Lauderdale", "Hollywood", "Cooper City"];
const WESTON_EFFECTIVE_DATE = "October 1, 2025 (Revised January 20, 2026)";
const WESTON_PORTAL = "https://www.westonfl.org";

// Adapt Supabase row to the shape PermitSelectorV2 expects
function adaptRule(row) {
  return {
    id: row.id,
    name: row.permit_name,
    category: row.category,
    description: row.description || "",
    calcType: row.calc_type,
    inputs: inputsForCalcType(row),
    _raw: row, // keep original for fee calculation
  };
}

function inputsForCalcType(row) {
  if (!row.calc_type) return [];
  if (row.calc_type === "flat") return [];
  if (row.input_field) return [row.input_field];
  return [];
}

export default function FeeCalculator() {
  const urlParams = new URLSearchParams(window.location.search);
  const urlCity = urlParams.get("city") || "";
  const urlCities = urlParams.get("cities");
  const CITIES = urlCity ? [urlCity] : (urlCities ? urlCities.split(",").map(s => s.trim()) : ALL_CITIES);
  const singleCity = CITIES.length === 1;

  const [city, setCity] = useState(urlCity || sessionStorage.getItem("selectedCity") || "Weston");
  const [feeRules, setFeeRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPermitId, setSelectedPermitId] = useState(urlParams.get("permit") || "");
  const [details, setDetails] = useState({});
  const [results, setResults] = useState(null);

  useEffect(() => {
    if (city) sessionStorage.setItem("selectedCity", city);
    setSelectedPermitId("");
    setDetails({});
    setResults(null);

    if (city !== "Weston") {
      setFeeRules([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`${SUPABASE_URL}/rest/v1/weston_fee_rules?select=*&order=sort_order.asc`, {
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      },
    })
      .then(r => r.json())
      .then(rows => setFeeRules(rows))
      .finally(() => setLoading(false));
  }, [city]);

  useEffect(() => {
    setDetails({});
    setResults(null);
  }, [selectedPermitId]);

  const permits = feeRules.map(adaptRule);
  const selectedPermit = permits.find(p => String(p.id) === String(selectedPermitId)) || null;

  const handleCalculate = () => {
    if (!selectedPermit) return;
    const result = calculateFeeFromRule(selectedPermit._raw, details);
    setResults(result);
  };

  const handleReset = () => {
    setSelectedPermitId("");
    setDetails({});
    setResults(null);
  };

  const isWeston = city === "Weston";
  const cityConfig = isWeston
    ? { effective_date: WESTON_EFFECTIVE_DATE, portal_url: WESTON_PORTAL }
    : null;

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
                  <SelectItem key={c} value={c}>
                    {c}{c !== "Weston" && " (soon)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {isWeston && (
            <span className="text-xs text-gray-400 ml-auto hidden sm:block">
              Effective: {WESTON_EFFECTIVE_DATE}
            </span>
          )}
        </div>

        {!isWeston && city && (
          <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
            <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700">
              Fee schedule for <strong>{city}</strong> not yet configured. Please select Weston to use the calculator.
            </p>
          </div>
        )}
      </div>

      {/* Permit Selector */}
      {isWeston && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading fee schedule...</span>
            </div>
          ) : (
            <PermitSelectorV2
              permits={permits}
              selectedPermitId={String(selectedPermitId)}
              onSelect={setSelectedPermitId}
            />
          )}
        </div>
      )}

      {selectedPermit && (
        <ProjectDetailsV2
          permit={selectedPermit}
          details={details}
          setDetails={setDetails}
          onCalculate={handleCalculate}
        />
      )}

      <FeeResultsV2
        results={results}
        permit={selectedPermit}
        city={city}
        cityConfig={cityConfig}
        onReset={handleReset}
      />
    </div>
  );
}