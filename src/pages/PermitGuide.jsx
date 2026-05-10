import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Home, Eye, EyeOff, List, MapPin, ArrowLeft, LayoutGrid, Building2, Sparkles, Camera, HardHat, Layers, BookOpen, X, ArrowRight } from "lucide-react";

const ZONE_INFO = {
  "Roof / Re-Roof": "Required for any roof replacement or repair over 25% of roof area. In Broward County (HVHZ), all roofing must meet 170mph wind resistance standards.",
  "Solar Panels": "Electrical and building permits required. HOAs cannot prohibit solar installation under Florida Statute 163.04.",
  "Window Replacement": "Impact-resistant windows required in HVHZ (all of Broward County). Permit required for all window replacements.",
  "Door Replacement": "Permit required for exterior door replacements. Impact-rated doors required in HVHZ.",
  "Garage Door": "Permit required. Must meet wind load requirements for HVHZ (170mph).",
  "A/C Replacement": "Mechanical permit required. NOC required if job value exceeds $15,000 in Weston.",
  "Electrical Service": "Electrical permit required for panel upgrades, new circuits, or service changes.",
  "Pool & Spa": "Building, electrical, and plumbing permits required. Florida barrier law requires 4ft fence enclosure within 90 days.",
  "Pool Equipment": "Permit required for equipment replacement. Electrical permit needed if wiring is involved.",
  "Driveway / Walkway": "Permit required for new driveways or significant expansions. Check setback requirements.",
  "Driveway (Paver)": "Permit required for new driveways or significant expansions. Check setback requirements.",
  "Walkway / Sidewalk": "Permit required for new driveways or significant expansions. Check setback requirements.",
  "Fence / Gate": "Permit required for fence and gate installation. Height and setback rules vary by city.",
  "Patio / Slab": "Permit required for new patio slabs or significant concrete work.",
  "Covered Patio": "Building permit required for covered outdoor structures.",
  "Pergola": "Permit required for pergola or gazebo structures.",
  "Residential Remodel": "Building permit required for interior renovations affecting structure, electrical, or plumbing.",
  "Residential Addition": "Building permit required for any addition to the living space.",
  "Plumbing": "Plumbing permit required for new fixtures, drain work, or supply line changes.",
  "Pool Deck": "Permit required for pool deck construction or resurfacing.",
  "Irrigation System": "Permit required for new irrigation or sprinkler systems.",
};
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCities, cityHasService } from "@/hooks/useCities";
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

const SB_HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  Prefer: "count=none",
  Range: "0-999",
};

