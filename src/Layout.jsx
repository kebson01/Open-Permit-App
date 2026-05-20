import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Menu, X, Settings, LayoutDashboard, ClipboardList, ChevronDown, ShieldCheck, Map, Calculator, Search, CheckSquare, Send, Bell } from "lucide-react";
import NotificationBell from "@/components/projects/NotificationBell";
import FloatingAIButton from "@/components/ai/FloatingAIButton";
import { base44 } from "@/api/base44Client";
import AuthModal from "@/components/auth/AuthModal";

const NAV_LINKS = [
  { name: "Plan a Permit",       page: "PermitGuide",      shortLabel: "Permits",  icon: Map },
  { name: "Exemption Checker",   page: "ExemptionChecker", shortLabel: "Exempt?",  icon: CheckSquare },
  { name: "Estimate Costs",      page: "FeeCalculator",    shortLabel: "Fees",     icon: Calculator },
  { name: "Search Property",     page: "PropertyGuide",    shortLabel: "Property", icon: Search },
  { name: "Submit Application",  page: "SubmissionGuide",  shortLabel: "Submit",   icon: Send },
];

const FONTS = {
  logo: "'Manrope', system-ui, sans-serif",
  nav:  "'Plus Jakarta Sans', system-ui, sans-serif",
};
const PRIMARY = "#004ac6";

