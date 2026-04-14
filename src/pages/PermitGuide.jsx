import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Home, Eye, EyeOff, List, MapPin, ArrowLeft, LayoutGrid, Building2, Sparkles, Camera, HardHat } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import HouseView from "../components/map/HouseView";
import PermitPopup from "../components/map/PermitPopup";
import PermitsPanel from "../components/map/PermitsPanel";
import StandalonePhotoAnalyzer from "../components/map/StandalonePhotoAnalyzer";
import UserModeToggle from "../components/map/UserModeToggle";

const DEFAULT_CITIES = ["Weston", "Coral Springs", "Fort Lauderdale", "Hollywood", "Cooper City"];
const AVAILABLE_CITIES = ["Weston"];
const COMING_SOON_CITIES = ["Coral Springs", "Fort Lauderdale", "Hollywood", "Cooper City"];

// View options per property type
const RESIDENTIAL_VIEWS = [
  { id: "front",  label: "Front View",   icon: Home },
  { id: "back",   label: "Back View",    icon: ArrowLeft },
  { id: "eagle",  label: "Aerial View",  icon: LayoutGrid },
];

const COMMERCIAL_VIEWS = [
  { id: "commercial_building", label: "Commercial Building", icon: Building2 },
  { id: "commercial",          label: "Site / Engineering",  icon: LayoutGrid },
];

