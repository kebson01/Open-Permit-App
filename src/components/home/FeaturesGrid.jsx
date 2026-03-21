import React from "react";
import { Globe, MousePointerClick, DollarSign, MessageSquare } from "lucide-react";

const features = [
  { icon: Globe, title: "Multi-City Coverage", desc: "Unified experience across cities with city-specific requirements.", color: "bg-blue-50 text-blue-600" },
  { icon: MousePointerClick, title: "Visual Permit Guide", desc: "Click parts of a home to learn which permit you need.", color: "bg-emerald-50 text-emerald-600" },
  { icon: DollarSign, title: "Transparent Fees", desc: "Built-in fee calculator powered by current city schedules.", color: "bg-amber-50 text-amber-600" },
  { icon: MessageSquare, title: "Smart Assistant", desc: "Ask questions in plain English and get instant answers.", color: "bg-purple-50 text-purple-600" },
];

export default function FeaturesGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {features.map((f) => (
        <div key={f.title} className="flex items-start gap-4 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className={`w-10 h-10 rounded-xl ${f.color} flex items-center justify-center flex-shrink-0`}>
            <f.icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-sm">{f.title}</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{f.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}