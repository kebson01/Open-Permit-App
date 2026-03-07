import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// All permit zones mapped to the exact permit names from the list
// Each zone has: id, label (permit name), description, x, y, w, h (as % of SVG viewBox 0 0 1000 650), color

const EXTERIOR_ZONES = [
  // Roof area
  { id: "roof", label: "Roof / Re-Roof", desc: "Roofing replacement or repair", x: 180, y: 20, w: 440, h: 130, color: "rgba(239,68,68,0.3)", stroke: "#ef4444" },
  // Chimney/Solar on roof
  { id: "solar", label: "Solar Panel", desc: "Photovoltaic system installation", x: 420, y: 30, w: 150, h: 80, color: "rgba(234,179,8,0.35)", stroke: "#eab308" },
  // Windows front
  { id: "window1", label: "Window Replacement", desc: "Impact windows, retrofit windows", x: 235, y: 220, w: 110, h: 80, color: "rgba(59,130,246,0.3)", stroke: "#3b82f6" },
  { id: "window2", label: "Window Replacement", desc: "Impact windows, retrofit windows", x: 455, y: 220, w: 110, h: 80, color: "rgba(59,130,246,0.3)", stroke: "#3b82f6" },
  // Front door
  { id: "door", label: "Door Replacement", desc: "Exterior door installation", x: 360, y: 250, w: 80, h: 120, color: "rgba(139,92,246,0.3)", stroke: "#8b5cf6" },
  // Garage
  { id: "garage", label: "Garage Door", desc: "Garage door replacement", x: 30, y: 215, w: 175, h: 155, color: "rgba(249,115,22,0.3)", stroke: "#f97316" },
  // Hurricane shutters (overlay on windows)
  { id: "shutters", label: "Hurricane Shutters", desc: "Accordion, panel, roll-down shutters", x: 220, y: 210, w: 135, h: 95, color: "rgba(168,85,247,0.2)", stroke: "#a855f7" },
  // Fence left
  { id: "fence_l", label: "Fence / Gate", desc: "Fence and gate installation", x: 0, y: 290, w: 40, h: 90, color: "rgba(34,197,94,0.3)", stroke: "#22c55e" },
  // Fence right
  { id: "fence_r", label: "Fence / Gate", desc: "Fence and gate installation", x: 760, y: 290, w: 40, h: 90, color: "rgba(34,197,94,0.3)", stroke: "#22c55e" },
  // Driveway concrete
  { id: "driveway", label: "Driveway (Concrete)", desc: "Concrete driveway installation", x: 0, y: 370, w: 220, h: 110, color: "rgba(107,114,128,0.3)", stroke: "#6b7280" },
  // Walkway
  { id: "walkway", label: "Walkway / Sidewalk", desc: "Pedestrian walkway construction", x: 310, y: 420, w: 75, h: 90, color: "rgba(156,163,175,0.3)", stroke: "#9ca3af" },
  // Retaining wall
  { id: "retwall", label: "Retaining Wall", desc: "Retaining wall construction", x: 760, y: 370, w: 40, h: 60, color: "rgba(180,83,9,0.3)", stroke: "#b45309" },
  // Swale (ground level drainage)
  { id: "swale", label: "Swale", desc: "Drainage swale modification", x: 0, y: 480, w: 800, h: 40, color: "rgba(16,185,129,0.2)", stroke: "#10b981" },
  // New construction / addition (whole structure)
  { id: "addition", label: "Residential Addition", desc: "Room additions, extensions", x: 700, y: 170, w: 100, h: 200, color: "rgba(99,102,241,0.25)", stroke: "#6366f1" },
  // Shed
  { id: "shed", label: "Shed", desc: "Accessory structure/shed (≤150 sq ft)", x: 730, y: 280, w: 70, h: 80, color: "rgba(120,53,15,0.25)", stroke: "#78350f" },
  // Screen enclosure
  { id: "screen", label: "Screen Enclosure", desc: "Pool cage, screen room", x: 560, y: 310, w: 140, h: 90, color: "rgba(14,165,233,0.2)", stroke: "#0ea5e9" },
];

