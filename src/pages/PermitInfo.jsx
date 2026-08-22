import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import {
  FileText, CheckCircle, Clock, ClipboardList, AlertTriangle,
  MapPin, Calculator, Map, ArrowRight, SearchX
} from "lucide-react";
import { motion } from "framer-motion";
import { fetchPermitTypes, resolveCity, rememberCity } from "@/lib/permitTypes";
import CountyRules from "@/components/CountyRules";
import DocumentList from "@/components/DocumentList";
import { useCountyRules, rulesForPermit } from "@/lib/countyRules";
import CityBar from "@/components/CityBar";
import { C, F, T } from "@/lib/theme";

/** Link helper so the city always travels with the reader. */
const infoUrl = (permitName, city) =>
  createPageUrl("PermitInfo") +
  `?permit=${encodeURIComponent(permitName)}&city=${encodeURIComponent(city)}`;

export default function PermitInfo() {
  // useSearchParams, not window.location.search. Reading the URL directly meant
  // this component subscribed to nothing in the router, so React never
  // re-rendered it when the query string changed — tapping a permit in the list
  // updated the address bar and left the page showing the list. The old city
  // switcher appeared to work only because it forced a full page reload.
  const [searchParams] = useSearchParams();
  const permitName = searchParams.get("permit");
  const city       = resolveCity(searchParams.get("city"));

  React.useEffect(() => { rememberCity(city); }, [city]);

  const { data: permits = [], isLoading } = useQuery({
    queryKey: ["permit-types", city],
    queryFn: () => fetchPermitTypes(city),
    staleTime: 5 * 60 * 1000,
  });

  const permit = permitName ? permits.find(p => p.name === permitName) : null;

  if (permit) return <PermitDetailView permit={permit} city={city} />;

  // A permit was asked for by name but this city doesn't list it. Say so —
  // quietly showing the city's full list reads as "here are your requirements".
  if (permitName && !isLoading) {
    return <PermitNotFound permitName={permitName} city={city} permits={permits} />;
  }

  return <GeneralPermitInfo permits={permits} isLoading={isLoading} city={city} />;
}

/**
 * The page's own CityBadge and CitySwitcher are gone — three widgets answering
 * "whose rules are these?" on one page, none of them the one the rest of the
 * app uses. CityBar replaces all three.
 *
 * Switching city drops any `permit` param: a permit named in one municipality
 * may not exist under that name in another, so the new city's list is the
 * honest place to land rather than a "not found" for a permit nobody asked
 * about. This used to force a whole page reload; now that the page subscribes
 * to the router it can update in place.
 */
function PermitInfoCityBar({ city }) {
  const [, setSearchParams] = useSearchParams();
  return (
    <CityBar
      value={city}
      onChange={(name) => {
        rememberCity(name);
        setSearchParams({ city: name });
      }}
    />
  );
}

function Disclaimer({ city }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="font-bold text-red-800 text-sm">Confirm before you build</h4>
          <p className="text-sm text-red-700 mt-1 leading-relaxed">
            These are {city}&rsquo;s typical requirements. Your project&rsquo;s specifics
            can change them. Confirm with the {city} building department before starting
            work or paying for plans.
          </p>
        </div>
      </div>
    </div>
  );
}

function PermitNotFound({ permitName, city, permits }) {
  return (
    <div style={{ background: C.ground, fontFamily: F.body, minHeight: "100vh" }}>
      <PermitInfoCityBar city={city} />
      <div className="mx-auto max-w-[720px] px-4 py-10">
      <div className="bg-white rounded-xl border border-[#dde4eb] p-8 text-center shadow-sm">
        <SearchX className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">
          {city} doesn&rsquo;t list &ldquo;{permitName}&rdquo;
        </h1>
        <p className="text-gray-500 mt-3 max-w-md mx-auto leading-relaxed">
          {permits.length > 0
            ? `Cities name their permits differently, so this may exist in ${city} under another name. Browse the ${permits.length} permit types ${city} does list, or switch city.`
            : `We don't have permit data loaded for ${city} yet. Contact the ${city} building department directly, or switch to a city we cover.`}
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to={createPageUrl("PermitInfo") + `?city=${encodeURIComponent(city)}`}
            className="px-5 py-2.5 bg-[#003466] text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity no-underline"
          >
            Browse {city} permits
          </Link>
          <Link
            to={createPageUrl("PermitGuide") + `?city=${encodeURIComponent(city)}`}
            className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors no-underline"
          >
            Open the Permit Guide
          </Link>
        </div>
      </div>
      </div>
    </div>
  );
}