export default function Layout({ children, currentPageName }) {
  const [mobileOpen, setMobileOpen]         = useState(false);
  const [accountOpen, setAccountOpen]       = useState(false);
  const [currentUser, setCurrentUser]       = useState(null);
  const [navVisible, setNavVisible]         = useState(true);
  const [showAuthModal, setShowAuthModal]   = useState(false);
  const lastScrollY  = useRef(0);
  const dropdownRef  = useRef(null);

  useEffect(() => {
    base44.auth.me().then(u => { if (u) setCurrentUser(u); }).catch(() => {});
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y < 10) { setNavVisible(true); }
      else if (y > lastScrollY.current) { setNavVisible(false); setMobileOpen(false); setAccountOpen(false); }
      else { setNavVisible(true); }
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setAccountOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isAdmin     = currentUser?.role === "admin";
  const isCityAdmin = currentUser?.role === "city_admin";

  const adminDropdownLinks = isAdmin
    ? [{ name: "City Manager",    page: "AdminCityManager", icon: Settings },
       { name: "Permit Records",  page: "AdminPermitRecords", icon: ClipboardList }]
    : isCityAdmin
    ? [{ name: "City Settings",   page: "AdminCityManager", icon: Settings },
       { name: "My City Portal",  page: "CityPortal", icon: LayoutDashboard }]
    : [];

  if (currentPageName === "CityPortalPublic") return <>{children}</>;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f8f9ff" }}>

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 transition-transform duration-300"
        style={{
          background: PRIMARY,
          height: 64,
          boxShadow: "0 2px 16px rgba(0,74,198,0.18)",
          transform: navVisible ? "translateY(0)" : "translateY(-100%)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between gap-4">

          {/* LEFT — Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0 select-none">
            <img
              src="https://media.base44.com/images/public/69ac5571087590fc03d44b73/a83719bba_OpenPermit_blue_background.png"
              alt="OpenPermit"
              className="h-8 w-auto"
            />
          </Link>

          {/* CENTER — Nav links (desktop) */}
          <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {NAV_LINKS.map(link => {
              const active = currentPageName === link.page;
              return (
                <Link
                  key={link.page}
                  to={createPageUrl(link.page)}
                  className="px-3 py-1.5 rounded-md text-sm font-semibold transition-all whitespace-nowrap"
                  style={{
                    fontFamily: FONTS.nav,
                    color: active ? "#fff" : "rgba(255,255,255,0.82)",
                    borderBottom: active ? "2px solid #fff" : "2px solid transparent",
                    background: active ? "rgba(255,255,255,0.1)" : "transparent",
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = "rgba(255,255,255,0.82)"; }}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* RIGHT — Actions (desktop) */}
          <div className="hidden lg:flex items-center gap-5 shrink-0">
            {(isAdmin || isCityAdmin) && (
              <Link
                to="/admin"
                className="flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-100"
                style={{ fontFamily: FONTS.nav, color: "rgba(255,255,255,0.82)" }}
              >
                <ShieldCheck className="w-4 h-4" /> Admin
              </Link>
            )}
            {currentUser && (
              <Link
                to={createPageUrl("ProjectDashboard")}
                className="text-sm font-semibold transition-opacity hover:opacity-100"
                style={{ fontFamily: FONTS.nav, color: "rgba(255,255,255,0.82)" }}
              >
                My Projects
              </Link>
            )}
            {currentUser && <NotificationBell currentUser={currentUser} />}

            {/* My Account / Log In */}
            {currentUser ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setAccountOpen(p => !p)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-sm transition-colors hover:bg-blue-50"
                  style={{ background: "#fff", color: PRIMARY, fontFamily: FONTS.logo, borderRadius: 8 }}
                >
                  My Account
                  <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                </button>
                {accountOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-2xl border border-gray-100 py-1 overflow-hidden z-50">
                    {adminDropdownLinks.map(link => (
                      <Link
                        key={link.page}
                        to={createPageUrl(link.page)}
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        style={{ fontFamily: FONTS.nav }}
                      >
                        <link.icon className="w-4 h-4 text-gray-400" /> {link.name}
                      </Link>
                    ))}
                    <button
                      onClick={() => { base44.auth.logout("/"); setAccountOpen(false); }}
                      className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
                      style={{ fontFamily: FONTS.nav }}
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-sm transition-colors hover:bg-blue-50"
                style={{ background: "#fff", color: PRIMARY, fontFamily: FONTS.logo, borderRadius: 8 }}
              >
                Log In
              </button>
            )}
          </div>

          {/* MOBILE RIGHT — Account + Hamburger */}
          <div className="lg:hidden flex items-center gap-3">
            {currentUser ? (
              <button
                onClick={() => setAccountOpen(p => !p)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-sm"
                style={{ background: "#fff", color: PRIMARY, fontFamily: FONTS.logo, borderRadius: 8 }}
              >
                My Account <ChevronDown className="w-3 h-3" />
              </button>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-3 py-1.5 rounded-lg font-bold text-sm"
                style={{ background: "#fff", color: PRIMARY, fontFamily: FONTS.logo, borderRadius: 8 }}
              >
                Log In
              </button>
            )}
            <button
              onClick={() => setMobileOpen(p => !p)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div
            className="lg:hidden border-t border-white/10 pb-2"
            style={{ background: "rgba(0,50,160,0.97)", backdropFilter: "blur(8px)" }}
          >
            {NAV_LINKS.map(link => (
              <Link
                key={link.page}
                to={createPageUrl(link.page)}
                onClick={() => setMobileOpen(false)}
                className="block px-6 py-3.5 text-sm font-semibold border-b border-white/5 transition-colors"
                style={{
                  fontFamily: FONTS.nav,
                  color: currentPageName === link.page ? "#fff" : "rgba(255,255,255,0.75)",
                  background: currentPageName === link.page ? "rgba(255,255,255,0.1)" : "transparent",
                }}
              >
                {link.name}
              </Link>
            ))}
            {(isAdmin || isCityAdmin) && (
              <Link to="/admin" onClick={() => setMobileOpen(false)}
                className="block px-6 py-3.5 text-sm font-semibold border-b border-white/5"
                style={{ fontFamily: FONTS.nav, color: "rgba(255,255,255,0.75)" }}>
                Admin
              </Link>
            )}
            {currentUser && (
              <Link to={createPageUrl("ProjectDashboard")} onClick={() => setMobileOpen(false)}
                className="block px-6 py-3.5 text-sm font-semibold border-b border-white/5"
                style={{ fontFamily: FONTS.nav, color: "rgba(255,255,255,0.75)" }}>
                My Projects
              </Link>
            )}
            {currentUser && (
              <button onClick={() => { base44.auth.logout("/"); setMobileOpen(false); }}
                className="block w-full text-left px-6 py-3.5 text-sm font-semibold"
                style={{ fontFamily: FONTS.nav, color: "rgba(255,100,100,0.9)" }}>
                Sign Out
              </button>
            )}
          </div>
        )}

        {/* Mobile account dropdown */}
        {accountOpen && currentUser && (
          <div className="lg:hidden absolute right-4 top-16 w-52 bg-white rounded-xl shadow-2xl border border-gray-100 py-1 z-50">
            {adminDropdownLinks.map(link => (
              <Link key={link.page} to={createPageUrl(link.page)} onClick={() => setAccountOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                <link.icon className="w-4 h-4 text-gray-400" /> {link.name}
              </Link>
            ))}
            <button onClick={() => { base44.auth.logout("/"); setAccountOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100">
              Sign Out
            </button>
          </div>
        )}
      </nav>

      {/* ── MAIN ────────────────────────────────────────────────────────── */}
      <main className="flex-1">{children}</main>

      {/* ── MOBILE BOTTOM NAV ────────────────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 flex">
        {NAV_LINKS.map(link => {
          const Icon = link.icon;
          const active = currentPageName === link.page;
          return (
            <Link key={link.page} to={createPageUrl(link.page)}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors"
              style={{ color: active ? PRIMARY : "#9ca3af" }}>
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-semibold" style={{ fontFamily: FONTS.nav }}>{link.shortLabel}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="py-8 pb-24 lg:pb-8" style={{ background: "#eff4ff", borderTop: "1px solid #c3c6d7" }}>
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-bold" style={{ fontFamily: FONTS.logo, fontSize: 16, color: PRIMARY }}>Open Permit</p>
            <p className="text-xs mt-0.5" style={{ color: "#737686", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
              © 2026 Open Permit. Guiding you through every step.
            </p>
          </div>
          <div className="flex flex-wrap gap-5">
            {["Privacy Policy", "Terms of Service", "Accessibility", "Contact Support"].map(l => (
              <a key={l} href="#" className="text-xs hover:underline transition-colors"
                style={{ color: "#434655", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>

      <FloatingAIButton currentPageName={currentPageName} />
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
}