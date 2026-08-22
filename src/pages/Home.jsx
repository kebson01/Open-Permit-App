import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Camera, BookOpen, Building2, HardHat, ShieldCheck, Calculator,
  ChevronRight, ChevronDown, Search,
} from "lucide-react";
import AIDrawer from "../components/ai/AIDrawer";
import CityBar from "@/components/CityBar";
import { useCities } from "@/hooks/useCities";
import { resolveCity } from "@/lib/permitTypes";
import { C, F, T, RADIUS, SHADOW } from "@/lib/theme";

/**
 * The start screen.
 *
 * This was a landing page: a stock hero, a three-step "path to approval" for a
 * wizard that does not exist, 22 city cards each repeating the same sentence,
 * and a closing call-to-action pointing at a page already in the tab bar. Six
 * screens of scroll on a phone before anything a homeowner could act on.
 *
 * What someone actually arrives with is one question about one piece of work at
 * one address, so the page is now ordered by that: which city, then ask, then
 * the ways to find out, then the things worth knowing regardless. Coverage is a
 * disclosure rather than a list, because it answers a question almost nobody
 * opens the app to ask.
 */

// Each of these previously cited a bill number and effective date. Verified
// against flsenate.gov and leg.state.fl.us:
//   - "HB 837 - Permit Exemptions (eff. July 1 2024)" - HB 837 (2023) is the
//     Civil Remedies act, effective March 24 2023. Not a permit statute.
//   - "Private Providers (HB 635)" - the mechanism is real and lives at
//     FS 553.791, but that bill number and the "10-15 business days" figure
//     could not be confirmed.
//   - "Permit Expiration - 180 Days" - contradicted by cities we cover;
//     Sunrise requires an approved inspection every 90 days.
// What remains is limited to what a primary source supports.
const LAW_CARDS = [
  {
    title: "You can be your own contractor",
    body: "Owners of a single-family home may act as their own contractor on a residence they will occupy. You must appear in person, sign a disclosure statement, and personally supervise the work on site — and selling within a year of completion voids the exemption.",
    source: "Fla. Stat. 489.103(7)",
  },
  {
    title: "A Notice of Commencement comes first",
    body: "Florida requires an NOC before the first inspection when the contract is over $5,000 — except HVAC repair or replacement under $15,000. Some cities require one sooner.",
    source: "Fla. Stat. 713.135",
  },
  {
    title: "You can hire a private provider",
    body: "Florida lets you hire a licensed private provider to do plans review and inspections instead of waiting on the city, and the city must reduce its fees when you do.",
    source: "Fla. Stat. 553.791",
  },
  {
    title: "Permits expire",
    body: "A permit lapses if work stalls — but the window differs by city, and some run inspection-to-inspection rather than from the issue date. Check yours before assuming you still have time.",
    source: "Varies by city",
  },
];

// Ordered by how a homeowner arrives at the question, not by how the app is
// built. Pointing a camera needs no vocabulary; the guide needs you to
// recognise the part of the house; the rest need you to already know the words.
const ACTIONS = [
  { icon: Camera,    to: "/CameraScan",  title: "Scan an item",               sub: "Point your camera at it and get an answer" },
  { icon: BookOpen,  to: "/PermitGuide", title: "Browse the visual guide",    sub: "Tap a part of the house to see what it needs" },
  { icon: Building2, to: "/property",    title: "Look up a property",         sub: "Zoning and parcel details by address or folio" },
  { icon: HardHat,   to: "/contractors", title: "Find a licensed contractor", sub: "Search the state licence file by trade and city" },
];

const SECONDARY = [
  { icon: ShieldCheck, to: "/ExemptionChecker", label: "Do I need a permit?" },
  { icon: Calculator,  to: "/FeeCalculator",    label: "Estimate the fee" },
];

const AI_CHIPS = [
  "Do I need a fence permit?",
  "What permits for a pool?",
  "Solar panel requirements",
];

