import React, { useState, useEffect } from "react";
import { Calculator } from "lucide-react";
import PermitSelectorV2 from "@/components/calculator/PermitSelectorV2";
import ProjectDetailsV2 from "@/components/calculator/ProjectDetailsV2";
import FeeResultsV2 from "@/components/calculator/FeeResultsV2";
import { CITY_FEE_CONFIGS, calculatePermitFee } from "@/components/calculator/feeConfigs";

export default function FeeCalculatorEmbed({ city }) {
  const [selectedPermitId, setSelectedPermitId] = useState("");
  const [details, setDetails] = useState({});
  const [results, setResults] = useState(null);

  const cityConfig = CITY_FEE_CONFIGS[city.name] || null;
  const selectedPermit = cityConfig?.permits.find(p => p.id === selectedPermitId) || null;

  useEffect(() => {
    setDetails({});
    setResults(null);
  }, [selectedPermitId]);

  const handleCalculate = () => {
    if (!selectedPermit || !cityConfig) return;
    setResults(calculatePermitFee(selectedPermit, details, cityConfig));
  };

  const handleReset = () => {
    setSelectedPermitId("");
    setDetails({});
    setResults(null);
  };

  if (!cityConfig) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
        <Calculator className="w-8 h-8 text-amber-400 mx-auto mb-2" />
        <p className="text-amber-700 font-medium">Fee schedule not yet configured for {city.name}</p>
        <p className="text-amber-600 text-sm mt-1">Please contact your administrator to set up fee rules.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
          <Calculator className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Permit Fee Calculator</h2>
          {cityConfig.effective_date && (
            <p className="text-xs text-gray-400">Fee schedule effective: {cityConfig.effective_date}</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <PermitSelectorV2
          permits={cityConfig.permits}
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
        city={city.name}
        cityConfig={cityConfig}
        onReset={handleReset}
      />
    </div>
  );
}