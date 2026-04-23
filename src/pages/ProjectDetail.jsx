import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { supabase } from "@/lib/supabaseClient";
import { ArrowLeft, MapPin, Building2, DollarSign, Edit2, Save, X, Loader2, Sparkles, FileText, Calendar, Users, BarChart2, HardHat, MessageSquare } from "lucide-react";
import ProjectAIAssistant from "@/components/projects/tabs/ProjectAIAssistant";
import HomeownerDocumentsTab from "@/components/projects/tabs/HomeownerDocumentsTab";
import HomeownerTimelineTab from "@/components/projects/tabs/HomeownerTimelineTab";
import HomeownerBudgetTab from "@/components/projects/tabs/HomeownerBudgetTab";
import HomeownerTeamTab from "@/components/projects/tabs/HomeownerTeamTab";
import ContractorDocumentsTab from "@/components/projects/tabs/ContractorDocumentsTab";
import ContractorTimelineTab from "@/components/projects/tabs/ContractorTimelineTab";
import ContractorBudgetTab from "@/components/projects/tabs/ContractorBudgetTab";
import ContractorClientTab from "@/components/projects/tabs/ContractorClientTab";
import MessagesTab from "@/components/projects/tabs/MessagesTab";

const STATUS_OPTIONS = ["planning", "permitting", "in_progress", "completed", "on_hold"];
const STATUS_STYLES = {
  planning:    "bg-yellow-100 text-yellow-700",
  permitting:  "bg-blue-100 text-blue-700",
  in_progress: "bg-indigo-100 text-indigo-700",
  completed:   "bg-green-100 text-green-700",
  on_hold:     "bg-gray-100 text-gray-600",
};

const HOMEOWNER_TABS = [
  { id: "ai",        label: "AI Assistant", icon: Sparkles },
  { id: "documents", label: "Documents",    icon: FileText },
  { id: "timeline",  label: "Timeline",     icon: Calendar },
  { id: "budget",    label: "Budget",       icon: DollarSign },
  { id: "team",      label: "Team",         icon: Users },
  { id: "messages",  label: "Messages",     icon: MessageSquare },
];

const CONTRACTOR_TABS = [
  { id: "ai",        label: "AI Assistant",  icon: Sparkles },
  { id: "documents", label: "Documents",     icon: FileText },
  { id: "timeline",  label: "Timeline",      icon: Calendar },
  { id: "budget",    label: "Budget",        icon: BarChart2 },
  { id: "client",    label: "Client & Team", icon: HardHat },
  { id: "messages",  label: "Messages",      icon: MessageSquare },
];

