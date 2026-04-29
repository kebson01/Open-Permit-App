import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import AdminCities from "@/components/admin/panel/AdminCities";
import AdminFeeRules from "@/components/admin/panel/AdminFeeRules";
import AdminDataStatus from "@/components/admin/panel/AdminDataStatus";
import AdminUsers from "@/components/admin/panel/AdminUsers";
import { Building2, DollarSign, BarChart3, Users, Menu, X } from "lucide-react";

const NAV_ITEMS = [
  { key: "cities", label: "Cities", icon: Building2 },
  { key: "fees", label: "Fee Rules", icon: DollarSign },
  { key: "data", label: "Data Status", icon: BarChart3 },
  { key: "users", label: "Users", icon: Users },
];

export default function AdminPanel() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeSection, setActiveSection] = useState("cities");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    base44.auth.me().then(user => {
      if (!user) { navigate("/"); return; }
      if (user.role !== "admin" && user.role !== "city_admin") { navigate("/"); return; }
      setCurrentUser(user);
    }).catch(() => navigate("/"));
  }, []);

  const SectionContent = () => {
    switch (activeSection) {
      case "cities": return <AdminCities currentUser={currentUser} />;
      case "fees": return <AdminFeeRules />;
      case "data": return <AdminDataStatus />;
      case "users": return <AdminUsers currentUser={currentUser} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-56 flex flex-col transition-transform duration-200 md:translate-x-0 md:static md:z-auto ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ backgroundColor: "#0f172a" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <span className="text-white font-bold text-base tracking-tight">OpenPermit Admin</span>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-white/60 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
        <nav className="flex-1 py-4 space-y-0.5 px-2">
          {NAV_ITEMS.map(item => {
            const active = activeSection === item.key;
            return (
              <button
                key={item.key}
                onClick={() => { setActiveSection(item.key); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="px-5 py-4 border-t border-white/10">
          <p className="text-xs text-slate-500 truncate">{currentUser?.email}</p>
          <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-blue-900 text-blue-300 font-medium">{currentUser?.role}</span>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-5 py-3 flex items-center gap-3 sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden text-slate-500 hover:text-slate-800">
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-slate-800 text-base">
            {NAV_ITEMS.find(i => i.key === activeSection)?.label}
          </h1>
        </header>

        <main className="flex-1 p-5 md:p-7">
          <SectionContent />
        </main>
      </div>
    </div>
  );
}