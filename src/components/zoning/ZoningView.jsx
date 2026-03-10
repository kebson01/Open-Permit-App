import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── ZONE DATA ─────────────────────────────────────────────────────────────────
// Each zone: { id, label, type:"rect"|"polygon", color, stroke, ...dims }

const SETBACK_ZONES = [
  {
    id: "front-setback",
    label: "Front Setback",
    type: "rect", x: 60, y: 380, w: 780, h: 95,
    color: "rgba(245,158,11,0.42)", stroke: "#f59e0b",
  },
  {
    id: "rear-setback",
    label: "Rear Setback",
    type: "rect", x: 60, y: 30, w: 780, h: 80,
    color: "rgba(59,130,246,0.42)", stroke: "#3b82f6",
  },
  {
    id: "side-setback-left",
    label: "Side Setback",
    type: "rect", x: 60, y: 110, w: 85, h: 270,
    color: "rgba(34,197,94,0.42)", stroke: "#22c55e",
  },
  {
    id: "side-setback-right",
    label: "Side Setback",
    type: "rect", x: 755, y: 110, w: 85, h: 270,
    color: "rgba(34,197,94,0.42)", stroke: "#22c55e",
  },
  {
    id: "building-envelope",
    label: "Building Envelope",
    type: "rect", x: 145, y: 110, w: 610, h: 270,
    color: "rgba(16,185,129,0.12)", stroke: "#10b981",
  },
];

const EASEMENT_ZONES = [
  {
    id: "rear-utility-easement",
    label: "Rear Utility Easement",
    type: "rect", x: 60, y: 30, w: 780, h: 60,
    color: "rgba(139,92,246,0.42)", stroke: "#8b5cf6",
  },
  {
    id: "fpl-easement",
    label: "Electric / FPL Easement",
    type: "rect", x: 60, y: 30, w: 55, h: 445,
    color: "rgba(234,179,8,0.42)", stroke: "#eab308",
  },
  {
    id: "drainage-easement",
    label: "Drainage Easement",
    type: "rect", x: 785, y: 90, w: 55, h: 385,
    color: "rgba(6,182,212,0.42)", stroke: "#06b6d4",
  },
  {
    id: "right-of-way",
    label: "Public Right-of-Way",
    type: "rect", x: 60, y: 420, w: 780, h: 55,
    color: "rgba(239,68,68,0.38)", stroke: "#ef4444",
  },
  {
    id: "access-easement",
    label: "Access / Driveway Easement",
    type: "rect", x: 370, y: 340, w: 100, h: 135,
    color: "rgba(249,115,22,0.42)", stroke: "#f97316",
  },
];

const FLOOD_ZONES = [
  {
    id: "zone-ae",
    label: "Zone AE – High Risk Flood",
    type: "rect", x: 60, y: 30, w: 420, h: 445,
    color: "rgba(59,130,246,0.38)", stroke: "#3b82f6",
  },
  {
    id: "zone-ah",
    label: "Zone AH – Ponding Flood",
    type: "rect", x: 480, y: 200, w: 200, h: 275,
    color: "rgba(99,102,241,0.38)", stroke: "#6366f1",
  },
  {
    id: "zone-x",
    label: "Zone X – Minimal Risk",
    type: "rect", x: 480, y: 30, w: 360, h: 170,
    color: "rgba(34,197,94,0.32)", stroke: "#22c55e",
  },
  {
    id: "floodway",
    label: "Floodway (No Development)",
    type: "rect", x: 60, y: 340, w: 420, h: 135,
    color: "rgba(30,58,138,0.52)", stroke: "#1e3a8a",
  },
  {
    id: "bfe-line",
    label: "Base Flood Elevation (BFE)",
    type: "rect", x: 60, y: 330, w: 780, h: 18,
    color: "rgba(239,68,68,0.55)", stroke: "#dc2626",
  },
];

