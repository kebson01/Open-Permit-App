import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, BookOpen, Shield, Hash } from "lucide-react";

const SUPABASE_URL = "https://gbknnjidqpmjrwlooluw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdia25uamlkcXBtanJ3bG9vbHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NTQzNDIsImV4cCI6MjA5MDIzMDM0Mn0.qwDACgXe3hesxBRQOzP53Hdc44z_UOka1_uYQScyi68";
const SB_HEADERS = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` };

// Map permit names to FBC categories to query
const PERMIT_TO_FBC_CATEGORIES = {
  "Roof / Re-Roof":        ["roofing", "hvhz"],
  "Solar Panels":          ["permit_required", "energy"],
  "Window Replacement":    ["windows_doors", "hvhz"],
  "Door Replacement":      ["windows_doors", "hvhz"],
  "Garage Door":           ["windows_doors", "hvhz"],
  "A/C Replacement":       ["permit_required"],
  "HVAC / Mechanical":     ["permit_required"],
  "Pool & Spa":            ["pool"],
  "Pool Equipment":        ["pool"],
  "Pool Deck":             ["pool"],
  "Electrical Service":    ["permit_required"],
  "EV Charging Station":   ["permit_required", "energy"],
  "Residential Addition":  ["permit_required", "hvhz"],
  "Residential Remodel":   ["permit_required"],
  "Fence / Gate":          ["permit_required"],
  "Patio / Slab":          ["permit_required"],
  "Covered Patio":         ["permit_required", "hvhz"],
  "Pergola":               ["permit_required", "hvhz"],
  "Plumbing":              ["permit_required"],
};

async function fetchFBCSections(permitName) {
  const categories = PERMIT_TO_FBC_CATEGORIES[permitName];
  if (!categories || categories.length === 0) {
    // Generic fetch for permit_required
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/florida_building_code?category=eq.permit_required&limit=3`,
      { headers: SB_HEADERS }
    );
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }

  // Fetch all relevant categories in parallel
  const results = await Promise.all(
    categories.map(cat =>
      fetch(`${SUPABASE_URL}/rest/v1/florida_building_code?category=eq.${cat}&limit=4`, { headers: SB_HEADERS })
        .then(r => r.json())
        .then(d => Array.isArray(d) ? d : [])
        .catch(() => [])
    )
  );

  // Deduplicate by id
  const seen = new Set();
  const combined = [];
  results.flat().forEach(s => {
    if (!seen.has(s.id)) {
      seen.add(s.id);
      combined.push(s);
    }
  });
  return combined;
}

function parseJsonField(val) {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try { return JSON.parse(val); } catch { return []; }
  }
  return [];
}

export default function FBCSection({ permitName }) {
  const [open, setOpen] = useState(false);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const handleToggle = () => {
    setOpen(prev => !prev);
    if (!loaded && !loading) {
      setLoading(true);
      fetchFBCSections(permitName).then(data => {
        setSections(data);
        setLoading(false);
        setLoaded(true);
      });
    }
  };

  if (!permitName) return null;

  return (
    <div className="rounded-xl border border-indigo-100 overflow-hidden">
      {/* Toggle header */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-indigo-50 hover:bg-indigo-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-600 flex-shrink-0" />
          <span className="text-sm font-semibold text-indigo-800">Florida Building Code Requirements</span>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-indigo-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-indigo-500" />
        )}
      </button>

      {open && (
        <div className="bg-white px-4 py-3 space-y-4">
          {loading && (
            <div className="flex items-center gap-2 py-2">
              <div className="w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
              <span className="text-xs text-gray-400">Loading FBC sections...</span>
            </div>
          )}

          {!loading && sections.length === 0 && loaded && (
            <p className="text-xs text-gray-400 italic py-2">No specific FBC sections found for this permit type.</p>
          )}

          {sections.map((section, i) => {
            const keyReqs = parseJsonField(section.key_requirements);
            const keyNums = parseJsonField(section.key_numbers);
            const isBrowardSpecific = section.broward_specific === true;

            return (
              <div key={section.id || i} className={`space-y-2 ${i > 0 ? "pt-3 border-t border-gray-100" : ""}`}>
                {/* Section header */}
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-indigo-800 uppercase tracking-wide">
                      FBC {section.edition || ""} · {section.volume || ""}
                    </p>
                    <p className="text-sm font-semibold text-gray-800 leading-snug">
                      §{section.section_number} — {section.section_title}
                    </p>
                    {section.applies_to && (
                      <p className="text-xs text-gray-400 mt-0.5">Applies to: {section.applies_to}</p>
                    )}
                  </div>
                </div>

                {/* Broward HVHZ callout */}
                {isBrowardSpecific && (
                  <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <Shield className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs font-semibold text-amber-800">Broward County Amendment / HVHZ Requirement</p>
                  </div>
                )}

                {/* Plain English */}
                {section.plain_english && (
                  <p className="text-xs text-gray-600 leading-relaxed">{section.plain_english}</p>
                )}

                {/* Key requirements */}
                {keyReqs.length > 0 && (
                  <ul className="space-y-1">
                    {keyReqs.map((req, j) => (
                      <li key={j} className="flex items-start gap-1.5 text-xs text-gray-700">
                        <span className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                        {req}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Key numbers */}
                {keyNums.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {keyNums.map((num, j) => (
                      <span
                        key={j}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 text-xs font-medium text-indigo-700"
                      >
                        <Hash className="w-2.5 h-2.5" />
                        {num}
                      </span>
                    ))}
                  </div>
                )}

                {/* Source link */}
                {section.source_url && (
                  <a
                    href={section.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 underline mt-1"
                  >
                    View in FBC →
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}