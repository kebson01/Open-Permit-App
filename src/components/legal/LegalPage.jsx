// Shared layout for the static legal / info pages (Privacy, Terms, Accessibility).
// Typography and colour come from lib/theme so these read as the same product
// as the rest of the app rather than a bolted-on appendix.
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { C, F, T, RADIUS } from "@/lib/theme";

export default function LegalPage({ title, lastUpdated, children }) {
  return (
    <div className="min-h-screen" style={{ background: C.ground, fontFamily: F.body }}>
      <div className="mx-auto max-w-[720px] px-4 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 no-underline"
          style={{ color: C.brand, fontFamily: F.body, fontSize: T.small, fontWeight: 600 }}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to home
        </Link>

        <h1
          className="mt-5"
          style={{ fontFamily: F.head, fontSize: T.display, fontWeight: 800, letterSpacing: "-0.02em", color: C.ink }}
        >
          {title}
        </h1>
        {lastUpdated && (
          <p className="mt-1" style={{ color: C.faint, fontSize: T.small }}>
            Last updated: {lastUpdated}
          </p>
        )}

        {/* Starter-content notice — remove once legally reviewed. */}
        <div
          className="mt-5 px-4 py-3"
          style={{ background: C.warnSoft, color: C.warn, borderRadius: RADIUS, fontSize: T.small, lineHeight: 1.6 }}
        >
          This is a starter template and has not been reviewed by an attorney. Have legal counsel
          review and adapt it before relying on it.
        </div>

        {/* Running text sits near 65 characters at this width and size. */}
        <div
          className="legal-prose mt-6 space-y-5"
          style={{ color: C.muted, fontSize: T.body, lineHeight: 1.7 }}
        >
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
      <h2
        className="mb-2"
        style={{ fontFamily: F.head, fontSize: T.lead, fontWeight: 800, letterSpacing: "-0.01em", color: C.ink }}
      >
        {heading}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
