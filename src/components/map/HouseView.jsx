import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const IMAGES = {
  front: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ac5571087590fc03d44b73/15bd0c53d_FrontView.png",
  back:  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ac5571087590fc03d44b73/7a4bb9a51_BackView.png",
  eagle: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ac5571087590fc03d44b73/4422873fc_EagleEyeView.png",
};

// ── FRONT VIEW ZONES ─────────────────────────────────────────────────────────
const FRONT_ZONES = [
  { id: "roof",       label: "Roof / Re-Roof",            desc: "Roofing replacement or repair",                x: 10,  y: 2,   w: 80,  h: 22, color: "rgba(239,68,68,0.22)",   stroke: "#ef4444" },
  { id: "solar",      label: "Solar Panels",              desc: "Photovoltaic system installation",             x: 30,  y: 3,   w: 20,  h: 10, color: "rgba(234,179,8,0.38)",   stroke: "#eab308" },
  { id: "win_2nd_l",  label: "Window Replacement",        desc: "Impact windows / retrofit windows",            x: 12,  y: 20,  w: 18,  h: 12, color: "rgba(59,130,246,0.3)",   stroke: "#3b82f6" },
  { id: "win_2nd_r",  label: "Window Replacement",        desc: "Impact windows / retrofit windows",            x: 52,  y: 18,  w: 28,  h: 13, color: "rgba(59,130,246,0.3)",   stroke: "#3b82f6" },
  { id: "balcony",    label: "Residential Addition",      desc: "Balcony / room addition",                      x: 32,  y: 26,  w: 20,  h: 8,  color: "rgba(99,102,241,0.28)",  stroke: "#6366f1" },
  { id: "win_1st_l",  label: "Window Replacement",        desc: "Impact windows / retrofit windows",            x: 14,  y: 42,  w: 14,  h: 15, color: "rgba(59,130,246,0.3)",   stroke: "#3b82f6" },
  { id: "win_1st_r",  label: "Window Replacement",        desc: "Impact windows / retrofit windows",            x: 55,  y: 40,  w: 24,  h: 18, color: "rgba(59,130,246,0.3)",   stroke: "#3b82f6" },
  { id: "garage",     label: "Garage Door",               desc: "Garage door replacement",                      x: 10,  y: 33,  w: 16,  h: 25, color: "rgba(249,115,22,0.3)",   stroke: "#f97316" },
  { id: "shutters",   label: "Hurricane Shutters",        desc: "Accordion, panel, roll-down shutters",         x: 54,  y: 39,  w: 25,  h: 20, color: "rgba(168,85,247,0.22)",  stroke: "#a855f7" },
  { id: "ac",         label: "A/C Replacement",           desc: "Air conditioning change-out (≤5 tons)",        x: 68,  y: 55,  w: 10,  h: 10, color: "rgba(14,165,233,0.38)",  stroke: "#0ea5e9" },
  { id: "door",       label: "Door Replacement",          desc: "Exterior door installation",                   x: 44,  y: 46,  w: 10,  h: 22, color: "rgba(139,92,246,0.3)",   stroke: "#8b5cf6" },
  { id: "fence",      label: "Fence / Gate",              desc: "Fence and gate installation",                  x: 0,   y: 45,  w: 10,  h: 40, color: "rgba(34,197,94,0.28)",   stroke: "#22c55e" },
  { id: "driveway",   label: "Driveway (Paver)",          desc: "Paver driveway installation",                  x: 0,   y: 68,  w: 30,  h: 25, color: "rgba(107,114,128,0.28)", stroke: "#6b7280" },
  { id: "walkway",    label: "Walkway / Sidewalk",        desc: "Concrete paths",                               x: 35,  y: 72,  w: 14,  h: 22, color: "rgba(156,163,175,0.3)",  stroke: "#9ca3af" },
  { id: "landscaping",label: "Irrigation System",         desc: "Landscape / sprinkler system",                 x: 10,  y: 60,  w: 30,  h: 12, color: "rgba(16,185,129,0.25)",  stroke: "#10b981" },
  { id: "pool_peek",  label: "Pool & Spa",                desc: "New swimming pool / spa installation",         x: 82,  y: 48,  w: 18,  h: 22, color: "rgba(6,182,212,0.3)",    stroke: "#06b6d4" },
  { id: "pergola_f",  label: "Pergola",                   desc: "Pergola or gazebo structure",                  x: 80,  y: 36,  w: 20,  h: 16, color: "rgba(217,119,6,0.28)",   stroke: "#d97706" },
  { id: "swale",      label: "Swale",                     desc: "Drainage swale modification",                  x: 0,   y: 91,  w: 55,  h: 9,  color: "rgba(16,185,129,0.2)",   stroke: "#10b981" },
  { id: "newconst",   label: "New Construction",          desc: "New home construction",                        x: 10,  y: 2,   w: 80,  h: 88, color: "rgba(99,102,241,0.06)",  stroke: "#6366f1" },
];

