import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  FolderOpen, Search, Plus, ArrowRight, Loader2, Filter,
  Calendar, MapPin, TrendingUp, Users, DollarSign, Clock,
  CheckCircle2, AlertCircle, FileText, ChevronRight
} from "lucide-react";

const PRIMARY = "#004ac6";
const FONTS = { h: "'Manrope', system-ui, sans-serif", b: "'Plus Jakarta Sans', system-ui, sans-serif" };

const STATUS_CONFIG = {
  planning:    { bg: "bg-gray-100",   text: "text-gray-700",   label: "Planning",    dot: "bg-gray-400" },
  permitting:  { bg: "bg-blue-100",   text: "text-blue-700",   label: "Permitting",  dot: "bg-blue-500" },
  in_progress: { bg: "bg-amber-100",  text: "text-amber-700",  label: "In Progress", dot: "bg-amber-500" },
  completed:   { bg: "bg-green-100",  text: "text-green-700",  label: "Completed",   dot: "bg-green-500" },
  on_hold:     { bg: "bg-orange-100", text: "text-orange-700", label: "On Hold",     dot: "bg-orange-500" },
};

const MILESTONE_ICONS = {
  application_submitted: "📋",
  plan_review_started:   "🔍",
  permit_issued:         "🎉",
  inspection_scheduled:  "🔎",
  inspection_passed:     "✅",
  permit_finaled:        "🏁",
};

