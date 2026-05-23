import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import * as db from "@/lib/db";
import {
  Building2, FileText, FolderOpen, ArrowRight,
  CheckCircle2, Plus, TrendingUp, Loader2, Play
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import PanelCard from "@/components/ui/PanelCard";
import Btn from "@/components/ui/Btn";
import Callout from "@/components/ui/Callout";

const STATUS_STYLES = {
  in_progress:     { bg: "bg-blue-100",    text: "text-blue-700",    label: "In Progress" },
  ready_to_submit: { bg: "bg-warning-50",  text: "text-warning",     label: "Ready to Submit" },
  submitted:       { bg: "bg-success-50",  text: "text-success",     label: "Submitted" },
  approved:        { bg: "bg-green-100",   text: "text-green-700",   label: "Approved" },
  rejected:        { bg: "bg-danger-50",   text: "text-danger",      label: "Rejected" },
  not_started:     { bg: "bg-surface",     text: "text-muted",       label: "Not Started" },
};

const PROJECT_STATUS_COLORS = {
  planning:    { bg: "bg-surface",       text: "text-muted" },
  permitting:  { bg: "bg-action-50",     text: "text-action" },
  in_progress: { bg: "bg-warning-50",    text: "text-warning" },
  completed:   { bg: "bg-success-50",    text: "text-success" },
  on_hold:     { bg: "bg-orange-50",     text: "text-orange-700" },
};

// ── HOMEOWNER DASHBOARD ──
function HomeownerDashboard({ user }) {
  const [guides, setGuides] = useState([]);
  const [projects, setProjects] = useState([]);
  const [permits, setPermits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      db.SubmissionGuide.filter({ user_email: user.email }),
      db.Project.filter({ owner_email: user.email }, 'updated_at.desc', 5),
      db.PermitRecord.list('OPEN_DATE.desc', 3),
    ]).then(([g, p, pr]) => {
      setGuides(Array.isArray(g) ? g.filter(x => ["in_progress","ready_to_submit"].includes(x.overall_status)) : []);
      setProjects(Array.isArray(p) ? p : []);
      setPermits(Array.isArray(pr) ? pr : []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-action" /></div>;

  const hasAction = guides.some(g => g.overall_status === "ready_to_submit");

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Active Applications" value={guides.length} tone="default" />
        <StatCard label="My Projects" value={projects.length} tone="default" />
        <StatCard label="Recent Permits" value={permits.length} sub="last 3" tone="default" />
        <StatCard label="Status" value={hasAction ? "Action Needed" : "All Good"} tone={hasAction ? "warning" : "success"} />
      </div>

      {/* Resume banner */}
      {guides.length > 0 && (
        <Callout variant="info" icon={<Play className="w-4 h-4" />} title="Resume Your Application">
          <div className="flex items-center justify-between gap-3 flex-wrap mt-1">
            <span>{guides[0].permit_type_name} · {guides[0].city_name}</span>
            <Btn variant="primary" size="sm" as={Link} to={`/ApplyForPermit?resume=${guides[0].id}`}>
              Resume →
            </Btn>
          </div>
        </Callout>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        {/* Active Applications */}
        <PanelCard
          title="Active Applications"
          icon={<FileText className="w-4 h-4" />}
          action={<Btn variant="ghost" size="sm" as={Link} to="/ApplyForPermit">View All</Btn>}
        >
          {guides.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted mb-2">No active applications</p>
              <Btn variant="ghost" size="sm" as={Link} to="/ApplyForPermit">
                <Plus className="w-3.5 h-3.5" /> Start one
              </Btn>
            </div>
          ) : (
            <div className="space-y-1">
              {guides.map(g => {
                const s = STATUS_STYLES[g.overall_status] || STATUS_STYLES.not_started;
                return (
                  <Link key={g.id} to={`/ApplyForPermit?resume=${g.id}`}
                    className="flex items-center justify-between p-3 rounded-control hover:bg-surface transition-colors no-underline">
                    <div>
                      <p className="text-sm font-semibold text-ink">{g.permit_type_name}</p>
                      <p className="text-xs text-muted">{g.city_name}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${s.bg} ${s.text}`}>{s.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </PanelCard>

        {/* My Projects */}
        <PanelCard
          title="My Projects"
          icon={<FolderOpen className="w-4 h-4" />}
          action={<Btn variant="ghost" size="sm" as={Link} to="/MyProjects">View All</Btn>}
        >
          {projects.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted">No projects yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {projects.slice(0, 4).map(p => {
                const st = PROJECT_STATUS_COLORS[p.status] || PROJECT_STATUS_COLORS.planning;
                return (
                  <Link key={p.id} to={`/MyProjects?id=${p.id}`}
                    className="flex items-center justify-between p-3 rounded-control hover:bg-surface transition-colors no-underline">
                    <div>
                      <p className="text-sm font-semibold text-ink">{p.name}</p>
                      <p className="text-xs text-muted">{p.city_name}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${st.bg} ${st.text}`}>{p.status?.replace("_", " ")}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </PanelCard>
      </div>

      {/* Big CTA */}
      <div className="rounded-card bg-action p-6 text-center">
        <h3 className="font-extrabold text-white text-xl mb-2">Ready to start a new permit?</h3>
        <p className="text-blue-200 text-sm mb-4">We'll guide you through every step — from choosing the right permit type to submitting your application.</p>
        <Btn variant="secondary" size="lg" as={Link} to="/ApplyForPermit">
          Start New Application <ArrowRight className="w-4 h-4" />
        </Btn>
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
      db.Project.filter({ owner_email: user.email }, 'updated_at.desc', 10),
      db.SubmissionGuide.filter({ user_email: user.email }),
      db.ContractorProfile.filter({ user_email: user.email }),
    ]).then(([p, g, cp]) => {
      setProjects(Array.isArray(p) ? p : []);
      setGuides(Array.isArray(g) ? g.filter(x => ["in_progress","ready_to_submit"].includes(x.overall_status)) : []);
      setProfile(Array.isArray(cp) && cp.length > 0 ? cp[0] : null);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-action" /></div>;

  const statusCounts = projects.reduce((acc, p) => { acc[p.status] = (acc[p.status] || 0) + 1; return acc; }, {});
  const licenseExpiring = profile?.license_expiration && (() => {
    const days = Math.ceil((new Date(profile.license_expiration) - new Date()) / 86400000);
    return days < 60 ? days : null;
  })();

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Planning" value={statusCounts.planning || 0} tone="default" />
        <StatCard label="Permitting" value={statusCounts.permitting || 0} tone="default" />
        <StatCard label="In Progress" value={statusCounts.in_progress || 0} tone="warning" />
        <StatCard label="Completed" value={statusCounts.completed || 0} tone="success" />
      </div>

      {licenseExpiring !== null && (
        <Callout variant="warning" title="License Expiring Soon">
          Your contractor license expires in {licenseExpiring} days.{" "}
          <Link to="/MyAccount" className="font-semibold underline">Update it now →</Link>
        </Callout>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        <PanelCard
          title="Active Applications"
          icon={<FileText className="w-4 h-4" />}
          action={<Btn variant="ghost" size="sm" as={Link} to="/ApplyForPermit">Start New</Btn>}
        >
          {guides.length === 0 ? (
            <p className="text-sm text-muted text-center py-4">No active applications</p>
          ) : (
            <div className="space-y-1">
              {guides.map(g => {
                const s = STATUS_STYLES[g.overall_status] || STATUS_STYLES.not_started;
                return (
                  <Link key={g.id} to={`/ApplyForPermit?resume=${g.id}`}
                    className="flex items-center justify-between p-3 rounded-control hover:bg-surface no-underline">
                    <div>
                      <p className="text-sm font-semibold text-ink">{g.permit_type_name}</p>
                      <p className="text-xs text-muted">{g.city_name}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${s.bg} ${s.text}`}>{s.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </PanelCard>

        <PanelCard
          title="My Projects"
          icon={<FolderOpen className="w-4 h-4" />}
          action={<Btn variant="ghost" size="sm" as={Link} to="/MyProjects">View All</Btn>}
        >
          {projects.length === 0 ? (
            <p className="text-sm text-muted text-center py-4">No projects yet</p>
          ) : (
            <div className="space-y-1">
              {projects.slice(0, 4).map(p => {
                const st = PROJECT_STATUS_COLORS[p.status] || PROJECT_STATUS_COLORS.planning;
                return (
                  <Link key={p.id} to={`/MyProjects?id=${p.id}`}
                    className="flex items-center justify-between p-3 rounded-control hover:bg-surface no-underline">
                    <div>
                      <p className="text-sm font-semibold text-ink">{p.name}</p>
                      <p className="text-xs text-muted">{p.city_name}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${st.bg} ${st.text}`}>{p.status?.replace("_", " ")}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </PanelCard>
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
      db.City.list(),
      db.PermitType.list(),
      db.SubmissionGuide.list('updated_at.desc', 5),
    ]).then(([cities, permits, guides]) => {
      const statusCounts = guides.reduce((acc, g) => { acc[g.overall_status] = (acc[g.overall_status] || 0) + 1; return acc; }, {});
      setStats({ cities: cities.length, permitTypes: permits.length, guides: guides.length, users: 0, statusCounts });
      setRecentGuides(guides.slice(0, 5));
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-action" /></div>;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Users"   value={stats?.users || 0}       tone="default" />
        <StatCard label="Cities"        value={stats?.cities || 0}      tone="default" />
        <StatCard label="Permit Types"  value={stats?.permitTypes || 0} tone="default" />
        <StatCard label="Total Guides"  value={stats?.guides || 0}      tone="default" />
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <PanelCard title="Submission Guide Status" icon={<TrendingUp className="w-4 h-4" />}>
          <div className="space-y-2">
            {Object.entries(stats?.statusCounts || {}).map(([status, count]) => {
              const s = STATUS_STYLES[status] || { bg: "bg-surface", text: "text-muted", label: status };
              return (
                <div key={status} className="flex items-center justify-between py-1.5 px-3 rounded-control bg-surface">
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${s.bg} ${s.text}`}>{s.label}</span>
                  <span className="text-sm font-bold text-ink">{count}</span>
                </div>
              );
            })}
          </div>
        </PanelCard>

        <PanelCard title="Quick Links" icon={<ArrowRight className="w-4 h-4" />}>
          <div className="space-y-2">
            {[
              { label: "Admin Panel",       path: "/admin" },
              { label: "Data Health Check", path: "/admin/health" },
              { label: "Manage Cities",     path: "/admin" },
              { label: "Fee Rules",         path: "/admin" },
            ].map(item => (
              <Link key={item.path + item.label} to={item.path}
                className="flex items-center justify-between p-3 rounded-control hover:bg-surface border border-line no-underline">
                <span className="text-sm font-semibold text-ink">{item.label}</span>
                <ArrowRight className="w-4 h-4 text-muted" />
              </Link>
            ))}
          </div>
        </PanelCard>
      </div>
    </div>
  );
}

// ── NOT LOGGED IN ──
function GuestDashboard({ onSignIn }) {
  return (
    <div className="max-w-2xl mx-auto text-center py-16 px-4">
      <div className="w-16 h-16 rounded-card flex items-center justify-center mx-auto mb-5 bg-action-50">
        <FileText className="w-8 h-8 text-action" />
      </div>
      <h2 className="font-extrabold text-2xl text-ink mb-3">Welcome to OpenPermit</h2>
      <p className="text-muted mb-8">
        Your all-in-one platform for navigating South Florida building permits. Sign in to track your applications, manage projects, and get guided through every step.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: FileText,   label: "Apply for Permit", desc: "Step-by-step guided permit applications",    to: "/ApplyForPermit" },
          { icon: Building2,  label: "Permit Guide",     desc: "Visual guide to every permit type by zone",  to: "/PermitGuide" },
          { icon: Building2,  label: "My Properties",    desc: "Track your properties and permit history",   to: "/MyProperties" },
          { icon: FolderOpen, label: "My Projects",      desc: "Manage all your construction projects",      to: "/MyProjects" },
        ].map(item => (
          <Link key={item.label} to={item.to} className="bg-white rounded-card border border-line shadow-card p-5 text-left hover:border-action hover:shadow-md transition-all no-underline block">
            <div className="w-9 h-9 rounded-control flex items-center justify-center mb-3 bg-action-50">
              <item.icon className="w-4 h-4 text-action" />
            </div>
            <p className="font-bold text-sm text-ink mb-1">{item.label}</p>
            <p className="text-xs text-muted">{item.desc}</p>
          </Link>
        ))}
      </div>
      <Btn variant="primary" size="lg" onClick={onSignIn}>
        Sign In to Get Started <ArrowRight className="w-4 h-4" />
      </Btn>
    </div>
  );
}

// ── MAIN PAGE ──
export default function HomeDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(u => { setCurrentUser(u || null); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-6 h-6 animate-spin text-action" />
      </div>
    );
  }

  const role = currentUser?.role;
  const firstName = currentUser?.full_name?.split(" ")[0] || "there";

  return (
    <div className="min-h-screen bg-surface pb-8">
      <PageHeader
        eyebrow={currentUser ? `Welcome back, ${firstName}` : "OpenPermit"}
        title={currentUser ? (role === "admin" ? "Admin Dashboard" : "Your Dashboard") : "Building Permits Made Simple"}
      />
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