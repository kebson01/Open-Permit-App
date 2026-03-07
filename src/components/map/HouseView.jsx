import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const HOUSE_IMAGE = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ac5571087590fc03d44b73/ba3e9a8c2_ResidentialHouse.png";

// The image is 1270×672 px (approx 1.89:1 ratio)
// Zones are defined as percentages (0–100) of the image width/height
// so they work at any rendered size.

// ─────────────────────────────────────────────
//  ALL ZONES — one view, one image
//  The uploaded illustration already shows
//  exterior, interior cut-away, pool, pergola,
//  shed, solar, garage, fence, generator, etc.
// ─────────────────────────────────────────────
const ALL_ZONES = [
  // ── ROOF ──────────────────────────────────────────
  { id: "roof",        label: "Roof / Re-Roof",         desc: "Roofing replacement or repair",              x: 22,  y: 1,   w: 55,  h: 18,  color: "rgba(239,68,68,0.25)",   stroke: "#ef4444" },

  // ── SOLAR PANELS (on roof, top-center) ───────────
  { id: "solar",       label: "Solar Panel",             desc: "Photovoltaic system installation",           x: 37,  y: 2,   w: 20,  h: 12,  color: "rgba(234,179,8,0.35)",   stroke: "#eab308" },

  // ── UPPER WINDOWS (2nd floor left framing) ───────
  { id: "win_upper",   label: "Window Replacement",      desc: "Impact windows, retrofit windows",           x: 23,  y: 20,  w: 14,  h: 10,  color: "rgba(59,130,246,0.3)",   stroke: "#3b82f6" },

  // ── UPPER WINDOWS right ───────────────────────────
  { id: "win_upper2",  label: "Window Replacement",      desc: "Impact windows, retrofit windows",           x: 55,  y: 18,  w: 14,  h: 10,  color: "rgba(59,130,246,0.3)",   stroke: "#3b82f6" },

  // ── HURRICANE SHUTTERS (roller visible left wall) ─
  { id: "shutters",    label: "Hurricane Shutters",      desc: "Accordion, panel, roll-down shutters",       x: 31,  y: 56,  w: 8,   h: 12,  color: "rgba(168,85,247,0.35)",  stroke: "#a855f7" },

  // ── GARAGE DOOR ───────────────────────────────────
  { id: "garage",      label: "Garage Door",             desc: "Garage door replacement",                    x: 13,  y: 42,  w: 18,  h: 22,  color: "rgba(249,115,22,0.3)",   stroke: "#f97316" },

  // ── FRONT DOOR ────────────────────────────────────
  { id: "door",        label: "Door Replacement",        desc: "Exterior door installation",                 x: 33,  y: 54,  w: 7,   h: 18,  color: "rgba(139,92,246,0.3)",   stroke: "#8b5cf6" },

  // ── FENCE / GATE (front left) ────────────────────
  { id: "fence_front", label: "Fence / Gate",            desc: "Fence and gate installation",                x: 0,   y: 52,  w: 13,  h: 30,  color: "rgba(34,197,94,0.3)",    stroke: "#22c55e" },

  // ── FENCE right side ─────────────────────────────
  { id: "fence_right", label: "Fence / Gate",            desc: "Fence and gate installation",                x: 77,  y: 30,  w: 8,   h: 38,  color: "rgba(34,197,94,0.3)",    stroke: "#22c55e" },

  // ── DRIVEWAY (concrete, front-left) ──────────────
  { id: "driveway",    label: "Driveway (Concrete)",     desc: "Concrete driveway installation",             x: 0,   y: 68,  w: 28,  h: 20,  color: "rgba(107,114,128,0.3)",  stroke: "#6b7280" },

  // ── DRIVEWAY PAVER ────────────────────────────────
  { id: "paver",       label: "Driveway (Paver)",        desc: "Paver driveway installation",                x: 3,   y: 75,  w: 20,  h: 12,  color: "rgba(180,83,9,0.25)",    stroke: "#b45309" },

  // ── WALKWAY / SIDEWALK (left street edge) ────────
  { id: "walkway",     label: "Walkway / Sidewalk",      desc: "Pedestrian walkway construction",            x: 0,   y: 85,  w: 30,  h: 10,  color: "rgba(156,163,175,0.3)",  stroke: "#9ca3af" },

  // ── SWALE (bottom strip) ─────────────────────────
  { id: "swale",       label: "Swale",                   desc: "Drainage swale modification",                x: 0,   y: 91,  w: 40,  h: 9,   color: "rgba(16,185,129,0.2)",   stroke: "#10b981" },

  // ── NEW CONSTRUCTION / ADDITION (left open frame) ─
  { id: "addition",    label: "Residential Addition",    desc: "Room additions, extensions",                 x: 21,  y: 14,  w: 16,  h: 42,  color: "rgba(99,102,241,0.2)",   stroke: "#6366f1" },

  // ── REMODEL (interior cut-away, ground floor) ────
  { id: "remodel",     label: "Residential Remodel",     desc: "Interior alterations/renovations",           x: 37,  y: 40,  w: 25,  h: 30,  color: "rgba(245,158,11,0.2)",   stroke: "#f59e0b" },

  // ── NEW CONSTRUCTION (whole home shell) ──────────
  { id: "newconst",    label: "New Construction",        desc: "New home construction",                      x: 21,  y: 1,   w: 57,  h: 72,  color: "rgba(99,102,241,0.08)",  stroke: "#6366f1" },

  // ── ELECTRICAL SERVICE PANEL (left exterior wall) ─
  { id: "panel",       label: "Electrical Service",      desc: "Panel upgrade, service change",              x: 37,  y: 35,  w: 4,   h: 8,   color: "rgba(234,179,8,0.45)",   stroke: "#eab308" },

  // ── EV CHARGER (garage wall interior) ────────────
  { id: "ev",          label: "EV Charger",              desc: "Electric vehicle charging station",          x: 15,  y: 52,  w: 6,   h: 7,   color: "rgba(14,165,233,0.35)",  stroke: "#0ea5e9" },

  // ── LOW VOLTAGE ALARM (upper interior wall) ───────
  { id: "alarm",       label: "Low Voltage Alarm",       desc: "Security/fire alarm systems",                x: 57,  y: 20,  w: 5,   h: 7,   color: "rgba(220,38,38,0.35)",   stroke: "#dc2626" },

  // ── WATER HEATER (interior utility, right of kitchen) ─
  { id: "wh",          label: "Water Heater",            desc: "Water heater replacement (≤80 gal)",         x: 55,  y: 30,  w: 5,   h: 10,  color: "rgba(239,68,68,0.35)",   stroke: "#ef4444" },

  // ── GAS SYSTEM (piping, interior right) ──────────
  { id: "gas",         label: "Gas System",              desc: "LP/natural gas piping and outlets",          x: 59,  y: 40,  w: 5,   h: 14,  color: "rgba(249,115,22,0.35)",  stroke: "#f97316" },

  // ── BACKFLOW PREVENTER (exterior left near meter) ─
  { id: "backflow",    label: "Backflow Preventer",      desc: "Backflow device installation",               x: 8,   y: 60,  w: 5,   h: 7,   color: "rgba(16,185,129,0.35)",  stroke: "#10b981" },

  // ── TEMP ELECTRIC (utility pole left) ────────────
  { id: "tempelec",    label: "Temporary Electric Service", desc: "30-day construction power",               x: 2,   y: 30,  w: 6,   h: 28,  color: "rgba(234,179,8,0.25)",   stroke: "#eab308" },

  // ── A/C REPLACEMENT (HVAC inside + ducts) ────────
  { id: "ac",          label: "A/C Replacement",         desc: "Air conditioning change-out (≤5 tons)",      x: 60,  y: 22,  w: 7,   h: 14,  color: "rgba(14,165,233,0.35)",  stroke: "#0ea5e9" },

  // ── GENERATOR (right side backyard) ──────────────
  { id: "gen",         label: "Generator",               desc: "Emergency generator installation",           x: 86,  y: 54,  w: 8,   h: 11,  color: "rgba(220,38,38,0.3)",    stroke: "#dc2626" },

  // ── POOL ─────────────────────────────────────────
  { id: "pool",        label: "Pool",                    desc: "New swimming pool installation",             x: 72,  y: 56,  w: 19,  h: 26,  color: "rgba(6,182,212,0.3)",    stroke: "#06b6d4" },

  // ── POOL DECK (concrete surround) ────────────────
  { id: "pdeck",       label: "Pool Deck",               desc: "Pool deck construction",                     x: 69,  y: 54,  w: 25,  h: 30,  color: "rgba(245,158,11,0.2)",   stroke: "#f59e0b" },

  // ── POOL RESURFACING (inside pool) ───────────────
  { id: "presurf",     label: "Pool Resurfacing",        desc: "Pool replastering and tile",                 x: 73,  y: 58,  w: 17,  h: 20,  color: "rgba(34,211,238,0.25)",  stroke: "#22d3ee" },

  // ── POOL HEATER (right of pool) ──────────────────
  { id: "pheater",     label: "Pool Heater",             desc: "Gas or electric pool heater",                x: 90,  y: 64,  w: 5,   h: 7,   color: "rgba(239,68,68,0.3)",    stroke: "#ef4444" },

  // ── POOL EQUIPMENT (pump/filter) ─────────────────
  { id: "pequip",      label: "Pool Equipment",          desc: "Pump, filter, equipment changes",            x: 90,  y: 72,  w: 5,   h: 7,   color: "rgba(249,115,22,0.3)",   stroke: "#f97316" },

  // ── SPA / HOT TUB (top-right of pool area) ───────
  { id: "spa",         label: "Spa / Hot Tub",           desc: "Spa or hot tub installation",                x: 88,  y: 58,  w: 6,   h: 7,   color: "rgba(168,85,247,0.3)",   stroke: "#a855f7" },

  // ── PERGOLA (right rear of house) ────────────────
  { id: "pergola",     label: "Pergola",                 desc: "Pergola or gazebo structure",                x: 78,  y: 32,  w: 14,  h: 20,  color: "rgba(217,119,6,0.3)",    stroke: "#d97706" },

  // ── DECK (right side wooden deck) ────────────────
  { id: "deck",        label: "Deck",                    desc: "Wood or composite deck",                     x: 62,  y: 55,  w: 14,  h: 18,  color: "rgba(120,53,15,0.3)",    stroke: "#92400e" },

  // ── PATIO / SLAB ─────────────────────────────────
  { id: "patio",       label: "Patio / Slab",            desc: "Concrete patio or slab",                    x: 62,  y: 70,  w: 10,  h: 12,  color: "rgba(107,114,128,0.3)",  stroke: "#6b7280" },

  // ── SHED (far right) ─────────────────────────────
  { id: "shed",        label: "Shed",                    desc: "Accessory structure/shed (≤150 sq ft)",      x: 93,  y: 40,  w: 7,   h: 16,  color: "rgba(120,53,15,0.3)",    stroke: "#78350f" },

  // ── SCREEN ENCLOSURE (pool cage outline) ─────────
  { id: "screen",      label: "Screen Enclosure",        desc: "Pool cage, screen room",                     x: 69,  y: 52,  w: 26,  h: 33,  color: "rgba(14,165,233,0.12)",  stroke: "#0ea5e9" },

  // ── IRRIGATION ───────────────────────────────────
  { id: "irrig",       label: "Irrigation System",       desc: "Sprinkler system installation",              x: 14,  y: 62,  w: 18,  h: 12,  color: "rgba(16,185,129,0.25)",  stroke: "#10b981" },

  // ── RETAINING WALL (right boundary) ──────────────
  { id: "retwall",     label: "Retaining Wall",          desc: "Retaining wall construction",                x: 97,  y: 40,  w: 3,   h: 30,  color: "rgba(180,83,9,0.3)",     stroke: "#b45309" },
];

