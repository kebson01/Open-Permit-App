import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, DollarSign, Calendar, ChevronRight, Trash2 } from "lucide-react";

const STATUS_STYLES = {
  planning:    "bg-yellow-100 text-yellow-700",
  permitting:  "bg-blue-100 text-blue-700",
  in_progress: "bg-indigo-100 text-indigo-700",
  completed:   "bg-green-100 text-green-700",
  on_hold:     "bg-gray-100 text-gray-600",
};

const TYPE_LABELS = {
  new_construction: "New Construction",
  addition: "Addition",
  remodel: "Remodel",
  roofing: "Roofing",
  electrical: "Electrical",
  plumbing: "Plumbing",
  pool: "Pool",
  fence: "Fence",
  demolition: "Demolition",
  commercial: "Commercial",
  other: "Other",
};

export default function ProjectCard({ project, onDelete }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[project.status] || STATUS_STYLES.planning}`}>
              {project.status?.replace(/_/g, " ")}
            </span>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {TYPE_LABELS[project.project_type] || project.project_type}
            </span>
            {project.is_contractor_project && (
              <span className="text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">Contractor</span>
            )}
          </div>
          <h3 className="font-semibold text-gray-900 text-base truncate">{project.name}</h3>

          <div className="mt-2 space-y-1">
            {project.city_name && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                {project.city_name}
              </div>
            )}
            {project.property_address && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{project.property_address}</span>
              </div>
            )}
            {project.estimated_cost && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <DollarSign className="w-3.5 h-3.5 flex-shrink-0" />
                Est. ${Number(project.estimated_cost).toLocaleString()}
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
              Created {new Date(project.created_date).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 items-end">
          <Button
            variant="ghost"
            size="icon"
            className="text-red-400 hover:text-red-600 hover:bg-red-50 h-7 w-7"
            onClick={(e) => { e.preventDefault(); onDelete(project); }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100">
        <Link to={`/ProjectDetail?id=${project.id}`}>
          <Button size="sm" variant="outline" className="w-full text-xs gap-1">
            Open Project <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}