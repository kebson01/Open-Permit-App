import React, { useState, useEffect } from "react";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { X, FileText, Calculator, ExternalLink, CheckSquare, Square, Info, ClipboardList, Clock, Sparkles, Phone, MapPin, Globe, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";
import ZonePhotoAnalyzer from "./ZonePhotoAnalyzer";
import FBCSection from "./FBCSection";
import CountyRules from "@/components/CountyRules";
import { useCountyRules, rulesForPermit } from "@/lib/countyRules";
import { useDocumentExplainers, explainDocument } from "@/lib/documentExplainers";
import { useCities } from "@/hooks/useCities";
import { C, F, T } from "@/lib/theme";

const SUPABASE_HEADERS = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` };

async function fetchPlainEnglishDocs() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/document_plain_english?select=*`, { headers: SUPABASE_HEADERS });
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

const CITY_APPLY_INFO = {
  "Weston": {
    portalUrl: "https://www.westonfl.org/Permits",
    address: "17200 Royal Palm Blvd, Weston, FL 33326",
    mapsUrl: "https://maps.google.com/?q=17200+Royal+Palm+Blvd,+Weston,+FL+33326",
    phone: "(954) 385-2600",
    phoneRaw: "9543852600",
    hours: "Mon–Fri, 8:00 AM – 4:30 PM",
  },
  "Coral Springs": {
    portalUrl: "https://www.coralsprings.gov/Government/Departments/Building/Online-Permitting-eTrakit/Apply-for-Online-Permit",
    address: "9500 West Sample Road, Coral Springs, FL 33065",
    mapsUrl: "https://maps.google.com/?q=9500+West+Sample+Road,+Coral+Springs,+FL+33065",
    phone: "(954) 344-1025",
    phoneRaw: "9543441025",
    hours: "Mon–Thu 7:30AM–5:00PM, Fri 7:30AM–2:30PM",
  },
  "Fort Lauderdale": {
    portalUrl: "https://lauderbuild.fortlauderdale.gov/",
    address: "700 NW 19th Avenue, Fort Lauderdale, FL 33311",
    mapsUrl: "https://maps.google.com/?q=700+NW+19th+Avenue,+Fort+Lauderdale,+FL+33311",
    phone: "(954) 828-6520",
    phoneRaw: "9548286520",
    hours: "Mon–Fri, 7:30AM–4:30PM",
    note: "All submissions must be made digitally through LauderBuild — no paper applications accepted.",
  },
  "Hollywood": {
    portalUrl: "https://aca-prod.accela.com/HOLLYWOOD/Default.aspx",
    address: "2600 Hollywood Blvd., Hollywood, FL 33020",
    mapsUrl: "https://maps.google.com/?q=2600+Hollywood+Blvd,+Hollywood,+FL+33020",
    phone: "(954) 921-3335",
    phoneRaw: "9549213335",
    hours: "Mon–Thu 7AM–6PM",
    note: "Express same-day permits available for select residential permits — submit Tuesday 6PM to Wednesday 9AM.",
  },
  "Cooper City": {
    portalUrl: "https://coopercity.gov/?SEC=AD7C348E-C110-425A-B91C-2CA5769BF937",
    address: "9090 SW 50th Place, Cooper City, FL 33328",
    mapsUrl: "https://maps.google.com/?q=9090+SW+50th+Place,+Cooper+City,+FL+33328",
    phone: "(954) 434-4300",
    phoneRaw: "9544344300",
    hours: "Mon–Fri, 8AM–5PM",
    note: "All applications must be notarized. Hold Harmless Agreement required for drainage easements.",
  },
};

function CountyRulesForPermit({ permit }) {
  const { rules } = useCountyRules();
  if (!permit) return null;
  return (
    <CountyRules
      rules={rulesForPermit(rules, { category: permit.category, mapZone: permit.map_zone, name: permit.name })}
      intro="Countywide rules that apply on top of your city's. Each links to the authority that issued it."
    />
  );
}

/**
 * Where and how to actually file, for the city on screen.
 *
 * This used to read `CITY_APPLY_INFO[city] || CITY_APPLY_INFO["Weston"]`, so a
 * reader in any of the 26 cities not in that table was handed Weston's portal,
 * Weston's street address and Weston's phone number under their own city's
 * name — an answer confident enough to act on and wrong enough to waste a trip.
 *
 * Details now come from `cities`, which covers all 31. The hardcoded table is
 * kept only for the office hours it carries, which the table in the database
 * does not have; it is never a fallback for a different city's contact details.
 * Anything unknown is omitted rather than substituted.
 */
