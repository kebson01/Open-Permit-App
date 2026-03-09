import React from "react";
import { DollarSign, AlertTriangle, ExternalLink, RotateCcw, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function FeeResultsV2({ results, permit, city, cityConfig, onReset }) {
  if (!results) return null;

  const portalUrl = cityConfig?.portal_url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8"
    >
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
        {/* Total Header */}
        <div className="gradient-primary px-6 py-7 text-center">
          <p className="text-blue-200 text-sm mb-1">Estimated Total Fee</p>
          <div className="flex items-center justify-center gap-2">
            <DollarSign className="w-8 h-8 text-yellow-300" />
            <span className="text-4xl font-extrabold text-white">{results.total.toFixed(2)}</span>
          </div>
          <p className="text-blue-200 text-xs mt-2">
            {permit?.name} {city ? `· ${city}` : ""}
          </p>
          {cityConfig && (
            <p className="text-blue-300 text-xs mt-1">
              Based on {cityConfig.effective_date} fee schedule
            </p>
          )}
        </div>

        {/* Fee Breakdown */}
        <div className="p-6">
          <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-500" />
            Fee Breakdown
          </h4>
          <div className="space-y-0 divide-y divide-gray-100">
            {results.breakdown.map((item, i) => (
              <div key={i} className="flex justify-between items-center py-2.5">
                <span className="text-sm text-gray-600">{item.label}</span>
                <span className="text-sm font-semibold text-gray-800 ml-4">${item.amount.toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between items-center py-3 mt-1">
              <span className="text-sm font-bold text-gray-800">Total Estimated Fee</span>
              <span className="text-base font-extrabold text-[#1d4ed8]">${results.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mx-6 mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700 leading-relaxed">
              This is an <strong>estimate only</strong> based on the official fee schedule. Actual fees may vary 
              based on specific project scope, plan review outcomes, and additional city requirements. 
              Contact the building department for a final fee determination before submitting your application.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex flex-wrap gap-3">
          {portalUrl && (
            <Button asChild className="flex-1 gradient-primary text-white rounded-xl">
              <a href={portalUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Apply for Permit
              </a>
            </Button>
          )}
          <Button variant="outline" onClick={onReset} className="rounded-xl">
            <RotateCcw className="w-4 h-4 mr-2" />
            Calculate Another
          </Button>
        </div>
      </div>
    </motion.div>
  );
}