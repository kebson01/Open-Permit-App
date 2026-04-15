import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, Circle, AlertTriangle, Calendar, Send } from "lucide-react";

const STAGES = [
  { id: "created", label: "Project Created", description: "Project set up with client details and scope of work.", critical: false },
  { id: "permits_identified", label: "Permits Identified", description: "All required permits determined, document checklist ready.", critical: false },
  { id: "docs_submitted", label: "Documents Submitted", description: "Complete permit package submitted to building department.", critical: true },
  { id: "permit_issued", label: "Permit Issued", description: "City issues permit — work can legally begin.", critical: true },
  { id: "work_underway", label: "Work Underway", description: "Active construction phase. Schedule inspections at each milestone.", critical: false },
  { id: "final_inspection", label: "Final Inspection", description: "City inspector signs off on completed work.", critical: true },
  { id: "closed", label: "Permit Closed / CO Issued", description: "Certificate of Occupancy or final closeout issued.", critical: false },
];

const STATUS_TO_STAGE = {
  planning: 1,
  permitting: 3,
  in_progress: 4,
  completed: 6,
};

export default function ContractorTimelineTab({ project, onUpdate }) {
  const [targetDates, setTargetDates] = useState(() => {
    try { return JSON.parse(project.timeline_dates || "{}"); } catch { return {}; }
  });
  const [saving, setSaving] = useState(false);

  const activeIdx = STATUS_TO_STAGE[project.status] || 1;

  const saveDates = async () => {
    setSaving(true);
    await base44.entities.Project.update(project.id, { notes: JSON.stringify({ timeline_dates: targetDates, prev_notes: project.notes }) });
    setSaving(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-900">Project timeline</h3>
          <p className="text-sm text-gray-500">Track milestones and critical path items</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-blue-200 text-blue-700 hover:bg-blue-50">
          <Send className="w-3.5 h-3.5" /> Send to client
        </button>
      </div>

      <div className="relative">
        <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-gray-200" />

        <div className="space-y-4">
          {STAGES.map((stage, i) => {
            const isDone = i < activeIdx;
            const isCurrent = i === activeIdx;
            const isPending = i > activeIdx;

            return (
              <div key={stage.id} className="flex items-start gap-4 relative">
                <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  isDone ? "bg-green-500 border-green-500"
                  : isCurrent ? "border-blue-500 bg-white"
                  : "border-gray-300 bg-white"
                }`}>
                  {isDone ? <CheckCircle2 className="w-4 h-4 text-white" />
                  : isCurrent ? <div className="w-3 h-3 rounded-full bg-blue-500" />
                  : <Circle className="w-4 h-4 text-gray-300" />}
                </div>

                <div className={`flex-1 pb-1 ${isPending ? "opacity-60" : ""}`}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`font-semibold text-sm ${isCurrent ? "text-blue-700" : isDone ? "text-gray-900" : "text-gray-500"}`}>
                      {stage.label}
                    </p>
                    {stage.critical && (
                      <span className="text-xs flex items-center gap-0.5 text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">
                        <AlertTriangle className="w-2.5 h-2.5" /> Critical
                      </span>
                    )}
                    {isCurrent && <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">Current</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{stage.description}</p>
                  {!isDone && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <input
                        type="date"
                        value={targetDates[stage.id] || ""}
                        onChange={e => setTargetDates(prev => ({ ...prev, [stage.id]: e.target.value }))}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={saveDates}
          disabled={saving}
          className="px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-60"
          style={{ background: "#3B82F6" }}
        >
          {saving ? "Saving..." : "Save dates"}
        </button>
      </div>
    </div>
  );
}