function ReadyToApply({ city }) {
  const { cities } = useCities();
  const row = city ? cities.find(c => c.name === city) : null;
  const extra = (city && CITY_APPLY_INFO[city]) || null;

  const portal  = row?.portal_url || extra?.portalUrl || "";
  const address = row?.building_department_address || extra?.address || "";
  const phone   = row?.building_department_phone || extra?.phone || "";
  const hours   = extra?.hours || "";
  const mapsUrl = address ? `https://maps.google.com/?q=${encodeURIComponent(address)}` : "";

  const rowCls = "flex items-center gap-2 w-full py-2 px-3 rounded-lg text-sm text-white no-underline bg-white/10 hover:bg-white/20 transition-colors";

  return (
    <div className="rounded-xl p-4 space-y-2" style={{ background: C.brand }}>
      <div>
        <p className="text-white" style={{ fontFamily: F.head, fontSize: T.body, fontWeight: 700 }}>
          Ready to apply?
        </p>
        <p className="mt-0.5" style={{ color: "rgba(255,255,255,0.75)", fontSize: T.caption }}>
          {portal || address || phone
            ? `Once you have your documents, here's how to submit to ${city}:`
            : `We don't have ${city || "this city"}'s filing details on file — contact their building department directly.`}
        </p>
      </div>

      {portal && (
        <a
          href={portal}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-white no-underline transition-opacity hover:opacity-90"
          style={{ background: "rgba(255,255,255,0.18)", fontFamily: F.head, fontSize: T.small, fontWeight: 700 }}
        >
          <Globe className="w-4 h-4" aria-hidden="true" /> Apply online
        </a>
      )}

      {address && (
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={rowCls}>
          <MapPin className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span>Visit in person — {address}</span>
        </a>
      )}

      {phone && (
        <a href={`tel:${phone.replace(/[^0-9]/g, "")}`} className={rowCls}>
          <Phone className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span>Call the building department — {phone}</span>
        </a>
      )}

      {hours && (
        <p className="text-center" style={{ color: "rgba(255,255,255,0.55)", fontSize: T.caption }}>
          Office hours: {hours}
        </p>
      )}
      {extra?.note && (
        <p className="text-center italic px-1" style={{ color: "rgba(255,255,255,0.65)", fontSize: T.caption }}>
          {extra.note}
        </p>
      )}
    </div>
  );
}

const PERMIT_IMAGES = {
  "Roof / Re-Roof":         "/permits/Roof.jpg",
  "Solar Panels":           "/permits/SolarPanels.jpg",
  "Window Replacement":     "/permits/WindowReplacement.jpg",
  "Door Replacement":       "/permits/DoorReplacement.jpg",
  "Garage Door":            "/permits/GarageDoor.jpg",
  "A/C Replacement":        "/permits/ACReplacement.jpg",
  "Electrical Service":     "/permits/ElectricalService.jpg",
  "Pool & Spa":             "/permits/PoolSpa.jpg",
  "Pool Equipment":         "/permits/PoolEquipment.jpg",
  "Pool Deck":              "/permits/PoolSpa.jpg",
  "Driveway (Paver)":       "/permits/DrivewayWalkway.jpg",
  "Driveway / Walkway":     "/permits/DrivewayWalkway.jpg",
  "Walkway / Sidewalk":     "/permits/DrivewayWalkway.jpg",
  "Fence / Gate":           "/permits/FenceGate.jpg",
  "Patio / Slab":           "/permits/PatioSlab.jpg",
  "Covered Patio":          "/permits/CoveredPatio.jpg",
  "Pergola":                "/permits/Pergola.jpg",
  "Residential Remodel":    "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&q=80",
  "Residential Addition":   "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&q=80",
  "Plumbing":               "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80",
  "Irrigation System":      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80",
  "HVAC / Mechanical":      "/permits/ACReplacement.jpg",
  "Sign Permit":            "/permits/SignPermit.jpg",
  "Parking Lot / Paving":   "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=600&q=80",
  "EV Charging Station":    "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&q=80",
  "Light Pole / Utility":   "/permits/LightPoleUtility.jpg",
  "Sidewalk / Curb":        "/permits/SidewalkCurb.jpg",
  "Asphalt / Milling & Paving": "/permits/AsphaltMillingPaving.jpg",
  "Seal Coat & Striping":   "/permits/SealCoatStriping.jpg",
  "Pavement / Earthwork":   "/permits/PavementEarthwork.jpg",
  "Utility Boring":         "/permits/UtilityBoring.jpg",
  "Underground Drainage":   "/permits/UndergroundDrainage.jpg",
};

const CITY_NOC_THRESHOLD = {
  "Weston": "$2,500",
  "Coral Springs": "$5,000",
  "Fort Lauderdale": "$2,500",
  "Hollywood": "$5,000",
  "Cooper City": "$2,500",
};

