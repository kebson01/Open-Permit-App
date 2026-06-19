import { useState } from "react";
import * as db from "@/lib/db";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Clock } from "lucide-react";

const MILESTONES = [
  { key: "planning",    label: "Planning",    desc: "Scope defined, budget set" },
  { key: "permitting",  label: "Permitting",  desc: "Permits submitted/approved" },
  { key: "in_progress", label: "In Progress", desc: "Construction underway" },
  { key: "completed",   label: "Completed",   desc: "Project finaled" },
];

const STATUS_ORDER = ["planning", "permitting", "in_progress", "on_hold", "completed"];

export default function ProjectProgressBar({ project, onUpdate }) {
  const [saving, setSaving] = useState(false);

  const currentIndex = MILESTONES.findIndex(m => m.key === project.status);
  const progress = project.progress_pct ?? Math.max(0, Math.min(100, currentIndex >= 0 ? (currentIndex / (MILESTONES.length - 1)) * 100 : 0));

  const handleProgressChange = async (e) => {
    const val = parseInt(e.target.value);
    setSaving(true);
    await db.Project.update(project.id, { progress_pct: val });
    onUpdate(prev => ({ ...prev, progress_pct: val }));
    setSaving(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">Overall Progress</h3>
        <span className="text-2xl font-bold text-blue-600">{Math.round(progress)}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
        <div
          className="h-3 rounded-full transition-all duration-500"
          style={{
            width: `${progress}%`,
            background: progress >= 100 ? "#10b981" : progress >= 66 ? "#3b82f6" : progress >= 33 ? "#f59e0b" : "#e5e7eb"
          }}
        />
      </div>

      {/* Manual slider */}
      <input
        type="range"
        min="0"
        max="100"
        value={Math.round(progress)}
        onChange={handleProgressChange}
        className="w-full h-1 accent-blue-600 mb-4"
      />

      {/* Milestone steps */}
      <div className="flex items-center gap-1 mt-2">
        {MILESTONES.map((m, i) => {
          const done = i < currentIndex || project.status === "completed";
          const active = m.key === project.status;
          return (
            <div key={m.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-colors ${
                  done ? "bg-blue-600 border-blue-600" :
                  active ? "bg-white border-blue-600" :
                  "bg-white border-gray-200"
                }`}>
                  {done ? <CheckCircle2 className="w-4 h-4 text-white" /> :
                   active ? <Clock className="w-3.5 h-3.5 text-blue-600" /> :
                   <Circle className="w-3.5 h-3.5 text-gray-300" />}
                </div>
                <p className={`text-xs mt-1 font-medium ${active ? "text-blue-600" : done ? "text-gray-700" : "text-gray-400"}`}>
                  {m.label}
                </p>
              </div>
              {i < MILESTONES.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 mb-5 ${done ? "bg-blue-600" : "bg-gray-200"}`} />
              )}
            </div>
          );
        })}
      </div>

      {project.start_date || project.target_completion_date ? (
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500 border-t border-gray-100 pt-3">
          {project.start_date && <span>Started: <strong>{new Date(project.start_date).toLocaleDateString()}</strong></span>}
          {project.target_completion_date && <span>Target: <strong>{new Date(project.target_completion_date).toLocaleDateString()}</strong></span>}
          {project.actual_completion_date && <span className="text-green-600">Completed: <strong>{new Date(project.actual_completion_date).toLocaleDateString()}</strong></span>}
        </div>
      ) : null}
    </div>
  );
}