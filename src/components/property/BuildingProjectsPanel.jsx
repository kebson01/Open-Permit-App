import { useState } from "react";
import { CheckCircle2, XCircle, AlertCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";

const STATUS_CONFIG = {
  allowed:         { icon: CheckCircle2,  color: "text-green-600", bg: "bg-green-50 border-green-200",  badge: "bg-green-100 text-green-800",  label: "Allowed" },
  permit_required: { icon: AlertCircle,   color: "text-amber-600", bg: "bg-amber-50 border-amber-200",  badge: "bg-amber-100 text-amber-800",  label: "Permit Required" },
  conditional:     { icon: Clock,         color: "text-blue-600",  bg: "bg-blue-50 border-blue-200",    badge: "bg-blue-100 text-blue-800",    label: "Conditional" },
  not_allowed:     { icon: XCircle,       color: "text-red-600",   bg: "bg-red-50 border-red-200",      badge: "bg-red-100 text-red-800",      label: "Not Allowed" },
};

const CATEGORY_ICONS = {
  "ADU": "🏡", "Guest House": "🏡", "Pool": "🏊", "Fence": "🪵",
  "Addition": "🏗️", "Shed": "🛖", "Solar": "☀️", "Garage": "🏠",
  "Deck": "🪜", "Patio": "🌿", "Sign": "📋", default: "🔨"
};

function getCategoryIcon(name) {
  const key = Object.keys(CATEGORY_ICONS).find(k => name?.toLowerCase().includes(k.toLowerCase()));
  return CATEGORY_ICONS[key] || CATEGORY_ICONS.default;
}

function ProjectCard({ project }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.conditional;
  const Icon = cfg.icon;
  const hasDetails = project.requirements?.length > 0 || project.restrictions?.length > 0;

  return (
    <div className={`rounded-xl border ${cfg.bg} overflow-hidden`}>
      <button
        className="w-full flex items-center gap-3 p-4 text-left"
        onClick={() => hasDetails && setExpanded(!expanded)}
      >
        <span className="text-2xl">{getCategoryIcon(project.name)}</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 text-sm">{project.name}</p>
          <div className={`inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.badge}`}>
            <Icon className={`w-3 h-3 ${cfg.color}`} />
            {cfg.label}
          </div>
        </div>
        {hasDetails && (
          <span className="text-gray-400">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        )}
      </button>

      {expanded && hasDetails && (
        <div className="px-4 pb-4 pt-0 space-y-2">
          {project.requirements?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1">Requirements:</p>
              <ul className="space-y-1">
                {project.requirements.map((r, i) => (
                  <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                    <span className="text-green-500 mt-0.5">✓</span> {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {project.restrictions?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1">Restrictions:</p>
              <ul className="space-y-1">
                {project.restrictions.map((r, i) => (
                  <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                    <span className="text-red-500 mt-0.5">✗</span> {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function BuildingProjectsPanel({ projects }) {
  if (!projects?.length) return null;

  const grouped = {
    allowed: projects.filter(p => p.status === "allowed"),
    permit_required: projects.filter(p => p.status === "permit_required"),
    conditional: projects.filter(p => p.status === "conditional"),
    not_allowed: projects.filter(p => p.status === "not_allowed"),
  };

  const summary = [
    { label: "Allowed", count: grouped.allowed.length, color: "bg-green-100 text-green-800" },
    { label: "Permit Req.", count: grouped.permit_required.length, color: "bg-amber-100 text-amber-800" },
    { label: "Conditional", count: grouped.conditional.length, color: "bg-blue-100 text-blue-800" },
    { label: "Not Allowed", count: grouped.not_allowed.length, color: "bg-red-100 text-red-800" },
  ].filter(s => s.count > 0);

  return (
    <div>
      <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide mb-3">What Can You Build?</h3>

      {/* Summary pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {summary.map(s => (
          <span key={s.label} className={`text-xs font-semibold px-3 py-1 rounded-full ${s.color}`}>
            {s.count} {s.label}
          </span>
        ))}
      </div>

      <div className="space-y-2">
        {projects.map((p, i) => <ProjectCard key={i} project={p} />)}
      </div>
    </div>
  );
}