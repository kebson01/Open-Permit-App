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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Calculator className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">Permit Fee Calculator</h1>
        </div>
        <p className="text-gray-500">Calculate estimated permit fees based on official municipal fee schedules</p>
      </div>

      {/* City Selector */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <MapPin className="w-4 h-4 text-[#2c5282]" />
          <span className="text-sm font-medium text-gray-700">Municipality:</span>
          {singleCity ? (
            <span className="font-semibold text-[#2c5282]">{city}</span>
          ) : (
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="w-52 rounded-xl">
                <SelectValue placeholder="Choose city..." />
              </SelectTrigger>
              <SelectContent>
                {CITIES.map(c => (
                  <SelectItem key={c} value={c}>
                    {c}
                    {!CITY_FEE_CONFIGS[c] && <span className="text-gray-400 ml-1">(coming soon)</span>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {cityConfig && (
            <span className="text-xs text-gray-400 ml-auto">
              Fee schedule effective: {cityConfig.effective_date}
            </span>
          )}
        </div>

        {!cityConfig && city && (
          <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
            <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700">
              Fee schedule for <strong>{city}</strong> is not yet configured. Currently showing Weston fees as a reference.
              Contact us to add your municipality's fee schedule.
            </p>
          </div>
        )}
      </div>

      {/* Permit Selector */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <PermitSelectorV2
          permits={(cityConfig || WESTON_CONFIG).permits}
          selectedPermitId={selectedPermitId}
          onSelect={setSelectedPermitId}
        />
      </div>

      {/* Project Details */}
      {selectedPermit && (
        <ProjectDetailsV2
          permit={selectedPermit}
          details={details}
          setDetails={setDetails}
          onCalculate={handleCalculate}
        />
      )}

      {/* Results */}
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