import { AlertTriangle, ChevronRight } from "lucide-react";

function getAttentionItems(projects) {
  const items = [];

  const needDocs = projects.filter(p => {
    if (!p.permit_checklist) return false;
    try {
      const list = JSON.parse(p.permit_checklist);
      return list.some(i => !i.checked) && p.status === "permitting";
    } catch { return false; }
  });
  if (needDocs.length > 0) {
    items.push({ label: `${needDocs.length} project${needDocs.length > 1 ? "s" : ""} awaiting document submission`, project: needDocs[0], color: "text-amber-700" });
  }

  const expiring = projects.filter(p => {
    if (!p.target_completion_date) return false;
    const daysLeft = Math.floor((new Date(p.target_completion_date) - Date.now()) / (1000 * 60 * 60 * 24));
    return daysLeft >= 0 && daysLeft <= 14 && p.status !== "completed";
  });
  if (expiring.length > 0) {
    items.push({ label: `${expiring.length} permit${expiring.length > 1 ? "s" : ""} expiring within 14 days`, project: expiring[0], color: "text-red-700" });
  }

  const inProgress = projects.filter(p => p.status === "in_progress");
  if (inProgress.length > 0) {
    items.push({ label: `${inProgress.length} active project${inProgress.length > 1 ? "s" : ""} in construction`, project: inProgress[0], color: "text-blue-700" });
  }

  return items;
}

export default function AttentionBanner({ projects, onProjectClick }) {
  const items = getAttentionItems(projects);
  if (items.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <p className="text-sm font-bold text-amber-800">Needs your attention today</p>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => item.project && onProjectClick(item.project)}
            className="w-full flex items-center justify-between text-left px-3 py-2 bg-white rounded-xl border border-amber-100 hover:border-amber-300 transition-colors"
          >
            <span className={`text-sm font-medium ${item.color}`}>{item.label}</span>
            <ChevronRight className="w-4 h-4 text-amber-400 flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}