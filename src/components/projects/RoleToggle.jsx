import { Home, HardHat } from "lucide-react";

export default function RoleToggle({ role, onChange }) {
  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
      <button
        onClick={() => onChange("homeowner")}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          role === "homeowner"
            ? "bg-white text-blue-700 shadow-sm border border-blue-100"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        <Home className="w-4 h-4" />
        Homeowner
      </button>
      <button
        onClick={() => onChange("contractor")}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          role === "contractor"
            ? "bg-white text-orange-700 shadow-sm border border-orange-100"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        <HardHat className="w-4 h-4" />
        Contractor
      </button>
    </div>
  );
}