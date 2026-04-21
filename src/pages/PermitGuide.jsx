import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Home, Eye, EyeOff, List, MapPin, ArrowLeft, LayoutGrid, Building2, Sparkles, Camera, HardHat, Layers, BookOpen } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import HouseView from "../components/map/HouseView";
import PermitPopup from "../components/map/PermitPopup";
import PermitsPanel from "../components/map/PermitsPanel";
import StandalonePhotoAnalyzer from "../components/map/StandalonePhotoAnalyzer";
import OrdinancesPanel from "../components/map/OrdinancesPanel";
import AIDrawer from "../components/ai/AIDrawer";

const SUPABASE_URL = "https://gbknnjidqpmjrwlooluw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdia25uamlkcXBtanJ3bG9vbHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NTQzNDIsImV4cCI6MjA5MDIzMDM0Mn0.qwDACgXe3hesxBRQOzP53Hdc44z_UOka1_uYQScyi68";

const LABEL_TO_MAP_ZONE = {
  "Roof / Re-Roof":           "roof",
  "Solar Panels":             "roof",
  "Garage Door":              "garage",
  "Window Replacement":       "windows",
  "Door Replacement":         "windows",
  "Pool & Spa":               "pool",
  "Pool Equipment":           "pool",
  "Pool Deck":                "pool",
  "Fence / Gate":             "fence",
  "A/C Replacement":          "hvac",
  "HVAC / Mechanical":        "hvac",
  "Electrical Service":       "electrical",
  "Irrigation System":        "backyard",
  "Patio / Slab":             "backyard",
  "Covered Patio":            "backyard",
  "Pergola":                  "backyard",
  "Driveway (Paver)":         "driveway",
  "Driveway / Walkway":       "driveway",
  "Walkway / Sidewalk":       "driveway",
  "Sidewalk / Curb":          "driveway",
  "Residential Remodel":      "interior",
  "Residential Addition":     "structure",
  "Plumbing":                 "interior",
  "Sign Permit":              "structure",
  "Parking Lot / Paving":     "driveway",
  "EV Charging Station":      "electrical",
  "Light Pole / Utility":     "electrical",
  "Underground Drainage":     "backyard",
  "Asphalt / Milling & Paving": "driveway",
  "Seal Coat & Striping":     "driveway",
  "Pavement / Earthwork":     "driveway",
  "Utility Boring":           "structure",
};

const CITY_PERMIT_TABLES = {
  "Weston": "weston_permit_types",
  "Coral Springs": "coral_springs_permit_types",
  "Fort Lauderdale": "fort_lauderdale_permit_types",
  "Hollywood": "hollywood_permit_types",
  "Cooper City": "cooper_city_permit_types",
};

