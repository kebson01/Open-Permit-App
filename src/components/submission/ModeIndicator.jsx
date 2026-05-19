import React from "react";
import { UserCheck, Globe } from "lucide-react";

export default function ModeIndicator({ mode, onSwitch }) {
  const isApp = mode === "app";
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
      isApp
        ? "bg-green-50 border-green-200 text-green-700"
        : "bg-orange-50 border-orange-200 text-orange-700"
    }`}>
      {isApp
        ? <><UserCheck className="w-3.5 h-3.5" /> App Mode — profile data prefilled</>
        : <><Globe className="w-3.5 h-3.5" /> Guest Mode — no login required</>
      }
      {onSwitch && (
        <button
          onClick={onSwitch}
          className="ml-2 underline opacity-70 hover:opacity-100 text-xs"
        >
          Switch
        </button>
      )}
    </div>
  );
}