const BACKYARD_ZONES = [
  // Roof visible from back
  { id: "roof_b", label: "Roof / Re-Roof", desc: "Roofing replacement or repair", x: 180, y: 20, w: 440, h: 110, color: "rgba(239,68,68,0.3)", stroke: "#ef4444" },
  // Back door
  { id: "backdoor", label: "Door Replacement", desc: "Exterior door installation", x: 370, y: 240, w: 70, h: 100, color: "rgba(139,92,246,0.3)", stroke: "#8b5cf6" },
  // Back windows
  { id: "bwindow1", label: "Window Replacement", desc: "Impact windows, retrofit windows", x: 230, y: 230, w: 110, h: 70, color: "rgba(59,130,246,0.3)", stroke: "#3b82f6" },
  { id: "bwindow2", label: "Window Replacement", desc: "Impact windows, retrofit windows", x: 460, y: 230, w: 110, h: 70, color: "rgba(59,130,246,0.3)", stroke: "#3b82f6" },
  // A/C unit
  { id: "ac", label: "A/C Replacement", desc: "Air conditioning change-out (≤5 tons)", x: 50, y: 300, w: 90, h: 70, color: "rgba(14,165,233,0.35)", stroke: "#0ea5e9" },
  // Generator
  { id: "gen", label: "Generator", desc: "Emergency generator installation", x: 660, y: 300, w: 80, h: 60, color: "rgba(220,38,38,0.3)", stroke: "#dc2626" },
  // Pool
  { id: "pool", label: "Pool", desc: "New swimming pool installation", x: 200, y: 390, w: 240, h: 130, color: "rgba(6,182,212,0.35)", stroke: "#06b6d4" },
  // Spa/hot tub
  { id: "spa", label: "Spa / Hot Tub", desc: "Spa or hot tub installation", x: 455, y: 400, w: 90, h: 90, color: "rgba(168,85,247,0.3)", stroke: "#a855f7" },
  // Pool deck
  { id: "pdeck", label: "Pool Deck", desc: "Pool deck construction", x: 160, y: 370, w: 420, h: 30, color: "rgba(245,158,11,0.3)", stroke: "#f59e0b" },
  // Pool heater
  { id: "pheater", label: "Pool Heater", desc: "Gas or electric pool heater", x: 560, y: 420, w: 70, h: 55, color: "rgba(239,68,68,0.25)", stroke: "#ef4444" },
  // Pool resurfacing (inside pool)
  { id: "presurf", label: "Pool Resurfacing", desc: "Pool replastering and tile", x: 215, y: 400, w: 200, h: 90, color: "rgba(34,211,238,0.25)", stroke: "#22d3ee" },
  // Pool equipment
  { id: "pequip", label: "Pool Equipment", desc: "Pump, filter, equipment changes", x: 640, y: 380, w: 70, h: 55, color: "rgba(249,115,22,0.3)", stroke: "#f97316" },
  // Deck/pergola
  { id: "deck", label: "Deck", desc: "Wood or composite deck", x: 80, y: 345, w: 100, h: 50, color: "rgba(120,53,15,0.3)", stroke: "#92400e" },
  // Pergola
  { id: "pergola", label: "Pergola", desc: "Pergola or gazebo structure", x: 540, y: 300, w: 90, h: 60, color: "rgba(217,119,6,0.3)", stroke: "#d97706" },
  // Patio/slab
  { id: "patio", label: "Patio / Slab", desc: "Concrete patio or slab", x: 75, y: 395, w: 115, h: 60, color: "rgba(107,114,128,0.3)", stroke: "#6b7280" },
  // Back fence
  { id: "bfence", label: "Fence / Gate", desc: "Fence and gate installation", x: 0, y: 350, w: 30, h: 130, color: "rgba(34,197,94,0.3)", stroke: "#22c55e" },
  { id: "bfence2", label: "Fence / Gate", desc: "Fence and gate installation", x: 770, y: 350, w: 30, h: 130, color: "rgba(34,197,94,0.3)", stroke: "#22c55e" },
  // Irrigation
  { id: "irrig", label: "Irrigation System", desc: "Sprinkler system installation", x: 630, y: 460, w: 100, h: 40, color: "rgba(16,185,129,0.3)", stroke: "#10b981" },
];

const INTERIOR_ZONES = [
  // New construction (whole interior)
  { id: "newconst", label: "New Construction", desc: "New home construction", x: 140, y: 30, w: 520, h: 440, color: "rgba(99,102,241,0.1)", stroke: "#6366f1" },
  // Remodel (kitchen area)
  { id: "remodel", label: "Residential Remodel", desc: "Interior alterations/renovations", x: 40, y: 100, w: 190, h: 180, color: "rgba(245,158,11,0.25)", stroke: "#f59e0b" },
  // Electrical panel
  { id: "panel", label: "Electrical Service", desc: "Panel upgrade, service change", x: 40, y: 60, w: 80, h: 100, color: "rgba(234,179,8,0.35)", stroke: "#eab308" },
  // EV Charger (garage interior)
  { id: "ev", label: "EV Charger", desc: "Electric vehicle charging station", x: 40, y: 300, w: 130, h: 90, color: "rgba(14,165,233,0.3)", stroke: "#0ea5e9" },
  // Low voltage / alarm
  { id: "alarm", label: "Low Voltage Alarm", desc: "Security/fire alarm systems", x: 560, y: 70, w: 100, h: 70, color: "rgba(220,38,38,0.25)", stroke: "#dc2626" },
  // Water heater (utility room)
  { id: "wh", label: "Water Heater", desc: "Water heater replacement (≤80 gal)", x: 680, y: 220, w: 100, h: 100, color: "rgba(239,68,68,0.3)", stroke: "#ef4444" },
  // Gas system
  { id: "gas", label: "Gas System", desc: "LP/natural gas piping and outlets", x: 680, y: 100, w: 100, h: 100, color: "rgba(249,115,22,0.3)", stroke: "#f97316" },
  // Backflow preventer
  { id: "backflow", label: "Backflow Preventer", desc: "Backflow device installation", x: 680, y: 350, w: 100, h: 70, color: "rgba(16,185,129,0.3)", stroke: "#10b981" },
  // Temporary electric
  { id: "tempelec", label: "Temporary Electric Service", desc: "30-day construction power", x: 40, y: 415, w: 130, h: 60, color: "rgba(234,179,8,0.25)", stroke: "#eab308" },
  // Interior HVAC ducts (ceiling area)
  { id: "hvac_in", label: "A/C Replacement", desc: "Air conditioning change-out (≤5 tons)", x: 145, y: 30, w: 510, h: 50, color: "rgba(14,165,233,0.2)", stroke: "#0ea5e9" },
  // Living room remodel area
  { id: "living", label: "Residential Remodel", desc: "Interior alterations/renovations", x: 250, y: 100, w: 200, h: 200, color: "rgba(245,158,11,0.15)", stroke: "#f59e0b" },
  // Bathroom plumbing
  { id: "bath", label: "Gas System", desc: "LP/natural gas piping and outlets", x: 460, y: 100, w: 200, h: 150, color: "rgba(249,115,22,0.15)", stroke: "#f97316" },
  // Driveway paver (viewed from inside garage)
  { id: "paver", label: "Driveway (Paver)", desc: "Paver driveway installation", x: 40, y: 390, w: 130, h: 50, color: "rgba(107,114,128,0.25)", stroke: "#6b7280" },
  // Solar wiring inside
  { id: "solarwire", label: "Solar Panel", desc: "Photovoltaic system installation", x: 400, y: 35, w: 150, h: 45, color: "rgba(234,179,8,0.25)", stroke: "#eab308" },
];

