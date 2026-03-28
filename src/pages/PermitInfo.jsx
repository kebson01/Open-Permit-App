import React from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import {
  FileText, CheckCircle, Clock, ClipboardList, AlertTriangle,
  MapPin, Calculator, Map, ArrowRight
} from "lucide-react";
import { motion } from "framer-motion";

export default function PermitInfo() {
  const urlParams = new URLSearchParams(window.location.search);
  const permitName = urlParams.get("permit");

  const { data: permits = [], isLoading } = useQuery({
    queryKey: ["permits"],
    queryFn: () => base44.entities.PermitType.list(),
  });

  const permit = permitName ? permits.find(p => p.name === permitName) : null;

  // If a specific permit is selected, show its details
  if (permit) {
    return <PermitDetailView permit={permit} />;
  }

  // Otherwise show general info
  return <GeneralPermitInfo permits={permits} isLoading={isLoading} />;
}

function PermitDetailView({ permit }) {
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
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full text-xs font-medium text-[#2c5282] mb-4">
          <FileText className="w-3.5 h-3.5" />
          Permit Information
        </div>
        <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">{permit.name}</h1>
        <p className="text-gray-500 mt-2 max-w-2xl">
          General information and requirements that typically apply across most municipalities.
        </p>
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
              <p className="text-sm text-gray-400 italic">Contact your local building department for details</p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-8">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-red-800 text-sm">Important Disclaimer</h4>
            <p className="text-sm text-red-700 mt-1 leading-relaxed">
              Requirements vary by city and project specifics. Always consult your local building department 
              for official requirements, forms, and fee schedules before beginning your project.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="gradient-primary rounded-2xl p-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Ready to Get Started?</h2>
        <p className="text-blue-200 text-sm mb-6">Choose your next step to begin the permitting process</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to={createPageUrl("Home")}>
            <button className="px-6 py-2.5 bg-white text-[#2c5282] rounded-xl font-semibold text-sm hover:bg-blue-50 transition-colors flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Select Your City
            </button>
          </Link>
          <Link to={createPageUrl("PermitGuide")}>
            <button className="px-6 py-2.5 bg-white text-[#2c5282] rounded-xl font-semibold text-sm hover:bg-blue-50 transition-colors flex items-center gap-2">
              <Map className="w-4 h-4" /> Visual Permit Guide
            </button>
          </Link>
          <Link to={createPageUrl("FeeCalculator") + `?permit=${encodeURIComponent(permit.name)}`}>
            <button className="px-6 py-2.5 bg-white text-[#2c5282] rounded-xl font-semibold text-sm hover:bg-blue-50 transition-colors flex items-center gap-2">
              <Calculator className="w-4 h-4" /> Calculate Fees
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function GeneralPermitInfo({ permits, isLoading }) {
  const CATEGORY_LABELS = {
    building: "Building Permits",
    electrical: "Electrical Permits",
    plumbing: "Plumbing Permits",
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
        <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">General Permit Information</h1>
        <p className="text-gray-500 mt-2">
          Browse all available permit types and learn about requirements for each.
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading permit types...</div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <h2 className="text-lg font-bold text-gray-700 mb-4">{CATEGORY_LABELS[cat] || cat}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map(permit => (
                  <Link
                    key={permit.id}
                    to={createPageUrl("PermitInfo") + `?permit=${encodeURIComponent(permit.name)}`}
                    className="group bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-lg hover:border-blue-200 transition-all"
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

      {/* Disclaimer */}
      <div className="mt-10 bg-red-50 border border-red-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-red-800 text-sm">Important Disclaimer</h4>
            <p className="text-sm text-red-700 mt-1 leading-relaxed">
              Requirements vary by city. Always consult your local building department for official requirements.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}