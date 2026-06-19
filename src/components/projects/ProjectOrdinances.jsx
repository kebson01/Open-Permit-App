import * as db from "@/lib/db";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, ExternalLink, Loader2 } from "lucide-react";

const CATEGORY_COLORS = {
  zoning: "bg-blue-50 text-blue-700",
  building: "bg-orange-50 text-orange-700",
  fire_safety: "bg-red-50 text-red-700",
  electrical: "bg-yellow-50 text-yellow-700",
  plumbing: "bg-cyan-50 text-cyan-700",
  environmental: "bg-green-50 text-green-700",
  administrative: "bg-gray-50 text-gray-700",
  land_use: "bg-indigo-50 text-indigo-700",
  subdivision: "bg-purple-50 text-purple-700",
  signs: "bg-pink-50 text-pink-700",
  other: "bg-gray-50 text-gray-600",
};

// Map project types to relevant ordinance categories
const TYPE_TO_CATEGORIES = {
  new_construction: ["building", "zoning", "land_use"],
  addition: ["building", "zoning"],
  remodel: ["building", "electrical", "plumbing"],
  roofing: ["building"],
  electrical: ["electrical"],
  plumbing: ["plumbing"],
  pool: ["building", "zoning", "environmental"],
  fence: ["zoning", "building"],
  demolition: ["building", "environmental"],
  commercial: ["building", "zoning", "fire_safety", "land_use"],
  other: [],
};

export default function ProjectOrdinances({ project }) {
  const relevantCategories = TYPE_TO_CATEGORIES[project.project_type] || [];

  const { data: ordinances = [], isLoading } = useQuery({
    queryKey: ["ordinances", project.city_id],
    queryFn: () => db.CodeOfOrdinance.filter({ city_id: project.city_id, is_active: true }),
    enabled: !!project.city_id,
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-blue-400" /></div>;
  }

  if (ordinances.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No ordinances loaded for {project.city_name} yet.</p>
      </div>
    );
  }

  // Sort: relevant categories first
  const sorted = [...ordinances].sort((a, b) => {
    const aRel = relevantCategories.includes(a.category) ? 0 : 1;
    const bRel = relevantCategories.includes(b.category) ? 0 : 1;
    return aRel - bRel;
  });

  return (
    <div className="space-y-3">
      {relevantCategories.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 text-xs text-blue-700 mb-3">
          Showing most relevant ordinances for <strong>{project.project_type?.replace(/_/g, " ")}</strong> projects first.
        </div>
      )}

      {sorted.map(ord => (
        <div key={ord.id} className={`rounded-xl border p-4 ${relevantCategories.includes(ord.category) ? "border-blue-200 bg-blue-50/40" : "border-gray-200 bg-white"}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[ord.category] || CATEGORY_COLORS.other}`}>
                  {ord.category?.replace(/_/g, " ")}
                </span>
                {ord.section_number && (
                  <span className="text-xs text-gray-400">§{ord.section_number}</span>
                )}
              </div>
              <p className="text-sm font-semibold text-gray-800">{ord.section_title}</p>
              {ord.chapter_title && (
                <p className="text-xs text-gray-500 mt-0.5">{ord.chapter_title}</p>
              )}
              {ord.content && (
                <p className="text-xs text-gray-600 mt-2 line-clamp-3">{ord.content}</p>
              )}
            </div>
            {ord.reference_url && (
              <a
                href={ord.reference_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 text-blue-500 hover:text-blue-700"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}