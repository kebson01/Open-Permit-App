import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CheckSquare, Square, Download, UserCheck } from "lucide-react";

const SUPABASE_URL = "https://gbknnjidqpmjrwlooluw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdia25uamlkcXBtanJ3bG9vbHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NTQzNDIsImV4cCI6MjA5MDIzMDM0Mn0.qwDACgXe3hesxBRQOzP53Hdc44z_UOka1_uYQScyi68";

const PERMIT_CATEGORY_COLORS = {
  building:    "bg-blue-100 text-blue-700",
  electrical:  "bg-yellow-100 text-yellow-700",
  plumbing:    "bg-cyan-100 text-cyan-700",
  roof:        "bg-orange-100 text-orange-700",
  pool:        "bg-teal-100 text-teal-700",
};

const OWNER_PROVIDED = ["Owner Authorization Letter", "Proof of Ownership", "HOA Approval", "Survey"];

function isOwnerDoc(docName) {
  return OWNER_PROVIDED.some(o => docName.toLowerCase().includes(o.toLowerCase()));
}

export default function ContractorDocumentsTab({ project, onUpdate }) {
  const [permitDocs, setPermitDocs] = useState([]); // [{permitName, docs: [{label, checked, assignedToClient}]}]
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${SUPABASE_URL}/rest/v1/weston_permit_types?select=name,documents_needed,category`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    })
      .then(r => r.json())
      .then(data => {
        // Load saved state
        let savedMap = {};
        if (project.permit_checklist) {
          try {
            JSON.parse(project.permit_checklist).forEach(i => { savedMap[i.label] = i; });
          } catch {}
        }

        const groups = (Array.isArray(data) ? data : []).map(permit => {
          let docList = permit.documents_needed;
          if (typeof docList === "string") try { docList = JSON.parse(docList); } catch { docList = []; }
          return {
            permitName: permit.name,
            category: permit.category || "building",
            docs: (docList || []).map(d => ({
              label: d,
              checked: savedMap[d]?.checked || false,
              assignedToClient: savedMap[d]?.assignedToClient || isOwnerDoc(d),
            })),
          };
        }).filter(g => g.docs.length > 0);

        setPermitDocs(groups);
      })
      .catch(() => setPermitDocs([]));
  }, [project.id]);

  const toggleDoc = (gIdx, dIdx, field) => {
    setPermitDocs(prev => {
      const updated = prev.map((g, gi) => gi !== gIdx ? g : {
        ...g,
        docs: g.docs.map((d, di) => di !== dIdx ? d : { ...d, [field]: !d[field] }),
      });
      return updated;
    });
  };

  const saveProgress = async () => {
    setSaving(true);
    const flat = [];
    permitDocs.forEach(g => g.docs.forEach(d => flat.push({ label: d.label, checked: d.checked, assignedToClient: d.assignedToClient })));
    await base44.entities.Project.update(project.id, { permit_checklist: JSON.stringify(flat) });
    onUpdate && onUpdate(prev => ({ ...prev, permit_checklist: JSON.stringify(flat) }));
    setSaving(false);
  };

  const allDocs = permitDocs.flatMap(g => g.docs);
  const collected = allDocs.filter(d => d.checked).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-900">Document checklist</h3>
          <p className="text-sm text-gray-500">{collected} of {allDocs.length} documents collected · Grouped by permit type</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={saveProgress}
            disabled={saving}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white disabled:opacity-60"
            style={{ background: "#3B82F6" }}
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50">
            <Download className="w-3.5 h-3.5" /> Export PDF
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {permitDocs.map((group, gi) => (
          <div key={gi}>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold mb-3 ${PERMIT_CATEGORY_COLORS[group.category] || "bg-gray-100 text-gray-700"}`}>
              {group.permitName}
            </div>
            <div className="space-y-2">
              {group.docs.map((doc, di) => (
                <div key={di} className={`flex items-center gap-3 p-3 rounded-xl border ${doc.checked ? "bg-green-50 border-green-200" : "bg-white border-gray-200"}`}>
                  <button onClick={() => toggleDoc(gi, di, "checked")} className="flex-shrink-0">
                    {doc.checked
                      ? <CheckSquare className="w-4 h-4 text-green-600" />
                      : <Square className="w-4 h-4 text-gray-400" />
                    }
                  </button>
                  <span className={`text-sm flex-1 ${doc.checked ? "line-through text-gray-400" : "text-gray-800"}`}>{doc.label}</span>
                  <button
                    onClick={() => toggleDoc(gi, di, "assignedToClient")}
                    title={doc.assignedToClient ? "Client's responsibility" : "Assign to client"}
                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors ${
                      doc.assignedToClient ? "bg-amber-50 text-amber-700 border border-amber-200" : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    <UserCheck className="w-3 h-3" />
                    {doc.assignedToClient ? "Client" : "Assign"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}