// ── BACK VIEW ZONES ──────────────────────────────────────────────────────────
const BACK_ZONES = [
  { id: "roof_b",     label: "Roof / Re-Roof",            desc: "Roofing replacement or repair",                x: 5,   y: 2,   w: 88,  h: 26, color: "rgba(239,68,68,0.22)",   stroke: "#ef4444" },
  { id: "solar_b",    label: "Solar Panels",              desc: "Photovoltaic system installation",             x: 25,  y: 3,   w: 22,  h: 10, color: "rgba(234,179,8,0.38)",   stroke: "#eab308" },
  { id: "win_2nd_bl", label: "Window Replacement",        desc: "Impact windows / retrofit windows",            x: 7,   y: 18,  w: 14,  h: 14, color: "rgba(59,130,246,0.3)",   stroke: "#3b82f6" },
  { id: "win_2nd_bc", label: "Window Replacement",        desc: "Impact windows / retrofit windows",            x: 30,  y: 16,  w: 36,  h: 16, color: "rgba(59,130,246,0.3)",   stroke: "#3b82f6" },
  { id: "win_2nd_br", label: "Window Replacement",        desc: "Impact windows / retrofit windows",            x: 72,  y: 20,  w: 14,  h: 12, color: "rgba(59,130,246,0.3)",   stroke: "#3b82f6" },
  { id: "balcony_b",  label: "Residential Addition",      desc: "Balcony / deck addition",                      x: 27,  y: 30,  w: 42,  h: 10, color: "rgba(99,102,241,0.28)",  stroke: "#6366f1" },
  { id: "win_1st_b",  label: "Window Replacement",        desc: "Impact windows / retrofit windows",            x: 27,  y: 40,  w: 42,  h: 18, color: "rgba(59,130,246,0.3)",   stroke: "#3b82f6" },
  { id: "door_b",     label: "Door Replacement",          desc: "Exterior / sliding door installation",         x: 35,  y: 42,  w: 26,  h: 20, color: "rgba(139,92,246,0.28)",  stroke: "#8b5cf6" },
  { id: "ac_b",       label: "A/C Replacement",           desc: "Air conditioning change-out (≤5 tons)",        x: 8,   y: 48,  w: 12,  h: 10, color: "rgba(14,165,233,0.4)",   stroke: "#0ea5e9" },
  { id: "patio_b",    label: "Patio / Slab",              desc: "Concrete patio or slab",                       x: 27,  y: 60,  w: 42,  h: 10, color: "rgba(107,114,128,0.28)", stroke: "#6b7280" },
  { id: "pool_b",     label: "Pool & Spa",                desc: "New swimming pool / spa installation",         x: 22,  y: 68,  w: 52,  h: 22, color: "rgba(6,182,212,0.32)",   stroke: "#06b6d4" },
  { id: "pdeck_b",    label: "Pool Deck",                 desc: "Pool deck construction",                       x: 18,  y: 63,  w: 60,  h: 30, color: "rgba(245,158,11,0.18)",  stroke: "#f59e0b" },
  { id: "pequip_b",   label: "Pool Equipment",            desc: "Pump, filter, equipment changes",              x: 15,  y: 68,  w: 8,   h: 10, color: "rgba(249,115,22,0.38)",  stroke: "#f97316" },
  { id: "fence_b",    label: "Fence / Gate",              desc: "Fence and gate installation",                  x: 0,   y: 38,  w: 6,   h: 52, color: "rgba(34,197,94,0.28)",   stroke: "#22c55e" },
  { id: "fence_b2",   label: "Fence / Gate",              desc: "Fence and gate installation",                  x: 93,  y: 38,  w: 7,   h: 52, color: "rgba(34,197,94,0.28)",   stroke: "#22c55e" },
  { id: "fireplace",  label: "Fireplace / Chimney",       desc: "Fireplace or chimney installation",            x: 74,  y: 55,  w: 10,  h: 18, color: "rgba(239,68,68,0.3)",    stroke: "#ef4444" },
  { id: "pergola_b",  label: "Pergola",                   desc: "Pergola or gazebo structure",                  x: 75,  y: 45,  w: 15,  h: 18, color: "rgba(217,119,6,0.28)",   stroke: "#d97706" },
  { id: "irrig_b",    label: "Irrigation System",         desc: "Landscape / sprinkler system",                 x: 6,   y: 58,  w: 16,  h: 12, color: "rgba(16,185,129,0.28)",  stroke: "#10b981" },
  { id: "spa_b",      label: "Spa / Hot Tub",             desc: "Spa or hot tub installation",                  x: 73,  y: 68,  w: 8,   h: 10, color: "rgba(168,85,247,0.35)",  stroke: "#a855f7" },
];

