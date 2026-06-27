import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

// Colors mirror the static HouseView diagram so detected zones feel consistent.
const ZONE_COLORS = {
  "Roof / Re-Roof": "#ef4444",
  "Solar Panels": "#eab308",
  "Window Replacement": "#3b82f6",
  "Door Replacement": "#8b5cf6",
  "Garage Door": "#f97316",
  "A/C Replacement": "#0ea5e9",
  "Electrical Service": "#eab308",
  "Pool & Spa": "#06b6d4",
  "Pool Equipment": "#f97316",
  "Driveway / Walkway": "#6b7280",
  "Walkway / Sidewalk": "#9ca3af",
  "Fence / Gate": "#22c55e",
  "Patio / Slab": "#f59e0b",
  "Covered Patio": "#6b7280",
  "Pergola": "#d97706",
  "Residential Remodel": "#f59e0b",
  "Residential Addition": "#6366f1",
  "Plumbing": "#06b6d4",
};

const colorFor = (label) => ZONE_COLORS[label] || "#3b82f6";
const hexToRgba = (hex, a) => {
  const h = hex.replace("#", "");
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
};

const centroid = (polygon = []) => {
  if (!polygon.length) return { x: 0.5, y: 0.5 };
  const xs = polygon.map((p) => p.x);
  const ys = polygon.map((p) => p.y);
  return { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
};
const aiPoint = (z) => (z.point && z.point.x != null ? z.point : centroid(z.polygon || []));
const clamp01 = (n) => Math.min(1, Math.max(0, n));

/**
 * Places a glowing marker on each AI-detected feature in the user's photo.
 * Hovering or tapping a marker reveals its permit info; dragging a marker
 * repositions it (the AI's placement is only an estimate).
 */
export default function PhotoZoneOverlay({ photo, zones = [], city }) {
  const [hover, setHover] = useState(null);
  const [pinned, setPinned] = useState(null);
  const [moved, setMoved] = useState({}); // index -> {x,y} user override
  const boxRef = useRef(null);
  const drag = useRef({ i: null, dragged: false });

  if (!photo) return null;

  const shown = hover !== null ? hover : pinned;
  const posOf = (z, i) => moved[i] || aiPoint(z);

  const toNorm = (clientX, clientY) => {
    const r = boxRef.current.getBoundingClientRect();
    return { x: clamp01((clientX - r.left) / r.width), y: clamp01((clientY - r.top) / r.height) };
  };

  const onDown = (e, i) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { i, dragged: false };
  };
  const onMove = (e, i) => {
    if (drag.current.i !== i || e.buttons === 0) return;
    drag.current.dragged = true;
    const p = toNorm(e.clientX, e.clientY);
    setMoved((m) => ({ ...m, [i]: p }));
  };
  const onUp = (i) => {
    if (drag.current.i !== i) return;
    const wasDrag = drag.current.dragged;
    drag.current = { i: null, dragged: false };
    if (!wasDrag) setPinned((p) => (p === i ? null : i)); // a tap, not a drag
  };

  return (
    <div className="space-y-3">
      {/* Outer wrapper is NOT clipped, so the popover can extend past the photo */}
      <div className="relative w-full select-none">
        <div ref={boxRef} className="relative w-full rounded-xl overflow-hidden bg-gray-900">
          <img src={photo} alt="Your property" className="block w-full" draggable={false} />

          {/* Glowing, draggable markers */}
          {zones.map((z, i) => {
            const c = posOf(z, i);
            const color = colorFor(z.label);
            const isActive = shown === i;
            return (
              <button
                key={i}
                type="button"
                aria-label={`${z.label} (drag to reposition)`}
                onPointerDown={(e) => onDown(e, i)}
                onPointerMove={(e) => onMove(e, i)}
                onPointerUp={() => onUp(i)}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover((h) => (h === i ? null : h))}
                className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center touch-none"
                style={{ left: `${c.x * 100}%`, top: `${c.y * 100}%`, zIndex: isActive ? 15 : 10, cursor: "grab" }}
              >
                <span className="relative block w-4 h-4">
                  <span className="absolute inset-0 rounded-full animate-ping" style={{ background: hexToRgba(color, 0.55) }} />
                  <span
                    className="absolute inset-0 rounded-full border-2 border-white"
                    style={{
                      background: color,
                      boxShadow: `0 0 12px 3px ${hexToRgba(color, isActive ? 0.95 : 0.8)}`,
                      transform: isActive ? "scale(1.25)" : "scale(1)",
                      transition: "transform 0.15s",
                    }}
                  />
                </span>
              </button>
            );
          })}

          {zones.length > 0 && (
            <div className="absolute bottom-2 left-3 text-white/80 text-[11px] pointer-events-none drop-shadow">
              Tap a marker for details · drag to reposition
            </div>
          )}
        </div>

        {/* Popover — sibling of the clipped box, so it is never cut off */}
        {shown !== null && zones[shown] && (() => {
          const z = zones[shown];
          const c = posOf(z, shown);
          const below = c.y < 0.32;
          const leftPct = Math.min(82, Math.max(18, c.x * 100));
          return (
            <div
              className="absolute z-20 w-64 rounded-xl bg-white shadow-xl border border-gray-200 p-3"
              style={{ left: `${leftPct}%`, top: `${c.y * 100}%`, transform: `translate(-50%, ${below ? "16px" : "calc(-100% - 16px)"})` }}
              onMouseEnter={() => setHover(shown)}
              onMouseLeave={() => setHover((h) => (h === shown ? null : h))}
            >
              <div className="flex items-center gap-x-2 gap-y-1 mb-1 flex-wrap">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: colorFor(z.label) }} />
                <p className="text-sm font-bold text-gray-900">{z.label}</p>
                <span
                  className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                    z.permit_required ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                  }`}
                >
                  {z.permit_required ? "Permit Required" : "No Permit"}
                </span>
              </div>
              {z.note && <p className="text-xs text-gray-600 leading-snug">{z.note}</p>}
              {z.permit_required && (
                <Link
                  to={`/ApplyForPermit?permit=${encodeURIComponent(z.label)}&city=${encodeURIComponent(city || "")}`}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-1.5 rounded-lg no-underline hover:opacity-90 transition-opacity"
                  style={{ background: "#003466" }}
                >
                  Start this Permit <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          );
        })()}
      </div>

      {zones.length === 0 ? (
        <p className="text-xs text-gray-400 text-center">No permit zones were detected in this photo.</p>
      ) : (
        <p className="text-[11px] text-gray-400 text-center">
          {zones.length} permit item{zones.length === 1 ? "" : "s"} detected — tap a marker to learn more, drag to reposition
        </p>
      )}
    </div>
  );
}
