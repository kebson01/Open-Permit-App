import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { X, FileText, Calculator, ExternalLink, CheckCircle, Sparkles, Clock, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import ZonePhotoAnalyzer from "./ZonePhotoAnalyzer";
import DocumentChecklist from "./DocumentChecklist";

const PERMIT_IMAGES = {
  "Roof / Re-Roof":         "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ac5571087590fc03d44b73/4058cd09e_Roof.jpg",
  "Solar Panels":           "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ac5571087590fc03d44b73/0ef7ed7bf_SolarPanels.jpg",
  "Window Replacement":     "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ac5571087590fc03d44b73/adbab0caf_WindowReplacement.jpg",
  "Door Replacement":       "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ac5571087590fc03d44b73/e890b882d_DoorReplacement.jpg",
  "Garage Door":            "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ac5571087590fc03d44b73/23075520a_GarageDoor.jpg",
  "A/C Replacement":        "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ac5571087590fc03d44b73/e34f517e0_ACReplacement.jpg",
  "Electrical Service":     "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ac5571087590fc03d44b73/c4f31fc38_ElectricalService.jpg",
  "Pool & Spa":             "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ac5571087590fc03d44b73/23ee4533a_PoolSpa.jpg",
  "Pool Equipment":         "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ac5571087590fc03d44b73/f38045c95_PoolEquipment.jpg",
  "Pool Deck":              "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ac5571087590fc03d44b73/23ee4533a_PoolSpa.jpg",
  "Driveway (Paver)":       "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ac5571087590fc03d44b73/fda47a212_DrivewayWalkway.jpg",
  "Driveway / Walkway":     "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ac5571087590fc03d44b73/fda47a212_DrivewayWalkway.jpg",
  "Walkway / Sidewalk":     "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ac5571087590fc03d44b73/fda47a212_DrivewayWalkway.jpg",
  "Fence / Gate":           "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ac5571087590fc03d44b73/4aaa3c9d9_FenceGate.jpg",
  "Patio / Slab":           "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ac5571087590fc03d44b73/fd832098f_PatioSlab.jpg",
  "Covered Patio":          "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ac5571087590fc03d44b73/d79df9024_CoveredPatio.jpg",
  "Pergola":                "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ac5571087590fc03d44b73/05d77140e_Pergola.jpg",
  "Residential Remodel":    "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&q=80",
  "Residential Addition":   "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&q=80",
  "Plumbing":               "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80",
  "Irrigation System":      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80",
  "HVAC / Mechanical":      "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ac5571087590fc03d44b73/e34f517e0_ACReplacement.jpg",
  "Sign Permit":            "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ac5571087590fc03d44b73/989d5c998_SignPermit.jpg",
  "Parking Lot / Paving":   "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=600&q=80",
  "EV Charging Station":    "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&q=80",
  "Light Pole / Utility":   "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ac5571087590fc03d44b73/db4cdd086_LightPoleUtility.jpg",
  "Sidewalk / Curb":        "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ac5571087590fc03d44b73/42a12b803_SidewalkCurb.jpg",
  "Asphalt / Milling & Paving": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ac5571087590fc03d44b73/823c36c44_AsphaltMillingPaving.jpg",
  "Seal Coat & Striping":   "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ac5571087590fc03d44b73/942ef8984_SealCoatStriping.jpg",
  "Pavement / Earthwork":   "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ac5571087590fc03d44b73/5c06ae79a_PavementEarthwork.jpg",
  "Utility Boring":         "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ac5571087590fc03d44b73/ac952087e_UtilityBoring.jpg",
  "Underground Drainage":   "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ac5571087590fc03d44b73/d1e8ec28d_UndergroundDrainage.jpg",
};

// Mode badge config
const MODE_BADGE = {
  homeowner: { label: "Homeowner View", color: "bg-emerald-100 text-emerald-700" },
  contractor: { label: "Contractor View", color: "bg-orange-100 text-orange-700" },
};

export default function PermitPopup({ permit, city, userMode = "homeowner", onClose }) {
  const [activeIdx, setActiveIdx] = useState(0);
  useEffect(() => { setActiveIdx(0); }, [permit]);
  if (!permit) return null;

  const allMatching = permit._allMatching || [permit];
  const current = allMatching[activeIdx] || permit;

  const isContractor = userMode === "contractor";
  const badge = MODE_BADGE[userMode];
  const hasRequirements = current.typical_requirements?.length > 0;
  const hasDocuments = current.documents_needed?.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with prominent close button */}
        <div className="px-5 py-4 flex items-start justify-between rounded-t-2xl sticky top-0 z-10" style={{ background: "linear-gradient(135deg, #0D2B5E 0%, #0F3575 100%)" }}>
          <div className="flex-1 pr-3">
            <h3 className="text-white font-bold text-lg leading-snug">{current.name}</h3>
            <span className={`mt-1 inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${badge.color}`}>
              {badge.label}
            </span>
          </div>
          {/* Prominent X close button */}
          <button
            onClick={onClose}
            className="flex-shrink-0 w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors border border-white/20"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

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
                  i === activeIdx ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}

        <div className="p-5 space-y-5">
          {/* Timeline & Inspections — prominent at top */}
          {(current.typical_timeline || current.inspections_required?.length > 0) && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {current.typical_timeline && (
                <div className="flex items-start gap-2.5 px-3 py-2.5 bg-blue-50 rounded-xl border border-blue-100">
                  <Clock className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-blue-700 mb-0.5">Typical Timeline</p>
                    <p className="text-xs text-blue-800">{current.typical_timeline}</p>
                  </div>
                </div>
              )}
              {current.inspections_required?.length > 0 && (
                <div className="flex items-start gap-2.5 px-3 py-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                  <ClipboardList className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-emerald-700 mb-0.5">Inspections Required</p>
                    <ul className="space-y-0.5">
                      {current.inspections_required.map((ins, i) => (
                        <li key={i} className="text-xs text-emerald-800">• {ins}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {current.description && (
            <p className="text-gray-600 text-sm leading-relaxed">{current.description}</p>
          )}

          {/* Requirements — Contractor only */}
          {isContractor && hasRequirements && (
            <div>
              <h4 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-orange-500" />
                Requirements
                <span className="text-xs font-normal text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">Contractor</span>
              </h4>
              <ul className="space-y-1.5">
                {current.typical_requirements.map((req, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-orange-400 mt-0.5 flex-shrink-0" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Documents — both modes, interactive checklist */}
          {hasDocuments ? (
            <DocumentChecklist documents={current.documents_needed} permitName={current.name} />
          ) : (
            <div className="text-xs text-gray-400 italic">No document list on file for this permit type.</div>
          )}

          {city && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-xl">
              <span className="text-xs text-blue-600 font-medium">Selected City: {city}</span>
            </div>
          )}

          {/* AI Photo Analysis */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-[2px]">
            <div className="bg-white rounded-[10px] overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-white" />
                <span className="text-white text-xs font-bold tracking-wide uppercase">AI Photo Analysis</span>
                <span className="ml-auto text-blue-200 text-xs">New</span>
              </div>
              <div className="p-3">
                <ZonePhotoAnalyzer permitName={current.name} permitDescription={current.description} />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              to={createPageUrl("FeeCalculator") + `?permit=${encodeURIComponent(current.name)}&city=${encodeURIComponent(city || "")}`}
              className="flex-1"
            >
              <Button className="w-full text-white rounded-xl" style={{ background: "linear-gradient(135deg, #0D2B5E 0%, #0F3575 100%)" }}>
                <Calculator className="w-4 h-4 mr-2" />
                Calculate Fee
              </Button>
            </Link>
            <Link to={createPageUrl("PermitInfo") + `?permit=${encodeURIComponent(current.name)}`}>
              <Button variant="outline" className="rounded-xl gap-1.5">
                <ExternalLink className="w-4 h-4" />
                More Info
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}