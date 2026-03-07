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

// Real photo-based exterior — zones positioned over actual house photo
function ResidentialExterior({ showHighlights, onZone }) {
  const zones = [
    { id: "roof",          x: 60,  y: 15,  w: 680, h: 195, color: C.red,   shape: "poly", points: "60,210 400,15 740,210" },
    { id: "solar",         x: 460, y: 90,  w: 180, h: 80,  color: C.yellow  },
    { id: "chimney",       x: 175, y: 65,  w: 55,  h: 95,  color: C.orange  },
    { id: "window_front",  x: 105, y: 270, w: 130, h: 110, color: C.cyan    },
    { id: "window_front",  x: 310, y: 270, w: 130, h: 110, color: C.cyan    },
    { id: "door_front",    x: 345, y: 350, w: 105, h: 150, color: C.purple  },
    { id: "shutters",      x: 93,  y: 263, w: 150, h: 125, color: C.indigo  },
    { id: "garage_door",   x: 505, y: 255, w: 210, h: 180, color: C.orange  },
    { id: "ev_charger",    x: 512, y: 435, w: 65,  h: 45,  color: C.green   },
    { id: "driveway",      x: 498, y: 478, w: 252, h: 42,  color: C.gray    },
    { id: "walkway",       x: 328, y: 498, w: 145, h: 22,  color: C.teal    },
    { id: "fence",         x: 18,  y: 240, w: 35,  h: 280, color: C.green   },
    { id: "fence",         x: 747, y: 240, w: 35,  h: 280, color: C.green   },
    { id: "retaining_wall",x: 18,  y: 490, w: 200, h: 22,  color: C.amber   },
    { id: "swale",         x: 18,  y: 510, w: 764, h: 16,  color: C.blue    },
    { id: "shed",          x: 8,   y: 370, w: 90,  h: 120, color: C.amber   },
    { id: "tree",          x: 660, y: 340, w: 90,  h: 130, color: C.green   },
  ];

  return (
    <svg viewBox="0 0 800 530" className="w-full h-full">
      <defs>
        <linearGradient id="sky_ext" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#bfdbfe" />
          <stop offset="60%" stopColor="#dbeafe" />
          <stop offset="100%" stopColor="#eff6ff" />
        </linearGradient>
        <linearGradient id="ground_ext" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
        <linearGradient id="roof_ext" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b91c1c" />
          <stop offset="100%" stopColor="#7f1d1d" />
        </linearGradient>
        <linearGradient id="wall_ext" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="100%" stopColor="#fef3c7" />
        </linearGradient>
        <linearGradient id="wall2_ext" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#fcd34d" />
        </linearGradient>
        <linearGradient id="driveway_ext" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d1d5db" />
          <stop offset="100%" stopColor="#9ca3af" />
        </linearGradient>
        <linearGradient id="garage_ext" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </linearGradient>
        {/* Roof tile pattern */}
        <pattern id="rooftiles" x="0" y="0" width="30" height="18" patternUnits="userSpaceOnUse">
          <rect width="30" height="18" fill="#b91c1c" />
          <rect x="0" y="9" width="15" height="9" fill="#991b1b" rx="0" />
          <rect x="15" y="0" width="15" height="9" fill="#991b1b" rx="0" />
          <line x1="0" y1="9" x2="30" y2="9" stroke="#7f1d1d" strokeWidth="0.5" />
          <line x1="15" y1="0" x2="15" y2="18" stroke="#7f1d1d" strokeWidth="0.5" />
        </pattern>
        {/* Brick pattern */}
        <pattern id="brick_ext" x="0" y="0" width="40" height="20" patternUnits="userSpaceOnUse">
          <rect width="40" height="20" fill="#d97706" />
          <rect x="1" y="1" width="36" height="8" fill="#b45309" rx="1" />
          <rect x="21" y="11" width="18" height="8" fill="#b45309" rx="1" />
          <rect x="1" y="11" width="16" height="8" fill="#b45309" rx="1" />
        </pattern>
        <pattern id="sidewalk_ext" x="0" y="0" width="36" height="24" patternUnits="userSpaceOnUse">
          <rect width="36" height="24" fill="#cbd5e1" />
          <rect x="1" y="1" width="34" height="22" fill="#e2e8f0" rx="1" />
        </pattern>
        <filter id="shadow_ext">
          <feDropShadow dx="2" dy="4" stdDeviation="4" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* === SKY === */}
      <rect width="800" height="530" fill="url(#sky_ext)" />

      {/* Clouds */}
      <ellipse cx="120" cy="70" rx="55" ry="22" fill="white" opacity="0.85" />
      <ellipse cx="155" cy="58" rx="38" ry="20" fill="white" opacity="0.9" />
      <ellipse cx="90" cy="62" rx="30" ry="16" fill="white" opacity="0.8" />
      <ellipse cx="620" cy="55" rx="65" ry="24" fill="white" opacity="0.75" />
      <ellipse cx="665" cy="44" rx="40" ry="20" fill="white" opacity="0.8" />

      {/* === GROUND / LAWN === */}
      <rect y="470" width="800" height="60" fill="url(#ground_ext)" />
      {/* Grass texture lines */}
      {[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14].map(i => (
        <line key={`g${i}`} x1={20+i*55} y1="470" x2={28+i*55} y2="460" stroke="#15803d" strokeWidth="1.5" opacity="0.6" />
      ))}

      {/* === FOUNDATION === */}
      <rect x="90" y="458" width="620" height="18" fill="#94a3b8" stroke="#64748b" strokeWidth="1" />
      {/* Foundation bricks */}
      {[0,1,2,3,4,5,6,7,8,9].map(i => (
        <rect key={`fb${i}`} x={93+i*60} y={460} width="55" height="14" fill="#78716c" stroke="#57534e" strokeWidth="0.5" rx="1" />
      ))}

      {/* === MAIN HOUSE WALL === */}
      {/* Left wing */}
      <rect x="90" y="230" width="415" height="230" fill="url(#wall_ext)" stroke="#d97706" strokeWidth="1.5" filter="url(#shadow_ext)" />
      {/* Wall detail lines (siding) */}
      {[0,1,2,3,4,5,6,7,8,9].map(i => (
        <line key={`siding${i}`} x1="90" y1={250+i*21} x2="505" y2={250+i*21} stroke="#fde68a" strokeWidth="1" opacity="0.6" />
      ))}
      {/* Garage section */}
      <rect x="495" y="248" width="225" height="212" fill="url(#wall2_ext)" stroke="#d97706" strokeWidth="1.5" />
      {[0,1,2,3,4,5,6,7,8,9].map(i => (
        <line key={`siding2${i}`} x1="495" y1={265+i*19} x2="720" y2={265+i*19} stroke="#fcd34d" strokeWidth="1" opacity="0.5" />
      ))}

      {/* === ROOF === */}
      {/* Main gable roof */}
      <polygon points="60,232 400,42 740,232" fill="url(#rooftiles)" />
      <polygon points="60,232 400,42 740,232" fill="none" stroke="#7f1d1d" strokeWidth="2.5" />
      {/* Roof ridge */}
      <line x1="400" y1="42" x2="400" y2="232" stroke="#7f1d1d" strokeWidth="1" strokeDasharray="4,3" opacity="0.4" />
      {/* Fascia board */}
      <polygon points="55,232 400,38 745,232 740,242 400,52 60,242" fill="#92400e" />
      {/* Soffit / overhang underside */}
      <polygon points="60,242 90,232 710,232 740,242" fill="#d6d3d1" />

      {/* === CHIMNEY === */}
      <rect x="172" y="58" width="58" height="100" fill="url(#brick_ext)" stroke="#92400e" strokeWidth="1.5" />
      <rect x="167" y="52" width="68" height="14" fill="#78350f" rx="2" />
      {/* Smoke */}
      <ellipse cx="201" cy="42" rx="8" ry="5" fill="#94a3b8" opacity="0.4" />
      <ellipse cx="197" cy="33" rx="6" ry="4" fill="#94a3b8" opacity="0.3" />
      <ellipse cx="204" cy="24" rx="5" ry="4" fill="#94a3b8" opacity="0.2" />

      {/* === SOLAR PANELS === */}
      <rect x="458" y="88" width="185" height="82" fill="#1e3a5f" rx="3" stroke="#3b82f6" strokeWidth="1.5" />
      {[0,1,2].map(col => [0,1].map(row => (
        <g key={`solar${col}${row}`}>
          <rect x={463+col*60} y={93+row*37} width="55" height="32" fill="#1d4ed8" stroke="#60a5fa" strokeWidth="0.8" rx="1" />
          <line x1={463+col*60} y1={109+row*37} x2={518+col*60} y2={109+row*37} stroke="#93c5fd" strokeWidth="0.5" />
          <line x1={491+col*60} y1={93+row*37} x2={491+col*60} y2={125+row*37} stroke="#93c5fd" strokeWidth="0.5" />
        </g>
      )))}
      {/* Panel mounting frame */}
      <rect x="458" y="88" width="185" height="82" fill="none" stroke="#60a5fa" strokeWidth="1.5" rx="3" />

      {/* === GARAGE DOOR === */}
      <rect x="505" y="255" width="205" height="185" fill="url(#garage_ext)" stroke="#94a3b8" strokeWidth="2" rx="2" />
      {/* Garage door panels */}
      {[0,1,2,3].map(i => (
        <g key={`gd${i}`}>
          <rect x="508" y={258+i*44} width="199" height="40" fill={i%2===0 ? "#f8fafc" : "#f1f5f9"} stroke="#cbd5e1" strokeWidth="0.8" />
          {/* Panel detail lines */}
          <line x1="608" y1={258+i*44} x2="608" y2={298+i*44} stroke="#e2e8f0" strokeWidth="1" />
        </g>
      ))}
      {/* Garage door handle */}
      <rect x="598" y="426" width="18" height="8" fill="#94a3b8" rx="3" />
      {/* Garage door trim */}
      <rect x="503" y="253" width="209" height="189" fill="none" stroke="#92400e" strokeWidth="3" rx="3" />

      {/* === WINDOWS === */}
      {/* Left window with shutters */}
      {/* Left shutter */}
      <rect x="93" y="262" width="20" height="115" fill="#1d4ed8" rx="2" stroke="#1e40af" strokeWidth="1" />
      {[0,1,2,3,4].map(i => <line key={`ls${i}`} x1="93" y1={272+i*20} x2="113" y2={272+i*20} stroke="#1e40af" strokeWidth="1" />)}
      {/* Window */}
      <rect x="113" y="268" width="125" height="110" fill="#bae6fd" stroke="#0ea5e9" strokeWidth="2.5" rx="3" />
      <rect x="113" y="268" width="125" height="110" fill="none" stroke="#0284c7" strokeWidth="3" rx="3" />
      {/* Window panes */}
      <line x1="175" y1="268" x2="175" y2="378" stroke="#0ea5e9" strokeWidth="2" />
      <line x1="113" y1="323" x2="238" y2="323" stroke="#0ea5e9" strokeWidth="2" />
      {/* Window sill */}
      <rect x="108" y="376" width="135" height="8" fill="#94a3b8" rx="2" />
      {/* Right shutter */}
      <rect x="238" y="262" width="20" height="115" fill="#1d4ed8" rx="2" stroke="#1e40af" strokeWidth="1" />
      {[0,1,2,3,4].map(i => <line key={`rs${i}`} x1="238" y1={272+i*20} x2="258" y2={272+i*20} stroke="#1e40af" strokeWidth="1" />)}
      {/* Window reflection */}
      <polygon points="118,273 155,273 135,310" fill="white" opacity="0.25" />

      {/* Center window */}
      {/* Left shutter */}
      <rect x="298" y="262" width="20" height="115" fill="#1d4ed8" rx="2" stroke="#1e40af" strokeWidth="1" />
      {[0,1,2,3,4].map(i => <line key={`ls2${i}`} x1="298" y1={272+i*20} x2="318" y2={272+i*20} stroke="#1e40af" strokeWidth="1" />)}
      {/* Window */}
      <rect x="318" y="268" width="125" height="110" fill="#bae6fd" stroke="#0ea5e9" strokeWidth="2.5" rx="3" />
      <rect x="318" y="268" width="125" height="110" fill="none" stroke="#0284c7" strokeWidth="3" rx="3" />
      <line x1="380" y1="268" x2="380" y2="378" stroke="#0ea5e9" strokeWidth="2" />
      <line x1="318" y1="323" x2="443" y2="323" stroke="#0ea5e9" strokeWidth="2" />
      <rect x="313" y="376" width="135" height="8" fill="#94a3b8" rx="2" />
      <rect x="443" y="262" width="20" height="115" fill="#1d4ed8" rx="2" stroke="#1e40af" strokeWidth="1" />
      {[0,1,2,3,4].map(i => <line key={`rs2${i}`} x1="443" y1={272+i*20} x2="463" y2={272+i*20} stroke="#1e40af" strokeWidth="1" />)}
      <polygon points="323,273 360,273 343,310" fill="white" opacity="0.25" />

      {/* === FRONT DOOR === */}
      {/* Door frame */}
      <rect x="340" y="345" width="115" height="115" fill="#3730a3" rx="4" stroke="#1e1b4b" strokeWidth="3" />
      {/* Door panels */}
      <rect x="348" y="353" width="45" height="40" fill="#312e81" rx="3" stroke="#4338ca" strokeWidth="1" />
      <rect x="401" y="353" width="45" height="40" fill="#312e81" rx="3" stroke="#4338ca" strokeWidth="1" />
      <rect x="348" y="401" width="45" height="50" fill="#312e81" rx="3" stroke="#4338ca" strokeWidth="1" />
      <rect x="401" y="401" width="45" height="50" fill="#312e81" rx="3" stroke="#4338ca" strokeWidth="1" />
      {/* Door handles */}
      <rect x="390" y="390" width="8" height="22" fill="#fbbf24" rx="3" />
      <circle cx="394" cy="388" r="4" fill="#f59e0b" />
      <rect x="397" y="390" width="8" height="22" fill="#fbbf24" rx="3" />
      <circle cx="401" cy="388" r="4" fill="#f59e0b" />
      {/* Door transom window */}
      <rect x="340" y="330" width="115" height="18" fill="#bae6fd" stroke="#0ea5e9" strokeWidth="1.5" rx="2" />
      <line x1="397" y1="330" x2="397" y2="348" stroke="#0ea5e9" strokeWidth="1" />
      {/* Door step */}
      <rect x="325" y="458" width="148" height="10" fill="#94a3b8" rx="2" />
      <rect x="330" y="452" width="138" height="8" fill="#b0bec5" rx="2" />
      {/* Porch lights */}
      <rect x="333" y="340" width="8" height="20" fill="#92400e" rx="2" />
      <ellipse cx="337" cy="338" rx="6" ry="4" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
      <rect x="452" y="340" width="8" height="20" fill="#92400e" rx="2" />
      <ellipse cx="456" cy="338" rx="6" ry="4" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />

      {/* === FENCE === */}
      {/* Left fence section */}
      <rect x="18" y="398" width="72" height="8" fill="#92400e" rx="2" />
      <rect x="18" y="430" width="72" height="8" fill="#92400e" rx="2" />
      {[0,1,2,3,4].map(i => (
        <g key={`lf${i}`}>
          <rect x={20+i*14} y={390} width="8" height="55" fill="#a16207" rx="2" />
          <polygon points={`${20+i*14},390 ${24+i*14},383 ${28+i*14},390`} fill="#a16207" />
        </g>
      ))}
      {/* Right fence section */}
      <rect x="710" y="398" width="72" height="8" fill="#92400e" rx="2" />
      <rect x="710" y="430" width="72" height="8" fill="#92400e" rx="2" />
      {[0,1,2,3,4].map(i => (
        <g key={`rf${i}`}>
          <rect x={712+i*14} y={390} width="8" height="55" fill="#a16207" rx="2" />
          <polygon points={`${712+i*14},390 ${716+i*14},383 ${720+i*14},390`} fill="#a16207" />
        </g>
      ))}

      {/* === DRIVEWAY === */}
      <polygon points="498,460 752,460 760,530 490,530" fill="url(#driveway_ext)" />
      {/* Driveway expansion joints */}
      <line x1="625" y1="460" x2="625" y2="530" stroke="#9ca3af" strokeWidth="1.5" strokeDasharray="8,5" />
      <line x1="544" y1="460" x2="522" y2="530" stroke="#9ca3af" strokeWidth="1" strokeDasharray="6,4" />
      <line x1="706" y1="460" x2="718" y2="530" stroke="#9ca3af" strokeWidth="1" strokeDasharray="6,4" />
      {/* EV charger box */}
      <rect x="510" y="435" width="52" height="48" fill="#064e3b" rx="5" stroke="#059669" strokeWidth="2" />
      <rect x="516" y="441" width="40" height="28" fill="#065f46" rx="3" />
      <text x="536" y="460" textAnchor="middle" fill="#34d399" fontSize="14" fontWeight="bold">⚡</text>
      <rect x="530" y="473" width="12" height="6" fill="#34d399" rx="1" />

      {/* === WALKWAY === */}
      <rect x="328" y="465" width="142" height="36" fill="url(#sidewalk_ext)" stroke="#94a3b8" strokeWidth="1" />
      <line x1="346" y1="465" x2="346" y2="501" stroke="#94a3b8" strokeWidth="1" />
      <line x1="364" y1="465" x2="364" y2="501" stroke="#94a3b8" strokeWidth="1" />
      <line x1="400" y1="465" x2="400" y2="501" stroke="#94a3b8" strokeWidth="1" />
      <line x1="436" y1="465" x2="436" y2="501" stroke="#94a3b8" strokeWidth="1" />
      <line x1="454" y1="465" x2="454" y2="501" stroke="#94a3b8" strokeWidth="1" />

      {/* === RETAINING WALL === */}
      <rect x="18" y="452" width="200" height="22" fill="#92400e" rx="2" stroke="#78350f" strokeWidth="1.5" />
      {[0,1,2,3,4,5,6].map(i => (
        <line key={`rw${i}`} x1={48+i*25} y1="452" x2={48+i*25} y2="474" stroke="#78350f" strokeWidth="1" />
      ))}

      {/* === SWALE === */}
      <rect x="18" y="472" width="764" height="14" fill="#7dd3fc" opacity="0.5" rx="4" />
      <line x1="18" y1="479" x2="782" y2="479" stroke="#38bdf8" strokeWidth="1" opacity="0.6" />

      {/* === SHED === */}
      <rect x="10" y="368" width="82" height="110" fill="#d97706" stroke="#92400e" strokeWidth="2" />
      {/* Shed siding */}
      {[0,1,2,3,4].map(i => (
        <line key={`sh${i}`} x1="10" y1={385+i*18} x2="92" y2={385+i*18} stroke="#b45309" strokeWidth="1" />
      ))}
      {/* Shed roof */}
      <polygon points="4,370 51,348 96,370" fill="#92400e" stroke="#78350f" strokeWidth="2" />
      {/* Shed door */}
      <rect x="32" y="415" width="30" height="63" fill="#b45309" rx="2" stroke="#92400e" strokeWidth="1" />
      <circle cx="57" cy="448" r="3" fill="#fbbf24" />

      {/* === TREES === */}
      {/* Large oak tree right side */}
      <rect x="700" y="385" width="14" height="85" fill="#7c2d12" rx="2" />
      <circle cx="707" cy="360" r="42" fill="#15803d" />
      <circle cx="685" cy="378" r="30" fill="#16a34a" />
      <circle cx="729" cy="372" r="28" fill="#14532d" />
      <circle cx="707" cy="345" r="24" fill="#15803d" opacity="0.9" />
      {/* Palm tree left of garage */}
      <rect x="484" y="390" width="8" height="70" fill="#7c2d12" rx="2" />
      <ellipse cx="488" cy="388" rx="2" ry="18" fill="#4ade80" transform="rotate(-30 488 388)" />
      <ellipse cx="488" cy="388" rx="2" ry="18" fill="#4ade80" transform="rotate(10 488 388)" />
      <ellipse cx="488" cy="388" rx="2" ry="18" fill="#4ade80" transform="rotate(50 488 388)" />
      <ellipse cx="488" cy="388" rx="2" ry="18" fill="#22c55e" transform="rotate(-10 488 388)" />
      <ellipse cx="488" cy="388" rx="2" ry="18" fill="#22c55e" transform="rotate(30 488 388)" />

      {/* === HOUSE NUMBER === */}
      <rect x="390" y="305" width="22" height="22" fill="#1e3a5f" rx="3" />
      <text x="401" y="321" textAnchor="middle" fill="#ffcc00" fontSize="10" fontWeight="bold">42</text>

      {/* === MAILBOX === */}
      <rect x="768" y="445" width="18" height="12" fill="#1e40af" rx="3" />
      <rect x="766" y="457" width="4" height="14" fill="#64748b" rx="1" />

      {/* ZONE OVERLAYS */}
      {zones.map((zone, i) => {
        const permitName = RES_EXTERIOR_MAP[zone.id] || zone.id;
        const label = ZONE_LABELS[zone.id] || zone.id;
        return (
          <ZoneOverlay key={zone.id + i} zone={zone} showHighlights={showHighlights} onClick={() => onZone(permitName)} label={label} />
        );
      })}

      {/* Title bar */}
      <rect x="0" y="0" width="800" height="20" fill="rgba(30,58,138,0.85)" />
      <text x="400" y="14" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" letterSpacing="1">RESIDENTIAL — EXTERIOR VIEW · Click any highlighted area</text>
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