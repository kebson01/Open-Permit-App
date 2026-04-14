import React, { useState, useCallback, useEffect } from "react";
import { Home, Eye, EyeOff, List, MapPin, ArrowLeft, LayoutGrid, Building2, Sparkles, Camera } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import HouseView from "../components/map/HouseView";
import PermitPopup from "../components/map/PermitPopup";
import PermitsPanel from "../components/map/PermitsPanel";
import StandalonePhotoAnalyzer from "../components/map/StandalonePhotoAnalyzer";
import UserModeToggle from "../components/map/UserModeToggle";

const SUPABASE_URL = "https://gbknnjidqpmjrwlooluw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdia25uamlkcXBtanJ3bG9vbHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NTQzNDIsImV4cCI6MjA5MDIzMDM0Mn0.qwDACgXe3hesxBRQOzP53Hdc44z_UOka1_uYQScyi68";

// Map house zone labels → Supabase map_zone values (supports multiple zones)
const LABEL_TO_ZONES = {
  "Window Replacement":     ["windows"],
  "Door Replacement":       ["windows"],
  "Garage Door":            ["windows", "garage"],
  "Roof / Re-Roof":         ["roof"],
  "Solar Panels":           ["roof", "electrical"],
  "Pool & Spa":             ["pool", "backyard"],
  "Pool Equipment":         ["pool", "backyard"],
  "Pool Deck":              ["pool", "backyard"],
  "Patio / Slab":           ["backyard"],
  "Covered Patio":          ["backyard"],
  "Pergola":                ["backyard"],
  "Fence / Gate":           ["fence"],
  "A/C Replacement":        ["hvac"],
  "HVAC / Mechanical":      ["hvac"],
  "Electrical Service":     ["electrical"],
  "Driveway (Paver)":       ["driveway"],
  "Driveway / Walkway":     ["driveway"],
  "Walkway / Sidewalk":     ["driveway"],
  "Plumbing":               ["interior"],
  "Residential Remodel":    ["interior"],
  "Residential Addition":   ["structure"],
  "Irrigation System":      ["backyard"],
  // Commercial zones
  "EV Charging Station":    ["electrical"],
  "Light Pole / Utility":   ["electrical"],
  "Underground Drainage":   ["backyard"],
  "Asphalt / Milling & Paving": ["driveway"],
  "Seal Coat & Striping":   ["driveway"],
  "Sidewalk / Curb":        ["driveway"],
  "Pavement / Earthwork":   ["structure"],
  "Utility Boring":         ["structure"],
  "Sign Permit":            ["structure"],
};

