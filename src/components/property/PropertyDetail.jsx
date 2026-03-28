import { useState, useEffect } from "react";
import { ArrowLeft, MapPin, User, DollarSign, Home, Calendar, Building2 } from "lucide-react";
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

function fmt(n) {
  if (!n && n !== 0) return null;
  return `$${Number(n).toLocaleString()}`;
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

  const legalDesc = [p.LEGAL_LINE_1, p.LEGAL_LINE_2, p.LEGAL_LINE_3, p.LEGAL_LINE_4]
    .filter(Boolean).join(" ");

  const totalJust = (p.JUST_LAND_VALUE || 0) + (p.JUST_BUILDING_VALUE || 0) + (p.JUST_OTHER_VALUE || 0);

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
        <p className="text-xs text-gray-400 mt-1">Folio: {p.FOLIO_NUMBER} · Millage: {p.MILLAGE_CODE}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Owner */}
        <Section title="Ownership" icon={User}>
          <Row label="Owner" value={[p.NAME_LINE_1, p.NAME_LINE_2].filter(Boolean).join(", ")} />
          <Row label="Mailing Address" value={p.ADDRESS_LINE_1} />
          <Row label="City / State / ZIP" value={[p.CITY, p.STATE, p.ZIP].filter(Boolean).join(", ")} />
          <Row label="Homestead" value={p.HOMESTEAD_FLAG === "Y" ? "Yes" : p.HOMESTEAD_FLAG === "N" ? "No" : null} />
          <Row label="SOH Year" value={p.SOH_YEAR} />
          <Row label="Domicile" value={p.OWNERS_DOMICILE} />
        </Section>

        {/* Property Info */}
        <Section title="Property Info" icon={Home}>
          <Row label="Use Type" value={p.USE_TYPE} />
          <Row label="Use Code" value={p.USE_CODE} />
          <Row label="Year Built" value={p.BLDG_YEAR_BUILT || p.ACTUAL_YEAR_BUILT} />
          <Row label="Construction Class" value={p.BLDG_CCLASS} />
          <Row label="Improve Quality" value={p.BLDG_IMPROVE_QUAL} />
          <Row label="Bedrooms / Baths" value={p.BEDS || p.BATHS ? `${p.BEDS || "—"} bd / ${p.BATHS || "—"} ba` : null} />
          <Row label="Under Air Sq Ft" value={p.BLDG_UNDER_AIR_SQ_FOOTAGE?.toLocaleString()} />
          <Row label="Total Sq Ft" value={p.BLDG_TOT_SQ_FOOTAGE?.toLocaleString()} />
          <Row label="Lot Sq Ft (GIS)" value={p.GIS_SQUARE_FOOT?.toLocaleString()} />
          {legalDesc && <Row label="Legal Description" value={legalDesc} />}
        </Section>

        {/* Valuation */}
        <Section title="Valuation & Taxes" icon={DollarSign}>
          <Row label="Just Land Value" value={fmt(p.JUST_LAND_VALUE)} />
          <Row label="Just Building Value" value={fmt(p.JUST_BUILDING_VALUE)} />
          <Row label="Just Other Value" value={fmt(p.JUST_OTHER_VALUE)} />
          <Row label="Total Just Value" value={fmt(totalJust)} />
          <Row label="County Taxable" value={fmt(p.COUNTY_TAXABLE)} />
          <Row label="School Taxable" value={fmt(p.SCHOOL_TAXABLE)} />
          <Row label="City Taxable" value={fmt(p.CITY_TAXABLE)} />
          <Row label="Exemption Amount" value={fmt(p.EXEMPTION_AMOUNT)} />
          <Row label="Exemption Type" value={p.EXEMPTION_TYPE_EXPANDED || p.EXEMPTION_TYPE} />
          <Row label="Homestead Exemption" value={fmt(p.HE1_AMOUNT)} />
        </Section>

        {/* Sales History */}
        <Section title="Sales History" icon={Calendar}>
          {p.SALE_DATE_1 && <Row label={p.SALE_DATE_1} value={`${p.DEED_TYPE_1 || ""} · ${fmt(p.STAMP_AMOUNT_1) || ""}`} />}
          {p.SALE_DATE_2 && <Row label={p.SALE_DATE_2} value={`${p.DEED_TYPE_2 || ""} · ${fmt(p.STAMP_AMOUNT_2) || ""}`} />}
          {p.SALE_DATE_3 && <Row label={p.SALE_DATE_3} value={`${p.DEED_TYPE_3 || ""} · ${fmt(p.STAMP_AMOUNT_3) || ""}`} />}
          {p.SALE_DATE_4 && <Row label={p.SALE_DATE_4} value={`${p.DEED_TYPE_4 || ""} · ${fmt(p.STAMP_AMOUNT_4) || ""}`} />}
          {p.SALE_DATE_5 && <Row label={p.SALE_DATE_5} value={`${p.DEED_TYPE_5 || ""} · ${fmt(p.STAMP_AMOUNT_5) || ""}`} />}
          {!p.SALE_DATE_1 && <p className="text-sm text-gray-400">No sales history available</p>}
        </Section>
      </div>

      <PropertyPermitOverlay permits={permits} />
      <PropertyPermitHistory folio_number={p.FOLIO_NUMBER} city_name={p.SITUS_CITY} />
      <PropertyCityPanel property={p} />
      <PropertyAIChat property={p} permits={permits} />
    </div>
  );
}