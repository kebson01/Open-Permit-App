import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MapPin, Map, Calculator } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const CITIES = [
  { name: "Weston", available: true },
  { name: "Coral Springs", available: true },
  { name: "Fort Lauderdale", available: false },
  { name: "Hollywood", available: false },
  { name: "Cooper City", available: false },
];

export default function CitySelector() {
  const [city, setCity] = useState("");
  const navigate = useNavigate();

  const goTo = (page) => {
    if (!city) return;
    sessionStorage.setItem("selectedCity", city);
    navigate(createPageUrl(page) + `?city=${encodeURIComponent(city)}`);
  };

  return (
    <div style={{ width: "100%", maxWidth: 460 }}>
      <div className="bg-white shadow-xl" style={{ borderRadius: 14, border: "1px solid #E2E8F0", overflow: "hidden" }}>
        <div className="px-5 py-4">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: "#1E4D99" }} />
            <span className="font-semibold" style={{ color: "#0F172A", fontSize: 14 }}>Start here — choose your city</span>
          </div>
          <p className="mb-4" style={{ color: "#475569", fontSize: 12 }}>We'll show you city-specific permit requirements and fees</p>

          {/* Badges */}
          <div className="flex gap-2 mb-3">
            <span className="px-3 py-1.5 rounded-lg text-xs font-medium border" style={{ background: "#EFF6FF", borderColor: "#BFDBFE", color: "#1E4D99" }}>🌴 Florida</span>
            <span className="px-3 py-1.5 rounded-lg text-xs font-medium border" style={{ background: "#EFF6FF", borderColor: "#BFDBFE", color: "#1E4D99" }}>🏢 Broward County</span>
          </div>

          {/* City dropdown */}
          <Select value={city} onValueChange={(val) => { if (CITIES.find(c => c.name === val)?.available) setCity(val); }}>
            <SelectTrigger className="rounded-xl h-11 mb-3" style={{ color: "#0F172A" }}>
              <SelectValue placeholder="Select your city..." />
            </SelectTrigger>
            <SelectContent>
              {CITIES.map(c => (
                <SelectItem key={c.name} value={c.name} disabled={!c.available} className={!c.available ? "opacity-50 cursor-not-allowed" : ""}>
                  <span className="flex items-center gap-2">
                    {c.name}
                    {!c.available && <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full">Coming Soon</span>}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => goTo("PermitGuide")}
              disabled={!city}
              className="text-white rounded-xl h-10 font-semibold text-sm"
              style={{ backgroundColor: "#0D2B5E" }}
            >
              Permit Guide
            </Button>
            <Button
              onClick={() => goTo("FeeCalculator")}
              disabled={!city}
              variant="outline"
              className="rounded-xl h-10 font-semibold text-sm"
              style={{ backgroundColor: "#FFFFFF", border: "1.5px solid #CBD5E1", color: "#0F172A" }}
            >
              Fee Calculator
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}