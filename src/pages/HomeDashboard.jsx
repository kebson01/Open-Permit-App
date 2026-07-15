import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import * as db from "@/lib/db";
import { useLicenseAlerts } from "@/hooks/useLicenseAlerts";
import LicenseAlertBanner from "@/components/alerts/LicenseAlertBanner";
import {
  Plus, Search, AlertTriangle, ChevronRight,
  DollarSign, Loader2, FolderOpen, User, Bell,
  Building2, Zap, Waves,
} from "lucide-react";

const PRIMARY   = "#003466";
const HEADING   = "'Hanken Grotesk', system-ui, sans-serif";
const BODY      = "'Public Sans', system-ui, sans-serif";

// Soft four-corner mesh wash behind the whole page
const MESH_BG =
  "radial-gradient(at 0% 0%, rgba(213,227,255,0.35) 0px, transparent 50%)," +
  "radial-gradient(at 100% 0%, rgba(166,200,255,0.22) 0px, transparent 50%)," +
  "radial-gradient(at 100% 100%, rgba(213,227,255,0.30) 0px, transparent 50%)," +
  "radial-gradient(at 0% 100%, rgba(166,200,255,0.22) 0px, transparent 50%)";

const FEATURES = [
  { to: "/ApplyForPermit", kicker: "Permits",   title: "Apply for Permit", Icon: Plus,          bg: "#1a4b84", fg: "#ffffff", glow: "rgba(0,52,102,0.18)" },
  { to: "/FeeCalculator",  kicker: "Calculate",  title: "Fee Calculator",   Icon: DollarSign,    bg: "#c7dfff", fg: "#314862", glow: "rgba(73,96,123,0.18)" },
  { to: "/PermitGuide",    kicker: "Checklist",  title: "Permit Checklist", Icon: User,          bg: "#00489a", fg: "#9abbff", glow: "rgba(0,50,111,0.18)" },
  { to: "/MyProperties",   kicker: "Search",     title: "Find Property",    Icon: Search,        bg: "#eceef0", fg: "#424750", glow: "rgba(0,0,0,0.10)" },
  { to: "/BuildingCodes",  kicker: "Codes",      title: "Building Codes",   Icon: AlertTriangle, bg: "#ffdad6", fg: "#93000a", glow: "rgba(186,26,26,0.18)" },
  { to: "/MyProjects",     kicker: "Manage",     title: "My Projects",      Icon: FolderOpen,    bg: "#d5e3ff", fg: "#144780", glow: "rgba(0,52,102,0.18)" },
];

const UPDATES = [
  { tag: "Building Code", tagColor: PRIMARY,   title: "New Hurricane Season Specs", body: "Updated window and roof reinforcement requirements ahead of the 2026 season.", to: "/BuildingCodes" },
  { tag: "New Law",       tagColor: "#314862", title: "HB 837 – Permit Exemptions", body: "Many single-family projects under $2,500 may no longer require a permit.", to: "/ExemptionChecker" },
  { tag: "Quick Tip",     tagColor: "#00326f", title: "Speed Up Approvals",         body: "Upload blueprints as high-resolution PDFs to avoid review delays.", to: "/PermitGuide" },
];