async function fetchPermitTypes(city = "Weston") {
  const table = CITY_PERMIT_TABLES[city] || "weston_permit_types";
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?select=*`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );
  const data = await res.json();
  return (Array.isArray(data) ? data : []).map(p => ({
    ...p,
    typical_requirements: typeof p.typical_requirements === "string" ? JSON.parse(p.typical_requirements) : (p.typical_requirements || []),
    documents_needed:     typeof p.documents_needed === "string"     ? JSON.parse(p.documents_needed)     : (p.documents_needed || []),
    inspections_required: typeof p.inspections_required === "string" ? JSON.parse(p.inspections_required) : (p.inspections_required || []),
  }));
}

const DEFAULT_CITIES = ["Weston", "Coral Springs", "Fort Lauderdale", "Hollywood", "Cooper City"];
const AVAILABLE_CITIES = ["Weston", "Coral Springs", "Fort Lauderdale", "Hollywood", "Cooper City"];
const COMING_SOON_CITIES = [];

const RESIDENTIAL_VIEWS = [
  { id: "front",  label: "Front View",   icon: Home },
  { id: "back",   label: "Back View",    icon: ArrowLeft },
  { id: "eagle",  label: "Floor Plan View",  icon: LayoutGrid },
];

const COMMERCIAL_VIEWS = [
  { id: "commercial_building", label: "Commercial Building", icon: Building2 },
  { id: "commercial",          label: "Site / Engineering",  icon: LayoutGrid },
];

// Commercial sub-type options (FIX 2)
const COMMERCIAL_SUBTYPES = [
  {
    id: "building",
    label: "Commercial Building",
    desc: "Offices, retail, restaurants, warehouses",
    icon: Building2,
    view: "commercial_building",
  },
  {
    id: "site",
    label: "Site & Engineering",
    desc: "Parking lots, driveways, EV chargers, ADA ramps, sidewalks, roadwork",
    icon: HardHat,
    view: "commercial",
  },
  {
    id: "mixed",
    label: "Mixed Use / Other",
    desc: "Projects that span both categories or don't fit neatly",
    icon: Layers,
    view: "commercial_building",
  },
];

const CITY_PHONES = {
  "Coral Springs":    "(954) 344-1124",
  "Fort Lauderdale":  "(954) 828-6520",
  "Hollywood":        "(954) 921-3271",
  "Cooper City":      "(954) 434-4300",
};

// City banner
function CityBanner({ city }) {
  if (!city) return null;
  return (
    <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-xl border border-blue-100" style={{ background: "#EFF6FF" }}>
      <MapPin className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
      <span className="text-xs font-semibold text-blue-800">Showing permit requirements for {city}</span>
    </div>
  );
}

// Commercial sub-type selector (FIX 2)
function CommercialSubtypeSelector({ onSelect }) {
  return (
    <div className="mb-4 bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
      <p className="text-sm font-bold text-gray-800 mb-3">What type of commercial project?</p>
      <div className="grid sm:grid-cols-3 gap-3">
        {COMMERCIAL_SUBTYPES.map(sub => {
          const Icon = sub.icon;
          return (
            <button
              key={sub.id}
              onClick={() => onSelect(sub)}
              className="text-left p-3.5 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center mb-2 transition-colors">
                <Icon className="w-4 h-4 text-gray-600 group-hover:text-blue-700" />
              </div>
              <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-900 leading-tight mb-1">{sub.label}</p>
              <p className="text-xs text-gray-500 leading-snug">{sub.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function PermitGuide() {
  const urlParams = new URLSearchParams(window.location.search);
  const urlCity = urlParams.get("city") || "";
  const urlCities = urlParams.get("cities");
  const urlPropertyType = urlParams.get("propertyType") || "residential";
  const urlZone = urlParams.get("zone") || "";
  const CITIES = urlCity ? [urlCity] : (urlCities ? urlCities.split(",").map(s => s.trim()) : DEFAULT_CITIES);
  const singleCity = CITIES.length === 1;

  const [propertyType, setPropertyType] = useState(urlPropertyType);
  const [commercialSubtype, setCommercialSubtype] = useState(null); // null = show selector
  const [residentialView, setResidentialView] = useState("front");
  const [commercialView, setCommercialView] = useState("commercial");
  const [showHighlights, setShowHighlights] = useState(true);
  const [panelOpen, setPanelOpen] = useState(!!urlZone);
  const [selectedPermit, setSelectedPermit] = useState(null);
  const [city, setCity] = useState(urlCity || sessionStorage.getItem("selectedCity") || "Weston");
  const [showPhotoAnalyzer, setShowPhotoAnalyzer] = useState(false);
  const [ordinancesPanelOpen, setOrdinancesPanelOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiInitialMessage, setAiInitialMessage] = useState("");

  const { data: allPermits = [] } = useQuery({
    queryKey: ["supabase-permit-types", city],
    queryFn: () => fetchPermitTypes(city),
    staleTime: 5 * 60 * 1000,
  });

  const activeView = propertyType === "residential" ? residentialView : commercialView;
  const activeViews = propertyType === "residential" ? RESIDENTIAL_VIEWS : COMMERCIAL_VIEWS;

  const setActiveView = (v) => {
    if (propertyType === "residential") setResidentialView(v);
    else setCommercialView(v);
  };

  const handlePropertyTypeChange = (type) => {
    setPropertyType(type);
    if (type === "commercial") setCommercialSubtype(null); // reset to show selector
  };

  const handleCommercialSubtypeSelect = (sub) => {
    setCommercialSubtype(sub);
    setCommercialView(sub.view);
  };

  const handleZoneClick = (zoneLabel, zoneDesc) => {
    const mapZone = LABEL_TO_MAP_ZONE[zoneLabel];
    const matching = mapZone ? allPermits.filter(p => p.map_zone === mapZone) : [];
    if (matching.length === 1) {
      setSelectedPermit(matching[0]);
    } else if (matching.length > 1) {
      const exact = matching.find(p => p.name === zoneLabel) || matching[0];
      setSelectedPermit({ ...exact, _allMatching: matching });
    } else {
      setSelectedPermit({ name: zoneLabel, description: zoneDesc || "", typical_requirements: [], documents_needed: [], inspections_required: [] });
    }
  };

  // Filter permits for panel based on commercial subtype (FIX 2)
  const COMMERCIAL_BUILDING_CATS = ["building", "electrical", "plumbing", "fire", "certificate"];
  const COMMERCIAL_SITE_CATS = ["engineering", "planning", "additional"];

  const panelPermits = (() => {
    if (propertyType !== "commercial" || !commercialSubtype) return allPermits;
    if (commercialSubtype.id === "building") return allPermits.filter(p => COMMERCIAL_BUILDING_CATS.includes(p.category));
    if (commercialSubtype.id === "site") return allPermits.filter(p => COMMERCIAL_SITE_CATS.includes(p.category));
    return allPermits; // mixed
  })();

  return (
    <div className="px-3 sm:px-6 py-4 sm:py-8 pb-20 md:pb-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl sm:text-3xl font-extrabold text-gray-800 tracking-tight">Visual Permit Guide</h1>
        <p className="text-gray-600 mt-0.5 text-xs sm:text-base">Tap any highlighted area to see permit requirements, documents, and estimated fees.</p>
        <p className="mt-1 text-xs sm:text-sm" style={{ color: "#64748B" }}>A permit is the city's official OK to start your project.</p>
      </div>

      {/* ── Controls ── */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-3 mb-4 space-y-3">

        {/* Row 1: Property Type + City together */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider w-16 flex-shrink-0">Property</span>
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => handlePropertyTypeChange("residential")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                propertyType === "residential" ? "bg-blue-700 text-white shadow-sm" : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              Residential
            </button>
            <button
              onClick={() => handlePropertyTypeChange("commercial")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                propertyType === "commercial" ? "bg-blue-700 text-white shadow-sm" : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Commercial / Business
            </button>
          </div>
        </div>

        {/* Row 2: View */}
        {(propertyType === "residential" || commercialSubtype) && (
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
        )}

        {/* Row 3: Utility controls */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-100">
          <button
            onClick={() => setShowHighlights(!showHighlights)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${showHighlights ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-gray-50 border-gray-200 text-gray-600"}`}
          >
            {showHighlights ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showHighlights ? "Hide Zones" : "Show Zones"}
          </button>

          <button
            onClick={() => setPanelOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <List className="w-3.5 h-3.5" />
            Browse All Permits
          </button>

          <button
            onClick={() => setOrdinancesPanelOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Code of Ordinances
          </button>

          {/* City selector (FIX 3) */}
          {!singleCity && (
            <div className="ml-auto flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-0.5">Select your city:</span>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                <Select value={city} onValueChange={(val) => { setCity(val); if (val) sessionStorage.setItem("selectedCity", val); }}>
                  <SelectTrigger className="w-44 sm:w-52 rounded-xl h-9 text-sm font-medium border-blue-200">
                    <SelectValue placeholder="Choose city..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CITIES.map(c => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Persistent city context banner */}
      <CityBanner city={city} />

      {/* FIX 2: Commercial sub-type selector */}
      {propertyType === "commercial" && !commercialSubtype && (
        <CommercialSubtypeSelector onSelect={handleCommercialSubtypeSelect} />
      )}

      {/* Commercial sub-type indicator (when selected) */}
      {propertyType === "commercial" && commercialSubtype && (
        <div className="mb-3 flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 rounded-xl border border-indigo-100">
            <commercialSubtype.icon className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-xs font-medium text-indigo-700">{commercialSubtype.label}: {commercialSubtype.desc}</span>
          </div>
          <button
            onClick={() => setCommercialSubtype(null)}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            Change type
          </button>
        </div>
      )}

      {/* House diagram — only show when residential OR commercial subtype is selected */}
      {(propertyType === "residential" || commercialSubtype) && (
        <>
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
              <StandalonePhotoAnalyzer onClose={() => setShowPhotoAnalyzer(false)} permits={allPermits} />
            </div>
          )}
        </>
      )}

      {selectedPermit && (
        <PermitPopup
          permit={selectedPermit}
          city={city}
          userMode="homeowner"
          onClose={() => setSelectedPermit(null)}
        />
      )}

      <PermitsPanel
        permits={panelPermits}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onSelectPermit={(p) => { setSelectedPermit(p); setPanelOpen(false); }}
        initialSearch={urlZone}
      />

      {panelOpen && (
        <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setPanelOpen(false)} />
      )}

      <OrdinancesPanel
        open={ordinancesPanelOpen}
        onClose={() => setOrdinancesPanelOpen(false)}
        city={city}
        onAskAI={(msg) => { setAiInitialMessage(msg); setAiOpen(true); }}
      />

      <AIDrawer
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        currentPageName="PermitGuide"
        initialMessage={aiInitialMessage}
      />
    </div>
  );
}