function PermitDetailView({ permit, city }) {
  const cards = [
    {
      title: "Requirements",
      icon: ClipboardList,
      items: permit.typical_requirements || [],
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Documents Needed",
      icon: FileText,
      items: permit.documents_needed || [],
      color: "bg-emerald-50 text-emerald-600",
      kind: "documents",
    },
    {
      title: "Inspections Required",
      icon: CheckCircle,
      items: permit.inspections_required || [],
      color: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div style={{ background: C.ground, fontFamily: F.body, minHeight: "100vh" }}>
      <PermitInfoCityBar city={city} />
      <div className="mx-auto max-w-[900px] px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-7">
        <h1 style={{ fontFamily: F.head, fontSize: T.display, fontWeight: 800, letterSpacing: "-0.02em", color: C.ink }}>
          {permit.name}
        </h1>
        <p className="mt-1.5 max-w-2xl" style={{ color: C.muted, fontSize: T.small, lineHeight: 1.6 }}>
          Requirements as {city} lists them. Other cities differ — change the city at the top of
          the page to see theirs.
        </p>
      </div>

      {/* Description */}
      {permit.description && (
        <div className="bg-white rounded-xl border border-[#dde4eb] p-6 mb-6 shadow-sm">
          <p className="text-gray-600 leading-relaxed">{permit.description}</p>
          {permit.typical_timeline && (
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>Typical Timeline: <strong>{permit.typical_timeline}</strong></span>
            </div>
          )}
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {cards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-xl border border-[#dde4eb] p-6 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center`}>
                <card.icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-800">{card.title}</h3>
            </div>
            {card.kind === "documents" && card.items.length > 0 ? (
              <DocumentList documents={card.items} />
            ) : card.items.length > 0 ? (
              <ul className="space-y-2">
                {card.items.map((item, j) => (
                  <li key={j} className="text-sm text-gray-600 flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400 italic">Contact the {city} building department for details</p>
            )}
          </motion.div>
        ))}
      </div>

      <div className="mb-8"><CountyRulesForPermit permit={permit} /></div>

      <div className="mb-8"><Disclaimer city={city} /></div>

      {/* CTA */}
      <div className="rounded-xl p-8 text-center" style={{ background: "#003466" }}>
        <h2 className="text-2xl font-bold text-white mb-2">Ready to Get Started?</h2>
        <p className="text-blue-200 text-sm mb-6">Choose your next step to begin the permitting process</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to={createPageUrl("PermitGuide") + `?city=${encodeURIComponent(city)}`}>
            <button className="px-6 py-2.5 bg-white text-[#003466] rounded-xl font-semibold text-sm hover:bg-blue-50 transition-colors flex items-center gap-2">
              <Map className="w-4 h-4" /> Visual Permit Guide
            </button>
          </Link>
          <Link to={createPageUrl("CameraScan")}>
            <button className="px-6 py-2.5 bg-white text-[#003466] rounded-xl font-semibold text-sm hover:bg-blue-50 transition-colors flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Scan an Item
            </button>
          </Link>
          <Link to={createPageUrl("FeeCalculator") + `?permit=${encodeURIComponent(permit.name)}&city=${encodeURIComponent(city)}`}>
            <button className="px-6 py-2.5 bg-white text-[#003466] rounded-xl font-semibold text-sm hover:bg-blue-50 transition-colors flex items-center gap-2">
              <Calculator className="w-4 h-4" /> Calculate Fees
            </button>
          </Link>
        </div>
      </div>
      </div>
    </div>
  );
}

/** County-level rules that bear on this permit, attributed to their source. */
function CountyRulesForPermit({ permit }) {
  const { rules } = useCountyRules();
  const applicable = rulesForPermit(rules, {
    category: permit.category,
    mapZone: permit.map_zone,
    name: permit.name,
  });

  return (
    <CountyRules
      rules={applicable}
      intro="Your city sets the requirements above. These apply across Broward County on top of them — each links to the authority that issued it."
    />
  );
}

function GeneralPermitInfo({ permits, isLoading, city }) {
  const CATEGORY_LABELS = {
    building: "Building Permits",
    electrical: "Electrical Permits",
    plumbing: "Plumbing Permits",
    mechanical: "Mechanical Permits",
    fire: "Fire Code Services",
    certificate: "Certificates",
    planning: "Planning & Zoning",
    engineering: "Engineering Permits",
    additional: "Additional Services",
  };

  const grouped = {};
  permits.forEach(p => {
    const cat = p.category || "other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(p);
  });

  return (
    <div style={{ background: C.ground, fontFamily: F.body, minHeight: "100vh" }}>
      <PermitInfoCityBar city={city} />
      <div className="mx-auto max-w-[900px] px-4 py-6 sm:px-6">
      <div className="mb-7">
        <h1 style={{ fontFamily: F.head, fontSize: T.display, fontWeight: 800, letterSpacing: "-0.02em", color: C.ink }}>
          Permits in {city}
        </h1>
        <p className="text-gray-500 mt-2">
          {isLoading
            ? "Loading permit types…"
            : permits.length === 0
              ? `We don't have ${city}'s permit types on file yet.`
              : `${permits.length} permit type${permits.length === 1 ? "" : "s"} on file. Open one to see its requirements, documents and inspections.`}
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading permit types...</div>
      ) : permits.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-[#dde4eb]">
          <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            No permit data for {city} yet
          </h3>
          <p className="text-gray-400 text-sm mb-5 max-w-md mx-auto">
            We haven&rsquo;t loaded {city}&rsquo;s permit types. Contact the {city} building
            department directly, or switch to a city we cover.
          </p>
          <Link to={createPageUrl("PermitGuide")} className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors no-underline">
            <Map className="w-4 h-4" /> Open Visual Permit Guide
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <h2 className="text-lg font-bold text-gray-700 mb-4">{CATEGORY_LABELS[cat] || cat}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map(permit => (
                  <Link
                    key={permit.id}
                    to={infoUrl(permit.name, city)}
                    className="group bg-white rounded-xl border border-[#dde4eb] p-5 hover:shadow-lg hover:border-blue-200 transition-all no-underline"
                  >
                    <h3 className="font-bold text-gray-800 group-hover:text-[#003466] transition-colors flex items-center gap-2">
                      {permit.name}
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{permit.description}</p>
                    {permit.typical_timeline && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        {permit.typical_timeline}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {permits.length > 0 && <div className="mt-10"><Disclaimer city={city} /></div>}
      </div>
    </div>
  );
}
