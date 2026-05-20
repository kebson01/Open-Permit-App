import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as db from "@/lib/db";
import { Calculator, Map, CheckSquare, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import FeeCalculatorEmbed from "@/components/city/FeeCalculatorEmbed";
import PermitGuideEmbed from "@/components/city/PermitGuideEmbed";
import FeasibilityChecker from "@/components/property/FeasibilityChecker";

const TABS = [
  { id: "fees", label: "Fee Calculator", icon: Calculator },
  { id: "permits", label: "Permit Guide", icon: Map },
  { id: "feasibility", label: "Feasibility Check", icon: CheckSquare },
];

export default function PropertyCityPanel({ property }) {
  const [activeTab, setActiveTab] = useState("fees");
  const [expanded, setExpanded] = useState(false);

  const cityName = property.city_name || property.SITUS_CITY;

  const { data: cities = [] } = useQuery({
    queryKey: ["cities"],
    queryFn: () => db.City.list(),
  });

  const city = cities.find(
    c => c.name?.toUpperCase() === cityName?.toUpperCase()
  );

  if (!cityName) return null;

  return (
    <div className="mt-6 bg-white rounded-xl border border-blue-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <Map className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-800">City Services — {cityName}</p>
            <p className="text-xs text-gray-500">Fee calculator, permit guide & feasibility checker</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>

      {expanded && (
        <div className="p-5">
          {!city ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center text-amber-700 text-sm">
              City portal not yet configured for <strong>{cityName}</strong>. Contact an administrator to set it up.
            </div>
          ) : (
            <>
              {/* Tab Nav */}
              <div className="flex gap-2 mb-5 border-b border-gray-100 pb-3">
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? "gradient-primary text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === "fees" && <FeeCalculatorEmbed city={city} />}
              {activeTab === "permits" && <PermitGuideEmbed city={city} />}
              {activeTab === "feasibility" && <FeasibilityChecker property={property} city={city} />}
            </>
          )}
        </div>
      )}
    </div>
  );
}