export default function ProjectDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get("id");

  const [project, setProject] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ai");
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUser({ ...user, email: user.email, full_name: user.user_metadata?.full_name, role: user.user_metadata?.role });
    });
  }, []);

  useEffect(() => {
    if (!projectId) return;
    supabase.from("projects").select("*").eq("id", projectId).single()
      .then(({ data }) => { if (data) setProject(data); })
      .finally(() => setLoading(false));
  }, [projectId]);

  const saveStatus = async (newStatus) => {
    await supabase.from("projects").update({ status: newStatus }).eq("id", project.id);
    setProject(prev => ({ ...prev, status: newStatus }));
  };

  const startEdit = () => {
    setEditForm({
      name: project.name || "",
      property_address: project.property_address || "",
      estimated_cost: project.estimated_cost || "",
      description: project.description || "",
    });
    setEditing(true);
  };

  const saveEdit = async () => {
    setSaving(true);
    const payload = {
      ...editForm,
      estimated_cost: editForm.estimated_cost ? parseFloat(editForm.estimated_cost) : null,
    };
    Object.keys(payload).forEach(k => { if (payload[k] === "") delete payload[k]; });
    await supabase.from("projects").update(payload).eq("id", project.id);
    setProject(prev => ({ ...prev, ...payload }));
    setEditing(false);
    setSaving(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
    </div>
  );

  if (!project) return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-4">
      <p className="text-gray-500">Project not found.</p>
      <Link to="/ProjectDashboard">
        <button className="px-4 py-2 border border-gray-200 rounded-xl text-sm">Back to Projects</button>
      </Link>
    </div>
  );

  const viewRole = currentUser?.role === "contractor" ? "contractor" : "homeowner";
  const tabs = viewRole === "contractor" ? CONTRACTOR_TABS : HOMEOWNER_TABS;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-8">

        <div className="mb-4">
          <Link to="/ProjectDashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Projects
          </Link>
        </div>

        {/* Project header card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-4">
          {editing ? (
            <div className="space-y-3">
              <input
                className="w-full text-lg font-bold border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
                value={editForm.name}
                onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
              />
              <input placeholder="Property address" value={editForm.property_address}
                onChange={e => setEditForm(p => ({ ...p, property_address: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400" />
              <input type="number" placeholder="Estimated cost ($)" value={editForm.estimated_cost}
                onChange={e => setEditForm(p => ({ ...p, estimated_cost: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400" />
              <textarea rows={2} placeholder="Description..." value={editForm.description}
                onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-400" />
              <div className="flex gap-2">
                <button onClick={saveEdit} disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                  style={{ background: "#3B82F6" }}>
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
                </button>
                <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-xl text-sm border border-gray-200 text-gray-600 hover:bg-gray-50">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <select
                      value={project.status}
                      onChange={e => saveStatus(e.target.value)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border-0 cursor-pointer focus:outline-none ${STATUS_STYLES[project.status] || STATUS_STYLES.planning}`}
                    >
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                    </select>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full capitalize">
                      {project.project_type?.replace(/_/g, " ")}
                    </span>
                  </div>
                  <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
                  {project.description && <p className="text-sm text-gray-500 mt-0.5">{project.description}</p>}
                </div>
                <button onClick={startEdit} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
                {project.city_name && <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{project.city_name}</span>}
                {project.property_address && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{project.property_address}</span>}
                {project.estimated_cost && <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" />Est. ${Number(project.estimated_cost).toLocaleString()}</span>}
              </div>
              {viewRole === "contractor" && (project.client_name || project.contractor_license) && (
                <div className="mt-3 flex flex-wrap gap-3 bg-orange-50 rounded-xl px-3 py-2 text-xs text-orange-700 border border-orange-100">
                  {project.client_name && <span><strong>Client:</strong> {project.client_name}</span>}
                  {project.contractor_license && <span><strong>License:</strong> {project.contractor_license}</span>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl border border-gray-200 p-1 mb-5 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                  activeTab === tab.id
                    ? viewRole === "contractor"
                      ? "bg-orange-600 text-white shadow-sm"
                      : "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          {activeTab === "ai" && (
            <ProjectAIAssistant project={project} mode={viewRole} />
          )}
          {activeTab === "documents" && viewRole === "homeowner" && (
            <HomeownerDocumentsTab project={project} onUpdate={setProject} />
          )}
          {activeTab === "documents" && viewRole === "contractor" && (
            <ContractorDocumentsTab project={project} onUpdate={setProject} />
          )}
          {activeTab === "timeline" && viewRole === "homeowner" && (
            <HomeownerTimelineTab project={project} />
          )}
          {activeTab === "timeline" && viewRole === "contractor" && (
            <ContractorTimelineTab project={project} onUpdate={setProject} />
          )}
          {activeTab === "budget" && viewRole === "homeowner" && (
            <HomeownerBudgetTab project={project} onUpdate={setProject} />
          )}
          {activeTab === "budget" && viewRole === "contractor" && (
            <ContractorBudgetTab project={project} />
          )}
          {activeTab === "team" && (
            <HomeownerTeamTab project={project} currentUser={currentUser} />
          )}
          {activeTab === "client" && (
            <ContractorClientTab project={project} currentUser={currentUser} onUpdate={setProject} />
          )}
          {activeTab === "messages" && (
            <MessagesTab project={project} currentUser={currentUser} mode={viewRole} />
          )}
        </div>
      </div>
    </div>
  );
}