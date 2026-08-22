import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, EyeOff, List, MapPin, BookOpen, X, ArrowRight,
  Building2, Sparkles, Camera, HardHat, Layers, Bell, ChevronRight,
  Phone, ExternalLink, Info
} from "lucide-react";
import { useCities, cityUsesBrowardCounty } from "@/hooks/useCities";
import { fetchPermitTypes, resolveCity, rememberCity } from "@/lib/permitTypes";
import HouseView from "../components/map/HouseView";
import PermitPopup from "../components/map/PermitPopup";
import PermitsPanel from "../components/map/PermitsPanel";
import StandalonePhotoAnalyzer from "../components/map/StandalonePhotoAnalyzer";
import OrdinancesPanel from "../components/map/OrdinancesPanel";
import AIDrawer from "../components/ai/AIDrawer";
import CityBar from "@/components/CityBar";
import { C, F, T } from "@/lib/theme";
import RoofingSubtype from "../components/permits/RoofingSubtype";
import PrivateProviderStep from "../components/permits/PrivateProviderStep";

const ZONE_INFO = {
  "Roof / Re-Roof": "Required for roof replacement, and for repairs above a threshold your city sets. Broward is a High-Velocity Hurricane Zone, so roofing products and fastening are held to stricter standards — see the county rules on the permit.",
  "Solar Panels": "Electrical and building permits required. HOAs cannot prohibit solar installation under Florida Statute 163.04.",
  "Window Replacement": "Impact-resistant windows required in HVHZ (all of Broward County). Permit required for all window replacements.",
  "Door Replacement": "Permit required for exterior door replacements. Impact-rated doors required in HVHZ.",
  "Garage Door": "Permit required. Must meet wind load requirements for HVHZ (170mph).",
  "A/C Replacement": "Mechanical permit required. A Notice of Commencement may also be needed depending on the job value — the threshold differs for HVAC.",
  "Electrical Service": "Electrical permit required for panel upgrades, new circuits, or service changes.",
  "Pool & Spa": "Building, electrical, and plumbing permits required. Florida's Pool Safety Act also requires a barrier — see the county rules on the permit for the current requirement.",
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


function CityNotCovered({ city, cityRow }) {
  const county = cityUsesBrowardCounty(cityRow);
  const phone  = cityRow?.building_department_phone;
  const portal = cityRow?.portal_url;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#eaf1f8] flex items-center justify-center shrink-0">
          <Info className="w-5 h-5 text-[#003466]" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-gray-900">
            {county
              ? `Broward County handles permits for ${city}`
              : `We haven't loaded ${city}'s permits yet`}
          </h2>
          <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
            {county
              ? `${city} has no separate building department. Applications, fees and inspections all go through the Broward County Building Division.`
              : `${city} runs its own building department, but we don't have its permit types on file. Contact them directly — or switch to a city we cover to see how the guide works.`}
          </p>

          <div className="flex flex-wrap gap-2 mt-4">
            {portal && (
              <a href={portal} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white no-underline hover:opacity-90 transition-opacity"
                style={{ background: "#003466" }}>
                <ExternalLink className="w-4 h-4" />
                {county ? "Broward County Building" : `${city} Building Department`}
              </a>
            )}
            {phone && (
              <a href={`tel:${phone.replace(/[^0-9]/g, "")}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 no-underline hover:bg-gray-50 transition-colors">
                <Phone className="w-4 h-4" /> {phone}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PermitGuide() {
  const urlParams      = new URLSearchParams(window.location.search);
  const urlCity        = urlParams.get("city") || "";
  const urlPropertyType = urlParams.get("propertyType") || "residential";
  const urlZone        = urlParams.get("zone") || "";

  const { cities } = useCities();

  const [propertyType, setPropertyType]   = useState(urlPropertyType);
  const [commercialSubtype, setCommercialSubtype] = useState(null);
  const [residentialView, setResidentialView] = useState("front");
  const [commercialView, setCommercialView]   = useState("commercial");
  const [showHighlights, setShowHighlights]   = useState(true);
  const [panelOpen, setPanelOpen]             = useState(!!urlZone);
  const [selectedPermit, setSelectedPermit]   = useState(null);
  const [city, setCity]                       = useState(resolveCity(urlCity));
  const [showPhotoAnalyzer, setShowPhotoAnalyzer] = useState(false);
  const [ordinancesPanelOpen, setOrdinancesPanelOpen] = useState(false);
  const [aiOpen, setAiOpen]                   = useState(false);
  const [aiInitialMessage, setAiInitialMessage] = useState("");
  const [roofingSubtype, setRoofingSubtype]   = useState(null);
  const [privateProvider, setPrivateProvider] = useState(null);
  const [showRoofingStep, setShowRoofingStep] = useState(false);
  const [showPrivateProviderStep, setShowPrivateProviderStep] = useState(false);
  const [zoneInfoPanel, setZoneInfoPanel]     = useState(null);

  const { data: allPermits = [], isLoading: permitsLoading } = useQuery({
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
    <div style={{ background: C.ground, fontFamily: F.body, color: C.ink }} className="pb-24">
      {/* The page used to open with a second "OpenPermit" wordmark sitting an
          inch below the real one in the app header, a bell that did nothing,
          and a third city selector. City now comes from the shared bar. */}
      {/* Always shown, even when a ?city= param pinned one. Arriving from a
          coverage link used to hide the switcher entirely, which left the
          reader in that city with no way out. */}
      <CityBar value={city} onChange={(val) => { setCity(val); rememberCity(val); }} />

      <div className="mx-auto max-w-[900px] px-4 pt-5">
        <h1 style={{ fontFamily: F.head, fontSize: T.title, fontWeight: 800, letterSpacing: "-0.02em" }}>
          Permit guide
        </h1>
        <p className="mt-1" style={{ color: C.muted, fontSize: T.small, lineHeight: 1.55 }}>
          Tap a part of the house to see what {city} requires for it — the documents, the
          inspections and what it costs.
        </p>

        {/* Property type toggle */}
        <div className="mt-4 flex gap-2">
          {PROPERTY_TYPES.map(pt => {
            const on = propertyType === pt.value;
            return (
              <button
                key={pt.value}
                onClick={() => handlePropertyTypeChange(pt.value)}
                aria-pressed={on}
                className="px-4 py-2 transition-colors"
                style={{
                  borderRadius: 999,
                  background: on ? C.brand : C.surface,
                  color: on ? "#fff" : C.muted,
                  border: `1px solid ${on ? C.brand : C.line}`,
                  fontFamily: F.head,
                  fontSize: T.small,
                  fontWeight: 700,
                }}
              >
                {pt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-auto w-full max-w-[900px] space-y-5 px-4 pt-5">
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
        {allPermits.length > 0 && (isResidential || commercialSubtype) && activeViewOptions.length > 1 && (
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

        {/* No permit data for this city — say so, and give a real next step */}
        {!permitsLoading && allPermits.length === 0 && (
          <CityNotCovered city={city} cityRow={cities.find(c => c.name === city)} />
        )}

        {/* House diagram */}
        {allPermits.length > 0 && (isResidential || commercialSubtype) && (
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

      <AIDrawer open={aiOpen} onClose={() => setAiOpen(false)} currentPageName="PermitGuide" initialMessage={aiInitialMessage} />

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

    </div>
  );
}