// Labels for each zone group (shown in legend)
const EXTERIOR_LEGEND = [
  { label: "Roof / Re-Roof", color: "#ef4444" },
  { label: "Solar Panel", color: "#eab308" },
  { label: "Window Replacement", color: "#3b82f6" },
  { label: "Door Replacement", color: "#8b5cf6" },
  { label: "Garage Door", color: "#f97316" },
  { label: "Hurricane Shutters", color: "#a855f7" },
  { label: "Fence / Gate", color: "#22c55e" },
  { label: "Driveway / Walkway", color: "#6b7280" },
  { label: "Residential Addition", color: "#6366f1" },
  { label: "Screen Enclosure", color: "#0ea5e9" },
  { label: "Shed", color: "#78350f" },
  { label: "Swale", color: "#10b981" },
];

const BACKYARD_LEGEND = [
  { label: "Pool", color: "#06b6d4" },
  { label: "Spa / Hot Tub", color: "#a855f7" },
  { label: "Pool Deck", color: "#f59e0b" },
  { label: "Pool Heater", color: "#ef4444" },
  { label: "Pool Equipment", color: "#f97316" },
  { label: "Pool Resurfacing", color: "#22d3ee" },
  { label: "A/C Replacement", color: "#0ea5e9" },
  { label: "Generator", color: "#dc2626" },
  { label: "Deck / Patio", color: "#92400e" },
  { label: "Pergola", color: "#d97706" },
  { label: "Fence / Gate", color: "#22c55e" },
  { label: "Irrigation", color: "#10b981" },
];

const INTERIOR_LEGEND = [
  { label: "New Construction", color: "#6366f1" },
  { label: "Residential Remodel", color: "#f59e0b" },
  { label: "Electrical Service", color: "#eab308" },
  { label: "EV Charger", color: "#0ea5e9" },
  { label: "Low Voltage Alarm", color: "#dc2626" },
  { label: "Water Heater", color: "#ef4444" },
  { label: "Gas System", color: "#f97316" },
  { label: "Backflow Preventer", color: "#10b981" },
  { label: "A/C (HVAC ducts)", color: "#0ea5e9" },
  { label: "Solar Panel (wiring)", color: "#eab308" },
];

