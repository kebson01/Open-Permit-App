import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft, MapPin, Building2, DollarSign, Edit2, Save, X,
  Sparkles, CheckSquare, BookOpen, FileText, Loader2,
  Users, MessageCircle, BarChart2, Calendar
} from "lucide-react";
import ProjectExpertBriefing from "@/components/projects/ProjectExpertBriefing";
import ProjectPermitChecklist from "@/components/projects/ProjectPermitChecklist";
import ProjectOrdinances from "@/components/projects/ProjectOrdinances";
import ProjectBudgetTab from "@/components/projects/ProjectBudgetTab";
import ProjectMessagesTab from "@/components/projects/ProjectMessagesTab";
import ProjectCollaboratorsTab from "@/components/projects/ProjectCollaboratorsTab";
import ProjectProgressBar from "@/components/projects/ProjectProgressBar";

const STATUS_OPTIONS = ["planning", "permitting", "in_progress", "completed", "on_hold"];
const PRIORITY_STYLES = {
  low:    "bg-gray-100 text-gray-600",
  medium: "bg-yellow-100 text-yellow-700",
  high:   "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};
const STATUS_STYLES = {
  planning:    "bg-yellow-100 text-yellow-700",
  permitting:  "bg-blue-100 text-blue-700",
  in_progress: "bg-indigo-100 text-indigo-700",
  completed:   "bg-green-100 text-green-700",
  on_hold:     "bg-gray-100 text-gray-600",
};

const TABS = [
  { id: "progress",      label: "Progress",      icon: BarChart2 },
  { id: "overview",      label: "AI Expert",     icon: Sparkles },
  { id: "checklist",     label: "Checklist",     icon: CheckSquare },
  { id: "budget",        label: "Budget",        icon: DollarSign },
  { id: "team",          label: "Team",          icon: Users },
  { id: "messages",      label: "Messages",      icon: MessageCircle },
  { id: "ordinances",    label: "Ordinances",    icon: BookOpen },
  { id: "notes",         label: "Notes",         icon: FileText },
];

export default function ProjectDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get("id");

  const [project, setProject] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("progress");
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (!projectId) return;
    base44.entities.Project.filter({ id: projectId })
      .then(list => {
        const p = list[0];
        if (p) { setProject(p); setNotes(p.notes || ""); }
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  const saveStatus = async (newStatus) => {
    await base44.entities.Project.update(project.id, { status: newStatus });
    setProject(prev => ({ ...prev, status: newStatus }));
  };

  const startEdit = () => {
    setEditForm({
      name: project.name,
      property_address: project.property_address || "",
      folio_number: project.folio_number || "",
      estimated_cost: project.estimated_cost || "",
      description: project.description || "",
      priority: project.priority || "medium",
      start_date: project.start_date || "",
      target_completion_date: project.target_completion_date || "",
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
    await base44.entities.Project.update(project.id, payload);
    setProject(prev => ({ ...prev, ...payload }));
    setEditing(false);
    setSaving(false);
  };

  const saveNotes = async () => {
    setSavingNotes(true);
    await base44.entities.Project.update(project.id, { notes });
    setProject(prev => ({ ...prev, notes }));
    setSavingNotes(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>;

  if (!project) return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-4">
      <p className="text-gray-500">Project not found.</p>
      <Link to="/ProjectDashboard"><Button variant="outline">Back to Projects</Button></Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">

        <Link to="/ProjectDashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </Link>

        {/* Header card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-4">
          {editing ? (
            <div className="space-y-3">
              <Input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} className="text-lg font-bold" />
              <Input placeholder="Property address" value={editForm.property_address} onChange={e => setEditForm(p => ({ ...p, property_address: e.target.value }))} />
              <Input placeholder="Folio number" value={editForm.folio_number} onChange={e => setEditForm(p => ({ ...p, folio_number: e.target.value }))} />
              <Input type="number" placeholder="Estimated cost ($)" value={editForm.estimated_cost} onChange={e => setEditForm(p => ({ ...p, estimated_cost: e.target.value }))} />
              <textarea
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-400"
                rows={3} placeholder="Description..."
                value={editForm.description}
                onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
              />
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Priority</label>
                  <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                    value={editForm.priority} onChange={e => setEditForm(p => ({ ...p, priority: e.target.value }))}>
                    {["low","medium","high","urgent"].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Start Date</label>
                  <Input type="date" value={editForm.start_date} onChange={e => setEditForm(p => ({ ...p, start_date: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Target Completion</label>
                  <Input type="date" value={editForm.target_completion_date} onChange={e => setEditForm(p => ({ ...p, target_completion_date: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={saveEdit} disabled={saving} size="sm" className="bg-blue-600 hover:bg-blue-700 gap-1">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
                </Button>
                <Button onClick={() => setEditing(false)} variant="outline" size="sm"><X className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <select
                      value={project.status}
                      onChange={e => saveStatus(e.target.value)}
                      className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 cursor-pointer focus:outline-none ${STATUS_STYLES[project.status]}`}
                    >
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                    </select>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      {project.project_type?.replace(/_/g, " ")}
                    </span>
                    {project.priority && project.priority !== "medium" && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_STYLES[project.priority]}`}>
                        {project.priority} priority
                      </span>
                    )}
                    {project.is_contractor_project && (
                      <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">Contractor</span>
                    )}
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                  {project.description && <p className="text-gray-500 text-sm mt-1">{project.description}</p>}
                </div>
                <Button onClick={startEdit} variant="ghost" size="icon" className="flex-shrink-0">
                  <Edit2 className="w-4 h-4 text-gray-400" />
                </Button>
              </div>

              <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1.5"><Building2 className="w-4 h-4 text-gray-400" />{project.city_name}</div>
                {project.property_address && <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-gray-400" />{project.property_address}</div>}
                {project.estimated_cost && <div className="flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-gray-400" />Est. ${Number(project.estimated_cost).toLocaleString()}</div>}
                {project.target_completion_date && <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-gray-400" />Target: {new Date(project.target_completion_date).toLocaleDateString()}</div>}
              </div>

              {project.is_contractor_project && (project.client_name || project.contractor_license) && (
                <div className="mt-4 bg-purple-50 border border-purple-100 rounded-xl px-4 py-3 flex flex-wrap gap-4 text-sm">
                  {project.client_name && <span className="text-purple-700"><strong>Client:</strong> {project.client_name}</span>}
                  {project.contractor_license && <span className="text-purple-700"><strong>License:</strong> {project.contractor_license}</span>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl border border-gray-200 p-1 mb-5 overflow-x-auto">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                  activeTab === tab.id ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className={activeTab === "progress" ? "" : "bg-white rounded-2xl border border-gray-200 shadow-sm p-6"}>
          {activeTab === "progress" && (
            <>
              <ProjectProgressBar project={project} onUpdate={setProject} />
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <ProjectExpertBriefing project={project} />
              </div>
            </>
          )}
          {activeTab === "overview"    && <ProjectExpertBriefing project={project} />}
          {activeTab === "checklist"   && <ProjectPermitChecklist project={project} onUpdate={setProject} />}
          {activeTab === "budget"      && <ProjectBudgetTab project={project} />}
          {activeTab === "team"        && <ProjectCollaboratorsTab project={project} currentUser={currentUser} />}
          {activeTab === "messages"    && <ProjectMessagesTab project={project} currentUser={currentUser} />}
          {activeTab === "ordinances"  && <ProjectOrdinances project={project} />}
          {activeTab === "notes" && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Project Notes</label>
              <textarea
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
                rows={10}
                placeholder="Add notes about permits, contacts, inspection dates, contractor info..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
              <Button onClick={saveNotes} disabled={savingNotes} className="mt-3 bg-blue-600 hover:bg-blue-700 gap-2">
                {savingNotes ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Notes
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}