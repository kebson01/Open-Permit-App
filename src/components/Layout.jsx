import { Link, useLocation } from "react-router-dom";
import { Home, BookOpen, Camera, Building2, HardHat } from "lucide-react";
import InstallPrompt from "@/components/InstallPrompt";
import { C, F, T } from "@/lib/theme";

/**
 * The app shell.
 *
 * Three things were fighting each other here. The header hid itself on scroll,
 * which left a gap under anything sticky beneath it. The mobile hamburger
 * opened the same five links already sitting in the tab bar an inch below it.
 * And the footer rendered above that tab bar with nothing between them, so the
 * legal links sat jammed under it and the last one was hard to hit.
 *
 * So: the header stays put and is brand only on a phone, navigation lives in
 * one place per breakpoint, and the footer reserves the tab bar's height.
 */

// The whole app. Everything else is reached from inside a permit.
const NAV_ITEMS = [
  { to: "/",            label: "Home",         icon: Home },
  { to: "/PermitGuide", label: "Permit Guide", icon: BookOpen },
  { to: "/CameraScan",  label: "Scan an Item", icon: Camera },
  { to: "/property",    label: "Property",     icon: Building2 },
  { to: "/contractors", label: "Contractors",  icon: HardHat },
];

const TAB_BAR_HEIGHT = 60;

const FOOTER_LINKS = [
  { to: "/privacy",       label: "Privacy" },
  { to: "/terms",         label: "Terms" },
  { to: "/accessibility", label: "Accessibility" },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path || currentPageName === path.replace("/", "");

  return (
    <div className="flex min-h-screen flex-col" style={{ background: C.ground }}>

      {/* ── HEADER ───────────────────────────────────────────────────
          Fixed height, always visible: the city bar on the pages below
          sticks to its underside and needs a stable offset. */}
      <header
        className="sticky top-0 z-40"
        style={{ height: 64, background: C.surface, borderBottom: `1px solid ${C.line}` }}
      >
        <div className="mx-auto flex h-full max-w-[1280px] items-center gap-6 px-4 md:px-6">
          <Link to="/" className="flex shrink-0 items-center gap-2 no-underline">
            <img src="/icon-master.png" alt="" className="h-8 w-8 object-contain" />
            <span
              className="text-xl tracking-tight"
              style={{ fontFamily: F.head, fontWeight: 800, color: C.brand }}
            >
              OpenPermit
            </span>
          </Link>

          <div className="hidden h-5 w-px shrink-0 md:block" style={{ background: C.line }} />

          {/* Desktop navigation. On a phone this lives in the tab bar instead —
              duplicating it behind a hamburger only added a second way to reach
              links that are already one tap away. */}
          <nav className="hidden flex-1 items-center gap-1 md:flex" aria-label="Main">
            {NAV_ITEMS.map(item => (
              <Link
                key={item.to}
                to={item.to}
                aria-current={isActive(item.to) ? "page" : undefined}
                className="whitespace-nowrap rounded-lg px-3 py-1.5 no-underline transition-colors"
                style={{
                  fontFamily: F.head,
                  fontSize: T.small,
                  fontWeight: 700,
                  color: isActive(item.to) ? C.brand : C.muted,
                  boxShadow: isActive(item.to) ? `inset 0 -2px 0 ${C.brand}` : "none",
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* ── FOOTER ───────────────────────────────────────────────────
          The bottom padding is the tab bar's height, so the last link is
          reachable rather than pinned underneath it. */}
      <footer
        style={{ background: C.surface, borderTop: `1px solid ${C.line}` }}
        className="pb-[60px] md:pb-0"
      >
        <div className="mx-auto flex max-w-[1280px] flex-col gap-3 px-4 py-6 md:flex-row md:items-center md:justify-between md:px-6">
          <p style={{ color: C.faint, fontFamily: F.body, fontSize: T.caption }}>
            © {new Date().getFullYear()} OpenPermit Municipal Services
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {FOOTER_LINKS.map(l => (
              <Link
                key={l.to}
                to={l.to}
                className="no-underline transition-colors"
                style={{ color: C.muted, fontFamily: F.body, fontSize: T.caption, fontWeight: 600 }}
              >
                {l.label}
              </Link>
            ))}
            <a
              href="mailto:support@open-permit.com"
              className="no-underline transition-colors"
              style={{ color: C.muted, fontFamily: F.body, fontSize: T.caption, fontWeight: 600 }}
            >
              Contact support
            </a>
          </div>
        </div>
      </footer>

      {/* ── MOBILE TAB BAR ───────────────────────────────────────────
          Labels are short enough to fit five across at 360px without
          truncating; safe-area padding keeps them clear of the gesture bar. */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 flex md:hidden"
        aria-label="Main"
        style={{
          height: TAB_BAR_HEIGHT,
          background: C.surface,
          borderTop: `1px solid ${C.line}`,
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {NAV_ITEMS.map(item => {
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? "page" : undefined}
              className="flex flex-1 flex-col items-center justify-center gap-1 no-underline"
              style={{ color: active ? C.brand : C.faint }}
            >
              <item.icon
                className="h-5 w-5"
                strokeWidth={active ? 2.4 : 1.8}
                aria-hidden="true"
              />
              <span
                className="leading-none"
                style={{ fontFamily: F.head, fontSize: 10, fontWeight: active ? 700 : 600 }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <InstallPrompt />
    </div>
  );
}
