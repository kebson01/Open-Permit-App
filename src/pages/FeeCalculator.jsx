import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Calculator, MapPin, Loader2, Info } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import PermitSelector from "../components/calculator/PermitSelector";
import ProjectDetails from "../components/calculator/ProjectDetails";
import FeeResults from "../components/calculator/FeeResults";

const DEFAULT_CITIES = ["Weston", "Coral Springs", "Fort Lauderdale", "Hollywood", "Cooper City"];

function calculateFee(feeRule, details) {
  if (!feeRule) return null;

  const breakdown = [];
  let permitFee = feeRule.base_fee || 0;

  if (feeRule.calculation_method === "per_cost" && details.constructionCost) {
    const costFee = details.constructionCost * (feeRule.rate_per_unit || 0);
    permitFee = Math.max(costFee, feeRule.minimum_fee || 0);
    breakdown.push({ label: "Permit Fee (based on construction cost)", amount: permitFee });
  } else if (feeRule.calculation_method === "per_sqft" && details.squareFeet) {
    const sqftFee = feeRule.base_fee + (details.squareFeet * (feeRule.rate_per_unit || 0));
    permitFee = Math.max(sqftFee, feeRule.minimum_fee || 0);
    breakdown.push({ label: "Permit Fee (based on square footage)", amount: permitFee });
  } else if (feeRule.calculation_method === "per_unit" && details.units) {
    const unitFee = feeRule.base_fee + (details.units * (feeRule.rate_per_unit || 0));
    permitFee = Math.max(unitFee, feeRule.minimum_fee || 0);
    breakdown.push({ label: "Permit Fee (based on units)", amount: permitFee });
  } else if (feeRule.calculation_method === "per_linear_ft" && details.linearFeet) {
    const linearFee = feeRule.base_fee + (details.linearFeet * (feeRule.rate_per_unit || 0));
    permitFee = Math.max(linearFee, feeRule.minimum_fee || 0);
    breakdown.push({ label: "Permit Fee (based on linear feet)", amount: permitFee });
  } else {
    breakdown.push({ label: "Permit Fee (flat rate)", amount: permitFee });
  }

  let total = permitFee;

  if (feeRule.plan_review_percentage > 0) {
    const planReview = permitFee * (feeRule.plan_review_percentage / 100);
    breakdown.push({ label: `Plan Review Fee (${feeRule.plan_review_percentage}%)`, amount: planReview });
    total += planReview;
  }

  if (feeRule.technology_surcharge > 0) {
    const techFee = permitFee * (feeRule.technology_surcharge / 100);
    breakdown.push({ label: `Technology Surcharge (${feeRule.technology_surcharge}%)`, amount: techFee });
    total += techFee;
  }

  if (feeRule.rainy_day_surcharge > 0) {
    const rainyFee = permitFee * (feeRule.rainy_day_surcharge / 100);
    breakdown.push({ label: `Rainy Day Fund (${feeRule.rainy_day_surcharge}%)`, amount: rainyFee });
    total += rainyFee;
  }

  return { total, breakdown };
}

export default function FeeCalculator() {
  const urlParams = new URLSearchParams(window.location.search);
  const urlCity = urlParams.get("city") || "";
  const urlCities = urlParams.get("cities");
  const CITIES = urlCity ? [urlCity] : (urlCities ? urlCities.split(",").map(s => s.trim()) : DEFAULT_CITIES);
  const singleCity = CITIES.length === 1;

  const [city, setCity] = useState(urlCity || sessionStorage.getItem("selectedCity") || "");
  const [selectedPermit, setSelectedPermit] = useState(urlParams.get("permit") || "");
  const [details, setDetails] = useState({
    constructionCost: 0,
    squareFeet: 0,
    units: 0,
    linearFeet: 0,
    projectType: "new",
    propertyType: "single_family",
    roofType: "shingle",
  });
  const [results, setResults] = useState(null);

  const { data: permits = [], isLoading: permitsLoading } = useQuery({
    queryKey: ["permits"],
    queryFn: () => base44.entities.PermitType.list(),
  });

  const { data: feeRules = [], isLoading: feesLoading } = useQuery({
    queryKey: ["feeRules"],
    queryFn: () => base44.entities.FeeRule.list(),
  });

  const handleCalculate = () => {
    let rule = feeRules.find(r => r.permit_type === selectedPermit && r.city_name === city);
    if (!rule) {
      rule = feeRules.find(r => r.permit_type === selectedPermit);
    }
    if (!rule) {
      rule = {
        calculation_method: "flat",
        base_fee: 75,
        technology_surcharge: 3,
        rainy_day_surcharge: 1,
        plan_review_percentage: 0,
      };
    }
    const result = calculateFee(rule, details);
    setResults(result);
  };

  const handleReset = () => {
    setSelectedPermit("");
    setDetails({
      constructionCost: 0, squareFeet: 0, units: 0, linearFeet: 0,
      projectType: "new", propertyType: "single_family", roofType: "shingle",
    });
    setResults(null);
  };

  useEffect(() => {
    if (city) sessionStorage.setItem("selectedCity", city);
  }, [city]);

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
        <p className="text-gray-500">Calculate estimated fees for your permit application</p>
      </div>

      {/* City Selector — hidden when locked to a single city */}
      {!singleCity ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <MapPin className="w-4 h-4 text-[#2c5282]" />
            <span className="text-sm font-medium text-gray-700">Select City:</span>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="w-48 rounded-xl">
                <SelectValue placeholder="Choose city..." />
              </SelectTrigger>
              <SelectContent>
                {CITIES.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(permitsLoading || feesLoading) && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
          </div>
        </div>
      ) : (
        city && (
          <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-xl border border-blue-100">
            <MapPin className="w-4 h-4 text-[#2c5282]" />
            <span className="text-sm font-medium text-[#2c5282]">City: {city}</span>
            {(permitsLoading || feesLoading) && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
          </div>
        )
      )}

      {/* Permit Selector */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <PermitSelector
          permits={permits}
          selectedPermit={selectedPermit}
          onSelect={setSelectedPermit}
        />
      </div>

      {/* Project Details */}
      {selectedPermit && (
        <ProjectDetails
          selectedPermit={selectedPermit}
          details={details}
          setDetails={setDetails}
        />
      )}

      {/* Calculate Button */}
      {selectedPermit && (
        <div className="sticky bottom-4 mt-6 z-10">
          <Button
            onClick={handleCalculate}
            className="w-full gradient-primary text-white rounded-xl h-12 text-base font-semibold shadow-xl shadow-blue-900/20"
          >
            <Calculator className="w-5 h-5 mr-2" />
            Calculate Estimated Fee
          </Button>
        </div>
      )}

      {/* Results */}
      <FeeResults results={results} city={city} onReset={handleReset} />
    </div>
  );
}