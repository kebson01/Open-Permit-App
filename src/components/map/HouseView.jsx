import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const HOUSE_IMAGE = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ac5571087590fc03d44b73/da7676c7b_image_d0f54e86.png";

// The image is 1270×672 px (approx 1.89:1 ratio)
// Zones are defined as percentages (0–100) of the image width/height
// so they work at any rendered size.

// ─────────────────────────────────────────────
//  ALL ZONES — matched to the labeled guide image
//  Coordinates are % of image width/height
// ─────────────────────────────────────────────
const ALL_ZONES = [
  // ── NEW CONSTRUCTION (left open framing, upper-left) ─
  { id: "newconst",    label: "New Construction",            desc: "New home construction — early stages",         x: 21,  y: 5,   w: 16,  h: 38, color: "rgba(99,102,241,0.2)",   stroke: "#6366f1" },

  // ── SOLAR PANELS (top-center roof) ───────────────────
  { id: "solar",       label: "Solar Panels",                desc: "Photovoltaic system installation",              x: 36,  y: 3,   w: 20,  h: 13, color: "rgba(234,179,8,0.4)",    stroke: "#eab308" },

  // ── ROOF / RE-ROOF (full roof span) ──────────────────
  { id: "roof",        label: "Roof / Re-Roof",              desc: "Installing roofing materials & construction",   x: 22,  y: 2,   w: 53,  h: 19, color: "rgba(239,68,68,0.2)",    stroke: "#ef4444" },

  // ── WINDOW REPLACEMENT (upper right windows) ─────────
  { id: "win_right",   label: "Window Replacement",          desc: "New impact windows in front entrance install",  x: 56,  y: 16,  w: 14,  h: 12, color: "rgba(59,130,246,0.3)",   stroke: "#3b82f6" },

  // ── HURRICANE SHUTTERS (right side, accordion) ───────
  { id: "shutters",    label: "Hurricane Shutters",          desc: "Accordion shutters installed",                  x: 57,  y: 28,  w: 9,   h: 13, color: "rgba(168,85,247,0.35)",  stroke: "#a855f7" },

  // ── A/C REPLACEMENT (upper left, split system unit) ──
  { id: "ac",          label: "A/C Replacement",             desc: "New split system and instant unit",             x: 7,   y: 22,  w: 11,  h: 13, color: "rgba(14,165,233,0.35)",  stroke: "#0ea5e9" },

  // ── GENERATOR (left side exterior) ───────────────────
  { id: "gen",         label: "Generator",                   desc: "Emergency generator installation",              x: 4,   y: 36,  w: 9,   h: 11, color: "rgba(220,38,38,0.35)",   stroke: "#dc2626" },

  // ── TEMPORARY ELECTRIC SERVICE (utility pole left) ───
  { id: "tempelec",    label: "Temporary Electric Service",  desc: "Temporary power pole",                         x: 0,   y: 33,  w: 7,   h: 30, color: "rgba(234,179,8,0.25)",   stroke: "#eab308" },

  // ── EV CHARGER + GARAGE DOOR (garage front) ──────────
  { id: "garage",      label: "EV / Garage Door",            desc: "EV charger & garage door replacement",          x: 13,  y: 42,  w: 17,  h: 24, color: "rgba(249,115,22,0.3)",   stroke: "#f97316" },

  // ── ELECTRICAL SERVICE (panel, interior left wall) ───
  { id: "panel",       label: "Electrical Service",          desc: "Panel upgrade, service change",                 x: 37,  y: 30,  w: 4,   h: 8,  color: "rgba(234,179,8,0.5)",    stroke: "#eab308" },

  // ── HVAC (ducts, interior center) ────────────────────
  { id: "hvac",        label: "A/C Replacement (HVAC)",      desc: "Air conditioning change-out (≤5 tons)",         x: 41,  y: 38,  w: 12,  h: 14, color: "rgba(14,165,233,0.3)",   stroke: "#0ea5e9" },

  // ── RESIDENTIAL REMODEL (ground floor cut-away) ──────
  { id: "remodel",     label: "Residential Remodel",         desc: "Interior alterations / renovations",            x: 38,  y: 50,  w: 24,  h: 22, color: "rgba(245,158,11,0.25)",  stroke: "#f59e0b" },

  // ── PLUMBING (center-bottom interior) ────────────────
  { id: "plumbing",    label: "Plumbing",                    desc: "Plumbing rough-in, fixtures, re-pipe",          x: 43,  y: 62,  w: 10,  h: 12, color: "rgba(6,182,212,0.3)",    stroke: "#06b6d4" },

  // ── WINDOW REPLACEMENT lower (front ground floor) ────
  { id: "win_lower",   label: "Window Replacement",          desc: "New impact windows",                            x: 28,  y: 63,  w: 12,  h: 10, color: "rgba(59,130,246,0.3)",   stroke: "#3b82f6" },

  // ── WALKWAY / SIDEWALK (center-bottom) ───────────────
  { id: "walkway",     label: "Walkway / Sidewalk",          desc: "Concrete paths",                                x: 28,  y: 78,  w: 16,  h: 10, color: "rgba(156,163,175,0.35)", stroke: "#9ca3af" },

  // ── SWALE (bottom center-left) ───────────────────────
  { id: "swale",       label: "Swale",                       desc: "Swale modification",                            x: 20,  y: 88,  w: 28,  h: 9,  color: "rgba(16,185,129,0.25)",  stroke: "#10b981" },

  // ── DRIVEWAY CONCRETE (front left) ───────────────────
  { id: "driveway",    label: "Driveway (Concrete)",         desc: "Concrete driveway installation",                x: 5,   y: 68,  w: 22,  h: 18, color: "rgba(107,114,128,0.3)",  stroke: "#6b7280" },

  // ── DRIVEWAY PAVER (far left bottom) ─────────────────
  { id: "paver",       label: "Driveway (Paver)",            desc: "Paver driveway installation",                   x: 0,   y: 80,  w: 14,  h: 14, color: "rgba(180,83,9,0.3)",     stroke: "#b45309" },

  // ── FENCE / GATE (left front) ────────────────────────
  { id: "fence",       label: "Fence / Gate",                desc: "Fence and gate installation",                   x: 0,   y: 52,  w: 14,  h: 28, color: "rgba(34,197,94,0.3)",    stroke: "#22c55e" },

  // ── LANDSCAPE SYSTEM (front yard) ────────────────────
  { id: "irrig",       label: "Irrigation System",           desc: "Landscape / sprinkler system",                  x: 8,   y: 62,  w: 16,  h: 10, color: "rgba(16,185,129,0.3)",   stroke: "#10b981" },

  // ── PERGOLA (right back, wooden structure) ───────────
  { id: "pergola",     label: "Pergola",                     desc: "Pergola or gazebo structure",                   x: 77,  y: 28,  w: 15,  h: 22, color: "rgba(217,119,6,0.3)",    stroke: "#d97706" },

  // ── SHED (far right) ─────────────────────────────────
  { id: "shed",        label: "Shed (≤150 sq ft)",           desc: "Accessory structure / shed permit",             x: 92,  y: 36,  w: 8,   h: 20, color: "rgba(120,53,15,0.35)",   stroke: "#78350f" },

  // ── DECK (right mid, wood deck) ──────────────────────
  { id: "deck",        label: "Deck",                        desc: "Wood or composite deck",                        x: 62,  y: 50,  w: 16,  h: 18, color: "rgba(120,53,15,0.3)",    stroke: "#92400e" },

  // ── PATIO / SLAB (center-right ground) ───────────────
  { id: "patio",       label: "Patio / Slab",                desc: "Concrete patio or slab",                        x: 58,  y: 65,  w: 14,  h: 12, color: "rgba(107,114,128,0.3)",  stroke: "#6b7280" },

  // ── POOL & SPA (right lower) ─────────────────────────
  { id: "pool",        label: "Pool & Spa",                  desc: "New swimming pool / spa installation",          x: 68,  y: 58,  w: 22,  h: 28, color: "rgba(6,182,212,0.3)",    stroke: "#06b6d4" },

  // ── POOL SPA (small spa beside pool) ─────────────────
  { id: "poolspa",     label: "Pool Spa",                    desc: "Spa / hot tub installation",                    x: 66,  y: 68,  w: 6,   h: 10, color: "rgba(168,85,247,0.35)",  stroke: "#a855f7" },

  // ── POOL DECK (surround) ─────────────────────────────
  { id: "pdeck",       label: "Pool Deck",                   desc: "Pool deck construction",                        x: 58,  y: 78,  w: 32,  h: 10, color: "rgba(245,158,11,0.25)",  stroke: "#f59e0b" },

  // ── POOL HEATER (far right, gas-fired) ───────────────
  { id: "pheater",     label: "Pool Heater (gas-fired)",     desc: "Gas or electric pool heater",                   x: 90,  y: 60,  w: 8,   h: 10, color: "rgba(239,68,68,0.35)",   stroke: "#ef4444" },

  // ── POOL RESURFACING ─────────────────────────────────
  { id: "presurf",     label: "Pool Resurfacing",            desc: "Pool replastering and tile",                    x: 90,  y: 70,  w: 8,   h: 8,  color: "rgba(34,211,238,0.35)",  stroke: "#22d3ee" },

  // ── POOL EQUIPMENT (pump, far right bottom) ──────────
  { id: "pequip",      label: "Pool Equipment",              desc: "Pump, filter, equipment changes",               x: 90,  y: 78,  w: 8,   h: 10, color: "rgba(249,115,22,0.35)",  stroke: "#f97316" },

  // ── SWALE right ──────────────────────────────────────
  { id: "swale_r",     label: "Swale",                       desc: "Swale modification",                            x: 73,  y: 50,  w: 18,  h: 8,  color: "rgba(16,185,129,0.2)",   stroke: "#10b981" },
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
        style={{ aspectRatio: "1280/720" }}
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