const POPULAR = [
  { label: "Roofing Permits",       Icon: Building2, to: "/PermitGuide" },
  { label: "Electrical Inspection", Icon: Zap,       to: "/PermitGuide" },
  { label: "Pool Safety Permits",   Icon: Waves,     to: "/PermitGuide" },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function HomeDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [guides, setGuides]   = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const { alerts } = useLicenseAlerts(user?.email);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    setLoading(true);
    Promise.all([
      db.SubmissionGuide.filter({ user_email: user.email }),
      db.Project.filter({ owner_email: user.email }, 'updated_at.desc', 5),
    ]).then(([g, p]) => {
      setGuides(Array.isArray(g) ? g : []);
      setProjects(Array.isArray(p) ? p : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user, authLoading]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f9fb]">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: PRIMARY }} />
      </div>
    );
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";
  const firstName   = displayName.split(" ")[0] || (user ? "there" : null);
  const activeGuides = guides.filter(g => ["in_progress", "ready_to_submit"].includes(g.overall_status));

  return (
    <div className="min-h-screen" style={{ background: "#f7f9fb", backgroundImage: MESH_BG }}>
      <div className="max-w-[1280px] mx-auto px-6 py-10 md:py-12">

        {/* Welcome */}
        <section className="mb-8">
          {user ? (
            <>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-2" style={{ color: PRIMARY, fontFamily: HEADING }}>
                {getGreeting()}, {firstName}!
              </h1>
              <p className="text-lg text-[#424750]" style={{ fontFamily: BODY, lineHeight: 1.6 }}>
                Here's your permit activity overview.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-2" style={{ color: PRIMARY, fontFamily: HEADING }}>
                Welcome to OpenPermit
              </h1>
              <p className="text-lg text-[#424750]" style={{ fontFamily: BODY, lineHeight: 1.6 }}>
                Simplifying South Florida's building permit process with modern tools.
              </p>
            </>
          )}
        </section>

        {/* License Alerts */}
        {user && alerts.length > 0 && (
          <div className="mb-8">
            <LicenseAlertBanner alerts={alerts} />
          </div>
        )}

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ── Main column ──────────────────────────────────────────── */}
          <div className="lg:col-span-8 space-y-6">

            {/* Hero */}
            <Link to="/ApplyForPermit"
              className="group relative block rounded-2xl overflow-hidden no-underline h-[300px] md:h-[400px]"
              style={{ border: "1px solid #c3c6d1", boxShadow: "0 10px 30px -12px rgba(0,52,102,0.25)" }}>
              <img
                src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1400&q=80"
                alt="Start a new permit project"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(0,52,102,0.92) 0%, rgba(0,52,102,0.45) 55%, rgba(0,52,102,0.05) 100%)" }} />
              <div className="relative p-6 md:p-8 flex flex-col h-full justify-end">
                <p className="text-white/85 text-sm font-semibold mb-3 max-w-sm" style={{ fontFamily: BODY }}>
                  Blueprints to permit — start your application in minutes.
                </p>
                <span
                  className="flex items-center gap-3 bg-white text-[#003466] group-hover:bg-[#003466] group-hover:text-white w-fit px-6 py-4 rounded-xl border border-white/10 shadow-lg transition-all"
                  style={{ fontFamily: HEADING, fontSize: 20, fontWeight: 700 }}>
                  <Plus className="w-6 h-6" />
                  Start New Project
                </span>
              </div>
            </Link>

            {/* Primary Actions */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link to="/providers"
                className="flex flex-col items-center justify-center gap-3 p-8 bg-white border border-[#c3c6d1] rounded-2xl hover:border-[#003466] hover:-translate-y-1 hover:shadow-lg transition-all no-underline group">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-1 group-hover:scale-110 transition-transform" style={{ background: "rgba(166,200,255,0.25)" }}>
                  <Search className="w-8 h-8" style={{ color: PRIMARY }} />
                </div>
                <span className="text-lg font-extrabold" style={{ color: PRIMARY, fontFamily: HEADING }}>Find a Professional</span>
              </Link>
              <Link to="/ApplyForPermit"
                className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl hover:-translate-y-1 hover:shadow-lg transition-all no-underline group"
                style={{ background: "rgba(186,26,26,0.06)", border: "1px solid rgba(186,26,26,0.2)" }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-1 group-hover:scale-110 transition-transform" style={{ background: "rgba(186,26,26,0.12)" }}>
                  <AlertTriangle className="w-8 h-8 text-[#ba1a1a]" />
                </div>
                <span className="text-lg font-extrabold text-[#ba1a1a]" style={{ fontFamily: HEADING }}>Emergency Service</span>
              </Link>
            </section>

            {/* Active Applications (logged in) */}
            {user && activeGuides.length > 0 && (
              <section className="rounded-2xl p-5 md:p-6 border" style={{ background: "rgba(242,244,246,0.5)", borderColor: "rgba(195,198,209,0.6)" }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-extrabold" style={{ color: PRIMARY, fontFamily: HEADING }}>Active Applications</h2>
                  <Link to="/ApplyForPermit"
                    className="text-sm font-semibold no-underline flex items-center gap-1"
                    style={{ color: PRIMARY, fontFamily: BODY }}>
                    View All <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeGuides.slice(0, 4).map(g => {
                    const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
                    const d = g.started_date ? new Date(g.started_date) : new Date();
                    const mon = months[d.getMonth()];
                    const day = d.getDate();
                    return (
                      <Link key={g.id} to={`/ApplyForPermit?resume=${g.id}`}
                        className="bg-white border border-[#c3c6d1] rounded-2xl p-5 flex gap-4 items-start no-underline hover:border-[#003466] hover:shadow-sm transition-all">
                        <div className="rounded-xl px-3 py-2 text-center min-w-[52px]" style={{ background: "#d5e3ff" }}>
                          <p className="text-[10px] font-extrabold uppercase" style={{ color: PRIMARY }}>{mon}</p>
                          <p className="text-2xl font-extrabold leading-none" style={{ color: PRIMARY }}>{day}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-extrabold text-sm" style={{ color: "#191c1e", fontFamily: HEADING }}>
                            {g.permit_type_name || "Permit Application"}
                          </p>
                          <p className="text-xs text-[#424750] mt-1" style={{ fontFamily: BODY }}>
                            {g.overall_status?.replace(/_/g, " ")} · {g.city_name}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Features & Tools */}
            <section className="rounded-2xl p-5 md:p-6 border" style={{ background: "rgba(242,244,246,0.45)", borderColor: "rgba(195,198,209,0.5)" }}>
              <h2 className="text-2xl font-extrabold tracking-tight mb-5" style={{ color: PRIMARY, fontFamily: HEADING }}>
                Features &amp; Tools
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {FEATURES.map(({ to, kicker, title, Icon, bg, fg, glow }) => (
                  <Link key={title} to={to}
                    className="flex items-center gap-5 p-5 bg-white border border-[#c3c6d1] rounded-2xl hover:border-[#003466] hover:-translate-y-1 hover:shadow-lg transition-all no-underline group">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"
                      style={{ background: bg, color: fg, boxShadow: `0 0 15px ${glow}` }}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#737781]" style={{ fontFamily: BODY }}>{kicker}</p>
                      <p className="text-base font-extrabold" style={{ fontFamily: HEADING, color: "#191c1e" }}>{title}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          {/* ── Sidebar ──────────────────────────────────────────────── */}
          <aside className="lg:col-span-4 space-y-6">

            {/* Recent Updates */}
            <div className="bg-white border border-[#c3c6d1] rounded-2xl overflow-hidden shadow-sm">
              <div className="relative h-32">
                <img
                  src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80"
                  alt="South Florida homes"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,52,102,0.15) 0%, rgba(0,52,102,0.75) 100%)" }} />
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                  <h3 className="text-lg font-extrabold text-white" style={{ fontFamily: HEADING }}>Recent Updates</h3>
                  <Bell className="w-5 h-5 text-white/90" />
                </div>
              </div>
              <div className="p-5 space-y-4">
                {UPDATES.map((u, i) => (
                  <Link key={u.title} to={u.to}
                    className={`block no-underline ${i < UPDATES.length - 1 ? "pb-4 border-b border-[#e0e3e5]" : ""}`}>
                    <p className="text-[10px] font-extrabold uppercase tracking-wider mb-1" style={{ color: u.tagColor, fontFamily: BODY }}>{u.tag}</p>
                    <p className="text-sm font-extrabold mb-1" style={{ color: "#191c1e", fontFamily: HEADING }}>{u.title}</p>
                    <p className="text-xs leading-relaxed text-[#424750]" style={{ fontFamily: BODY }}>{u.body}</p>
                  </Link>
                ))}
                <Link to="/BuildingCodes"
                  className="w-full flex items-center justify-center gap-1 text-sm font-bold no-underline hover:underline"
                  style={{ color: PRIMARY, fontFamily: BODY }}>
                  View All News <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Popular Services */}
            <div className="rounded-2xl p-5 border" style={{ background: "rgba(0,52,102,0.04)", borderColor: "rgba(0,52,102,0.12)" }}>
              <h3 className="text-lg font-extrabold mb-4" style={{ color: PRIMARY, fontFamily: HEADING }}>Popular Services</h3>
              <ul className="space-y-1.5">
                {POPULAR.map(({ label, Icon, to }) => (
                  <li key={label}>
                    <Link to={to}
                      className="flex items-center gap-3 p-2.5 rounded-lg transition-colors text-[#424750] hover:bg-white hover:text-[#003466] no-underline">
                      <Icon className="w-5 h-5" style={{ color: PRIMARY }} />
                      <span className="text-sm font-semibold" style={{ fontFamily: BODY }}>{label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>

        {/* Guest CTA Banner */}
        {!user && (
          <section className="relative overflow-hidden rounded-2xl p-10 md:p-14 text-center mt-10 shadow-xl" style={{ background: PRIMARY, border: "1px solid #1a4b84" }}>
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }} />
            <div className="absolute -bottom-24 -left-24 w-56 h-56 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }} />
            <div className="relative z-10">
              <h3 className="font-extrabold text-white text-2xl md:text-3xl mb-2" style={{ fontFamily: HEADING }}>Ready to get started?</h3>
              <p className="text-white/80 text-lg mb-6 max-w-2xl mx-auto" style={{ fontFamily: BODY, lineHeight: 1.6 }}>
                Create a free account to track applications and manage your projects from one centralized dashboard.
              </p>
              <Link to="/signup"
                className="inline-flex items-center gap-2 bg-white font-extrabold px-8 py-3.5 rounded-xl text-base transition-colors hover:bg-[#f2f4f6] no-underline group"
                style={{ color: PRIMARY, fontFamily: HEADING }}>
                Get Started <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="border-t border-[#c3c6d1] pt-8 mt-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="text-lg font-extrabold" style={{ fontFamily: HEADING, color: PRIMARY }}>OpenPermit</span>
            <p className="text-sm text-[#424750] mt-1 max-w-xs" style={{ fontFamily: BODY }}>
              © {new Date().getFullYear()} OpenPermit Municipal Services. All rights reserved.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 md:gap-6">
            <Link to="/privacy" className="text-sm font-semibold text-[#424750] hover:text-[#003466] transition-colors no-underline" style={{ fontFamily: BODY }}>Privacy Policy</Link>
            <Link to="/terms" className="text-sm font-semibold text-[#424750] hover:text-[#003466] transition-colors no-underline" style={{ fontFamily: BODY }}>Terms of Service</Link>
            <Link to="/accessibility" className="text-sm font-semibold text-[#424750] hover:text-[#003466] transition-colors no-underline" style={{ fontFamily: BODY }}>Accessibility</Link>
            <a href="mailto:support@open-permit.com" className="text-sm font-semibold text-[#424750] hover:text-[#003466] transition-colors no-underline" style={{ fontFamily: BODY }}>Contact Support</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
