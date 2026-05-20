import { useState } from "react";
import { ArrowLeft, MapPin, Home, Building2, ClipboardList, Loader2, AlertTriangle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import PropertyCityPanel from "@/components/property/PropertyCityPanel";
import PropertyAIChat from "@/components/property/PropertyAIChat";

const STATUS_STYLES = {
  "Closed":     { bg: "#DCFCE7", color: "#166534" },
  "Finaled":    { bg: "#DCFCE7", color: "#166534" },
  "Completed":  { bg: "#DCFCE7", color: "#166534" },
  "Open":       { bg: "#EFF6FF", color: "#1D4ED8" },
  "Issued":     { bg: "#EFF6FF", color: "#1D4ED8" },
  "Active":     { bg: "#EFF6FF", color: "#1D4ED8" },
  "In Review":  { bg: "#FFFBEB", color: "#92400E" },
  "Expired":    { bg: "#FEE2E2", color: "#991B1B" },
  "Void":       { bg: "#F1F5F9", color: "#475569" },
  "Voided":     { bg: "#F1F5F9", color: "#475569" },
  "Cancelled":  { bg: "#F1F5F9", color: "#475569" },
};

function Row({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right max-w-[60%]">{value}</span>
    </div>
  );
}

function PermitHistoryTable({ permitData, loading }) {
  const { records = [], noData = false, cityName, portalUrl } = permitData || {};

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <ClipboardList className="w-4 h-4 text-blue-600" />
        <h3 className="font-semibold text-gray-800 text-sm">Permit History</h3>
        {!loading && records.length > 0 && (
          <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {records.length} record{records.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 text-gray-400 py-8">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading permits...
        </div>
      ) : noData ? (
        <div className="text-center py-10 px-4">
          <p className="text-gray-700 font-medium">Permit history coming soon</p>
          <p className="text-gray-400 text-sm mt-1">Search directly at the city's permit portal for current records.</p>
          {portalUrl && (
            <a href={portalUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-3 text-sm text-blue-600 hover:underline font-medium">
              <ExternalLink className="w-3.5 h-3.5" /> {cityName} Permit Portal →
            </a>
          )}
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-600 font-medium">No permit records found</p>
          <p className="text-gray-400 text-sm mt-1 max-w-xs mx-auto">No permitted work on file, or records may predate our database.</p>
        </div>
      ) : (
        <>
          {/* Open code violation warning */}
          {records.some(p => p.has_open_code_case) && (
            <div className="mx-4 mb-3 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
              <span className="text-sm flex-shrink-0">⚠️</span>
              <p className="text-xs font-semibold text-red-800">Open code violation on this property. Resolve before applying for new permits.</p>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Record ID", "Type", "Status", "Opened"].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {records.map((p, i) => {
                  const sn = p.status_normalized || p.permit_status || "";
                  const style = STATUS_STYLES[sn] || STATUS_STYLES[
                    sn === "Closed" || sn === "Finaled" ? "Completed" :
                    sn === "Open" || sn === "Issued" ? "Active" : sn
                  ] || { bg: "#F1F5F9", color: "#475569" };
                  return (
                    <tr key={p.permit_number || i} className="hover:bg-blue-50/30">
                      <td className="px-4 py-2.5 font-mono text-xs text-blue-700 whitespace-nowrap">
                        {p.permit_number || "—"}
                        {p.has_open_code_case && <span className="ml-1 text-red-500" title="Open code violation">⚠</span>}
                      </td>
                      <td className="px-4 py-2.5 text-gray-700 max-w-xs">
                        <span className="line-clamp-1">{p.permit_name || p.permit_type || "—"}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
                          style={{ backgroundColor: style.bg, color: style.color }}>
                          {p.permit_status || p.status_normalized || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-400 whitespace-nowrap">{p.open_date || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default function PropertyDetail({ property: p, permitData, permitsLoading, onBack }) {
  const address = p.full_address || p.FOLIO_NUMBER;
  const city = p.city_name || "";
  const zip = p.zip_code || p.SITUS_ZIP_CODE || "";

  return (
    <div>
      <Button variant="ghost" onClick={onBack} className="mb-4 -ml-2 text-gray-600">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to results
      </Button>

      {/* Property header */}
      <div className="rounded-2xl p-5 mb-5 text-white" style={{ background: "linear-gradient(135deg, #0D2B5E, #0F3575)" }}>
        <div className="flex items-start gap-3">
          <Building2 className="w-6 h-6 text-blue-300 flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="text-xl font-bold leading-tight">{address}</h2>
            <p className="text-blue-200 text-sm mt-0.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {city}{zip ? `, FL ${zip}` : city ? ", FL" : ""}
            </p>
            <p className="text-blue-300 text-xs mt-1 font-mono">Folio: {p.folio_number || p.FOLIO_NUMBER}</p>
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid sm:grid-cols-2 gap-4 mb-5">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Property Type</h3>
          <Row label="Use Type" value={p.USE_TYPE || p.use_type} />
          <Row label="Use Code" value={p.USE_CODE || p.use_code} />
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Building Details</h3>
          <Row label="Year Built" value={p.year_built || p.BLDG_YEAR_BUILT} />
          <Row label="Total Sq Ft" value={p.total_sqft ? Number(p.total_sqft).toLocaleString() : null} />
          <Row label="Under Air" value={p.under_air_sqft ? Number(p.under_air_sqft).toLocaleString() : null} />
          <Row label="Beds / Baths" value={(p.beds || p.baths) ? `${p.beds || "—"} / ${p.baths || "—"}` : null} />
        </div>
      </div>

      {/* Permit History */}
      <PermitHistoryTable permitData={permitData} loading={permitsLoading} />

      {/* City panel */}
      <PropertyCityPanel property={p} />

      {/* AI chat */}
      <PropertyAIChat property={p} permits={permitData?.records || []} />
    </div>
  );
}