export default function PermitGuide() {
  const urlParams = new URLSearchParams(window.location.search);
  const urlCity = urlParams.get("city") || "";
  const urlCities = urlParams.get("cities");
  const CITIES = urlCity ? [urlCity] : (urlCities ? urlCities.split(",").map(s => s.trim()) : DEFAULT_CITIES);
  const singleCity = CITIES.length === 1;

  // Top level: property type
  const [propertyType, setPropertyType] = useState("residential"); // "residential" | "commercial"

  // Secondary: view (defaults by property type)
  const [residentialView, setResidentialView] = useState("front");
  const [commercialView, setCommercialView] = useState("commercial");

  // Tertiary: user mode
  const [userMode, setUserMode] = useState("homeowner"); // "homeowner" | "contractor"

  // Other UI state
  const [showHighlights, setShowHighlights] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedPermit, setSelectedPermit] = useState(null);
  const [city, setCity] = useState(urlCity || sessionStorage.getItem("selectedCity") || "");
  const [showPhotoAnalyzer, setShowPhotoAnalyzer] = useState(false);

  const { data: permits = [] } = useQuery({
    queryKey: ["permits"],
    queryFn: () => base44.entities.PermitType.list(),
  });

  // Derive the actual map view key
  const activeView = propertyType === "residential" ? residentialView : commercialView;
  const activeViews = propertyType === "residential" ? RESIDENTIAL_VIEWS : COMMERCIAL_VIEWS;

  const setActiveView = (v) => {
    if (propertyType === "residential") setResidentialView(v);
    else setCommercialView(v);
  };

  const handleZoneClick = (permitName, permitDesc) => {
    const found = permits.find(p => p.name === permitName);
    setSelectedPermit(found || { name: permitName, description: permitDesc || "", typical_requirements: [], documents_needed: [] });
  };

  return (
    <div className="px-3 sm:px-6 py-4 sm:py-8 pb-20 md:pb-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl sm:text-3xl font-extrabold text-gray-800 tracking-tight">Visual Permit Guide</h1>
        <p className="text-gray-600 mt-0.5 text-xs sm:text-base">Tap any highlighted area to see permit requirements, documents, and estimated fees.</p>
      </div>

      {/* ── Controls ── */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-3 mb-4 space-y-3">

        {/* Row 1: Property Type */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider w-16 flex-shrink-0">Property</span>
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setPropertyType("residential")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                propertyType === "residential" ? "bg-blue-700 text-white shadow-sm" : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              Residential
            </button>
            <button
              onClick={() => setPropertyType("commercial")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                propertyType === "commercial" ? "bg-blue-700 text-white shadow-sm" : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Commercial
            </button>
          </div>
        </div>

        {/* Row 2: View */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider w-16 flex-shrink-0">View</span>
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1 flex-wrap">
            {activeViews.map(v => (
              <button
                key={v.id}
                onClick={() => setActiveView(v.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  activeView === v.id ? "bg-blue-700 text-white shadow-sm" : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <v.icon className="w-3.5 h-3.5" />
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 3: User Mode */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider w-16 flex-shrink-0">Mode</span>
          <UserModeToggle mode={userMode} onChange={setUserMode} />
        </div>

        {/* Row 4: Utility controls */}
        <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
          <button
            onClick={() => setShowHighlights(!showHighlights)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${showHighlights ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-gray-50 border-gray-200 text-gray-600"}`}
          >
            {showHighlights ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showHighlights ? "Hide Zones" : "Show Zones"}
          </button>

          <button
            onClick={() => setPanelOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-xs font-medium text-gray-600 hover:border-gray-300"
          >
            <List className="w-3.5 h-3.5" />
            Browse All Permits
          </button>

          {!singleCity && (
            <div className="flex items-center gap-1.5 ml-auto">
              <MapPin className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
              <Select value={city} onValueChange={(val) => { setCity(val); if (val) sessionStorage.setItem("selectedCity", val); }}>
                <SelectTrigger className="w-36 sm:w-44 rounded-xl h-8 text-xs">
                  <SelectValue placeholder="Filter by city..." />
                </SelectTrigger>
                <SelectContent>
                  {CITIES.map(c => (
                    <SelectItem key={c} value={c} disabled={COMING_SOON_CITIES.includes(c)} className={COMING_SOON_CITIES.includes(c) ? "opacity-50 cursor-not-allowed" : ""}>
                      <span className="flex items-center gap-2">
                        {c}
                        {COMING_SOON_CITIES.includes(c) && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full">Coming Soon</span>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Commercial sub-type hint */}
      {propertyType === "commercial" && (
        <div className="mb-3 flex flex-wrap gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 rounded-xl border border-indigo-100">
            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-xs font-medium text-indigo-700">
              {activeView === "commercial" ? "Site/Engineering: parking, EV chargers, driveways, utilities" : "Commercial Building: offices, retail, multi-family"}
            </span>
          </div>
        </div>
      )}

      {city && (
        <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-xl border border-blue-100">
          <MapPin className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-xs font-medium text-blue-700">{city}</span>
        </div>
      )}

      <HouseView view={activeView} showHighlights={showHighlights} onZoneClick={handleZoneClick} />

      {/* AI Photo Analysis Banner */}
      {!showPhotoAnalyzer ? (
        <button
          onClick={() => setShowPhotoAnalyzer(true)}
          className="mt-4 w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 border-dashed border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <div className="text-left flex-1">
            <p className="font-bold text-blue-900 text-sm flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              AI Photo Analysis
            </p>
            <p className="text-blue-800 text-xs mt-0.5">Upload a photo of your property — AI will identify what permits you need</p>
          </div>
          <span className="text-xs font-semibold text-blue-800 bg-blue-200 px-2.5 py-1 rounded-lg flex-shrink-0">Try it →</span>
        </button>
      ) : (
        <div className="mt-4">
          <StandalonePhotoAnalyzer onClose={() => setShowPhotoAnalyzer(false)} permits={permits} />
        </div>
      )}

      {selectedPermit && (
        <PermitPopup
          permit={selectedPermit}
          city={city}
          userMode={userMode}
          onClose={() => setSelectedPermit(null)}
        />
      )}

      <PermitsPanel
        permits={permits}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onSelectPermit={(p) => { setSelectedPermit(p); setPanelOpen(false); }}
      />

      {panelOpen && (
        <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setPanelOpen(false)} />
      )}
    </div>
  );
}