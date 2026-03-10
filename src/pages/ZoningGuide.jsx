import React, { useState } from "react";
import { Eye, EyeOff, Map, Droplets, AlertTriangle, Layers, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import ZoningView from "../components/zoning/ZoningView";
import ZoneDetailPopup from "../components/zoning/ZoneDetailPopup";

const VIEWS = [
  { id: "setbacks",   label: "Setbacks",    icon: Map,          desc: "Setback requirements & buildable area" },
  { id: "easements",  label: "Easements",   icon: Layers,       desc: "Utility, drainage & access easements" },
  { id: "flood",      label: "Flood Zones", icon: AlertTriangle, desc: "FEMA flood zone designations" },
  { id: "stormwater", label: "Stormwater",  icon: Droplets,     desc: "Drainage, runoff & impervious coverage" },
];

const TOPIC_SUMMARIES = [
  {
    number: "01",
    title: "What Can I Build on My Property?",
    body: "Depends on your zoning district, lot size, setbacks, lot coverage limits, and any easements. The building envelope (after setbacks) is where structures are permitted — but not all of it can be covered.",
    color: "bg-blue-50 border-blue-200",
    textColor: "text-blue-800",
    numColor: "text-blue-300",
  },
  {
    number: "02",
    title: "Setback Requirements",
    body: "Minimum distances from property lines where you cannot build. Front, rear, and side setbacks all differ. Corner lots often have two front setbacks. Always verify your specific lot and zoning district.",
    color: "bg-amber-50 border-amber-200",
    textColor: "text-amber-800",
    numColor: "text-amber-300",
  },
  {
    number: "03",
    title: "Easements on Your Property",
    body: "Legally recorded corridors for utilities, drainage, and access. You own the land but cannot build permanent structures there. Easements are found in your plat, title, and recorded deed documents.",
    color: "bg-purple-50 border-purple-200",
    textColor: "text-purple-800",
    numColor: "text-purple-300",
  },
  {
    number: "04",
    title: "Flood Zone Information",
    body: "FEMA designates flood zones based on risk level. Zone AE = high risk (insurance required). Zone X = minimal risk. Base Flood Elevation (BFE) determines required building height in flood zones.",
    color: "bg-cyan-50 border-cyan-200",
    textColor: "text-cyan-800",
    numColor: "text-cyan-300",
  },
  {
    number: "05",
    title: "Stormwater & Drainage",
    body: "Impervious surface limits, drainage swales, retention areas, and storm drains all regulate how water flows across your property. Filling swales or exceeding impervious coverage can cause serious flooding and legal liability.",
    color: "bg-green-50 border-green-200",
    textColor: "text-green-800",
    numColor: "text-green-300",
  },
  {
    number: "06",
    title: "Why Was My Permit Denied?",
    body: "Most denials involve setback violations, impervious coverage exceedance, building in an easement, or missing engineering documentation. The zoning guide can help you understand the underlying issue.",
    color: "bg-red-50 border-red-200",
    textColor: "text-red-800",
    numColor: "text-red-300",
  },
];

export default function ZoningGuide() {
  const [view, setView] = useState("setbacks");
  const [showHighlights, setShowHighlights] = useState(true);
  const [selectedZone, setSelectedZone] = useState(null); // { id, label }
  const [showTopics, setShowTopics] = useState(false);

  const handleZoneClick = (zoneId, zoneLabel) => {
    setSelectedZone({ id: zoneId, label: zoneLabel });
  };

  const currentView = VIEWS.find(v => v.id === view);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">Zoning & Engineering Guide</h1>
        <p className="text-gray-500 mt-1">
          Understand what local governments make hard to find — setbacks, easements, flood zones, and drainage rules — visualized for your property.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <div className="flex bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
          {VIEWS.map(v => (
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

        <Button
          variant="outline" size="sm"
          onClick={() => setShowHighlights(!showHighlights)}
          className="rounded-xl"
        >
          {showHighlights ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
          {showHighlights ? "Hide Zones" : "Show Zones"}
        </Button>

        <Button
          variant="outline" size="sm"
          onClick={() => setShowTopics(!showTopics)}
          className="rounded-xl"
        >
          <List className="w-4 h-4 mr-2" />
          {showTopics ? "Hide Topics" : "Browse Topics"}
        </Button>
      </div>

      {/* Current view description */}
      {currentView && (
        <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-xl border border-blue-100">
          <currentView.icon className="w-4 h-4 text-[#2c5282]" />
          <span className="text-sm font-medium text-[#2c5282]">{currentView.desc} — click any highlighted zone for details</span>
        </div>
      )}

      {/* Visual */}
      <ZoningView view={view} showHighlights={showHighlights} onZoneClick={handleZoneClick} />

      <div className="mt-4 text-center">
        <p className="text-sm text-gray-400">
          {showHighlights
            ? "Highlighted zones are clickable — hover and click to see requirements and restrictions"
            : "Hover over the diagram to discover clickable zones"}
        </p>
      </div>

      {/* Topics Panel */}
      {showTopics && (
        <div className="mt-10">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Common Zoning & Engineering Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TOPIC_SUMMARIES.map((topic) => (
              <div
                key={topic.number}
                className={`border rounded-xl p-5 ${topic.color}`}
              >
                <p className={`text-4xl font-black ${topic.numColor} mb-2 leading-none`}>{topic.number}</p>
                <h3 className={`font-bold text-sm mb-2 ${topic.textColor}`}>{topic.title}</h3>
                <p className={`text-sm leading-relaxed ${topic.textColor} opacity-80`}>{topic.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-gray-400 text-center">
            Information is general in nature. Always verify specific requirements with your city's Building, Planning, or Engineering department before starting any project.
          </p>
        </div>
      )}

      {/* Zone Detail Popup */}
      {selectedZone && (
        <ZoneDetailPopup
          zoneId={selectedZone.id}
          zoneLabel={selectedZone.label}
          onClose={() => setSelectedZone(null)}
        />
      )}
    </div>
  );
}