// ── EAGLE EYE (FLOOR PLAN) ZONES ────────────────────────────────────────────
const EAGLE_ZONES = [
  { id: "roof_e",     label: "Roof / Re-Roof",            desc: "Roofing replacement or repair",                x: 0,   y: 0,   w: 55,  h: 45, color: "rgba(239,68,68,0.15)",   stroke: "#ef4444" },
  { id: "kitchen",    label: "Residential Remodel",       desc: "Kitchen remodel / interior renovation",        x: 56,  y: 12,  w: 18,  h: 18, color: "rgba(245,158,11,0.28)",  stroke: "#f59e0b" },
  { id: "greatroom",  label: "Residential Remodel",       desc: "Great room / living area renovation",          x: 34,  y: 12,  w: 22,  h: 22, color: "rgba(245,158,11,0.2)",   stroke: "#f59e0b" },
  { id: "dining",     label: "Residential Remodel",       desc: "Dining area renovation",                       x: 47,  y: 20,  w: 12,  h: 14, color: "rgba(245,158,11,0.2)",   stroke: "#f59e0b" },
  { id: "bathroom_e", label: "Plumbing",                  desc: "Bathroom plumbing / fixture installation",     x: 74,  y: 12,  w: 14,  h: 16, color: "rgba(6,182,212,0.32)",   stroke: "#06b6d4" },
  { id: "bedroom1",   label: "Residential Remodel",       desc: "Bedroom renovation",                           x: 6,   y: 12,  w: 22,  h: 18, color: "rgba(245,158,11,0.18)",  stroke: "#f59e0b" },
  { id: "bedroom2",   label: "Residential Remodel",       desc: "Bedroom renovation",                           x: 2,   y: 46,  w: 26,  h: 22, color: "rgba(245,158,11,0.18)",  stroke: "#f59e0b" },
  { id: "homeoffice", label: "Residential Remodel",       desc: "Home office renovation",                       x: 18,  y: 32,  w: 18,  h: 16, color: "rgba(245,158,11,0.18)",  stroke: "#f59e0b" },
  { id: "mudroom",    label: "Residential Remodel",       desc: "Mudroom / entry renovation",                   x: 47,  y: 34,  w: 16,  h: 12, color: "rgba(245,158,11,0.18)",  stroke: "#f59e0b" },
  { id: "walkin",     label: "Residential Remodel",       desc: "Walk-in closet renovation",                    x: 74,  y: 28,  w: 14,  h: 14, color: "rgba(245,158,11,0.18)",  stroke: "#f59e0b" },
  { id: "balcony_e",  label: "Residential Addition",      desc: "Upper balcony / deck addition",                x: 34,  y: 2,   w: 40,  h: 12, color: "rgba(99,102,241,0.28)",  stroke: "#6366f1" },
  { id: "driveway_e", label: "Driveway (Paver)",          desc: "Paver driveway installation",                  x: 75,  y: 10,  w: 25,  h: 38, color: "rgba(107,114,128,0.28)", stroke: "#6b7280" },
  { id: "pool_e",     label: "Pool & Spa",                desc: "New swimming pool / spa installation",         x: 60,  y: 62,  w: 38,  h: 36, color: "rgba(6,182,212,0.32)",   stroke: "#06b6d4" },
  { id: "pdeck_e",    label: "Pool Deck",                 desc: "Pool deck construction",                       x: 55,  y: 55,  w: 44,  h: 44, color: "rgba(245,158,11,0.15)",  stroke: "#f59e0b" },
  { id: "ac_e",       label: "A/C Replacement",           desc: "Air conditioning change-out (≤5 tons)",        x: 0,   y: 46,  w: 8,   h: 10, color: "rgba(14,165,233,0.4)",   stroke: "#0ea5e9" },
  { id: "ac_e2",      label: "A/C Replacement",           desc: "Air conditioning change-out (≤5 tons)",        x: 0,   y: 68,  w: 8,   h: 10, color: "rgba(14,165,233,0.4)",   stroke: "#0ea5e9" },
  { id: "panel_e",    label: "Electrical Service",        desc: "Panel upgrade, service change",                x: 36,  y: 42,  w: 6,   h: 8,  color: "rgba(234,179,8,0.48)",   stroke: "#eab308" },
  { id: "plumb_e",    label: "Plumbing",                  desc: "Plumbing rough-in, fixtures, re-pipe",         x: 28,  y: 46,  w: 12,  h: 12, color: "rgba(6,182,212,0.3)",    stroke: "#06b6d4" },
  { id: "fence_e",    label: "Fence / Gate",              desc: "Fence and gate installation",                  x: 0,   y: 0,   w: 4,   h: 98, color: "rgba(34,197,94,0.25)",   stroke: "#22c55e" },
  { id: "lawn_e",     label: "Irrigation System",         desc: "Landscape / sprinkler system",                 x: 4,   y: 78,  w: 52,  h: 20, color: "rgba(16,185,129,0.22)",  stroke: "#10b981" },
];

