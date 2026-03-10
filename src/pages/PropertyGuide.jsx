import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, ExternalLink, Info, MapPin } from "lucide-react";
import PropertySearchBar from "@/components/property/PropertySearchBar";
import LotVisualization from "@/components/property/LotVisualization";
import PropertyInfoCards from "@/components/property/PropertyInfoCards";
import BuildingProjectsPanel from "@/components/property/BuildingProjectsPanel";

export default function PropertyGuide() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const handleSearch = async (address) => {
    setLoading(true);
    setError(null);
    setData(null);
    const res = await base44.functions.invoke("bcpaPropertyLookup", { address });
    const result = res.data;
    if (result?.error) {
      setError(result.error);
    } else {
      setData(result);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Header */}
      <div className="gradient-primary py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="w-7 h-7 text-blue-300" />
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Property Owner's Guide
            </h1>
          </div>
          <p className="text-blue-200 text-sm max-w-2xl">
            Powered by BCPA (Broward County Property Appraiser) data — understand your zoning, setbacks, flood zone, and what you can build on your property.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Search */}
        <PropertySearchBar onSearch={handleSearch} loading={loading} />

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
            <div className="text-center">
              <p className="font-semibold text-gray-700">Looking up your property…</p>
              <p className="text-sm text-gray-500 mt-1">Checking BCPA records, zoning codes &amp; flood maps</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800">Lookup Failed</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {data && (
          <>
            {/* Address Header */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    <h2 className="font-bold text-gray-900 text-lg">{data.verified_address}</h2>
                  </div>
                  {data.owner_name && <p className="text-sm text-gray-500 ml-6">Owner: {data.owner_name}</p>}
                </div>
                <div className="flex items-center gap-3">
                  {data.is_estimated && (
                    <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-3 py-1 text-xs text-amber-700">
                      <Info className="w-3 h-3" /> Estimated data
                    </div>
                  )}
                  <a
                    href={`https://www.bcpa.net/RecInfo.asp?URL_SF=${encodeURIComponent(data.folio || "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View on BCPA.net <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Main Grid */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Left: Lot Map */}
              <div className="space-y-6">
                <LotVisualization data={data} />
                <BuildingProjectsPanel projects={data.building_projects} />
              </div>

              {/* Right: Info */}
              <div>
                <PropertyInfoCards data={data} />

                {/* Code Enforcement Notes */}
                {data.code_enforcement_notes?.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide mb-2">
                      Important Notes
                    </h3>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-2">
                      {data.code_enforcement_notes.map((note, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-yellow-800">
                          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-yellow-500" />
                          {note}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-500">
              <strong>Disclaimer:</strong> This tool uses AI-assisted BCPA data lookups for informational purposes only. Always verify zoning, setbacks, and permit requirements with your city's building department before beginning any construction. Flood zone data is based on FEMA NFHL maps and may not reflect the latest revisions.
            </div>
          </>
        )}

        {/* Empty State */}
        {!loading && !data && !error && (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-gray-600 font-semibold text-lg mb-1">Enter a Broward County Address</h3>
            <p className="text-sm text-gray-400 max-w-md mx-auto">
              We'll pull your property details from BCPA, look up your zoning district, setback requirements, flood zone designation, and show you exactly what you can build.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}