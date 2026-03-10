import { useState } from "react";

export default function LotVisualization({ data }) {
  const [hoveredZone, setHoveredZone] = useState(null);

  const { setbacks = {}, flood_zone, flood_insurance_required } = data;
  const front = setbacks.front_ft || 25;
  const rear = setbacks.rear_ft || 20;
  const side = setbacks.side_ft || 10;

  // SVG canvas dimensions
  const W = 500;
  const H = 400;

  // Lot area inside street (leave margins for labels)
  const lotLeft = 70;
  const lotTop = 30;
  const lotRight = W - 30;
  const lotBottom = H - 50;
  const lotW = lotRight - lotLeft;
  const lotH = lotBottom - lotTop;

  // Scale setbacks proportionally (assume 100ft lot depth, 80ft wide)
  const scale = Math.min(lotW / 80, lotH / 100);
  const frontPx = front * scale;
  const rearPx = rear * scale;
  const sidePx = side * scale;

  // Buildable area inside setbacks
  const bLeft = lotLeft + sidePx;
  const bTop = lotTop + rearPx;
  const bRight = lotRight - sidePx;
  const bBottom = lotBottom - frontPx;
  const bW = bRight - bLeft;
  const bH = bBottom - bTop;

  const isFloodHigh = flood_zone && (flood_zone.startsWith("A") || flood_zone.startsWith("V"));

  const zones = [
    {
      id: "street",
      x: 0, y: lotBottom, w: W, h: H - lotBottom,
      fill: "#94a3b8", label: "Street"
    },
    {
      id: "front_setback",
      x: lotLeft, y: bBottom, w: lotW, h: frontPx,
      fill: "#fde68a", stroke: "#d97706", label: `Front Setback: ${front} ft`
    },
    {
      id: "rear_setback",
      x: lotLeft, y: lotTop, w: lotW, h: rearPx,
      fill: "#fde68a", stroke: "#d97706", label: `Rear Setback: ${rear} ft`
    },
    {
      id: "left_setback",
      x: lotLeft, y: lotTop + rearPx, w: sidePx, h: bH,
      fill: "#fde68a", stroke: "#d97706", label: `Side: ${side} ft`
    },
    {
      id: "right_setback",
      x: bRight, y: lotTop + rearPx, w: sidePx, h: bH,
      fill: "#fde68a", stroke: "#d97706", label: `Side: ${side} ft`
    },
    {
      id: "buildable",
      x: bLeft, y: bTop, w: bW, h: bH,
      fill: "#bbf7d0", stroke: "#16a34a", label: "✅ Buildable Zone"
    },
  ];

  if (isFloodHigh) {
    zones.push({
      id: "flood",
      x: lotLeft + lotW * 0.6, y: lotTop, w: lotW * 0.4, h: lotH,
      fill: "rgba(59,130,246,0.3)", stroke: "#3b82f6", label: `Flood Zone ${flood_zone}`
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-800">Lot Visualization</h3>
        <span className="text-xs text-gray-400 italic">Diagram is illustrative</span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-xl border border-gray-100 bg-[#e8f5e9]">
        {/* Background grass */}
        <rect x={lotLeft} y={lotTop} width={lotW} height={lotH} fill="#c8e6c9" rx="4" />

        {/* Zones */}
        {zones.map((z) => (
          <g key={z.id}>
            <rect
              x={z.x} y={z.y} width={z.w} height={z.h}
              fill={z.fill} stroke={z.stroke || "none"} strokeWidth="1.5" strokeDasharray={z.stroke ? "5,3" : "0"}
              opacity={hoveredZone === z.id ? 0.9 : 0.75}
              className="cursor-pointer transition-opacity"
              onMouseEnter={() => setHoveredZone(z.id)}
              onMouseLeave={() => setHoveredZone(null)}
            />
          </g>
        ))}

        {/* House */}
        <g transform={`translate(${bLeft + bW * 0.25}, ${bTop + bH * 0.2})`}>
          {/* House body */}
          <rect x="0" y="30" width="80" height="60" fill="#ef8c34" rx="2" />
          {/* Roof */}
          <polygon points="40,0 -5,35 85,35" fill="#c0392b" />
          {/* Door */}
          <rect x="30" y="65" width="20" height="25" fill="#8B4513" rx="2" />
          {/* Window */}
          <rect x="8" y="40" width="20" height="20" fill="#87CEEB" rx="1" />
          <rect x="52" y="40" width="20" height="20" fill="#87CEEB" rx="1" />
          {/* Label */}
          <text x="40" y="105" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#1a1a1a">
            {data.land_use?.includes("CONDO") ? "Condo" : "Your Lot"}
          </text>
        </g>

        {/* Trees */}
        {[[lotLeft + 12, lotTop + 20], [lotLeft + 12, lotTop + 70], [lotLeft + 12, lotTop + 120]].map(([tx, ty], i) => (
          <g key={i} transform={`translate(${tx}, ${ty})`}>
            <circle cx="0" cy="-10" r="12" fill="#2d6a2d" />
            <rect x="-3" y="0" width="6" height="14" fill="#6b3a2a" />
          </g>
        ))}

        {/* Pool (right side of buildable area) */}
        <ellipse
          cx={bLeft + bW * 0.78} cy={bTop + bH * 0.55}
          rx="22" ry="15"
          fill="#7dd3fc" stroke="#0369a1" strokeWidth="1.5"
        />
        <text x={bLeft + bW * 0.78} y={bTop + bH * 0.55 + 4} textAnchor="middle" fontSize="8" fill="#0369a1" fontWeight="bold">POOL</text>

        {/* Setback labels */}
        <text x={lotLeft + lotW / 2} y={bBottom + frontPx / 2 + 5} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#92400e">
          FRONT SETBACK: {front} ft
        </text>
        <text x={lotLeft + lotW / 2} y={lotTop + rearPx / 2 + 5} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#92400e">
          REAR SETBACK: {rear} ft
        </text>
        <text
          x={bLeft - sidePx / 2} y={bTop + bH / 2}
          textAnchor="middle" fontSize="9" fontWeight="bold" fill="#92400e"
          transform={`rotate(-90, ${bLeft - sidePx / 2}, ${bTop + bH / 2})`}
        >
          SIDE: {side} ft
        </text>

        {/* Flood zone badge */}
        {isFloodHigh && (
          <g transform={`translate(${lotLeft + lotW * 0.62}, ${lotTop + 8})`}>
            <rect x="0" y="0" width="80" height="22" rx="4" fill="#1d4ed8" />
            <text x="40" y="15" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">
              FLOOD ZONE {flood_zone}
            </text>
          </g>
        )}

        {/* Street label */}
        <text x={W / 2} y={lotBottom + (H - lotBottom) / 2 + 5} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#475569">
          STREET / RIGHT OF WAY
        </text>

        {/* Easement strip */}
        <rect x={lotLeft} y={bBottom - 2} width={sidePx * 1.5} height="8" fill="#fbbf24" opacity="0.6" />
        <text x={lotLeft + sidePx * 0.75} y={bBottom + 8} textAnchor="middle" fontSize="8" fill="#78350f">Easement</text>

        {/* Tooltip */}
        {hoveredZone && (
          <g>
            <rect x={W / 2 - 90} y={H - 28} width="180" height="22" rx="4" fill="#1e293b" />
            <text x={W / 2} y={H - 13} textAnchor="middle" fontSize="11" fill="white">
              {zones.find(z => z.id === hoveredZone)?.label}
            </text>
          </g>
        )}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3">
        {[
          { color: "bg-green-200 border-green-600", label: "Buildable Area" },
          { color: "bg-yellow-100 border-yellow-500", label: "Setbacks (no structures)" },
          { color: "bg-blue-200 border-blue-500", label: "Flood Zone" },
          { color: "bg-yellow-400 border-yellow-700", label: "Easement" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs text-gray-600">
            <div className={`w-4 h-4 rounded border ${color}`} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}