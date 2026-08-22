import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import {
  FileText, CheckCircle, Clock, ClipboardList, AlertTriangle,
  MapPin, Calculator, Map, ArrowRight, Building2, SearchX
} from "lucide-react";
import { motion } from "framer-motion";
import { fetchPermitTypes, resolveCity, rememberCity } from "@/lib/permitTypes";
import { useCities } from "@/hooks/useCities";
import CountyRules from "@/components/CountyRules";
import { useCountyRules, rulesForPermit } from "@/lib/countyRules";

/** Link helper so the city always travels with the reader. */
const infoUrl = (permitName, city) =>
  createPageUrl("PermitInfo") +
  `?permit=${encodeURIComponent(permitName)}&city=${encodeURIComponent(city)}`;

export default function PermitInfo() {
  const urlParams  = new URLSearchParams(window.location.search);
  const permitName = urlParams.get("permit");
  const city       = resolveCity(urlParams.get("city"));

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

/** Shown on every view so the reader always knows whose rules these are. */
function CityBadge({ city }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#eef3fa] rounded-full text-xs font-semibold text-[#003466]">
      <Building2 className="w-3.5 h-3.5" />
      {city}
    </div>
  );
}

function CitySwitcher({ city }) {
  const { cities } = useCities();

  // Every city is listed. Ones without loaded data land on the empty state
  // above, which names their building department rather than going silent.
  if (cities.length === 0) return null;

  return (
    <label className="flex items-center gap-2 text-sm text-gray-500">
      <span className="whitespace-nowrap">Showing rules for</span>
      <select
        value={city}
        onChange={e => {
          rememberCity(e.target.value);
          window.location.search = `?city=${encodeURIComponent(e.target.value)}`;
        }}
        className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-gray-800 bg-white focus:border-[#003466] focus:outline-none focus:ring-1 focus:ring-[#003466]"
      >
        {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
      </select>
    </label>
  );
}

function Disclaimer({ city }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm">
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
        <div className="mt-6 flex justify-center">
          <CitySwitcher city={city} />
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
    },
    {
      title: "Inspections Required",
      icon: CheckCircle,
      items: permit.inspections_required || [],
      color: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full text-xs font-medium text-[#2c5282]">
            <FileText className="w-3.5 h-3.5" />
            Permit Information
          </div>
          <CityBadge city={city} />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">{permit.name}</h1>
        <p className="text-gray-500 mt-2 max-w-2xl">
          Requirements as {city} lists them. Other cities differ — check the city above.
        </p>
        <div className="mt-4"><CitySwitcher city={city} /></div>
      </div>

      {/* Description */}
      {permit.description && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
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
            className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center`}>
                <card.icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-800">{card.title}</h3>
            </div>
            {card.items.length > 0 ? (
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
      <div className="rounded-2xl p-8 text-center" style={{ background: "linear-gradient(135deg, #0D2B5E 0%, #0F3575 100%)" }}>
        <h2 className="text-2xl font-bold text-white mb-2">Ready to Get Started?</h2>
        <p className="text-blue-200 text-sm mb-6">Choose your next step to begin the permitting process</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to={createPageUrl("PermitGuide") + `?city=${encodeURIComponent(city)}`}>
            <button className="px-6 py-2.5 bg-white text-[#2c5282] rounded-xl font-semibold text-sm hover:bg-blue-50 transition-colors flex items-center gap-2">
              <Map className="w-4 h-4" /> Visual Permit Guide
            </button>
          </Link>
          <Link to={createPageUrl("CameraScan")}>
            <button className="px-6 py-2.5 bg-white text-[#2c5282] rounded-xl font-semibold text-sm hover:bg-blue-50 transition-colors flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Scan an Item
            </button>
          </Link>
          <Link to={createPageUrl("FeeCalculator") + `?permit=${encodeURIComponent(permit.name)}&city=${encodeURIComponent(city)}`}>
            <button className="px-6 py-2.5 bg-white text-[#2c5282] rounded-xl font-semibold text-sm hover:bg-blue-50 transition-colors flex items-center gap-2">
              <Calculator className="w-4 h-4" /> Calculate Fees
            </button>
          </Link>
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <div className="mb-4"><CityBadge city={city} /></div>
        <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">
          Permits in {city}
        </h1>
        <p className="text-gray-500 mt-2">
          {isLoading
            ? "Loading permit types…"
            : permits.length === 0
              ? `We don't have ${city}'s permit types on file yet.`
              : `${permits.length} permit type${permits.length === 1 ? "" : "s"} on file. Open one to see its requirements, documents and inspections.`}
        </p>
        <div className="mt-4"><CitySwitcher city={city} /></div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading permit types...</div>
      ) : permits.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
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
                    className="group bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-lg hover:border-blue-200 transition-all no-underline"
                  >
                    <h3 className="font-bold text-gray-800 group-hover:text-[#2c5282] transition-colors flex items-center gap-2">
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
  );
}
