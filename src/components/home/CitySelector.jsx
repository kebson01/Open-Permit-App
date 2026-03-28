import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MapPin, Map, Calculator } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const CITIES = ["Weston", "Coral Springs", "Fort Lauderdale", "Hollywood", "Cooper City"];

export default function CitySelector() {
  const [city, setCity] = useState("");
  const navigate = useNavigate();

  const goTo = (page) => {
    if (!city) return;
    sessionStorage.setItem("selectedCity", city);
    navigate(createPageUrl(page) + `?city=${encodeURIComponent(city)}`);
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="gradient-primary px-5 py-3.5 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-yellow-300" />
          <div>
            <h3 className="text-white font-bold text-base leading-tight">Start Here — Choose Your City</h3>
            <p className="text-blue-200 text-xs mt-0.5">We'll show you city-specific permit info</p>
          </div>
        </div>

        <div className="p-5 space-y-3">
          <div className="flex gap-3">
            <div className="flex-1 px-3 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-500 border border-gray-100 text-center">🌴 Florida</div>
            <div className="flex-1 px-3 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-500 border border-gray-100 text-center">🏢 Broward County</div>
          </div>

          <Select value={city} onValueChange={setCity}>
            <SelectTrigger className="rounded-xl h-11">
              <SelectValue placeholder="Select your city..." />
            </SelectTrigger>
            <SelectContent>
              {CITIES.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button
              onClick={() => goTo("PermitGuide")}
              disabled={!city}
              className="gradient-primary text-white rounded-xl h-11 font-semibold text-sm gap-2"
            >
              <Map className="w-4 h-4" />
              Permit Guide
            </Button>
            <Button
              onClick={() => goTo("FeeCalculator")}
              disabled={!city}
              variant="outline"
              className="rounded-xl h-11 font-semibold text-sm gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <Calculator className="w-4 h-4" />
              Fee Calculator
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}