const LEGENDS = {
  front: [
    { label: "Roof / Re-Roof",          color: "#ef4444" },
    { label: "Solar Panels",            color: "#eab308" },
    { label: "Window Replacement",      color: "#3b82f6" },
    { label: "Hurricane Shutters",      color: "#a855f7" },
    { label: "Garage Door",             color: "#f97316" },
    { label: "Door Replacement",        color: "#8b5cf6" },
    { label: "A/C Replacement",         color: "#0ea5e9" },
    { label: "Residential Addition",    color: "#6366f1" },
    { label: "New Construction",        color: "#6366f1" },
    { label: "Fence / Gate",            color: "#22c55e" },
    { label: "Driveway / Walkway",      color: "#6b7280" },
    { label: "Pool & Spa",              color: "#06b6d4" },
    { label: "Pergola",                 color: "#d97706" },
    { label: "Irrigation System",       color: "#10b981" },
    { label: "Swale",                   color: "#10b981" },
  ],
  back: [
    { label: "Roof / Re-Roof",          color: "#ef4444" },
    { label: "Solar Panels",            color: "#eab308" },
    { label: "Window Replacement",      color: "#3b82f6" },
    { label: "Door Replacement",        color: "#8b5cf6" },
    { label: "A/C Replacement",         color: "#0ea5e9" },
    { label: "Balcony / Addition",      color: "#6366f1" },
    { label: "Pool & Spa",              color: "#06b6d4" },
    { label: "Pool Deck",               color: "#f59e0b" },
    { label: "Pool Equipment",          color: "#f97316" },
    { label: "Spa / Hot Tub",           color: "#a855f7" },
    { label: "Patio / Slab",            color: "#6b7280" },
    { label: "Fireplace / Chimney",     color: "#ef4444" },
    { label: "Pergola",                 color: "#d97706" },
    { label: "Fence / Gate",            color: "#22c55e" },
    { label: "Irrigation System",       color: "#10b981" },
  ],
  eagle: [
    { label: "Roof / Re-Roof",          color: "#ef4444" },
    { label: "Residential Remodel",     color: "#f59e0b" },
    { label: "Plumbing",                color: "#06b6d4" },
    { label: "Electrical Service",      color: "#eab308" },
    { label: "A/C Replacement",         color: "#0ea5e9" },
    { label: "Balcony / Addition",      color: "#6366f1" },
    { label: "Pool & Spa",              color: "#06b6d4" },
    { label: "Pool Deck",               color: "#f59e0b" },
    { label: "Driveway",                color: "#6b7280" },
    { label: "Fence / Gate",            color: "#22c55e" },
    { label: "Irrigation System",       color: "#10b981" },
  ],
};

