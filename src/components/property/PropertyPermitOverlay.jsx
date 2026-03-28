import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ZoomIn, ZoomOut, X, Maximize2, Layers } from "lucide-react";

// ── Zone label → permit_type mapping ─────────────────────────────────────
// Maps HouseView zone labels to PermitRecord permit_type values
const LABEL_TO_PERMIT_TYPES = {
  "Roof / Re-Roof":        ["roofing"],
  "Solar Panels":          ["electrical", "building"],
  "Window Replacement":    ["building"],
  "Door Replacement":      ["building"],
  "Garage Door":           ["building"],
  "A/C Replacement":       ["mechanical"],
  "Electrical Service":    ["electrical"],
  "Pool & Spa":            ["pool"],
  "Pool Equipment":        ["mechanical", "pool"],
  "Driveway (Paver)":      ["building"],
  "Walkway / Sidewalk":    ["building"],
  "Fence / Gate":          ["fence"],
  "Patio / Slab":          ["building"],
  "Covered Patio":         ["building", "addition"],
  "Pergola":               ["building", "addition"],
  "Plumbing":              ["plumbing"],
  "Residential Remodel":   ["remodel", "building"],
  "Residential Addition":  ["addition"],
  "Driveway":              ["building"],
  "Pool Deck":             ["building", "pool"],
  "Irrigation System":     ["plumbing", "building"],
  "EV Charging Station":   ["electrical"],
  "Light Pole / Utility":  ["electrical", "building"],
  "Underground Drainage":  ["building", "plumbing"],
  "Asphalt / Milling & Paving": ["building"],
  "Seal Coat & Striping":  ["building"],
  "Sidewalk / Curb":       ["building"],
  "Pavement / Earthwork":  ["building"],
  "Utility Boring":        ["building", "plumbing"],
  "Sign Permit":           ["building"],
};

// Also match by keyword in permit_description
const LABEL_TO_KEYWORDS = {
  "Roof / Re-Roof":        ["roof", "shingle", "tile roof", "re-roof", "reroof"],
  "Solar Panels":          ["solar", "photovoltaic", "pv system"],
  "Window Replacement":    ["window", "impact window", "impact glass"],
  "Door Replacement":      ["door", "sliding door", "entry door"],
  "Garage Door":           ["garage door", "garage"],
  "A/C Replacement":       ["a/c", "ac unit", "air condition", "hvac", "mechanical"],
  "Electrical Service":    ["electrical", "panel", "service", "meter"],
  "Pool & Spa":            ["pool", "spa", "hot tub"],
  "Pool Equipment":        ["pump", "filter", "pool equipment"],
  "Driveway (Paver)":      ["driveway", "paver"],
  "Walkway / Sidewalk":    ["walkway", "sidewalk", "concrete path"],
  "Fence / Gate":          ["fence", "gate", "fencing"],
  "Patio / Slab":          ["patio", "slab", "concrete slab"],
  "Covered Patio":         ["covered patio", "patio cover", "screen enclosure"],
  "Pergola":               ["pergola", "gazebo", "arbor"],
  "Plumbing":              ["plumbing", "water heater", "sewer", "drain"],
  "Residential Remodel":   ["remodel", "renovation", "kitchen", "bathroom", "interior"],
  "Residential Addition":  ["addition", "room addition", "extension", "balcony"],
  "Driveway":              ["driveway"],
  "Pool Deck":             ["pool deck", "deck"],
  "Irrigation System":     ["irrigation", "sprinkler"],
  "EV Charging Station":   ["ev charger", "electric vehicle", "charging station"],
  "Asphalt / Milling & Paving": ["asphalt", "milling", "paving"],
  "Seal Coat & Striping":  ["seal coat", "striping", "parking lot"],
};

const IMAGES = {
  front:      "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ac5571087590fc03d44b73/ecd30d709_FrontView.png",
  back:       "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ac5571087590fc03d44b73/3119749c5_BackView.png",
  eagle:      "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ac5571087590fc03d44b73/4422873fc_EagleEyeView.png",
};

const IMAGE_DIMS = {
  front: { w: 1375, h: 750 },
  back:  { w: 1380, h: 768 },
  eagle: { w: 1366, h: 768 },
};

