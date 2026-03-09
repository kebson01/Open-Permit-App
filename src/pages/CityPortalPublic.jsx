import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Building2, Calculator, Map, AlertCircle } from "lucide-react";
import FeeCalculatorEmbed from "@/components/city/FeeCalculatorEmbed";
import PermitGuideEmbed from "@/components/city/PermitGuideEmbed";

export default function CityPortalPublic() {
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get("slug");

  const [city, setCity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(null);

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    base44.entities.City.filter({ slug }).then(results => {
      const found = results[0] || null;
      setCity(found);
      if (found?.enabled_services?.length > 0) {
        setActiveTab(found.enabled_services[0]);
      }
      setLoading(false);
    });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (!slug || !city) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-gray-700">City Not Found</h2>
          <p className="text-gray-500 mt-1 text-sm">
            This portal link is invalid or the city has not been configured.
          </p>
        </div>
      </div>
    );
  }

  const services = city.enabled_services || [];

  if (services.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-sm">
          <Building2 className="w-10 h-10 text-blue-300 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-gray-700">{city.name}</h2>
          <p className="text-gray-500 mt-1 text-sm">No services have been enabled for this portal yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* City Header */}
      <div className="gradient-primary text-white px-6 py-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <Building2 className="w-7 h-7 text-blue-200" />
            <div>
              <h1 className="text-2xl font-bold">{city.name}</h1>
              <p className="text-blue-200 text-sm">{city.county} County, {city.state} — Permitting Services</p>
            </div>
          </div>

          {/* Tabs */}
          {services.length > 1 && (
            <div className="flex gap-2 mt-5">
              {services.includes("permit_guide") && (
                <button
                  onClick={() => setActiveTab("permit_guide")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    activeTab === "permit_guide"
                      ? "bg-white text-blue-700"
                      : "bg-white/20 text-white hover:bg-white/30"
                  }`}
                >
                  <Map className="w-4 h-4" /> Visual Permit Guide
                </button>
              )}
              {services.includes("fee_calculator") && (
                <button
                  onClick={() => setActiveTab("fee_calculator")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    activeTab === "fee_calculator"
                      ? "bg-white text-blue-700"
                      : "bg-white/20 text-white hover:bg-white/30"
                  }`}
                >
                  <Calculator className="w-4 h-4" /> Fee Calculator
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {activeTab === "permit_guide" && <PermitGuideEmbed city={city} />}
        {activeTab === "fee_calculator" && <FeeCalculatorEmbed city={city} />}
      </div>
    </div>
  );
}