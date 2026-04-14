import React from "react";
import { Home, HardHat } from "lucide-react";

export default function UserModeToggle({ mode, onChange }) {
  return (
    <div className="flex bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
      <button
        onClick={() => onChange("homeowner")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
          mode === "homeowner" ? "bg-emerald-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-800"
        }`}
      >
        <Home className="w-3.5 h-3.5" />
        Homeowner
      </button>
      <button
        onClick={() => onChange("contractor")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
          mode === "contractor" ? "bg-orange-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-800"
        }`}
      >
        <HardHat className="w-3.5 h-3.5" />
        Contractor
      </button>
    </div>
  );
}