const STORMWATER_ZONES = [
  {
    id: "impervious-roof",
    label: "Impervious Surface – Roof",
    type: "rect", x: 260, y: 155, w: 380, h: 185,
    color: "rgba(239,68,68,0.38)", stroke: "#ef4444",
  },
  {
    id: "impervious-drive",
    label: "Impervious Surface – Driveway",
    type: "rect", x: 375, y: 340, w: 100, h: 135,
    color: "rgba(249,115,22,0.42)", stroke: "#f97316",
  },
  {
    id: "drainage-swale",
    label: "Drainage Swale",
    type: "rect", x: 775, y: 60, w: 65, h: 415,
    color: "rgba(6,182,212,0.45)", stroke: "#06b6d4",
  },
  {
    id: "retention-area",
    label: "Retention / Detention Area",
    type: "rect", x: 60, y: 30, w: 160, h: 160,
    color: "rgba(16,185,129,0.45)", stroke: "#10b981",
  },
  {
    id: "pervious-lawn",
    label: "Pervious Area (Lawn)",
    type: "rect", x: 60, y: 110, w: 200, h: 370,
    color: "rgba(34,197,94,0.28)", stroke: "#22c55e",
  },
  {
    id: "storm-drain",
    label: "Storm Drain / Inlet",
    type: "rect", x: 395, y: 458, w: 50, h: 17,
    color: "rgba(6,182,212,0.7)", stroke: "#0891b2",
  },
];

const VIEW_ZONES = {
  setbacks:   SETBACK_ZONES,
  easements:  EASEMENT_ZONES,
  flood:      FLOOD_ZONES,
  stormwater: STORMWATER_ZONES,
};

const LEGENDS = {
  setbacks: [
    { label: "Front Setback",      color: "#f59e0b" },
    { label: "Rear Setback",       color: "#3b82f6" },
    { label: "Side Setbacks",      color: "#22c55e" },
    { label: "Building Envelope",  color: "#10b981" },
  ],
  easements: [
    { label: "Rear Utility Easement",   color: "#8b5cf6" },
    { label: "Electric / FPL Easement", color: "#eab308" },
    { label: "Drainage Easement",       color: "#06b6d4" },
    { label: "Right-of-Way",            color: "#ef4444" },
    { label: "Access Easement",         color: "#f97316" },
  ],
  flood: [
    { label: "Zone AE – High Risk",     color: "#3b82f6" },
    { label: "Zone AH – Ponding",       color: "#6366f1" },
    { label: "Zone X – Minimal Risk",   color: "#22c55e" },
    { label: "Floodway",                color: "#1e3a8a" },
    { label: "Base Flood Elevation",    color: "#dc2626" },
  ],
  stormwater: [
    { label: "Impervious (Roof)",       color: "#ef4444" },
    { label: "Impervious (Driveway)",   color: "#f97316" },
    { label: "Drainage Swale",          color: "#06b6d4" },
    { label: "Retention Area",          color: "#10b981" },
    { label: "Pervious Lawn",           color: "#22c55e" },
    { label: "Storm Drain",             color: "#0891b2" },
  ],
};

// ── STATIC SVG BACKGROUNDS ────────────────────────────────────────────────────