// Fetch permit_table_name dynamically from cities table
const _cityTableCache = {};
async function getPermitTable(cityName) {
  if (_cityTableCache[cityName]) return _cityTableCache[cityName];
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/cities?name=eq.${encodeURIComponent(cityName)}&select=permit_table_name&limit=1`,
    { headers: SB_HEADERS }
  );
  const data = await res.json();
  const table = (Array.isArray(data) && data[0]?.permit_table_name) || `${cityName.toLowerCase().replace(/ /g, "_")}_permit_types`;
  _cityTableCache[cityName] = table;
  return table;
}

async function fetchPermitTypes(city = "Weston") {
  const table = await getPermitTable(city);
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?select=*&order=category,name`,
    { headers: SB_HEADERS }
  );
  const data = await res.json();
  return (Array.isArray(data) ? data : []).map(p => ({
    ...p,
    typical_requirements: typeof p.typical_requirements === "string" ? JSON.parse(p.typical_requirements) : (p.typical_requirements || []),
    documents_needed:     typeof p.documents_needed === "string"     ? JSON.parse(p.documents_needed)     : (p.documents_needed || []),
    inspections_required: typeof p.inspections_required === "string" ? JSON.parse(p.inspections_required) : (p.inspections_required || []),
  }));
}



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
  const urlPropertyType = urlParams.get("propertyType") || "residential";
  const urlZone = urlParams.get("zone") || "";

  const { cities, loading: citiesLoading } = useCities();
  // Filter to only cities with permit_types service enabled
  const permitCities = cities.filter(c => {
    const svcs = Array.isArray(c.enabled_services) ? c.enabled_services : (typeof c.enabled_services === "string" ? JSON.parse(c.enabled_services || "[]") : []);
    return svcs.includes("permit_types") || svcs.includes("permit_guide") || svcs.length === 0;
  });
  const CITIES = urlCity ? [urlCity] : permitCities.map(c => c.name);
  const singleCity = !!urlCity;

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

  const [zoneInfoPanel, setZoneInfoPanel] = useState(null);

  const handleZoneClick = (zoneLabel, zoneDesc) => {
    const mapZone = LABEL_TO_MAP_ZONE[zoneLabel];
    const matching = mapZone ? allPermits.filter(p => p.map_zone === mapZone) : [];
    const zoneDescription = ZONE_INFO[zoneLabel] || zoneDesc || "";

    // Show quick info panel
    setZoneInfoPanel({ label: zoneLabel, description: zoneDescription });

    if (matching.length === 1) {
      setSelectedPermit(matching[0]);
    } else if (matching.length > 1) {
      const exact = matching.find(p => p.name === zoneLabel) || matching[0];
      setSelectedPermit({ ...exact, _allMatching: matching });
    } else {
      setSelectedPermit({ name: zoneLabel, description: zoneDescription, typical_requirements: [], documents_needed: [], inspections_required: [] });
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
    <div className="pb-20 md:pb-8" style={{ backgroundColor: "#f9f9fc" }}>
      {/* Hero Header */}
      <div className="px-5 pt-8 pb-7" style={{ background: "#00020c" }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.45)" }}>Visual Permit Guide</p>
              <h1 className="font-bold text-white leading-tight mb-2" style={{ fontSize: "clamp(22px, 4vw, 30px)" }}>Find the Right Permits</h1>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.55)", maxWidth: 480 }}>Select your city, property type, and project type to see the permits required, a document checklist, and an estimated fee — before you visit the building department.</p>
            </div>
            {!singleCity && (
              <div className="flex items-center gap-1.5 mt-1">
                <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: "rgba(255,255,255,0.4)" }} />
                <Select value={city} onValueChange={(val) => { setCity(val); if (val) sessionStorage.setItem("selectedCity", val); }}>
                  <SelectTrigger className="w-44 rounded-xl h-9 text-sm bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Choose city..." />
                  </SelectTrigger>
                  <SelectContent>
                    {citiesLoading
                      ? <SelectItem value="_loading" disabled>Loading cities...</SelectItem>
                      : CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)
                    }
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-8 pt-4">
        {/* Desktop two-column layout */}
        <div className="md:flex md:gap-6 md:items-start">

          {/* Left sidebar */}
          <div className="md:w-64 md:shrink-0 space-y-4">

            {/* Property type + view controls */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-3 space-y-3">
              <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                <button
                  onClick={() => handlePropertyTypeChange("residential")}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    propertyType === "residential" ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <Home className="w-3.5 h-3.5" />
                  Single-Family
                </button>
                <button
                  onClick={() => handlePropertyTypeChange("commercial")}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    propertyType === "commercial" ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  Commercial
                </button>
              </div>

              {(propertyType === "residential" || commercialSubtype) && (
                <div className="flex bg-gray-100 rounded-xl p-1 gap-1 flex-col">
                  {activeViews.map(v => (
                    <button
                      key={v.id}
                      onClick={() => setActiveView(v.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                        activeView === v.id ? "bg-blue-700 text-white shadow-sm" : "text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      <v.icon className="w-3.5 h-3.5" />
                      {v.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="space-y-2 pt-1 border-t border-gray-100">
                <button
                  onClick={() => setShowHighlights(!showHighlights)}
                  className={`w-full flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${showHighlights ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-gray-50 border-gray-200 text-gray-600"}`}
                >
                  {showHighlights ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showHighlights ? "Hide Zone Markers" : "Show Zone Markers"}
                </button>
                <button
                  onClick={() => setPanelOpen(true)}
                  className="w-full flex items-center gap-1.5 px-3 py-2 rounded-xl border border-blue-200 bg-blue-50 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  <List className="w-3.5 h-3.5" />
                  Browse All Permits
                </button>
                <button
                  onClick={() => setOrdinancesPanelOpen(true)}
                  className="w-full flex items-center gap-1.5 px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Code of Ordinances
                </button>
              </div>
            </div>

            {/* AI Smart Check panel (desktop sidebar) */}
            <div className="rounded-2xl p-4 text-white" style={{ background: "linear-gradient(135deg, #0D2B5E 0%, #1E3A8A 100%)" }}>
              <p className="font-bold text-sm mb-1 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-300" />
                AI Smart Check
              </p>
              <p className="text-blue-200 text-xs leading-relaxed mb-3">
                Upload a photo of your proposed project area. Our AI will identify potential permit conflicts automatically.
              </p>
              {!showPhotoAnalyzer ? (
                <button
                  onClick={() => setShowPhotoAnalyzer(true)}
                  className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-blue-400/50 rounded-xl py-4 text-blue-200 hover:border-blue-300 hover:text-white transition-colors text-xs font-medium"
                >
                  <Camera className="w-4 h-4" />
                  Upload or Take Photo
                </button>
              ) : (
                <StandalonePhotoAnalyzer onClose={() => setShowPhotoAnalyzer(false)} permits={allPermits} />
              )}
            </div>
          </div>

          {/* Main content area */}
          <div className="flex-1 min-w-0 mt-4 md:mt-0">
            <CityBanner city={city} />

            {propertyType === "commercial" && !commercialSubtype && (
              <CommercialSubtypeSelector onSelect={handleCommercialSubtypeSelect} />
            )}

            {propertyType === "commercial" && commercialSubtype && (
              <div className="mb-3 flex items-center gap-2 flex-wrap">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 rounded-xl border border-indigo-100">
                  <commercialSubtype.icon className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="text-xs font-medium text-indigo-700">{commercialSubtype.label}: {commercialSubtype.desc}</span>
                </div>
                <button onClick={() => setCommercialSubtype(null)} className="text-xs text-gray-400 hover:text-gray-600 underline">
                  Change type
                </button>
              </div>
            )}

            {(propertyType === "residential" || commercialSubtype) && (
              <>
                <HouseView view={activeView} showHighlights={showHighlights} onZoneClick={handleZoneClick} />

                {/* Mobile AI banner */}
                <div className="md:hidden mt-4">
                  {!showPhotoAnalyzer ? (
                    <button
                      onClick={() => setShowPhotoAnalyzer(true)}
                      className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 border-dashed border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                        <Camera className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-bold text-blue-900 text-sm flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" />AI Photo Analysis</p>
                        <p className="text-blue-800 text-xs mt-0.5">Upload a photo — AI identifies permits you need</p>
                      </div>
                    </button>
                  ) : (
                    <StandalonePhotoAnalyzer onClose={() => setShowPhotoAnalyzer(false)} permits={allPermits} />
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {selectedPermit && (
        <PermitPopup permit={selectedPermit} city={city} userMode="homeowner" onClose={() => { setSelectedPermit(null); setZoneInfoPanel(null); }} />
      )}

      <PermitsPanel
        permits={panelPermits} open={panelOpen} onClose={() => setPanelOpen(false)}
        onSelectPermit={(p) => { setSelectedPermit(p); setPanelOpen(false); }}
        initialSearch={urlZone} city={city}
      />
      {panelOpen && <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setPanelOpen(false)} />}

      <OrdinancesPanel
        open={ordinancesPanelOpen} onClose={() => setOrdinancesPanelOpen(false)}
        city={city} onAskAI={(msg) => { setAiInitialMessage(msg); setAiOpen(true); }}
      />

      <AIDrawer open={aiOpen} onClose={() => setAiOpen(false)} currentPageName="PermitGuide" initialMessage={aiInitialMessage} />

      {/* Zone Info Panel */}
      {zoneInfoPanel && !selectedPermit && (
        <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="font-bold text-gray-900 text-sm">{zoneInfoPanel.label}</h3>
              <button onClick={() => setZoneInfoPanel(null)} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed mb-3">{zoneInfoPanel.description}</p>
            <a
              href={`/PermitGuide?city=${encodeURIComponent(city)}&zone=${encodeURIComponent(zoneInfoPanel.label)}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #0D2B5E, #0F3575)" }}
            >
              View Full Requirements <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}