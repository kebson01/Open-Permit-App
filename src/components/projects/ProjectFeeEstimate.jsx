import { useState } from "react";
import { base44 } from "@/api/base44Client";
import * as db from "@/lib/db";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, Calculator, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ProjectFeeEstimate({ project }) {
  const [cost, setCost] = useState(project.estimated_cost || "");
  const [sqft, setSqft] = useState(project.square_footage || "");
  const [result, setResult] = useState(null);
  const [calculating, setCalculating] = useState(false);

  const { data: feeRules = [] } = useQuery({
    queryKey: ["fee_rules", project.city_id],
    queryFn: () => db.FeeRule.filter({ city_id: project.city_id }),
    enabled: !!project.city_id,
  });

  const { data: surcharges = [] } = useQuery({
    queryKey: ["surcharges", project.city_id],
    queryFn: () => db.CitySurcharge.filter({ city_id: project.city_id }),
    enabled: !!project.city_id,
  });

  const calculate = async () => {
    if (!cost && !sqft) return;
    setCalculating(true);

    const constructionCost = parseFloat(cost) || 0;
    const squareFeet = parseFloat(sqft) || 0;

    // Use AI to estimate fees based on project type and available fee rules
    const rulesText = feeRules.slice(0, 20).map(r =>
      `${r.permit_name}: ${r.calc_type}, flat: $${r.flat_fee || 0}, base: $${r.base_fee || 0}, rate: ${r.rate_percentage || 0}%`
    ).join("\n");

    const surcharge = surcharges[0];
    const surchargeText = surcharge
      ? `Technology fee: $${surcharge.technology_admin || 0}/permit, Board of Rules: $${surcharge.board_of_rules_rate || 0}/$1000`
      : "No surcharges configured.";

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a permit fee estimator for ${project.city_name}, Florida.

Project: ${project.project_type?.replace(/_/g, " ")} - "${project.name}"
Construction cost: $${constructionCost.toLocaleString()}
Square footage: ${squareFeet || "not provided"}

Available fee rules for this city:
${rulesText || "No specific rules found — estimate based on typical Broward County fees."}

City surcharges: ${surchargeText}

Provide a fee estimate breakdown. Be realistic and note any assumptions.`,
      response_json_schema: {
        type: "object",
        properties: {
          total_estimated: { type: "number" },
          line_items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                label: { type: "string" },
                amount: { type: "number" },
                note: { type: "string" }
              }
            }
          },
          disclaimer: { type: "string" }
        }
      }
    });

    setResult(response);
    setCalculating(false);
  };

  return (
    <div>
      {/* Inputs */}
      <div className="grid sm:grid-cols-2 gap-4 mb-5">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Construction Cost ($)</label>
          <Input
            type="number"
            placeholder="e.g. 50000"
            value={cost}
            onChange={e => setCost(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Square Footage</label>
          <Input
            type="number"
            placeholder="e.g. 1200"
            value={sqft}
            onChange={e => setSqft(e.target.value)}
          />
        </div>
      </div>

      <Button onClick={calculate} disabled={calculating || (!cost && !sqft)} className="bg-blue-600 hover:bg-blue-700 gap-2 mb-5">
        {calculating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
        Estimate Permit Fees
      </Button>

      {/* Results */}
      {result && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4">
            <p className="text-white text-xs font-medium uppercase tracking-wide">Estimated Total</p>
            <p className="text-white text-3xl font-bold">${result.total_estimated?.toLocaleString()}</p>
          </div>
          <div className="p-4 space-y-2">
            {result.line_items?.map((item, i) => (
              <div key={i} className="flex items-start justify-between gap-3 py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{item.label}</p>
                  {item.note && <p className="text-xs text-gray-400 mt-0.5">{item.note}</p>}
                </div>
                <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                  ${item.amount?.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
          {result.disclaimer && (
            <div className="px-4 pb-4">
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">{result.disclaimer}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {feeRules.length === 0 && !result && (
        <div className="text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-xl p-3">
          No fee rules configured for {project.city_name} yet. The AI estimator will use typical Broward County fees as a baseline.
        </div>
      )}
    </div>
  );
}