function ProjectCard({ project, onClick }) {
  const st = STATUS_CONFIG[project.status] || STATUS_CONFIG.planning;
  const progress = project.progress_pct || 0;
  return (
    <button onClick={() => onClick(project)} className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all p-5">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#eff4ff" }}>
          <FolderOpen className="w-5 h-5" style={{ color: PRIMARY }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-bold text-gray-900 text-sm" style={{ fontFamily: FONTS.h }}>{project.name}</p>
              <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: FONTS.b }}>{project.property_address || project.city_name}</p>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold shrink-0 ${st.bg} ${st.text}`}>{st.label}</span>
          </div>
          {progress > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: progress === 100 ? "#16a34a" : PRIMARY }} />
              </div>
            </div>
          )}
          {project.start_date && (
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Started {project.start_date}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

function ProjectDetail({ project, currentUser, onBack }) {
  const [tab, setTab]         = useState("overview");
  const [guides, setGuides]   = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [statusLogs, setStatusLogs] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [budgetItems, setBudgetItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ ...project });
  const [saving, setSaving]   = useState(false);
  const [newCollab, setNewCollab] = useState({ email: "", role: "contractor", name: "" });
  const [addingCollab, setAddingCollab] = useState(false);
  const [newBudget, setNewBudget] = useState({ description: "", category: "permit_fee", estimated_amount: "", actual_amount: "" });
  const [addingBudget, setAddingBudget] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      base44.entities.SubmissionGuide.filter({ project_id: project.id }, "-updated_date"),
      base44.entities.PermitMilestone ? base44.entities.PermitMilestone.filter({ project_id: project.id }, "milestone_date") : Promise.resolve([]),
      base44.entities.PermitStatusLog ? base44.entities.PermitStatusLog.filter({ project_id: project.id }, "-change_date", 20) : Promise.resolve([]),
      base44.entities.ProjectCollaborator.filter({ project_id: project.id }),
      base44.entities.ProjectBudgetItem.filter({ project_id: project.id }),
    ]).then(([g, m, sl, c, b]) => {
      setGuides(Array.isArray(g) ? g : []);
      setMilestones(Array.isArray(m) ? m : []);
      setStatusLogs(Array.isArray(sl) ? sl : []);
      setCollaborators(Array.isArray(c) ? c : []);
      setBudgetItems(Array.isArray(b) ? b : []);
      setLoading(false);
    });
  }, [project.id]);

  const saveEdit = async () => {
    setSaving(true);
    await base44.entities.Project.update(project.id, editData);
    setSaving(false);
    setEditing(false);
    Object.assign(project, editData);
  };

  const addCollaborator = async () => {
    if (!newCollab.email) return;
    setAddingCollab(true);
    const c = await base44.entities.ProjectCollaborator.create({ ...newCollab, project_id: project.id, invited_by: currentUser?.email });
    setCollaborators(prev => [...prev, c]);
    setNewCollab({ email: "", role: "contractor", name: "" });
    setAddingCollab(false);
  };

  const addBudgetItem = async () => {
    if (!newBudget.description) return;
    setAddingBudget(true);
    const b = await base44.entities.ProjectBudgetItem.create({ ...newBudget, project_id: project.id, estimated_amount: parseFloat(newBudget.estimated_amount) || 0 });
    setBudgetItems(prev => [...prev, b]);
    setNewBudget({ description: "", category: "permit_fee", estimated_amount: "", actual_amount: "" });
    setAddingBudget(false);
  };

  const st = STATUS_CONFIG[project.status] || STATUS_CONFIG.planning;
  const totalBudget = budgetItems.reduce((s, i) => s + (parseFloat(i.estimated_amount) || 0), 0);
  const totalActual = budgetItems.reduce((s, i) => s + (parseFloat(i.actual_amount) || 0), 0);

  const TABS = [
    { key: "overview",  label: "Overview" },
    { key: "permits",   label: `Applications (${guides.length})` },
    { key: "timeline",  label: "Timeline" },
    { key: "team",      label: `Team (${collaborators.length})` },
    { key: "budget",    label: `Budget (${budgetItems.length})` },
  ];

  return (
    <div>
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-4 transition-colors">
          ← Back to My Projects
        </button>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-extrabold text-xl text-gray-900" style={{ fontFamily: FONTS.h }}>{project.name}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${st.bg} ${st.text}`}>{st.label}</span>
              {project.city_name && <span className="text-xs text-gray-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> {project.city_name}</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setEditing(true)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50">Edit</button>
            <Link to={`/ApplyForPermit?project=${project.id}`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-bold text-sm"
              style={{ background: PRIMARY, textDecoration: "none" }}>
              <FileText className="w-4 h-4" /> New Application
            </Link>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-4 bg-white rounded-xl border border-gray-100 p-1 shadow-sm overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${tab === t.key ? "text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            style={{ background: tab === t.key ? PRIMARY : "transparent", fontFamily: FONTS.b }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          {/* OVERVIEW */}
          {tab === "overview" && (
            editing ? (
              <div className="space-y-4">
                <h3 className="font-bold text-gray-800" style={{ fontFamily: FONTS.h }}>Edit Project</h3>
                {[
                  { key: "name", label: "Project Name", type: "text" },
                  { key: "property_address", label: "Property Address", type: "text" },
                  { key: "city_name", label: "City", type: "text" },
                  { key: "estimated_cost", label: "Estimated Cost ($)", type: "number" },
                  { key: "notes", label: "Notes", type: "textarea" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">{f.label}</label>
                    {f.type === "textarea" ? (
                      <textarea value={editData[f.key] || ""} onChange={e => setEditData(p => ({ ...p, [f.key]: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 h-20" />
                    ) : (
                      <input type={f.type} value={editData[f.key] || ""} onChange={e => setEditData(p => ({ ...p, [f.key]: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
                    )}
                  </div>
                ))}
                <div className="flex gap-3">
                  <button onClick={saveEdit} disabled={saving}
                    className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-60"
                    style={{ background: PRIMARY }}>
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                  <button onClick={() => setEditing(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { label: "Project Type", value: project.project_type?.replace("_", " ") },
                  { label: "Property Address", value: project.property_address },
                  { label: "City", value: project.city_name },
                  { label: "Status", value: st.label },
                  { label: "Priority", value: project.priority },
                  { label: "Estimated Cost", value: project.estimated_cost ? `$${project.estimated_cost.toLocaleString()}` : null },
                  { label: "Start Date", value: project.start_date },
                  { label: "Target Completion", value: project.target_completion_date },
                  { label: "Folio Number", value: project.folio_number },
                ].filter(f => f.value).map(f => (
                  <div key={f.label} className="py-2 border-b border-gray-50 last:border-0">
                    <p className="text-xs text-gray-400 mb-0.5">{f.label}</p>
                    <p className="text-sm font-semibold text-gray-800 capitalize">{f.value}</p>
                  </div>
                ))}
                {project.notes && (
                  <div className="sm:col-span-2 py-2">
                    <p className="text-xs text-gray-400 mb-0.5">Notes</p>
                    <p className="text-sm text-gray-600">{project.notes}</p>
                  </div>
                )}
              </div>
            )
          )}

          {/* PERMIT APPLICATIONS */}
          {tab === "permits" && (
            <div>
              {guides.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-3">No permit applications linked to this project.</p>
                  <Link to={`/ApplyForPermit?project=${project.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-bold text-sm"
                    style={{ background: PRIMARY, textDecoration: "none" }}>
                    <Plus className="w-4 h-4" /> Start Application
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {guides.map(g => (
                    <Link key={g.id} to={`/ApplyForPermit?resume=${g.id}`}
                      className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all"
                      style={{ textDecoration: "none" }}>
                      <div>
                        <p className="font-semibold text-sm text-gray-800">{g.permit_type_name}</p>
                        <p className="text-xs text-gray-400">{g.city_name} · {g.phase?.replace("_", " ")}</p>
                        {g.questions_total > 0 && (
                          <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full w-32 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${Math.round((g.questions_answered/g.questions_total)*100)}%`, background: PRIMARY }} />
                          </div>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TIMELINE */}
          {tab === "timeline" && (
            <div>
              {milestones.length === 0 && statusLogs.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No timeline events yet. Submit a permit application to get started.</p>
              ) : (
                <div className="space-y-4">
                  {milestones.map(m => (
                    <div key={m.id} className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-base shrink-0">{MILESTONE_ICONS[m.milestone_type] || "📌"}</div>
                      <div>
                        <p className="font-semibold text-sm text-gray-800">{m.milestone_type?.replace("_", " ")}</p>
                        <p className="text-xs text-gray-400">{m.milestone_date}</p>
                        {m.notes && <p className="text-xs text-gray-500 mt-0.5">{m.notes}</p>}
                      </div>
                    </div>
                  ))}
                  {statusLogs.map(l => (
                    <div key={l.id} className="flex items-start gap-4 opacity-70">
                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-base shrink-0">📝</div>
                      <div>
                        <p className="text-sm text-gray-600">{l.previous_status} → <strong>{l.new_status}</strong></p>
                        <p className="text-xs text-gray-400">{l.change_date} · {l.changed_by_name || l.changed_by_email}</p>
                        {l.reason && <p className="text-xs text-gray-500 mt-0.5">{l.reason}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TEAM */}
          {tab === "team" && (
            <div>
              <div className="space-y-3 mb-5">
                {collaborators.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500">
                        {c.name?.[0]?.toUpperCase() || c.email?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{c.name || c.email}</p>
                        <p className="text-xs text-gray-400">{c.email}</p>
                      </div>
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium capitalize">{c.role}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">Add Team Member</p>
                <div className="space-y-2">
                  <input type="text" placeholder="Name" value={newCollab.name} onChange={e => setNewCollab(p => ({ ...p, name: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                  <input type="email" placeholder="Email" value={newCollab.email} onChange={e => setNewCollab(p => ({ ...p, email: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                  <select value={newCollab.role} onChange={e => setNewCollab(p => ({ ...p, role: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
                    {["contractor","homeowner","vendor","inspector","architect","viewer"].map(r => (
                      <option key={r} value={r} className="capitalize">{r}</option>
                    ))}
                  </select>
                  <button onClick={addCollaborator} disabled={addingCollab || !newCollab.email}
                    className="w-full py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-50"
                    style={{ background: PRIMARY }}>
                    {addingCollab ? "Adding..." : "Add Member"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* BUDGET */}
          {tab === "budget" && (
            <div>
              {/* Summary */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                  <p className="text-xs text-blue-600 font-semibold mb-1">Estimated Total</p>
                  <p className="text-xl font-extrabold text-blue-800" style={{ fontFamily: FONTS.h }}>${totalBudget.toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-xl bg-green-50 border border-green-100">
                  <p className="text-xs text-green-600 font-semibold mb-1">Actual Spent</p>
                  <p className="text-xl font-extrabold text-green-800" style={{ fontFamily: FONTS.h }}>${totalActual.toLocaleString()}</p>
                </div>
              </div>
              {/* Items */}
              <div className="space-y-2 mb-5">
                {budgetItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{item.description}</p>
                      <p className="text-xs text-gray-400 capitalize">{item.category?.replace("_", " ")}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-700">${(item.estimated_amount || 0).toLocaleString()}</p>
                      {item.actual_amount > 0 && <p className="text-xs text-gray-400">Actual: ${item.actual_amount.toLocaleString()}</p>}
                    </div>
                  </div>
                ))}
              </div>
              {/* Add item */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">Add Budget Item</p>
                <div className="space-y-2">
                  <input type="text" placeholder="Description" value={newBudget.description} onChange={e => setNewBudget(p => ({ ...p, description: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                  <select value={newBudget.category} onChange={e => setNewBudget(p => ({ ...p, category: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
                    {["permit_fee","materials","labor","contractor","inspection","design","other"].map(c => (
                      <option key={c} value={c} className="capitalize">{c.replace("_", " ")}</option>
                    ))}
                  </select>
                  <input type="number" placeholder="Estimated Amount ($)" value={newBudget.estimated_amount} onChange={e => setNewBudget(p => ({ ...p, estimated_amount: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                  <button onClick={addBudgetItem} disabled={addingBudget || !newBudget.description}
                    className="w-full py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-50"
                    style={{ background: PRIMARY }}>
                    {addingBudget ? "Adding..." : "Add Item"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MyProjects() {
  const [currentUser, setCurrentUser] = useState(null);
  const [projects, setProjects]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [filter, setFilter]           = useState("all");
  const [selected, setSelected]       = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newProject, setNewProject]   = useState({ name: "", project_type: "remodel", city_name: "Weston", property_address: "" });
  const [creating, setCreating]       = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      setCurrentUser(u);
      if (u) loadProjects(u);
      else setLoading(false);
    }).catch(() => setLoading(false));

    const idParam = new URLSearchParams(window.location.search).get("id");
    if (idParam) {
      base44.entities.Project.filter({ id: idParam }).then(p => {
        if (p && p.length > 0) setSelected(p[0]);
      });
    }
  }, []);

  const loadProjects = async (user) => {
    setLoading(true);
    const data = await base44.entities.Project.filter({ owner_email: user.email }, "-updated_date");
    setProjects(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const createProject = async () => {
    if (!newProject.name || !currentUser) return;
    setCreating(true);
    const p = await base44.entities.Project.create({ ...newProject, owner_email: currentUser.email, status: "planning" });
    setProjects(prev => [p, ...prev]);
    setShowNewForm(false);
    setNewProject({ name: "", project_type: "remodel", city_name: "Weston", property_address: "" });
    setCreating(false);
    setSelected(p);
  };

  const filtered = projects.filter(p => {
    const matchFilter = filter === "all" || p.status === filter;
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.property_address?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  if (selected) {
    return (
      <div className="min-h-screen pb-8" style={{ background: "#f8f9ff" }}>
        <div className="max-w-4xl mx-auto px-4 pt-6">
          <ProjectDetail project={selected} currentUser={currentUser} onBack={() => setSelected(null)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8" style={{ background: "#f8f9ff" }}>
      <div className="px-4 pt-7 pb-5 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1 text-gray-400" style={{ fontFamily: FONTS.b }}>My Projects</p>
            <h1 className="font-extrabold text-2xl text-gray-900" style={{ fontFamily: FONTS.h }}>Projects</h1>
          </div>
          <button onClick={() => setShowNewForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-bold text-sm"
            style={{ background: PRIMARY, fontFamily: FONTS.h }}>
            <Plus className="w-4 h-4" /> New Project
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-5">
        {/* New project form */}
        {showNewForm && (
          <div className="bg-white rounded-2xl border border-blue-200 shadow-sm p-5 mb-5">
            <h3 className="font-bold text-gray-800 mb-4" style={{ fontFamily: FONTS.h }}>New Project</h3>
            <div className="space-y-3">
              <input type="text" placeholder="Project name *" value={newProject.name} onChange={e => setNewProject(p => ({ ...p, name: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
              <input type="text" placeholder="Property address" value={newProject.property_address} onChange={e => setNewProject(p => ({ ...p, property_address: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
              <div className="grid grid-cols-2 gap-3">
                <select value={newProject.project_type} onChange={e => setNewProject(p => ({ ...p, project_type: e.target.value }))}
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none">
                  {["new_construction","addition","remodel","roofing","electrical","plumbing","pool","fence","demolition","commercial","other"].map(t => (
                    <option key={t} value={t}>{t.replace("_", " ")}</option>
                  ))}
                </select>
                <input type="text" placeholder="City" value={newProject.city_name} onChange={e => setNewProject(p => ({ ...p, city_name: e.target.value }))}
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
              </div>
              <div className="flex gap-2">
                <button onClick={createProject} disabled={creating || !newProject.name}
                  className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-50"
                  style={{ background: PRIMARY }}>
                  {creating ? "Creating..." : "Create Project"}
                </button>
                <button onClick={() => setShowNewForm(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Filter & Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..."
              className="flex-1 bg-transparent text-sm focus:outline-none" style={{ fontFamily: FONTS.b }} />
          </div>
          <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
            {["all","planning","permitting","in_progress","completed"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${filter === f ? "text-white" : "text-gray-500 hover:text-gray-700"}`}
                style={{ background: filter === f ? PRIMARY : "transparent", fontFamily: FONTS.b }}>
                {f === "all" ? "All" : f.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
        ) : !currentUser ? (
          <div className="text-center py-16">
            <FolderOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="font-semibold text-gray-600 mb-2" style={{ fontFamily: FONTS.h }}>Sign in to manage your projects</p>
            <button onClick={() => base44.auth.redirectToLogin(window.location.href)}
              className="px-6 py-2.5 rounded-xl text-white font-bold text-sm" style={{ background: PRIMARY }}>
              Sign In
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="font-semibold text-gray-600 mb-2" style={{ fontFamily: FONTS.h }}>{search ? "No projects found" : "No projects yet"}</p>
            {!search && (
              <button onClick={() => setShowNewForm(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm mt-2"
                style={{ background: PRIMARY }}>
                <Plus className="w-4 h-4" /> Create Your First Project
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(p => <ProjectCard key={p.id} project={p} onClick={setSelected} />)}
          </div>
        )}
      </div>
    </div>
  );
}