function ActionRow({ icon: Icon, to, title, sub }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3.5 px-4 py-3.5 no-underline transition-colors hover:bg-[#f7f9fb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
      style={{ borderBottom: `1px solid ${C.line}` }}
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center"
        style={{ background: C.brandSoft, borderRadius: 10 }}
      >
        <Icon className="h-5 w-5" style={{ color: C.brand }} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block" style={{ color: C.ink, fontFamily: F.head, fontSize: T.body, fontWeight: 700 }}>
          {title}
        </span>
        <span className="block" style={{ color: C.muted, fontFamily: F.body, fontSize: T.small, lineHeight: 1.45 }}>
          {sub}
        </span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0" style={{ color: C.faint }} aria-hidden="true" />
    </Link>
  );
}

function LawCard({ card, open, onToggle }) {
  return (
    <div style={{ borderBottom: `1px solid ${C.line}` }}>
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
      >
        <span className="min-w-0 flex-1" style={{ color: C.ink, fontFamily: F.head, fontSize: T.small, fontWeight: 700 }}>
          {card.title}
        </span>
        <ChevronDown
          className="h-4 w-4 shrink-0 transition-transform"
          style={{ color: C.faint, transform: open ? "rotate(180deg)" : "none" }}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="px-4 pb-3.5">
          <p style={{ color: C.muted, fontFamily: F.body, fontSize: T.small, lineHeight: 1.6 }}>{card.body}</p>
          <p className="mt-1.5" style={{ color: C.faint, fontFamily: F.body, fontSize: T.caption }}>{card.source}</p>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const { cities } = useCities();
  const [city, setCity] = useState(() => resolveCity());
  const [question, setQuestion] = useState("");
  const [aiOpen, setAiOpen] = useState(false);
  const [aiInitialMessage, setAiInitialMessage] = useState("");
  const [openLaw, setOpenLaw] = useState(null);
  const [showCoverage, setShowCoverage] = useState(false);

  const ask = (msg) => { setAiInitialMessage(msg); setAiOpen(true); };
  const submit = () => { if (question.trim()) { ask(question.trim()); setQuestion(""); } };

  // Coverage is whatever the database actually holds — permit_type_count is
  // recomputed from the per-city tables, so this cannot drift the way the old
  // hardcoded six-city list did.
  const covered = cities
    .filter(c => (c.permit_type_count || 0) > 0)
    .sort((a, b) => b.permit_type_count - a.permit_type_count);

  return (
    <div style={{ background: C.ground, fontFamily: F.body, color: C.ink }}>
      <CityBar value={city} onChange={setCity} />

      <div className="mx-auto max-w-[720px] px-4 pb-10 pt-5">

        {/* ── ASK ──────────────────────────────────────────────────── */}
        <h1
          className="mb-3"
          style={{ fontFamily: F.head, fontSize: T.title, fontWeight: 800, letterSpacing: "-0.02em", textWrap: "balance" }}
        >
          What are you planning to do?
        </h1>

        <div
          className="flex items-center gap-2 px-3"
          style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: RADIUS, boxShadow: SHADOW }}
        >
          <Search className="h-4 w-4 shrink-0" style={{ color: C.faint }} aria-hidden="true" />
          <label htmlFor="home-ask" className="sr-only">Ask about a permit</label>
          <input
            id="home-ask"
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Replacing a water heater, adding a fence…"
            className="h-12 min-w-0 flex-1 bg-transparent focus:outline-none"
            style={{ fontFamily: F.body, fontSize: T.body, color: C.ink }}
          />
          <button
            onClick={submit}
            disabled={!question.trim()}
            className="shrink-0 px-3.5 py-1.5 text-white transition-opacity disabled:opacity-35"
            style={{ background: C.brand, borderRadius: 8, fontFamily: F.head, fontSize: T.small, fontWeight: 700 }}
          >
            Ask
          </button>
        </div>

        <div className="mt-2.5 flex flex-wrap gap-2">
          {AI_CHIPS.map(chip => (
            <button
              key={chip}
              onClick={() => ask(chip)}
              className="px-3 py-1.5 transition-colors hover:brightness-95"
              style={{ background: C.brandSoft, color: C.brand, borderRadius: 999, fontFamily: F.body, fontSize: T.caption, fontWeight: 600 }}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* ── THE WAYS IN ──────────────────────────────────────────── */}
        <div
          className="mt-7 overflow-hidden"
          style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: RADIUS, boxShadow: SHADOW }}
        >
          {ACTIONS.map(a => <ActionRow key={a.to} {...a} />)}
          <div className="flex">
            {SECONDARY.map((s, i) => (
              <Link
                key={s.to}
                to={s.to}
                className="flex flex-1 items-center justify-center gap-2 py-3 no-underline transition-colors hover:bg-[#f7f9fb]"
                style={{ borderLeft: i > 0 ? `1px solid ${C.line}` : "none" }}
              >
                <s.icon className="h-4 w-4" style={{ color: C.brand }} aria-hidden="true" />
                <span style={{ color: C.brand, fontFamily: F.head, fontSize: T.small, fontWeight: 700 }}>{s.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── FLORIDA RULES ────────────────────────────────────────── */}
        <h2 className="mb-2 mt-8" style={{ fontFamily: F.head, fontSize: T.lead, fontWeight: 800, letterSpacing: "-0.01em" }}>
          Worth knowing, wherever you are in Florida
        </h2>
        <div
          className="overflow-hidden"
          style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: RADIUS }}
        >
          {LAW_CARDS.map((card, i) => (
            <LawCard
              key={card.title}
              card={card}
              open={openLaw === i}
              onToggle={() => setOpenLaw(openLaw === i ? null : i)}
            />
          ))}
        </div>

        {/* ── COVERAGE ─────────────────────────────────────────────── */}
        <div
          className="mt-8 overflow-hidden"
          style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: RADIUS }}
        >
          <button
            onClick={() => setShowCoverage(v => !v)}
            aria-expanded={showCoverage}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
          >
            <span className="min-w-0 flex-1">
              <span className="block" style={{ color: C.ink, fontFamily: F.head, fontSize: T.small, fontWeight: 700 }}>
                {covered.length > 0
                  ? `Permit requirements loaded for ${covered.length} Broward cities`
                  : "Loading coverage…"}
              </span>
              <span className="block" style={{ color: C.muted, fontFamily: F.body, fontSize: T.caption }}>
                Weston also includes 138,193 historical permit records
              </span>
            </span>
            <ChevronDown
              className="h-4 w-4 shrink-0 transition-transform"
              style={{ color: C.faint, transform: showCoverage ? "rotate(180deg)" : "none" }}
              aria-hidden="true"
            />
          </button>

          {showCoverage && (
            <ul
              className="grid grid-cols-2 gap-x-4 px-4 pb-4"
              style={{ borderTop: `1px solid ${C.line}`, paddingTop: 12 }}
            >
              {covered.map(c => (
                <li key={c.name} className="py-1">
                  <Link
                    to={`/PermitGuide?city=${encodeURIComponent(c.name)}`}
                    className="flex items-baseline justify-between gap-2 no-underline"
                  >
                    <span className="truncate" style={{ color: C.brand, fontFamily: F.body, fontSize: T.small, fontWeight: 600 }}>
                      {c.name}
                    </span>
                    <span style={{ color: C.faint, fontFamily: F.body, fontSize: T.caption, fontVariantNumeric: "tabular-nums" }}>
                      {c.permit_type_count}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="mt-6" style={{ color: C.faint, fontFamily: F.body, fontSize: T.caption, lineHeight: 1.6 }}>
          Open Permit is a guide, not a permitting authority. Confirm anything that matters with your
          city&rsquo;s building department before you file or begin work.
        </p>
      </div>

      <AIDrawer
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        currentPageName="Home"
        initialMessage={aiInitialMessage}
      />
    </div>
  );
}
