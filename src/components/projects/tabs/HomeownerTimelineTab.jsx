import { CheckCircle2, Circle, Clock } from "lucide-react";

const STAGES = [
  {
    id: "created",
    label: "Project Created",
    description: "You've set up your project and identified what you want to build.",
    statusKey: null, // always done if project exists
  },
  {
    id: "permits_identified",
    label: "Permits Identified",
    description: "You know which permits you need and have your document checklist ready.",
    statusKey: "planning",
  },
  {
    id: "application_submitted",
    label: "Application Submitted",
    description: "Your permit application and documents have been submitted to the building department.",
    statusKey: "permitting",
  },
  {
    id: "permit_approved",
    label: "Permit Approved",
    description: "The city has reviewed and approved your permit. You're cleared to start work!",
    statusKey: "in_progress",
  },
  {
    id: "final_inspection",
    label: "Final Inspection",
    description: "An inspector verifies the work was done correctly. Once passed, your project is officially complete.",
    statusKey: "completed",
  },
];

const STATUS_ORDER = ["planning", "permitting", "in_progress", "completed"];

function getActiveStageIndex(status) {
  if (!status || status === "planning") return 1;
  if (status === "permitting") return 2;
  if (status === "in_progress") return 3;
  if (status === "completed") return 4;
  return 1;
}

export default function HomeownerTimelineTab({ project }) {
  const activeIdx = getActiveStageIndex(project.status);

  return (
    <div>
      <h3 className="font-bold text-gray-900 mb-1">Your permit journey</h3>
      <p className="text-sm text-gray-500 mb-6">Here's where you are in the permitting process.</p>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-gray-200" />

        <div className="space-y-6">
          {STAGES.map((stage, i) => {
            const isDone = i < activeIdx;
            const isCurrent = i === activeIdx;
            const isPending = i > activeIdx;

            return (
              <div key={stage.id} className="flex items-start gap-4 relative">
                {/* Icon */}
                <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  isDone
                    ? "bg-green-500 border-green-500"
                    : isCurrent
                    ? "border-blue-500 bg-white"
                    : "border-gray-300 bg-white"
                }`}>
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  ) : isCurrent ? (
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                  ) : (
                    <Circle className="w-4 h-4 text-gray-300" />
                  )}
                </div>

                {/* Content */}
                <div className={`flex-1 pb-2 ${isPending ? "opacity-50" : ""}`}>
                  <div className="flex items-center gap-2">
                    <p className={`font-semibold text-sm ${isCurrent ? "text-blue-700" : isDone ? "text-gray-900" : "text-gray-500"}`}>
                      {stage.label}
                    </p>
                    {isCurrent && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-blue-700" style={{ background: "#EFF6FF" }}>
                        Current
                      </span>
                    )}
                    {isDone && (
                      <span className="text-xs text-green-600 font-medium">✓ Done</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{stage.description}</p>
                  {isCurrent && project.created_date && i === 0 && (
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Started {new Date(project.created_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <p className="text-xs font-semibold text-blue-800 mb-1">What should I do at this stage?</p>
        <p className="text-xs text-blue-700">
          {activeIdx === 1 && "Use the Visual Permit Guide to identify all permits needed, then check Documents tab for your checklist."}
          {activeIdx === 2 && "Gather all documents in your checklist, then submit them to the Weston Building Department."}
          {activeIdx === 3 && "Wait for city review (typically 2–6 weeks). You can check status at westonfl.org/permits."}
          {activeIdx === 4 && "Work can begin! Schedule inspections at each milestone with your contractor."}
          {activeIdx >= 4 && project.status === "completed" && "Congratulations! Your project is complete. Keep all permit records for future reference."}
        </p>
      </div>
    </div>
  );
}