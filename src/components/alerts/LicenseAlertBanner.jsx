/**
 * LicenseAlertBanner
 * Displays dismissible in-app alerts for expiring/expired licenses and inactive registrations.
 * Pass `alerts` from useLicenseAlerts hook.
 */
import React, { useState } from "react";
import { AlertTriangle, XCircle, X, ShieldAlert, Link } from "lucide-react";

const SEVERITY_CONFIG = {
  expired:  { bg: "bg-red-50",    border: "border-red-300",    icon: XCircle,       iconColor: "text-red-500",    badge: "bg-red-100 text-red-700",    label: "Expired"  },
  critical: { bg: "bg-orange-50", border: "border-orange-300", icon: AlertTriangle,  iconColor: "text-orange-500", badge: "bg-orange-100 text-orange-700", label: "Urgent"  },
  warning:  { bg: "bg-yellow-50", border: "border-yellow-300", icon: AlertTriangle,  iconColor: "text-yellow-600", badge: "bg-yellow-100 text-yellow-700", label: "Expiring Soon" },
  info:     { bg: "bg-blue-50",   border: "border-blue-200",   icon: ShieldAlert,    iconColor: "text-blue-500",   badge: "bg-blue-100 text-blue-700",    label: "Notice"  },
};

export default function LicenseAlertBanner({ alerts = [], compact = false }) {
  const [dismissed, setDismissed] = useState(new Set());

  const visible = alerts.filter(a => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  // In compact mode: just a summary badge
  if (compact) {
    const hasExpired  = visible.some(a => a.severity === "expired");
    const hasCritical = visible.some(a => a.severity === "critical");
    const color = hasExpired || hasCritical ? "bg-red-100 text-red-700 border-red-200" : "bg-yellow-100 text-yellow-700 border-yellow-200";
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${color}`}>
        <AlertTriangle className="w-3 h-3" />
        {visible.length} License Alert{visible.length > 1 ? "s" : ""}
      </span>
    );
  }

  return (
    <div className="space-y-2">
      {visible.map(alert => {
        const cfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info;
        const Icon = cfg.icon;
        return (
          <div key={alert.id} className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${cfg.bg} ${cfg.border}`}>
            <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${cfg.iconColor}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-gray-900">{alert.label}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">{alert.detail}</p>
              {alert.source === "contractor_profiles" && (
                <a href="/MyAccount" className="text-xs font-semibold text-blue-600 hover:underline mt-1 inline-block">
                  Update in My Account →
                </a>
              )}
            </div>
            <button onClick={() => setDismissed(s => new Set([...s, alert.id]))}
              className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors mt-0.5">
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}