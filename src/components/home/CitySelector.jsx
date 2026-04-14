import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MapPin, Map, Calculator } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const CITIES = [
  { name: "Weston", available: true },
  { name: "Coral Springs", available: false },
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
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3.5 flex items-center gap-2" style={{ background: "linear-gradient(135deg, #0D2B5E 0%, #0F3575 100%)" }}>
          <MapPin className="w-4 h-4" style={{ color: "#FDE68A" }} />
          <div>
            <h3 style={{ color: "#FFFFFF", fontWeight: 700, fontSize: "16px", lineHeight: "1.3", margin: 0 }}>Start Here — Choose Your City</h3>
            <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "12px", marginTop: "2px", margin: "2px 0 0 0" }}>We'll show you city-specific permit info</p>
          </div>
        </div>

        <div className="p-5 space-y-3">
          <div className="flex gap-3">
            <div className="flex-1 px-3 py-2.5 rounded-xl text-sm font-medium border text-center" style={{ background: "#EFF6FF", borderColor: "#BFDBFE", color: "#1E3A6E" }}>🌴 Florida</div>
            <div className="flex-1 px-3 py-2.5 rounded-xl text-sm font-medium border text-center" style={{ background: "#EFF6FF", borderColor: "#BFDBFE", color: "#1E3A6E" }}>🏢 Broward County</div>
          </div>

          <Select value={city} onValueChange={(val) => { if (CITIES.find(c => c.name === val)?.available) setCity(val); }}>
            <SelectTrigger className="rounded-xl h-11" style={{ color: "#0F172A" }}>
              <SelectValue placeholder="Select your city..." />
            </SelectTrigger>
            <SelectContent>
              {CITIES.map(c => (
                <SelectItem
                  key={c.name}
                  value={c.name}
                  disabled={!c.available}
                  className={!c.available ? "opacity-50 cursor-not-allowed" : ""}
                >
                  <span className="flex items-center gap-2">
                    {c.name}
                    {!c.available && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full">Coming Soon</span>
                    )}
                  </span>
                </SelectItem>
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
              className="rounded-xl h-11 font-semibold text-sm gap-2"
              style={{ background: "#FFFFFF", border: "1.5px solid #CBD5E1", color: "#0F172A" }}
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