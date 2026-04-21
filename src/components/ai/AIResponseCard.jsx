import React, { useState } from "react";
import { ChevronDown, ChevronRight, ExternalLink, Square } from "lucide-react";

function CollapsibleSection({ emoji, title, count, children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-white hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">{emoji}</span>
          <span className="text-xs font-semibold text-gray-800">{title}</span>
          {count != null && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#EFF6FF", color: "#1D4ED8" }}>
              {count}
            </span>
          )}
        </div>
        {open
          ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          : <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        }
      </button>
      {open && (
        <div className="px-3 pb-3 pt-1 bg-white border-t border-gray-50">
          {children}
        </div>
      )}
    </div>
  );
}

function DocumentItem({ plain_name, official_name }) {
  const [checked, setChecked] = useState(false);
  return (
    <li
      onClick={() => setChecked(c => !c)}
      className="flex items-start gap-2 py-1.5 cursor-pointer group"
    >
      <div className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 rounded border flex items-center justify-center transition-colors ${checked ? "bg-blue-600 border-blue-600" : "border-gray-300 group-hover:border-blue-400"}`}>
        {checked && <span className="text-white text-[9px] font-bold">✓</span>}
      </div>
      <div className={checked ? "opacity-50" : ""}>
        <p className={`text-xs font-medium leading-snug ${checked ? "line-through text-gray-400" : "text-gray-800"}`}>{plain_name}</p>
        {official_name && official_name !== plain_name && (
          <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{official_name}</p>
        )}
      </div>
    </li>
  );
}

export default function AIResponseCard({ structured }) {
  // Fallback: plain text response
  if (structured.is_plain_text) {
    return (
      <p className="text-sm text-gray-800 leading-relaxed">{structured.plain_text_reply || structured.direct_answer}</p>
    );
  }

  const { direct_answer, quick_facts, documents, requirements, zoning_info, zoning_url, caveats, portal_url } = structured;

  const hasDocuments = documents && documents.length > 0;
  const hasRequirements = requirements && requirements.length > 0;
  const hasZoning = !!zoning_info;
  const hasCaveats = caveats && caveats.length > 0;

  const facts = [];
  if (quick_facts?.review_time) facts.push({ label: "⏱ Review", value: quick_facts.review_time });
  if (quick_facts?.cost_estimate) facts.push({ label: "💰 Cost", value: quick_facts.cost_estimate });
  if (quick_facts?.contractor_required) facts.push({ label: "🔧 Contractor", value: quick_facts.contractor_required });

  return (
    <div className="space-y-3 w-full">
      {/* 1. Direct answer */}
      <p className="font-bold leading-snug" style={{ fontSize: 15, color: "#0F172A" }}>
        {direct_answer}
      </p>

      {/* 2. Quick facts pills */}
      {facts.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {facts.map((f, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ background: "#EFF6FF", color: "#1D4ED8" }}>
              <span className="opacity-70 text-[10px]">{f.label}:</span> {f.value}
            </span>
          ))}
        </div>
      )}

      {/* 3. Collapsible sections */}
      <div className="space-y-1.5">
        {hasDocuments && (
          <CollapsibleSection emoji="📋" title="Documents needed" count={`${documents.length} items`}>
            <ul className="space-y-0.5">
              {documents.map((doc, i) => (
                <DocumentItem key={i} plain_name={doc.plain_name} official_name={doc.official_name} />
              ))}
            </ul>
            {documents.length >= 6 && (
              <a href="/PermitGuide" className="block mt-2 text-[11px] font-semibold text-blue-600 hover:underline">See all in Permit Guide →</a>
            )}
          </CollapsibleSection>
        )}

        {hasRequirements && (
          <CollapsibleSection emoji="✅" title="Requirements" count={requirements.length}>
            <ul className="space-y-1.5 pt-1">
              {requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                  <span className="text-xs text-gray-700 leading-snug">{req}</span>
                </li>
              ))}
            </ul>
            {requirements.length >= 6 && (
              <a href="/PermitGuide" className="block mt-2 text-[11px] font-semibold text-blue-600 hover:underline">See all in Permit Guide →</a>
            )}
          </CollapsibleSection>
        )}

        {hasZoning && (
          <CollapsibleSection emoji="🔍" title="Zoning & ordinances">
            <p className="text-xs text-gray-700 leading-relaxed pt-1">{zoning_info}</p>
            {zoning_url && (
              <a href={zoning_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 mt-2 text-[11px] font-semibold text-blue-600 hover:underline">
                <ExternalLink className="w-3 h-3" /> View official ordinance
              </a>
            )}
          </CollapsibleSection>
        )}

        {hasCaveats && (
          <CollapsibleSection emoji="⚠️" title="Things to know first">
            <ul className="space-y-1.5 pt-1">
              {caveats.map((c, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-400 text-xs mt-0.5 flex-shrink-0">•</span>
                  <span className="text-xs text-gray-700 leading-snug">{c}</span>
                </li>
              ))}
            </ul>
          </CollapsibleSection>
        )}
      </div>

      {/* 4. Next step button */}
      {portal_url && (
        <a
          href={portal_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          style={{ background: "#3B82F6" }}
        >
          Ready to apply? Start your application →
        </a>
      )}

      {/* 5. Disclaimer */}
      <p className="text-center italic" style={{ fontSize: 11, color: "#94A3B8" }}>
        Always verify with your local building department.
      </p>
    </div>
  );
}