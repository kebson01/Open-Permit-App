import React, { useState, useEffect } from "react";
import { Calculator, MapPin, Info } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PermitSelectorV2 from "../components/calculator/PermitSelectorV2";
import ProjectDetailsV2 from "../components/calculator/ProjectDetailsV2";
import FeeResultsV2 from "../components/calculator/FeeResultsV2";
import { CITY_FEE_CONFIGS, calculatePermitFee, WESTON_CONFIG } from "../components/calculator/feeConfigs";

const DEFAULT_CITIES = Object.keys(CITY_FEE_CONFIGS);
const ALL_CITIES = ["Weston", "Coral Springs", "Fort Lauderdale", "Hollywood", "Cooper City"];

export default function FeeCalculator() {
  const urlParams = new URLSearchParams(window.location.search);
  const urlCity = urlParams.get("city") || "";
  const urlCities = urlParams.get("cities");
  const CITIES = urlCity ? [urlCity] : (urlCities ? urlCities.split(",").map(s => s.trim()) : ALL_CITIES);
  const singleCity = CITIES.length === 1;

  const [city, setCity] = useState(urlCity || sessionStorage.getItem("selectedCity") || "Weston");
  const [selectedPermitId, setSelectedPermitId] = useState(urlParams.get("permit") || "");
  const [details, setDetails] = useState({});
  const [results, setResults] = useState(null);

  const cityConfig = CITY_FEE_CONFIGS[city] || null;
  const selectedPermit = cityConfig?.permits.find(p => p.id === selectedPermitId) || null;

  useEffect(() => {
    if (city) sessionStorage.setItem("selectedCity", city);
    setSelectedPermitId("");
    setDetails({});
    setResults(null);
  }, [city]);

  useEffect(() => {
    setDetails({});
    setResults(null);
  }, [selectedPermitId]);

  const handleCalculate = () => {
    if (!selectedPermit || !cityConfig) return;
    const result = calculatePermitFee(selectedPermit, details, cityConfig);
    setResults(result);
  };

  const handleReset = () => {
    setSelectedPermitId("");
    setDetails({});
    setResults(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-8 pb-20 md:pb-8">
      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
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
                    {c}{!CITY_FEE_CONFIGS[c] && " (soon)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {cityConfig && (
            <span className="text-xs text-gray-400 ml-auto hidden sm:block">
              Effective: {cityConfig.effective_date}
            </span>
          )}
        </div>

        {!cityConfig && city && (
          <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
            <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700">
              Fee schedule for <strong>{city}</strong> not yet configured. Showing Weston as reference.
            </p>
          </div>
        )}
      </div>

      {/* Permit Selector */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-sm">
        <PermitSelectorV2
          permits={(cityConfig || WESTON_CONFIG).permits}
          selectedPermitId={selectedPermitId}
          onSelect={setSelectedPermitId}
        />
      </div>

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