const FRONT_ZONES = [
  { id: "window-1",          label: "Window Replacement",  points: "376,278 477,278 477,366 376,366" },
  { id: "window-2",          label: "Window Replacement",  points: "754,274 884,274 884,357 754,357" },
  { id: "window-3",          label: "Window Replacement",  points: "713,458 869,458 869,569 713,569" },
  { id: "window-4",          label: "Window Replacement",  points: "375,435 376,525 466,533 469,438" },
  { id: "window-5",          label: "Window Replacement",  points: "1022,283 1033,288 1032,353 1019,357" },
  { id: "window-6",          label: "Window Replacement",  points: "1036,442 1048,441 1047,525 1036,535" },
  { id: "window-7",          label: "Window Replacement",  points: "1067,440 1065,518 1078,512 1079,435" },
  { id: "ac-unit",           label: "A/C Replacement",     points: "969,575 965,629 1019,642 1069,605 1059,556 1019,548" },
  { id: "electrical-panel",  label: "Electrical Service",  points: "986,473 986,525 1012,527 1011,473" },
  { id: "concrete-driveway", label: "Driveway (Paver)",    points: "1,583 2,648 327,573 298,550 276,561 183,578 149,580 116,578 92,564" },
  { id: "garage-door",       label: "Garage Door",         points: "249,439 249,522 288,529 298,547 313,550 319,507 324,500 339,520 338,440" },
  { id: "solar-panel-1",     label: "Solar Panels",        points: "581,156 532,212 556,215 536,244 637,244 661,210 630,205 655,178 626,182 642,155" },
  { id: "solar-panel-2",     label: "Solar Panels",        points: "724,133 700,160 731,158 709,184 741,183 726,211 755,211 736,243 853,240 875,204 838,202 853,173 820,173 834,149 803,149 816,123" },
  { id: "roof-1",            label: "Roof / Re-Roof",      points: "342,347 205,402 341,411" },
  { id: "roof-2",            label: "Roof / Re-Roof",      points: "731,361 674,420 942,431 1100,406 1039,375 922,390 883,366" },
  { id: "roof-3",            label: "Roof / Re-Roof",      points: "413,150 538,175 641,130 684,139 698,131 822,117 1103,273 930,244 855,244 876,205 842,201 856,173 823,170 837,147 805,147 820,126 716,134 700,158 724,161 711,182 734,185 720,212 749,215 738,254 691,244 638,249 660,206 642,201 656,177 628,178 644,152 583,155 531,215 549,218 519,260" },
  { id: "walk-way-1",        label: "Walkway / Sidewalk",  points: "199,602 425,633 202,703 296,725 616,612 522,597 475,618 268,585" },
  { id: "pool",              label: "Pool & Spa",          points: "1125,490 1085,508 1078,542 1266,555 1314,503" },
  { id: "pool-pump",         label: "Pool Equipment",      points: "1272,530 1342,530 1342,581 1272,581" },
  { id: "door-front",        label: "Door Replacement",    points: "569,438 567,562 637,566 636,435" },
  { id: "slide-door-front",  label: "Door Replacement",    points: "578,286 578,397 636,400 635,344 669,345 671,282" },
];

const BACK_ZONES = [
  { id: "roof-1",       label: "Roof / Re-Roof",       points: "458,92 176,227 424,238 614,230 841,235 907,233 1085,234 1193,225 978,106 870,113 788,68 672,73 610,103" },
  { id: "window-1",     label: "Window Replacement",   points: "314,253 313,324 341,330 339,251" },
  { id: "window-2",     label: "Window Replacement",   points: "292,410 293,498 317,498 315,412" },
  { id: "window-3",     label: "Window Replacement",   points: "468,253 472,344 574,330 575,251" },
  { id: "slide-door-1", label: "Door Replacement",     points: "619,395 623,499 686,480 686,392 659,388" },
  { id: "slide-door-2", label: "Door Replacement",     points: "718,393 716,477 825,495 822,406" },
  { id: "ac-unit",      label: "A/C Replacement",      points: "154,471 123,480 121,520 188,544 216,534 218,517 221,487" },
  { id: "fence-1",      label: "Fence / Gate",         points: "1,579 2,645 88,696 309,767 620,766" },
  { id: "pool",         label: "Pool & Spa",           points: "625,533 373,619 802,726 973,621 680,568 726,555" },
  { id: "paver-patio",  label: "Patio / Slab",         points: "981,555 1003,550 1028,560 1058,536 1027,528 687,477 618,502 280,612 322,642 373,619 625,530 716,553 686,566 966,620 799,726 768,767 909,768 1048,764 1073,743 1001,709 1032,670 1048,616" },
  { id: "covered-patio",label: "Covered Patio",        points: "686,347 614,362 615,386 1017,428 1065,411 1069,382" },
  { id: "pergola",      label: "Pergola",              points: "803,714 803,484 791,483 792,458 959,402 1231,436 1227,453 1218,456 1211,620 1058,751" },
  { id: "pool-pump",    label: "Pool Equipment",       points: "251,580 325,580 325,649 251,649" },
];

