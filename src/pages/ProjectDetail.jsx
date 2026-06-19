import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import * as db from "@/lib/db";
import {
  ArrowLeft, Loader2, Edit2, Save, X, Send,
  CheckCircle2, Circle, FileText, Image, Upload,
  MessageSquare, Users, DollarSign, Calendar,
  BarChart2, HardHat, Sparkles, Home, LayoutDashboard, FolderOpen
} from "lucide-react";
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
  planning:    { bg: "bg-yellow-100", text: "text-yellow-700", label: "Planning" },
  permitting:  { bg: "bg-blue-100",   text: "text-blue-700",   label: "Permitting" },
  in_progress: { bg: "bg-blue-600",   text: "text-white",      label: "In Progress" },
  completed:   { bg: "bg-green-100",  text: "text-green-700",  label: "Completed" },
  on_hold:     { bg: "bg-gray-100",   text: "text-gray-600",   label: "On Hold" },
};

// Milestone steps derived from project status
const MILESTONES = [
  { key: "planning",    label: "Permitting" },
  { key: "permitting",  label: "Demolition" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed",   label: "Finished" },
];

const HOMEOWNER_TABS = [
  { id: "overview",  label: "Overview",    icon: Home },
  { id: "ai",        label: "AI Assistant",icon: Sparkles },
  { id: "documents", label: "Documents",   icon: FileText },
  { id: "timeline",  label: "Timeline",    icon: Calendar },
  { id: "budget",    label: "Budget",      icon: DollarSign },
  { id: "team",      label: "Team",        icon: Users },
  { id: "messages",  label: "Messages",    icon: MessageSquare },
];

const CONTRACTOR_TABS = [
  { id: "overview",  label: "Overview",    icon: Home },
  { id: "ai",        label: "AI Assistant",icon: Sparkles },
  { id: "documents", label: "Documents",   icon: FileText },
  { id: "timeline",  label: "Timeline",    icon: Calendar },
  { id: "budget",    label: "Budget",      icon: BarChart2 },
  { id: "client",    label: "Client",      icon: HardHat },
  { id: "messages",  label: "Messages",    icon: MessageSquare },
];

// Milestone stepper component
function MilestoneStepper({ status }) {
  const statusOrder = ["planning", "permitting", "in_progress", "completed"];
  const currentIdx = statusOrder.indexOf(status);
  return (
    <div className="flex items-center gap-0">
      {MILESTONES.map((m, i) => {
        const done    = i < currentIdx;
        const active  = i === currentIdx;
        return (
          <div key={m.key} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                done   ? "bg-blue-600 border-blue-600" :
                active ? "bg-white border-blue-600" :
                         "bg-white border-gray-300"
              }`}>
                {done ? (
                  <CheckCircle2 className="w-5 h-5 text-white" />
                ) : (
                  <div className={`w-3 h-3 rounded-full ${active ? "bg-blue-600" : "bg-gray-300"}`} />
                )}
              </div>
              <span className={`text-[10px] font-semibold whitespace-nowrap ${active ? "text-blue-600" : done ? "text-blue-600" : "text-gray-400"}`}>
                {m.label}
              </span>
            </div>
            {i < MILESTONES.length - 1 && (
              <div className={`w-8 h-0.5 mb-4 ${done ? "bg-blue-600" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Project overview tab (the reference design content)
function OverviewTab({ project, currentUser }) {
  const [tasks, setTasks] = useState([
    { id: 1, label: "Disconnect old fixtures", role: "Contractor", done: true, due: null },
    { id: 2, label: "Select final tile grout color", role: "Homeowner", done: false, due: null },
    { id: 3, label: "Install copper piping", role: "Contractor", done: false, due: "today" },
  ]);
  const [message, setMessage] = useState("");
  const completedCount = tasks.filter(t => t.done).length;
  const pct = Math.round((completedCount / tasks.length) * 100);

  const toggleTask = (id) => setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));

  return (
    <div className="space-y-6">
      {/* Project Milestones */}
      <section>
        <h2 className="text-base font-bold text-gray-900 mb-4">Project Milestones</h2>
        <div className="overflow-x-auto">
          <MilestoneStepper status={project.status} />
        </div>
      </section>

      {/* Active Tasks */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-900">Active Tasks</h2>
          <span className="text-sm font-semibold text-blue-600">{pct}% Complete</span>
        </div>
        <div className="space-y-2">
          {tasks.map(task => (
            <button key={task.id} onClick={() => toggleTask(task.id)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border text-left transition-all ${
                task.done ? "bg-white border-gray-100" : task.due === "today" ? "bg-white border-blue-200 border-l-4 border-l-blue-500" : "bg-white border-gray-100"
              }`}>
              <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                task.done ? "bg-blue-600 border-blue-600" : "border-gray-300"
              }`}>
                {task.done && <span className="text-white text-xs font-bold">✓</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${task.done ? "line-through text-gray-400" : "text-gray-800"}`}>{task.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {task.role}{task.due === "today" ? " • Due Today" : ""}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                {task.role[0]}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Team Chat */}
      <section>
        <div className="bg-blue-600 rounded-2xl p-5">
          <h2 className="text-base font-bold text-white mb-2">Team Chat</h2>
          <p className="text-sm text-blue-100 mb-4">"The sub-floor looks solid. I'll be there at 8 AM."</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {["C", "H"].map((l, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-blue-400 border-2 border-blue-600 flex items-center justify-center text-xs font-bold text-white -ml-1 first:ml-0">
                  {l}
                </div>
              ))}
              <span className="text-xs text-blue-200 ml-1">+2</span>
            </div>
            <button
              onClick={() => {}}
              className="px-4 py-2 bg-white rounded-xl text-sm font-bold text-blue-600"
            >
              Reply Now
            </button>
          </div>
        </div>
      </section>

      {/* Documents & Plans */}
      <section>
        <h2 className="text-base font-bold text-gray-900 mb-3">Documents &amp; Plans</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: FileText, name: "Final Quote.pdf", size: "2.4 MB" },
            { icon: FileText, name: "Floor Plan_V2", size: "15 MB" },
            { icon: Image, name: "Inspiration.jpg", size: "1.1 MB" },
          ].map((doc, i) => {
            const Icon = doc.icon;
            return (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-2">
                <Icon className="w-6 h-6 text-blue-600" />
                <p className="text-sm font-semibold text-gray-800 leading-tight">{doc.name}</p>
                <p className="text-xs text-gray-400">{doc.size}</p>
              </div>
            );
          })}
          <button className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-4 flex flex-col items-center justify-center gap-2 hover:border-blue-300 transition-colors">
            <Upload className="w-6 h-6 text-gray-400" />
            <span className="text-sm text-gray-400 font-medium">Upload</span>
          </button>
        </div>
      </section>

      {/* Permit CTA */}
      <Link to="/SubmissionGuide"
        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-white font-bold text-sm no-underline"
        style={{ background: "#022A5B" }}>
        <Send className="w-4 h-4" />
        Start Permit Application
      </Link>
    </div>
  );
}

function BottomNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-2 z-50">
      <Link to="/" className="flex flex-col items-center gap-1 px-4 py-1 no-underline">
        <Home className="w-5 h-5 text-gray-400 mt-1.5" />
        <span className="text-xs text-gray-400">Home</span>
      </Link>
      <Link to="/ApplyForPermit" className="flex flex-col items-center gap-1 px-4 py-1 no-underline">
        <LayoutDashboard className="w-5 h-5 text-gray-400 mt-1.5" />
        <span className="text-xs text-gray-400">Dashboard</span>
      </Link>
      <Link to="/MyProjects" className="flex flex-col items-center gap-1 px-4 py-1 no-underline">
        <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
          <FolderOpen className="w-4 h-4 text-blue-600" />
        </div>
        <span className="text-xs font-semibold text-blue-600">Projects</span>
      </Link>
    </div>
  );
}

export default function ProjectDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get("id");

  const [project, setProject]       = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState("overview");
  const [editing, setEditing]       = useState(false);
  const [editForm, setEditForm]     = useState({});
  const [saving, setSaving]         = useState(false);

  useEffect(() => {
    base44.auth.me().then(user => { if (user) setCurrentUser(user); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!projectId) { setLoading(false); return; }
    db.Project.get(projectId)
      .then(data => { if (data) setProject(data); })
      .finally(() => setLoading(false));
  }, [projectId]);

  const saveStatus = async (newStatus) => {
    await db.Project.update(project.id, { status: newStatus });
    setProject(prev => ({ ...prev, status: newStatus }));
  };

  const startEdit = () => {
    setEditForm({ name: project.name || "", property_address: project.property_address || "", estimated_cost: project.estimated_cost || "", description: project.description || "" });
    setEditing(true);
  };

  const saveEdit = async () => {
    setSaving(true);
    const payload = { ...editForm, estimated_cost: editForm.estimated_cost ? parseFloat(editForm.estimated_cost) : null };
    Object.keys(payload).forEach(k => { if (payload[k] === "") delete payload[k]; });
    await db.Project.update(project.id, payload);
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
      <Link to="/MyProjects"><button className="px-4 py-2 border border-gray-200 rounded-xl text-sm">Back to Projects</button></Link>
    </div>
  );

  const viewRole = currentUser?.role === "contractor" ? "contractor" : "homeowner";
  const tabs     = viewRole === "contractor" ? CONTRACTOR_TABS : HOMEOWNER_TABS;
  const st       = STATUS_STYLES[project.status] || STATUS_STYLES.planning;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white px-5 pt-10 pb-5 border-b border-gray-100">
        <Link to="/MyProjects" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-4 no-underline">
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </Link>

        {editing ? (
          <div className="space-y-3">
            <input className="w-full text-xl font-bold border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
              value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
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
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 disabled:opacity-60">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
              </button>
              <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-xl text-sm border border-gray-200 text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">{project.name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${st.bg} ${st.text}`}>{st.label}</span>
              {project.start_date && <span className="text-xs text-gray-400">Started {project.start_date}</span>}
              <button onClick={startEdit} className="ml-auto p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5">
        {/* Tab pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-3 mb-4 scrollbar-hide">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                  activeTab === tab.id ? "bg-blue-600 text-white shadow-sm" : "bg-white border border-gray-200 text-gray-600"
                }`}>
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {activeTab === "overview" && <OverviewTab project={project} currentUser={currentUser} />}
        {activeTab === "ai" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <ProjectAIAssistant project={project} mode={viewRole} />
          </div>
        )}
        {activeTab === "documents" && viewRole === "homeowner" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <HomeownerDocumentsTab project={project} onUpdate={setProject} />
          </div>
        )}
        {activeTab === "documents" && viewRole === "contractor" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <ContractorDocumentsTab project={project} onUpdate={setProject} />
          </div>
        )}
        {activeTab === "timeline" && viewRole === "homeowner" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <HomeownerTimelineTab project={project} />
          </div>
        )}
        {activeTab === "timeline" && viewRole === "contractor" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <ContractorTimelineTab project={project} onUpdate={setProject} />
          </div>
        )}
        {activeTab === "budget" && viewRole === "homeowner" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <HomeownerBudgetTab project={project} onUpdate={setProject} />
          </div>
        )}
        {activeTab === "budget" && viewRole === "contractor" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <ContractorBudgetTab project={project} />
          </div>
        )}
        {activeTab === "team" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <HomeownerTeamTab project={project} currentUser={currentUser} />
          </div>
        )}
        {activeTab === "client" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <ContractorClientTab project={project} currentUser={currentUser} onUpdate={setProject} />
          </div>
        )}
        {activeTab === "messages" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <MessagesTab project={project} currentUser={currentUser} mode={viewRole} />
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}