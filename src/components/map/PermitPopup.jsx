import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { X, FileText, Calculator, ExternalLink, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

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