// SVG illustrations for each view
function ExteriorSVG({ zones, showHighlights, onZoneClick, hoveredZone, setHoveredZone }) {
  return (
    <svg viewBox="0 0 800 530" className="w-full h-full" style={{ display: "block" }}>
      {/* Sky background */}
      <defs>
        <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#bfdbfe" />
          <stop offset="100%" stopColor="#dbeafe" />
        </linearGradient>
        <linearGradient id="grassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#86efac" />
          <stop offset="100%" stopColor="#4ade80" />
        </linearGradient>
        <linearGradient id="roofGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <linearGradient id="wallGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="100%" stopColor="#fef08a" />
        </linearGradient>
        <linearGradient id="drivewayGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#d1d5db" />
          <stop offset="100%" stopColor="#9ca3af" />
        </linearGradient>
      </defs>

      {/* Sky */}
      <rect x="0" y="0" width="800" height="530" fill="url(#skyGrad)" />
      {/* Clouds */}
      <ellipse cx="120" cy="50" rx="55" ry="22" fill="white" opacity="0.8" />
      <ellipse cx="160" cy="45" rx="45" ry="18" fill="white" opacity="0.8" />
      <ellipse cx="650" cy="60" rx="60" ry="22" fill="white" opacity="0.8" />
      <ellipse cx="690" cy="55" rx="40" ry="16" fill="white" opacity="0.8" />
      {/* Sun */}
      <circle cx="730" cy="60" r="28" fill="#fde68a" opacity="0.9" />

      {/* Ground */}
      <rect x="0" y="400" width="800" height="130" fill="url(#grassGrad)" />
      {/* Sidewalk strip */}
      <rect x="0" y="455" width="800" height="22" fill="#e5e7eb" />

      {/* Driveway */}
      <rect x="0" y="370" width="195" height="90" fill="url(#drivewayGrad)" rx="2" />
      {/* Driveway lines */}
      <line x1="65" y1="370" x2="65" y2="460" stroke="#b0b8c4" strokeWidth="1" strokeDasharray="8,6" />
      <line x1="130" y1="370" x2="130" y2="460" stroke="#b0b8c4" strokeWidth="1" strokeDasharray="8,6" />

      {/* Walkway to front door */}
      <rect x="322" y="380" width="60" height="80" fill="#e5e7eb" rx="4" />
      <rect x="328" y="386" width="48" height="68" fill="#d1d5db" rx="2" />

      {/* Swale - subtle ground depression */}
      <ellipse cx="400" cy="490" rx="400" ry="15" fill="#a7f3d0" opacity="0.4" />

      {/* Left fence */}
      <rect x="0" y="280" width="12" height="130" fill="#92400e" rx="2" />
      {[0, 22, 44, 66, 88, 110].map(y => (
        <rect key={y} x="0" y={280 + y} width="12" height="2" fill="#78350f" />
      ))}
      <line x1="6" y1="300" x2="6" y2="410" stroke="#a16207" strokeWidth="8" strokeDasharray="2,20" />

      {/* Right fence */}
      <rect x="788" y="280" width="12" height="130" fill="#92400e" rx="2" />
      <line x1="794" y1="300" x2="794" y2="410" stroke="#a16207" strokeWidth="8" strokeDasharray="2,20" />

      {/* Main house wall */}
      <rect x="205" y="150" width="390" height="250" fill="url(#wallGrad)" rx="3" />
      {/* Garage wall */}
      <rect x="20" y="180" width="200" height="220" fill="#f5f0e8" rx="3" />

      {/* Roof main */}
      <polygon points="185,150 400,20 615,150" fill="url(#roofGrad)" />
      {/* Roof ridge */}
      <line x1="185" y1="150" x2="615" y2="150" stroke="#334155" strokeWidth="3" />
      {/* Fascia */}
      <rect x="183" y="148" width="434" height="8" fill="#475569" rx="1" />

      {/* Chimney */}
      <rect x="320" y="50" width="35" height="70" fill="#64748b" />
      <rect x="315" y="48" width="45" height="10" fill="#475569" />

      {/* Solar panels on roof */}
      <rect x="430" y="60" width="140" height="75" fill="#1e3a5f" rx="3" opacity="0.85" />
      {[0, 1, 2].map(col => [0, 1].map(row => (
        <rect key={`${col}-${row}`} x={435 + col * 45} y={65 + row * 33} width="40" height="28" fill="#1d4ed8" opacity="0.7" rx="1" />
      )))}
      <text x="500" y="145" fill="#fbbf24" fontSize="9" textAnchor="middle" fontWeight="bold">SOLAR</text>

      {/* Garage door */}
      <rect x="30" y="210" width="175" height="145" fill="#e2e8f0" rx="4" />
      <rect x="34" y="214" width="167" height="137" fill="#cbd5e1" rx="3" />
      {[0, 1, 2, 3].map(i => (
        <rect key={i} x="34" y={214 + i * 34} width="167" height="3" fill="#94a3b8" />
      ))}
      {/* Garage door handle */}
      <rect x="110" y="280" width="25" height="6" fill="#64748b" rx="3" />

      {/* Windows */}
      <rect x="235" y="195" width="110" height="85" fill="#bfdbfe" rx="3" />
      <rect x="240" y="200" width="100" height="75" fill="#93c5fd" opacity="0.6" rx="2" />
      <line x1="290" y1="200" x2="290" y2="275" stroke="#1e40af" strokeWidth="2" />
      <line x1="240" y1="237" x2="340" y2="237" stroke="#1e40af" strokeWidth="2" />
      {/* Window sill */}
      <rect x="232" y="278" width="116" height="6" fill="#94a3b8" rx="1" />

      <rect x="455" y="195" width="110" height="85" fill="#bfdbfe" rx="3" />
      <rect x="460" y="200" width="100" height="75" fill="#93c5fd" opacity="0.6" rx="2" />
      <line x1="510" y1="200" x2="510" y2="275" stroke="#1e40af" strokeWidth="2" />
      <line x1="460" y1="237" x2="560" y2="237" stroke="#1e40af" strokeWidth="2" />
      <rect x="452" y="278" width="116" height="6" fill="#94a3b8" rx="1" />

      {/* Hurricane shutter indicator on left window */}
      <rect x="235" y="195" width="110" height="6" fill="#7c3aed" opacity="0.6" rx="1" />
      <rect x="235" y="205" width="110" height="3" fill="#7c3aed" opacity="0.4" />
      <rect x="235" y="212" width="110" height="3" fill="#7c3aed" opacity="0.4" />

      {/* Front door */}
      <rect x="365" y="250" width="70" height="150" fill="#92400e" rx="4" />
      <rect x="371" y="257" width="58" height="85" fill="#b45309" rx="2" />
      <rect x="371" y="349" width="58" height="45" fill="#b45309" rx="2" />
      <circle cx="389" cy="330" r="5" fill="#fbbf24" />
      {/* Door trim */}
      <rect x="362" y="248" width="76" height="5" fill="#78350f" rx="1" />

      {/* Addition (right side) */}
      <rect x="608" y="180" width="90" height="180" fill="#e0e7ff" rx="3" />
      <polygon points="603,180 653,100 703,180" fill="#a5b4fc" />
      <rect x="635" y="250" width="40" height="80" fill="#c7d2fe" rx="2" />
      <rect x="618" y="200" width="35" height="35" fill="#a5b4fc" rx="2" />

      {/* Shed */}
      <rect x="718" y="290" width="70" height="80" fill="#d97706" rx="2" />
      <polygon points="713,290 753,250 793,290" fill="#b45309" />
      <rect x="738" y="325" width="25" height="45" fill="#92400e" rx="1" />

      {/* Screen enclosure */}
      <rect x="555" y="295" width="145" height="100" fill="rgba(14,165,233,0.08)" stroke="#0ea5e9" strokeWidth="2" strokeDasharray="6,4" rx="4" />
      <line x1="555" y1="295" x2="700" y2="295" stroke="#0ea5e9" strokeWidth="1.5" strokeDasharray="4,4" />
      <line x1="555" y1="345" x2="700" y2="345" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="4,4" />
      <line x1="605" y1="295" x2="605" y2="395" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="4,4" />
      <line x1="655" y1="295" x2="655" y2="395" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="4,4" />
      <text x="627" y="350" fill="#0369a1" fontSize="9" textAnchor="middle" fontWeight="bold">SCREEN</text>

      {/* Retaining wall */}
      <rect x="760" y="370" width="30" height="50" fill="#b45309" rx="1" />
      {[0, 1, 2].map(i => (
        <rect key={i} x="760" y={374 + i * 15} width="30" height="2" fill="#92400e" />
      ))}

      {/* Swale indicator */}
      <path d="M 0 490 Q 400 510 800 490" stroke="#10b981" strokeWidth="2" fill="none" strokeDasharray="8,4" opacity="0.7" />

      {/* Render interactive zones */}
      {zones.map((zone, i) => (
        <g key={zone.id + i}>
          <rect
            x={zone.x} y={zone.y} width={zone.w} height={zone.h}
            fill={hoveredZone === zone.id || showHighlights ? zone.color : "transparent"}
            stroke={hoveredZone === zone.id ? zone.stroke : showHighlights ? zone.stroke : "transparent"}
            strokeWidth={hoveredZone === zone.id ? 2.5 : 1.5}
            strokeDasharray={hoveredZone === zone.id ? "none" : "5,3"}
            rx="4"
            style={{ cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={() => setHoveredZone(zone.id)}
            onMouseLeave={() => setHoveredZone(null)}
            onClick={() => onZoneClick(zone.label, zone.desc)}
          />
          {hoveredZone === zone.id && (
            <foreignObject
              x={Math.min(zone.x, 800 - 160)}
              y={Math.max(zone.y - 38, 2)}
              width="160"
              height="34"
            >
              <div xmlns="http://www.w3.org/1999/xhtml"
                style={{
                  background: "rgba(0,0,0,0.82)",
                  color: "white",
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "5px 10px",
                  borderRadius: "6px",
                  whiteSpace: "nowrap",
                  pointerEvents: "none",
                }}
              >
                {zone.label}
              </div>
            </foreignObject>
          )}
        </g>
      ))}
    </svg>
  );
}

function BackyardSVG({ zones, showHighlights, onZoneClick, hoveredZone, setHoveredZone }) {
  return (
    <svg viewBox="0 0 800 530" className="w-full h-full" style={{ display: "block" }}>
      <defs>
        <linearGradient id="skyGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#bfdbfe" />
          <stop offset="100%" stopColor="#dbeafe" />
        </linearGradient>
        <linearGradient id="poolGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
      {/* Sky */}
      <rect x="0" y="0" width="800" height="530" fill="url(#skyGrad2)" />
      {/* Ground */}
      <rect x="0" y="360" width="800" height="170" fill="#86efac" />

      {/* House back wall */}
      <rect x="190" y="130" width="420" height="240" fill="#f5f0e8" rx="3" />
      {/* Back roof */}
      <polygon points="170,130 400,30 630,130" fill="#64748b" />
      <rect x="168" y="128" width="464" height="8" fill="#475569" rx="1" />

      {/* Back windows */}
      <rect x="225" y="200" width="100" height="70" fill="#bfdbfe" rx="3" />
      <rect x="230" y="205" width="90" height="60" fill="#93c5fd" opacity="0.6" rx="2" />
      <line x1="275" y1="205" x2="275" y2="265" stroke="#1e40af" strokeWidth="2" />
      <line x1="230" y1="235" x2="320" y2="235" stroke="#1e40af" strokeWidth="2" />

      <rect x="475" y="200" width="100" height="70" fill="#bfdbfe" rx="3" />
      <rect x="480" y="205" width="90" height="60" fill="#93c5fd" opacity="0.6" rx="2" />
      <line x1="525" y1="205" x2="525" y2="265" stroke="#1e40af" strokeWidth="2" />
      <line x1="480" y1="235" x2="570" y2="235" stroke="#1e40af" strokeWidth="2" />

      {/* Back door */}
      <rect x="365" y="240" width="70" height="130" fill="#92400e" rx="4" />
      <rect x="370" y="246" width="60" height="80" fill="#b45309" rx="2" />
      <circle cx="386" cy="308" r="5" fill="#fbbf24" />

      {/* A/C unit */}
      <rect x="50" y="290" width="90" height="70" fill="#cbd5e1" rx="6" />
      <rect x="56" y="296" width="78" height="58" fill="#94a3b8" rx="4" />
      {[0, 1, 2, 3, 4, 5].map(i => (
        <line key={i} x1={58} y1={302 + i * 9} x2={132} y2={302 + i * 9} stroke="#64748b" strokeWidth="1.5" />
      ))}
      <circle cx="95" cy="340" r="12" fill="#6b7280" />
      <circle cx="95" cy="340" r="6" fill="#4b5563" />
      <text x="95" y="380" fill="#0369a1" fontSize="9" textAnchor="middle" fontWeight="bold">A/C</text>

      {/* Generator */}
      <rect x="658" y="290" width="80" height="60" fill="#374151" rx="5" />
      <rect x="663" y="295" width="70" height="50" fill="#1f2937" rx="3" />
      <circle cx="698" cy="320" r="14" fill="#4b5563" />
      <circle cx="698" cy="320" r="8" fill="#374151" />
      <text x="698" y="365" fill="#ef4444" fontSize="9" textAnchor="middle" fontWeight="bold">GEN</text>

      {/* Pergola */}
      <rect x="540" y="290" width="100" height="55" fill="none" stroke="#d97706" strokeWidth="3" />
      {[540, 570, 600, 630, 640].map((x, i) => (
        <line key={i} x1={x} y1="290" x2={x - 10} y2="345" stroke="#b45309" strokeWidth="2" />
      ))}
      {[0, 20, 40, 60, 80, 100].map((x, i) => (
        <line key={i} x1={540 + x} y1="290" x2={540 + x} y2="340" stroke="#b45309" strokeWidth="1.5" strokeDasharray="4,3" />
      ))}
      <text x="590" y="355" fill="#b45309" fontSize="9" textAnchor="middle" fontWeight="bold">PERGOLA</text>

      {/* Deck / patio */}
      <rect x="70" y="350" width="120" height="55" fill="#d2b48c" rx="3" />
      {[0, 15, 30, 45].map(i => (
        <line key={i} x1="70" y1={358 + i} x2="190" y2={358 + i} stroke="#c8a882" strokeWidth="1" />
      ))}
      <text x="130" y="385" fill="#78350f" fontSize="9" textAnchor="middle" fontWeight="bold">DECK</text>

      {/* Patio/slab */}
      <rect x="75" y="390" width="110" height="55" fill="#e5e7eb" rx="2" />
      <text x="130" y="420" fill="#4b5563" fontSize="9" textAnchor="middle">PATIO</text>

      {/* Pool */}
      <rect x="200" y="390" width="245" height="130" fill="url(#poolGrad)" rx="12" />
      {/* Pool water ripple */}
      <ellipse cx="322" cy="455" rx="100" ry="40" fill="white" opacity="0.08" />
      <ellipse cx="280" cy="430" rx="60" ry="20" fill="white" opacity="0.1" />
      {/* Pool tile edge */}
      <rect x="200" y="390" width="245" height="10" fill="#7dd3fc" rx="12" opacity="0.7" />
      <text x="322" y="460" fill="white" fontSize="11" textAnchor="middle" fontWeight="bold">POOL</text>

      {/* Pool deck */}
      <rect x="165" y="375" width="315" height="18" fill="#e2e8f0" rx="3" />

      {/* Spa/hot tub */}
      <ellipse cx="500" cy="430" rx="52" ry="45" fill="#c4b5fd" />
      <ellipse cx="500" cy="430" rx="42" ry="35" fill="#8b5cf6" opacity="0.7" />
      <text x="500" y="434" fill="white" fontSize="9" textAnchor="middle" fontWeight="bold">SPA</text>

      {/* Pool resurfacing (plaster inside pool) */}
      <rect x="208" y="400" width="220" height="85" fill="#22d3ee" opacity="0.15" rx="8" />

      {/* Pool heater */}
      <rect x="560" y="405" width="70" height="55" fill="#fca5a5" rx="4" />
      <rect x="565" y="410" width="60" height="45" fill="#ef4444" opacity="0.5" rx="3" />
      <text x="595" y="440" fill="#7f1d1d" fontSize="8" textAnchor="middle" fontWeight="bold">HEATER</text>

      {/* Pool equipment */}
      <rect x="640" y="390" width="65" height="55" fill="#fed7aa" rx="4" />
      <circle cx="672" cy="415" r="15" fill="#f97316" opacity="0.6" />
      <text x="672" y="460" fill="#7c2d12" fontSize="8" textAnchor="middle" fontWeight="bold">EQUIP</text>

      {/* Irrigation heads */}
      {[660, 710, 760].map((x, i) => (
        <g key={i}>
          <circle cx={x} cy="455" r="6" fill="#10b981" opacity="0.6" />
          <path d={`M ${x} 455 Q ${x + 15} 440 ${x + 25} 445`} stroke="#34d399" strokeWidth="1.5" fill="none" opacity="0.7" />
        </g>
      ))}
      <text x="710" y="475" fill="#065f46" fontSize="9" textAnchor="middle">IRRIGATION</text>

      {/* Left/right fence */}
      <rect x="0" y="340" width="12" height="150" fill="#92400e" rx="2" />
      <line x1="6" y1="360" x2="6" y2="490" stroke="#a16207" strokeWidth="8" strokeDasharray="2,20" />
      <rect x="788" y="340" width="12" height="150" fill="#92400e" rx="2" />
      <line x1="794" y1="360" x2="794" y2="490" stroke="#a16207" strokeWidth="8" strokeDasharray="2,20" />

      {/* Render interactive zones */}
      {zones.map((zone, i) => (
        <g key={zone.id + i}>
          <rect
            x={zone.x} y={zone.y} width={zone.w} height={zone.h}
            fill={hoveredZone === zone.id || showHighlights ? zone.color : "transparent"}
            stroke={hoveredZone === zone.id ? zone.stroke : showHighlights ? zone.stroke : "transparent"}
            strokeWidth={hoveredZone === zone.id ? 2.5 : 1.5}
            strokeDasharray={hoveredZone === zone.id ? "none" : "5,3"}
            rx="4"
            style={{ cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={() => setHoveredZone(zone.id)}
            onMouseLeave={() => setHoveredZone(null)}
            onClick={() => onZoneClick(zone.label, zone.desc)}
          />
          {hoveredZone === zone.id && (
            <foreignObject
              x={Math.min(zone.x, 800 - 160)}
              y={Math.max(zone.y - 38, 2)}
              width="160"
              height="34"
            >
              <div xmlns="http://www.w3.org/1999/xhtml"
                style={{
                  background: "rgba(0,0,0,0.82)",
                  color: "white",
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "5px 10px",
                  borderRadius: "6px",
                  whiteSpace: "nowrap",
                  pointerEvents: "none",
                }}
              >
                {zone.label}
              </div>
            </foreignObject>
          )}
        </g>
      ))}
    </svg>
  );
}

function InteriorSVG({ zones, showHighlights, onZoneClick, hoveredZone, setHoveredZone }) {
  return (
    <svg viewBox="0 0 800 530" className="w-full h-full" style={{ display: "block" }}>
      <defs>
        <linearGradient id="floorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#d4a882" />
          <stop offset="100%" stopColor="#c8956c" />
        </linearGradient>
        <linearGradient id="ceilGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#f1f5f9" />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect x="0" y="0" width="800" height="530" fill="#f8fafc" />

      {/* Ceiling */}
      <rect x="140" y="30" width="520" height="50" fill="url(#ceilGrad)" rx="3" />
      {/* HVAC duct in ceiling */}
      <rect x="155" y="38" width="490" height="20" fill="#e2e8f0" rx="2" />
      {[180, 260, 340, 420, 500, 580].map(x => (
        <rect key={x} x={x} y="38" width="15" height="20" fill="#94a3b8" rx="1" />
      ))}
      <text x="400" y="65" fill="#0369a1" fontSize="8" textAnchor="middle">HVAC DUCTS</text>

      {/* Outer walls */}
      <rect x="140" y="30" width="18" height="470" fill="#94a3b8" /> {/* Left wall */}
      <rect x="642" y="30" width="18" height="470" fill="#94a3b8" /> {/* Right wall */}
      <rect x="140" y="480" width="520" height="18" fill="#94a3b8" /> {/* Floor wall */}

      {/* Floor */}
      <rect x="158" y="460" width="484" height="20" fill="url(#floorGrad)" />
      {/* Floor planks */}
      {[0, 60, 120, 180, 240, 300, 360, 420, 480].map(x => (
        <line key={x} x1={158 + x} y1="460" x2={158 + x} y2="480" stroke="#b8865a" strokeWidth="1" />
      ))}

      {/* Interior dividing walls */}
      {/* Left vertical wall */}
      <rect x="300" y="30" width="12" height="240" fill="#cbd5e1" />
      <rect x="300" y="290" width="12" height="170" fill="#cbd5e1" />
      {/* Right vertical wall */}
      <rect x="500" y="30" width="12" height="240" fill="#cbd5e1" />
      <rect x="500" y="290" width="12" height="170" fill="#cbd5e1" />
      {/* Horizontal middle wall */}
      <rect x="158" y="265" width="484" height="12" fill="#cbd5e1" />

      {/* ===== ROOMS ===== */}

      {/* GARAGE (left) */}
      <rect x="0" y="30" width="140" height="470" fill="#f1f5f9" />
      <rect x="0" y="30" width="140" height="20" fill="#64748b" />
      <text x="70" y="44" fill="white" fontSize="9" textAnchor="middle" fontWeight="bold">GARAGE</text>
      {/* Garage EV charger */}
      <rect x="8" y="290" width="50" height="80" fill="#bfdbfe" rx="4" />
      <rect x="13" y="300" width="40" height="55" fill="#60a5fa" opacity="0.7" rx="3" />
      <text x="33" y="390" fill="#1e40af" fontSize="8" textAnchor="middle" fontWeight="bold">EV</text>
      {/* Driveway paver at bottom of garage */}
      <rect x="0" y="420" width="140" height="50" fill="#d1d5db" rx="2" />
      <text x="70" y="448" fill="#4b5563" fontSize="8" textAnchor="middle">DRIVEWAY</text>
      {/* Temp electric meter */}
      <rect x="8" y="390" width="50" height="30" fill="#fde68a" rx="3" />
      <text x="33" y="408" fill="#92400e" fontSize="7" textAnchor="middle">TEMP ELEC</text>

      {/* Right utility space */}
      <rect x="660" y="30" width="140" height="470" fill="#f8f5f0" />
      <rect x="660" y="30" width="140" height="20" fill="#64748b" />
      <text x="730" y="44" fill="white" fontSize="9" textAnchor="middle" fontWeight="bold">UTILITY</text>
      {/* Electrical panel */}
      <rect x="668" y="60" width="55" height="100" fill="#374151" rx="4" />
      <rect x="673" y="65" width="45" height="90" fill="#1f2937" rx="3" />
      {[0, 1, 2, 3, 4, 5].map(i => (
        <rect key={i} x="676" y={70 + i * 13} width="18" height="9" fill="#4b5563" rx="1" />
      ))}
      {[0, 1, 2, 3, 4, 5].map(i => (
        <rect key={i} x="700" y={70 + i * 13} width="18" height="9" fill="#4b5563" rx="1" />
      ))}
      <text x="695" y="172" fill="#fbbf24" fontSize="9" textAnchor="middle" fontWeight="bold">PANEL</text>
      {/* Water heater */}
      <ellipse cx="725" cy="270" rx="30" ry="50" fill="#fca5a5" />
      <ellipse cx="725" cy="228" rx="25" ry="12" fill="#f87171" />
      <rect x="700" y="265" width="50" height="60" fill="#ef4444" opacity="0.5" rx="3" />
      <text x="725" y="330" fill="#7f1d1d" fontSize="9" textAnchor="middle" fontWeight="bold">WATER HTR</text>
      {/* Gas pipe */}
      <rect x="668" y="175" width="55" height="75" fill="#fed7aa" rx="4" />
      <text x="695" y="210" fill="#7c2d12" fontSize="8" textAnchor="middle">GAS</text>
      <line x1="695" y1="250" x2="695" y2="280" stroke="#ea580c" strokeWidth="3" />
      {/* Backflow preventer */}
      <rect x="668" y="360" width="55" height="55" fill="#a7f3d0" rx="4" />
      <text x="695" y="385" fill="#065f46" fontSize="7" textAnchor="middle">BACKFLOW</text>
      <text x="695" y="395" fill="#065f46" fontSize="7" textAnchor="middle">PREV.</text>

      {/* Kitchen */}
      <rect x="158" y="80" width="142" height="185" fill="#fef9c3" opacity="0.5" />
      <text x="170" y="96" fill="#92400e" fontSize="9" fontWeight="bold">KITCHEN</text>
      {/* Counter */}
      <rect x="158" y="130" width="125" height="20" fill="#e2e8f0" rx="2" />
      <rect x="158" y="155" width="125" height="18" fill="#f1f5f9" rx="2" />
      {/* Sink */}
      <rect x="168" y="133" width="40" height="15" fill="#93c5fd" rx="3" />
      <circle cx="210" cy="140" r="5" fill="#64748b" />
      {/* Stove burners */}
      {[[185, 175], [215, 175], [185, 195], [215, 195]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="8" fill="#374151" opacity="0.6" />
      ))}

      {/* Living room */}
      <rect x="310" y="80" width="190" height="185" fill="#eff6ff" opacity="0.5" />
      <text x="322" y="96" fill="#1e40af" fontSize="9" fontWeight="bold">LIVING ROOM</text>
      {/* Sofa */}
      <rect x="330" y="200" width="140" height="45" fill="#93c5fd" rx="6" />
      <rect x="330" y="190" width="140" height="18" fill="#60a5fa" rx="3" />
      <rect x="330" y="190" width="18" height="55" fill="#3b82f6" rx="3" />
      <rect x="452" y="190" width="18" height="55" fill="#3b82f6" rx="3" />
      {/* TV */}
      <rect x="350" y="110" width="90" height="55" fill="#1e293b" rx="4" />
      <rect x="354" y="114" width="82" height="47" fill="#0f172a" rx="2" />
      <rect x="388" y="165" width="14" height="10" fill="#334155" />

      {/* Primary bedroom */}
      <rect x="158" y="277" width="142" height="183" fill="#fdf2f8" opacity="0.5" />
      <text x="170" y="293" fill="#9d174d" fontSize="9" fontWeight="bold">BEDROOM</text>
      {/* Bed */}
      <rect x="175" y="330" width="110" height="100" fill="#fce7f3" rx="4" />
      <rect x="175" y="330" width="110" height="30" fill="#f9a8d4" rx="4" />
      <rect x="185" y="335" width="35" height="20" fill="white" rx="3" />
      <rect x="245" y="335" width="35" height="20" fill="white" rx="3" />

      {/* Bathroom */}
      <rect x="310" y="277" width="190" height="183" fill="#f0fdfa" opacity="0.5" />
      <text x="322" y="293" fill="#0f766e" fontSize="9" fontWeight="bold">BATH / PLUMBING</text>
      {/* Bathtub */}
      <rect x="325" y="310" width="80" height="50" fill="#a5f3fc" rx="8" />
      <rect x="330" y="315" width="70" height="40" fill="#67e8f9" opacity="0.6" rx="6" />
      {/* Toilet */}
      <ellipse cx="440" cy="380" rx="22" ry="28" fill="#e5e7eb" />
      <rect x="420" y="352" width="40" height="18" fill="#d1d5db" rx="3" />
      {/* Sink/vanity */}
      <rect x="315" y="390" width="60" height="30" fill="#e0e7ff" rx="4" />
      {/* Plumbing lines */}
      <line x1="340" y1="420" x2="340" y2="460" stroke="#0e7490" strokeWidth="2" strokeDasharray="4,3" />
      <line x1="440" y1="410" x2="440" y2="460" stroke="#0e7490" strokeWidth="2" strokeDasharray="4,3" />
      {/* Alarm sensor */}
      <rect x="560" y="60" width="70" height="55" fill="#fca5a5" rx="4" />
      <circle cx="595" cy="82" r="12" fill="#ef4444" opacity="0.7" />
      <text x="595" y="87" fill="white" fontSize="7" textAnchor="middle" fontWeight="bold">ALARM</text>

      {/* Render interactive zones */}
      {zones.map((zone, i) => (
        <g key={zone.id + i}>
          <rect
            x={zone.x} y={zone.y} width={zone.w} height={zone.h}
            fill={hoveredZone === zone.id || showHighlights ? zone.color : "transparent"}
            stroke={hoveredZone === zone.id ? zone.stroke : showHighlights ? zone.stroke : "transparent"}
            strokeWidth={hoveredZone === zone.id ? 2.5 : 1.5}
            strokeDasharray={hoveredZone === zone.id ? "none" : "5,3"}
            rx="4"
            style={{ cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={() => setHoveredZone(zone.id)}
            onMouseLeave={() => setHoveredZone(null)}
            onClick={() => onZoneClick(zone.label, zone.desc)}
          />
          {hoveredZone === zone.id && (
            <foreignObject
              x={Math.min(zone.x, 800 - 160)}
              y={Math.max(zone.y - 38, 2)}
              width="160"
              height="34"
            >
              <div xmlns="http://www.w3.org/1999/xhtml"
                style={{
                  background: "rgba(0,0,0,0.82)",
                  color: "white",
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "5px 10px",
                  borderRadius: "6px",
                  whiteSpace: "nowrap",
                  pointerEvents: "none",
                }}
              >
                {zone.label}
              </div>
            </foreignObject>
          )}
        </g>
      ))}
    </svg>
  );
}

export default function HouseView({ view, showHighlights, onZoneClick }) {
  const [hoveredZone, setHoveredZone] = useState(null);

  const handleZoneClick = (label, desc) => {
    onZoneClick(label, desc);
  };

  const zones = view === "exterior" ? EXTERIOR_ZONES : view === "backyard" ? BACKYARD_ZONES : INTERIOR_ZONES;
  const legend = view === "exterior" ? EXTERIOR_LEGEND : view === "backyard" ? BACKYARD_LEGEND : INTERIOR_LEGEND;

  return (
    <div className="space-y-4">
      <div
        className="relative rounded-2xl overflow-hidden shadow-xl border border-gray-200 bg-white"
        style={{ aspectRatio: "800/530" }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full"
          >
            {view === "exterior" && (
              <ExteriorSVG
                zones={zones}
                showHighlights={showHighlights}
                onZoneClick={handleZoneClick}
                hoveredZone={hoveredZone}
                setHoveredZone={setHoveredZone}
              />
            )}
            {view === "backyard" && (
              <BackyardSVG
                zones={zones}
                showHighlights={showHighlights}
                onZoneClick={handleZoneClick}
                hoveredZone={hoveredZone}
                setHoveredZone={setHoveredZone}
              />
            )}
            {view === "interior" && (
              <InteriorSVG
                zones={zones}
                showHighlights={showHighlights}
                onZoneClick={handleZoneClick}
                hoveredZone={hoveredZone}
                setHoveredZone={setHoveredZone}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Color legend */}
      {showHighlights && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Permit Zones Legend</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {legend.map(item => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: item.color, opacity: 0.8 }} />
                <span className="text-xs text-gray-600">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}