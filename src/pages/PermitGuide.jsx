import React, { useState } from "react";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import {
  Home, Eye, EyeOff, List, MapPin, BookOpen, X, ArrowRight,
  Building2, Sparkles, Camera, HardHat, Layers, Bell,
  LayoutDashboard, FolderOpen, ChevronRight
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCities, parseServices } from "@/hooks/useCities";
import HouseView from "../components/map/HouseView";
import PermitPopup from "../components/map/PermitPopup";
import PermitsPanel from "../components/map/PermitsPanel";
import StandalonePhotoAnalyzer from "../components/map/StandalonePhotoAnalyzer";
import OrdinancesPanel from "../components/map/OrdinancesPanel";
import AIDrawer from "../components/ai/AIDrawer";
import RoofingSubtype from "../components/permits/RoofingSubtype";
import PrivateProviderStep from "../components/permits/PrivateProviderStep";
import { Link } from "react-router-dom";

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


const LABEL_TO_MAP_ZONE = {
  "Roof / Re-Roof": "roof", "Solar Panels": "roof", "Garage Door": "garage",
  "Window Replacement": "windows", "Door Replacement": "windows",
  "Pool & Spa": "pool", "Pool Equipment": "pool", "Pool Deck": "pool",
  "Fence / Gate": "fence", "A/C Replacement": "hvac", "HVAC / Mechanical": "hvac",
  "Electrical Service": "electrical", "Irrigation System": "backyard",
  "Patio / Slab": "backyard", "Covered Patio": "backyard", "Pergola": "backyard",
  "Driveway (Paver)": "driveway", "Driveway / Walkway": "driveway",
  "Walkway / Sidewalk": "driveway", "Sidewalk / Curb": "driveway",
  "Residential Remodel": "interior", "Residential Addition": "structure",
  "Plumbing": "interior", "Sign Permit": "structure", "Parking Lot / Paving": "driveway",
  "EV Charging Station": "electrical", "Light Pole / Utility": "electrical",
  "Underground Drainage": "backyard", "Asphalt / Milling & Paving": "driveway",
  "Seal Coat & Striping": "driveway", "Pavement / Earthwork": "driveway",
  "Utility Boring": "structure",
};

const SB_HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  Prefer: "count=none",
  Range: "0-999",
};

const _cityTableCache = {};
async function getPermitTable(cityName) {
  if (_cityTableCache[cityName]) return _cityTableCache[cityName];
  const res = await fetch(`${SUPABASE_URL}/rest/v1/cities?name=eq.${encodeURIComponent(cityName)}&select=permit_table_name&limit=1`, { headers: SB_HEADERS });
  const data = await res.json();
  const table = (Array.isArray(data) && data[0]?.permit_table_name) || `${cityName.toLowerCase().replace(/ /g, "_")}_permit_types`;
  _cityTableCache[cityName] = table;
  return table;
}

