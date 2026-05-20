import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Settings, LayoutDashboard, ClipboardList, ChevronDown, ShieldCheck, Map, Calculator, Search, CheckSquare, Send, Bell, Clock, Menu, X, User } from "lucide-react";
import NotificationBell from "@/components/projects/NotificationBell";
import FloatingAIButton from "@/components/ai/FloatingAIButton";
import { base44 } from "@/api/base44Client";
import AuthModal from "@/components/auth/AuthModal";

const NAV_LINKS = [
  { name: "Tools",            page: "PermitGuide",      shortLabel: "Tools",    icon: Map },
  { name: "Project Planning", page: "ProjectDashboard", shortLabel: "Projects", icon: CheckSquare },
  { name: "Guides",           page: "FeeCalculator",    shortLabel: "Guides",   icon: Calculator },
  { name: "Recent Changes",   page: "ExemptionChecker", shortLabel: "Changes",  icon: Send },
];

const FONTS = {
  logo: "'Manrope', system-ui, sans-serif",
  nav:  "'Plus Jakarta Sans', system-ui, sans-serif",
};
const PRIMARY = "#004ac6";

export default function Layout({ children, currentPageName }) {
  const [mobileOpen, setMobileOpen]       = useState(false);
  const [accountOpen, setAccountOpen]     = useState(false);
  const [currentUser, setCurrentUser]     = useState(null);
  const [navVisible, setNavVisible]       = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const lastScrollY = useRef(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(u => { if (u) setCurrentUser(u); }).catch(() => {});
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y < 10) setNavVisible(true);
      else if (y > lastScrollY.current) { setNavVisible(false); setMobileOpen(false); setAccountOpen(false); }
      else setNavVisible(true);
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
    ? [{ name: "City Manager",   page: "AdminCityManager",   icon: Settings },
       { name: "Permit Records", page: "AdminPermitRecords",  icon: ClipboardList }]
    : isCityAdmin
    ? [{ name: "City Settings",  page: "AdminCityManager",   icon: Settings },
       { name: "My City Portal", page: "CityPortal",         icon: LayoutDashboard }]
    : [];

  if (currentPageName === "CityPortalPublic") return <>{children}</>;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f8f9ff" }}>

      {/* ── NAV ─────────────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 transition-transform duration-300"
        style={{
          background: "#fff",
          borderBottom: "1px solid #e8eaf0",
          height: 52,
          transform: navVisible ? "translateY(0)" : "translateY(-100%)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center gap-6">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-1.5 shrink-0 mr-2">
            <span className="font-extrabold text-base" style={{ fontFamily: FONTS.logo, color: PRIMARY }}>
              PermitGuide
            </span>
          </Link>

          {/* Center nav links (desktop) */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(link => {
              const active = currentPageName === link.page;
              return (
                <Link
                  key={link.page}
                  to={createPageUrl(link.page)}
                  className="px-3 py-1.5 rounded-md text-sm font-semibold transition-colors whitespace-nowrap"
                  style={{
                    fontFamily: FONTS.nav,
                    color: active ? PRIMARY : "#434655",
                    background: active ? "#eff4ff" : "transparent",
                    textDecoration: "none",
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "#f4f6fb"; e.currentTarget.style.color = "#0d1c2e"; } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#434655"; } }}
                >
                  {link.name}
                </Link>
              );
            })}
            {(isAdmin || isCityAdmin) && (
              <Link
                to="/admin"
                className="px-3 py-1.5 rounded-md text-sm font-semibold transition-colors whitespace-nowrap flex items-center gap-1"
                style={{ fontFamily: FONTS.nav, color: "#434655", textDecoration: "none" }}
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Admin
              </Link>
            )}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {/* Search */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm" style={{ background: "#f4f6fb", border: "1px solid #e8eaf0", width: 160 }}>
              <Search className="w-3.5 h-3.5 shrink-0" style={{ color: "#9ca3af" }} />
              <span style={{ color: "#9ca3af", fontSize: 13, fontFamily: FONTS.nav }}>Search permits...</span>
            </div>

            {/* Bell */}
            {currentUser ? (
              <NotificationBell currentUser={currentUser} />
            ) : (
              <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: "#6b7280" }}>
                <Bell className="w-4.5 h-4.5 w-[18px] h-[18px]" />
              </button>
            )}

            {/* Clock */}
            <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: "#6b7280" }}>
              <Clock className="w-[18px] h-[18px]" />
            </button>

            {/* Start Project / Log In */}
            {currentUser ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setAccountOpen(p => !p)}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-lg font-bold text-sm transition-colors hover:opacity-90"
                  style={{ background: PRIMARY, color: "#fff", fontFamily: FONTS.logo, borderRadius: 8 }}
                >
                  Start Project
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                    {currentUser.full_name?.[0]?.toUpperCase() || "U"}
                  </div>
                </button>
                {accountOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-2xl border border-gray-100 py-1 overflow-hidden z-50">
                    <Link
                      to={createPageUrl("ProjectDashboard")}
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      style={{ fontFamily: FONTS.nav }}
                    >
                      My Projects
                    </Link>
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
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg font-bold text-sm transition-colors hover:opacity-90"
                style={{ background: PRIMARY, color: "#fff", fontFamily: FONTS.logo, borderRadius: 8 }}
              >
                Start Project
              </button>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(p => !p)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            style={{ color: "#6b7280" }}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white pb-2 shadow-lg">
            {NAV_LINKS.map(link => (
              <Link
                key={link.page}
                to={createPageUrl(link.page)}
                onClick={() => setMobileOpen(false)}
                className="block px-5 py-3 text-sm font-semibold border-b border-gray-50 transition-colors hover:bg-gray-50"
                style={{ fontFamily: FONTS.nav, color: currentPageName === link.page ? PRIMARY : "#434655" }}
              >
                {link.name}
              </Link>
            ))}
            {currentUser ? (
              <>
                <Link to={createPageUrl("ProjectDashboard")} onClick={() => setMobileOpen(false)}
                  className="block px-5 py-3 text-sm font-semibold border-b border-gray-50"
                  style={{ fontFamily: FONTS.nav, color: "#434655" }}>
                  My Projects
                </Link>
                <button onClick={() => { base44.auth.logout("/"); setMobileOpen(false); }}
                  className="block w-full text-left px-5 py-3 text-sm font-semibold"
                  style={{ fontFamily: FONTS.nav, color: "#ef4444" }}>
                  Sign Out
                </button>
              </>
            ) : (
              <button onClick={() => { setShowAuthModal(true); setMobileOpen(false); }}
                className="block w-full text-left px-5 py-3 text-sm font-semibold"
                style={{ fontFamily: FONTS.nav, color: PRIMARY }}>
                Log In
              </button>
            )}
          </div>
        )}
      </nav>

      {/* ── MAIN ─────────────────────────────────────────────────────── */}
      <main className="flex-1">{children}</main>

      {/* ── MOBILE BOTTOM NAV ─────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 flex">
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

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer className="pb-20 md:pb-0" style={{ background: "#fff", borderTop: "1px solid #e8eaf0" }}>
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-extrabold" style={{ fontFamily: FONTS.logo, fontSize: 15, color: PRIMARY }}>PermitGuide</p>
            <p className="text-xs mt-0.5" style={{ color: "#9ca3af", fontFamily: FONTS.nav }}>
              © 2024 PermitGuide Assistance. Guiding you through every step.
            </p>
          </div>
          <div className="flex flex-wrap gap-6">
            {["Privacy Policy", "Terms of Service", "Accessibility", "Contact Support"].map(l => (
              <a key={l} href="#" className="text-xs hover:underline transition-colors"
                style={{ color: "#6b7280", fontFamily: FONTS.nav }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>

      <FloatingAIButton currentPageName={currentPageName} />
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
}