function SetbacksBackground() {
  return (
    <>
      <defs>
        <pattern id="sgrid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0L0 0 0 40" fill="none" stroke="#d1d5db" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="900" height="560" fill="#f0f4f8" />
      <rect width="900" height="560" fill="url(#sgrid)" />
      {/* Street */}
      <rect x="0" y="475" width="900" height="85" fill="#9ca3af" />
      <line x1="450" y1="475" x2="450" y2="560" stroke="white" strokeWidth="3" strokeDasharray="20,15" />
      <text x="450" y="522" textAnchor="middle" fill="white" fontSize="13" fontWeight="700" letterSpacing="2">STREET / PUBLIC RIGHT-OF-WAY</text>
      <line x1="0" y1="475" x2="900" y2="475" stroke="#6b7280" strokeWidth="3" />
      {/* Lot outline */}
      <rect x="60" y="30" width="780" height="445" fill="#e8f4f0" stroke="#1f2937" strokeWidth="3" />
      {/* Property corner markers */}
      {[[60,30],[840,30],[60,475],[840,475]].map(([cx,cy],i) => (
        <g key={i}><rect x={cx-6} y={cy-6} width="12" height="12" fill="white" stroke="#1f2937" strokeWidth="2" /></g>
      ))}
      {/* Sidewalk */}
      <rect x="60" y="460" width="780" height="15" fill="#d1d5db" stroke="#9ca3af" strokeWidth="1" />
      {/* House footprint */}
      <rect x="260" y="155" width="380" height="185" fill="#94a3b8" stroke="#475569" strokeWidth="2" rx="3" />
      <text x="450" y="243" textAnchor="middle" fill="white" fontSize="14" fontWeight="700">HOUSE</text>
      <text x="450" y="261" textAnchor="middle" fill="rgba(255,255,255,0.75)" fontSize="11">(Building Footprint)</text>
      {/* Driveway */}
      <rect x="375" y="340" width="100" height="120" fill="#cbd5e0" stroke="#94a3b8" strokeWidth="1.5" />
      <text x="425" y="405" textAnchor="middle" fill="#4b5563" fontSize="10" fontWeight="600">DRIVEWAY</text>
      {/* Building envelope dashed */}
      <rect x="145" y="110" width="610" height="270" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="10,5" />
      <text x="450" y="106" textAnchor="middle" fill="#10b981" fontSize="11" fontStyle="italic">— Buildable Area / Building Envelope —</text>
      {/* Dimension labels */}
      <text x="450" y="440" textAnchor="middle" fill="#92400e" fontSize="11" fontWeight="700">FRONT SETBACK ≈ 25 ft</text>
      <text x="450" y="78" textAnchor="middle" fill="#1d4ed8" fontSize="11" fontWeight="700">REAR SETBACK ≈ 10 ft</text>
      <text x="102" y="248" textAnchor="middle" fill="#15803d" fontSize="10" fontWeight="700" transform="rotate(-90,102,248)">SIDE ≈ 7.5 ft</text>
      <text x="797" y="248" textAnchor="middle" fill="#15803d" fontSize="10" fontWeight="700" transform="rotate(90,797,248)">SIDE ≈ 7.5 ft</text>
      {/* North */}
      <text x="855" y="50" textAnchor="middle" fill="#374151" fontSize="12" fontWeight="800">N</text>
      <polygon points="855,55 851,72 855,68 859,72" fill="#374151" />
    </>
  );
}

function EasementsBackground() {
  return (
    <>
      <defs>
        <pattern id="egrid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0L0 0 0 40" fill="none" stroke="#d1d5db" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="900" height="560" fill="#fafaf5" />
      <rect width="900" height="560" fill="url(#egrid)" />
      {/* Street */}
      <rect x="0" y="475" width="900" height="85" fill="#9ca3af" />
      <line x1="450" y1="475" x2="450" y2="560" stroke="white" strokeWidth="3" strokeDasharray="20,15" />
      <text x="450" y="522" textAnchor="middle" fill="white" fontSize="13" fontWeight="700" letterSpacing="2">STREET / PUBLIC RIGHT-OF-WAY</text>
      <line x1="0" y1="475" x2="900" y2="475" stroke="#6b7280" strokeWidth="3" />
      {/* Lot */}
      <rect x="60" y="30" width="780" height="445" fill="#fef9ef" stroke="#1f2937" strokeWidth="3" />
      {[[60,30],[840,30],[60,475],[840,475]].map(([cx,cy],i) => (
        <g key={i}><rect x={cx-6} y={cy-6} width="12" height="12" fill="white" stroke="#1f2937" strokeWidth="2" /></g>
      ))}
      {/* House */}
      <rect x="260" y="155" width="380" height="185" fill="#94a3b8" stroke="#475569" strokeWidth="2" rx="3" />
      <text x="450" y="250" textAnchor="middle" fill="white" fontSize="14" fontWeight="700">HOUSE</text>
      {/* Driveway */}
      <rect x="375" y="340" width="100" height="135" fill="#cbd5e0" stroke="#94a3b8" strokeWidth="1.5" />
      <text x="425" y="410" textAnchor="middle" fill="#4b5563" fontSize="10" fontWeight="600">DRIVEWAY</text>
      {/* Easement labels */}
      <text x="450" y="52" textAnchor="middle" fill="#6d28d9" fontSize="11" fontWeight="700">REAR UTILITY EASEMENT (7.5 ft)</text>
      <text x="87" y="248" textAnchor="middle" fill="#854d0e" fontSize="10" fontWeight="700" transform="rotate(-90,87,248)">FPL EASEMENT (5 ft)</text>
      <text x="812" y="280" textAnchor="middle" fill="#155e75" fontSize="10" fontWeight="700" transform="rotate(90,812,280)">DRAINAGE EASEMENT (5 ft)</text>
      <text x="450" y="445" textAnchor="middle" fill="#991b1b" fontSize="11" fontWeight="700">PUBLIC RIGHT-OF-WAY</text>
      <text x="425" y="355" textAnchor="middle" fill="#c2410c" fontSize="10" fontWeight="700">ACCESS</text>
      <text x="425" y="368" textAnchor="middle" fill="#c2410c" fontSize="10">EASEMENT</text>
      {/* Utility pole */}
      <line x1="90" y1="160" x2="90" y2="240" stroke="#92400e" strokeWidth="4" />
      <line x1="75" y1="180" x2="105" y2="180" stroke="#92400e" strokeWidth="2" />
      <circle cx="75" cy="180" r="4" fill="#eab308" />
      <circle cx="105" cy="180" r="4" fill="#eab308" />
      <text x="90" y="255" textAnchor="middle" fill="#92400e" fontSize="9">UTILITY POLE</text>
      {/* North */}
      <text x="855" y="50" textAnchor="middle" fill="#374151" fontSize="12" fontWeight="800">N</text>
      <polygon points="855,55 851,72 855,68 859,72" fill="#374151" />
    </>
  );
}

