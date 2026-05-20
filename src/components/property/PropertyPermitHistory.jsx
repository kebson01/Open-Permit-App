import { useState, useEffect } from "react";
import * as db from "@/lib/db";
import { ClipboardList, Loader2, Plus, ChevronDown, ChevronUp, Wrench, Zap, Droplets, Flame, Home, RotateCcw, Trash2, Fence, Waves, Building2, FileCheck, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const PERMIT_ICONS = {
  building: Home,
  electrical: Zap,
  plumbing: Droplets,
  mechanical: Wrench,
  roofing: Home,
  demolition: Trash2,
  fence: Fence,
  pool: Waves,
  addition: Building2,
  remodel: RotateCcw,
  fire: Flame,
  certificate_of_occupancy: FileCheck,
  other: HelpCircle,
};

const STATUS_COLORS = {
  issued: "bg-blue-100 text-blue-700",
  finaled: "bg-green-100 text-green-700",
  expired: "bg-gray-100 text-gray-600",
  voided: "bg-red-100 text-red-600",
  in_review: "bg-yellow-100 text-yellow-700",
  pending: "bg-orange-100 text-orange-700",
};

const TYPE_COLORS = {
  building: "bg-indigo-50 text-indigo-700",
  electrical: "bg-yellow-50 text-yellow-700",
  plumbing: "bg-blue-50 text-blue-700",
  mechanical: "bg-slate-50 text-slate-700",
  roofing: "bg-orange-50 text-orange-700",
  demolition: "bg-red-50 text-red-700",
  fence: "bg-emerald-50 text-emerald-700",
  pool: "bg-cyan-50 text-cyan-700",
  addition: "bg-purple-50 text-purple-700",
  remodel: "bg-pink-50 text-pink-700",
  fire: "bg-red-50 text-red-700",
  certificate_of_occupancy: "bg-green-50 text-green-700",
  other: "bg-gray-50 text-gray-700",
};

function PermitCard({ permit }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = PERMIT_ICONS[permit.permit_type] || HelpCircle;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <button
        className="w-full text-left p-4 flex items-start justify-between gap-3 hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
            <Icon className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-medium text-gray-900 text-sm">
                {permit.permit_description || permit.permit_type?.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
              </span>
              <Badge className={`text-xs ${STATUS_COLORS[permit.status] || "bg-gray-100 text-gray-600"}`}>
                {permit.status?.replace(/_/g, " ")}
              </Badge>
              <Badge className={`text-xs ${TYPE_COLORS[permit.permit_type] || "bg-gray-100 text-gray-600"}`}>
                {permit.permit_type?.replace(/_/g, " ")}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
              <span>{permit.city_name}</span>
              {permit.issued_date && <span>Issued: {permit.issued_date}</span>}
              {permit.finaled_date && <span>Finaled: {permit.finaled_date}</span>}
              {permit.permit_number && <span>#{permit.permit_number}</span>}
            </div>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 mt-1" />}
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {permit.contractor_name && (
            <div><span className="text-gray-500">Contractor: </span><span className="font-medium">{permit.contractor_name}</span></div>
          )}
          {permit.contractor_license && (
            <div><span className="text-gray-500">License: </span><span className="font-medium">{permit.contractor_license}</span></div>
          )}
          {permit.job_value && (
            <div><span className="text-gray-500">Job Value: </span><span className="font-medium">${Number(permit.job_value).toLocaleString()}</span></div>
          )}
          {permit.square_footage && (
            <div><span className="text-gray-500">Sq Ft: </span><span className="font-medium">{permit.square_footage.toLocaleString()}</span></div>
          )}
          {permit.expiration_date && (
            <div><span className="text-gray-500">Expires: </span><span className="font-medium">{permit.expiration_date}</span></div>
          )}
          {permit.notes && (() => {
            const cleaned = permit.notes
              .split("|")
              .map(s => s.trim())
              .filter(s => !/has_open_code_case:\s*(true|false)/i.test(s))
              .join(" | ")
              .trim();
            return cleaned ? (
              <div className="sm:col-span-2"><span className="text-gray-500">Notes: </span><span>{cleaned}</span></div>
            ) : null;
          })()}
        </div>
      )}
    </div>
  );
}

