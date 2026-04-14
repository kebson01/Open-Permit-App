import React from "react";
import { MousePointerClick, DollarSign, MessageSquare } from "lucide-react";

const features = [
  { icon: MousePointerClick, title: "Visual Permit Guide", desc: "Identify the permit you need.", color: "bg-emerald-50 text-emerald-600" },
  { icon: DollarSign, title: "Transparent Fees", desc: "Estimate permit costs in advance.", color: "bg-amber-50 text-amber-600" },
  { icon: MessageSquare, title: "AI-Powered Guidance", desc: "Let it do the work for you.", color: "bg-purple-50 text-purple-600" },
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