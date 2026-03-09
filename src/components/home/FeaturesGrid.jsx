import React from "react";
import { Globe, MousePointerClick, DollarSign, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Globe,
    title: "Multi-City Coverage",
    desc: "Unified experience across cities with city-specific requirements and fee schedules.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: MousePointerClick,
    title: "Visual Permit Guide",
    desc: "Click on parts of a home to learn which permit you need — visual and intuitive.",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: DollarSign,
    title: "Transparent Fees",
    desc: "Built-in fee calculator powered by current city schedules. No surprises.",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: MessageSquare,
    title: "Smart Chat Assistant",
    desc: "Ask questions in plain English and get city-specific answers instantly.",
    color: "bg-purple-50 text-purple-600",
  },
];

export default function FeaturesGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {features.map((f, i) => (
        <motion.div
          key={f.title}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all"
        >
          <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
            <f.icon className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-gray-800 mb-2">{f.title}</h3>
          <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
        </motion.div>
      ))}
    </div>
  );
}