async function fetchPermitTypes(city = "Weston") {
  const table = await getPermitTable(city);
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&order=category,name`, { headers: SB_HEADERS });
  const data = await res.json();
  return (Array.isArray(data) ? data : []).map(p => ({
    ...p,
    typical_requirements: typeof p.typical_requirements === "string" ? JSON.parse(p.typical_requirements) : (p.typical_requirements || []),
    documents_needed:     typeof p.documents_needed === "string"     ? JSON.parse(p.documents_needed)     : (p.documents_needed || []),
    inspections_required: typeof p.inspections_required === "string" ? JSON.parse(p.inspections_required) : (p.inspections_required || []),
  }));
}

const PROPERTY_TYPES = [
  { value: "residential", label: "Single-Family" },
  { value: "commercial",  label: "Commercial" },
  { value: "condo",       label: "Condo" },
];

const RESIDENTIAL_VIEW_OPTIONS = [
  { value: "front", label: "Front View" },
  { value: "back",  label: "Back View" },
  { value: "eagle", label: "Floor Plan" },
];

const COMMERCIAL_VIEW_OPTIONS = [
  { value: "commercial_building", label: "Building" },
  { value: "commercial",          label: "Site / Eng." },
];

const COMMERCIAL_SUBTYPES = [
  { id: "building", label: "Commercial Building", desc: "Offices, retail, restaurants, warehouses", icon: Building2, view: "commercial_building" },
  { id: "site",     label: "Site & Engineering",  desc: "Parking lots, driveways, EV chargers, sidewalks", icon: HardHat, view: "commercial" },
  { id: "mixed",    label: "Mixed Use / Other",   desc: "Projects spanning both categories", icon: Layers, view: "commercial_building" },
];

const PERMIT_LIFECYCLE_STEPS = [
  { n: 1, title: "Pre-Check",     desc: "Verify local zoning and neighbor clearance." },
  { n: 2, title: "Submission",    desc: "Digital blueprints and site plan upload." },
  { n: 3, title: "Review & Pay",  desc: "City engineer review and fee processing." },
];

function BottomNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-2 z-50">
      <Link to="/" className="flex flex-col items-center gap-1 px-4 py-1 no-underline">
        <Home className="w-5 h-5 text-gray-400 mt-1.5" />
        <span className="text-xs text-gray-400">Home</span>
      </Link>
      <Link to="/ApplyForPermit" className="flex flex-col items-center gap-1 px-4 py-1 no-underline">
        <div className="w-8 h-8 rounded-xl bg-[#cfe0f0] flex items-center justify-center">
          <LayoutDashboard className="w-4 h-4 text-[#003466]" />
        </div>
        <span className="text-xs font-semibold text-[#003466]">Dashboard</span>
      </Link>
      <Link to="/MyProjects" className="flex flex-col items-center gap-1 px-4 py-1 no-underline">
        <FolderOpen className="w-5 h-5 text-gray-400 mt-1.5" />
        <span className="text-xs text-gray-400">Projects</span>
      </Link>
    </div>
  );
}

export default function PermitGuide() {
  const urlParams      = new URLSearchParams(window.location.search);
  const urlCity        = urlParams.get("city") || "";
  const urlPropertyType = urlParams.get("propertyType") || "residential";
  const urlZone        = urlParams.get("zone") || "";

  const { cities, loading: citiesLoading } = useCities();
  const permitCities = cities.filter(c => {
    const svcs = parseServices(c.enabled_services);
    return svcs.includes("permit_types") || svcs.includes("permit_guide") || svcs.length === 0;
  });
  const CITIES     = urlCity ? [urlCity] : permitCities.map(c => c.name);
  const singleCity = !!urlCity;

  const [propertyType, setPropertyType]   = useState(urlPropertyType);
  const [commercialSubtype, setCommercialSubtype] = useState(null);
  const [residentialView, setResidentialView] = useState("front");
  const [commercialView, setCommercialView]   = useState("commercial");
  const [showHighlights, setShowHighlights]   = useState(true);
  const [panelOpen, setPanelOpen]             = useState(!!urlZone);
  const [selectedPermit, setSelectedPermit]   = useState(null);
  const [city, setCity]                       = useState(urlCity || sessionStorage.getItem("selectedCity") || "Weston");
  const [showPhotoAnalyzer, setShowPhotoAnalyzer] = useState(false);
  const [ordinancesPanelOpen, setOrdinancesPanelOpen] = useState(false);
  const [aiOpen, setAiOpen]                   = useState(false);
  const [aiInitialMessage, setAiInitialMessage] = useState("");
  const [roofingSubtype, setRoofingSubtype]   = useState(null);
  const [privateProvider, setPrivateProvider] = useState(null);
  const [showRoofingStep, setShowRoofingStep] = useState(false);
  const [showPrivateProviderStep, setShowPrivateProviderStep] = useState(false);
  const [zoneInfoPanel, setZoneInfoPanel]     = useState(null);

  const { data: allPermits = [] } = useQuery({
    queryKey: ["supabase-permit-types", city],
    queryFn:  () => fetchPermitTypes(city),
    staleTime: 5 * 60 * 1000,
  });

  const isResidential  = propertyType === "residential" || propertyType === "condo";
  const activeView     = isResidential ? residentialView : commercialView;
  const activeViewOptions = isResidential ? RESIDENTIAL_VIEW_OPTIONS : COMMERCIAL_VIEW_OPTIONS;

  const setActiveView = (v) => { if (isResidential) setResidentialView(v); else setCommercialView(v); };

  const handlePropertyTypeChange = (type) => {
    setPropertyType(type);
    if (type === "commercial") setCommercialSubtype(null);
    setShowRoofingStep(false);
    setShowPrivateProviderStep(false);
    setRoofingSubtype(null);
    setPrivateProvider(null);
  };

  const handleZoneClick = (zoneLabel, zoneDesc) => {
    const isRoofing = zoneLabel.toLowerCase().includes("roof");
    setShowRoofingStep(isRoofing);
    setShowPrivateProviderStep(true);
    setRoofingSubtype(null);
    setPrivateProvider(null);
    const mapZone = LABEL_TO_MAP_ZONE[zoneLabel];
    const matching = mapZone ? allPermits.filter(p => p.map_zone === mapZone) : [];
    const zoneDescription = ZONE_INFO[zoneLabel] || zoneDesc || "";
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

  const COMMERCIAL_BUILDING_CATS = ["building", "electrical", "plumbing", "fire", "certificate"];
  const COMMERCIAL_SITE_CATS     = ["engineering", "planning", "additional"];

  const panelPermits = (() => {
    if (propertyType !== "commercial" || !commercialSubtype) return allPermits;
    if (commercialSubtype.id === "building") return allPermits.filter(p => COMMERCIAL_BUILDING_CATS.includes(p.category));
    if (commercialSubtype.id === "site")     return allPermits.filter(p => COMMERCIAL_SITE_CATS.includes(p.category));
    return allPermits;
  })();

  return (
    <div className="min-h-screen bg-[#f7f9fb] pb-24">
      {/* Header */}
      <div className="bg-white px-5 pt-10 pb-5 border-b border-[#c3c6d1]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xl" style={{ color: "#003466", fontFamily: "'Hanken Grotesk', sans-serif" }}>OpenPermit</span>
          </div>
          <Bell className="w-5 h-5 text-gray-400" />
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Permit Checklist</h1>
        <p className="text-sm text-gray-400 leading-relaxed mb-4">
          Review the documents and requirements needed to apply for your permit. Mark each item complete as you prepare it.
        </p>

        {/* Property type toggle */}
        <div className="flex gap-2">
          {PROPERTY_TYPES.map(pt => (
            <button key={pt.value} onClick={() => handlePropertyTypeChange(pt.value)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  propertyType === pt.value
                    ? "bg-[#003466] text-white shadow-sm"
                    : "bg-white border border-[#c3c6d1] text-[#424750] hover:border-[#003466]"
              }`}>
              {pt.label}
            </button>
          ))}
        </div>

        {/* City selector */}
        {!singleCity && (
          <div className="flex items-center gap-2 mt-3">
            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <Select value={city} onValueChange={(val) => { setCity(val); sessionStorage.setItem("selectedCity", val); }}>
              <SelectTrigger className="h-8 text-xs rounded-xl border-gray-200 bg-gray-50 w-44">
                <SelectValue placeholder="Choose city..." />
              </SelectTrigger>
              <SelectContent>
                {citiesLoading
                  ? <SelectItem value="_loading" disabled>Loading...</SelectItem>
                  : CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)
                }
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="w-full max-w-5xl mx-auto px-4 pt-5 space-y-5">
        {/* Commercial subtype selector */}
        {propertyType === "commercial" && !commercialSubtype && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-sm font-bold text-gray-800 mb-3">What type of commercial project?</p>
            <div className="space-y-2">
              {COMMERCIAL_SUBTYPES.map(sub => {
                const Icon = sub.icon;
                return (
                  <button key={sub.id} onClick={() => { setCommercialSubtype(sub); setCommercialView(sub.view); }}
                    className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-gray-100 hover:border-[#a9c5e0] hover:bg-[#eaf1f8]/40 transition-all text-left">
                    <div className="w-10 h-10 rounded-xl bg-[#eaf1f8] flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-[#003466]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{sub.label}</p>
                      <p className="text-xs text-gray-400">{sub.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {propertyType === "commercial" && commercialSubtype && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-[#eaf1f8] rounded-2xl border border-[#cfe0f0]">
            <commercialSubtype.icon className="w-4 h-4 text-[#003466] shrink-0" />
            <span className="text-xs font-medium text-[#003466] flex-1">{commercialSubtype.label}</span>
            <button onClick={() => setCommercialSubtype(null)} className="text-xs text-[#003466] hover:text-[#003466] underline">Change</button>
          </div>
        )}

        {showRoofingStep && <RoofingSubtype onSelect={setRoofingSubtype} />}
        {showPrivateProviderStep && <PrivateProviderStep onAnswer={setPrivateProvider} />}

        {/* View toggle (front/back/floor plan) */}
        {(isResidential || commercialSubtype) && activeViewOptions.length > 1 && (
          <div className="flex gap-1.5 bg-white rounded-2xl border border-gray-100 shadow-sm p-1">
            {activeViewOptions.map(opt => (
              <button key={opt.value} onClick={() => setActiveView(opt.value)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeView === opt.value ? "bg-[#003466] text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {/* House diagram */}
        {(isResidential || commercialSubtype) && (
          <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
            <HouseView view={activeView} showHighlights={showHighlights} onZoneClick={handleZoneClick} />
            <div className="flex gap-2 p-3 border-t border-gray-50">
              <button onClick={() => setShowHighlights(!showHighlights)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-all">
                {showHighlights ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showHighlights ? "Hide Zones" : "Show Zones"}
              </button>
              <button onClick={() => setPanelOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-all">
                <List className="w-3.5 h-3.5" /> Browse All
              </button>
              <button onClick={() => setOrdinancesPanelOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-all">
                <BookOpen className="w-3.5 h-3.5" /> Codes
              </button>
            </div>
          </div>
        )}

        {/* Permit Lifecycle card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-base font-bold text-gray-900 mb-4">Permit Lifecycle</h2>
          <div className="space-y-4">
            {PERMIT_LIFECYCLE_STEPS.map((step, i) => (
              <div key={step.n} className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-sm" style={{ background: "#003466" }}>
                  {step.n}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-sm">{step.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{step.desc}</p>
                </div>
                {i < PERMIT_LIFECYCLE_STEPS.length - 1 && (
                  <div className="absolute ml-4 mt-9 w-0.5 h-4 bg-gray-100" style={{ display: "none" }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* AI Photo Analysis */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#eaf1f8] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-[#003466]" />
            </div>
            <div>
              <p className="font-bold text-gray-800 text-sm">AI Smart Check</p>
              <p className="text-xs text-gray-400">Upload a photo — AI identifies permits needed</p>
            </div>
          </div>
          {!showPhotoAnalyzer ? (
            <button onClick={() => setShowPhotoAnalyzer(true)}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-[#cfe0f0] rounded-xl py-3.5 text-[#003466] hover:border-[#003466] transition-colors text-sm font-semibold">
              <Camera className="w-4 h-4" /> Upload or Take Photo
            </button>
          ) : (
            <StandalonePhotoAnalyzer onClose={() => setShowPhotoAnalyzer(false)} permits={allPermits} city={city} />
          )}
        </div>

        {/* Need a Pro? CTA */}
        <div className="rounded-2xl p-5 text-white" style={{ background: "#003466" }}>
          <h2 className="text-lg font-extrabold mb-2">Need a Pro?</h2>
          <p className="text-[#cfe0f0] text-sm leading-relaxed mb-4">
            Our permit expediters can handle the paperwork for you, cutting approval times by up to 40%.
          </p>
          <button
            onClick={() => { setAiInitialMessage("I need help finding a permit expediter."); setAiOpen(true); }}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-white rounded-2xl text-[#003466] font-bold text-sm hover:bg-[#eaf1f8] transition-colors">
            Get Free Quote <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modals & panels */}
      {selectedPermit && (
        <PermitPopup permit={selectedPermit} city={city} userMode="homeowner"
          onClose={() => { setSelectedPermit(null); setZoneInfoPanel(null); }} />
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

      <AIDrawer open={aiOpen} onClose={() => setAiOpen(false)} currentPageName="PermitChecklist" initialMessage={aiInitialMessage} />

      {zoneInfoPanel && !selectedPermit && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="font-bold text-gray-900 text-sm">{zoneInfoPanel.label}</h3>
              <button onClick={() => setZoneInfoPanel(null)} className="text-gray-400 hover:text-gray-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed mb-3">{zoneInfoPanel.description}</p>
            <a href={`/PermitGuide?city=${encodeURIComponent(city)}&zone=${encodeURIComponent(zoneInfoPanel.label)}`}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-sm font-bold no-underline"
              style={{ background: "#003466" }}>
              View Full Requirements <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}