function FloodBackground() {
  return (
    <>
      <defs>
        <pattern id="fgrid" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M50 0L0 0 0 50" fill="none" stroke="#bfdbfe" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="900" height="560" fill="#eff6ff" />
      <rect width="900" height="560" fill="url(#fgrid)" />
      {/* Canal / water body at left bottom */}
      <rect x="0" y="400" width="60" height="160" fill="#bfdbfe" stroke="#3b82f6" strokeWidth="2" />
      <text x="30" y="485" textAnchor="middle" fill="#1d4ed8" fontSize="9" fontWeight="700" transform="rotate(-90,30,485)">CANAL</text>
      {/* Multiple property outlines */}
      {[60, 300, 540].map((x, i) => (
        <g key={i}>
          <rect x={x} y="30" width="220" height="200" fill="none" stroke="#374151" strokeWidth="1.5" strokeDasharray="6,3" />
          <rect x={x} y="250" width="220" height="200" fill="none" stroke="#374151" strokeWidth="1.5" strokeDasharray="6,3" />
          {/* Mini house icons */}
          <rect x={x+55} y="70" width="110" height="80" fill="#94a3b8" stroke="#475569" strokeWidth="1.5" rx="2" />
          <text x={x+110} y="115" textAnchor="middle" fill="white" fontSize="10" fontWeight="600">HOUSE</text>
          <rect x={x+55} y="290" width="110" height="80" fill="#94a3b8" stroke="#475569" strokeWidth="1.5" rx="2" />
          <text x={x+110} y="335" textAnchor="middle" fill="white" fontSize="10" fontWeight="600">HOUSE</text>
        </g>
      ))}
      {/* Street */}
      <rect x="60" y="470" width="780" height="30" fill="#9ca3af" />
      <text x="450" y="490" textAnchor="middle" fill="white" fontSize="11" fontWeight="700">STREET</text>
      {/* BFE line label */}
      <text x="870" y="338" textAnchor="end" fill="#dc2626" fontSize="11" fontWeight="800">BFE = 12.0 ft NGVD</text>
      {/* Zone labels */}
      <text x="240" y="510" textAnchor="middle" fill="#1d4ed8" fontSize="13" fontWeight="800">ZONE AE</text>
      <text x="660" y="150" textAnchor="middle" fill="#15803d" fontSize="13" fontWeight="800">ZONE X</text>
      <text x="590" y="390" textAnchor="middle" fill="#4338ca" fontSize="12" fontWeight="700">ZONE AH</text>
      <text x="240" y="380" textAnchor="middle" fill="#1e3a8a" fontSize="11" fontWeight="800">FLOODWAY</text>
      <text x="240" y="395" textAnchor="middle" fill="#1e3a8a" fontSize="10">(No Development)</text>
      {/* FEMA map panel reference */}
      <rect x="680" y="490" width="200" height="55" fill="white" stroke="#d1d5db" strokeWidth="1" rx="4" />
      <text x="780" y="507" textAnchor="middle" fill="#374151" fontSize="9" fontWeight="700">FEMA FIRM Panel</text>
      <text x="780" y="521" textAnchor="middle" fill="#374151" fontSize="9">12011C0346L</text>
      <text x="780" y="535" textAnchor="middle" fill="#374151" fontSize="9">Effective: Nov 17, 2022</text>
      {/* North */}
      <text x="855" y="50" textAnchor="middle" fill="#374151" fontSize="12" fontWeight="800">N</text>
      <polygon points="855,55 851,72 855,68 859,72" fill="#374151" />
    </>
  );
}

