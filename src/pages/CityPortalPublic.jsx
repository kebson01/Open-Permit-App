import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Building2, Calculator, Map, AlertCircle, ExternalLink } from "lucide-react";
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
    base44.entities.City.list().then(all => {
      // Match by slug first, then fallback to name match
      const found = all.find(c => c.slug === slug) || all.find(c => c.name?.toLowerCase().replace(/\s+/g, "-") === slug) || null;
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
        <div className="text-gray-600 text-sm">Loading...</div>
      </div>
    );
  }

  if (!slug || !city) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-gray-700">City Not Found</h2>
          <p className="text-gray-700 mt-1 text-sm">
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
          <p className="text-gray-700 mt-1 text-sm">No services have been enabled for this portal yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* City Header */}
      <div className="text-white px-6 py-6" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="w-7 h-7 text-white" />
              <div>
                <h1 className="text-2xl font-bold">{city.name}</h1>
                <p className="text-white/90 text-sm font-medium">{city.county} County, {city.state} — Permitting Services</p>
              </div>
            </div>
            {city.portal_url && (
              <a
                href={city.portal_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-xl transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                City Portal
              </a>
            )}
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