import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import * as db from "@/lib/db";
import { useLicenseAlerts } from "@/hooks/useLicenseAlerts";
import LicenseAlertBanner from "@/components/alerts/LicenseAlertBanner";
import {
  Plus, Search, AlertTriangle, ChevronRight,
  DollarSign, Loader2, FolderOpen, User
} from "lucide-react";

const PRIMARY   = "#003466";
const HEADING   = "'Hanken Grotesk', system-ui, sans-serif";
const BODY      = "'Public Sans', system-ui, sans-serif";

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

  return (
    <div className="min-h-screen" style={{ background: "#f7f9fb" }}>
      <div className="max-w-[1280px] mx-auto px-6 py-12">

        {/* Welcome */}
        <section className="mb-10">
          {user ? (
            <>
              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-2" style={{ color: PRIMARY, fontFamily: HEADING }}>
                {getGreeting()}, {firstName}!
              </h1>
              <p className="text-lg text-[#424750] max-w-xl" style={{ fontFamily: BODY, lineHeight: 1.6 }}>
                Here's your permit activity overview.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-2" style={{ color: PRIMARY, fontFamily: HEADING }}>
                Welcome to OpenPermit
              </h1>
              <p className="text-lg text-[#424750] max-w-xl" style={{ fontFamily: BODY, lineHeight: 1.6 }}>
                South Florida building permits made simple.
              </p>
            </>
          )}
        </section>

        {/* License Alerts */}
        {user && alerts.length > 0 && (
          <div className="mb-10">
            <LicenseAlertBanner alerts={alerts} />
          </div>
        )}

        {/* Hero Banner */}
        <Link to="/ApplyForPermit"
          className="relative block rounded-2xl overflow-hidden no-underline mb-12 h-[260px] md:h-[320px]"
          style={{ border: "1px solid #c3c6d1", boxShadow: "0 1px 4px rgba(15,23,42,0.04)" }}>
          <img
            src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&q=80"
            alt="Start New Project"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(0,52,102,0.95) 0%, rgba(0,52,102,0.6) 50%, rgba(0,52,102,0.2) 100%)" }} />
          <div className="relative p-8 flex flex-col h-full justify-end">
            <button
              className="flex items-center gap-3 bg-[#003466] hover:bg-[#1a4b84] text-white w-fit px-6 py-4 rounded-xl border border-white/10 transition-all"
              style={{ fontFamily: HEADING, fontSize: 20, fontWeight: 700 }}>
              <Plus className="w-6 h-6" />
              Start New Project
            </button>
          </div>
        </Link>

        {/* Primary Actions */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Link to="/providers"
            className="flex flex-col items-center justify-center gap-3 p-8 bg-white border border-[#c3c6d1] rounded-2xl hover:border-[#003466] hover:shadow-sm transition-all no-underline group">
            <Search className="w-8 h-8 group-hover:scale-110 transition-transform" style={{ color: PRIMARY }} />
            <span className="text-lg font-extrabold" style={{ color: PRIMARY, fontFamily: HEADING }}>Find a Professional</span>
          </Link>
          <Link to="/ApplyForPermit"
            className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl hover:shadow-sm transition-all no-underline group"
            style={{ background: "rgba(186,26,26,0.06)", border: "1px solid rgba(186,26,26,0.2)" }}>
            <AlertTriangle className="w-8 h-8 text-[#ba1a1a] group-hover:scale-110 transition-transform" />
            <span className="text-lg font-extrabold text-[#ba1a1a]" style={{ fontFamily: HEADING }}>Emergency Service</span>
          </Link>
        </section>

        {/* Features & Tools */}
        <section className="mb-12">
          <h2 className="text-2xl font-extrabold tracking-tight mb-6" style={{ color: PRIMARY, fontFamily: HEADING }}>
            Features &amp; Tools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Apply for Permit */}
            <Link to="/ApplyForPermit"
              className="flex items-center gap-5 p-5 bg-white border border-[#c3c6d1] rounded-2xl hover:border-[#003466] hover:-translate-y-0.5 transition-all no-underline">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#1a4b84", color: "white" }}>
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#737781]" style={{ fontFamily: BODY }}>Permits</p>
                <p className="text-base font-extrabold" style={{ fontFamily: HEADING, color: "#191c1e" }}>Apply for Permit</p>
              </div>
            </Link>

            {/* Fee Calculator */}
            <Link to="/FeeCalculator"
              className="flex items-center gap-5 p-5 bg-white border border-[#c3c6d1] rounded-2xl hover:border-[#003466] hover:-translate-y-0.5 transition-all no-underline">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#c7dfff", color: "#4c637e" }}>
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#737781]" style={{ fontFamily: BODY }}>Calculate</p>
                <p className="text-base font-extrabold" style={{ fontFamily: HEADING, color: "#191c1e" }}>Fee Calculator</p>
              </div>
            </Link>

            {/* Permit Guide */}
            <Link to="/PermitGuide"
              className="flex items-center gap-5 p-5 bg-white border border-[#c3c6d1] rounded-2xl hover:border-[#003466] hover:-translate-y-0.5 transition-all no-underline">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#00489a", color: "#9abbff" }}>
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#737781]" style={{ fontFamily: BODY }}>Checklist</p>
                <p className="text-base font-extrabold" style={{ fontFamily: HEADING, color: "#191c1e" }}>Permit Checklist</p>
              </div>
            </Link>

            {/* Find Property */}
            <Link to="/MyProperties"
              className="flex items-center gap-5 p-5 bg-white border border-[#c3c6d1] rounded-2xl hover:border-[#003466] hover:-translate-y-0.5 transition-all no-underline">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#eceef0", color: "#424750" }}>
                <Search className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#737781]" style={{ fontFamily: BODY }}>Search</p>
                <p className="text-base font-extrabold" style={{ fontFamily: HEADING, color: "#191c1e" }}>Find Property</p>
              </div>
            </Link>

            {/* Building Codes */}
            <Link to="/BuildingCodes"
              className="flex items-center gap-5 p-5 bg-white border border-[#c3c6d1] rounded-2xl hover:border-[#003466] hover:-translate-y-0.5 transition-all no-underline">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#ffdad6", color: "#93000a" }}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#737781]" style={{ fontFamily: BODY }}>Codes</p>
                <p className="text-base font-extrabold" style={{ fontFamily: HEADING, color: "#191c1e" }}>Building Codes</p>
              </div>
            </Link>

            {/* My Projects */}
            <Link to="/MyProjects"
              className="flex items-center gap-5 p-5 bg-white border border-[#c3c6d1] rounded-2xl hover:border-[#003466] hover:-translate-y-0.5 transition-all no-underline">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#d5e3ff", color: "#144780" }}>
                <FolderOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#737781]" style={{ fontFamily: BODY }}>Manage</p>
                <p className="text-base font-extrabold" style={{ fontFamily: HEADING, color: "#191c1e" }}>My Projects</p>
              </div>
            </Link>
          </div>
        </section>

        {/* Guest CTA */}
        {!user && (
          <section className="rounded-2xl p-10 md:p-12 text-center mb-12" style={{ background: PRIMARY, border: "1px solid #1a4b84" }}>
            <h3 className="font-extrabold text-white text-2xl mb-2" style={{ fontFamily: HEADING }}>Get started today</h3>
            <p className="text-white/80 text-lg mb-6 max-w-2xl mx-auto" style={{ fontFamily: BODY, lineHeight: 1.6 }}>
              Create a free account to track applications and manage your projects from one centralized dashboard.
            </p>
            <Link to="/signup"
              className="inline-flex items-center gap-2 bg-white font-extrabold px-8 py-3.5 rounded-xl text-base transition-colors hover:bg-[#f2f4f6] no-underline"
              style={{ color: PRIMARY, fontFamily: HEADING }}>
              Get Started <ChevronRight className="w-5 h-5" />
            </Link>
          </section>
        )}

        {/* Active Applications (logged in) */}
        {user && guides.filter(g => ["in_progress", "ready_to_submit"].includes(g.overall_status)).length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-extrabold" style={{ color: PRIMARY, fontFamily: HEADING }}>Active Applications</h2>
              <Link to="/ApplyForPermit"
                className="text-sm font-semibold no-underline flex items-center gap-1"
                style={{ color: PRIMARY, fontFamily: BODY }}>
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {guides.filter(g => ["in_progress", "ready_to_submit"].includes(g.overall_status)).slice(0, 4).map(g => {
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

        {/* Footer */}
        <footer className="border-t border-[#c3c6d1] pt-8 mt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="text-lg font-extrabold" style={{ fontFamily: HEADING, color: PRIMARY }}>OpenPermit</span>
            <p className="text-sm text-[#424750] mt-1 max-w-xs" style={{ fontFamily: BODY }}>
              © 2024 OpenPermit Municipal Services. All rights reserved.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 md:gap-6">
            <a href="#" className="text-sm font-semibold text-[#424750] hover:text-[#003466] transition-colors no-underline" style={{ fontFamily: BODY }}>Privacy Policy</a>
            <a href="#" className="text-sm font-semibold text-[#424750] hover:text-[#003466] transition-colors no-underline" style={{ fontFamily: BODY }}>Terms of Service</a>
            <a href="#" className="text-sm font-semibold text-[#424750] hover:text-[#003466] transition-colors no-underline" style={{ fontFamily: BODY }}>Accessibility</a>
            <a href="#" className="text-sm font-semibold text-[#424750] hover:text-[#003466] transition-colors no-underline" style={{ fontFamily: BODY }}>Contact Support</a>
          </div>
        </footer>
      </div>
    </div>
  );
}