const VIEW_ZONES = { front: FRONT_ZONES, back: BACK_ZONES, eagle: EAGLE_ZONES };

export default function HouseView({ view, showHighlights, onZoneClick }) {
  const [hoveredZone, setHoveredZone] = useState(null);

  const zones  = VIEW_ZONES[view]  || FRONT_ZONES;
  const legend = LEGENDS[view]     || LEGENDS.front;
  const imgSrc = IMAGES[view]      || IMAGES.front;

  return (
    <div className="space-y-4">
      <div
        className="relative rounded-2xl overflow-hidden shadow-xl border border-gray-200 bg-gray-900 select-none"
        style={{ aspectRatio: "16/9" }}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={view}
            src={imgSrc}
            alt={`House ${view} view`}
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />
        </AnimatePresence>

        {/* Permit zone overlays */}
        {zones.map((zone) => {
          const isHovered = hoveredZone === zone.id;
          const visible   = showHighlights || isHovered;
          return (
            <div
              key={zone.id}
              onClick={() => onZoneClick(zone.label, zone.desc)}
              onMouseEnter={() => setHoveredZone(zone.id)}
              onMouseLeave={() => setHoveredZone(null)}
              className="absolute cursor-pointer transition-all duration-150"
              style={{
                left:            `${zone.x}%`,
                top:             `${zone.y}%`,
                width:           `${zone.w}%`,
                height:          `${zone.h}%`,
                backgroundColor: visible ? zone.color : "transparent",
                border:          visible
                  ? `2px ${isHovered ? "solid" : "dashed"} ${zone.stroke}`
                  : "2px solid transparent",
                borderRadius:    "5px",
                boxShadow:       isHovered ? `0 0 0 2px ${zone.stroke}55` : "none",
                zIndex:          isHovered ? 10 : 1,
              }}
            >
              {isHovered && (
                <div
                  className="absolute z-20 pointer-events-none"
                  style={{
                    bottom:    "calc(100% + 6px)",
                    left:      "50%",
                    transform: "translateX(-50%)",
                    whiteSpace:"nowrap",
                  }}
                >
                  <div className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold shadow-xl"
                    style={{ background: "rgba(0,0,0,0.85)" }}>
                    {zone.label}
                  </div>
                  <div className="flex justify-center">
                    <div className="w-0 h-0"
                      style={{
                        borderLeft:  "6px solid transparent",
                        borderRight: "6px solid transparent",
                        borderTop:   "6px solid rgba(0,0,0,0.85)",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <div className="absolute bottom-2 right-3 text-white/60 text-xs pointer-events-none drop-shadow">
          {showHighlights ? "Click any highlighted zone" : "Hover to discover permit zones"}
        </div>
      </div>

      {/* Legend */}
      {showHighlights && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Permit Zones Legend</p>
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