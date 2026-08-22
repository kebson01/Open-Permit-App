import { useState } from "react";
import { HelpCircle, ExternalLink, ChevronDown } from "lucide-react";
import { useDocumentExplainers, explainDocument } from "@/lib/documentExplainers";

const PRIMARY = "#003466";

/**
 * A permit's document checklist, where each item can say what it actually is.
 *
 * A list that reads "Product Approval (with highlighted components for
 * installation)" and stops there has not helped anyone who has not done this
 * before. Items with an explainer get a tappable "what's this?" affordance;
 * items without one render exactly as the city wrote them.
 */
export default function DocumentList({ documents = [], emptyText }) {
  const explainers = useDocumentExplainers();

  if (!documents.length) {
    return emptyText ? <p className="text-sm italic text-gray-400">{emptyText}</p> : null;
  }

  return (
    <ul className="space-y-1.5">
      {documents.map((doc, i) => (
        <DocumentItem key={i} name={doc} explainer={explainDocument(doc, explainers)} />
      ))}
    </ul>
  );
}

function DocumentItem({ name, explainer }) {
  const [open, setOpen] = useState(false);

  if (!explainer) {
    return (
      <li className="flex items-start gap-2 text-sm leading-relaxed text-gray-600">
        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gray-400" />
        <span>{name}</span>
      </li>
    );
  }

  return (
    <li className="rounded-lg border border-transparent transition-colors hover:border-gray-200">
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="flex w-full items-start gap-2 rounded-lg px-1.5 py-1 text-left"
      >
        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gray-400" />
        <span className="min-w-0 flex-1 text-sm leading-relaxed text-gray-700">{name}</span>
        <span
          className="mt-0.5 inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[11px] font-semibold"
          style={{ color: PRIMARY }}
        >
          <HelpCircle className="h-3.5 w-3.5" />
          {open ? "hide" : "what's this?"}
          <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      {open && (
        <div className="ml-5 mb-2 mr-1.5 rounded-lg bg-gray-50 p-3">
          {explainer.plain_name && (
            <p className="text-xs font-bold text-gray-900">{explainer.plain_name}</p>
          )}
          {explainer.plain_description && (
            <p className="mt-1 text-xs leading-relaxed text-gray-700">{explainer.plain_description}</p>
          )}
          {explainer.where_to_get && (
            <p className="mt-2 text-xs leading-relaxed text-gray-600">
              <span className="font-semibold text-gray-800">Where to get it: </span>
              {explainer.where_to_get}
            </p>
          )}
          {explainer.download_url && (
            <a
              href={explainer.download_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold no-underline hover:underline"
              style={{ color: PRIMARY }}
            >
              Go to the form <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      )}
    </li>
  );
}
