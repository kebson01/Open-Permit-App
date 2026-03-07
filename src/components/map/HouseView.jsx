import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─────────────────────────────────────────────
// PERMIT MAPPINGS  (zone id → permit name)
// ─────────────────────────────────────────────
const RES_EXTERIOR_MAP = {
  roof:            "Roof / Re-Roof",
  solar:           "Solar Panel",
  chimney:         "Roof / Re-Roof",
  window_front:    "Window Replacement",
  door_front:      "Door Replacement",
  garage_door:     "Garage Door",
  shutters:        "Hurricane Shutters",
  fence:           "Fence / Gate",
  driveway:        "Driveway (Concrete)",
  driveway_paver:  "Driveway (Paver)",
  walkway:         "Walkway / Sidewalk",
  retaining_wall:  "Retaining Wall",
  tree:            "Tree Removal",
  ev_charger:      "EV Charger",
  shed:            "Shed",
  swale:           "Swale",
};

const RES_INTERIOR_MAP = {
  addition:        "Residential Addition",
  remodel:         "Residential Remodel",
  electric_panel:  "Electrical Service",
  water_heater:    "Water Heater",
  ac_unit:         "A/C Replacement",
  generator:       "Generator",
  plumbing:        "Gas System",
  alarm:           "Low Voltage Alarm",
  irrigation:      "Irrigation System",
  backflow:        "Backflow Preventer",
  pool:            "Pool",
  spa:             "Spa / Hot Tub",
  pool_deck:       "Pool Deck",
  pool_heater:     "Pool Heater",
  pool_equip:      "Pool Equipment",
  screen_enc:      "Screen Enclosure",
  deck:            "Deck",
  patio:           "Patio / Slab",
  pergola:         "Pergola",
  new_const:       "New Construction",
};

const COM_EXTERIOR_MAP = {
  com_roof:        "Roof / Re-Roof",
  com_hvac:        "HVAC / Rooftop Equipment",
  com_sign:        "Sign Permit",
  com_window:      "Window/Door (Commercial)",
  com_door:        "Window/Door (Commercial)",
  com_fence:       "Fence / Gate",
  com_parking:     "Asphalt Repair / Milling & Paving",
  com_sealcoat:    "Seal Coat and Striping",
  com_sidewalk:    "Sidewalk Repair",
  com_ev:          "EV Chargers (Commercial)",
  com_lights:      "Light Pole Installation",
  com_tree:        "Tree Removal",
  com_tent:        "Tent (>120 sq ft)",
  com_platform:    "Temporary Platform/Bleachers",
  com_utility:     "Utility Boring",
  com_drainage:    "Underground Drainage",
  com_earthwork:   "Pavement/Earthwork",
};

const COM_INTERIOR_MAP = {
  com_new:         "New Commercial Construction",
  com_tenant:      "Tenant Improvements",
  com_addition:    "Commercial Addition",
  com_remodel:     "Commercial Remodel",
  com_demo:        "Demolition",
  com_sprinkler:   "Fire Sprinkler System",
  com_alarm:       "Fire Alarm System",
  com_pump:        "Fire Pump",
  com_standpipe:   "Fire Standpipe System",
  com_smoke:       "Smoke Control System",
  com_special:     "Special Extinguishing",
  com_gen:         "Emergency Generator",
  com_ac:          "A/C Replacement (Commercial)",
  com_panel:       "Electrical Service",
  com_cou:         "Certificate of Use",
  com_coo:         "Certificate of Occupancy",
  com_solar:       "Solar Panel",
  com_water:       "Water Heater",
  com_eng:         "Commercial Engineering",
};

// ─────────────────────────────────────────────
// TOOLTIP LABEL overrides (zone id → display label)
// ─────────────────────────────────────────────
const ZONE_LABELS = {
  roof: "Roof / Re-Roof", solar: "Solar Panels", chimney: "Chimney / Roof",
  window_front: "Windows", door_front: "Front Door", garage_door: "Garage Door",
  shutters: "Hurricane Shutters", fence: "Fence / Gate", driveway: "Driveway (Concrete)",
  driveway_paver: "Driveway (Paver)", walkway: "Walkway / Sidewalk",
  retaining_wall: "Retaining Wall", tree: "Tree Removal", ev_charger: "EV Charger",
  shed: "Shed / Accessory Structure", swale: "Swale",
  addition: "Addition / Remodel", remodel: "Interior Remodel", electric_panel: "Electrical Panel",
  water_heater: "Water Heater", ac_unit: "A/C Unit", generator: "Generator",
  plumbing: "Gas / Plumbing", alarm: "Security / Fire Alarm", irrigation: "Irrigation",
  backflow: "Backflow Preventer", pool: "Swimming Pool", spa: "Spa / Hot Tub",
  pool_deck: "Pool Deck", pool_heater: "Pool Heater", pool_equip: "Pool Equipment",
  screen_enc: "Screen Enclosure", deck: "Deck", patio: "Patio / Slab",
  pergola: "Pergola", new_const: "New Construction",
  com_roof: "Roof / Re-Roof", com_hvac: "HVAC Rooftop", com_sign: "Sign Permit",
  com_window: "Storefront Glazing", com_door: "Commercial Door", com_fence: "Fence / Gate",
  com_parking: "Parking Lot", com_sealcoat: "Seal Coat & Striping",
  com_sidewalk: "Sidewalk Repair", com_ev: "EV Chargers", com_lights: "Light Poles",
  com_tree: "Tree Removal", com_tent: "Tent Structure", com_platform: "Platform/Bleachers",
  com_utility: "Utility Boring", com_drainage: "Underground Drainage",
  com_earthwork: "Grading / Earthwork",
  com_new: "New Commercial Construction", com_tenant: "Tenant Improvements",
  com_addition: "Commercial Addition", com_remodel: "Commercial Remodel",
  com_demo: "Demolition", com_sprinkler: "Fire Sprinkler", com_alarm: "Fire Alarm",
  com_pump: "Fire Pump", com_standpipe: "Fire Standpipe", com_smoke: "Smoke Control",
  com_special: "Special Extinguishing", com_gen: "Emergency Generator",
  com_ac: "A/C (Commercial)", com_panel: "Electrical Panel", com_cou: "Certificate of Use",
  com_coo: "Certificate of Occupancy", com_solar: "Solar Panels", com_water: "Water Heater",
  com_eng: "Site Engineering",
};

