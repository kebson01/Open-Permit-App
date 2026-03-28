import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Home, Eye, EyeOff, List, MapPin, ArrowLeft, LayoutGrid, Building2, Sparkles, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import HouseView from "../components/map/HouseView";
import PermitPopup from "../components/map/PermitPopup";
import PermitsPanel from "../components/map/PermitsPanel";
import StandalonePhotoAnalyzer from "../components/map/StandalonePhotoAnalyzer";

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
  const [showPhotoAnalyzer, setShowPhotoAnalyzer] = useState(false);

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

  // city auto-saves to sessionStorage on change via the Select onValueChange handler

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
        <p className="text-gray-600 mt-0.5 text-xs sm:text-base">Tap or click any highlighted area on the home to see what permit you need, required documents, and estimated fees.</p>
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
          Browse All Permits
        </button>

        {!singleCity && (
          <div className="flex items-center gap-2 ml-auto">
            <MapPin className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
            <Select value={city} onValueChange={(val) => { setCity(val); if (val) sessionStorage.setItem("selectedCity", val); }}>
              <SelectTrigger className="w-36 sm:w-44 rounded-xl h-8 text-xs">
                <SelectValue placeholder="Filter by city..." />
              </SelectTrigger>
              <SelectContent>
                {CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
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
            <p className="font-bold text-blue-800 text-sm flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              AI Photo Analysis
            </p>
            <p className="text-blue-600 text-xs mt-0.5">Upload a photo of your property — AI will identify what permits you need</p>
          </div>
          <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2.5 py-1 rounded-lg flex-shrink-0">Try it →</span>
        </button>
      ) : (
        <div className="mt-4">
          <StandalonePhotoAnalyzer onClose={() => setShowPhotoAnalyzer(false)} permits={permits} />
        </div>
      )}

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