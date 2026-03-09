import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Home, Eye, EyeOff, List, MapPin, ArrowLeft, LayoutGrid, Building2, HardHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import HouseView from "../components/map/HouseView";
import PermitPopup from "../components/map/PermitPopup";
import PermitsPanel from "../components/map/PermitsPanel";

const DEFAULT_CITIES = ["Weston", "Coral Springs", "Fort Lauderdale", "Hollywood", "Cooper City"];

export default function InteractiveMap() {
  const urlParams = new URLSearchParams(window.location.search);
  // ?cities=Miami,Hialeah  overrides the default list; ?city=Miami pre-selects & locks to one city
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
      // Create a lightweight permit object from the zone data for permits not yet in DB
      setSelectedPermit({ name: permitName, description: permitDesc || "", typical_requirements: [], documents_needed: [] });
    }
  };

  const handleCityApply = () => {
    if (city) sessionStorage.setItem("selectedCity", city);
  };

  const views = [
    { id: "front",      label: "Front View",        icon: Home },
    { id: "back",       label: "Back View",          icon: ArrowLeft },
    { id: "eagle",      label: "Floor Plan",         icon: LayoutGrid },
    { id: "commercial", label: "Commercial",         icon: Building2 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">Visual Permit Guide</h1>
        <p className="text-gray-500 mt-1">Click on any area of the illustrated home — inside or outside — to explore permit requirements</p>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        {/* View toggles */}
        <div className="flex bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
          {views.map(v => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                view === v.id
                  ? "gradient-primary text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <v.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{v.label}</span>
            </button>
          ))}
        </div>

        {/* Highlight toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowHighlights(!showHighlights)}
          className="rounded-xl"
        >
          {showHighlights ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
          {showHighlights ? "Hide Areas" : "Show Areas"}
        </Button>

        {/* Browse button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPanelOpen(true)}
          className="rounded-xl"
        >
          <List className="w-4 h-4 mr-2" />
          Browse Permits
        </Button>

        {/* City selector — hidden when locked to a single city */}
        {!singleCity && (
          <div className="flex items-center gap-2 ml-auto">
            <MapPin className="w-4 h-4 text-gray-400" />
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="w-44 rounded-xl h-9 text-sm">
                <SelectValue placeholder="Select city..." />
              </SelectTrigger>
              <SelectContent>
                {CITIES.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleCityApply} className="gradient-primary text-white rounded-xl h-9 text-sm">
              Apply
            </Button>
          </div>
        )}
      </div>

      {/* City indicator */}
      {city && (
        <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-xl border border-blue-100">
          <MapPin className="w-4 h-4 text-[#2c5282]" />
          <span className="text-sm font-medium text-[#2c5282]">Viewing permits for: {city}</span>
        </div>
      )}

      {/* Interactive House */}
      <HouseView
        view={view}
        showHighlights={showHighlights}
        onZoneClick={handleZoneClick}
      />

      {/* Instruction hint */}
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-400">
          {showHighlights 
            ? "Highlighted areas are clickable — hover and click to see permit details" 
            : "Hover over the image to discover clickable permit zones"}
        </p>
      </div>

      {/* Permit Popup */}
      {selectedPermit && (
        <PermitPopup
          permit={selectedPermit}
          city={city}
          onClose={() => setSelectedPermit(null)}
        />
      )}

      {/* Permits Panel */}
      <PermitsPanel
        permits={permits}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onSelectPermit={(p) => {
          setSelectedPermit(p);
          setPanelOpen(false);
        }}
      />

      {/* Panel backdrop */}
      {panelOpen && (
        <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setPanelOpen(false)} />
      )}
    </div>
  );
}