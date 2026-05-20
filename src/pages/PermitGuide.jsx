import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Home, Eye, EyeOff, List, MapPin, ArrowLeft, LayoutGrid, Building2, Sparkles, Camera, HardHat, Layers, BookOpen, X, ArrowRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCities } from "@/hooks/useCities";
import HouseView from "../components/map/HouseView";
import PermitPopup from "../components/map/PermitPopup";
import PermitsPanel from "../components/map/PermitsPanel";
import StandalonePhotoAnalyzer from "../components/map/StandalonePhotoAnalyzer";
import OrdinancesPanel from "../components/map/OrdinancesPanel";
import AIDrawer from "../components/ai/AIDrawer";
import RoofingSubtype from "../components/permits/RoofingSubtype";
import PrivateProviderStep from "../components/permits/PrivateProviderStep";
import PageHeader from "@/components/ui/PageHeader";
import Btn from "@/components/ui/Btn";
import Callout from "@/components/ui/Callout";
import SegmentedToggle from "@/components/ui/SegmentedToggle";

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
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&order=category,name`, { headers: SB_HEADERS });
  const data = await res.json();
  return (Array.isArray(data) ? data : []).map(p => ({
    ...p,
    typical_requirements: typeof p.typical_requirements === "string" ? JSON.parse(p.typical_requirements) : (p.typical_requirements || []),
    documents_needed:     typeof p.documents_needed === "string"     ? JSON.parse(p.documents_needed)     : (p.documents_needed || []),
    inspections_required: typeof p.inspections_required === "string" ? JSON.parse(p.inspections_required) : (p.inspections_required || []),
  }));
}

const RESIDENTIAL_VIEW_OPTIONS = [
  { value: "front", label: "Front View" },
  { value: "back",  label: "Back View" },
  { value: "eagle", label: "Floor Plan" },
];

const COMMERCIAL_VIEW_OPTIONS = [
  { value: "commercial_building", label: "Building" },
  { value: "commercial",          label: "Site / Eng." },
];

const PROPERTY_TYPE_OPTIONS = [
  { value: "residential", label: "Single-Family" },
  { value: "commercial",  label: "Commercial" },
  { value: "condo",       label: "Condo / HOA" },
];

const COMMERCIAL_SUBTYPES = [
  { id: "building", label: "Commercial Building", desc: "Offices, retail, restaurants, warehouses", icon: Building2, view: "commercial_building" },
  { id: "site",     label: "Site & Engineering",  desc: "Parking lots, driveways, EV chargers, ADA ramps, sidewalks, roadwork", icon: HardHat, view: "commercial" },
  { id: "mixed",    label: "Mixed Use / Other",   desc: "Projects that span both categories or don't fit neatly", icon: Layers, view: "commercial_building" },
];

const CITY_PHONES = {
  "Coral Springs":   "(954) 344-1124",
  "Fort Lauderdale": "(954) 828-6520",
  "Hollywood":       "(954) 921-3271",
  "Cooper City":     "(954) 434-4300",
};

function CommercialSubtypeSelector({ onSelect }) {
  return (
    <div className="mb-4 bg-white border border-line rounded-card shadow-card p-4">
      <p className="text-sm font-bold text-ink mb-3">What type of commercial project?</p>
      <div className="grid sm:grid-cols-3 gap-3">
        {COMMERCIAL_SUBTYPES.map(sub => {
          const Icon = sub.icon;
          return (
            <button key={sub.id} onClick={() => onSelect(sub)}
              className="text-left p-3.5 rounded-control border-2 border-line hover:border-action hover:bg-action-50 transition-all group">
              <div className="w-8 h-8 rounded-control bg-surface group-hover:bg-action-100 flex items-center justify-center mb-2 transition-colors">
                <Icon className="w-4 h-4 text-muted group-hover:text-action" />
              </div>
              <p className="text-sm font-semibold text-ink group-hover:text-action leading-tight mb-1">{sub.label}</p>
              <p className="text-xs text-muted leading-snug">{sub.desc}</p>
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
  const permitCities = cities.filter(c => {
    const svcs = Array.isArray(c.enabled_services) ? c.enabled_services : (typeof c.enabled_services === "string" ? JSON.parse(c.enabled_services || "[]") : []);
    return svcs.includes("permit_types") || svcs.includes("permit_guide") || svcs.length === 0;
  });
  const CITIES = urlCity ? [urlCity] : permitCities.map(c => c.name);
  const singleCity = !!urlCity;

  const [propertyType, setPropertyType] = useState(urlPropertyType);
  const [commercialSubtype, setCommercialSubtype] = useState(null);
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
  const [roofingSubtype, setRoofingSubtype] = useState(null);
  const [privateProvider, setPrivateProvider] = useState(null);
  const [showRoofingStep, setShowRoofingStep] = useState(false);
  const [showPrivateProviderStep, setShowPrivateProviderStep] = useState(false);
  const [zoneInfoPanel, setZoneInfoPanel] = useState(null);

  const { data: allPermits = [] } = useQuery({
    queryKey: ["supabase-permit-types", city],
    queryFn: () => fetchPermitTypes(city),
    staleTime: 5 * 60 * 1000,
  });

  const isResidential = propertyType === "residential" || propertyType === "condo";
  const activeView = isResidential ? residentialView : commercialView;
  const activeViewOptions = isResidential ? RESIDENTIAL_VIEW_OPTIONS : COMMERCIAL_VIEW_OPTIONS;

  const setActiveView = (v) => {
    if (isResidential) setResidentialView(v);
    else setCommercialView(v);
  };

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
  const COMMERCIAL_SITE_CATS = ["engineering", "planning", "additional"];

  const panelPermits = (() => {
    if (propertyType !== "commercial" || !commercialSubtype) return allPermits;
    if (commercialSubtype.id === "building") return allPermits.filter(p => COMMERCIAL_BUILDING_CATS.includes(p.category));
    if (commercialSubtype.id === "site") return allPermits.filter(p => COMMERCIAL_SITE_CATS.includes(p.category));
    return allPermits;
  })();

  // City dropdown for the header actions slot
  const cityDropdown = !singleCity && (
    <div className="flex items-center gap-1.5">
      <MapPin className="w-3.5 h-3.5 text-muted" />
      <Select value={city} onValueChange={(val) => { setCity(val); if (val) sessionStorage.setItem("selectedCity", val); }}>
        <SelectTrigger className="w-44 rounded-control h-9 text-sm bg-white border-line">
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
  );

  return (
    <div className="bg-surface pb-20 md:pb-8">
      <PageHeader
        eyebrow="Visual Permit Guide"
        title="Find the Right Permits"
        subtitle="Select your city and project type to get a step-by-step permit guide — including required documents, typical timelines, and estimated fees."
        actions={cityDropdown}
      />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-8 pt-4">
        <div className="mb-4 space-y-2">
          <Callout variant="info" title="How to use">
            Select your property type (Single-Family, Commercial, or Condo), then tap any highlighted zone on the diagram to see the permits, documents, and fees required for that area of your property.
          </Callout>
          <Callout variant="info">
            <span className="font-semibold">Showing requirements for {city}</span>
          </Callout>
        </div>

        <div className="md:flex md:gap-6 md:items-start">
          {/* Left sidebar */}
          <div className="md:w-64 md:shrink-0 space-y-4">
            <div className="bg-white border border-line rounded-card shadow-card p-3 space-y-3">
              <p className="text-xs font-semibold text-muted uppercase tracking-wider">Property Type</p>
              <SegmentedToggle
                options={PROPERTY_TYPE_OPTIONS}
                value={propertyType}
                onChange={handlePropertyTypeChange}
                size="sm"
              />

              {(isResidential || commercialSubtype) && (
                <SegmentedToggle
                  options={activeViewOptions}
                  value={activeView}
                  onChange={setActiveView}
                  size="sm"
                />
              )}

              <div className="space-y-2 pt-1 border-t border-line">
                <Btn variant="secondary" size="sm"
                  className="w-full justify-start"
                  onClick={() => setShowHighlights(!showHighlights)}
                >
                  {showHighlights ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showHighlights ? "Hide Zone Markers" : "Show Zone Markers"}
                </Btn>
                <Btn variant="secondary" size="sm"
                  className="w-full justify-start"
                  onClick={() => setPanelOpen(true)}
                >
                  <List className="w-3.5 h-3.5" />
                  Browse All Permits
                </Btn>
                <Btn variant="secondary" size="sm"
                  className="w-full justify-start"
                  onClick={() => setOrdinancesPanelOpen(true)}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Code of Ordinances
                </Btn>
              </div>
            </div>

            {/* Step guide */}
            <div className="rounded-card border border-line bg-white shadow-card p-4 text-xs space-y-2">
              <p className="font-bold text-ink text-xs uppercase tracking-wider mb-2">How It Works</p>
              {[
                { n: "1", t: "📋 Review checklist",    d: "Gather all required documents before visiting" },
                { n: "2", t: "📝 Complete application", d: "Download and fill out the Uniform Building Permit Application" },
                { n: "3", t: "🏗️ Submit & pay",        d: "Submit in person or online and pay the estimated fee" },
                { n: "4", t: "⏱️ Plan review",         d: "3–20 business days depending on permit type" },
                { n: "5", t: "🔨 Begin work",           d: "Only after the permit is issued and posted at job site" },
                { n: "6", t: "✅ Schedule inspections", d: "Call for required inspections at each phase" },
                { n: "7", t: "🏁 Final inspection",     d: "Get final approval and close out the permit" },
              ].map(s => (
                <div key={s.n} className="flex gap-2 items-start">
                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 mt-0.5 bg-action">{s.n}</span>
                  <div>
                    <p className="font-semibold text-ink">{s.t}</p>
                    <p className="text-muted leading-snug">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Smart Check — brand accent */}
            <div className="rounded-card p-4 text-white bg-brand">
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
                  className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-blue-400/50 rounded-control py-4 text-blue-200 hover:border-blue-300 hover:text-white transition-colors text-xs font-medium"
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
            {/* Condo banner */}
            {propertyType === "condo" && (
              <Callout variant="warning" title="Condo / HOA — Additional Requirements Apply" className="mb-3">
                <ul className="space-y-1 mt-1">
                  <li>• <strong>HOA approval letter required</strong> before permit submission</li>
                  <li>• <strong>Milestone inspection</strong> may be required — verify with your condo association</li>
                  <li>• <strong>Structural recertification:</strong> confirm building is current on 40-year or milestone inspection requirements</li>
                  <li>• <strong>Reserve study:</strong> confirm association has adequate reserves for this work type</li>
                </ul>
                <p className="mt-2">Florida condo safety laws (post-Surfside) require additional structural documentation for buildings 3+ stories.</p>
              </Callout>
            )}

            {showRoofingStep && <RoofingSubtype onSelect={setRoofingSubtype} />}
            {showPrivateProviderStep && <PrivateProviderStep onAnswer={setPrivateProvider} />}

            {propertyType === "commercial" && !commercialSubtype && (
              <CommercialSubtypeSelector onSelect={(sub) => { setCommercialSubtype(sub); setCommercialView(sub.view); }} />
            )}

            {propertyType === "commercial" && commercialSubtype && (
              <div className="mb-3 flex items-center gap-2 flex-wrap">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-action-50 rounded-control border border-action-100">
                  <commercialSubtype.icon className="w-3.5 h-3.5 text-action" />
                  <span className="text-xs font-medium text-action">{commercialSubtype.label}: {commercialSubtype.desc}</span>
                </div>
                <button onClick={() => setCommercialSubtype(null)} className="text-xs text-muted hover:text-ink underline">
                  Change type
                </button>
              </div>
            )}

            {(isResidential || commercialSubtype) && (
              <>
                <HouseView view={activeView} showHighlights={showHighlights} onZoneClick={handleZoneClick} />

                {/* Mobile AI banner */}
                <div className="md:hidden mt-4">
                  {!showPhotoAnalyzer ? (
                    <button
                      onClick={() => setShowPhotoAnalyzer(true)}
                      className="w-full flex items-center gap-4 px-5 py-4 rounded-card border-2 border-dashed border-action-100 bg-action-50 hover:bg-action-100 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-control bg-action flex items-center justify-center flex-shrink-0">
                        <Camera className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-bold text-action text-sm flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" />AI Photo Analysis</p>
                        <p className="text-action text-xs mt-0.5">Upload a photo — AI identifies permits you need</p>
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

      {zoneInfoPanel && !selectedPermit && (
        <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md">
          <div className="bg-white rounded-card shadow-card border border-line p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="font-bold text-ink text-sm">{zoneInfoPanel.label}</h3>
              <button onClick={() => setZoneInfoPanel(null)} className="text-muted hover:text-ink flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-muted leading-relaxed mb-3">{zoneInfoPanel.description}</p>
            <Btn variant="primary" size="sm"
              as="a"
              href={`/PermitGuide?city=${encodeURIComponent(city)}&zone=${encodeURIComponent(zoneInfoPanel.label)}`}
            >
              View Full Requirements <ArrowRight className="w-3.5 h-3.5" />
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}