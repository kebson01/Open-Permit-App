import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const IMAGES = {
  front:      "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ac5571087590fc03d44b73/ecd30d709_FrontView.png",
  back:       "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ac5571087590fc03d44b73/7a4bb9a51_BackView.png",
  eagle:      "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ac5571087590fc03d44b73/4422873fc_EagleEyeView.png",
  commercial: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ac5571087590fc03d44b73/14ddcdcb6_commercialProperty.png",
};

// ── FRONT VIEW ZONES ─────────────────────────────────────────────────────────
// Coordinates derived from image-map (image: 1366×750)
// x% = left/1366*100, y% = top/750*100, w% = width/1366*100, h% = height/750*100
const FRONT_ZONES = [
  // Roof — large polygon covering the entire roofline area
  { id: "roof",       label: "Roof / Re-Roof",            desc: "Roofing replacement or repair",                x: 30,  y: 2,   w: 51,  h: 28, color: "rgba(239,68,68,0.22)",   stroke: "#ef4444" },
  // Solar panel cluster left
  { id: "solar_l",    label: "Solar Panels",              desc: "Photovoltaic system installation",             x: 38,  y: 6,   w: 12,  h: 14, color: "rgba(234,179,8,0.42)",   stroke: "#eab308" },
  // Solar panel cluster right
  { id: "solar_r",    label: "Solar Panels",              desc: "Photovoltaic system installation",             x: 52,  y: 4,   w: 15,  h: 16, color: "rgba(234,179,8,0.42)",   stroke: "#eab308" },
  // 2nd floor window left
  { id: "win_2nd_l",  label: "Window Replacement",        desc: "Impact windows / retrofit windows",            x: 27,  y: 27,  w: 8,   h: 12, color: "rgba(59,130,246,0.32)",  stroke: "#3b82f6" },
  // 2nd floor window right / large
  { id: "win_2nd_r",  label: "Window Replacement",        desc: "Impact windows / retrofit windows",            x: 55,  y: 26,  w: 10,  h: 11, color: "rgba(59,130,246,0.32)",  stroke: "#3b82f6" },
  // Balcony railing
  { id: "balcony",    label: "Residential Addition",      desc: "Balcony / room addition",                      x: 36,  y: 33,  w: 16,  h: 6,  color: "rgba(99,102,241,0.28)",  stroke: "#6366f1" },
  // 1st floor large windows right
  { id: "win_1st_r",  label: "Window Replacement",        desc: "Impact windows / retrofit windows",            x: 52,  y: 44,  w: 12,  h: 15, color: "rgba(59,130,246,0.32)",  stroke: "#3b82f6" },
  // 1st floor window left
  { id: "win_1st_l",  label: "Window Replacement",        desc: "Impact windows / retrofit windows",            x: 27,  y: 42,  w: 7,   h: 13, color: "rgba(59,130,246,0.32)",  stroke: "#3b82f6" },
  // Garage door
  { id: "garage",     label: "Garage Door",               desc: "Garage door replacement",                      x: 18,  y: 40,  w: 7,   h: 12, color: "rgba(249,115,22,0.32)",  stroke: "#f97316" },
  // Electrical panel
  { id: "elec_panel", label: "Electrical Service",        desc: "Panel upgrade / service change",               x: 72,  y: 44,  w: 2,   h: 7,  color: "rgba(234,179,8,0.5)",    stroke: "#eab308" },
  // A/C unit
  { id: "ac",         label: "A/C Replacement",           desc: "Air conditioning change-out (≤5 tons)",        x: 70,  y: 52,  w: 8,   h: 10, color: "rgba(14,165,233,0.4)",   stroke: "#0ea5e9" },
  // Pool
  { id: "pool",       label: "Pool & Spa",                desc: "New swimming pool / spa installation",         x: 82,  y: 47,  w: 14,  h: 9,  color: "rgba(6,182,212,0.35)",   stroke: "#06b6d4" },
  // Pool pump
  { id: "pool_pump",  label: "Pool Equipment",            desc: "Pump, filter, equipment changes",              x: 93,  y: 51,  w: 5,   h: 6,  color: "rgba(249,115,22,0.4)",   stroke: "#f97316" },
  // Concrete driveway
  { id: "driveway",   label: "Driveway (Paver)",          desc: "Paver / concrete driveway installation",       x: 0,   y: 62,  w: 24,  h: 12, color: "rgba(107,114,128,0.3)",  stroke: "#6b7280" },
  // Walkway to front door
  { id: "walkway",    label: "Walkway / Sidewalk",        desc: "Concrete paths and sidewalk",                  x: 14,  y: 58,  w: 32,  h: 14, color: "rgba(156,163,175,0.3)",  stroke: "#9ca3af" },
  // Sidewalk at street
  { id: "sidewalk",   label: "Walkway / Sidewalk",        desc: "Public sidewalk / curb installation",          x: 0,   y: 74,  w: 32,  h: 6,  color: "rgba(156,163,175,0.28)", stroke: "#9ca3af" },
  // Landscaping / lawn
  { id: "landscape",  label: "Irrigation System",         desc: "Landscape / sprinkler system",                 x: 0,   y: 52,  w: 18,  h: 15, color: "rgba(16,185,129,0.25)",  stroke: "#10b981" },
  // New construction (full house outline, subtle)
  { id: "newconst",   label: "New Construction",          desc: "New home construction permit",                 x: 14,  y: 2,   w: 66,  h: 72, color: "rgba(99,102,241,0.05)",  stroke: "#6366f1" },
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

// ── COMMERCIAL VIEW ZONES ────────────────────────────────────────────────────
const COMMERCIAL_ZONES = [
  { id: "com_building",   label: "Commercial Building Permit",  desc: "New commercial construction or major structural work",         x: 0,   y: 2,   w: 45,  h: 48, color: "rgba(239,68,68,0.18)",   stroke: "#ef4444" },
  { id: "com_roof",       label: "Commercial Roof",             desc: "Commercial roofing replacement or repair",                    x: 2,   y: 2,   w: 43,  h: 22, color: "rgba(239,68,68,0.28)",   stroke: "#ef4444" },
  { id: "com_hvac",       label: "HVAC / Mechanical",           desc: "Rooftop units, ductwork, mechanical system installation",     x: 4,   y: 4,   w: 36,  h: 16, color: "rgba(14,165,233,0.35)",  stroke: "#0ea5e9" },
  { id: "com_facade",     label: "Storefront / Facade",         desc: "Storefront glazing, exterior facade renovation",              x: 0,   y: 34,  w: 44,  h: 16, color: "rgba(99,102,241,0.28)",  stroke: "#6366f1" },
  { id: "com_sign",       label: "Sign Permit",                 desc: "Commercial signage installation",                             x: 0,   y: 50,  w: 12,  h: 8,  color: "rgba(234,179,8,0.45)",   stroke: "#eab308" },
  { id: "com_office",     label: "Commercial Building Permit",  desc: "Office building construction or renovation",                  x: 58,  y: 2,   w: 28,  h: 38, color: "rgba(239,68,68,0.18)",   stroke: "#ef4444" },
  { id: "com_parking",    label: "Parking Lot / Paving",        desc: "Parking lot paving, striping, and ADA compliance",            x: 20,  y: 50,  w: 50,  h: 35, color: "rgba(107,114,128,0.28)", stroke: "#6b7280" },
  { id: "com_ev",         label: "EV Charging Station",         desc: "Electric vehicle charging station installation",              x: 55,  y: 62,  w: 12,  h: 18, color: "rgba(234,179,8,0.42)",   stroke: "#eab308" },
  { id: "com_excavation", label: "Excavation / Grading",        desc: "Site excavation, grading, and earthwork permit",              x: 68,  y: 42,  w: 32,  h: 40, color: "rgba(180,83,9,0.32)",    stroke: "#b45309" },
  { id: "com_utility",    label: "Utility / Underground",       desc: "Underground utility installation (water, sewer, electric)",   x: 0,   y: 58,  w: 22,  h: 30, color: "rgba(6,182,212,0.3)",    stroke: "#06b6d4" },
  { id: "com_fire",       label: "Fire Suppression",            desc: "Fire sprinkler system installation or modification",          x: 2,   y: 5,   w: 42,  h: 44, color: "rgba(239,68,68,0.08)",   stroke: "#ef4444" },
  { id: "com_electric",   label: "Electrical Service",          desc: "Service panel upgrade, switchgear, electrical distribution",  x: 46,  y: 38,  w: 14,  h: 14, color: "rgba(234,179,8,0.38)",   stroke: "#eab308" },
  { id: "com_sidewalk",   label: "Sidewalk / Curb",             desc: "Sidewalk, curb, and gutter installation",                     x: 0,   y: 72,  w: 20,  h: 16, color: "rgba(156,163,175,0.3)",  stroke: "#9ca3af" },
  { id: "com_landscape",  label: "Irrigation System",           desc: "Commercial landscape and irrigation system",                  x: 0,   y: 42,  w: 20,  h: 18, color: "rgba(16,185,129,0.28)",  stroke: "#10b981" },
  { id: "com_fence",      label: "Fence / Barrier",             desc: "Commercial fencing or barrier installation",                  x: 0,   y: 86,  w: 70,  h: 8,  color: "rgba(34,197,94,0.28)",   stroke: "#22c55e" },
  { id: "com_dumpster",   label: "Dumpster Enclosure",          desc: "Dumpster pad and enclosure construction",                     x: 46,  y: 52,  w: 10,  h: 10, color: "rgba(107,114,128,0.35)", stroke: "#6b7280" },
];

const COMMERCIAL_LEGEND = [
  { label: "Commercial Building",   color: "#ef4444" },
  { label: "HVAC / Mechanical",     color: "#0ea5e9" },
  { label: "Storefront / Facade",   color: "#6366f1" },
  { label: "Sign Permit",           color: "#eab308" },
  { label: "Parking Lot / Paving",  color: "#6b7280" },
  { label: "EV Charging Station",   color: "#eab308" },
  { label: "Excavation / Grading",  color: "#b45309" },
  { label: "Utility / Underground", color: "#06b6d4" },
  { label: "Electrical Service",    color: "#eab308" },
  { label: "Sidewalk / Curb",       color: "#9ca3af" },
  { label: "Irrigation System",     color: "#10b981" },
  { label: "Fence / Barrier",       color: "#22c55e" },
];

const VIEW_ZONES = { front: FRONT_ZONES, back: BACK_ZONES, eagle: EAGLE_ZONES, commercial: COMMERCIAL_ZONES };

export default function HouseView({ view, showHighlights, onZoneClick }) {
  const [hoveredZone, setHoveredZone] = useState(null);

  const zones  = VIEW_ZONES[view]  || FRONT_ZONES;
  const legend = view === "commercial" ? COMMERCIAL_LEGEND : (LEGENDS[view] || LEGENDS.front);
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