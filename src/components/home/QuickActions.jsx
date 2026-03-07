import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Map, DollarSign, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

const actions = [
  { label: "Explore Interactive Map", icon: Map, page: "InteractiveMap", emoji: "🗺️" },
  { label: "Calculate Fees", icon: DollarSign, page: "FeeCalculator", emoji: "💵" },
  { label: "General Permit Info", icon: BookOpen, page: "PermitInfo", emoji: "📘" },
];

export default function QuickActions() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {actions.map((action, i) => (
        <motion.div
          key={action.label}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
        >
          <Link
            to={createPageUrl(action.page)}
            className="group flex items-center gap-3 px-5 py-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all"
          >
            <span className="text-2xl">{action.emoji}</span>
            <span className="font-semibold text-gray-700 group-hover:text-[#2c5282] transition-colors text-sm">
              {action.label}
            </span>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}