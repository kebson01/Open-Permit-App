import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as db from "@/lib/db";
import { CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

function Result({ label, status, detail }) {
  const icon = status === "pass"
    ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
    : status === "fail"
    ? <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
    : <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />;

  const bg = status === "pass" ? "bg-green-50 border-green-200" : status === "fail" ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200";

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${bg}`}>
      {icon}
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {detail && <p className="text-xs text-gray-500 mt-0.5">{detail}</p>}
      </div>
    </div>
  );
}

export default function FeasibilityChecker({ property: p, city }) {
  const [proposedSqFt, setProposedSqFt] = useState("");
  const [projectType, setProjectType] = useState("addition");
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState([]);

  const { data: zoningRules = [] } = useQuery({
    queryKey: ["zoningRules", city.id],
    queryFn: () => db.ZoningRule.filter({ city_name: city.name }),
  });

  // Find matching zoning rule by use code
  const zoningRule = zoningRules.find(z => {
    if (!z.use_codes) return false;
    return z.use_codes.split(",").map(c => c.trim()).includes(p.USE_CODE);
  }) || zoningRules[0] || null;

  const runChecks = () => {
    const checks = [];
    const lotSqFt = p.GIS_SQUARE_FOOT || p.LAND_CALC_FACT_1 || 0;
    const existingSqFt = p.BLDG_UNDER_AIR_SQ_FOOTAGE || 0;
    const proposed = parseFloat(proposedSqFt) || 0;
    const totalSqFt = existingSqFt + proposed;

    if (!zoningRule) {
      checks.push({ label: "Zoning Rule", status: "unknown", detail: "No zoning data configured for this city/use code yet." });
    } else {
      // Lot coverage check
      if (zoningRule.max_lot_coverage_pct && lotSqFt > 0) {
        const bldgTotalSqFt = p.BLDG_TOT_SQ_FOOTAGE || totalSqFt;
        const coveragePct = (bldgTotalSqFt / lotSqFt) * 100;
        const pass = coveragePct <= zoningRule.max_lot_coverage_pct;
        checks.push({
          label: "Lot Coverage",
          status: pass ? "pass" : "fail",
          detail: `${coveragePct.toFixed(1)}% of lot used — max allowed is ${zoningRule.max_lot_coverage_pct}%`
        });
      }

      // FAR check
      if (zoningRule.max_floor_area_ratio && lotSqFt > 0) {
        const far = totalSqFt / lotSqFt;
        const pass = far <= zoningRule.max_floor_area_ratio;
        checks.push({
          label: "Floor Area Ratio (FAR)",
          status: pass ? "pass" : "fail",
          detail: `Current FAR: ${far.toFixed(3)} — max allowed: ${zoningRule.max_floor_area_ratio}`
        });
      }

      // Setbacks info
      if (zoningRule.front_setback_ft || zoningRule.rear_setback_ft || zoningRule.side_setback_ft) {
        checks.push({
          label: "Setback Requirements",
          status: "unknown",
          detail: `Front: ${zoningRule.front_setback_ft || "?"}ft · Rear: ${zoningRule.rear_setback_ft || "?"}ft · Side: ${zoningRule.side_setback_ft || "?"}ft — verify on site plan`
        });
      }

      // Height limit
      if (zoningRule.max_height_ft) {
        checks.push({
          label: "Height Limit",
          status: "unknown",
          detail: `Max allowed height: ${zoningRule.max_height_ft} ft — verify with structural drawings`
        });
      }

      // Min lot size
      if (zoningRule.min_lot_size_sqft && lotSqFt > 0) {
        const pass = lotSqFt >= zoningRule.min_lot_size_sqft;
        checks.push({
          label: "Minimum Lot Size",
          status: pass ? "pass" : "fail",
          detail: `Lot is ${lotSqFt.toLocaleString()} sqft — minimum required: ${zoningRule.min_lot_size_sqft.toLocaleString()} sqft`
        });
      }
    }

    // Homestead flag info
    checks.push({
      label: "Homestead Exemption",
      status: "unknown",
      detail: p.HOMESTEAD_FLAG === "Y"
        ? "Property has homestead exemption — may affect certain renovation rules"
        : "No homestead exemption on record"
    });

    setResults(checks);
    setChecked(true);
  };

  const passCount = results.filter(r => r.status === "pass").length;
  const failCount = results.filter(r => r.status === "fail").length;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-gray-800 mb-1">Project Feasibility Check</h3>
        <p className="text-sm text-gray-500">
          Enter your proposed addition to check against {city.name} zoning rules.
        </p>
      </div>

      {zoningRule && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm">
          <span className="font-medium text-blue-800">Zone: {zoningRule.zone_code}</span>
          {zoningRule.zone_name && <span className="text-blue-600"> — {zoningRule.zone_name}</span>}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Project Type</label>
          <select
            value={projectType}
            onChange={e => setProjectType(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="addition">Addition</option>
            <option value="new_construction">New Construction</option>
            <option value="renovation">Interior Renovation</option>
            <option value="accessory">Accessory Structure</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Proposed Sq Ft</label>
          <input
            type="number"
            placeholder="e.g. 500"
            value={proposedSqFt}
            onChange={e => setProposedSqFt(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 bg-gray-50 rounded-xl p-3 text-center text-xs">
        <div><p className="text-gray-400">Lot Size</p><p className="font-semibold text-gray-700">{(p.GIS_SQUARE_FOOT || p.LAND_CALC_FACT_1 || 0).toLocaleString()} sqft</p></div>
        <div><p className="text-gray-400">Existing Under Air</p><p className="font-semibold text-gray-700">{(p.BLDG_UNDER_AIR_SQ_FOOTAGE || 0).toLocaleString()} sqft</p></div>
        <div><p className="text-gray-400">Year Built</p><p className="font-semibold text-gray-700">{p.BLDG_YEAR_BUILT || p.ACTUAL_YEAR_BUILT || "—"}</p></div>
      </div>

      <Button onClick={runChecks} className="w-full gradient-primary text-white">
        Run Feasibility Check
      </Button>

      {checked && (
        <div className="space-y-2">
          {failCount === 0 && results.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center text-green-700 font-medium text-sm">
              ✅ No immediate zoning conflicts detected — consult your architect for full compliance review
            </div>
          )}
          {failCount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center text-red-700 font-medium text-sm">
              ⚠️ {failCount} potential zoning issue{failCount > 1 ? "s" : ""} found — review with city building department
            </div>
          )}
          <div className="space-y-2 mt-2">
            {results.map((r, i) => <Result key={i} {...r} />)}
          </div>
          <p className="text-xs text-gray-400 text-center pt-1">
            * This is a preliminary check only. Always confirm with the {city.name} Building Department.
          </p>
        </div>
      )}
    </div>
  );
}