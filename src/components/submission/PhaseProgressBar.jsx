import React from "react";
import { Check } from "lucide-react";

const PHASES = [
  { key: "application",        label: "Application",        num: 1 },
  { key: "preparation",        label: "Preparation",        num: 2 },
  { key: "guided_submission",  label: "Guided Submission",  num: 3 },
  { key: "completed",          label: "Submitted",          num: 4 },
];

function phaseIndex(key) {
  return PHASES.findIndex(p => p.key === key);
}

export default function PhaseProgressBar({ phase }) {
  const current = phaseIndex(phase);

  return (
    <div className="flex items-center gap-0">
      {PHASES.map((p, i) => {
        const isDone = current > i;
        const isActive = current === i;
        return (
          <React.Fragment key={p.key}>
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                isDone
                  ? "bg-green-500 border-green-500 text-white"
                  : isActive
                  ? "bg-white border-white text-blue-800"
                  : "bg-transparent border-white/30 text-white/40"
              }`}>
                {isDone ? <Check className="w-3.5 h-3.5" /> : p.num}
              </div>
              <span className={`text-xs mt-1 font-medium whitespace-nowrap ${
                isActive ? "text-white" : isDone ? "text-green-300" : "text-white/40"
              }`}>
                {p.label}
              </span>
            </div>
            {i < PHASES.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-5 transition-all ${
                current > i ? "bg-green-400" : "bg-white/20"
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}