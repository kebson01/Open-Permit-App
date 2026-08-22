import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Plus, X, Loader2 } from "lucide-react";

// Colors mirror the static HouseView diagram so detected items feel consistent.
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
  "Flooring": "#a16207",
  "Ceiling / Drywall": "#94a3b8",
  "Recessed Lighting": "#eab308",
  "Kitchen Cabinets": "#84cc16",
  "Countertop": "#10b981",
  "Appliance Install": "#0ea5e9",
  "Water Heater": "#f43f5e",
  "HVAC / Ductwork": "#0ea5e9",
  "Bathroom Remodel": "#f59e0b",
};

const isPermitCategory = (label) => Object.prototype.hasOwnProperty.call(ZONE_COLORS, label);
const colorFor = (label) => ZONE_COLORS[label] || "#9ca3af";
const hexToRgba = (hex, a) => {
  const h = hex.replace("#", "");
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
};
const clamp01 = (n) => Math.min(1, Math.max(0, n));

/**
 * Two features over the user's photo:
 *  1) Auto markers — a glowing ball on each AI-detected item, with permit info.
 *  2) Edit mode — add a marker and drag it onto any area; on release we call
 *     onIdentifyArea(point) to tell the user what's there and if it needs a permit.
 */
export default function PhotoZoneOverlay({ photo, zones = [], city, onIdentifyArea }) {
  const [markers, setMarkers] = useState([]);
  const [hover, setHover] = useState(null);
  const [pinned, setPinned] = useState(null);
  const boxRef = useRef(null);
  const drag = useRef({ id: null, dragged: false, point: null });
  const nextId = useRef(0);

  // Seed markers from the AI auto-detection whenever it changes.
  useEffect(() => {
    setMarkers(
      zones.map((z, i) => ({
        id: `ai-${i}`,
        source: "ai",
        point: z.point || { x: 0.5, y: 0.5 },
        item_name: z.item_name || z.label,
        label: z.label,
        permit_required: !!z.permit_required,
        note: z.note || "",
        status: "ready",
      })),
    );
  }, [zones]);

  if (!photo) return null;

  const shown = hover ?? pinned;
  const shownMarker = markers.find((m) => m.id === shown) || null;

  const toNorm = (clientX, clientY) => {
    const r = boxRef.current.getBoundingClientRect();
    return { x: clamp01((clientX - r.left) / r.width), y: clamp01((clientY - r.top) / r.height) };
  };

  const queryArea = async (id, point) => {
    if (!onIdentifyArea) return;
    setPinned(id);
    setMarkers((ms) => ms.map((m) => (m.id === id ? { ...m, status: "loading" } : m)));
    try {
      const info = await onIdentifyArea(point);
      setMarkers((ms) => ms.map((m) => (m.id === id ? { ...m, ...info, status: "ready" } : m)));
    } catch {
      setMarkers((ms) => ms.map((m) => (m.id === id ? { ...m, status: "ready", note: "Couldn't identify this area — try moving the marker." } : m)));
    }
  };

  const onDown = (e, id) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { id, dragged: false, point: null };
  };
  const onMove = (e, id) => {
    if (drag.current.id !== id || e.buttons === 0) return;
    drag.current.dragged = true;
    const p = toNorm(e.clientX, e.clientY);
    drag.current.point = p;
    setMarkers((ms) => ms.map((m) => (m.id === id ? { ...m, point: p } : m)));
  };
  const onUp = (id) => {
    if (drag.current.id !== id) return;
    const { dragged, point } = drag.current;
    drag.current = { id: null, dragged: false, point: null };
    if (!dragged) {
      setPinned((p) => (p === id ? null : id)); // tap toggles popover
    } else if (point) {
      queryArea(id, point); // dropped on a new area → identify it
    }
  };

  const addMarker = () => {
    const id = `u-${nextId.current++}`;
    setMarkers((ms) => [
      ...ms,
      { id, source: "user", point: { x: 0.5, y: 0.5 }, item_name: "New marker", label: "Other", permit_required: false, note: "", status: "pending" },
    ]);
    setPinned(id);
  };

  const removeMarker = (id) => {
    setMarkers((ms) => ms.filter((m) => m.id !== id));
    setPinned(null);
  };

  return (
    <div className="space-y-3">
      <div className="relative w-full select-none">
        <div ref={boxRef} className="relative w-full rounded-xl overflow-hidden bg-gray-900">
          <img src={photo} alt="Your property" className="block w-full" draggable={false} />

          {markers.map((m) => {
            const color = m.status === "pending" ? "#9ca3af" : colorFor(m.label);
            const isActive = shown === m.id;
            return (
              <button
                key={m.id}
                type="button"
                aria-label={`${m.item_name} (drag to reposition)`}
                onPointerDown={(e) => onDown(e, m.id)}
                onPointerMove={(e) => onMove(e, m.id)}
                onPointerUp={() => onUp(m.id)}
                onMouseEnter={() => setHover(m.id)}
                onMouseLeave={() => setHover((h) => (h === m.id ? null : h))}
                className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center touch-none"
                style={{ left: `${m.point.x * 100}%`, top: `${m.point.y * 100}%`, zIndex: isActive ? 15 : 10, cursor: "grab" }}
              >
                <span className="relative block w-4 h-4">
                  <span className="absolute inset-0 rounded-full animate-ping" style={{ background: hexToRgba(color, 0.55) }} />
                  <span
                    className="absolute inset-0 rounded-full border-2 border-white flex items-center justify-center"
                    style={{
                      background: color,
                      boxShadow: `0 0 12px 3px ${hexToRgba(color, isActive ? 0.95 : 0.8)}`,
                      transform: isActive ? "scale(1.25)" : "scale(1)",
                      transition: "transform 0.15s",
                    }}
                  >
                    {m.status === "loading" && <Loader2 className="w-2.5 h-2.5 text-white animate-spin" />}
                  </span>
                </span>
              </button>
            );
          })}

          {/* Edit affordance */}
          <button
            onClick={addMarker}
            className="absolute top-2 right-2 z-20 flex items-center gap-1 px-2.5 py-1.5 bg-black/55 backdrop-blur-sm rounded-lg text-white text-xs font-medium hover:bg-black/70"
          >
            <Plus className="w-3.5 h-3.5" /> Add marker
          </button>

          <div className="absolute bottom-2 left-3 text-white/80 text-[11px] pointer-events-none drop-shadow">
            Tap a marker for details · drag onto any area to check it
          </div>
        </div>

        {/* Popover — sibling of the clipped box so it is never cut off */}
        {shownMarker && (() => {
          const m = shownMarker;
          const color = m.status === "pending" ? "#9ca3af" : colorFor(m.label);
          const below = m.point.y < 0.34;
          const leftPct = Math.min(82, Math.max(18, m.point.x * 100));
          return (
            <div
              className="absolute z-20 w-64 rounded-xl bg-white shadow-xl border border-gray-200 p-3"
              style={{ left: `${leftPct}%`, top: `${m.point.y * 100}%`, transform: `translate(-50%, ${below ? "16px" : "calc(-100% - 16px)"})` }}
              onMouseEnter={() => setHover(m.id)}
              onMouseLeave={() => setHover((h) => (h === m.id ? null : h))}
            >
              {m.status === "pending" ? (
                <p className="text-xs text-gray-600 leading-snug">
                  <span className="font-semibold text-gray-800">Drag this marker</span> onto any item in the photo and release — we'll tell you if it needs a permit.
                </p>
              ) : m.status === "loading" ? (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> Checking this area…
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-x-2 gap-y-1 mb-1 flex-wrap">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
                    <p className="text-sm font-bold text-gray-900">{m.item_name}</p>
                    <span
                      className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                        m.permit_required ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                      }`}
                    >
                      {m.permit_required ? "Permit Required" : "No Permit"}
                    </span>
                  </div>
                  {m.note && <p className="text-xs text-gray-600 leading-snug">{m.note}</p>}
                  {m.permit_required && isPermitCategory(m.label) && (
                    <Link
                      to={`/PermitInfo?permit=${encodeURIComponent(m.label)}&city=${encodeURIComponent(city || "")}`}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-1.5 rounded-lg no-underline hover:opacity-90 transition-opacity"
                      style={{ background: "#003466" }}
                    >
                      See Requirements <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </>
              )}
              {m.source === "user" && (
                <button onClick={() => removeMarker(m.id)} className="mt-2 ml-2 inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-red-500 align-middle">
                  <X className="w-3 h-3" /> remove
                </button>
              )}
            </div>
          );
        })()}
      </div>

      <p className="text-[11px] text-gray-400 text-center">
        {markers.length} marker{markers.length === 1 ? "" : "s"} — tap for details, drag onto an area to check it, or “Add marker” to check any spot
      </p>
    </div>
  );
}
