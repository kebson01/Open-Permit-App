import { MapPin, Home, ChevronRight } from "lucide-react";

export default function PropertyCard({ property: p, onClick }) {
  const address = p.full_address || p.FOLIO_NUMBER;
  const city = p.city_name || "";
  const zip = p.SITUS_ZIP_CODE || p.zip_code || "";
  const yearBuilt = p.BLDG_YEAR_BUILT || p.year_built;
  const beds = p.BEDS || p.beds;
  const baths = p.BATHS || p.baths;
  const underAir = p.BLDG_UNDER_AIR_SQ_FOOTAGE || p.under_air_sq_footage;

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
            {city}{zip ? `, FL ${zip}` : city ? ", FL" : ""}
          </p>
          <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
            {p.USE_TYPE && <span className="bg-gray-100 px-2 py-0.5 rounded-full">{p.USE_TYPE}</span>}
            {yearBuilt && <span className="bg-gray-100 px-2 py-0.5 rounded-full">Built {yearBuilt}</span>}
            {beds && <span className="bg-gray-100 px-2 py-0.5 rounded-full">{beds} bd / {baths || "?"} ba</span>}
            {underAir && <span className="bg-gray-100 px-2 py-0.5 rounded-full">{Number(underAir).toLocaleString()} sqft</span>}
          </div>
          <p className="text-xs text-gray-400 mt-1 font-mono">Folio: {p.FOLIO_NUMBER}</p>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400 shrink-0 mt-1" />
    </button>
  );
}