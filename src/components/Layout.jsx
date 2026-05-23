import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Home, Building2, FileText, FolderOpen, ChevronDown,
  Calculator, ShieldCheck, BookOpen, Search, Menu, X,
  User, LogOut, Settings, Bell, Wrench
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import * as db from "@/lib/db";
import OnboardingModal from "@/components/onboarding/OnboardingModal";
import AuthModal from "@/components/auth/AuthModal";

const PRIMARY = "#1A56DB";
const FONTS = {
  logo: "'Manrope', system-ui, sans-serif",
  nav: "'Plus Jakarta Sans', system-ui, sans-serif",
};

const TOOLS_ITEMS = [
  { label: "Permit Guide",      path: "/PermitGuide",      icon: BookOpen },
  { label: "Fee Calculator",    path: "/FeeCalculator",    icon: Calculator },
  { label: "Exemption Checker", path: "/ExemptionChecker", icon: ShieldCheck },
  { label: "Building Codes",    path: "/BuildingCodes",    icon: BookOpen },
  { label: "Property Search",   path: "/PropertyGuide",    icon: Search },
];

export default function Layout({ children, currentPageName }) {
  const [currentUser, setCurrentUser]     = useState(null);
  const [mobileOpen, setMobileOpen]       = useState(false);
  const [toolsOpen, setToolsOpen]         = useState(false);
  const [accountOpen, setAccountOpen]     = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [navVisible, setNavVisible]       = useState(true);
  const lastScrollY = useRef(0);
  const toolsRef    = useRef(null);
  const accountRef  = useRef(null);
  const location    = useLocation();

  useEffect(() => {
    base44.auth.me().then(u => {
      if (u) {
        setCurrentUser(u);
        checkOnboarding(u);
      }
    }).catch(() => {});
  }, []);

  const checkOnboarding = async (user) => {
    // If op_role is already in localStorage, never show the modal
    if (localStorage.getItem("op_role")) return;

    // Otherwise check Supabase with a 3s timeout
    try {
      const timeout = new Promise(resolve => setTimeout(resolve, 3000));
      const check = db.UserOnboarding.filter({ user_email: user.email });
      const records = await Promise.race([check, timeout]);
      if (!records || records.length === 0) {
        setShowOnboarding(true);
      } else {
        const ob = records[0];
        if (ob.is_complete || ob.is_skipped) {
          // Cache in localStorage so we skip next time
          localStorage.setItem("op_role", ob.role || "skipped");
        } else {
          setShowOnboarding(true);
        }
      }
    } catch {
      // If Supabase fails, show the modal so the user can set their role
      setShowOnboarding(true);
    }
  };

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y < 10) setNavVisible(true);
      else if (y > lastScrollY.current) { setNavVisible(false); setMobileOpen(false); setToolsOpen(false); setAccountOpen(false); }
      else setNavVisible(true);
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (toolsRef.current && !toolsRef.current.contains(e.target)) setToolsOpen(false);
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isActive = (path) => location.pathname === path || currentPageName === path.replace("/", "");

  const isAdmin = currentUser?.role === "admin";
  const isCityAdmin = currentUser?.role === "city_admin";

  if (currentPageName === "CityPortalPublic") return <>{children}</>;

  const NavLink = ({ to, children: ch }) => (
    <Link
      to={to}
      onClick={() => setMobileOpen(false)}
      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
        isActive(to) ? "text-[#1A56DB] bg-[#EBF5FF] font-semibold" : "text-[#434654] hover:text-[#191B23] hover:bg-[#F3F3FE]"
      }`}
      style={{ fontFamily: FONTS.nav, textDecoration: "none" }}
    >
      {ch}
    </Link>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f8f9ff" }}>
      {/* NAV */}
      <nav
        className="sticky top-0 z-50 transition-transform duration-300"
        style={{
          background: "#fff",
          borderBottom: "1px solid #E8EAF0",
          height: 56,
          transform: navVisible ? "translateY(0)" : "translateY(-100%)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center gap-6">
          {/* Logo */}
          <Link to="/" className="shrink-0" style={{ textDecoration: "none" }}>
            <span className="font-extrabold text-base tracking-tight" style={{ fontFamily: FONTS.logo, color: PRIMARY }}>
              OpenPermit
            </span>
          </Link>

          {/* Divider */}
          <div className="hidden md:block w-px h-5 bg-gray-200 shrink-0" />

          {/* Primary Nav (desktop) */}
          <div className="hidden md:flex items-center gap-1 flex-1">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/PermitGuide">Permit Guide</NavLink>
            <NavLink to="/MyProperties">My Properties</NavLink>
            <NavLink to="/ApplyForPermit">Apply for Permit</NavLink>
            <NavLink to="/MyProjects">My Projects</NavLink>

            {/* Tools dropdown */}
            <div className="relative" ref={toolsRef}>
              <button
                onClick={() => setToolsOpen(p => !p)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  toolsOpen ? "text-[#1A56DB] bg-[#EBF5FF] font-semibold" : "text-[#434654] hover:text-[#191B23] hover:bg-[#F3F3FE]"
                }`}
                style={{ fontFamily: FONTS.nav }}
              >
                Tools <ChevronDown className={`w-3.5 h-3.5 transition-transform ${toolsOpen ? "rotate-180" : ""}`} />
              </button>
              {toolsOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-52 bg-white rounded-xl py-1 z-50" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.10)", border: "1px solid #E8EAF0" }}>
                  {TOOLS_ITEMS.map(item => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setToolsOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors"
                      style={{ fontFamily: FONTS.nav, textDecoration: "none", color: "#434654" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#F3F3FE"}
                      onMouseLeave={e => e.currentTarget.style.background = ""}
                    >
                      <item.icon className="w-4 h-4" style={{ color: "#1A56DB" }} /> {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right side (desktop) */}
          <div className="hidden md:flex items-center gap-2 ml-auto">
            {(isAdmin || isCityAdmin) && (
              <Link
                to="/admin"
                className="px-3 py-1.5 rounded-md text-sm font-medium text-[#434654] hover:bg-[#F3F3FE] transition-colors"
                style={{ fontFamily: FONTS.nav, textDecoration: "none" }}
              >
                Admin
              </Link>
            )}

            {currentUser ? (
              <div className="relative" ref={accountRef}>
                <button
                  onClick={() => setAccountOpen(p => !p)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full text-sm font-medium hover:bg-[#F3F3FE] transition-colors"
                  style={{ fontFamily: FONTS.nav, border: "1px solid #E8EAF0" }}
                >
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: PRIMARY }}>
                    {currentUser.full_name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <span className="max-w-[90px] truncate" style={{ color: "#191B23" }}>{currentUser.full_name?.split(" ")[0] || currentUser.email}</span>
                  <ChevronDown className="w-3 h-3" style={{ color: "#9CA3AF" }} />
                </button>
                {accountOpen && (
                  <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl py-1 z-50" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.10)", border: "1px solid #E8EAF0" }}>
                    <Link to="/MyAccount" onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm"
                      style={{ fontFamily: FONTS.nav, textDecoration: "none", color: "#434654" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#F3F3FE"}
                      onMouseLeave={e => e.currentTarget.style.background = ""}>
                      <User className="w-4 h-4" style={{ color: "#434654" }} /> My Account
                    </Link>
                    <div style={{ borderTop: "1px solid #E8EAF0", margin: "4px 0" }} />
                    <button
                      onClick={() => { base44.auth.logout("/"); setAccountOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm"
                      style={{ fontFamily: FONTS.nav, color: "#BA1A1A" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#FFDAD6"}
                      onMouseLeave={e => e.currentTarget.style.background = ""}
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-4 py-1.5 rounded-lg font-semibold text-sm text-white transition-opacity hover:opacity-90"
                style={{ background: PRIMARY, fontFamily: FONTS.nav }}
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden ml-auto">
            <button
              onClick={() => setMobileOpen(p => !p)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              style={{ color: "#434654" }}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white pb-3 shadow-lg">
            {[
              { to: "/", label: "Home", icon: Home },
              { to: "/PermitGuide", label: "Permit Guide", icon: BookOpen },
              { to: "/MyProperties", label: "My Properties", icon: Building2 },
              { to: "/ApplyForPermit", label: "Apply for Permit", icon: FileText },
              { to: "/MyProjects", label: "My Projects", icon: FolderOpen },
            ].map(item => (
              <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b border-gray-50 hover:bg-gray-50"
                style={{ fontFamily: FONTS.nav, color: isActive(item.to) ? PRIMARY : "#434654", textDecoration: "none" }}>
                <item.icon className="w-4 h-4" /> {item.label}
              </Link>
            ))}
            <div className="px-5 pt-2 pb-1">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Tools</p>
            </div>
            {TOOLS_ITEMS.map(item => (
              <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
                style={{ fontFamily: FONTS.nav, textDecoration: "none" }}>
                <item.icon className="w-4 h-4" /> {item.label}
              </Link>
            ))}
            <div className="border-t border-gray-100 mt-2 pt-2">
              {currentUser ? (
                <>
                  <Link to="/MyAccount" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                    style={{ fontFamily: FONTS.nav, textDecoration: "none" }}>
                    <User className="w-4 h-4" /> My Account
                  </Link>
                  {(isAdmin || isCityAdmin) && (
                    <Link to="/admin" onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 px-5 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      style={{ fontFamily: FONTS.nav, textDecoration: "none" }}>
                      <ShieldCheck className="w-4 h-4" /> Admin
                    </Link>
                  )}
                  <button onClick={() => { base44.auth.logout("/"); setMobileOpen(false); }}
                    className="w-full flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                    style={{ fontFamily: FONTS.nav }}>
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </>
              ) : (
                <button onClick={() => { setShowAuthModal(true); setMobileOpen(false); }}
                  className="w-full text-left px-5 py-3 text-sm font-bold"
                  style={{ fontFamily: FONTS.nav, color: PRIMARY }}>
                  Sign In
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* MAIN */}
      <main className="flex-1 pb-16 md:pb-0">{children}</main>

      {/* MOBILE BOTTOM NAV */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 flex">
        {[
          { to: "/", label: "Home", icon: Home },
          { to: "/MyProperties", label: "Properties", icon: Building2 },
          { to: "/ApplyForPermit", label: "Apply", icon: FileText },
          { to: "/MyProjects", label: "Projects", icon: FolderOpen },
          { to: "/FeeCalculator", label: "Tools", icon: Wrench },
        ].map(item => {
          const active = isActive(item.to);
          return (
            <Link key={item.to} to={item.to}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5"
              style={{ color: active ? PRIMARY : "#9ca3af", textDecoration: "none" }}>
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-semibold" style={{ fontFamily: FONTS.nav }}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      {showOnboarding && currentUser && (
        <OnboardingModal
          currentUser={currentUser}
          onComplete={() => setShowOnboarding(false)}
          onSkip={() => setShowOnboarding(false)}
        />
      )}
    </div>
  );
}