// ─────────────────────────────────────────────
// COLORS per category
// ─────────────────────────────────────────────
const C = {
  red:    "rgba(239,68,68,0.30)",
  orange: "rgba(249,115,22,0.30)",
  amber:  "rgba(245,158,11,0.30)",
  yellow: "rgba(234,179,8,0.30)",
  green:  "rgba(34,197,94,0.30)",
  teal:   "rgba(20,184,166,0.30)",
  cyan:   "rgba(6,182,212,0.30)",
  blue:   "rgba(59,130,246,0.30)",
  indigo: "rgba(99,102,241,0.30)",
  purple: "rgba(168,85,247,0.30)",
  pink:   "rgba(236,72,153,0.30)",
  gray:   "rgba(107,114,128,0.30)",
};

// ─────────────────────────────────────────────
// SVG ILLUSTRATIONS
// Each returns an SVG-based house diagram with <rect>/<polygon> zones
// ─────────────────────────────────────────────

function ResidentialExterior({ showHighlights, onZone }) {
  const zones = [
    // id, x, y, w, h, color, shape (rect default)
    { id: "roof",          x: 100, y: 30,  w: 560, h: 160, color: C.red,    shape: "poly", points: "100,190 380,30 660,190" },
    { id: "solar",         x: 430, y: 70,  w: 160, h: 70,  color: C.yellow  },
    { id: "chimney",       x: 200, y: 50,  w: 50,  h: 80,  color: C.orange  },
    { id: "window_front",  x: 140, y: 240, w: 120, h: 100, color: C.cyan    },
    { id: "window_front",  x: 300, y: 240, w: 120, h: 100, color: C.cyan    },
    { id: "door_front",    x: 330, y: 330, w: 100, h: 140, color: C.purple  },
    { id: "garage_door",   x: 500, y: 230, w: 190, h: 160, color: C.orange  },
    { id: "shutters",      x: 130, y: 235, w: 135, h: 110, color: C.indigo  },
    { id: "ev_charger",    x: 500, y: 395, w: 70,  h: 50,  color: C.green   },
    { id: "driveway",      x: 490, y: 440, w: 250, h: 70,  color: C.gray    },
    { id: "walkway",       x: 310, y: 470, w: 130, h: 50,  color: C.teal    },
    { id: "fence",         x: 50,  y: 200, w: 40,  h: 280, color: C.green   },
    { id: "fence",         x: 670, y: 200, w: 40,  h: 280, color: C.green   },
    { id: "retaining_wall",x: 55,  y: 460, w: 200, h: 30,  color: C.amber   },
    { id: "tree",          x: 600, y: 340, w: 80,  h: 100, color: C.green   },
    { id: "swale",         x: 50,  y: 490, w: 660, h: 20,  color: C.blue    },
    { id: "shed",          x: 620, y: 390, w: 100, h: 90,  color: C.amber   },
  ];

  return (
    <svg viewBox="0 0 760 520" className="w-full h-full">
      {/* Sky */}
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#dbeafe" />
          <stop offset="100%" stopColor="#eff6ff" />
        </linearGradient>
        <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#86efac" />
          <stop offset="100%" stopColor="#4ade80" />
        </linearGradient>
        <linearGradient id="rooftile" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b45309" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width="760" height="520" fill="url(#sky)" />
      <rect y="450" width="760" height="70" fill="url(#grass)" />

      {/* Foundation */}
      <rect x="90" y="460" width="580" height="30" fill="#94a3b8" rx="2" />

      {/* House body */}
      <rect x="90" y="190" width="580" height="275" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="2" />

      {/* Roof */}
      <polygon points="80,195 380,25 680,195" fill="url(#rooftile)" stroke="#92400e" strokeWidth="2" />
      <polygon points="80,195 380,25 680,195" fill="none" stroke="#92400e" strokeWidth="1.5" />

      {/* Chimney */}
      <rect x="195" y="45" width="55" height="90" fill="#a8a29e" stroke="#78716c" strokeWidth="1.5" />
      <rect x="190" y="40" width="65" height="12" fill="#78716c" rx="1" />

      {/* Solar panels */}
      <rect x="380" y="60" width="180" height="80" fill="#1e3a5f" rx="2" stroke="#3b82f6" strokeWidth="1" />
      {[0,1,2].map(col => [0,1].map(row => (
        <rect key={`s${col}${row}`} x={385 + col*58} y={65 + row*36} width="52" height="30" fill="#1e40af" stroke="#60a5fa" strokeWidth="0.5" />
      )))}

      {/* Garage */}
      <rect x="490" y="225" width="200" height="165" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />
      {/* Garage panels */}
      {[0,1,2].map(i => (
        <rect key={`gp${i}`} x="495" y={230 + i*40} width="190" height="36" fill="#f8fafc" stroke="#94a3b8" strokeWidth="0.5" />
      ))}
      <line x1="585" y1="225" x2="585" y2="390" stroke="#94a3b8" strokeWidth="1" />

      {/* Windows */}
      <rect x="135" y="235" width="130" height="100" fill="#bae6fd" stroke="#0ea5e9" strokeWidth="2" rx="3" />
      <line x1="200" y1="235" x2="200" y2="335" stroke="#0ea5e9" strokeWidth="1" />
      <line x1="135" y1="285" x2="265" y2="285" stroke="#0ea5e9" strokeWidth="1" />

      <rect x="295" y="235" width="130" height="100" fill="#bae6fd" stroke="#0ea5e9" strokeWidth="2" rx="3" />
      <line x1="360" y1="235" x2="360" y2="335" stroke="#0ea5e9" strokeWidth="1" />
      <line x1="295" y1="285" x2="425" y2="285" stroke="#0ea5e9" strokeWidth="1" />

      {/* Front door */}
      <rect x="325" y="325" width="110" height="145" fill="#7c3aed" rx="5" stroke="#4c1d95" strokeWidth="2" />
      <circle cx="418" cy="398" r="6" fill="#fbbf24" />
      <rect x="335" y="340" width="40" height="55" fill="#5b21b6" rx="3" />
      <rect x="385" y="340" width="40" height="55" fill="#5b21b6" rx="3" />

      {/* Shutters */}
      <rect x="120" y="230" width="18" height="110" fill="#3b82f6" rx="2" />
      <rect x="278" y="230" width="18" height="110" fill="#3b82f6" rx="2" />

      {/* Fence posts */}
      {[0,1,2,3,4,5,6].map(i => (
        <rect key={`f${i}`} x={45 + i*0} y={210 + i*0} width="8" height="260" fill="#a16207" rx="1"
          transform={`translate(${45}, ${200 + i*38})`} />
      ))}
      <rect x="45" y="200" width="8" height="280" fill="#a16207" rx="1" />
      <rect x="680" y="200" width="8" height="280" fill="#a16207" rx="1" />
      <rect x="45" y="250" width="645" height="6" fill="#ca8a04" rx="1" />
      <rect x="45" y="340" width="645" height="6" fill="#ca8a04" rx="1" />

      {/* Shed */}
      <rect x="615" y="400" width="90" height="80" fill="#d97706" stroke="#92400e" strokeWidth="1.5" />
      <polygon points="610,400 660,375 715,400" fill="#b45309" stroke="#92400e" strokeWidth="1.5" />

      {/* Tree */}
      <rect x="640" y="380" width="12" height="70" fill="#92400e" />
      <circle cx="646" cy="355" r="40" fill="#16a34a" opacity="0.9" />
      <circle cx="626" cy="370" r="28" fill="#15803d" opacity="0.8" />
      <circle cx="666" cy="368" r="30" fill="#166534" opacity="0.7" />

      {/* Driveway */}
      <polygon points="485,450 750,450 750,510 460,510" fill="#94a3b8" opacity="0.7" />
      {/* Driveway lines */}
      <line x1="617" y1="450" x2="617" y2="510" stroke="#64748b" strokeWidth="1" strokeDasharray="8,6" />

      {/* Walkway */}
      <rect x="305" y="465" width="145" height="45" fill="#b0bec5" rx="2" />

      {/* EV Charger */}
      <rect x="495" y="390" width="50" height="50" fill="#065f46" rx="4" stroke="#064e3b" strokeWidth="1.5" />
      <text x="520" y="421" textAnchor="middle" fill="#34d399" fontSize="16" fontWeight="bold">⚡</text>

      {/* Retaining wall */}
      <rect x="50" y="458" width="210" height="18" fill="#92400e" rx="2" stroke="#78350f" strokeWidth="1" />

      {/* Swale */}
      <rect x="45" y="488" width="670" height="12" fill="#7dd3fc" opacity="0.6" rx="3" />

      {/* ZONE OVERLAYS */}
      {zones.map((zone, i) => {
        const permitName = RES_EXTERIOR_MAP[zone.id] || zone.id;
        const label = ZONE_LABELS[zone.id] || zone.id;
        return (
          <ZoneOverlay
            key={zone.id + i}
            zone={zone}
            showHighlights={showHighlights}
            onClick={() => onZone(permitName)}
            label={label}
          />
        );
      })}

      {/* Labels */}
      <text x="380" y="14" textAnchor="middle" fill="#1e40af" fontSize="11" fontWeight="bold">RESIDENTIAL — EXTERIOR VIEW</text>
    </svg>
  );
}

function ResidentialInterior({ showHighlights, onZone }) {
  const zones = [
    { id: "new_const",    x: 50,  y: 30,  w: 660, h: 480, color: C.blue   },
    { id: "addition",     x: 50,  y: 30,  w: 220, h: 220, color: C.indigo },
    { id: "remodel",      x: 290, y: 30,  w: 220, h: 220, color: C.purple },
    { id: "electric_panel",x: 60, y: 280, w: 70,  h: 100, color: C.yellow },
    { id: "ac_unit",      x: 580, y: 50,  w: 120, h: 80,  color: C.cyan   },
    { id: "water_heater", x: 580, y: 160, w: 120, h: 80,  color: C.orange },
    { id: "generator",    x: 580, y: 260, w: 120, h: 80,  color: C.red    },
    { id: "plumbing",     x: 580, y: 360, w: 120, h: 80,  color: C.teal   },
    { id: "alarm",        x: 200, y: 60,  w: 60,  h: 50,  color: C.pink   },
    { id: "irrigation",   x: 60,  y: 410, w: 100, h: 80,  color: C.green  },
    { id: "backflow",     x: 60,  y: 300, w: 90,  h: 70,  color: C.teal   },
    { id: "pool",         x: 210, y: 270, w: 200, h: 120, color: C.cyan   },
    { id: "spa",          x: 420, y: 270, w: 90,  h: 90,  color: C.purple },
    { id: "pool_deck",    x: 200, y: 390, w: 320, h: 80,  color: C.gray   },
    { id: "pool_heater",  x: 530, y: 400, w: 40,  h: 60,  color: C.orange },
    { id: "pool_equip",   x: 510, y: 395, w: 50,  h: 60,  color: C.amber  },
    { id: "screen_enc",   x: 185, y: 255, w: 350, h: 225, color: C.green  },
    { id: "deck",         x: 50,  y: 200, w: 120, h: 130, color: C.amber  },
    { id: "patio",        x: 50,  y: 420, w: 130, h: 80,  color: C.gray   },
    { id: "pergola",      x: 170, y: 200, w: 140, h: 80,  color: C.orange },
  ];

  return (
    <svg viewBox="0 0 760 520" className="w-full h-full">
      <defs>
        <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fefce8" />
          <stop offset="100%" stopColor="#fef9c3" />
        </linearGradient>
        <pattern id="tile" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill="#f1f5f9" />
          <rect width="19" height="19" fill="#e2e8f0" />
          <rect x="21" y="21" width="19" height="19" fill="#e2e8f0" />
        </pattern>
        <pattern id="poolwater" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <rect width="20" height="20" fill="#0ea5e9" />
          <line x1="0" y1="10" x2="20" y2="10" stroke="#38bdf8" strokeWidth="1" opacity="0.4" />
        </pattern>
      </defs>

      {/* Floor plan background */}
      <rect width="760" height="520" fill="#f8fafc" />

      {/* Rooms */}
      {/* Living Room */}
      <rect x="50" y="30" width="220" height="220" fill="url(#tile)" stroke="#cbd5e1" strokeWidth="2" />
      <text x="160" y="150" textAnchor="middle" fill="#64748b" fontSize="13" fontWeight="600">Living Room</text>

      {/* Kitchen / Dining */}
      <rect x="290" y="30" width="220" height="220" fill="#fef3c7" stroke="#fde68a" strokeWidth="2" />
      {/* stove */}
      <rect x="295" y="35" width="60" height="55" fill="#94a3b8" rx="3" />
      <circle cx="310" cy="55" r="8" fill="#1e293b" />
      <circle cx="340" cy="55" r="8" fill="#1e293b" />
      <circle cx="310" cy="75" r="8" fill="#1e293b" />
      <circle cx="340" cy="75" r="8" fill="#1e293b" />
      {/* sink */}
      <rect x="485" y="35" width="20" height="25" fill="#7dd3fc" stroke="#0ea5e9" strokeWidth="1" rx="2" />
      <text x="400" y="150" textAnchor="middle" fill="#78350f" fontSize="13" fontWeight="600">Kitchen / Dining</text>

      {/* Bedroom 1 */}
      <rect x="50" y="270" width="120" height="150" fill="#ede9fe" stroke="#c4b5fd" strokeWidth="2" />
      {/* bed */}
      <rect x="60" y="280" width="90" height="60" fill="#a78bfa" rx="4" />
      <rect x="60" y="280" width="90" height="20" fill="#7c3aed" rx="4" />
      <text x="110" y="385" textAnchor="middle" fill="#4c1d95" fontSize="11" fontWeight="600">Bedroom</text>

      {/* Bedroom 2 */}
      <rect x="190" y="270" width="120" height="150" fill="#dcfce7" stroke="#86efac" strokeWidth="2" />
      <rect x="200" y="280" width="90" height="60" fill="#4ade80" rx="4" />
      <rect x="200" y="280" width="90" height="20" fill="#16a34a" rx="4" />
      <text x="250" y="385" textAnchor="middle" fill="#14532d" fontSize="11" fontWeight="600">Bedroom</text>

      {/* Bathroom */}
      <rect x="330" y="270" width="100" height="100" fill="#e0f2fe" stroke="#7dd3fc" strokeWidth="2" />
      <rect x="340" y="310" width="45" height="55" fill="#bae6fd" stroke="#0ea5e9" strokeWidth="1" rx="4" />
      <circle cx="405" cy="295" r="15" fill="#bae6fd" stroke="#0ea5e9" strokeWidth="1" />
      <text x="380" y="345" textAnchor="middle" fill="#0369a1" fontSize="11" fontWeight="600">Bath</text>

      {/* Garage interior */}
      <rect x="450" y="270" width="115" height="150" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="2" />
      <text x="507" y="355" textAnchor="middle" fill="#475569" fontSize="11" fontWeight="600">Garage</text>

      {/* Utility zone */}
      <rect x="575" y="30" width="135" height="435" fill="#fafafa" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="6,3" />
      <text x="643" y="22" textAnchor="middle" fill="#94a3b8" fontSize="10">MECHANICAL</text>

      {/* A/C unit */}
      <rect x="585" y="45" width="115" height="75" fill="#cffafe" stroke="#0891b2" strokeWidth="1.5" rx="5" />
      <text x="643" y="87" textAnchor="middle" fill="#0e7490" fontSize="11" fontWeight="600">A/C Unit</text>

      {/* Water heater */}
      <ellipse cx="643" cy="200" rx="45" ry="55" fill="#fed7aa" stroke="#ea580c" strokeWidth="1.5" />
      <text x="643" y="205" textAnchor="middle" fill="#9a3412" fontSize="11" fontWeight="600">Water Heater</text>

      {/* Generator */}
      <rect x="585" y="255" width="115" height="75" fill="#fee2e2" stroke="#dc2626" strokeWidth="1.5" rx="5" />
      <text x="643" y="298" textAnchor="middle" fill="#991b1b" fontSize="11" fontWeight="600">Generator</text>

      {/* Gas / plumbing */}
      <rect x="585" y="350" width="115" height="75" fill="#ccfbf1" stroke="#0d9488" strokeWidth="1.5" rx="5" />
      <text x="643" y="393" textAnchor="middle" fill="#134e4a" fontSize="11" fontWeight="600">Gas Lines</text>

      {/* Electric panel */}
      <rect x="55" y="270" width="65" height="90" fill="#fef9c3" stroke="#ca8a04" strokeWidth="1.5" rx="4" />
      <text x="87" y="320" textAnchor="middle" fill="#78350f" fontSize="10" fontWeight="600">Electrical Panel</text>

      {/* Alarm sensor */}
      <circle cx="230" cy="80" r="22" fill="#fce7f3" stroke="#ec4899" strokeWidth="1.5" />
      <text x="230" y="85" textAnchor="middle" fill="#9d174d" fontSize="9" fontWeight="700">ALARM</text>

      {/* Backflow */}
      <rect x="55" y="295" width="85" height="60" fill="#ccfbf1" stroke="#0d9488" strokeWidth="1.5" rx="4" />
      <text x="97" y="330" textAnchor="middle" fill="#134e4a" fontSize="9" fontWeight="600">Backflow</text>

      {/* Irrigation controller */}
      <rect x="55" y="405" width="95" height="75" fill="#dcfce7" stroke="#16a34a" strokeWidth="1.5" rx="5" />
      <text x="102" y="448" textAnchor="middle" fill="#14532d" fontSize="9" fontWeight="600">Irrigation</text>

      {/* Outdoor/backyard zone */}
      <rect x="175" y="455" width="380" height="55" fill="#d1fae5" stroke="#059669" strokeWidth="1" strokeDasharray="4,3" />
      <text x="365" y="487" textAnchor="middle" fill="#065f46" fontSize="10">Outdoor / Backyard</text>

      {/* Pool */}
      <rect x="205" y="265" width="210" height="130" fill="url(#poolwater)" rx="8" stroke="#0284c7" strokeWidth="2" />
      <text x="310" y="335" textAnchor="middle" fill="white" fontSize="13" fontWeight="700">Pool</text>

      {/* Spa */}
      <rect x="420" y="265" width="100" height="90" fill="#a78bfa" rx="10" stroke="#7c3aed" strokeWidth="2" />
      <text x="470" y="315" textAnchor="middle" fill="white" fontSize="11" fontWeight="700">Spa</text>

      {/* Pool deck */}
      <rect x="185" y="397" width="345" height="55" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5" rx="4" />
      <text x="357" y="430" textAnchor="middle" fill="#475569" fontSize="11" fontWeight="600">Pool Deck</text>

      {/* Pool heater + equip */}
      <rect x="534" y="397" width="35" height="55" fill="#fed7aa" stroke="#ea580c" strokeWidth="1" rx="3" />
      <text x="551" y="428" textAnchor="middle" fill="#9a3412" fontSize="7">Heater</text>

      {/* Screen enclosure */}
      <rect x="182" y="252" width="360" height="215" fill="rgba(74,222,128,0.07)" stroke="#16a34a" strokeWidth="1.5" strokeDasharray="10,5" rx="6" />

      {/* Deck */}
      <rect x="50" y="197" width="125" height="135" fill="#d97706" fillOpacity="0.18" stroke="#b45309" strokeWidth="1.5" strokeDasharray="6,4" rx="4" />
      <text x="112" y="275" textAnchor="middle" fill="#92400e" fontSize="11" fontWeight="600">Deck</text>

      {/* Patio */}
      <rect x="50" y="418" width="135" height="55" fill="#94a3b8" fillOpacity="0.25" stroke="#64748b" strokeWidth="1.5" rx="4" />
      <text x="117" y="450" textAnchor="middle" fill="#334155" fontSize="11" fontWeight="600">Patio / Slab</text>

      {/* Pergola */}
      <rect x="167" y="197" width="145" height="80" fill="#d97706" fillOpacity="0.15" stroke="#b45309" strokeWidth="1.5" strokeDasharray="6,4" rx="4" />
      <text x="239" y="242" textAnchor="middle" fill="#92400e" fontSize="11" fontWeight="600">Pergola</text>

      {/* ZONE OVERLAYS */}
      {zones.map((zone, i) => {
        const permitName = RES_INTERIOR_MAP[zone.id] || zone.id;
        const label = ZONE_LABELS[zone.id] || zone.id;
        return (
          <ZoneOverlay key={zone.id + i} zone={zone} showHighlights={showHighlights} onClick={() => onZone(permitName)} label={label} />
        );
      })}

      <text x="380" y="14" textAnchor="middle" fill="#1e40af" fontSize="11" fontWeight="bold">RESIDENTIAL — INTERIOR / BACKYARD VIEW</text>
    </svg>
  );
}

function CommercialExterior({ showHighlights, onZone }) {
  const zones = [
    { id: "com_roof",     x: 60,  y: 50,  w: 640, h: 50,  color: C.red    },
    { id: "com_hvac",     x: 200, y: 30,  w: 360, h: 70,  color: C.cyan   },
    { id: "com_sign",     x: 240, y: 100, w: 280, h: 50,  color: C.yellow },
    { id: "com_window",   x: 60,  y: 155, w: 200, h: 100, color: C.blue   },
    { id: "com_window",   x: 500, y: 155, w: 200, h: 100, color: C.blue   },
    { id: "com_door",     x: 290, y: 175, w: 180, h: 140, color: C.purple },
    { id: "com_fence",    x: 20,  y: 160, w: 30,  h: 300, color: C.green  },
    { id: "com_fence",    x: 710, y: 160, w: 30,  h: 300, color: C.green  },
    { id: "com_lights",   x: 45,  y: 300, w: 30,  h: 100, color: C.yellow },
    { id: "com_lights",   x: 685, y: 300, w: 30,  h: 100, color: C.yellow },
    { id: "com_parking",  x: 60,  y: 390, w: 640, h: 80,  color: C.gray   },
    { id: "com_sealcoat", x: 60,  y: 390, w: 640, h: 80,  color: C.amber  },
    { id: "com_sidewalk", x: 270, y: 320, w: 220, h: 55,  color: C.teal   },
    { id: "com_ev",       x: 580, y: 395, w: 100, h: 70,  color: C.green  },
    { id: "com_tent",     x: 580, y: 160, w: 120, h: 100, color: C.orange },
    { id: "com_platform", x: 60,  y: 280, w: 100, h: 60,  color: C.amber  },
    { id: "com_tree",     x: 640, y: 280, w: 60,  h: 80,  color: C.green  },
    { id: "com_utility",  x: 60,  y: 480, w: 200, h: 25,  color: C.indigo },
    { id: "com_drainage", x: 280, y: 480, w: 200, h: 25,  color: C.blue   },
    { id: "com_earthwork",x: 500, y: 480, w: 200, h: 25,  color: C.orange },
  ];

  return (
    <svg viewBox="0 0 760 520" className="w-full h-full">
      <defs>
        <linearGradient id="comsky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e0f2fe" />
          <stop offset="100%" stopColor="#f0f9ff" />
        </linearGradient>
        <linearGradient id="comroof" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
        <pattern id="asphalt" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
          <rect width="60" height="60" fill="#374151" />
          <line x1="30" y1="0" x2="30" y2="60" stroke="#4b5563" strokeWidth="1" opacity="0.4" />
        </pattern>
        <pattern id="parkingStripes" x="0" y="0" width="80" height="70" patternUnits="userSpaceOnUse">
          <rect width="80" height="70" fill="#374151" />
          <line x1="0" y1="0" x2="0" y2="70" stroke="#f9fafb" strokeWidth="2" />
          <line x1="79" y1="0" x2="79" y2="70" stroke="#f9fafb" strokeWidth="2" />
        </pattern>
      </defs>

      {/* Background */}
      <rect width="760" height="520" fill="url(#comsky)" />
      <rect y="385" width="760" height="135" fill="url(#parkingStripes)" />

      {/* Main building */}
      <rect x="60" y="100" width="640" height="280" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />

      {/* Roof parapet */}
      <rect x="55" y="50" width="650" height="55" fill="url(#comroof)" stroke="#1e293b" strokeWidth="2" />
      {/* AC/HVAC units on roof */}
      {[0,1,2,3].map(i => (
        <rect key={`hvac${i}`} x={200 + i*90} y={30} width={75} height={45} fill="#64748b" rx="3" stroke="#94a3b8" strokeWidth="1" />
      ))}
      {[0,1,2,3].map(i => (
        <rect key={`hvacf${i}`} x={212 + i*90} y={40} width={50} height={28} fill="#475569" rx="2" />
      ))}

      {/* Storefront sign */}
      <rect x="220" y="105" width="320" height="45" fill="#1e3a5f" rx="3" />
      <text x="380" y="134" textAnchor="middle" fill="#ffcc00" fontSize="18" fontWeight="bold">COMMERCIAL BUILDING</text>

      {/* Storefront windows */}
      <rect x="60" y="155" width="210" height="100" fill="#bae6fd" stroke="#0ea5e9" strokeWidth="2" />
      <line x1="165" y1="155" x2="165" y2="255" stroke="#0ea5e9" strokeWidth="1.5" />
      <rect x="490" y="155" width="210" height="100" fill="#bae6fd" stroke="#0ea5e9" strokeWidth="2" />
      <line x1="595" y1="155" x2="595" y2="255" stroke="#0ea5e9" strokeWidth="1.5" />

      {/* Main entrance */}
      <rect x="290" y="175" width="180" height="205" fill="#7c3aed" fillOpacity="0.2" stroke="#7c3aed" strokeWidth="2" />
      <rect x="290" y="175" width="88" height="205" fill="#7c3aed" fillOpacity="0.3" stroke="#7c3aed" strokeWidth="1.5" />
      <rect x="382" y="175" width="88" height="205" fill="#7c3aed" fillOpacity="0.3" stroke="#7c3aed" strokeWidth="1.5" />
      <circle cx="380" cy="278" r="5" fill="#fbbf24" />
      <circle cx="392" cy="278" r="5" fill="#fbbf24" />
      {/* Door handles */}
      <rect x="363" y="265" width="8" height="25" fill="#fbbf24" rx="2" />
      <rect x="393" y="265" width="8" height="25" fill="#fbbf24" rx="2" />

      {/* Light poles */}
      <rect x="52" y="310" width="8" height="70" fill="#64748b" />
      <rect x="45" y="303" width="22" height="8" fill="#94a3b8" rx="2" />
      <circle cx="56" cy="300" r="8" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
      <rect x="700" y="310" width="8" height="70" fill="#64748b" />
      <rect x="693" y="303" width="22" height="8" fill="#94a3b8" rx="2" />
      <circle cx="704" cy="300" r="8" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />

      {/* Sidewalk */}
      <rect x="270" y="320" width="220" height="50" fill="#94a3b8" opacity="0.5" />
      <line x1="270" y1="345" x2="490" y2="345" stroke="#64748b" strokeWidth="1" strokeDasharray="6,4" />

      {/* Fence */}
      <rect x="18" y="155" width="32" height="310" fill="none" stroke="#a16207" strokeWidth="2" />
      {[0,1,2,3,4,5,6].map(i => (
        <line key={`lf${i}`} x1="18" y1={160+i*43} x2="50" y2={160+i*43} stroke="#ca8a04" strokeWidth="2" />
      ))}
      <rect x="710" y="155" width="32" height="310" fill="none" stroke="#a16207" strokeWidth="2" />
      {[0,1,2,3,4,5,6].map(i => (
        <line key={`rf${i}`} x1="710" y1={160+i*43} x2="742" y2={160+i*43} stroke="#ca8a04" strokeWidth="2" />
      ))}

      {/* Tent */}
      <polygon points="578,260 640,165 702,260" fill="#fed7aa" stroke="#ea580c" strokeWidth="1.5" />
      <line x1="640" y1="165" x2="640" y2="275" stroke="#ea580c" strokeWidth="2" />
      <rect x="578" y="255" width="124" height="15" fill="#fb923c" />

      {/* Platform/stage */}
      <rect x="60" y="280" width="105" height="55" fill="#c7d2fe" stroke="#6366f1" strokeWidth="1.5" rx="3" />
      <text x="112" y="312" textAnchor="middle" fill="#3730a3" fontSize="10" fontWeight="600">Platform</text>

      {/* Tree */}
      <rect x="660" y="318" width="10" height="60" fill="#92400e" />
      <circle cx="665" cy="300" r="30" fill="#16a34a" opacity="0.85" />

      {/* EV chargers */}
      <rect x="578" y="392" width="100" height="65" fill="#064e3b" rx="3" />
      {[0,1].map(i => (
        <rect key={`ev${i}`} x={582+i*48} y={397} width={42} height={55} fill="#065f46" rx="3" stroke="#34d399" strokeWidth="1" />
      ))}
      <text x="628" y="430" textAnchor="middle" fill="#34d399" fontSize="13" fontWeight="bold">EV ⚡</text>

      {/* Underground utilities row */}
      <rect x="55" y="478" width="210" height="22" fill="#4338ca" fillOpacity="0.25" stroke="#4338ca" strokeWidth="1.5" strokeDasharray="5,3" rx="3" />
      <text x="160" y="493" textAnchor="middle" fill="#3730a3" fontSize="9" fontWeight="600">Utility Boring</text>
      <rect x="275" y="478" width="210" height="22" fill="#0284c7" fillOpacity="0.25" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="5,3" rx="3" />
      <text x="380" y="493" textAnchor="middle" fill="#0369a1" fontSize="9" fontWeight="600">Underground Drainage</text>
      <rect x="495" y="478" width="210" height="22" fill="#ea580c" fillOpacity="0.25" stroke="#ea580c" strokeWidth="1.5" strokeDasharray="5,3" rx="3" />
      <text x="600" y="493" textAnchor="middle" fill="#9a3412" fontSize="9" fontWeight="600">Grading / Earthwork</text>

      {/* ZONE OVERLAYS */}
      {zones.map((zone, i) => {
        const permitName = COM_EXTERIOR_MAP[zone.id] || zone.id;
        const label = ZONE_LABELS[zone.id] || zone.id;
        return (
          <ZoneOverlay key={zone.id + i} zone={zone} showHighlights={showHighlights} onClick={() => onZone(permitName)} label={label} />
        );
      })}

      <text x="380" y="14" textAnchor="middle" fill="#1e40af" fontSize="11" fontWeight="bold">COMMERCIAL — EXTERIOR VIEW</text>
    </svg>
  );
}

function CommercialInterior({ showHighlights, onZone }) {
  const zones = [
    { id: "com_new",      x: 50,  y: 30,  w: 660, h: 470, color: C.blue   },
    { id: "com_tenant",   x: 50,  y: 30,  w: 280, h: 200, color: C.purple },
    { id: "com_addition", x: 430, y: 30,  w: 280, h: 200, color: C.indigo },
    { id: "com_remodel",  x: 200, y: 30,  w: 360, h: 200, color: C.pink   },
    { id: "com_demo",     x: 50,  y: 250, w: 120, h: 100, color: C.red    },
    { id: "com_sprinkler",x: 50,  y: 30,  w: 660, h: 30,  color: C.red    },
    { id: "com_alarm",    x: 660, y: 60,  w: 50,  h: 50,  color: C.orange },
    { id: "com_pump",     x: 580, y: 360, w: 80,  h: 60,  color: C.red    },
    { id: "com_standpipe",x: 580, y: 290, w: 80,  h: 60,  color: C.orange },
    { id: "com_smoke",    x: 380, y: 60,  w: 120, h: 40,  color: C.gray   },
    { id: "com_special",  x: 290, y: 250, w: 120, h: 80,  color: C.amber  },
    { id: "com_gen",      x: 580, y: 250, w: 80,  h: 60,  color: C.red    },
    { id: "com_ac",       x: 580, y: 180, w: 80,  h: 60,  color: C.cyan   },
    { id: "com_panel",    x: 580, y: 110, w: 80,  h: 60,  color: C.yellow },
    { id: "com_cou",      x: 50,  y: 370, w: 130, h: 80,  color: C.green  },
    { id: "com_coo",      x: 195, y: 370, w: 130, h: 80,  color: C.teal   },
    { id: "com_solar",    x: 340, y: 370, w: 130, h: 80,  color: C.yellow },
    { id: "com_water",    x: 485, y: 370, w: 80,  h: 80,  color: C.orange },
    { id: "com_eng",      x: 50,  y: 460, w: 660, h: 40,  color: C.indigo },
  ];

  return (
    <svg viewBox="0 0 760 520" className="w-full h-full">
      <defs>
        <pattern id="comtile" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
          <rect width="50" height="50" fill="#f8fafc" />
          <rect width="24" height="24" fill="#f1f5f9" />
          <rect x="26" y="26" width="24" height="24" fill="#f1f5f9" />
        </pattern>
        <pattern id="carpet" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <rect width="20" height="20" fill="#ddd6fe" />
          <line x1="0" y1="10" x2="20" y2="10" stroke="#c4b5fd" strokeWidth="0.5" />
          <line x1="10" y1="0" x2="10" y2="20" stroke="#c4b5fd" strokeWidth="0.5" />
        </pattern>
      </defs>

      <rect width="760" height="520" fill="#f8fafc" />

      {/* Sprinkler header pipe */}
      <rect x="50" y="30" width="660" height="22" fill="#fca5a5" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="8,4" rx="3" />
      {[0,1,2,3,4,5,6,7].map(i => (
        <circle key={`sp${i}`} cx={90+i*82} cy={41} r={5} fill="#ef4444" />
      ))}
      <text x="380" y="44" textAnchor="middle" fill="#991b1b" fontSize="9" fontWeight="700">FIRE SPRINKLER SYSTEM</text>

      {/* Main zones */}
      {/* Tenant space 1 */}
      <rect x="50" y="52" width="280" height="200" fill="url(#carpet)" stroke="#a78bfa" strokeWidth="2" />
      <text x="190" y="158" textAnchor="middle" fill="#4c1d95" fontSize="13" fontWeight="700">Tenant Space A</text>
      <text x="190" y="175" textAnchor="middle" fill="#6d28d9" fontSize="10">(Tenant Improvements)</text>
      {/* reception desk */}
      <rect x="65" y="65" width="80" height="35" fill="#7c3aed" fillOpacity="0.3" rx="3" />

      {/* Tenant space 2 */}
      <rect x="430" y="52" width="140" height="200" fill="url(#comtile)" stroke="#818cf8" strokeWidth="2" />
      <text x="500" y="158" textAnchor="middle" fill="#312e81" fontSize="13" fontWeight="700">Tenant B</text>
      <text x="500" y="173" textAnchor="middle" fill="#4338ca" fontSize="10">(Addition)</text>

      {/* Common area / lobby */}
      <rect x="330" y="52" width="100" height="200" fill="#fffbeb" stroke="#fde68a" strokeWidth="2" />
      <text x="380" y="158" textAnchor="middle" fill="#92400e" fontSize="11" fontWeight="700">Lobby</text>

      {/* Smoke detectors */}
      <rect x="375" y="60" width="125" height="35" fill="#94a3b8" fillOpacity="0.3" stroke="#64748b" strokeWidth="1" strokeDasharray="4,3" rx="3" />
      {[0,1,2].map(i => <circle key={`sm${i}`} cx={385+i*42} cy={78} r={6} fill="#94a3b8" stroke="#475569" strokeWidth="1" />)}
      <text x="440" y="82" textAnchor="middle" fill="#334155" fontSize="8" fontWeight="600">SMOKE CONTROL</text>

      {/* Demolition zone */}
      <rect x="50" y="252" width="125" height="100" fill="#fca5a5" fillOpacity="0.3" stroke="#ef4444" strokeWidth="2" strokeDasharray="8,4" rx="3" />
      <text x="112" y="290" textAnchor="middle" fill="#991b1b" fontSize="11" fontWeight="700">Demo Zone</text>
      <line x1="55" y1="257" x2="170" y2="347" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="5,3" />
      <line x1="170" y1="257" x2="55" y2="347" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="5,3" />

      {/* Hood suppression */}
      <rect x="290" y="252" width="125" height="80" fill="#fde68a" fillOpacity="0.4" stroke="#ca8a04" strokeWidth="1.5" rx="4" />
      <text x="353" y="285" textAnchor="middle" fill="#78350f" fontSize="10" fontWeight="700">Hood / Special</text>
      <text x="353" y="300" textAnchor="middle" fill="#78350f" fontSize="9">Extinguishing</text>

      {/* Mechanical panel */}
      <rect x="575" y="52" width="135" height="440" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="5,3" />
      <text x="643" y="90" textAnchor="middle" fill="#475569" fontSize="10" fontWeight="600">MECHANICAL</text>

      {/* Electrical panel */}
      <rect x="583" y="110" width="115" height="65" fill="#fef9c3" stroke="#ca8a04" strokeWidth="1.5" rx="4" />
      <text x="641" y="148" textAnchor="middle" fill="#78350f" fontSize="11" fontWeight="600">Electrical Panel</text>

      {/* AC commercial */}
      <rect x="583" y="185" width="115" height="60" fill="#cffafe" stroke="#0891b2" strokeWidth="1.5" rx="4" />
      <text x="641" y="220" textAnchor="middle" fill="#0e7490" fontSize="11" fontWeight="600">Commercial A/C</text>

      {/* Generator */}
      <rect x="583" y="255" width="115" height="60" fill="#fee2e2" stroke="#dc2626" strokeWidth="1.5" rx="4" />
      <text x="641" y="290" textAnchor="middle" fill="#991b1b" fontSize="11" fontWeight="600">Generator</text>

      {/* Fire standpipe */}
      <rect x="583" y="325" width="115" height="55" fill="#fed7aa" stroke="#ea580c" strokeWidth="1.5" rx="4" />
      <text x="641" y="357" textAnchor="middle" fill="#9a3412" fontSize="11" fontWeight="600">Standpipe</text>

      {/* Fire pump */}
      <rect x="583" y="390" width="115" height="55" fill="#fecaca" stroke="#dc2626" strokeWidth="1.5" rx="4" />
      <text x="641" y="422" textAnchor="middle" fill="#991b1b" fontSize="11" fontWeight="600">Fire Pump</text>

      {/* Fire alarm */}
      <rect x="650" y="55" width="60" height="50" fill="#fce7f3" stroke="#ec4899" strokeWidth="1.5" rx="4" />
      <text x="680" y="85" textAnchor="middle" fill="#9d174d" fontSize="9" fontWeight="700">ALARM</text>

      {/* Certificates row */}
      {[
        { id: "com_cou",  x: 50,  label: "Cert of Use",      fill: "#d1fae5", stroke: "#059669" },
        { id: "com_coo",  x: 195, label: "Cert of Occupancy", fill: "#ccfbf1", stroke: "#0d9488" },
        { id: "com_solar",x: 340, label: "Solar Panels",      fill: "#fef9c3", stroke: "#ca8a04" },
        { id: "com_water",x: 485, label: "Water Heater",      fill: "#fed7aa", stroke: "#ea580c" },
      ].map(item => (
        <g key={item.id}>
          <rect x={item.x} y="370" width={item.id === "com_water" ? 80 : 130} height="78" fill={item.fill} stroke={item.stroke} strokeWidth="1.5" rx="5" />
          <text x={item.x + (item.id === "com_water" ? 40 : 65)} y="414" textAnchor="middle" fill={item.stroke} fontSize="10" fontWeight="700">{item.label}</text>
        </g>
      ))}

      {/* Site Engineering footer */}
      <rect x="50" y="458" width="515" height="40" fill="#e0e7ff" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="6,3" rx="5" />
      <text x="307" y="483" textAnchor="middle" fill="#3730a3" fontSize="11" fontWeight="700">Commercial Engineering / Site Work</text>

      {/* ZONE OVERLAYS */}
      {zones.map((zone, i) => {
        const permitName = COM_INTERIOR_MAP[zone.id] || zone.id;
        const label = ZONE_LABELS[zone.id] || zone.id;
        return (
          <ZoneOverlay key={zone.id + i} zone={zone} showHighlights={showHighlights} onClick={() => onZone(permitName)} label={label} />
        );
      })}

      <text x="380" y="14" textAnchor="middle" fill="#1e40af" fontSize="11" fontWeight="bold">COMMERCIAL — INTERIOR VIEW</text>
    </svg>
  );
}

// ─────────────────────────────────────────────
// ZONE OVERLAY (SVG clickable highlight rect)
// ─────────────────────────────────────────────
function ZoneOverlay({ zone, showHighlights, onClick, label }) {
  const [hovered, setHovered] = useState(false);

  if (zone.shape === "poly") {
    return (
      <g onClick={onClick} style={{ cursor: "pointer" }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        <polygon
          points={zone.points}
          fill={showHighlights || hovered ? zone.color : "transparent"}
          stroke={showHighlights || hovered ? "white" : "transparent"}
          strokeWidth="1.5"
          strokeDasharray="6,4"
        />
        {hovered && (
          <text
            x={zone.x + zone.w / 2}
            y={zone.y + zone.h / 2 + 4}
            textAnchor="middle"
            fill="white"
            fontSize="12"
            fontWeight="bold"
            style={{ pointerEvents: "none", filter: "drop-shadow(0 0 3px rgba(0,0,0,0.8))" }}
          >
            {label}
          </text>
        )}
      </g>
    );
  }

  return (
    <g onClick={onClick} style={{ cursor: "pointer" }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <rect
        x={zone.x}
        y={zone.y}
        width={zone.w}
        height={zone.h}
        fill={showHighlights || hovered ? zone.color : "transparent"}
        stroke={showHighlights || hovered ? "white" : "transparent"}
        strokeWidth="1.5"
        strokeDasharray="6,4"
        rx="4"
      />
      {hovered && (
        <g>
          <rect
            x={zone.x + zone.w / 2 - label.length * 3.5}
            y={zone.y + zone.h / 2 - 12}
            width={label.length * 7}
            height={22}
            fill="rgba(0,0,0,0.75)"
            rx="5"
            style={{ pointerEvents: "none" }}
          />
          <text
            x={zone.x + zone.w / 2}
            y={zone.y + zone.h / 2 + 4}
            textAnchor="middle"
            fill="white"
            fontSize="11"
            fontWeight="bold"
            style={{ pointerEvents: "none" }}
          >
            {label}
          </text>
        </g>
      )}
    </g>
  );
}

// ─────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────
export default function HouseView({ view, showHighlights, onZoneClick }) {
  const renderMap = {
    front:           ResidentialExterior,
    interior:        ResidentialInterior,
    commercial_ext:  CommercialExterior,
    commercial_int:  CommercialInterior,
  };
  const Component = renderMap[view] || ResidentialExterior;

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-xl border border-gray-200 bg-white" style={{ aspectRatio: "16/10" }}>
      <Component showHighlights={showHighlights} onZone={onZoneClick} />
    </div>
  );
}