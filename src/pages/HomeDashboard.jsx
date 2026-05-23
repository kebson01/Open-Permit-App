import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import * as db from "@/lib/db";
import {
  Plus, Search, AlertTriangle, Bell, ChevronRight,
  Clock, User, CheckCircle2, MessageSquare, DollarSign,
  Loader2, LayoutDashboard, FolderOpen, Home
} from "lucide-react";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function HeroCard() {
  return (
    <Link to="/ApplyForPermit" className="relative block rounded-2xl overflow-hidden no-underline"
      style={{ minHeight: 180 }}>
      <img
        src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80"
        alt="Start New Project"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 via-blue-800/40 to-transparent" />
      <div className="relative p-5 flex flex-col h-full justify-end" style={{ minHeight: 180 }}>
        <div className="flex items-center gap-2 text-white">
          <div className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center">
            <Plus className="w-4 h-4" />
          </div>
          <span className="text-lg font-bold">Start New Project</span>
        </div>
      </div>
    </Link>
  );
}

function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Link to="/PropertyGuide"
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-center gap-2 no-underline hover:shadow-md transition-shadow">
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#EBF5FF" }}>
            <Search className="w-5 h-5" style={{ color: "#1A56DB" }} />
        </div>
        <span className="text-sm font-semibold text-gray-800 text-center">Find a Professional</span>
      </Link>
      <Link to="/ApplyForPermit"
        className="bg-red-50 rounded-2xl border border-red-100 shadow-sm p-5 flex flex-col items-center gap-2 no-underline hover:shadow-md transition-shadow">
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-red-500" />
        </div>
        <span className="text-sm font-semibold text-red-500 text-center">Emergency Service</span>
      </Link>
    </div>
  );
}

function AppointmentCard({ guide }) {
  const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  const d = guide.started_date ? new Date(guide.started_date) : new Date();
  const mon = months[d.getMonth()];
  const day = d.getDate();

  return (
    <Link to={`/ApplyForPermit?resume=${guide.id}`}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-4 items-start no-underline hover:shadow-md transition-shadow">
      <div className="rounded-xl px-3 py-2 text-center min-w-[52px]" style={{ background: "#EBF5FF" }}>
        <p className="text-xs font-bold uppercase" style={{ color: "#1A56DB" }}>{mon}</p>
        <p className="text-2xl font-extrabold leading-none" style={{ color: "#003FB1" }}>{day}</p>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900 text-sm">{guide.permit_type_name || "Permit Application"}</p>
        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
          <Clock className="w-3 h-3" />
          <span>{guide.overall_status?.replace(/_/g, " ")}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
          <User className="w-3 h-3" />
          <span>{guide.city_name}</span>
        </div>
      </div>
    </Link>
  );
}

const ACTIVITY_ICONS = {
  completed: { icon: CheckCircle2, bg: "bg-green-50", color: "text-green-500" },
  quote:     { icon: DollarSign,   bg: "bg-orange-50", color: "text-orange-500" },
  message:   { icon: MessageSquare, bg: "bg-[#EBF5FF]", color: "text-[#1A56DB]" },
  default:   { icon: CheckCircle2, bg: "bg-gray-50",  color: "text-gray-400" },
};

function ActivityItem({ icon: Icon, bg, color, text, sub }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-9 h-9 rounded-full ${bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700 leading-snug">{text}</p>
        <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

function RecentActivity({ projects, guides }) {
  const items = [];

  guides.slice(0, 2).forEach(g => {
    if (g.overall_status === "submitted" || g.overall_status === "approved") {
      items.push({
        type: "completed",
        text: <><strong>{g.permit_type_name}</strong> marked as <span className="text-blue-600 font-semibold">{g.overall_status}</span></>,
        sub: g.city_name,
      });
    } else if (g.overall_status === "ready_to_submit") {
      items.push({
        type: "quote",
        text: <>Application ready: <strong>{g.permit_type_name}</strong></>,
        sub: g.city_name,
      });
    }
  });

  projects.slice(0, 2).forEach(p => {
    items.push({
      type: p.status === "completed" ? "completed" : "message",
      text: <><strong>{p.name}</strong> — {p.status?.replace(/_/g, " ")}</>,
      sub: p.city_name,
    });
  });

  if (items.length === 0) {
    items.push({
      type: "default",
      text: <span className="text-gray-400">No recent activity yet</span>,
      sub: "Start by creating a project or permit application",
    });
  }

  return (
    <div className="space-y-4">
      {items.slice(0, 4).map((item, i) => {
        const cfg = ACTIVITY_ICONS[item.type] || ACTIVITY_ICONS.default;
        return <ActivityItem key={i} icon={cfg.icon} bg={cfg.bg} color={cfg.color} text={item.text} sub={item.sub} />;
      })}
    </div>
  );
}

function BottomNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-2 z-50 max-w-md mx-auto">
      <Link to="/" className="flex flex-col items-center gap-1 px-4 py-1 no-underline">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#EBF5FF" }}>
        <Home className="w-4 h-4" style={{ color: "#1A56DB" }} />
        </div>
        <span className="text-xs font-semibold" style={{ color: "#1A56DB" }}>Home</span>
      </Link>
      <Link to="/ApplyForPermit" className="flex flex-col items-center gap-1 px-4 py-1 no-underline">
        <LayoutDashboard className="w-5 h-5 text-gray-400 mt-1.5" />
        <span className="text-xs text-gray-400">Dashboard</span>
      </Link>
      <Link to="/MyProjects" className="flex flex-col items-center gap-1 px-4 py-1 no-underline">
        <FolderOpen className="w-5 h-5 text-gray-400 mt-1.5" />
        <span className="text-xs text-gray-400">Projects</span>
      </Link>
    </div>
  );
}

