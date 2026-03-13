import { MapPin, Home, User, ChevronRight } from "lucide-react";

function formatAddress(p) {
  const parts = [
    p.SITUS_STREET_NUMBER,
    p.SITUS_STREET_DIRECTION,
    p.SITUS_STREET_NAME,
    p.SITUS_STREET_TYPE,
    p.SITUS_UNIT_NUMBER ? `Unit ${p.SITUS_UNIT_NUMBER}` : null,
  ].filter(Boolean);
  return parts.join(" ");
}

export default function PropertyCard({ property: p, onClick }) {
  const address = formatAddress(p);
  const city = p.SITUS_CITY || "";
  const totalValue = (p.JUST_LAND_VALUE || 0) + (p.JUST_BUILDING_VALUE || 0) + (p.JUST_OTHER_VALUE || 0);

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-blue-300 transition-all flex items-start justify-between gap-4"
    >
      <div className="flex gap-4 items-start">
        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
          <Home className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-base">{address}</p>
          <p className="text-gray-500 text-sm flex items-center gap-1 mt-0.5">
            <MapPin className="w-3.5 h-3.5" />
            {city}{p.SITUS_ZIP_CODE ? `, FL ${p.SITUS_ZIP_CODE}` : ", FL"}
          </p>
          <div className="flex gap-4 mt-2 text-xs text-gray-500">
            {p.NAME_LINE_1 && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" /> {p.NAME_LINE_1}
              </span>
            )}
            {totalValue > 0 && (
              <span className="font-medium text-green-700">
                ${totalValue.toLocaleString()} just value
              </span>
            )}
            {p.USE_TYPE && <span className="bg-gray-100 px-2 py-0.5 rounded-full">{p.USE_TYPE}</span>}
          </div>
          <p className="text-xs text-gray-400 mt-1">Folio: {p.FOLIO_NUMBER}</p>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400 shrink-0 mt-1" />
    </button>
  );
}