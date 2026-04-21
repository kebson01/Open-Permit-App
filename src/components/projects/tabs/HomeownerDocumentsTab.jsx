import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CheckSquare, Square, MessageCircle, ExternalLink, Map } from "lucide-react";

function getPermitGuideUrl(project) {
  const commercialTypes = ["commercial"];
  const propertyType = commercialTypes.includes(project.project_type) ? "commercial" : "residential";
  const zoneMap = { roofing: "roof", pool: "pool", electrical: "electrical", plumbing: "plumbing", fence: "fence" };
  const zone = zoneMap[project.project_type] || "";
  let url = `/PermitGuide?propertyType=${propertyType}`;
  if (project.city_name) url += `&city=${encodeURIComponent(project.city_name)}`;
  if (zone) url += `&zone=${encodeURIComponent(zone)}`;
  return url;
}

const SUPABASE_URL = "https://gbknnjidqpmjrwlooluw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdia25uamlkcXBtanJ3bG9vbHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NTQzNDIsImV4cCI6MjA5MDIzMDM0Mn0.qwDACgXe3hesxBRQOzP53Hdc44z_UOka1_uYQScyi68";

const DOCUMENT_INFO = {
  "Permit Application Form": { explanation: "Broward County's standard permit application form.", where: "Download at westonfl.org/permits" },
  "Site Plan / Survey": { explanation: "A to-scale drawing showing your property boundaries and where the work will be done.", where: "Your licensed surveyor or contractor can provide this." },
  "Construction Plans": { explanation: "Detailed drawings showing exactly what will be built — required for most building permits.", where: "Your architect or contractor prepares these." },
  "Contractor License": { explanation: "Proof that your contractor is licensed to do this type of work in Florida.", where: "Ask your contractor for a copy of their license." },
  "Product Approval": { explanation: "Florida approval certificate showing the materials (windows, roofing, etc.) meet hurricane standards.", where: "Your supplier or contractor will have this." },
  "NOA (Notice of Acceptance)": { explanation: "Florida Building Commission approval for specific products. Required for impact windows/doors.", where: "Your window/door supplier provides this." },
  "Owner Authorization Letter": { explanation: "A letter from the property owner authorizing the permit application.", where: "You write and sign this yourself." },
  "Scope of Work": { explanation: "A written description of exactly what work will be done.", where: "Your contractor prepares this." },
};

function getDocInfo(docName) {
  for (const key of Object.keys(DOCUMENT_INFO)) {
    if (docName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(docName.toLowerCase())) {
      return DOCUMENT_INFO[key];
    }
  }
  return { explanation: "Required document for this permit type.", where: "Ask your contractor or contact the Weston Building Department." };
}

export default function HomeownerDocumentsTab({ project, onUpdate }) {
  const [docs, setDocs] = useState([]);
  const [checked, setChecked] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load saved checklist state
    if (project.permit_checklist) {
      try {
        const saved = JSON.parse(project.permit_checklist);
        const state = {};
        saved.forEach(item => { state[item.label] = item.checked; });
        setChecked(state);
      } catch {}
    }

    // Fetch docs from Supabase based on project type
    const mapProjectTypeToZone = {
      roofing: "roof", pool: "pool", fence: "fence",
      electrical: "electrical", plumbing: "interior",
      remodel: "interior", addition: "structure",
      new_construction: "structure",
    };
    const zone = mapProjectTypeToZone[project.project_type] || null;

    const query = zone
      ? `${SUPABASE_URL}/rest/v1/weston_permit_types?map_zone=eq.${zone}&select=name,documents_needed`
      : `${SUPABASE_URL}/rest/v1/weston_permit_types?select=name,documents_needed&limit=3`;

    fetch(query, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    })
      .then(r => r.json())
      .then(data => {
        const allDocs = [];
        (Array.isArray(data) ? data : []).forEach(permit => {
          let docList = permit.documents_needed;
          if (typeof docList === "string") try { docList = JSON.parse(docList); } catch { docList = []; }
          (docList || []).forEach(d => { if (!allDocs.includes(d)) allDocs.push(d); });
        });
        setDocs(allDocs);
      })
      .catch(() => setDocs([]));
  }, [project.id]);

  const toggle = (doc) => {
    setChecked(prev => ({ ...prev, [doc]: !prev[doc] }));
  };

  const saveProgress = async () => {
    setSaving(true);
    const checklist = docs.map(d => ({ label: d, checked: !!checked[d] }));
    await base44.entities.Project.update(project.id, { permit_checklist: JSON.stringify(checklist) });
    onUpdate && onUpdate(prev => ({ ...prev, permit_checklist: JSON.stringify(checklist) }));
    setSaving(false);
  };

  const collectedCount = docs.filter(d => checked[d]).length;
  const pct = docs.length ? Math.round((collectedCount / docs.length) * 100) : 0;

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-gray-900 mb-0.5">Your document checklist</h3>
          <p className="text-sm text-gray-500">Check off each item as you gather it. We'll tell you where to get each one.</p>
        </div>
        <a
          href={getPermitGuideUrl(project)}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors text-xs font-semibold text-blue-700"
        >
          <Map className="w-3.5 h-3.5" />
          Visual Guide
        </a>
      </div>

      {/* Progress bar */}
      {docs.length > 0 && (
        <div className="mb-5 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-blue-800">{collectedCount} of {docs.length} documents collected</span>
            <span className="text-sm font-bold text-blue-700">{pct}%</span>
          </div>
          <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {docs.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <p className="text-sm">No documents found for this project type.</p>
          <p className="text-xs mt-1">Contact your local building department for requirements.</p>
        </div>
      ) : (
        <div className="space-y-3 mb-5">
          {docs.map((doc, i) => {
            const info = getDocInfo(doc);
            const isDone = !!checked[doc];
            return (
              <div
                key={i}
                onClick={() => toggle(doc)}
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  isDone ? "bg-green-50 border-green-200" : "bg-white border-gray-200 hover:border-blue-200"
                }`}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {isDone
                    ? <CheckSquare className="w-5 h-5 text-green-600" />
                    : <Square className="w-5 h-5 text-gray-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${isDone ? "text-green-800 line-through" : "text-gray-900"}`}>{doc}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{info.explanation}</p>
                  <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> {info.where}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
        <button
          onClick={saveProgress}
          disabled={saving}
          className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
          style={{ background: "#3B82F6" }}
        >
          {saving ? "Saving..." : "Save Progress"}
        </button>
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <MessageCircle className="w-3 h-3" />
          Not sure what something means? Ask the AI assistant →
        </p>
      </div>
    </div>
  );
}