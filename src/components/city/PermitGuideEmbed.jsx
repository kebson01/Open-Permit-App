import React, { useState } from "react";
import { db } from "@/lib/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { Home, ArrowLeft, LayoutGrid, Building2, Eye, EyeOff, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import HouseView from "@/components/map/HouseView";
import PermitPopup from "@/components/map/PermitPopup";
import PermitsPanel from "@/components/map/PermitsPanel";

const views = [
  { id: "front",      label: "Front View",   icon: Home },
  { id: "back",       label: "Back View",    icon: ArrowLeft },
  { id: "eagle",      label: "Floor Plan",   icon: LayoutGrid },
  { id: "commercial", label: "Commercial",   icon: Building2 },
];

export default function PermitGuideEmbed({ city }) {
  const [view, setView] = useState("front");
  const [showHighlights, setShowHighlights] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedPermit, setSelectedPermit] = useState(null);

  const { data: permits = [] } = useQuery({
    queryKey: ["permitTypes", city.name],
    queryFn: () => db.getPermitTypes(city.name),
  });

  const handleZoneClick = (permitName, permitDesc) => {
    const found = permits.find(p => p.name === permitName);
    setSelectedPermit(found || { name: permitName, description: permitDesc || "", typical_requirements: [], documents_needed: [] });
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
          <Home className="w-4 h-4 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Visual Permit Guide</h2>
      </div>

      <div className="flex flex-wrap gap-3 mb-5 items-center">
        <div className="flex bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
          {views.map(v => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                view === v.id ? "gradient-primary text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <v.icon className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">{v.label}</span>
            </button>
          ))}
        </div>

        <Button variant="outline" size="sm" onClick={() => setShowHighlights(!showHighlights)} className="rounded-xl">
          {showHighlights ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
          {showHighlights ? "Hide Areas" : "Show Areas"}
        </Button>

        <Button variant="outline" size="sm" onClick={() => setPanelOpen(true)} className="rounded-xl">
          <List className="w-4 h-4 mr-2" /> Browse Permits
        </Button>
      </div>

      <HouseView view={view} showHighlights={showHighlights} onZoneClick={handleZoneClick} />

      <p className="text-center text-sm text-gray-600 mt-3">
        Click any highlighted area to explore permit requirements
      </p>

      {selectedPermit && (
        <PermitPopup permit={selectedPermit} city={city.name} onClose={() => setSelectedPermit(null)} />
      )}

      <PermitsPanel
        permits={permits}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onSelectPermit={(p) => { setSelectedPermit(p); setPanelOpen(false); }}
      />
      {panelOpen && <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setPanelOpen(false)} />}
    </div>
  );
}