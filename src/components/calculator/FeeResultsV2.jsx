import React from "react";
import { DollarSign, AlertTriangle, ExternalLink, RotateCcw, FileText, Printer, ClipboardCopy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useState } from "react";

export default function FeeResultsV2({ results, permit, city, cityConfig, onReset }) {
  const [copied, setCopied] = useState(false);
  if (!results) return null;

  const portalUrl = cityConfig?.portal_url;
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const handlePrint = () => {
    const lines = [
      `OpenPermit — Fee Estimate`,
      `Generated: ${today}`,
      ``,
      `City: ${city || "—"}`,
      `Permit Type: ${permit?.name || "—"}`,
      ``,
      `--- Fee Breakdown ---`,
      ...results.breakdown.map(i => `${i.label}: $${i.amount.toFixed(2)}`),
      ``,
      `Total Estimated Fee: $${results.total.toFixed(2)}`,
      ``,
      `DISCLAIMER: This estimate is provided for informational purposes only.`,
      `Final fees are determined at permit issuance per ${city || "your"} Building Department.`,
    ].join("\n");

    const win = window.open("", "_blank");
    win.document.write(`<html><head><title>Fee Estimate — ${city}</title><style>
      body { font-family: monospace; white-space: pre; padding: 40px; font-size: 14px; }
    </style></head><body>${lines.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</body></html>`);
    win.document.close();
    win.focus();
    win.print();
  };

  const handleCopy = () => {
    const lines = [
      `OpenPermit Fee Estimate — ${today}`,
      `City: ${city || "—"}  |  Permit: ${permit?.name || "—"}`,
      ``,
      ...results.breakdown.map(i => `  ${i.label}: $${i.amount.toFixed(2)}`),
      ``,
      `Total: $${results.total.toFixed(2)}`,
      ``,
      `Estimate only. Final fees determined at permit issuance.`,
    ].join("\n");
    navigator.clipboard.writeText(lines).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8"
    >
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
        {/* Total Header */}
        <div className="px-6 py-7 text-center" style={{ background: "linear-gradient(135deg, #0D2B5E 0%, #0F3575 100%)" }}>
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
        <div className="px-6 pb-6 space-y-3">
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handlePrint} className="rounded-xl flex-1">
              <Printer className="w-4 h-4 mr-2" />
              Print Estimate
            </Button>
            <Button variant="outline" onClick={handleCopy} className="rounded-xl flex-1">
              {copied ? <Check className="w-4 h-4 mr-2 text-green-600" /> : <ClipboardCopy className="w-4 h-4 mr-2" />}
              {copied ? "Copied!" : "Copy to Clipboard"}
            </Button>
          </div>
          <div className="flex flex-wrap gap-3">
            {portalUrl && (
              <Button asChild className="flex-1 text-white rounded-xl" style={{ background: "linear-gradient(135deg, #0D2B5E 0%, #0F3575 100%)" }}>
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
          <p className="text-xs text-gray-400 text-center pt-1">
            Fee transparency required by Florida HB 683
          </p>
        </div>
      </div>
    </motion.div>
  );
}