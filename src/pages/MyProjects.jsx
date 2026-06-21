import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import * as db from "@/lib/db";
import {
  Plus, Loader2, ArrowRight, Calendar, MapPin,
  FileText, Search, CheckCircle2, Home, LayoutDashboard, FolderOpen, Trash2
} from "lucide-react";

const PRIMARY = "#1353d8";

const STATUS_CONFIG = {
  planning:    { bg: "bg-gray-100",   text: "text-gray-700",   label: "Planning",         bar: "#94a3b8" },
  permitting:  { bg: "bg-blue-100",   text: "text-blue-700",   label: "Permitting",        bar: PRIMARY },
  in_progress: { bg: "bg-blue-100",   text: "text-blue-700",   label: "In Progress",       bar: PRIMARY },
  completed:   { bg: "bg-green-100",  text: "text-green-700",  label: "Completed",         bar: "#16a34a" },
  on_hold:     { bg: "bg-amber-100",  text: "text-amber-700",  label: "Awaiting Approval", bar: "#f59e0b" },
};

const CATEGORY_LABELS = {
  new_construction: "NEW",
  addition:         "ADDITION",
  remodel:          "INTERIOR",
  roofing:          "EXTERIOR",
  electrical:       "ELECTRICAL",
  plumbing:         "PLUMBING",
  pool:             "POOL",
  fence:            "FENCE",
  demolition:       "DEMO",
  commercial:       "COMMERCIAL",
  other:            "OTHER",
};

const CATEGORY_COLORS = {
  new_construction: "bg-blue-600",
  remodel:          "bg-blue-700",
  roofing:          "bg-orange-500",
  electrical:       "bg-yellow-600",
  plumbing:         "bg-cyan-600",
  other:            "bg-gray-500",
};

const STOCK_IMAGES = {
  remodel:          "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80",
  roofing:          "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
  new_construction: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400&q=80",
  pool:             "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&q=80",
  electrical:       "https://images.unsplash.com/photo-1621905251189-08b45249ff38?w=400&q=80",
  plumbing:         "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80",
  other:            "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&q=80",
};

function getImage(type) {
  return STOCK_IMAGES[type] || STOCK_IMAGES.other;
}