const EAGLE_ZONES = [
  { id: "roof_e",     label: "Roof / Re-Roof",          points: "0,0 751,0 751,346 0,346" },
  { id: "kitchen",    label: "Residential Remodel",     points: "765,92 1012,92 1012,230 765,230" },
  { id: "bathroom_e", label: "Plumbing",                points: "1011,92 1203,92 1203,215 1011,215" },
  { id: "bedroom1",   label: "Residential Remodel",     points: "82,92 383,92 383,230 82,230" },
  { id: "bedroom2",   label: "Residential Remodel",     points: "27,353 382,353 382,522 27,522" },
  { id: "balcony_e",  label: "Residential Addition",    points: "464,15 1011,15 1011,107 464,107" },
  { id: "driveway_e", label: "Driveway",                points: "1025,77 1366,77 1366,368 1025,368" },
  { id: "pool_e",     label: "Pool & Spa",              points: "820,476 1366,476 1366,768 820,768" },
  { id: "ac_e",       label: "A/C Replacement",         points: "0,353 109,353 109,430 0,430" },
  { id: "panel_e",    label: "Electrical Service",      points: "491,322 573,322 573,384 491,384" },
  { id: "fence_e",    label: "Fence / Gate",            points: "0,0 55,0 55,768 0,768" },
  { id: "lawn_e",     label: "Irrigation System",       points: "55,599 765,599 765,768 55,768" },
];

const VIEW_ZONES = { front: FRONT_ZONES, back: BACK_ZONES, eagle: EAGLE_ZONES };

// Glow / highlight colors for active permit zones
const ACTIVE_COLOR = "rgba(251,191,36,0.55)";
const ACTIVE_STROKE = "#f59e0b";
const INACTIVE_COLOR = "rgba(107,114,128,0.12)";
const INACTIVE_STROKE = "#9ca3af";

// Determine which zone labels are "active" based on permit records
function getActiveLabels(permits) {
  const active = new Set();
  permits.forEach(permit => {
    const type = (permit.permit_type || "").toLowerCase();
    const desc = (permit.permit_description || "").toLowerCase();

    Object.entries(LABEL_TO_PERMIT_TYPES).forEach(([label, types]) => {
      if (types.includes(type)) active.add(label);
    });

    Object.entries(LABEL_TO_KEYWORDS).forEach(([label, keywords]) => {
      if (keywords.some(kw => desc.includes(kw))) active.add(label);
    });
  });
  return active;
}