const LEGEND = [
  { label: "Roof / Re-Roof",              color: "#ef4444" },
  { label: "Solar Panel",                 color: "#eab308" },
  { label: "Window Replacement",          color: "#3b82f6" },
  { label: "Hurricane Shutters",          color: "#a855f7" },
  { label: "Garage Door",                 color: "#f97316" },
  { label: "Door Replacement",            color: "#8b5cf6" },
  { label: "Fence / Gate",                color: "#22c55e" },
  { label: "Driveway / Walkway",          color: "#6b7280" },
  { label: "New Construction / Addition", color: "#6366f1" },
  { label: "Residential Remodel",         color: "#f59e0b" },
  { label: "Electrical Service / Panel",  color: "#eab308" },
  { label: "EV Charger",                  color: "#0ea5e9" },
  { label: "A/C Replacement",             color: "#0ea5e9" },
  { label: "Generator",                   color: "#dc2626" },
  { label: "Water Heater",                color: "#ef4444" },
  { label: "Gas System",                  color: "#f97316" },
  { label: "Backflow Preventer",          color: "#10b981" },
  { label: "Pool",                        color: "#06b6d4" },
  { label: "Pool Deck",                   color: "#f59e0b" },
  { label: "Pool Resurfacing",            color: "#22d3ee" },
  { label: "Spa / Hot Tub",               color: "#a855f7" },
  { label: "Pergola",                     color: "#d97706" },
  { label: "Deck / Patio",               color: "#92400e" },
  { label: "Shed",                        color: "#78350f" },
  { label: "Screen Enclosure",            color: "#0ea5e9" },
  { label: "Irrigation System",           color: "#10b981" },
  { label: "Swale",                       color: "#10b981" },
];