function getDocExplanations(city) {
  const known = CITY_NOC_THRESHOLD[city];
  const overThreshold = known
    ? `on projects over ${known}`
    : `once the job passes the threshold ${city || "your city"} sets`;
  return {
    "BCUBPA": "Broward County's standard permit application form. Download from the Broward County website.",
    "Broward County Uniform Building Permit Application": "Broward County's standard permit application form. Download from the Broward County website.",
    "Notice of Commencement": `A legal notice filed before work begins ${overThreshold}. Your contractor typically handles this.`,
    "Product Approval": "Manufacturer documentation showing the product meets Florida Building Code wind resistance requirements.",
    "Signed and Sealed Plans": "Architectural or engineering drawings stamped by a licensed professional.",
    "Energy Calculations": "A report showing your project meets Florida's energy efficiency requirements.",
    "Contractor License": "A copy of your contractor's current state-issued license.",
    "Property Survey": "A legal drawing of your property showing boundaries and existing structures.",
    "Site Plan": "A drawing showing the layout of the project on your lot, including setbacks from property lines.",
    "Structural Plans": "Engineering drawings detailing load-bearing elements of the structure.",
    "Electrical Plans": "Diagrams of the electrical wiring and panel layout for the project.",
    "Manufacturer's Specifications": "Technical documents from the product manufacturer showing installation requirements.",
    "Homeowner Affidavit": "A signed statement confirming you are the owner and will occupy the home.",
    "NOC": `Notice of Commencement — a legal notice filed before work begins ${overThreshold}.`,
  };
}

