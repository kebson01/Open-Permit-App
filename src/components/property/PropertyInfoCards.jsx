import { Home, AreaChart, DollarSign, Calendar, AlertTriangle, Droplets, Shield } from "lucide-react";

const FLOOD_ZONE_INFO = {
  X: { label: "Zone X – Minimal Risk", color: "bg-green-100 text-green-800 border-green-300", icon: "✅" },
  B: { label: "Zone B – Moderate Risk", color: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: "⚠️" },
  C: { label: "Zone C – Moderate Risk", color: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: "⚠️" },
  A: { label: "Zone A – High Risk", color: "bg-red-100 text-red-800 border-red-300", icon: "🚨" },
  AE: { label: "Zone AE – High Risk (BFE set)", color: "bg-red-100 text-red-800 border-red-300", icon: "🚨" },
  AH: { label: "Zone AH – High Risk (shallow flood)", color: "bg-red-100 text-red-800 border-red-300", icon: "🚨" },
  VE: { label: "Zone VE – Coastal High Risk", color: "bg-red-100 text-red-800 border-red-300", icon: "🚨" },
};

function getFloodInfo(zone) {
  if (!zone) return null;
  const key = Object.keys(FLOOD_ZONE_INFO).find(k => zone.toUpperCase().startsWith(k));
  return key ? FLOOD_ZONE_INFO[key] : { label: `Zone ${zone}`, color: "bg-gray-100 text-gray-800 border-gray-300", icon: "ℹ️" };
}

function InfoCard({ icon: Icon, iconColor, label, value, sub }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex items-start gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconColor}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="font-semibold text-gray-800 text-sm leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function PropertyInfoCards({ data }) {
  const floodInfo = getFloodInfo(data.flood_zone);

  return (
    <div className="space-y-4">
      {/* Property Details */}
      <div>
        <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide mb-2">Property Details</h3>
        <div className="grid grid-cols-2 gap-2">
          <InfoCard icon={Home} iconColor="bg-blue-100 text-blue-600"
            label="Zoning District" value={data.zoning_district || "—"}
            sub={data.zoning_description} />
          <InfoCard icon={AreaChart} iconColor="bg-emerald-100 text-emerald-600"
            label="Lot Size" value={data.lot_size_sqft ? `${data.lot_size_sqft.toLocaleString()} sq ft` : "—"}
            sub={data.land_use} />
          <InfoCard icon={Calendar} iconColor="bg-purple-100 text-purple-600"
            label="Year Built" value={data.year_built || "—"}
            sub={data.building_sqft ? `${data.building_sqft.toLocaleString()} sq ft bldg` : null} />
          <InfoCard icon={DollarSign} iconColor="bg-amber-100 text-amber-600"
            label="Market Value" value={data.market_value ? `$${data.market_value.toLocaleString()}` : "—"}
            sub={data.folio ? `Folio: ${data.folio}` : null} />
        </div>
      </div>

      {/* Zoning Rules */}
      <div>
        <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide mb-2">Zoning Rules</h3>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 grid grid-cols-3 gap-3 text-center">
          {[
            { label: "Front Setback", value: `${data.setbacks?.front_ft ?? "—"} ft` },
            { label: "Rear Setback", value: `${data.setbacks?.rear_ft ?? "—"} ft` },
            { label: "Side Setback", value: `${data.setbacks?.side_ft ?? "—"} ft` },
            { label: "Max Height", value: data.max_height_ft ? `${data.max_height_ft} ft` : "—" },
            { label: "Max Coverage", value: data.max_lot_coverage_pct ? `${data.max_lot_coverage_pct}%` : "—" },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="font-bold text-gray-800">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Flood Zone */}
      {floodInfo && (
        <div>
          <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide mb-2">Flood Zone</h3>
          <div className={`rounded-xl border p-4 ${floodInfo.color}`}>
            <div className="flex items-center gap-2 font-bold text-base mb-1">
              <span className="text-xl">{floodInfo.icon}</span> {floodInfo.label}
            </div>
            <p className="text-sm">{data.flood_zone_description}</p>
            {data.flood_insurance_required && (
              <div className="mt-2 flex items-center gap-1.5 text-sm font-semibold">
                <Shield className="w-4 h-4" /> Flood Insurance Required
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}