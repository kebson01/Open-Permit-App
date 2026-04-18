import { useState, useEffect } from "react";
import { ArrowLeft, MapPin, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import PropertyCityPanel from "@/components/property/PropertyCityPanel";
import PropertyAIChat from "@/components/property/PropertyAIChat";
import PropertyPermitHistory from "@/components/property/PropertyPermitHistory";
import PropertyPermitOverlay from "@/components/property/PropertyPermitOverlay";

function Row({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right max-w-[60%]">{value}</span>
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
          <Icon className="w-4 h-4 text-blue-600" />
        </div>
        <h3 className="font-semibold text-gray-800">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function PropertyDetail({ property: p, onBack }) {
  const [permits, setPermits] = useState([]);

  useEffect(() => {
    if (!p?.FOLIO_NUMBER) return;
    base44.entities.PermitRecord.filter({ folio_number: p.FOLIO_NUMBER }, "-issued_date", 200)
      .then(setPermits)
      .catch(() => {});
  }, [p?.FOLIO_NUMBER]);

  const address = [
    p.SITUS_STREET_NUMBER,
    p.SITUS_STREET_DIRECTION,
    p.SITUS_STREET_NAME,
    p.SITUS_STREET_TYPE,
    p.SITUS_UNIT_NUMBER ? `Unit ${p.SITUS_UNIT_NUMBER}` : null,
  ].filter(Boolean).join(" ");

  return (
    <div>
      <Button variant="ghost" onClick={onBack} className="mb-4 -ml-2 text-gray-600">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to results
      </Button>

      {/* Title */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{address}</h2>
        <p className="text-gray-500 flex items-center gap-1 mt-1">
          <MapPin className="w-4 h-4" />
          {p.SITUS_CITY}, FL {p.SITUS_ZIP_CODE}
        </p>
        <p className="text-xs text-gray-400 mt-1 font-mono">Folio: {p.FOLIO_NUMBER}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Property Info */}
        <Section title="Property Details" icon={Home}>
          <Row label="Use Type" value={p.USE_TYPE} />
          <Row label="Year Built" value={p.BLDG_YEAR_BUILT || p.ACTUAL_YEAR_BUILT} />
          <Row label="Bedrooms / Baths" value={p.BEDS || p.BATHS ? `${p.BEDS || "—"} bd / ${p.BATHS || "—"} ba` : null} />
          <Row label="Under Air Sq Ft" value={p.BLDG_UNDER_AIR_SQ_FOOTAGE?.toLocaleString()} />
          <Row label="Total Sq Ft" value={p.BLDG_TOT_SQ_FOOTAGE?.toLocaleString()} />
        </Section>
      </div>

      <PropertyPermitOverlay permits={permits} />
      <PropertyPermitHistory folio_number={p.FOLIO_NUMBER} city_name={p.SITUS_CITY} />
      <PropertyCityPanel property={p} />
      <PropertyAIChat property={p} permits={permits} />
    </div>
  );
}