function DocumentsSection({ documents, city }) {
  const DOC_EXPLANATIONS = getDocExplanations(city);
  const explainers = useDocumentExplainers();
  const [checked, setChecked] = useState({});

  const toggle = (doc) => setChecked(prev => ({ ...prev, [doc]: !prev[doc] }));

  const checkedCount = Object.values(checked).filter(Boolean).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#003466]" />
          Required Documents
        </h4>
        {checkedCount > 0 && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#e7eef6] text-[#003466]">
            {checkedCount}/{documents.length} ready
          </span>
        )}
      </div>
      <ul className="space-y-3">
        {documents.map((doc, i) => {
          const pe = explainDocument(doc, explainers);
          return (
            <li key={i} onClick={() => toggle(doc)} className="flex items-start gap-2.5 cursor-pointer group">
              {checked[doc]
                ? <CheckSquare className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                : <Square className="w-4 h-4 text-gray-300 group-hover:text-gray-500 mt-0.5 flex-shrink-0 transition-colors" />
              }
              <div className={`flex-1 transition-opacity ${checked[doc] ? "opacity-50" : ""}`}>
                {pe ? (
                  <>
                    <p className={`text-sm font-semibold leading-snug ${checked[doc] ? "line-through" : ""}`} style={{ color: C.ink }}>{pe.plain_name}</p>
                    <p className="text-xs italic mt-0.5" style={{ color: C.faint }}>{doc}</p>
                    {pe.plain_description && <p className="text-xs mt-0.5" style={{ color: C.muted }}>{pe.plain_description}</p>}
                    {pe.where_to_get && <p className="text-xs mt-0.5 font-medium" style={{ color: C.brand, fontSize: 11 }}>Where to get it: {pe.where_to_get}</p>}
                    {pe.download_url && (
                      <a href={pe.download_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-xs font-semibold" style={{ color: C.brand, fontSize: 11 }}>Download form →</a>
                    )}
                  </>
                ) : (
                  <>
                    <span className={`text-sm leading-snug ${checked[doc] ? "line-through text-gray-400" : "text-gray-800 group-hover:text-gray-900"}`}>{doc}</span>
                    {DOC_EXPLANATIONS[doc] && <p className="text-xs text-gray-400 mt-0.5 leading-snug">{DOC_EXPLANATIONS[doc]}</p>}
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-gray-400 mt-3 leading-relaxed">
        Tick items off as you gather them. This list is a working checklist, not a saved record.
      </p>
      {checkedCount === documents.length && documents.length > 0 && (
        <p className="text-xs text-emerald-600 mt-2 font-medium">
          Checklist complete. You are ready to submit your application. Final approval is determined by the city's building department.
        </p>
      )}
    </div>
  );
}

export default function PermitPopup({ permit, city, userMode = "homeowner", onClose }) {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => { setActiveIdx(0); }, [permit]);

  if (!permit) return null;

  const allMatching = permit._allMatching || [permit];
  const current = allMatching[activeIdx] || permit;

  const hasRequirements = current.typical_requirements?.length > 0;
  const hasDocuments = current.documents_needed?.length > 0;
  const hasInspections = current.inspections_required?.length > 0;

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 flex items-start justify-between rounded-t-2xl sticky top-0 z-10" style={{ background: C.brand }}>
          <div className="flex-1 pr-3">
            <h3 className="text-white font-bold text-lg leading-snug">{current.name}</h3>
            <div className="flex items-center gap-1.5 mt-1.5">
              <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "rgba(255,255,255,0.6)" }} aria-hidden="true" />
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>
                {current.typical_timeline || "Typically 2–5 business days for review"}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors border border-white/20"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Permit image */}
        {PERMIT_IMAGES[current.name] && (
          <div className="w-full h-40 overflow-hidden">
            <img src={PERMIT_IMAGES[current.name]} alt={current.name} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Tab switcher when multiple permits match this zone */}
        {allMatching.length > 1 && (
          <div className="px-4 pt-3 flex gap-2 flex-wrap border-b border-gray-100 pb-3">
            {allMatching.map((p, i) => (
              <button
                key={p.id || i}
                onClick={() => setActiveIdx(i)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  i === activeIdx ? "bg-[#003466] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}

        <div className="p-5 space-y-5">
          {/* HVHZ Callout — always shown for all Broward permits */}
          <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl border border-[#c3d3e2] bg-[#e7eef6]">
            <Wind className="w-4 h-4 text-[#003466] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-[#003466] leading-relaxed">
              <span className="font-bold">📍 HVHZ — High Velocity Hurricane Zone:</span> All Broward County properties require products rated for 170+ mph winds. All exterior work must have current <strong>Florida Product Approval</strong>.
            </p>
          </div>

          {/* Description */}
          {current.description && (
            <p className="text-gray-600 text-sm leading-relaxed">{current.description}</p>
          )}

          {/* Requirements */}
          {hasRequirements && (
            <>
              <hr className="border-gray-100" />
              <div>
                <h4 className="font-semibold text-gray-800 text-sm flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-[#5c6b7a]" />
                  Permit Requirements
                </h4>
                <ul className="space-y-2">
                  {current.typical_requirements.map((req, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#003466] mt-2 flex-shrink-0" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {/* Documents */}
          {hasDocuments && (
            <>
              <hr className="border-gray-100" />
              <DocumentsSection documents={current.documents_needed} city={city} />
            </>
          )}

          {/* Inspections */}
          <hr className="border-gray-100" />
          <div>
            <h4 className="font-semibold text-gray-800 text-sm flex items-center gap-2 mb-3">
              <ClipboardList className="w-4 h-4 text-emerald-500" />
              Inspections Required
            </h4>
            {hasInspections ? (
              <ul className="space-y-2">
                {current.inspections_required.map((ins, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
                    {ins}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 italic">
                Contact {city || "Weston"} Building Department to confirm required inspections.
              </p>
            )}
          </div>


          {/* AI Photo Analysis */}
          <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
            <div style={{ background: C.surface }}>
              <div className="px-4 py-2 flex items-center gap-2" style={{ background: C.brand }}>
                <Sparkles className="w-3.5 h-3.5 text-white" aria-hidden="true" />
                <span
                  className="text-white uppercase"
                  style={{ fontFamily: F.head, fontSize: T.caption, fontWeight: 700, letterSpacing: "0.06em" }}
                >
                  Photo analysis
                </span>
              </div>
              <div className="p-3">
                <ZonePhotoAnalyzer permitName={current.name} permitDescription={current.description} cityName={city} />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              to={createPageUrl("FeeCalculator") + `?permit=${encodeURIComponent(current.name)}&city=${encodeURIComponent(city || "")}`}
              className="flex-1"
            >
              <Button className="w-full text-white rounded-xl" style={{ background: C.brand }}>
                <Calculator className="w-4 h-4 mr-2" />
                Calculate Fee
              </Button>
            </Link>
            <Link to={createPageUrl("PermitInfo") + `?permit=${encodeURIComponent(current.name)}&city=${encodeURIComponent(city || "")}`}>
              <Button variant="outline" className="rounded-xl gap-1.5">
                <ExternalLink className="w-4 h-4" />
                More Info
              </Button>
            </Link>
          </div>


          {/* Florida Building Code Requirements */}
          <hr className="border-gray-100" />
          <FBCSection permitName={current.name} />

          {/* County rules, attributed to the authority that issued them */}
          <CountyRulesForPermit permit={current} />

          {/* Ready to Apply */}
          <ReadyToApply city={city} />
        </div>
      </div>
    </div>

    </>
  );
}