export default function HouseView({ view, showHighlights, onZoneClick }) {
  const [hoveredZone, setHoveredZone] = useState(null);
  const [imgSize, setImgSize] = useState({ w: 1, h: 1 });
  const containerRef = React.useRef(null);

  // We use a single image + absolutely-positioned div overlays (% based)
  // so zones snap perfectly to the illustration at every screen size.

  return (
    <div className="space-y-4">
      <div
        ref={containerRef}
        className="relative rounded-2xl overflow-hidden shadow-xl border border-gray-200 bg-gray-900 select-none"
        style={{ aspectRatio: "1270/672" }}
      >
        {/* House illustration */}
        <img
          src={HOUSE_IMAGE}
          alt="Residential house illustration"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />

        {/* Permit zone overlays */}
        {ALL_ZONES.map((zone) => {
          const isHovered = hoveredZone === zone.id;
          const visible = showHighlights || isHovered;
          return (
            <div
              key={zone.id}
              onClick={() => onZoneClick(zone.label, zone.desc)}
              onMouseEnter={() => setHoveredZone(zone.id)}
              onMouseLeave={() => setHoveredZone(null)}
              className="absolute cursor-pointer transition-all duration-150"
              style={{
                left: `${zone.x}%`,
                top: `${zone.y}%`,
                width: `${zone.w}%`,
                height: `${zone.h}%`,
                backgroundColor: visible ? zone.color : "transparent",
                border: visible ? `2px ${isHovered ? "solid" : "dashed"} ${zone.stroke}` : "2px solid transparent",
                borderRadius: "5px",
                boxShadow: isHovered ? `0 0 0 2px ${zone.stroke}55` : "none",
              }}
            >
              {/* Tooltip on hover */}
              {isHovered && (
                <div
                  className="absolute z-20 pointer-events-none"
                  style={{
                    bottom: "calc(100% + 6px)",
                    left: "50%",
                    transform: "translateX(-50%)",
                    whiteSpace: "nowrap",
                  }}
                >
                  <div className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold shadow-xl"
                    style={{ background: "rgba(0,0,0,0.85)" }}>
                    {zone.label}
                  </div>
                  <div className="text-center">
                    <div className="inline-block w-0 h-0"
                      style={{
                        borderLeft: "6px solid transparent",
                        borderRight: "6px solid transparent",
                        borderTop: "6px solid rgba(0,0,0,0.85)",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Hover hint at bottom */}
        <div className="absolute bottom-2 right-3 text-white/60 text-xs pointer-events-none">
          {showHighlights ? "Click any highlighted zone" : "Hover to discover permit zones"}
        </div>
      </div>

      {/* Color legend */}
      {showHighlights && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Permit Zones Legend</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {LEGEND.map(item => (
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