import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Building2, FileText, FolderOpen, ArrowRight, AlertCircle,
  Clock, CheckCircle2, Plus, TrendingUp, Loader2, Play
} from "lucide-react";

const PRIMARY = "#004ac6";
const FONTS = { h: "'Manrope', system-ui, sans-serif", b: "'Plus Jakarta Sans', system-ui, sans-serif" };

const STATUS_STYLES = {
  in_progress:     { bg: "bg-blue-100",    text: "text-blue-700",    label: "In Progress" },
  ready_to_submit: { bg: "bg-amber-100",   text: "text-amber-700",   label: "Ready to Submit" },
  submitted:       { bg: "bg-green-100",   text: "text-green-700",   label: "Submitted" },
  approved:        { bg: "bg-emerald-100", text: "text-emerald-700", label: "Approved" },
  rejected:        { bg: "bg-red-100",     text: "text-red-700",     label: "Rejected" },
  not_started:     { bg: "bg-gray-100",    text: "text-gray-600",    label: "Not Started" },
};

const PROJECT_STATUS_COLORS = {
  planning:    { bg: "bg-gray-100",   text: "text-gray-700" },
  permitting:  { bg: "bg-blue-100",   text: "text-blue-700" },
  in_progress: { bg: "bg-amber-100",  text: "text-amber-700" },
  completed:   { bg: "bg-green-100",  text: "text-green-700" },
  on_hold:     { bg: "bg-orange-100", text: "text-orange-700" },
};

function StatCard({ label, value, sub, color = PRIMARY }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1" style={{ fontFamily: FONTS.b }}>{label}</p>
      <p className="text-3xl font-extrabold" style={{ fontFamily: FONTS.h, color }}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1" style={{ fontFamily: FONTS.b }}>{sub}</p>}
    </div>
  );
}

