import React, { useState } from "react";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";

function CollapsibleSection({ title, count, children, warning }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: warning ? "1px solid #FDE68A" : "1px solid #F3F4F6", borderLeft: warning ? "3px solid #F59E0B" : undefined }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-white hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
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
        <div className="px-3 pb-3 pt-2 bg-white border-t border-gray-50">
          {children}
        </div>
      )}
    </div>
  );
}

// Highlight dollar amounts and numeric thresholds in a string
function HighlightedText({ text }) {
  if (!text) return null;
  const parts = text.split(/(\$[\d,]+(?:\.\d+)?|\d[\d,]*(?:\.\d+)?(?:\s*(?:ft|feet|%))?)/g);
  return (
    <>
      {parts.map((part, i) =>
        /^\$|^\d/.test(part)
          ? <strong key={i} style={{ color: "#1D4ED8" }}>{part}</strong>
          : <span key={i}>{part}</span>
      )}
    </>
  );
}

function DocumentItem({ doc }) {
  const [checked, setChecked] = useState(false);
  return (
    <li
      onClick={() => setChecked(c => !c)}
      className="flex items-start gap-2.5 py-2 border-b border-gray-50 last:border-0 cursor-pointer group"
    >
      <div className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 rounded border flex items-center justify-center transition-colors ${checked ? "bg-blue-600 border-blue-600" : "border-gray-300 group-hover:border-blue-400"}`}>
        {checked && <span className="text-white text-[9px] font-bold">✓</span>}
      </div>
      <div className={`flex-1 min-w-0 ${checked ? "opacity-50" : ""}`}>
        <p className={`text-[13px] font-semibold leading-snug ${checked ? "line-through text-gray-400" : "text-gray-900"}`}>
          {doc.plain_name}
        </p>
        {doc.official_name && doc.official_name !== doc.plain_name && (
          <p className="text-[10px] text-gray-400 mt-0.5">{doc.official_name}</p>
        )}
        {doc.description && (
          <p className="text-[11px] text-gray-500 mt-1 leading-snug">{doc.description}</p>
        )}
        {doc.where_to_get && (
          <p className="text-[11px] mt-1">
            <span className="font-semibold" style={{ color: "#3B82F6" }}>Where to get it: </span>
            <span className="text-gray-600">{doc.where_to_get}</span>
          </p>
        )}
        {doc.download_url && (
          <a
            href={doc.download_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-[10px] font-semibold text-blue-700 border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            Download →
          </a>
        )}
      </div>
    </li>
  );
}

export default function AIResponseCard({ structured }) {
  if (structured.is_plain_text) {
    return (
      <p className="text-sm text-gray-800 leading-relaxed">{structured.plain_text_reply || structured.direct_answer}</p>
    );
  }

  const {
    direct_answer, description, quick_facts,
    documents, requirements, requirements_note,
    zoning_info, zoning_url,
    caveats,
    portal_url, portal_label,
    city_name, dept_phone, dept_hours,
  } = structured;

  const hasDocuments = documents && documents.length > 0;
  const hasRequirements = requirements && requirements.length > 0;
  const hasZoning = !!zoning_info;
  const hasCaveats = caveats && caveats.length > 0;

  const facts = [];
  if (quick_facts?.review_time) facts.push({ label: "Review", value: quick_facts.review_time, navy: false });
  if (quick_facts?.cost_estimate) facts.push({ label: "Cost", value: quick_facts.cost_estimate, navy: false });
  if (quick_facts?.contractor_required) facts.push({ label: "Contractor", value: quick_facts.contractor_required, navy: false });
  if (quick_facts?.how_to_apply) facts.push({ label: "Apply", value: quick_facts.how_to_apply, navy: true });

  return (
    <div className="space-y-3 w-full">
      {/* 1. Direct answer + description */}
      <div>
        <p className="font-bold leading-snug" style={{ fontSize: 15, color: "#0F172A" }}>
          {direct_answer}
        </p>
        {description && (
          <p className="mt-1 leading-snug" style={{ fontSize: 13, color: "#475569" }}>
            {description}
          </p>
        )}
      </div>

      {/* 2. Quick facts pills */}
      {facts.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {facts.map((f, i) => (
            <span
              key={i}
              className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold"
              style={f.navy
                ? { background: "#EFF6FF", color: "#1E3A8A" }
                : { background: "#EFF6FF", color: "#1D4ED8" }
              }
            >
              <span className="opacity-60 mr-1">{f.label}:</span>{f.value}
            </span>
          ))}
        </div>
      )}

      {/* 3. Collapsible sections */}
      <div className="space-y-1.5">
        {hasDocuments && (
          <CollapsibleSection title="Documents needed" count={`${documents.length} items`}>
            <ul className="space-y-0">
              {documents.map((doc, i) => (
                <DocumentItem key={i} doc={doc} />
              ))}
            </ul>
            {documents.length >= 6 && (
              <a href="/PermitGuide" className="block mt-2 text-[11px] font-semibold text-blue-600 hover:underline">See all in Permit Guide →</a>
            )}
          </CollapsibleSection>
        )}

        {hasRequirements && (
          <CollapsibleSection title="Requirements" count={requirements.length}>
            <ul className="space-y-2 pt-1">
              {requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                  <span className="text-xs text-gray-700 leading-snug">
                    <HighlightedText text={req} />
                  </span>
                </li>
              ))}
            </ul>
            {requirements.length >= 6 && (
              <a href="/PermitGuide" className="block mt-2 text-[11px] font-semibold text-blue-600 hover:underline">See all in Permit Guide →</a>
            )}
            {requirements_note && (
              <p className="mt-3 text-[11px] text-gray-400 italic border-t border-gray-50 pt-2">{requirements_note}</p>
            )}
          </CollapsibleSection>
        )}

        {hasZoning && (
          <CollapsibleSection title="Zoning & ordinances">
            <p className="text-xs text-gray-700 leading-relaxed pt-1">
              <HighlightedText text={zoning_info} />
            </p>
            {zoning_url && (
              <a href={zoning_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 mt-2 text-[11px] font-semibold text-blue-600 hover:underline">
                <ExternalLink className="w-3 h-3" /> View official ordinance →
              </a>
            )}
          </CollapsibleSection>
        )}

        {hasCaveats && (
          <CollapsibleSection title="Things to know first" warning>
            <ul className="space-y-2 pt-1">
              {caveats.map((c, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ background: "#F59E0B" }} />
                  <span className="text-xs text-gray-700 leading-snug">{c}</span>
                </li>
              ))}
            </ul>
          </CollapsibleSection>
        )}
      </div>

      {/* 4. Two action buttons */}
      {portal_url && (
        <div className="flex gap-2">
          <a
            href={portal_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ background: "#3B82F6" }}
          >
            {portal_label || "Apply Online →"}
          </a>
          <a
            href="/ProjectDashboard"
            className="flex-1 flex items-center justify-center py-2.5 rounded-xl text-sm font-semibold border border-gray-200 hover:bg-gray-50 transition-colors"
            style={{ color: "#0F172A" }}
          >
            Save to My Project
          </a>
        </div>
      )}

      {/* 5. Building dept contact strip */}
      {dept_phone && (
        <div className="rounded-xl px-3 py-2.5 text-center" style={{ background: "#F8FAFC" }}>
          <span style={{ fontSize: 12, color: "#475569" }}>
            Questions? Call {city_name || "Weston"} Building Department:&nbsp;
            <a href={`tel:${dept_phone.replace(/\D/g, "")}`} className="font-semibold hover:underline" style={{ color: "#475569" }}>{dept_phone}</a>
          </span>
          {dept_hours && (
            <span style={{ fontSize: 12, color: "#94A3B8" }}> · {dept_hours}</span>
          )}
        </div>
      )}

      {/* 6. Disclaimer */}
      <p className="text-center italic" style={{ fontSize: 11, color: "#94A3B8" }}>
        Always verify with your local building department.
      </p>
    </div>
  );
}