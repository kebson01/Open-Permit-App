import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { X, FileText, Calculator, ExternalLink, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  "Fence / Gate":           "https://images.unsplash.com/photo-1558618047-f4c0d6b5c0d6?w=600&q=80",
  "Patio / Slab":           "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80",
  "Covered Patio":          "https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=600&q=80",
  "Pergola":                "https://images.unsplash.com/photo-1598977703796-cc75c0e78dde?w=600&q=80",
  "Residential Remodel":    "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&q=80",
  "Residential Addition":   "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&q=80",
  "Plumbing":               "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80",
  "Irrigation System":      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80",
  "HVAC / Mechanical":      "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ac5571087590fc03d44b73/e34f517e0_ACReplacement.jpg",
  "Sign Permit":            "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=80",
  "Parking Lot / Paving":   "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=600&q=80",
  "EV Charging Station":    "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&q=80",
  "Light Pole / Utility":   "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
  "Sidewalk / Curb":        "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ac5571087590fc03d44b73/fda47a212_DrivewayWalkway.jpg",
};

export default function PermitPopup({ permit, city, onClose }) {
  if (!permit) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="gradient-primary px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h3 className="text-white font-bold text-lg">{permit.name}</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {PERMIT_IMAGES[permit.name] && (
          <div className="w-full h-44 overflow-hidden rounded-none">
            <img
              src={PERMIT_IMAGES[permit.name]}
              alt={permit.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-6 space-y-5">
          <p className="text-gray-600 text-sm leading-relaxed">{permit.description}</p>
          
          {permit.typical_requirements?.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#2c5282]" />
                Requirements
              </h4>
              <ul className="space-y-1.5">
                {permit.typical_requirements.map((req, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {permit.documents_needed?.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-800 text-sm mb-2">Documents Needed</h4>
              <ul className="space-y-1.5">
                {permit.documents_needed.map((doc, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#3182ce] mt-1.5 flex-shrink-0" />
                    {doc}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {city && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-xl">
              <span className="text-xs text-blue-600 font-medium">Selected City: {city}</span>
            </div>
          )}
          
          <div className="flex gap-3">
            <Link
              to={createPageUrl("FeeCalculator") + `?permit=${encodeURIComponent(permit.name)}&city=${encodeURIComponent(city || "")}`}
              className="flex-1"
            >
              <Button className="w-full gradient-primary text-white rounded-xl">
                <Calculator className="w-4 h-4 mr-2" />
                Calculate Fee
              </Button>
            </Link>
            <Link to={createPageUrl("PermitInfo") + `?permit=${encodeURIComponent(permit.name)}`}>
              <Button variant="outline" className="rounded-xl">
                <ExternalLink className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}