import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { X, FileText, Calculator, ExternalLink, CheckCircle, Sparkles, Clock, ClipboardList, Loader2 } from "lucide-react";
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
  "Asphalt / Milling & Paving": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ac5571087590fc03d44b73/823c36c44_AsphaltMillingPaving.jpg",
  "Seal Coat & Striping":   "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ac5571087590fc03d44b73/942ef8984_SealCoatStriping.jpg",
  "Pavement / Earthwork":   "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ac5571087590fc03d44b73/5c06ae79a_PavementEarthwork.jpg",
  "Utility Boring":         "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ac5571087590fc03d44b73/ac952087e_UtilityBoring.jpg",
  "Underground Drainage":   "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ac5571087590fc03d44b73/d1e8ec28d_UndergroundDrainage.jpg",
};

const MODE_BADGE = {
  homeowner: { label: "Homeowner View", color: "bg-emerald-100 text-emerald-700" },
  contractor: { label: "Contractor View", color: "bg-orange-100 text-orange-700" },
};

function PermitCard({ permit, city, userMode }) {
  const isContractor = userMode === "contractor";
  const hasRequirements = permit.typical_requirements?.length > 0;
  const hasDocuments = permit.documents_needed?.length > 0;
  const hasInspections = Array.isArray(permit.inspections_required)
    ? permit.inspections_required.length > 0
    : typeof permit.inspections_required === "string" && permit.inspections_required.trim().length > 0;
  const inspectionsList = Array.isArray(permit.inspections_required)
    ? permit.inspections_required
    : typeof permit.inspections_required === "string" && permit.inspections_required.trim()
      ? [permit.inspections_required]
      : [];

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Card header */}
      <div className="px-4 py-3" style={{ background: "linear-gradient(135deg, #0D2B5E 0%, #0F3575 100%)" }}>
        <h4 className="text-white font-bold text-sm leading-snug">{permit.name}</h4>
      </div>

      {PERMIT_IMAGES[permit.name] && (
        <div className="w-full h-32 overflow-hidden">
          <img src={PERMIT_IMAGES[permit.name]} alt={permit.name} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Timeline & Inspections */}
        {(permit.typical_timeline || hasInspections) && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {permit.typical_timeline && (
              <div className="flex items-start gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-100">
                <Clock className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-blue-700 mb-0.5">Typical Timeline</p>
                  <p className="text-xs text-blue-800">{permit.typical_timeline}</p>
                </div>
              </div>
            )}
            {hasInspections && (
              <div className="flex items-start gap-2 px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-100">
                <ClipboardList className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-emerald-700 mb-0.5">Inspections</p>
                  {inspectionsList.map((ins, i) => (
                    <p key={i} className="text-xs text-emerald-800">• {ins}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {permit.description && (
          <p className="text-gray-600 text-xs leading-relaxed">{permit.description}</p>
        )}

        {/* Requirements — Contractor only */}
        {isContractor && hasRequirements && (
          <div>
            <h5 className="font-semibold text-gray-800 text-xs mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-orange-500" />
              Requirements
              <span className="text-[10px] font-normal text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">Contractor</span>
            </h5>
            <ul className="space-y-1">
              {permit.typical_requirements.map((req, i) => (
                <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                  <CheckCircle className="w-3 h-3 text-orange-400 mt-0.5 flex-shrink-0" />
                  {req}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Documents */}
        {hasDocuments ? (
          <DocumentChecklist documents={permit.documents_needed} permitName={permit.name} />
        ) : (
          <p className="text-xs text-gray-400 italic">No document list on file for this permit type.</p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Link
            to={createPageUrl("FeeCalculator") + `?permit=${encodeURIComponent(permit.name)}&city=${encodeURIComponent(city || "")}`}
            className="flex-1"
          >
            <Button size="sm" className="w-full text-white rounded-lg text-xs" style={{ background: "linear-gradient(135deg, #0D2B5E 0%, #0F3575 100%)" }}>
              <Calculator className="w-3.5 h-3.5 mr-1.5" />
              Calculate Fee
            </Button>
          </Link>
          <Link to={createPageUrl("PermitInfo") + `?permit=${encodeURIComponent(permit.name)}`}>
            <Button variant="outline" size="sm" className="rounded-lg gap-1 text-xs">
              <ExternalLink className="w-3.5 h-3.5" />
              More Info
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PermitPopup({ permits = [], loading = false, zoneLabel, city, userMode = "homeowner", onClose }) {
  const badge = MODE_BADGE[userMode];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 flex items-start justify-between rounded-t-2xl sticky top-0 z-10" style={{ background: "linear-gradient(135deg, #0D2B5E 0%, #0F3575 100%)" }}>
          <div className="flex-1 pr-3">
            <h3 className="text-white font-bold text-lg leading-snug">{zoneLabel}</h3>
            <span className={`mt-1 inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${badge.color}`}>
              {badge.label}
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors border border-white/20"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading permits...</span>
            </div>
          )}

          {!loading && permits.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              No permit data found for this zone.
            </div>
          )}

          {!loading && permits.map((permit, i) => (
            <PermitCard key={permit.id || i} permit={permit} city={city} userMode={userMode} />
          ))}

          {/* City badge */}
          {city && !loading && permits.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-xl">
              <span className="text-xs text-blue-600 font-medium">Selected City: {city}</span>
            </div>
          )}

          {/* AI Photo Analysis */}
          {!loading && permits.length > 0 && (
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-[2px]">
              <div className="bg-white rounded-[10px] overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                  <span className="text-white text-xs font-bold tracking-wide uppercase">AI Photo Analysis</span>
                  <span className="ml-auto text-blue-200 text-xs">New</span>
                </div>
                <div className="p-3">
                  <ZonePhotoAnalyzer permitName={zoneLabel} permitDescription={permits[0]?.description} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}