export default function HomeDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [guides, setGuides]   = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#FAF8FF" }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#1A56DB" }} />
      </div>
    );
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";
  const firstName   = displayName.split(" ")[0] || (user ? "there" : null);
  const activeGuides = guides.filter(g => ["in_progress", "ready_to_submit"].includes(g.overall_status));

  return (
    <div className="min-h-screen pb-24" style={{ background: "#FAF8FF" }}>
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#1A56DB" }}>
            <span className="text-white font-bold text-sm">OP</span>
          </div>
          <span className="font-bold text-lg" style={{ color: "#1A56DB" }}>OpenPermit</span>
        </div>
        <Link to="/MyAccount" className="no-underline">
          <Bell className="w-5 h-5 text-gray-500" />
        </Link>
      </div>

      <div className="px-5 py-4 space-y-5">
        {/* Greeting */}
        <div>
          {user ? (
            <>
              <h1 className="text-3xl font-extrabold text-gray-900">{getGreeting()}, {firstName}!</h1>
              <p className="text-gray-500 text-sm mt-1">Here's your permit activity overview.</p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-extrabold text-gray-900">Welcome to OpenPermit</h1>
              <p className="text-gray-500 text-sm mt-1">South Florida building permits made simple.</p>
            </>
          )}
        </div>

        {/* Hero CTA */}
        <HeroCard />

        {/* Quick Actions */}
        <QuickActions />

        {/* Features Grid */}
        <div>
          <h2 className="font-bold text-gray-900 text-base mb-3">Features & Tools</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/ApplyForPermit"
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col items-start gap-2 no-underline hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#EBF5FF" }}>
                <Plus className="w-5 h-5" style={{ color: "#1A56DB" }} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Permits</p>
                <p className="text-sm font-bold text-gray-900">Apply for Permit</p>
              </div>
            </Link>

            <Link to="/FeeCalculator"
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col items-start gap-2 no-underline hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Calculate</p>
                <p className="text-sm font-bold text-gray-900">Fee Calculator</p>
              </div>
            </Link>

            <Link to="/PermitGuide"
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col items-start gap-2 no-underline hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                <User className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Guide</p>
                <p className="text-sm font-bold text-gray-900">Permit Guide</p>
              </div>
            </Link>

            <Link to="/MyProperties"
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col items-start gap-2 no-underline hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                <Search className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Search</p>
                <p className="text-sm font-bold text-gray-900">Find Property</p>
              </div>
            </Link>

            <Link to="/BuildingCodes"
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col items-start gap-2 no-underline hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Codes</p>
                <p className="text-sm font-bold text-gray-900">Building Codes</p>
              </div>
            </Link>

            <Link to="/MyProjects"
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col items-start gap-2 no-underline hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Manage</p>
                <p className="text-sm font-bold text-gray-900">My Projects</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Upcoming Applications */}
        {user && activeGuides.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-900 text-base">Active Applications</h2>
              <Link to="/ApplyForPermit" className="text-sm font-semibold no-underline flex items-center gap-0.5" style={{ color: "#1A56DB" }}>
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {activeGuides.slice(0, 2).map(g => <AppointmentCard key={g.id} guide={g} />)}
            </div>
          </div>
        )}

        {/* Guest CTA */}
        {!user && (
          <div className="rounded-2xl p-6 text-center" style={{ background: "#1A56DB" }}>
            <h3 className="font-extrabold text-white text-lg mb-1">Get started today</h3>
            <p className="text-blue-200 text-sm mb-4">Create a free account to track applications and manage your projects.</p>
            <Link to="/signup"
              className="inline-block bg-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors hover:opacity-90 no-underline"
              style={{ color: "#1A56DB" }}>
              Get Started →
            </Link>
          </div>
        )}

        {/* Recent Activity */}
        {user && (
          <div>
            <h2 className="font-bold text-gray-900 text-base mb-3">Recent Activity</h2>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <RecentActivity projects={projects} guides={guides} />
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}