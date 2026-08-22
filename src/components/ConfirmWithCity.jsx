import { AlertTriangle, Phone, ExternalLink } from "lucide-react";
import { useCities } from "@/hooks/useCities";

/**
 * The verification line that has to sit under any answer the app derives
 * rather than reads — above all the camera scan, which identifies an object
 * from one photograph and can return "no permit needed".
 *
 * Reads the building department straight from `cities`, so it works for all
 * 31 municipalities rather than the handful hardcoded elsewhere.
 *
 * @param {string}  city        City the answer was resolved for. Falsy = GPS failed.
 * @param {boolean} permitFound Whether a permit was matched, which changes the stakes.
 */
export default function ConfirmWithCity({ city, permitFound }) {
  const { cities } = useCities();
  const row = city ? cities.find(c => c.name === city) : null;

  const phone  = row?.building_department_phone;
  const portal = row?.portal_url;

  const body = !city
    ? "We couldn't tell which city you're in, so this answer isn't tied to your local rules. Check with your building department before starting work."
    : permitFound
      ? `This is a starting point, not a determination. Confirm the exact requirements with ${city} before you pay for plans, materials or a contractor.`
      : `This is an AI reading of one photo, not a determination. Permit rules turn on details a photo can't show. Check with ${city} before you start — work done without a required permit can mean a stop-work order and fines.`;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-amber-900">
            {city ? `Confirm with ${city} before you build` : "Confirm with your building department"}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-amber-800">{body}</p>

          {(portal || phone) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {portal && (
                <a
                  href={portal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-900 px-3 py-1.5 text-xs font-semibold text-white no-underline transition-opacity hover:opacity-90"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> {city} Building Department
                </a>
              )}
              {phone && (
                <a
                  href={`tel:${phone.replace(/[^0-9]/g, "")}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 no-underline transition-colors hover:bg-amber-100"
                >
                  <Phone className="h-3.5 w-3.5" /> {phone}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