function SectionCard({ title, icon: Icon, children, action, actionHref }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-gray-400" />
          <h3 className="font-bold text-gray-800 text-sm" style={{ fontFamily: FONTS.h }}>{title}</h3>
        </div>
        {action && actionHref && (
          <Link to={actionHref} className="text-xs font-semibold flex items-center gap-1 hover:opacity-80" style={{ color: PRIMARY, fontFamily: FONTS.b, textDecoration: "none" }}>
            {action} <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── HOMEOWNER DASHBOARD ──
function HomeownerDashboard({ user }) {
  const [guides, setGuides] = useState([]);
  const [projects, setProjects] = useState([]);
  const [permits, setPermits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.SubmissionGuide.filter({ user_email: user.email }, "-updated_date", 5),
      base44.entities.Project.filter({ owner_email: user.email }, "-updated_date", 5),
      base44.entities.PermitRecord.list("-updated_date", 3),
    ]).then(([g, p, pr]) => {
      setGuides(Array.isArray(g) ? g.filter(x => ["in_progress","ready_to_submit"].includes(x.overall_status)) : []);
      setProjects(Array.isArray(p) ? p : []);
      setPermits(Array.isArray(pr) ? pr : []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>;

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Active Applications" value={guides.length} color={PRIMARY} />
        <StatCard label="My Projects" value={projects.length} color="#006a61" />
        <StatCard label="Recent Permits" value={permits.length} sub="last 3" color="#7c3aed" />
        <StatCard label="Status" value={guides.some(g => g.overall_status === "ready_to_submit") ? "Action Needed" : "All Good"} color={guides.some(g => g.overall_status === "ready_to_submit") ? "#f59e0b" : "#16a34a"} />
      </div>

      {/* Resume banner */}
      {guides.length > 0 && (
        <div className="rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap" style={{ background: "#eff4ff", border: "1px solid #c7d7ff" }}>
          <div className="flex items-center gap-3">
            <Play className="w-5 h-5" style={{ color: PRIMARY }} />
            <div>
              <p className="font-bold text-sm" style={{ color: PRIMARY, fontFamily: FONTS.h }}>Resume Your Application</p>
              <p className="text-xs text-gray-500" style={{ fontFamily: FONTS.b }}>{guides[0].permit_type_name} · {guides[0].city_name}</p>
            </div>
          </div>
          <Link
            to={`/ApplyForPermit?resume=${guides[0].id}`}
            className="text-sm font-bold px-4 py-2 rounded-xl text-white"
            style={{ background: PRIMARY, fontFamily: FONTS.b, textDecoration: "none" }}
          >
            Resume →
          </Link>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        {/* Active Applications */}
        <SectionCard title="Active Applications" icon={FileText} action="View All" actionHref="/ApplyForPermit">
          {guides.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-400" style={{ fontFamily: FONTS.b }}>No active applications</p>
              <Link to="/ApplyForPermit" className="inline-flex items-center gap-1 mt-2 text-sm font-semibold" style={{ color: PRIMARY, textDecoration: "none" }}>
                <Plus className="w-3.5 h-3.5" /> Start one
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {guides.map(g => {
                const s = STATUS_STYLES[g.overall_status] || STATUS_STYLES.not_started;
                return (
                  <Link key={g.id} to={`/ApplyForPermit?resume=${g.id}`}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors"
                    style={{ textDecoration: "none" }}>
                    <div>
                      <p className="text-sm font-semibold text-gray-800" style={{ fontFamily: FONTS.b }}>{g.permit_type_name}</p>
                      <p className="text-xs text-gray-400">{g.city_name}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${s.bg} ${s.text}`}>{s.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* My Projects */}
        <SectionCard title="My Projects" icon={FolderOpen} action="View All" actionHref="/MyProjects">
          {projects.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-400" style={{ fontFamily: FONTS.b }}>No projects yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {projects.slice(0, 4).map(p => {
                const st = PROJECT_STATUS_COLORS[p.status] || PROJECT_STATUS_COLORS.planning;
                return (
                  <Link key={p.id} to={`/MyProjects?id=${p.id}`}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors"
                    style={{ textDecoration: "none" }}>
                    <div>
                      <p className="text-sm font-semibold text-gray-800" style={{ fontFamily: FONTS.b }}>{p.name}</p>
                      <p className="text-xs text-gray-400">{p.city_name}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${st.bg} ${st.text}`}>{p.status?.replace("_", " ")}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Big CTA */}
      <div className="rounded-2xl p-6 text-center" style={{ background: PRIMARY }}>
        <h3 className="font-extrabold text-white text-xl mb-2" style={{ fontFamily: FONTS.h }}>Ready to start a new permit?</h3>
        <p className="text-blue-200 text-sm mb-4" style={{ fontFamily: FONTS.b }}>We'll guide you through every step — from choosing the right permit type to submitting your application.</p>
        <Link to="/ApplyForPermit" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-white"
          style={{ color: PRIMARY, fontFamily: FONTS.h, textDecoration: "none" }}>
          Start New Application <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

// ── CONTRACTOR DASHBOARD ──
function ContractorDashboard({ user }) {
  const [projects, setProjects] = useState([]);
  const [guides, setGuides] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Project.filter({ owner_email: user.email }, "-updated_date", 10),
      base44.entities.SubmissionGuide.filter({ user_email: user.email }, "-updated_date", 5),
      base44.entities.ContractorProfile.filter({ user_email: user.email }),
    ]).then(([p, g, cp]) => {
      setProjects(Array.isArray(p) ? p : []);
      setGuides(Array.isArray(g) ? g.filter(x => ["in_progress","ready_to_submit"].includes(x.overall_status)) : []);
      setProfile(Array.isArray(cp) && cp.length > 0 ? cp[0] : null);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>;

  const statusCounts = projects.reduce((acc, p) => { acc[p.status] = (acc[p.status] || 0) + 1; return acc; }, {});
  const licenseExpiring = profile?.license_expiration && (() => {
    const days = Math.ceil((new Date(profile.license_expiration) - new Date()) / 86400000);
    return days < 60 ? days : null;
  })();

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Planning" value={statusCounts.planning || 0} color="#6b7280" />
        <StatCard label="Permitting" value={statusCounts.permitting || 0} color={PRIMARY} />
        <StatCard label="In Progress" value={statusCounts.in_progress || 0} color="#f59e0b" />
        <StatCard label="Completed" value={statusCounts.completed || 0} color="#16a34a" />
      </div>

      {/* License warning */}
      {licenseExpiring !== null && (
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: "#fff7ed", border: "1px solid #fed7aa" }}>
          <AlertCircle className="w-5 h-5 text-orange-500 shrink-0" />
          <div>
            <p className="font-bold text-sm text-orange-800" style={{ fontFamily: FONTS.h }}>License Expiring Soon</p>
            <p className="text-xs text-orange-700" style={{ fontFamily: FONTS.b }}>Your contractor license expires in {licenseExpiring} days. <Link to="/MyAccount" style={{ color: "#ea580c" }}>Update it now →</Link></p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        <SectionCard title="Active Applications" icon={FileText} action="Start New" actionHref="/ApplyForPermit">
          {guides.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4" style={{ fontFamily: FONTS.b }}>No active applications</p>
          ) : (
            <div className="space-y-2">
              {guides.map(g => {
                const s = STATUS_STYLES[g.overall_status] || STATUS_STYLES.not_started;
                return (
                  <Link key={g.id} to={`/ApplyForPermit?resume=${g.id}`}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50"
                    style={{ textDecoration: "none" }}>
                    <div>
                      <p className="text-sm font-semibold text-gray-800" style={{ fontFamily: FONTS.b }}>{g.permit_type_name}</p>
                      <p className="text-xs text-gray-400">{g.city_name}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${s.bg} ${s.text}`}>{s.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </SectionCard>

        <SectionCard title="My Projects" icon={FolderOpen} action="View All" actionHref="/MyProjects">
          {projects.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4" style={{ fontFamily: FONTS.b }}>No projects yet</p>
          ) : (
            <div className="space-y-2">
              {projects.slice(0, 4).map(p => {
                const st = PROJECT_STATUS_COLORS[p.status] || PROJECT_STATUS_COLORS.planning;
                return (
                  <Link key={p.id} to={`/MyProjects?id=${p.id}`}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50"
                    style={{ textDecoration: "none" }}>
                    <div>
                      <p className="text-sm font-semibold text-gray-800" style={{ fontFamily: FONTS.b }}>{p.name}</p>
                      <p className="text-xs text-gray-400">{p.city_name}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${st.bg} ${st.text}`}>{p.status?.replace("_", " ")}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

// ── ADMIN DASHBOARD ──
function AdminDashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [recentGuides, setRecentGuides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.City.list(),
      base44.entities.PermitType.list(),
      base44.entities.SubmissionGuide.list("-updated_date", 5),
      base44.entities.User.list(),
    ]).then(([cities, permits, guides, users]) => {
      const statusCounts = guides.reduce((acc, g) => { acc[g.overall_status] = (acc[g.overall_status] || 0) + 1; return acc; }, {});
      setStats({ cities: cities.length, permitTypes: permits.length, guides: guides.length, users: users.length, statusCounts });
      setRecentGuides(guides.slice(0, 5));
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Users" value={stats?.users || 0} />
        <StatCard label="Cities" value={stats?.cities || 0} color="#006a61" />
        <StatCard label="Permit Types" value={stats?.permitTypes || 0} color="#7c3aed" />
        <StatCard label="Total Guides" value={stats?.guides || 0} color="#f59e0b" />
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <SectionCard title="Submission Guide Status" icon={TrendingUp}>
          <div className="space-y-2">
            {Object.entries(stats?.statusCounts || {}).map(([status, count]) => {
              const s = STATUS_STYLES[status] || { bg: "bg-gray-100", text: "text-gray-600", label: status };
              return (
                <div key={status} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-gray-50">
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${s.bg} ${s.text}`}>{s.label}</span>
                  <span className="text-sm font-bold text-gray-800" style={{ fontFamily: FONTS.h }}>{count}</span>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard title="Quick Links" icon={ArrowRight}>
          <div className="space-y-2">
            {[
              { label: "Admin Panel", path: "/admin" },
              { label: "Data Health Check", path: "/admin/health" },
              { label: "Manage Cities", path: "/admin" },
              { label: "Fee Rules", path: "/admin" },
            ].map(item => (
              <Link key={item.path + item.label} to={item.path}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 border border-gray-100"
                style={{ textDecoration: "none" }}>
                <span className="text-sm font-semibold text-gray-700" style={{ fontFamily: FONTS.b }}>{item.label}</span>
                <ArrowRight className="w-4 h-4 text-gray-300" />
              </Link>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

// ── NOT LOGGED IN ──
function GuestDashboard({ onSignIn }) {
  return (
    <div className="max-w-2xl mx-auto text-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: "#eff4ff" }}>
        <FileText className="w-8 h-8" style={{ color: PRIMARY }} />
      </div>
      <h2 className="font-extrabold text-2xl text-gray-900 mb-3" style={{ fontFamily: FONTS.h }}>Welcome to OpenPermit</h2>
      <p className="text-gray-500 mb-8" style={{ fontFamily: FONTS.b }}>
        Your all-in-one platform for navigating South Florida building permits. Sign in to track your applications, manage projects, and get guided through every step.
      </p>
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {[
          { icon: Building2, label: "My Properties", desc: "Track your properties and permit history" },
          { icon: FileText,  label: "Apply for Permit", desc: "Step-by-step guided permit applications" },
          { icon: FolderOpen, label: "My Projects", desc: "Manage all your construction projects" },
        ].map(item => (
          <div key={item.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-left">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: "#eff4ff" }}>
              <item.icon className="w-4 h-4" style={{ color: PRIMARY }} />
            </div>
            <p className="font-bold text-sm text-gray-800 mb-1" style={{ fontFamily: FONTS.h }}>{item.label}</p>
            <p className="text-xs text-gray-400" style={{ fontFamily: FONTS.b }}>{item.desc}</p>
          </div>
        ))}
      </div>
      <button
        onClick={onSignIn}
        className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white text-sm"
        style={{ background: PRIMARY, fontFamily: FONTS.h }}
      >
        Sign In to Get Started <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── MAIN PAGE ──
export default function HomeDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => { setCurrentUser(u); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f8f9ff" }}>
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  const role = currentUser?.role;

  return (
    <div className="min-h-screen pb-8" style={{ background: "#f8f9ff" }}>
      {/* Hero header */}
      <div className="px-4 pt-7 pb-6" style={{ background: "#fff", borderBottom: "1px solid #e8eaf0" }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#9ca3af", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {currentUser ? `Welcome back, ${currentUser.full_name?.split(" ")[0] || "there"}` : "OpenPermit"}
          </p>
          <h1 className="font-extrabold text-2xl text-gray-900" style={{ fontFamily: "'Manrope', sans-serif" }}>
            {currentUser
              ? (role === "admin" ? "Admin Dashboard" : "Your Dashboard")
              : "Building Permits Made Simple"}
          </h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6">
        {!currentUser ? (
          <GuestDashboard onSignIn={() => base44.auth.redirectToLogin(window.location.href)} />
        ) : role === "admin" || role === "city_admin" ? (
          <AdminDashboard user={currentUser} />
        ) : currentUser.role === "contractor" ? (
          <ContractorDashboard user={currentUser} />
        ) : (
          <HomeownerDashboard user={currentUser} />
        )}
      </div>
    </div>
  );
}