import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { DollarSign, AlertTriangle, ExternalLink, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function FeeResults({ results, city, onReset }) {
  if (!results) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8"
    >
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
        {/* Total */}
        <div className="gradient-primary px-6 py-6 text-center">
          <p className="text-blue-200 text-sm mb-1">Estimated Total Fee</p>
          <div className="flex items-center justify-center gap-2">
            <DollarSign className="w-8 h-8 text-[#ffcc00]" />
            <span className="text-4xl font-extrabold text-white">{results.total.toFixed(2)}</span>
          </div>
          <p className="text-blue-200 text-xs mt-2">{city ? `Fee schedule for ${city}` : "General estimate"}</p>
        </div>

        {/* Breakdown */}
        <div className="p-6">
          <h4 className="font-bold text-gray-800 mb-4">Fee Breakdown</h4>
          <div className="space-y-2.5">
            {results.breakdown.map((item, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-600">{item.label}</span>
                <span className="text-sm font-semibold text-gray-800">${item.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mx-6 mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700 leading-relaxed">
              This is an <strong>estimate only</strong>. Actual fees may vary based on specific project details, 
              plan review requirements, and current city fee schedules. Contact your local building department 
              for official fee calculations.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          {city && (
            <Button asChild className="flex-1 gradient-primary text-white rounded-xl">
              <a href={`https://www.google.com/search?q=${encodeURIComponent(city + " FL building permit application")}`} target="_blank" rel="noopener noreferrer">
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