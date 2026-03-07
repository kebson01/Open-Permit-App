import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MapPin, ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const CITIES = ["Weston", "Coral Springs", "Fort Lauderdale", "Hollywood", "Cooper City"];

export default function CitySelector() {
  const [city, setCity] = useState("");
  const navigate = useNavigate();

  const handleApply = () => {
    if (city) {
      sessionStorage.setItem("selectedCity", city);
      navigate(createPageUrl("InteractiveMap") + `?city=${encodeURIComponent(city)}`);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="gradient-primary px-6 py-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#ffcc00]" />
            <h3 className="text-white font-bold text-lg">Select Your City</h3>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">State</label>
              <div className="px-4 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-600 border border-gray-100">Florida</div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">County</label>
              <div className="px-4 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-600 border border-gray-100">Broward County</div>
            </div>
          </div>
          
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">City</label>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="rounded-xl h-11">
                <SelectValue placeholder="Choose a city..." />
              </SelectTrigger>
              <SelectContent>
                {CITIES.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button
            onClick={handleApply}
            disabled={!city}
            className="w-full gradient-primary hover:opacity-90 text-white rounded-xl h-11 font-semibold"
          >
            Apply & Explore
          </Button>
          
          <p className="text-center text-xs text-gray-400">Supporting multiple cities across South Florida</p>
        </div>
      </div>
    </div>
  );
}