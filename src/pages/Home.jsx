import React from "react";
import HeroSection from "../components/home/HeroSection";
import CitySelector from "../components/home/CitySelector";
import QuickActions from "../components/home/QuickActions";
import FeaturesGrid from "../components/home/FeaturesGrid";
import PermitTypeCards from "../components/home/PermitTypeCards";
import StatsSection from "../components/home/StatsSection";

export default function Home() {
  return (
    <div>
      <HeroSection />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* City Selector */}
        <div className="-mt-12 relative z-10 mb-16">
          <CitySelector />
        </div>
        
        {/* Quick Actions */}
        <div className="mb-16">
          <QuickActions />
        </div>
        
        {/* Features */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">
              Why Use Our System?
            </h2>
            <p className="text-gray-500 mt-2 max-w-lg mx-auto">
              Everything you need to navigate the permitting process in one place.
            </p>
          </div>
          <FeaturesGrid />
        </div>
        
        {/* Common Permit Types */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Common Permit Types</h2>
          <PermitTypeCards />
        </div>
      </div>
      
      {/* Stats */}
      <StatsSection />
    </div>
  );
}