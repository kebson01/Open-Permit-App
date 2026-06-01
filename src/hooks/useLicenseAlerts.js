/**
 * useLicenseAlerts
 * Reads contractor_profiles and private_provider_firms from Supabase for the
 * current user, then returns an array of alert objects for any license or
 * registration that is expired, inactive, or expiring this calendar year or next.
 */
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

const THIS_YEAR = new Date().getFullYear();
const NEXT_YEAR = THIS_YEAR + 1;

/** Returns true if the date falls within this year or next year (or is already past). */
function isExpiringSoon(dateStr) {
  if (!dateStr) return false;
  const exp = new Date(dateStr);
  const year = exp.getFullYear();
  return year <= NEXT_YEAR; // past, this year, or next year
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
}

function severity(dateStr) {
  const d = daysUntil(dateStr);
  if (d === null) return "info";
  if (d < 0) return "expired";
  if (d <= 30) return "critical";
  if (d <= 90) return "warning";
  return "info";
}

export function useLicenseAlerts(userEmail) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userEmail) { setAlerts([]); setLoading(false); return; }

    async function load() {
      setLoading(true);
      const found = [];

      // ── Contractor profiles ──
      const { data: cpRows } = await supabase
        .from("contractor_profiles")
        .select("id,company_name,license_number,license_type,license_expiration,insurance_expiration,status")
        .eq("user_email", userEmail);

      (cpRows || []).forEach(cp => {
        const name = cp.company_name || cp.license_type || "Contractor";

        // status inactive
        if (cp.status && cp.status !== "active") {
          found.push({
            id: `cp-status-${cp.id}`,
            type: "contractor",
            label: `${name} — License Status`,
            detail: `Status is "${cp.status}". Reactivate to continue submitting permits.`,
            severity: "critical",
            expirationDate: null,
            source: "contractor_profiles",
          });
        }

        // license expiration
        if (isExpiringSoon(cp.license_expiration)) {
          const d = daysUntil(cp.license_expiration);
          found.push({
            id: `cp-lic-${cp.id}`,
            type: "contractor",
            label: `${name} — Contractor License`,
            detail: d !== null && d < 0
              ? `License expired ${Math.abs(d)} day${Math.abs(d) !== 1 ? "s" : ""} ago.`
              : `License expires in ${d} day${d !== 1 ? "s" : ""} (${cp.license_expiration}).`,
            severity: severity(cp.license_expiration),
            expirationDate: cp.license_expiration,
            source: "contractor_profiles",
          });
        }

        // insurance expiration
        if (isExpiringSoon(cp.insurance_expiration)) {
          const d = daysUntil(cp.insurance_expiration);
          found.push({
            id: `cp-ins-${cp.id}`,
            type: "contractor",
            label: `${name} — Insurance`,
            detail: d !== null && d < 0
              ? `Insurance expired ${Math.abs(d)} day${Math.abs(d) !== 1 ? "s" : ""} ago.`
              : `Insurance expires in ${d} day${d !== 1 ? "s" : ""} (${cp.insurance_expiration}).`,
            severity: severity(cp.insurance_expiration),
            expirationDate: cp.insurance_expiration,
            source: "contractor_profiles",
          });
        }
      });

      // ── Private provider firms ──
      const { data: ppRows } = await supabase
        .from("private_provider_firms")
        .select("id,firm_name,license_number,status")
        .eq("owner_email", userEmail);

      (ppRows || []).forEach(pp => {
        const name = pp.firm_name || "Private Provider Firm";

        if (pp.status && pp.status !== "active") {
          found.push({
            id: `pp-status-${pp.id}`,
            type: "provider",
            label: `${name} — Firm Status`,
            detail: `Firm status is "${pp.status}". Contact support to reactivate.`,
            severity: "critical",
            expirationDate: null,
            source: "private_provider_firms",
          });
        }
      });

      setAlerts(found);
      setLoading(false);
    }

    load().catch(() => setLoading(false));
  }, [userEmail]);

  return { alerts, loading };
}