function OverlayCanvas({ view, activeLabels, onZoneClick }) {
  const containerRef = useRef(null);
  const [imgRect, setImgRect] = useState(null);
  const [hovered, setHovered] = useState(null);

  const dims = IMAGE_DIMS[view] || IMAGE_DIMS.front;
  const zones = VIEW_ZONES[view] || FRONT_ZONES;
  const imgSrc = IMAGES[view] || IMAGES.front;

  const computeRect = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const cw = el.clientWidth, ch = el.clientHeight;
    if (!cw || !ch) return;
    const imgAspect = dims.w / dims.h;
    const conAspect = cw / ch;
    let rw, rh, rx, ry;
    if (imgAspect > conAspect) {
      rw = cw; rh = cw / imgAspect; rx = 0; ry = (ch - rh) / 2;
    } else {
      rh = ch; rw = ch * imgAspect; rx = (cw - rw) / 2; ry = 0;
    }
    setImgRect({ x: rx, y: ry, w: rw, h: rh });
  }, [dims]);

  useEffect(() => {
    setImgRect(null);
    const t1 = setTimeout(computeRect, 50);
    const t2 = setTimeout(computeRect, 300);
    const ro = new ResizeObserver(computeRect);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener("resize", computeRect);
    return () => { clearTimeout(t1); clearTimeout(t2); ro.disconnect(); window.removeEventListener("resize", computeRect); };
  }, [view, computeRect]);

  const scalePoints = (pointsStr) => {
    if (!imgRect) return "";
    return pointsStr.trim().split(/\s+/).map(pair => {
      const [px, py] = pair.split(",").map(Number);
      return `${imgRect.x + (px / dims.w) * imgRect.w},${imgRect.y + (py / dims.h) * imgRect.h}`;
    }).join(" ");
  };

  const getBBoxCenter = (scaledPoints) => {
    const pairs = scaledPoints.trim().split(/\s+/).map(p => p.split(",").map(Number));
    const xs = pairs.map(p => p[0]), ys = pairs.map(p => p[1]);
    return { cx: (Math.min(...xs) + Math.max(...xs)) / 2, cy: Math.min(...ys) };
  };

  return (
    <div ref={containerRef} style={{ position: "absolute", inset: 0 }} className="bg-gray-900 overflow-hidden select-none">
      <AnimatePresence mode="wait">
        <motion.img key={view} src={imgSrc} alt={`Property ${view} view`}
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: "contain", objectPosition: "center" }}
          draggable={false}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }} onLoad={computeRect}
        />
      </AnimatePresence>

      {imgRect && (
        <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 2 }}>
          {zones.map(zone => {
            const isActive = activeLabels.has(zone.label);
            const isHovered = hovered === zone.id;
            const scaled = scalePoints(zone.points);
            const { cx, cy } = getBBoxCenter(scaled);

            return (
              <g key={zone.id} style={{ cursor: isActive ? "pointer" : "default" }}
                onClick={() => isActive && onZoneClick(zone.label)}
                onMouseEnter={() => setHovered(zone.id)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Hit area */}
                <polygon points={scaled} fill="transparent" stroke="transparent" strokeWidth={20} style={{ pointerEvents: "all" }} />
                {/* Glow ring (active zones only) */}
                {isActive && (
                  <polygon points={scaled} fill="transparent" stroke={ACTIVE_STROKE}
                    strokeWidth={isHovered ? 5 : 3.5} strokeOpacity={0.55}
                    style={{ filter: "blur(2px)", pointerEvents: "none" }}
                  />
                )}
                {/* Main fill */}
                <polygon points={scaled}
                  fill={isActive ? ACTIVE_COLOR : INACTIVE_COLOR}
                  stroke={isActive ? ACTIVE_STROKE : INACTIVE_STROKE}
                  strokeWidth={isActive ? (isHovered ? 2.5 : 2) : 1}
                  strokeDasharray={isActive ? "0" : "4,4"}
                  strokeOpacity={isActive ? 1 : 0.4}
                  style={{ transition: "all 0.15s", pointerEvents: "none" }}
                />
                {/* Label tooltip on hover */}
                {isActive && isHovered && (
                  <g style={{ pointerEvents: "none" }}>
                    <rect x={cx - 78} y={cy - 38} width={156} height={28} rx={6} ry={6} fill="rgba(0,0,0,0.85)" />
                    <text x={cx} y={cy - 19} textAnchor="middle" fill="#fbbf24" fontSize={12} fontWeight="700" style={{ userSelect: "none" }}>
                      {zone.label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      )}

      {/* Badge */}
      <div className="absolute top-2 left-2 z-10 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-lg shadow">
        Permit Activity Map
      </div>
    </div>
  );
}

export default function PropertyPermitOverlay({ permits }) {
  const [view, setView] = useState("front");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [clickedLabel, setClickedLabel] = useState(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const lastTouchDist = useRef(null);
  const isPanning = useRef(false);
  const panStart = useRef(null);

  const activeLabels = getActiveLabels(permits);
  const activeCount = activeLabels.size;

  // Get permits matching a clicked zone label
  const getPermitsForLabel = (label) => {
    const types = LABEL_TO_PERMIT_TYPES[label] || [];
    const keywords = LABEL_TO_KEYWORDS[label] || [];
    return permits.filter(p => {
      const type = (p.permit_type || "").toLowerCase();
      const desc = (p.permit_description || "").toLowerCase();
      return types.includes(type) || keywords.some(kw => desc.includes(kw));
    });
  };

  useEffect(() => { setScale(1); setOffset({ x: 0, y: 0 }); }, [view]);

  const zoomStyle = {
    transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
    transformOrigin: "center center",
    transition: isPanning.current ? "none" : "transform 0.1s ease-out",
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist.current = Math.sqrt(dx * dx + dy * dy);
    } else if (e.touches.length === 1 && scale > 1) {
      isPanning.current = true;
      panStart.current = { x: e.touches[0].clientX - offset.x, y: e.touches[0].clientY - offset.y };
    }
  };
  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && lastTouchDist.current) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDist = Math.sqrt(dx * dx + dy * dy);
      setScale(s => Math.min(Math.max(s * (newDist / lastTouchDist.current), 1), 4));
      lastTouchDist.current = newDist;
    } else if (e.touches.length === 1 && isPanning.current && panStart.current) {
      e.preventDefault();
      setOffset({ x: e.touches[0].clientX - panStart.current.x, y: e.touches[0].clientY - panStart.current.y });
    }
  };
  const handleTouchEnd = () => {
    lastTouchDist.current = null;
    isPanning.current = false;
    if (scale <= 1) setOffset({ x: 0, y: 0 });
  };

  if (permits.length === 0) return null;

  const clickedPermits = clickedLabel ? getPermitsForLabel(clickedLabel) : [];

  return (
    <div className="bg-white rounded-xl border border-amber-200 overflow-hidden mb-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-amber-50 border-b border-amber-100">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-600" />
          <span className="font-semibold text-gray-800 text-sm">Property Permit Activity Map</span>
          <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full font-semibold">
            {activeCount} zone{activeCount !== 1 ? "s" : ""} with permits
          </span>
        </div>
        {/* View switcher */}
        <div className="flex gap-1">
          {["front","back","eagle"].map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${view === v ? "bg-amber-500 text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-amber-300"}`}
            >
              {v === "eagle" ? "Top" : v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="relative"
        style={{ aspectRatio: "16/9" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div style={{ ...zoomStyle, position: "absolute", inset: 0 }}>
          <OverlayCanvas view={view} activeLabels={activeLabels} onZoneClick={(label) => setClickedLabel(prev => prev === label ? null : label)} />
        </div>

        {/* Zoom controls */}
        <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
          <button onClick={() => setScale(s => Math.min(s + 0.5, 4))}
            className="w-7 h-7 rounded-lg bg-black/50 text-white flex items-center justify-center">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => { setScale(s => { const n = Math.max(s - 0.5, 1); if (n <= 1) setOffset({ x: 0, y: 0 }); return n; }); }}
            className="w-7 h-7 rounded-lg bg-black/50 text-white flex items-center justify-center">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setIsFullscreen(true)}
            className="w-7 h-7 rounded-lg bg-black/50 text-white flex items-center justify-center">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Hint */}
        <div className="absolute bottom-2 right-3 text-white/70 text-xs pointer-events-none z-10">
          Tap a glowing zone to see its permits
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 border-t border-amber-100 flex flex-wrap gap-3">
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#f59e0b", opacity: 0.75 }} />
          Has permit history
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <div className="w-3 h-3 rounded-sm border border-gray-300 bg-gray-100" />
          No permit history
        </div>
        {activeCount === 0 && (
          <span className="text-xs text-gray-400 ml-auto">No zones matched — see permit list below</span>
        )}
      </div>

      {/* Clicked zone panel */}
      {clickedLabel && clickedPermits.length > 0 && (
        <div className="border-t border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-sm text-amber-800">{clickedLabel} — Permit Records</span>
            <button onClick={() => setClickedLabel(null)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            {clickedPermits.map(p => (
              <div key={p.id} className="bg-white rounded-lg border border-amber-200 px-3 py-2 text-xs">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-medium text-gray-800">{p.permit_description || p.permit_type?.replace(/_/g, " ")}</span>
                  <span className={`px-2 py-0.5 rounded-full font-semibold ${
                    p.status === "finaled" ? "bg-green-100 text-green-700" :
                    p.status === "issued" ? "bg-blue-100 text-blue-700" :
                    p.status === "expired" ? "bg-gray-100 text-gray-600" :
                    "bg-orange-100 text-orange-700"
                  }`}>{p.status?.replace(/_/g, " ")}</span>
                </div>
                <div className="flex gap-3 text-gray-500 mt-1 flex-wrap">
                  {p.issued_date && <span>Issued: {p.issued_date}</span>}
                  {p.finaled_date && <span>Finaled: {p.finaled_date}</span>}
                  {p.contractor_name && <span>By: {p.contractor_name}</span>}
                  {p.job_value && <span>Value: ${Number(p.job_value).toLocaleString()}</span>}
                  {p.permit_number && <span>#{p.permit_number}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fullscreen overlay */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div style={{ ...zoomStyle, position: "absolute", inset: 0 }}>
            <OverlayCanvas view={view} activeLabels={activeLabels} onZoneClick={(label) => setClickedLabel(prev => prev === label ? null : label)} />
          </div>
          <button onClick={() => setIsFullscreen(false)} className="absolute top-3 right-3 z-10 w-9 h-9 rounded-xl bg-black/60 text-white flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}