function StormwaterBackground() {
  return (
    <>
      <defs>
        <pattern id="wgrid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0L0 0 0 40" fill="none" stroke="#d1fae5" strokeWidth="0.5" />
        </pattern>
        <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <polygon points="0 0, 6 3, 0 6" fill="#0891b2" />
        </marker>
      </defs>
      <rect width="900" height="560" fill="#f0fdf4" />
      <rect width="900" height="560" fill="url(#wgrid)" />
      {/* Street */}
      <rect x="0" y="475" width="900" height="85" fill="#9ca3af" />
      <line x1="450" y1="475" x2="450" y2="560" stroke="white" strokeWidth="3" strokeDasharray="20,15" />
      <text x="450" y="522" textAnchor="middle" fill="white" fontSize="13" fontWeight="700" letterSpacing="2">STREET</text>
      <line x1="0" y1="475" x2="900" y2="475" stroke="#6b7280" strokeWidth="3" />
      {/* Lot */}
      <rect x="60" y="30" width="780" height="445" fill="#f0fdf4" stroke="#1f2937" strokeWidth="3" />
      {/* House */}
      <rect x="260" y="155" width="380" height="185" fill="#94a3b8" stroke="#475569" strokeWidth="2" rx="3" />
      <text x="450" y="250" textAnchor="middle" fill="white" fontSize="14" fontWeight="700">HOUSE</text>
      {/* Driveway */}
      <rect x="375" y="340" width="100" height="135" fill="#cbd5e0" stroke="#94a3b8" strokeWidth="1.5" />
      {/* Downspouts / flow arrows */}
      <line x1="260" y1="260" x2="180" y2="310" stroke="#0891b2" strokeWidth="2" markerEnd="url(#arrowhead)" strokeDasharray="5,3" />
      <line x1="640" y1="260" x2="750" y2="290" stroke="#0891b2" strokeWidth="2" markerEnd="url(#arrowhead)" strokeDasharray="5,3" />
      <line x1="350" y1="340" x2="280" y2="400" stroke="#0891b2" strokeWidth="2" markerEnd="url(#arrowhead)" strokeDasharray="5,3" />
      <line x1="475" y1="475" x2="430" y2="470" stroke="#0891b2" strokeWidth="2" markerEnd="url(#arrowhead)" />
      {/* Flow to swale arrow */}
      <line x1="820" y1="250" x2="850" y2="250" stroke="#0891b2" strokeWidth="2" markerEnd="url(#arrowhead)" />
      {/* Storm drain circle at street */}
      <ellipse cx="420" cy="468" rx="25" ry="8" fill="#155e75" stroke="#0891b2" strokeWidth="2" />
      <text x="420" y="458" textAnchor="middle" fill="#155e75" fontSize="9" fontWeight="700">STORM DRAIN</text>
      {/* Impervious % label */}
      <text x="450" y="207" textAnchor="middle" fill="white" fontSize="10">ROOF (impervious)</text>
      <text x="425" y="415" textAnchor="middle" fill="#4b5563" fontSize="9">DRIVE</text>
      {/* Label */}
      <text x="140" y="205" textAnchor="middle" fill="#065f46" fontSize="10" fontWeight="700">RETENTION</text>
      <text x="140" y="220" textAnchor="middle" fill="#065f46" fontSize="10" fontWeight="700">AREA</text>
      <text x="165" y="370" textAnchor="middle" fill="#166534" fontSize="10" fontWeight="600">PERVIOUS</text>
      <text x="165" y="384" textAnchor="middle" fill="#166534" fontSize="10">LAWN</text>
      <text x="820" y="270" textAnchor="middle" fill="#155e75" fontSize="10" fontWeight="700" transform="rotate(90,820,270)">DRAINAGE SWALE →</text>
      {/* North */}
      <text x="855" y="50" textAnchor="middle" fill="#374151" fontSize="12" fontWeight="800">N</text>
      <polygon points="855,55 851,72 855,68 859,72" fill="#374151" />
    </>
  );
}

