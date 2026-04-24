import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Building2, Menu, X, Settings, LayoutDashboard, ClipboardList, ChevronDown } from "lucide-react";
import NotificationBell from "@/components/projects/NotificationBell";
import FloatingAIButton from "@/components/ai/FloatingAIButton";
import { supabase } from "@/lib/supabaseClient";
import AuthModal from "@/components/auth/AuthModal";

const centerNavLinks = [
  { name: "Plan a Permit", page: "PermitGuide" },
  { name: "Estimate Costs", page: "FeeCalculator" },
  { name: "Search Property", page: "PropertyGuide" },
];


export default function Layout({ children, currentPageName }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [navVisible, setNavVisible] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const lastScrollY = useRef(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      // Give up waiting after 2s — show app as unauthenticated
    }, 2000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timeout);
      if (session?.user) {
        setCurrentUser({
          ...session.user,
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name,
          role: session.user.user_metadata?.role,
        });
      }
    }).catch(() => {
      clearTimeout(timeout);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser({
          ...session.user,
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name,
          role: session.user.user_metadata?.role,
        });
      } else {
        setCurrentUser(null);
      }
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY < 10) {
        setNavVisible(true);
      } else if (currentY > lastScrollY.current) {
        setNavVisible(false);
        setMobileOpen(false);
        setAccountDropdownOpen(false);
      } else {
        setNavVisible(true);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setAccountDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isAdmin = currentUser?.role === "admin";
  const isCityAdmin = currentUser?.role === "city_admin";

  const adminDropdownLinks = isAdmin
    ? [
        { name: "City Manager", page: "AdminCityManager", icon: Settings },
        { name: "Permit Records", page: "AdminPermitRecords", icon: ClipboardList },
      ]
    : isCityAdmin
    ? [
        { name: "City Settings", page: "AdminCityManager", icon: Settings },
        { name: "My City Portal", page: "CityPortal", icon: LayoutDashboard },
      ]
    : [];

  const mobileLinks = [
    ...centerNavLinks,
    ...(currentUser ? [{ name: "My Projects", page: "ProjectDashboard" }] : []),
    ...adminDropdownLinks,
  ];

  const isCityPortal = currentPageName === "CityPortalPublic";

  if (isCityPortal) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      {/* Navbar */}
      <nav
        className="sticky top-0 z-40 shadow-md transition-transform duration-300"
        style={{ backgroundColor: "#0D2B5E", transform: navVisible ? "translateY(0)" : "translateY(-100%)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">

            {/* LEFT — Brand */}
            <Link to="/" className="flex items-center flex-shrink-0">
              <img
                src="https://media.base44.com/images/public/69ac5571087590fc03d44b73/15cefa1cd_image_d3d70f9d.png"
                alt="OpenPermit"
                className="h-9 w-auto"
              />
            </Link>

            {/* CENTER — Primary nav (desktop) */}
            <div className="hidden md:flex items-center gap-8">
              {centerNavLinks.map(link => {
                const isActive = currentPageName === link.page;
                return (
                  <Link
                    key={link.page}
                    to={createPageUrl(link.page)}
                    className={`text-sm font-medium transition-colors pb-0.5 ${
                      isActive
                        ? "text-white border-b-2 border-blue-400"
                        : "text-blue-100/80 hover:text-white border-b-2 border-transparent"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>

            {/* RIGHT — User actions (desktop) */}
            <div className="hidden md:flex items-center gap-4">
              {currentUser && (
                <Link
                  to={createPageUrl("ProjectDashboard")}
                  className={`text-sm font-medium transition-colors pb-0.5 ${
                    currentPageName === "ProjectDashboard"
                      ? "text-white border-b-2 border-blue-400"
                      : "text-blue-100/80 hover:text-white border-b-2 border-transparent"
                  }`}
                >
                  My Projects
                </Link>
              )}

              {currentUser && (
                <NotificationBell currentUser={currentUser} />
              )}

              {currentUser ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setAccountDropdownOpen(prev => !prev)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-white/30 text-white text-sm font-medium hover:bg-white/10 transition-colors"
                  >
                    My Account
                    <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                  </button>

                  {accountDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 overflow-hidden">
                      {adminDropdownLinks.map(link => (
                        <Link
                          key={link.page}
                          to={createPageUrl(link.page)}
                          onClick={() => setAccountDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <link.icon className="w-4 h-4 text-gray-400" />
                          {link.name}
                        </Link>
                      ))}
                      <button
                        onClick={async () => { await supabase.auth.signOut(); setAccountDropdownOpen(false); }}
                        className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100 mt-0.5"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-3 py-1.5 rounded-md border border-white/30 text-white text-sm font-medium hover:bg-white/10 transition-colors"
                >
                  Log In
                </button>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden text-white p-2 rounded-lg hover:bg-white/10"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-white/10" style={{ backgroundColor: "rgba(13,43,94,0.98)" }}>
            {mobileLinks.map(link => (
              <Link
                key={link.page}
                to={createPageUrl(link.page)}
                onClick={() => setMobileOpen(false)}
                className={`block px-5 py-3.5 text-sm font-medium border-b border-white/5 transition-colors ${
                  currentPageName === link.page ? "text-white bg-white/10" : "text-blue-100 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.name}
              </Link>
            ))}
            {!currentUser && (
              <button
                onClick={() => { setMobileOpen(false); setShowAuthModal(true); }}
                className="block w-full text-left px-5 py-3.5 text-sm font-medium text-blue-100 hover:text-white hover:bg-white/5"
              >
                Log In
              </button>
            )}
            {currentUser && (
              <button
                onClick={async () => { await supabase.auth.signOut(); setMobileOpen(false); }}
                className="block w-full text-left px-5 py-3.5 text-sm font-medium text-blue-100 hover:text-white hover:bg-white/5"
              >
                Sign Out
              </button>
            )}
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Bottom nav for mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 flex">
        {centerNavLinks.map(link => (
          <Link
            key={link.page}
            to={createPageUrl(link.page)}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 text-xs font-medium transition-colors ${
              currentPageName === link.page ? "text-blue-600" : "text-gray-500"
            }`}
          >
            <span className="truncate text-[11px]">{link.name}</span>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <footer className="py-8 pb-20 md:pb-8" style={{ backgroundColor: "#0D2B5E", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <img
                src="https://media.base44.com/images/public/69ac5571087590fc03d44b73/15cefa1cd_image_d3d70f9d.png"
                alt="OpenPermit"
                className="h-10 w-auto brightness-0 invert"
                onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "block"; }}
              />
              <span style={{ display: "none", color: "#ffffff", fontWeight: 700, fontSize: 20 }}>OpenPermit</span>
            </div>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Making permits simple for South Florida homeowners and contractors.</p>
          </div>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>© 2026 OpenPermit. All rights reserved.</p>
        </div>
      </footer>

      {/* Floating AI Button */}
      <FloatingAIButton currentPageName={currentPageName} />

      {/* Auth Modal */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
}