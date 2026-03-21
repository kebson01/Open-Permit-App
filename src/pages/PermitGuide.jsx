import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Home, Eye, EyeOff, List, MapPin, ArrowLeft, LayoutGrid, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import HouseView from "../components/map/HouseView";
import PermitPopup from "../components/map/PermitPopup";
import PermitsPanel from "../components/map/PermitsPanel";

const DEFAULT_CITIES = ["Weston", "Coral Springs", "Fort Lauderdale", "Hollywood", "Cooper City"];

export default function PermitGuide() {
  const urlParams = new URLSearchParams(window.location.search);
  const urlCity = urlParams.get("city") || "";
  const urlCities = urlParams.get("cities");
  const CITIES = urlCity ? [urlCity] : (urlCities ? urlCities.split(",").map(s => s.trim()) : DEFAULT_CITIES);
  const singleCity = CITIES.length === 1;

  const [view, setView] = useState("front");
  const [showHighlights, setShowHighlights] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedPermit, setSelectedPermit] = useState(null);
  const [city, setCity] = useState(urlCity || sessionStorage.getItem("selectedCity") || "");

  const { data: permits = [] } = useQuery({
    queryKey: ["permits"],
    queryFn: () => base44.entities.PermitType.list(),
  });

  const handleZoneClick = (permitName, permitDesc) => {
    const found = permits.find(p => p.name === permitName);
    if (found) {
      setSelectedPermit(found);
    } else {
      setSelectedPermit({ name: permitName, description: permitDesc || "", typical_requirements: [], documents_needed: [] });
    }
  };

  const handleCityApply = () => {
    if (city) sessionStorage.setItem("selectedCity", city);
  };

  const views = [
    { id: "front",      label: "Front View",   icon: Home },
    { id: "back",       label: "Back View",    icon: ArrowLeft },
    { id: "eagle",      label: "Floor Plan",   icon: LayoutGrid },
    { id: "commercial", label: "Commercial",   icon: Building2 },
  ];

  return (
    <div className="px-3 sm:px-6 py-4 sm:py-8 pb-20 md:pb-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl sm:text-3xl font-extrabold text-gray-800 tracking-tight">Visual Permit Guide</h1>
        <p className="text-gray-500 mt-0.5 text-xs sm:text-base">Tap any area to explore permit requirements</p>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-wrap gap-2 items-center mb-3">
        {/* View switcher */}
        <div className="flex bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
          {views.map(v => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                view === v.id ? "gradient-primary text-white shadow-sm" : "text-gray-600"
              }`}
            >
              <v.icon className="w-3.5 h-3.5" />
              <span>{v.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowHighlights(!showHighlights)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${showHighlights ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-200 text-gray-600"}`}
        >
          {showHighlights ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {showHighlights ? "Hide" : "Show"}
        </button>

        <button
          onClick={() => setPanelOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-600"
        >
          <List className="w-3.5 h-3.5" />
          Browse
        </button>

        {!singleCity && (
          <div className="flex items-center gap-2 ml-auto">
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="w-32 sm:w-40 rounded-xl h-8 text-xs">
                <SelectValue placeholder="City..." />
              </SelectTrigger>
              <SelectContent>
                {CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleCityApply} className="gradient-primary text-white rounded-xl h-8 text-xs px-3">
              Apply
            </Button>
          </div>
        )}
      </div>

      {city && (
        <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-xl border border-blue-100">
          <MapPin className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-xs font-medium text-blue-700">{city}</span>
        </div>
      )}

      <HouseView view={view} showHighlights={showHighlights} onZoneClick={handleZoneClick} />

      {selectedPermit && (
        <PermitPopup permit={selectedPermit} city={city} onClose={() => setSelectedPermit(null)} />
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