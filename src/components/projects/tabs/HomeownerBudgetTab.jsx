import { useState } from "react";
import * as db from "@/lib/db";
import { DollarSign, Calculator, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";


export default function HomeownerBudgetTab({ project, onUpdate }) {
  const [contractorQuote, setContractorQuote] = useState(project.contractor_quote || "");
  const [materialsEst, setMaterialsEst] = useState(project.materials_estimate || "");
  const [saving, setSaving] = useState(false);

  const permitFees = project.estimated_permit_fees || 0;
  const contractor = parseFloat(contractorQuote) || 0;
  const materials = parseFloat(materialsEst) || 0;
  const total = permitFees + contractor + materials;
  const budget = parseFloat(project.estimated_cost) || 0;
  const used = budget > 0 ? Math.min(Math.round((total / budget) * 100), 100) : 0;

  const save = async () => {
    setSaving(true);
    const payload = {};
    if (contractorQuote !== "") payload.contractor_quote = parseFloat(contractorQuote) || 0;
    if (materialsEst !== "") payload.materials_estimate = parseFloat(materialsEst) || 0;
    await db.Project.update(project.id, payload);
    onUpdate && onUpdate(prev => ({ ...prev, ...payload }));
    setSaving(false);
  };

  return (
    <div>
      <h3 className="font-bold text-gray-900 mb-1">Budget overview</h3>
      <p className="text-sm text-gray-500 mb-5">Track your estimated costs for this project.</p>

      {budget > 0 && (
        <div className="mb-5 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Budget used</span>
            <span className="text-sm font-bold text-gray-900">${total.toLocaleString()} / ${budget.toLocaleString()}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${used >= 100 ? "bg-red-500" : used >= 80 ? "bg-amber-500" : "bg-blue-500"}`}
              style={{ width: `${used}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">{used}% of budget allocated</p>
        </div>
      )}

      <div className="space-y-3 mb-5">
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100">
          <div>
            <p className="text-sm font-semibold text-blue-900">Permit Fees (estimated)</p>
            <p className="text-xs text-blue-600">Auto-calculated from fee schedule</p>
          </div>
          <p className="text-lg font-bold text-blue-700">
            {permitFees > 0 ? `$${permitFees.toLocaleString()}` : "—"}
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-gray-200">
          <label className="text-sm font-semibold text-gray-800 block mb-2">Contractor Quote</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="number"
              value={contractorQuote}
              onChange={e => setContractorQuote(e.target.value)}
              placeholder="0"
              className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-gray-200">
          <label className="text-sm font-semibold text-gray-800 block mb-2">Materials Estimate</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="number"
              value={materialsEst}
              onChange={e => setMaterialsEst(e.target.value)}
              placeholder="0"
              className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
        </div>

        {total > 0 && (
          <div className="flex items-center justify-between p-4 bg-gray-900 rounded-xl">
            <p className="text-sm font-bold text-white">Estimated Total</p>
            <p className="text-xl font-bold text-white">${total.toLocaleString()}</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
          style={{ background: "#3B82F6" }}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
        </button>
        <Link
          to={`/FeeCalculator?city=${encodeURIComponent(project.city_name || "")}&permit=${encodeURIComponent(project.project_type || "")}`}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors"
        >
          <Calculator className="w-4 h-4" /> Get fee estimate
        </Link>
      </div>
    </div>
  );
}