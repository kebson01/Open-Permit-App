import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { X, FolderOpen, CheckCircle2, Loader2 } from "lucide-react";
import AuthModal from "@/components/auth/AuthModal";

export default function AddToProjectModal({ permitName, onClose }) {
  const [user, setUser] = useState(null);
  const [authed, setAuthed] = useState(null); // null = loading
  const [projects, setProjects] = useState([]);
  const [saving, setSaving] = useState(null); // project id being saved
  const [saved, setSaved] = useState(null);   // project id just saved
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      const is = !!user;
      setAuthed(is);
      if (is) {
        setUser(user);
        const { data } = await supabase.from("projects").select("*").eq("owner_email", user.email).order("created_at", { ascending: false });
        setProjects(data || []);
      }
      setLoading(false);
    });
  }, []);

  const addToProject = async (project) => {
    setSaving(project.id);
    let checklist = [];
    try { checklist = JSON.parse(project.permit_checklist || "[]"); } catch {}
    if (!checklist.find(i => i.label === permitName)) {
      checklist.push({ label: permitName, checked: false });
      await supabase.from("projects").update({ permit_checklist: JSON.stringify(checklist) }).eq("id", project.id);
    }
    setSaving(null);
    setSaved(project.id);
    setTimeout(() => { setSaved(null); onClose(); }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
          <div>
            <p className="font-bold text-gray-900 text-sm">Add to My Project</p>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[240px]">{permitName}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-blue-400" /></div>
          ) : !authed ? (
            <AuthModal onClose={() => { setAuthed(false); onClose(); }} />
          ) : projects.length === 0 ? (
            <div className="text-center py-4">
              <FolderOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-3">You don't have any projects yet.</p>
              <a
                href="/ProjectDashboard"
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white inline-block"
                style={{ background: "#3B82F6" }}
              >
                Create a Project
              </a>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Select a project:</p>
              {projects.map(p => (
                <button
                  key={p.id}
                  onClick={() => addToProject(p)}
                  disabled={!!saving}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left disabled:opacity-60"
                >
                  <FolderOpen className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                    {p.city_name && <p className="text-xs text-gray-400">{p.city_name}</p>}
                  </div>
                  {saved === p.id ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  ) : saving === p.id ? (
                    <Loader2 className="w-4 h-4 text-blue-400 animate-spin flex-shrink-0" />
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}