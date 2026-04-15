import { MapPin, ChevronRight } from "lucide-react";

const STATUS_STYLES = {
  planning:    { bg: "bg-yellow-100", text: "text-yellow-700", label: "Planning" },
  permitting:  { bg: "bg-blue-100",   text: "text-blue-700",   label: "Permitting" },
  in_progress: { bg: "bg-indigo-100", text: "text-indigo-700", label: "In Progress" },
  completed:   { bg: "bg-green-100",  text: "text-green-700",  label: "Completed" },
  on_hold:     { bg: "bg-gray-100",   text: "text-gray-600",   label: "On Hold" },
};

function parseChecklist(raw) {
  try { const list = JSON.parse(raw || "[]"); return { total: list.length, done: list.filter(i => i.checked).length }; }
  catch { return { total: 0, done: 0 }; }
}

export default function HomeownerProjectCard({ project, selected, onClick }) {
  const status = STATUS_STYLES[project.status] || STATUS_STYLES.planning;
  const checklist = parseChecklist(project.permit_checklist);
  const pct = project.progress_pct || 0;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border-2 cursor-pointer transition-all hover:shadow-md p-5 ${
        selected ? "border-blue-500 shadow-md" : "border-gray-200 hover:border-blue-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-base leading-tight truncate">{project.name}</h3>
          {project.property_address && (
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 flex-shrink-0" /> {project.property_address}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status.bg} ${status.text}`}>
            {status.label}
          </span>
          <ChevronRight className={`w-4 h-4 transition-colors ${selected ? "text-blue-500" : "text-gray-300"}`} />
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-400">Progress</span>
          <span className="text-xs font-semibold text-gray-700">{pct}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        {checklist.total > 0 ? (
          <span>{checklist.done}/{checklist.total} docs collected</span>
        ) : (
          <span className="text-gray-400">No checklist yet</span>
        )}
        {project.estimated_cost && (
          <span className="font-semibold text-gray-700">${Number(project.estimated_cost).toLocaleString()}</span>
        )}
      </div>
    </div>
  );
}