import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const CITIES = ["Weston", "Coral Springs", "Fort Lauderdale", "Hollywood", "Cooper City"];

export default function CitySelector() {
  const [city, setCity] = useState("");
  const navigate = useNavigate();

  const handleApply = () => {
    if (city) {
      sessionStorage.setItem("selectedCity", city);
      navigate(createPageUrl("PermitGuide") + `?city=${encodeURIComponent(city)}`);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="gradient-primary px-5 py-3.5 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-yellow-300" />
          <h3 className="text-white font-bold text-base">Select Your City</h3>
        </div>

        <div className="p-5 space-y-3">
          <div className="flex gap-3">
            <div className="flex-1 px-3 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-500 border border-gray-100">🌴 Florida</div>
            <div className="flex-1 px-3 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-500 border border-gray-100">🏢 Broward</div>
          </div>

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

          <Button
            onClick={handleApply}
            disabled={!city}
            className="w-full gradient-primary text-white rounded-xl h-11 font-semibold"
          >
            Explore Permits →
          </Button>
        </div>
      </div>
    </div>
  );
}