function ProjectCard({ project, onClick, onDelete }) {
  const st = STATUS_CONFIG[project.status] || STATUS_CONFIG.planning;
  const progress = project.progress_pct || 0;
  const catLabel = CATEGORY_LABELS[project.project_type] || "PROJECT";
  const catColor = CATEGORY_COLORS[project.project_type] || "bg-gray-500";
  const isCompleted = project.status === "completed";

  return (
    <div
      onClick={() => onClick(project)}
      className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex cursor-pointer"
    >
      {/* Thumbnail */}
      <div className="relative w-28 h-28 shrink-0">
        <img src={getImage(project.project_type)} alt={project.name} className="w-full h-full object-cover" />
        <span className={`absolute top-2 left-2 text-[9px] font-bold text-white px-1.5 py-0.5 rounded ${catColor}`}>
          {catLabel}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-bold text-gray-900 text-sm leading-tight truncate">{project.name}</p>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${st.bg} ${st.text}`}>
              {st.label.toUpperCase()}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(project); }}
              className="p-1 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
              aria-label="Delete project"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-1 truncate">
          {project.description || project.property_address || project.city_name || "—"}
        </p>

        {isCompleted ? (
          <div className="flex items-center gap-1 mt-3 text-xs text-green-600 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>All tasks verified</span>
          </div>
        ) : (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${progress}%`, background: st.bar }} />
            </div>
          </div>
        )}
      </div>
    </div>
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
      db.SubmissionGuide.filter({ project_id: project.id }),
      db.PermitMilestone.filter({ project_id: project.id }),
      db.PermitStatusLog.filter({ project_id: project.id }),
      db.ProjectCollaborator.filter({ project_id: project.id }),
      db.ProjectBudgetItem.filter({ project_id: project.id }),
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
    await db.Project.update(project.id, editData);
    setSaving(false);
    setEditing(false);
    Object.assign(project, editData);
  };

  const addCollaborator = async () => {
    if (!newCollab.email) return;
    setAddingCollab(true);
    const c = await db.ProjectCollaborator.create({ ...newCollab, project_id: project.id, invited_by: currentUser?.email });
    setCollaborators(prev => [...prev, c]);
    setNewCollab({ email: "", role: "contractor", name: "" });
    setAddingCollab(false);
  };

  const addBudgetItem = async () => {
    if (!newBudget.description) return;
    setAddingBudget(true);
    const b = await db.ProjectBudgetItem.create({ ...newBudget, project_id: project.id, estimated_amount: parseFloat(newBudget.estimated_amount) || 0 });
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
    { key: "budget",    label: `Budget` },
  ];

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-4">
          ← Back to Projects
        </button>
        <div className="relative h-36 rounded-2xl overflow-hidden mb-4">
          <img src={getImage(project.project_type)} alt={project.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
            <div>
              <p className="text-white font-extrabold text-lg leading-tight">{project.name}</p>
              {project.city_name && <p className="text-white/70 text-xs">{project.city_name}</p>}
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${st.bg} ${st.text}`}>{st.label}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditing(true)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50">Edit</button>
          <Link to={`/ApplyForPermit?project=${project.id}`}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-bold text-sm"
            style={{ background: PRIMARY, textDecoration: "none" }}>
            <FileText className="w-4 h-4" /> New Application
          </Link>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mx-4 my-3 bg-white rounded-xl border border-gray-100 p-1 shadow-sm overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${tab === t.key ? "text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            style={{ background: tab === t.key ? PRIMARY : "transparent" }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
      ) : (
        <div className="bg-white mx-4 rounded-2xl border border-gray-100 shadow-sm p-5">
          {tab === "overview" && (
            editing ? (
              <div className="space-y-4">
                <h3 className="font-bold text-gray-800">Edit Project</h3>
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
                  <button onClick={saveEdit} disabled={saving} className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-60" style={{ background: PRIMARY }}>
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
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "timeline" && (
            <div>
              {milestones.length === 0 && statusLogs.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No timeline events yet.</p>
              ) : (
                <div className="space-y-4">
                  {milestones.map(m => (
                    <div key={m.id} className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-base shrink-0">📌</div>
                      <div>
                        <p className="font-semibold text-sm text-gray-800">{m.milestone_type?.replace("_", " ")}</p>
                        <p className="text-xs text-gray-400">{m.milestone_date}</p>
                      </div>
                    </div>
                  ))}
                  {statusLogs.map(l => (
                    <div key={l.id} className="flex items-start gap-4 opacity-70">
                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-base shrink-0">📝</div>
                      <div>
                        <p className="text-sm text-gray-600">{l.previous_status} → <strong>{l.new_status}</strong></p>
                        <p className="text-xs text-gray-400">{l.change_date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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
                        <p className="text-xs text-gray-400 capitalize">{c.role}</p>
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
                    className="w-full py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-50" style={{ background: PRIMARY }}>
                    {addingCollab ? "Adding..." : "Add Member"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === "budget" && (
            <div>
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                  <p className="text-xs text-blue-600 font-semibold mb-1">Estimated Total</p>
                  <p className="text-xl font-extrabold text-blue-800">${totalBudget.toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-xl bg-green-50 border border-green-100">
                  <p className="text-xs text-green-600 font-semibold mb-1">Actual Spent</p>
                  <p className="text-xl font-extrabold text-green-800">${totalActual.toLocaleString()}</p>
                </div>
              </div>
              <div className="space-y-2 mb-5">
                {budgetItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{item.description}</p>
                      <p className="text-xs text-gray-400 capitalize">{item.category?.replace("_", " ")}</p>
                    </div>
                    <p className="text-sm font-bold text-gray-700">${(item.estimated_amount || 0).toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">Add Budget Item</p>
                <div className="space-y-2">
                  <input type="text" placeholder="Description" value={newBudget.description} onChange={e => setNewBudget(p => ({ ...p, description: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                  <select value={newBudget.category} onChange={e => setNewBudget(p => ({ ...p, category: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
                    {["permit_fee","materials","labor","contractor","inspection","design","other"].map(c => (
                      <option key={c} value={c}>{c.replace("_", " ")}</option>
                    ))}
                  </select>
                  <input type="number" placeholder="Estimated Amount ($)" value={newBudget.estimated_amount} onChange={e => setNewBudget(p => ({ ...p, estimated_amount: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                  <button onClick={addBudgetItem} disabled={addingBudget || !newBudget.description}
                    className="w-full py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-50" style={{ background: PRIMARY }}>
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

function BottomNav({ active }) {
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

export default function MyProjects() {
  const [currentUser, setCurrentUser] = useState(null);
  const [projects, setProjects]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [roleFilter, setRoleFilter]   = useState("homeowner");
  const [selected, setSelected]       = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newProject, setNewProject]   = useState({ name: "", project_type: "remodel", city_name: "Weston", property_address: "" });
  const [creating, setCreating]       = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user || null);
      if (user) loadProjects(user);
      else setLoading(false);
    }).catch(() => setLoading(false));

    const idParam = new URLSearchParams(window.location.search).get("id");
    if (idParam) {
      db.Project.filter({ id: idParam }).then(p => {
        if (p && p.length > 0) setSelected(p[0]);
      });
    }
  }, []);

  const loadProjects = async (user) => {
    setLoading(true);
    const data = await db.Project.filter({ owner_email: user.email });
    setProjects(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const deleteProject = async (project) => {
    if (!window.confirm("Delete this project? This action cannot be undone.")) return;
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", project.id);
    if (error) {
      alert("Could not delete: " + error.message);
      return;
    }
    setProjects(prev => prev.filter(p => p.id !== project.id));
    alert("Project deleted");
  };

  const createProject = async () => {
    if (!newProject.name || !currentUser) return;
    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("projects")
        .insert({
          name: newProject.name,
          property_address: newProject.property_address,
          project_type: newProject.project_type,
          city_name: newProject.city_name,
          owner_email: user?.email || currentUser.email,
          status: "planning",
        })
        .select()
        .single();
      if (error) {
        console.error("Project create error:", error);
        alert("Could not create project: " + error.message);
        setCreating(false);
        return;
      }
      setProjects(prev => [data, ...prev]);
      setShowNewForm(false);
      setNewProject({ name: "", project_type: "remodel", city_name: "Weston", property_address: "" });
      setSelected(data);
    } catch (err) {
      console.error("Project create error:", err);
      alert("Could not create project: " + (err?.message || "Unknown error"));
    } finally {
      setCreating(false);
    }
  };

  if (selected) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ProjectDetail project={selected} currentUser={currentUser} onBack={() => setSelected(null)} />
        <BottomNav active="projects" />
      </div>
    );
  }

  const active    = projects.filter(p => p.status !== "completed" && p.status !== "on_hold");
  const pending   = projects.filter(p => p.status === "on_hold");
  const completed = projects.filter(p => p.status === "completed");

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-4">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">OP</span>
            </div>
            <span className="font-bold text-blue-700 text-lg">OpenPermit</span>
          </div>
          <Link to="/MyAccount" className="no-underline">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
              {currentUser?.user_metadata?.full_name?.[0] || currentUser?.email?.[0]?.toUpperCase() || "?"}
            </div>
          </Link>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "Active Projects",  value: active.length,    color: "text-blue-700" },
            { label: "Pending",          value: pending.length,   color: "text-orange-600" },
            { label: "Completed",        value: completed.length, color: "text-gray-700" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 text-center">
              <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-gray-400 font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Role toggle */}
        <div className="flex bg-gray-100 rounded-xl p-1">
          {["homeowner", "contractor", "provider"].map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all capitalize ${roleFilter === r ? "bg-white shadow-sm text-blue-600" : "text-gray-500"}`}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4">
        {/* Section header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-extrabold text-gray-900 text-base">Recent Projects</h2>
          <button className="text-sm text-blue-600 font-semibold">See all</button>
        </div>

        {/* New project form */}
        {showNewForm && (
          <div className="bg-white rounded-2xl border border-blue-200 shadow-sm p-5 mb-4">
            <h3 className="font-bold text-gray-800 mb-4">New Project</h3>
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
                  className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-50" style={{ background: PRIMARY }}>
                  {creating ? "Creating..." : "Create Project"}
                </button>
                <button onClick={() => setShowNewForm(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Project list */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
        ) : !currentUser ? (
          <div className="text-center py-16">
            <FolderOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="font-semibold text-gray-600 mb-4">Sign in to manage your projects</p>
            <button onClick={() => window.location.replace("/login")}
              className="px-6 py-2.5 rounded-xl text-white font-bold text-sm" style={{ background: PRIMARY }}>
              Sign In
            </button>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="font-semibold text-gray-600 mb-2">No projects yet</p>
            <button onClick={() => setShowNewForm(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm mt-2" style={{ background: PRIMARY }}>
              <Plus className="w-4 h-4" /> Create Your First Project
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map(p => <ProjectCard key={p.id} project={p} onClick={setSelected} onDelete={deleteProject} />)}
          </div>
        )}
      </div>

      {/* Floating action button */}
      {currentUser && !showNewForm && (
        <button
          onClick={() => setShowNewForm(true)}
          className="fixed bottom-20 right-5 w-14 h-14 rounded-2xl text-white flex items-center justify-center shadow-lg z-40"
          style={{ background: PRIMARY }}>
          <Plus className="w-6 h-6" />
        </button>
      )}

      <BottomNav active="projects" />
    </div>
  );
}