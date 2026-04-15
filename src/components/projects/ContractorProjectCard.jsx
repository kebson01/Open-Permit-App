import { MapPin, Clock } from "lucide-react";

const STATUS_CONFIG = {
  planning:    { border: "border-l-blue-400",   label: "Planning",    badge: "bg-blue-100 text-blue-700" },
  permitting:  { border: "border-l-amber-400",  label: "Permitting",  badge: "bg-amber-100 text-amber-700" },
  in_progress: { border: "border-l-green-400",  label: "Active",      badge: "bg-green-100 text-green-700" },
  completed:   { border: "border-l-gray-300",   label: "Completed",   badge: "bg-gray-100 text-gray-600" },
  on_hold:     { border: "border-l-gray-300",   label: "On Hold",     badge: "bg-gray-100 text-gray-500" },
};

function parseChecklist(raw) {
  try { const list = JSON.parse(raw || "[]"); return { total: list.length, done: list.filter(i => i.checked).length }; }
  catch { return { total: 0, done: 0 }; }
}

function daysSince(dateStr) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export default function ContractorProjectCard({ project, selected, onClick }) {
  const config = STATUS_CONFIG[project.status] || STATUS_CONFIG.planning;
  const checklist = parseChecklist(project.permit_checklist);
  const days = daysSince(project.updated_date);

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border-l-4 border border-gray-200 cursor-pointer transition-all hover:shadow-md p-4 ${config.border} ${
        selected ? "ring-2 ring-blue-400 shadow-md" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-sm leading-tight">
            {project.client_name || "No client name"}
          </p>
          <p className="text-xs text-gray-500 font-medium truncate">{project.name}</p>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${config.badge}`}>
          {config.label}
        </span>
      </div>

      {project.property_address && (
        <p className="text-xs text-gray-400 mb-2 flex items-center gap-1 truncate">
          <MapPin className="w-3 h-3 flex-shrink-0" /> {project.property_address}
        </p>
      )}

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{checklist.total > 0 ? `${checklist.done}/${checklist.total} docs` : "No checklist"}</span>
        <div className="flex items-center gap-1">
          {days !== null && <Clock className="w-3 h-3" />}
          {days !== null && <span>{days}d ago</span>}
        </div>
      </div>

      {project.contractor_license && (
        <p className="text-xs text-gray-400 mt-1.5 font-mono">#{project.contractor_license}</p>
      )}
    </div>
  );
}