async function fetchPermitsByZones(zones) {
  const zoneList = zones.map(z => `"${z}"`).join(",");
  const url = `${SUPABASE_URL}/rest/v1/weston_permit_types?map_zone=in.(${zoneList})&select=*`;
  const res = await fetch(url, {
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch permit types");
  const rows = await res.json();
  // Parse JSON array fields
  return rows.map(r => ({
    ...r,
    typical_requirements: parseJsonArray(r.typical_requirements),
    documents_needed: parseJsonArray(r.documents_needed),
    inspections_required: parseJsonArray(r.inspections_required),
  }));
}

async function fetchAllPermits() {
  const url = `${SUPABASE_URL}/rest/v1/weston_permit_types?select=*`;
  const res = await fetch(url, {
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch permit types");
  const rows = await res.json();
  return rows.map(r => ({
    ...r,
    typical_requirements: parseJsonArray(r.typical_requirements),
    documents_needed: parseJsonArray(r.documents_needed),
    inspections_required: parseJsonArray(r.inspections_required),
  }));
}

function parseJsonArray(val) {
  if (Array.isArray(val)) return val;
  if (!val) return [];
  try { return JSON.parse(val); } catch { return []; }
}

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

// Inline multi-permit picker shown when a zone maps to several permits
function MultiPermitPopup({ permits, city, userMode, onSelect, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 flex items-start justify-between" style={{ background: "linear-gradient(135deg, #0D2B5E 0%, #0F3575 100%)" }}>
          <div>
            <h3 className="text-white font-bold text-base">Multiple Permits Found</h3>
            <p className="text-blue-200 text-xs mt-0.5">Select a permit to see full details</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-lg leading-none">×</button>
        </div>
        <div className="p-4 space-y-2 max-h-72 overflow-y-auto">
          {permits.map(p => (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
            >
              <p className="text-sm font-semibold text-gray-800">{p.name}</p>
              {p.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{p.description}</p>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PermitGuide() {
  const urlParams = new URLSearchParams(window.location.search);
  const urlCity = urlParams.get("city") || "";
  const urlCities = urlParams.get("cities");
  const CITIES = urlCity ? [urlCity] : (urlCities ? urlCities.split(",").map(s => s.trim()) : DEFAULT_CITIES);
  const singleCity = CITIES.length === 1;

  const [propertyType, setPropertyType] = useState("residential");
  const [residentialView, setResidentialView] = useState("front");
  const [commercialView, setCommercialView] = useState("commercial");
  const [userMode, setUserMode] = useState("homeowner");
  const [showHighlights, setShowHighlights] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedPermit, setSelectedPermit] = useState(null);
  const [selectedPermits, setSelectedPermits] = useState([]); // multi-permit results from zone click
  const [city, setCity] = useState(urlCity || sessionStorage.getItem("selectedCity") || "");
  const [showPhotoAnalyzer, setShowPhotoAnalyzer] = useState(false);
  const [allPermits, setAllPermits] = useState([]);
  const [zoneLoading, setZoneLoading] = useState(false);

  // Load all permits once for the Browse panel
  useEffect(() => {
    fetchAllPermits().then(setAllPermits).catch(() => {});
  }, []);

  const activeView = propertyType === "residential" ? residentialView : commercialView;
  const activeViews = propertyType === "residential" ? RESIDENTIAL_VIEWS : COMMERCIAL_VIEWS;

  const setActiveView = (v) => {
    if (propertyType === "residential") setResidentialView(v);
    else setCommercialView(v);
  };

  const handleZoneClick = useCallback(async (permitName, permitDesc) => {
    const zones = LABEL_TO_ZONES[permitName] || [];
    if (zones.length === 0) {
      // Fallback: show a basic permit object
      setSelectedPermits([{ id: permitName, name: permitName, description: permitDesc || "", typical_requirements: [], documents_needed: [], inspections_required: [] }]);
      setSelectedPermit(null);
      return;
    }
    setZoneLoading(true);
    const results = await fetchPermitsByZones(zones);
    setZoneLoading(false);
    if (results.length === 1) {
      setSelectedPermit(results[0]);
      setSelectedPermits([]);
    } else if (results.length > 1) {
      setSelectedPermits(results);
      setSelectedPermit(null);
    } else {
      // Nothing found in DB, show fallback
      setSelectedPermits([{ id: permitName, name: permitName, description: permitDesc || "", typical_requirements: [], documents_needed: [], inspections_required: [] }]);
    }
  }, []);

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

      {/* Zone loading indicator */}
      {zoneLoading && (
        <div className="mt-3 flex items-center gap-2 text-blue-600 text-xs">
          <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          Loading permit info...
        </div>
      )}

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

      {/* Single permit popup */}
      {selectedPermit && (
        <PermitPopup
          permit={selectedPermit}
          city={city}
          userMode={userMode}
          onClose={() => setSelectedPermit(null)}
        />
      )}

      {/* Multi-permit popup (zone returned several permits) */}
      {selectedPermits.length > 0 && (
        <MultiPermitPopup
          permits={selectedPermits}
          city={city}
          userMode={userMode}
          onSelect={(p) => { setSelectedPermit(p); setSelectedPermits([]); }}
          onClose={() => setSelectedPermits([])}
        />
      )}

      <PermitsPanel
        permits={allPermits}
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