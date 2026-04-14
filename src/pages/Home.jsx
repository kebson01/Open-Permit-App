import React from "react";
import HeroSection from "../components/home/HeroSection";
import CitySelector from "../components/home/CitySelector";
import QuickActions from "../components/home/QuickActions";
import FeaturesGrid from "../components/home/FeaturesGrid";
import PermitTypeCards from "../components/home/PermitTypeCards";
import StatsSection from "../components/home/StatsSection";

export default function Home() {
  return (
    <div className="pb-16 md:pb-0">
      <HeroSection />

      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* City Selector */}
        <div id="city-selector" className="-mt-8 relative z-10 mb-10">
          <CitySelector />
        </div>

        {/* Quick Actions */}
        <div className="mb-10">
          <h2 className="text-base font-bold text-gray-500 uppercase tracking-wider mb-4">Quick Access</h2>
          <QuickActions />
        </div>

        {/* Features */}
        <div className="mb-10">
          <h2 className="text-base font-bold text-gray-500 uppercase tracking-wider mb-4">What You Can Do Here</h2>
          <FeaturesGrid />
        </div>


      </div>

      {/* Stats */}
      <StatsSection />
    </div>
  );
}