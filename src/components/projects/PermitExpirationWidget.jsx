import React from "react";
import { AlertTriangle, Clock, CheckCircle2, Calendar } from "lucide-react";
import { differenceInDays, addDays, format } from "date-fns";

function getExpirationInfo(issuedDate) {
  if (!issuedDate) return null;
  const issued = new Date(issuedDate);
  const expiration = addDays(issued, 180);
  const today = new Date();
  const daysRemaining = differenceInDays(expiration, today);
  return { expiration, daysRemaining };
}

function StatusBadge({ daysRemaining }) {
  if (daysRemaining <= 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
        <AlertTriangle className="w-3 h-3" /> Expired
      </span>
    );
  }
  if (daysRemaining <= 60) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
        <Clock className="w-3 h-3" /> {daysRemaining}d left — Expiring Soon
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
      <CheckCircle2 className="w-3 h-3" /> {daysRemaining}d left — Active
    </span>
  );
}

export default function PermitExpirationWidget({ permitRecord, issuedDate, label = "Permit" }) {
  // Support both base44 PermitRecord fields and Supabase weston_permit_records fields (OPEN_DATE, STATUS_NORMALIZED)
  const dateStr = issuedDate || permitRecord?.OPEN_DATE || permitRecord?.issued_date || permitRecord?.created_date;
  const statusNormalized = permitRecord?.STATUS_NORMALIZED;

  // For In Review: permit hasn't been issued yet — 180 days hasn't started
  if (statusNormalized === "In Review") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="w-4 h-4 text-amber-600" />
          <p className="text-sm font-bold text-gray-900">⏳ Permit Pending</p>
        </div>
        <p className="text-xs text-amber-700 leading-relaxed">
          This permit is <strong>In Review</strong>. The 180-day active period begins at issuance. No expiration tracking until permit is issued.
        </p>
      </div>
    );
  }

  // Only track expiration for Active permits
  if (statusNormalized && statusNormalized !== "Active") return null;

  const info = getExpirationInfo(dateStr);

  if (!info) return null;

  const { expiration, daysRemaining } = info;
  const isExpired = daysRemaining <= 0;
  const isWarning = daysRemaining > 0 && daysRemaining <= 60;

  return (
    <div className={`rounded-2xl border p-4 ${
      isExpired ? "bg-red-50 border-red-200" :
      isWarning ? "bg-amber-50 border-amber-200" :
      "bg-green-50 border-green-200"
    }`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Calendar className={`w-4 h-4 flex-shrink-0 ${
            isExpired ? "text-red-600" : isWarning ? "text-amber-600" : "text-green-600"
          }`} />
          <p className="text-sm font-bold text-gray-900">⚠️ Permit Expiration</p>
        </div>
        <StatusBadge daysRemaining={daysRemaining} />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-white/70 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-0.5">Opened</p>
          <p className="text-sm font-semibold text-gray-800">{format(new Date(dateStr), "MMM d, yyyy")}</p>
        </div>
        <div className="bg-white/70 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-0.5">Expires (180 days)</p>
          <p className={`text-sm font-semibold ${isExpired ? "text-red-700" : "text-gray-800"}`}>
            {format(expiration, "MMM d, yyyy")}
          </p>
        </div>
      </div>

      <div className={`rounded-xl p-3 text-xs leading-relaxed ${
        isExpired ? "bg-red-100 text-red-800" :
        isWarning ? "bg-amber-100 text-amber-800" :
        "bg-green-100 text-green-800"
      }`}>
        {isExpired ? (
          <p><strong>This permit has expired.</strong> Contact your building department immediately to discuss reinstatement or a new application.</p>
        ) : isWarning ? (
          <p>⏰ Schedule your next inspection before <strong>{format(expiration, "MMM d, yyyy")}</strong> to keep your permit active.</p>
        ) : (
          <p>Permit active. Florida law requires permits remain active for at least 180 days. Schedule inspections regularly to keep it active.</p>
        )}
      </div>
    </div>
  );
}