export default function PropertyPermitHistory({ folio_number, city_name }) {
  const [permits, setPermits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!folio_number) return;
    db.PermitRecord.getByFolio(folio_number, city_name || "Weston")
      .then(rows => {
        // Normalize weston_permit_records columns to the expected shape
        const normalized = (rows || []).map(r => ({
          id: r.id || r.RECORD_ID,
          permit_number: r.RECORD_ID || r.permit_number,
          permit_description: r.RECORD_NAME || r.permit_description,
          permit_type: (r.RECORD_MODULE || r.permit_type || "other").toLowerCase().replace(/\s+/g, "_"),
          status: (() => {
            const s = (r.STATUS_NORMALIZED || r.status || "").toLowerCase();
            if (s === "completed") return "finaled";
            if (s === "active") return "issued";
            if (s === "in review") return "in_review";
            if (s === "cancelled") return "voided";
            return s || "issued";
          })(),
          issued_date: r.OPEN_DATE || r.issued_date,
          finaled_date: r.CLOSE_DATE || r.finaled_date,
          city_name: r.city_name || city_name || "Weston",
          contractor_name: r.contractor_name,
          contractor_license: r.contractor_license,
          job_value: r.job_value,
          square_footage: r.square_footage,
          notes: r.PARCEL_NBR ? `Parcel: ${r.PARCEL_NBR}` : r.notes,
        }));
        setPermits(normalized);
      })
      .finally(() => setLoading(false));
  }, [folio_number]);

  // Summary stats
  const stats = {
    total: permits.length,
    finaled: permits.filter(p => p.status === "finaled").length,
    open: permits.filter(p => ["issued", "in_review", "pending"].includes(p.status)).length,
    expired: permits.filter(p => p.status === "expired").length,
  };

  const typeGroups = permits.reduce((acc, p) => {
    acc[p.permit_type] = (acc[p.permit_type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <ClipboardList className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-800">Permit History</h3>
          {!loading && permits.length > 0 && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
              {permits.length} permit{permits.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading permit history...
        </div>
      ) : permits.length === 0 ? (
        <div className="text-center py-6">
          <ClipboardList className="w-10 h-10 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No permit records found for this parcel.</p>
          <p className="text-xs text-gray-300 mt-1">Permit data may not be available for this municipality yet.</p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="text-center bg-gray-50 rounded-lg p-2">
              <p className="text-xl font-bold text-gray-800">{stats.total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
            <div className="text-center bg-green-50 rounded-lg p-2">
              <p className="text-xl font-bold text-green-700">{stats.finaled}</p>
              <p className="text-xs text-gray-500">Finaled</p>
            </div>
            <div className="text-center bg-blue-50 rounded-lg p-2">
              <p className="text-xl font-bold text-blue-700">{stats.open}</p>
              <p className="text-xs text-gray-500">Open</p>
            </div>
            <div className="text-center bg-orange-50 rounded-lg p-2">
              <p className="text-xl font-bold text-orange-700">{stats.expired}</p>
              <p className="text-xs text-gray-500">Expired</p>
            </div>
          </div>

          {/* Type breakdown */}
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.entries(typeGroups).map(([type, count]) => (
              <span key={type} className={`text-xs px-2 py-1 rounded-full font-medium ${TYPE_COLORS[type] || "bg-gray-100 text-gray-600"}`}>
                {type.replace(/_/g, " ")} ({count})
              </span>
            ))}
          </div>

          {/* Permit list */}
          <div className="space-y-2">
            {permits.map(permit => (
              <PermitCard key={permit.id} permit={permit} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}