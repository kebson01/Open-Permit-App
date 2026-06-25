import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Eye, EyeOff } from "lucide-react";

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
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
};

const bbox = (poly) => {
  const xs = poly.map((p) => p.x);
  const ys = poly.map((p) => p.y);
  return { minX: Math.min(...xs), minY: Math.min(...ys), cx: (Math.min(...xs) + Math.max(...xs)) / 2 };
};

/**
 * Draws AI-detected permit zones as interactive, shape-tracing highlights over
 * the user's own photo. Mirrors the HouseView interaction: outlines show by
 * default; tapping/hovering a zone reveals its fill, label, and detail.
 */
export default function PhotoZoneOverlay({ photo, zones = [], city }) {
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [showZones, setShowZones] = useState(true);
  const imgRef = useRef(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const measure = useCallback(() => {
    const el = imgRef.current;
    if (el && el.clientWidth) setSize({ w: el.clientWidth, h: el.clientHeight });
  }, []);

  useEffect(() => {
    measure();
    const el = imgRef.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  if (!photo) return null;

  const sel = selected !== null ? zones[selected] : null;

  return (
    <div className="space-y-3">
      <div className="relative w-full rounded-xl overflow-hidden bg-gray-900 select-none">
        <img
          ref={imgRef}
          src={photo}
          alt="Your property"
          className="block w-full max-h-80 object-contain"
          draggable={false}
          onLoad={measure}
        />

        {/* Pixel-accurate molded fill — used when a zone carries a SAM mask
            (data URL). Tints the exact object shape; polygons are the fallback. */}
        {zones.map((z, i) =>
          z.mask ? (
            <div
              key={`mask-${i}`}
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: colorFor(z.label),
                WebkitMaskImage: `url(${z.mask})`,
                maskImage: `url(${z.mask})`,
                WebkitMaskSize: "100% 100%",
                maskSize: "100% 100%",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                opacity: selected === i || hovered === i ? 0.55 : showZones ? 0.32 : 0,
                transition: "opacity 0.15s",
                pointerEvents: "none",
              }}
            />
          ) : null
        )}

        {size.w > 0 && (
          <svg
            className="absolute inset-0"
            width="100%"
            height="100%"
            viewBox={`0 0 ${size.w} ${size.h}`}
            preserveAspectRatio="none"
            style={{ pointerEvents: "none" }}
          >
            {zones.map((z, i) => {
              const color = colorFor(z.label);
              const isActive = selected === i || hovered === i;
              const visible = showZones || isActive;
              const pts = z.polygon.map((p) => `${p.x * size.w},${p.y * size.h}`).join(" ");
              return (
                <g key={i} style={{ pointerEvents: "auto", cursor: "pointer" }}>
                  {/* Wide invisible hit area */}
                  <polygon points={pts} fill="transparent" stroke="transparent" strokeWidth={14} />
                  <polygon
                    points={pts}
                    fill={z.mask ? "transparent" : isActive ? hexToRgba(color, 0.3) : visible ? hexToRgba(color, 0.08) : "transparent"}
                    stroke={z.mask ? "transparent" : visible ? color : "transparent"}
                    strokeWidth={isActive ? 3 : 2}
                    strokeDasharray={isActive ? "0" : "6,4"}
                    strokeLinejoin="round"
                    style={{ transition: "fill 0.15s, stroke 0.15s" }}
                    onClick={() => setSelected(selected === i ? null : i)}
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
                  />
                </g>
              );
            })}
          </svg>
        )}

        {/* Labels (HTML, crisp) only for the active zone to avoid clutter */}
        {size.w > 0 &&
          zones.map((z, i) => {
            const isActive = selected === i || hovered === i;
            if (!isActive) return null;
            const { minX, minY, cx } = bbox(z.polygon);
            const color = colorFor(z.label);
            return (
              <span
                key={`lbl-${i}`}
                className="absolute z-10 -translate-x-1/2 whitespace-nowrap text-[11px] font-semibold text-white px-2 py-0.5 rounded shadow pointer-events-none"
                style={{
                  left: `${cx * 100}%`,
                  top: `${minY * 100}%`,
                  transform: "translate(-50%, -120%)",
                  background: color,
                }}
              >
                {z.label}
              </span>
            );
          })}

        {/* Toggle + hint */}
        {zones.length > 0 && (
          <>
            <button
              onClick={() => setShowZones((s) => !s)}
              className="absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 bg-black/55 backdrop-blur-sm rounded-lg text-white text-xs font-medium z-10"
            >
              {showZones ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {showZones ? "Hide" : "Show"}
            </button>
            <div className="absolute bottom-2 left-3 text-white/70 text-[11px] pointer-events-none">
              Tap a highlighted area for details
            </div>
          </>
        )}
      </div>

      {zones.length === 0 ? (
        <p className="text-xs text-gray-400 text-center">No permit zones were detected in this photo.</p>
      ) : (
        <p className="text-[11px] text-gray-400 text-center">
          {zones.length} permit zone{zones.length === 1 ? "" : "s"} detected — tap any highlight to learn more
        </p>
      )}

      {/* Selected zone detail */}
      {sel && (
        <div
          className={`rounded-xl p-3 border ${sel.permit_required ? "border-red-200 bg-red-50/60" : "border-green-200 bg-green-50/60"}`}
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: colorFor(sel.label) }} />
              <p className="text-sm font-bold text-gray-900 truncate">{sel.label}</p>
            </div>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                sel.permit_required ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
              }`}
            >
              {sel.permit_required ? "Permit Required" : "No Permit Needed"}
            </span>
          </div>
          {sel.note && <p className="text-xs text-gray-600">{sel.note}</p>}
          {sel.permit_required && (
            <Link
              to={`/ApplyForPermit?permit=${encodeURIComponent(sel.label)}&city=${encodeURIComponent(city || "")}`}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-1.5 rounded-lg no-underline hover:opacity-90 transition-opacity"
              style={{ background: "#003466" }}
            >
              Start this Permit <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
