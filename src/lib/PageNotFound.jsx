import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Building2, ArrowLeft } from "lucide-react";

export default function PageNotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6">
          <Building2 className="w-8 h-8 text-[#ffcc00]" />
        </div>
        <h1 className="text-5xl font-extrabold text-gray-800 mb-3">404</h1>
        <p className="text-gray-500 mb-6">The page you're looking for doesn't exist.</p>
        <Link
          to={createPageUrl("Home")}
          className="inline-flex items-center gap-2 px-6 py-3 gradient-primary text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}