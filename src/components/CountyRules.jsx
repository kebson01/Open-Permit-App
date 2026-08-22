import { useState } from "react";
import { Landmark, ChevronDown, ExternalLink, AlertTriangle } from "lucide-react";
import { freshness, verifiedLabel, daysSinceVerified } from "@/lib/countyRules";

const PRIMARY = "#003466";

/**
 * Broward County requirements shown as the county's own words, attributed.
 *
 * Each rule carries its statute reference, the date the entry was last checked,
 * and a link to the issuing authority — so the reader can see who said it and
 * go read it, instead of taking the app's word for a rule it merely repeated.
 */
export default function CountyRules({ rules = [], heading = "What Broward County requires", intro }) {
  if (!rules.length) return null;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eaf1f8]">
          <Landmark className="h-5 w-5" style={{ color: PRIMARY }} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-gray-900">{heading}</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
            {intro || "These rules come from Broward County and the Florida Building Code, not from us. Each one links to the authority that issued it."}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {rules.map(rule => <Rule key={rule.requirement_id} rule={rule} />)}
      </div>
    </section>
  );
}

/**
 * Shown when an entry has gone long enough without a re-check that the reader
 * should not lean on it. Silent while the entry is fresh — a badge on every
 * rule would train people to ignore it.
 */
function StaleFlag({ rule }) {
  const state = freshness(rule);
  if (state === "fresh") return null;

  const days = daysSinceVerified(rule);
  const label = state === "unknown"
    ? "Re-check date unknown"
    : state === "stale"
      ? `Not re-checked in ${Math.floor(days / 30)} months`
      : "Due for a re-check";

  return (
    <span
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-semibold"
      style={{ background: "#fdf1e0", color: "#9a5b06" }}
      title="Confirm this against the source before relying on it."
    >
      <AlertTriangle className="h-3 w-3" /> {label}
    </span>
  );
}

function Rule({ rule }) {
  const [open, setOpen] = useState(false);
  const numbers = Array.isArray(rule.key_numbers) ? rule.key_numbers : [];
  const hasDetail = numbers.length > 0 || !!rule.summary;

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50">
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        disabled={!hasDetail}
        className="flex w-full items-start gap-3 p-3 text-left disabled:cursor-default"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-gray-900">{rule.title}</span>
          {rule.short_summary && (
            <span className="mt-0.5 block text-xs leading-relaxed text-gray-600">{rule.short_summary}</span>
          )}
        </span>
        {hasDetail && (
          <ChevronDown
            className={`mt-0.5 h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {open && hasDetail && (
        <div className="border-t border-gray-100 px-3 pb-3 pt-2.5">
          {rule.summary && (
            <p className="text-xs leading-relaxed text-gray-700">{rule.summary}</p>
          )}
          {numbers.length > 0 && (
            <ul className="mt-2.5 space-y-1">
              {numbers.map((n, i) => (
                <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-gray-700">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gray-400" />
                  {n}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Attribution stays visible whether or not the detail is open. */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-gray-100 px-3 py-2 text-[11px] text-gray-500">
        {rule.statute_ref && <span className="font-medium text-gray-600">{rule.statute_ref}</span>}
        {rule.effective_date && rule.effective_date !== "Ongoing" && (
          <>
            <span aria-hidden="true">·</span>
            <span>Effective {rule.effective_date}</span>
          </>
        )}
        {verifiedLabel(rule) && (
          <>
            <span aria-hidden="true">·</span>
            <span>Checked {verifiedLabel(rule)}</span>
          </>
        )}
        <StaleFlag rule={rule} />
        {rule.source_url && (
          <a
            href={rule.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex items-center gap-1 font-semibold no-underline hover:underline"
            style={{ color: PRIMARY }}
          >
            Read the source <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}
