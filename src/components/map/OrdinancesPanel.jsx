import React, { useState } from "react";
import { X, BookOpen, ExternalLink, Send, Sparkles } from "lucide-react";
import { useCities } from "@/hooks/useCities";
import { C, F, T, RADIUS } from "@/lib/theme";

/**
 * The city's own published rules, and a way to ask about them.
 *
 * This used to hold a hardcoded map of five cities' code libraries and fall
 * back to *Weston's* for everyone else — so a reader in Margate was shown
 * Weston's code presented as their own, and the question sent to the assistant
 * read "Looking at the Margate Code of Ordinances at <Weston's URL>".
 *
 * The links now come from cities.ordinance_url, which is populated for all 31.
 * But only a handful of those are genuine code libraries: cities.ordinance_platform
 * marks the rest as a building-department page. Calling a department page a
 * "Code of Ordinances" would just be a second false claim, so the label and the
 * question sent to the assistant both follow the platform.
 */
const CODE_LIBRARIES = ["Municode", "American Legal Publishing"];

const EXAMPLE_QUESTIONS = [
  "What are the setback requirements for fences?",
  "What's the maximum height for a shed?",
  "Can I run a business from my home?",
  "What are the pool barrier requirements?",
];

export default function OrdinancesPanel({ open, onClose, city, onAskAI }) {
  const [question, setQuestion] = useState("");
  const { cities } = useCities();

  const cityRow = cities.find(c => c.name === city) || null;
  const url = cityRow?.ordinance_url || "";
  const platform = cityRow?.ordinance_platform || "";
  const isCode = CODE_LIBRARIES.includes(platform);

  const title = isCode ? "Code of Ordinances" : "City building department";
  const linkLabel = isCode ? "Open the code of ordinances" : `Open ${city}'s building department`;

  const explainer = isCode
    ? `${city} publishes its full code — zoning, building standards, land use — in an online library. This opens it.`
    : `We don't have a direct link to ${city}'s code library, so this opens their building department instead. They can point you to the ordinance that applies.`;

  const handleAsk = (q) => {
    const text = (q || question).trim();
    if (!text) return;
    // Only claim to be reading a code of ordinances when the link actually is
    // one; otherwise ask the question without asserting a source.
    const prompt = isCode && url
      ? `Looking at the ${city} Code of Ordinances at ${url}, ${text}`
      : `For a property in ${city}, Florida: ${text}`;
    onAskAI(prompt);
    setQuestion("");
    onClose();
  };

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />}

      <div
        role="dialog"
        aria-label={title}
        aria-hidden={!open}
        inert={open ? undefined : ""}
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] shadow-2xl z-50 transform transition-transform duration-300 flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ background: C.surface, fontFamily: F.body }}
      >
        {/* Header */}
        <div
          className="px-5 py-4 flex items-start justify-between flex-shrink-0"
          style={{ background: C.brand }}
        >
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <BookOpen className="w-4 h-4" style={{ color: "rgba(255,255,255,0.75)" }} aria-hidden="true" />
              <h3 className="text-white" style={{ fontFamily: F.head, fontSize: T.body, fontWeight: 700 }}>
                {title}
              </h3>
            </div>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: T.caption }}>{city}, FL</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          <p style={{ color: C.muted, fontSize: T.small, lineHeight: 1.6 }}>{explainer}</p>

          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full px-4 py-3 text-white no-underline transition-opacity hover:opacity-90"
              style={{ background: C.brand, borderRadius: RADIUS, fontFamily: F.head, fontSize: T.small, fontWeight: 700 }}
            >
              <span className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" aria-hidden="true" />
                {linkLabel}
              </span>
              <ExternalLink className="w-4 h-4 opacity-70" aria-hidden="true" />
            </a>
          ) : (
            <p
              className="px-4 py-3"
              style={{ background: C.warnSoft, color: C.warn, borderRadius: RADIUS, fontSize: T.small, lineHeight: 1.6 }}
            >
              We don&rsquo;t have a link on file for {city}. Search for the city&rsquo;s building
              department directly.
            </p>
          )}

          {/* Ask */}
          <div>
            <label
              htmlFor="ordinance-question"
              className="block mb-2"
              style={{ color: C.ink, fontFamily: F.head, fontSize: T.caption, fontWeight: 700 }}
            >
              <Sparkles className="w-3.5 h-3.5 inline mr-1" style={{ color: C.brand }} aria-hidden="true" />
              Ask about a local rule
            </label>
            <div className="flex gap-2">
              <input
                id="ordinance-question"
                type="text"
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAsk()}
                placeholder="e.g. What are the setback rules for pools?"
                className="flex-1 px-3 py-2 focus:outline-none"
                style={{ border: `1px solid ${C.line}`, borderRadius: RADIUS, fontSize: T.small, color: C.ink }}
              />
              <button
                onClick={() => handleAsk()}
                disabled={!question.trim()}
                aria-label="Ask"
                className="px-3 py-2 text-white disabled:opacity-35 transition-opacity hover:opacity-90 flex-shrink-0"
                style={{ background: C.brand, borderRadius: RADIUS }}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Example questions */}
          <div>
            <p
              className="mb-2 uppercase"
              style={{ color: C.faint, fontFamily: F.head, fontSize: T.caption, fontWeight: 700, letterSpacing: "0.06em" }}
            >
              Example questions
            </p>
            <div className="space-y-2">
              {EXAMPLE_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleAsk(q)}
                  className="w-full text-left px-3 py-2.5 transition-colors hover:brightness-95"
                  style={{
                    border: `1px solid ${C.line}`,
                    background: C.ground,
                    borderRadius: RADIUS,
                    color: C.ink,
                    fontSize: T.small,
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <p style={{ color: C.faint, fontSize: T.caption, lineHeight: 1.6 }}>
            Answers are generated, not quoted from the ordinance. Verify anything you intend to
            rely on with the {city} building department.
          </p>
        </div>
      </div>
    </>
  );
}