const BACKGROUNDS = {
  setbacks:   SetbacksBackground,
  easements:  EasementsBackground,
  flood:      FloodBackground,
  stormwater: StormwaterBackground,
};

// ── COMPONENT ─────────────────────────────────────────────────────────────────

export default function ZoningView({ view, showHighlights, onZoneClick }) {
  const [hoveredZone, setHoveredZone] = useState(null);
  const zones  = VIEW_ZONES[view]  || SETBACK_ZONES;
  const legend = LEGENDS[view]     || LEGENDS.setbacks;
  const Bg     = BACKGROUNDS[view] || SetbacksBackground;

  const getCenter = (zone) => {
    if (zone.type === "rect") {
      return { cx: zone.x + zone.w / 2, cy: zone.y };
    }
    return { cx: 450, cy: 100 };
  };

  return (
    <div className="space-y-4">
      <div className="relative rounded-2xl overflow-hidden shadow-xl border border-gray-200 bg-white select-none" style={{ aspectRatio: "16/9" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <svg
              viewBox="0 0 900 560"
              className="w-full h-full"
              style={{ display: "block" }}
            >
              <Bg />

              {/* Interactive zones */}
              {zones.map((zone) => {
                const isHovered = hoveredZone === zone.id;
                const visible   = showHighlights || isHovered;
                const { cx, cy } = getCenter(zone);

                return (
                  <g
                    key={zone.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => onZoneClick(zone.id, zone.label)}
                    onMouseEnter={() => setHoveredZone(zone.id)}
                    onMouseLeave={() => setHoveredZone(null)}
                  >
                    {zone.type === "rect" && (
                      <rect
                        x={zone.x} y={zone.y} width={zone.w} height={zone.h}
                        fill={visible ? zone.color : "transparent"}
                        stroke={visible ? zone.stroke : "transparent"}
                        strokeWidth={isHovered ? 2.5 : 1.5}
                        strokeDasharray={isHovered ? "0" : "7,4"}
                        style={{ transition: "fill 0.15s, stroke 0.15s" }}
                      />
                    )}

                    {isHovered && (
                      <g>
                        <rect
                          x={Math.min(cx - 80, 820)} y={Math.max(cy - 36, 4)}
                          width={160} height={26}
                          rx={5} ry={5}
                          fill="rgba(0,0,0,0.87)"
                        />
                        <text
                          x={Math.min(cx, 900 - 80)} y={Math.max(cy - 19, 20)}
                          textAnchor="middle"
                          fill="white"
                          fontSize={11.5}
                          fontWeight="600"
                          style={{ pointerEvents: "none", userSelect: "none" }}
                        >
                          {zone.label}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Hint */}
              <text x="880" y="550" textAnchor="end" fill="rgba(100,116,139,0.8)" fontSize="10">
                {showHighlights ? "Click any zone for details" : "Hover to explore zones"}
              </text>
            </svg>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Legend */}
      {showHighlights && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Zone Legend</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {legend.map(item => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: item.color, opacity: 0.85 }} />
                <span className="text-xs text-gray-600">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}