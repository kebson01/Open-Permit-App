import React, { useState } from "react";
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

/**
 * Draws AI-detected permit zones as interactive highlights over the user's own
 * photo. Mirrors the HouseView tap-to-reveal interaction: tap a box to see the
 * permit detail and jump straight into the application.
 */
export default function PhotoZoneOverlay({ photo, zones = [], city }) {
  const [selected, setSelected] = useState(null);
  const [showZones, setShowZones] = useState(true);

  if (!photo) return null;

  const sel = selected !== null ? zones[selected] : null;

  return (
    <div className="space-y-3">
      <div className="relative w-full rounded-xl overflow-hidden bg-gray-900 select-none">
        <img src={photo} alt="Your property" className="w-full max-h-80 object-contain" draggable={false} />

        {zones.map((z, i) => {
          const color = colorFor(z.label);
          const isActive = selected === i;
          const visible = showZones || isActive;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setSelected(isActive ? null : i)}
              className="absolute rounded-md transition-all"
              style={{
                left: `${z.box.x * 100}%`,
                top: `${z.box.y * 100}%`,
                width: `${z.box.w * 100}%`,
                height: `${z.box.h * 100}%`,
                border: `2px solid ${visible ? color : "transparent"}`,
                background: isActive ? hexToRgba(color, 0.28) : visible ? hexToRgba(color, 0.14) : "transparent",
                boxShadow: isActive ? `0 0 0 2px ${hexToRgba(color, 0.5)}` : "none",
              }}
            >
              {visible && (
                <span
                  className="absolute -top-6 left-0 whitespace-nowrap text-[10px] font-semibold text-white px-1.5 py-0.5 rounded shadow"
                  style={{ background: color }}
                >
                  {z.label}
                </span>
              )}
            </button>
          );
        })}

        {/* Toggle + hint */}
        {zones.length > 0 && (
          <>
            <button
              onClick={() => setShowZones((s) => !s)}
              className="absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 bg-black/55 backdrop-blur-sm rounded-lg text-white text-xs font-medium"
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
