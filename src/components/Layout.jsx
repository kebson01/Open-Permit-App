import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, BookOpen, Camera, Building2, HardHat, Menu, X } from "lucide-react";
import InstallPrompt from "@/components/InstallPrompt";

const PRIMARY = "#003466";
const FONTS = {
  logo: "'Hanken Grotesk', system-ui, sans-serif",
  nav:  "'Public Sans', system-ui, sans-serif",
};

// The whole app. Everything else is reached from inside a permit.
const NAV_ITEMS = [
  { to: "/",            label: "Home",         icon: Home },
  { to: "/PermitGuide", label: "Permit Guide", icon: BookOpen },
  { to: "/CameraScan",  label: "Scan an Item", icon: Camera },
  { to: "/property",    label: "Property",     icon: Building2 },
  { to: "/contractors", label: "Contractors",  icon: HardHat },
];

export default function Layout({ children, currentPageName }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  const location    = useLocation();

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y < 10) setNavVisible(true);
      else if (y > lastScrollY.current) { setNavVisible(false); setMobileOpen(false); }
      else setNavVisible(true);
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (path) =>
    location.pathname === path || currentPageName === path.replace("/", "");

  const NavLink = ({ to, children: ch }) => (
    <Link
      to={to}
      onClick={() => setMobileOpen(false)}
      className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
        isActive(to)
          ? "text-[#003466] border-b-2 border-[#003466]"
          : "text-[#424750] hover:text-[#003466]"
      }`}
      style={{ fontFamily: FONTS.nav, textDecoration: "none" }}
    >
      {ch}
    </Link>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* NAV */}
      <nav
        className="sticky top-0 z-50 transition-transform duration-300 bg-white border-b border-[#c3c6d1]"
        style={{
          height: 64,
          transform: navVisible ? "translateY(0)" : "translateY(-100%)",
        }}
      >
        <div className="max-w-[1280px] mx-auto px-6 h-full flex items-center gap-6">
          {/* Logo */}
          <Link to="/" className="shrink-0 flex items-center gap-2" style={{ textDecoration: "none" }}>
            <img src="/icon-master.png" alt="Open Permit" className="h-8 w-8 object-contain" />
            <span className="font-extrabold text-xl tracking-tight" style={{ fontFamily: FONTS.logo, color: PRIMARY }}>
              OpenPermit
            </span>
          </Link>

          <div className="hidden md:block w-px h-5 bg-[#c3c6d1] shrink-0" />

          {/* Primary Nav (desktop) */}
          <div className="hidden md:flex items-center gap-1 flex-1">
            {NAV_ITEMS.map(item => (
              <NavLink key={item.to} to={item.to}>{item.label}</NavLink>
            ))}
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden ml-auto">
            <button onClick={() => setMobileOpen(p => !p)}
              className="p-2 rounded-lg hover:bg-[#f2f4f6] transition-colors"
              style={{ color: "#424750" }}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="md:hidden border-t border-[#c3c6d1] bg-white pb-3 shadow-lg">
            {NAV_ITEMS.map(item => (
              <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b border-[#eceef0] hover:bg-[#f2f4f6]"
                style={{ fontFamily: FONTS.nav, color: isActive(item.to) ? PRIMARY : "#424750", textDecoration: "none" }}>
                <item.icon className="w-4 h-4" /> {item.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* MAIN */}
      <main className="flex-1 pb-16 md:pb-0">{children}</main>

      {/* FOOTER */}
      <footer className="border-t border-[#c3c6d1] bg-white mt-8">
        <div className="max-w-[1280px] mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <p className="text-sm text-[#737781]" style={{ fontFamily: FONTS.nav }}>
            © {new Date().getFullYear()} OpenPermit Municipal Services. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link to="/privacy" className="text-sm font-semibold text-[#424750] hover:text-[#003466] transition-colors no-underline" style={{ fontFamily: FONTS.nav }}>Privacy Policy</Link>
            <Link to="/terms" className="text-sm font-semibold text-[#424750] hover:text-[#003466] transition-colors no-underline" style={{ fontFamily: FONTS.nav }}>Terms of Service</Link>
            <Link to="/accessibility" className="text-sm font-semibold text-[#424750] hover:text-[#003466] transition-colors no-underline" style={{ fontFamily: FONTS.nav }}>Accessibility</Link>
            <a href="mailto:support@open-permit.com" className="text-sm font-semibold text-[#424750] hover:text-[#003466] transition-colors no-underline" style={{ fontFamily: FONTS.nav }}>Contact Support</a>
          </div>
        </div>
      </footer>

      {/* MOBILE BOTTOM NAV */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#c3c6d1] flex">
        {NAV_ITEMS.map(item => {
          const active = isActive(item.to);
          return (
            <Link key={item.to} to={item.to}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5"
              style={{ color: active ? PRIMARY : "#737781", textDecoration: "none" }}>
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-semibold" style={{ fontFamily: FONTS.nav }}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <InstallPrompt />
    </div>
  );
}
