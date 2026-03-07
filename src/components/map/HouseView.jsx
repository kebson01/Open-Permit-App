import React from "react";
import { motion } from "framer-motion";

// Clickable zones for each view
const FRONT_ZONES = [
  { id: "roof", label: "Roof", x: "15%", y: "2%", w: "70%", h: "22%", color: "rgba(239,68,68,0.25)" },
  { id: "solar_panels", label: "Solar Panels", x: "50%", y: "5%", w: "30%", h: "14%", color: "rgba(234,179,8,0.25)" },
  { id: "windows", label: "Windows", x: "18%", y: "32%", w: "22%", h: "18%", color: "rgba(59,130,246,0.25)" },
  { id: "windows2", label: "Windows", x: "60%", y: "32%", w: "22%", h: "18%", color: "rgba(59,130,246,0.25)" },
  { id: "door", label: "Front Door", x: "40%", y: "35%", w: "18%", h: "28%", color: "rgba(139,92,246,0.25)" },
  { id: "garage", label: "Garage Door", x: "5%", y: "50%", w: "30%", h: "28%", color: "rgba(249,115,22,0.25)" },
  { id: "driveway", label: "Driveway", x: "3%", y: "80%", w: "35%", h: "18%", color: "rgba(107,114,128,0.25)" },
  { id: "sidewalk", label: "Sidewalk", x: "40%", y: "85%", w: "55%", h: "13%", color: "rgba(156,163,175,0.25)" },
  { id: "fence", label: "Fence", x: "85%", y: "35%", w: "12%", h: "45%", color: "rgba(34,197,94,0.25)" },
];

const BACK_ZONES = [
  { id: "roof", label: "Roof", x: "15%", y: "2%", w: "70%", h: "22%", color: "rgba(239,68,68,0.25)" },
  { id: "ac_unit", label: "A/C Unit", x: "5%", y: "55%", w: "18%", h: "18%", color: "rgba(14,165,233,0.25)" },
  { id: "pool", label: "Pool", x: "25%", y: "65%", w: "35%", h: "25%", color: "rgba(6,182,212,0.25)" },
  { id: "hot_tub", label: "Hot Tub", x: "62%", y: "70%", w: "15%", h: "15%", color: "rgba(168,85,247,0.25)" },
  { id: "deck", label: "Deck/Pergola", x: "30%", y: "45%", w: "40%", h: "18%", color: "rgba(245,158,11,0.25)" },
  { id: "fence", label: "Fence", x: "0%", y: "35%", w: "8%", h: "55%", color: "rgba(34,197,94,0.25)" },
  { id: "fence2", label: "Fence", x: "92%", y: "35%", w: "8%", h: "55%", color: "rgba(34,197,94,0.25)" },
  { id: "generator", label: "Generator", x: "80%", y: "55%", w: "15%", h: "12%", color: "rgba(220,38,38,0.25)" },
  { id: "windows", label: "Windows", x: "20%", y: "28%", w: "20%", h: "15%", color: "rgba(59,130,246,0.25)" },
  { id: "door", label: "Back Door", x: "55%", y: "30%", w: "15%", h: "18%", color: "rgba(139,92,246,0.25)" },
];

const COMMERCIAL_ZONES = [
  { id: "roof", label: "Roof/HVAC", x: "10%", y: "2%", w: "80%", h: "18%", color: "rgba(239,68,68,0.25)" },
  { id: "structure", label: "Building Structure", x: "10%", y: "22%", w: "80%", h: "45%", color: "rgba(59,130,246,0.25)" },
  { id: "door", label: "Entrance", x: "35%", y: "50%", w: "30%", h: "20%", color: "rgba(139,92,246,0.25)" },
  { id: "windows", label: "Storefront Glass", x: "10%", y: "35%", w: "25%", h: "20%", color: "rgba(234,179,8,0.25)" },
  { id: "sign", label: "Signage", x: "25%", y: "25%", w: "50%", h: "10%", color: "rgba(249,115,22,0.25)" },
  { id: "driveway", label: "Parking Lot", x: "5%", y: "75%", w: "90%", h: "23%", color: "rgba(107,114,128,0.25)" },
];

const ZONE_TO_PERMIT_MAP = {
  roof: "Roofing",
  solar_panels: "Solar Panels",
  windows: "Hurricane Shutters",
  windows2: "Hurricane Shutters",
  door: "Building/Structure (Custom)",
  garage: "Garage Door",
  driveway: "Driveway/Paving",
  sidewalk: "Sidewalk Repair",
  fence: "Fence/Gate",
  fence2: "Fence/Gate",
  ac_unit: "A/C Replacement",
  pool: "Swimming Pool/Spa",
  hot_tub: "Hot Tub",
  deck: "Deck/Pergola",
  generator: "Generator",
  structure: "Building/Structure (Custom)",
  sign: "Sign Permit",
};

export default function HouseView({ view, showHighlights, onZoneClick }) {
  const zones = view === "front" ? FRONT_ZONES : view === "back" ? BACK_ZONES : COMMERCIAL_ZONES;
  
  const bgImages = {
    front: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=500&fit=crop",
    back: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=500&fit=crop",
    commercial: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=500&fit=crop",
  };

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-xl border border-gray-200 bg-gray-100" style={{ aspectRatio: "16/10" }}>
      <img
        src={bgImages[view]}
        alt={`${view} view`}
        className="w-full h-full object-cover"
      />
      
      {/* Overlay zones */}
      {zones.map((zone, i) => (
        <motion.button
          key={zone.id + i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => onZoneClick(ZONE_TO_PERMIT_MAP[zone.id] || zone.label)}
          className="absolute cursor-pointer group transition-all"
          style={{ left: zone.x, top: zone.y, width: zone.w, height: zone.h }}
        >
          <div
            className={`w-full h-full rounded-lg border-2 border-dashed transition-all ${
              showHighlights
                ? "border-white/60"
                : "border-transparent hover:border-white/60"
            }`}
            style={{ backgroundColor: showHighlights ? zone.color : "transparent" }}
          />
          <div className={`absolute inset-0 rounded-lg transition-all ${
            showHighlights ? "" : "hover:bg-white/10"
          } group-hover:bg-white/20`} 
            style={{ backgroundColor: !showHighlights ? "transparent" : undefined }}
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="px-3 py-1.5 bg-black/75 text-white text-xs font-semibold rounded-lg backdrop-blur-sm whitespace-nowrap">
              {zone.label}
            </span>
          </div>
        </motion.button>
      ))}
    </div>
  );
}