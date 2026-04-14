import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Map, DollarSign, BookOpen, Building } from "lucide-react";

const actions = [
  { label: "Permit Guide", icon: Map, page: "PermitGuide", emoji: "🏠", desc: "Tap a home area to find permits", color: "bg-blue-50 border-blue-100 text-blue-600" },
  { label: "Fee Calculator", icon: DollarSign, page: "FeeCalculator", emoji: "💵", desc: "Estimate permit costs", color: "bg-blue-50 border-blue-100 text-blue-600" },
  { label: "Permit Types", icon: BookOpen, page: "PermitInfo", emoji: "📘", desc: "What docs & steps are needed", color: "bg-blue-50 border-blue-100 text-blue-600" },
  { label: "Property Search", icon: Building, page: "PropertyGuide", emoji: "🏗️", desc: "Look up any Broward parcel", color: "bg-blue-50 border-blue-100 text-blue-600" },
];

export default function QuickActions() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {actions.map((action) => (
        <Link
          key={action.label}
          to={createPageUrl(action.page)}
          className={`group flex flex-col items-center text-center gap-2 p-4 bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all active:scale-95`}
        >
          <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center text-xl`}>
            {action.emoji}
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm leading-tight">{action.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{action.desc}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}