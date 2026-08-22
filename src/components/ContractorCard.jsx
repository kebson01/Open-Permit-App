import { useState } from "react";
import { Phone, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

const PRIMARY = "#003466";

// DBPR has no deep-linkable licence page, so this opens their search with the
// number shown alongside for the reader to paste.
const DBPR_SEARCH = "https://www.myfloridalicense.com/wl11.asp?mode=0&SID=";

/**
 * One licensed contractor, shared by the camera scan and the contractor search.
 *
 * The DBPR file records the licence holder, not the business — so a homeowner
 * sees "BERMUDEZ, CESAR AUGUSTO" when the van outside says M&R Priority
 * Electric. Both are shown, trading name first.
 *
 * There is no phone in the licence data; it is matched on demand and never
 * stored. The licence number is the part that always works, and the part worth
 * checking before anyone starts.
 */
export default function ContractorCard({ c }) {
  const [phone, setPhone] = useState(null);
  const [loading, setLoading] = useState(false);

  const trading = c.dba || c.name;
  const holder = c.dba && c.dba !== c.name ? c.name : null;

  const findPhone = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke("provider-contact-lookup", {
        body: { name: trading, address: c.address || "", city: c.city || "", state: "FL" },
      });
      setPhone(data || { found: false, message: "Lookup failed. Try again." });
    } catch {
      setPhone({ found: false, message: "Lookup failed. Try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-b border-gray-100 py-3 last:border-b-0">
      <div className="flex items-baseline gap-2">
        <p className="min-w-0 flex-1 text-sm font-semibold text-gray-900">{trading}</p>
        {c.locality === "in_city" && (
          <span className="shrink-0 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">
            In {c.city}
          </span>
        )}
      </div>

      {holder && <p className="text-xs text-gray-500">Licence held by {holder}</p>}

      <p className="mt-0.5 text-xs text-gray-500">
        {[c.license_type, c.city, c.expires && `licence current to ${c.expires}`]
          .filter(Boolean).join(" · ")}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {c.license && (
          <a
            href={DBPR_SEARCH}
            target="_blank"
            rel="noopener noreferrer"
            title="Opens DBPR's licence search — search by licence number"
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-[11px] font-semibold text-gray-700 no-underline hover:bg-gray-50"
          >
            Verify {c.license} <ExternalLink className="h-3 w-3" />
          </a>
        )}

        {phone === null ? (
          <button
            onClick={findPhone}
            disabled={loading}
            className="rounded-lg border border-gray-200 px-2.5 py-1 text-[11px] font-semibold text-gray-700 disabled:opacity-50"
          >
            {loading ? "Looking…" : "Find phone"}
          </button>
        ) : phone.found ? (
          <a
            href={`tel:${phone.phone || phone.display_phone}`}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-white no-underline"
            style={{ background: PRIMARY }}
          >
            <Phone className="h-3 w-3" /> {phone.display_phone || phone.phone}
          </a>
        ) : (
          <span className="text-[11px] text-gray-500">{phone.message}</span>
        )}
      </div>
    </div>
  );
}
