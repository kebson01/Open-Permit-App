// Shared layout for the static legal / info pages (Privacy, Terms, Accessibility).
// Keeps typography and spacing consistent with the rest of the app.
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PRIMARY = "#003466";
const HEADING = "'Hanken Grotesk', system-ui, sans-serif";
const BODY = "'Public Sans', system-ui, sans-serif";

export default function LegalPage({ title, lastUpdated, children }) {
  return (
    <div className="min-h-screen" style={{ background: "#f7f9fb" }}>
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold no-underline"
          style={{ color: PRIMARY, fontFamily: BODY }}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <h1 className="mt-6 text-3xl font-extrabold" style={{ fontFamily: HEADING, color: "#191B23" }}>
          {title}
        </h1>
        {lastUpdated && (
          <p className="mt-1 text-sm text-gray-500" style={{ fontFamily: BODY }}>
            Last updated: {lastUpdated}
          </p>
        )}

        <div className="legal-prose mt-6 space-y-5 text-[15px] leading-relaxed text-[#333]" style={{ fontFamily: BODY }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// Small helpers so each page reads cleanly.
export function Section({ heading, children }) {
  return (
    <section>
      <h2 className="mb-2 text-lg font-bold" style={{ fontFamily: HEADING, color: PRIMARY }}>
        {heading}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
