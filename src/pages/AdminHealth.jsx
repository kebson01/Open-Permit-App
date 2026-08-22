import React, { useState, useEffect } from "react";
import { getCurrentUser } from "@/lib/auth";
import * as db from "@/lib/db";
import { CheckCircle2, XCircle, Loader2, RefreshCw, AlertTriangle } from "lucide-react";

const CITIES = ["Weston", "Hollywood", "Coral Springs", "Cooper City", "Fort Lauderdale"];

function StatusIcon({ count }) {
  if (count > 0) return <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />;
  return <XCircle className="w-4 h-4 text-red-500 shrink-0" />;
}

export default function AdminHealth() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    getCurrentUser().then(u => {
      setCurrentUser(u);
      if (u?.role === "admin") loadData();
      else setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [questions, feeRules, ...permitTypesArrays] = await Promise.all([
      db.CityApplicationQuestion.filter({}),
      db.FeeRule.list(),
      ...CITIES.map(city => db.PermitType.filter({ city_name: city })),
    ]);

    // Per-city breakdown
    const perCity = CITIES.map((city, i) => {
      const qs = Array.isArray(questions) ? questions.filter(q => q.city_name === city).length : 0;
      const fr = Array.isArray(feeRules) ? feeRules.filter(r => r.city_name === city).length : 0;
      const pt = Array.isArray(permitTypesArrays[i]) ? permitTypesArrays[i].length : 0;
      return { city, questions: qs, feeRules: fr, permitTypes: pt };
    });

    // Orphan checks — city_id not applicable for Supabase tables (use city_name)
    const orphanPermitTypes = 0;
    const orphanFeeRules = Array.isArray(feeRules) ? feeRules.filter(r => !r.city_name).length : 0;


    setData({ perCity, orphanPermitTypes, orphanFeeRules });
    setLoading(false);
  };

  if (!currentUser && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Not authenticated.</p>
      </div>
    );
  }

  if (currentUser && currentUser.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <p className="font-semibold text-gray-700">Admin access required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Data Health Status</h1>
            <p className="text-sm text-gray-500 mt-0.5">Quick diagnostic overview of app data completeness.</p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500 mr-2" />
            <span className="text-gray-500">Loading data...</span>
          </div>
        ) : data ? (
          <div className="space-y-6">

            {/* Per-city table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                <h2 className="font-bold text-gray-800 text-sm">Records Per City</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">City</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Questions</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fee Rules</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Permit Types</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.perCity.map((row, i) => (
                      <tr key={row.city} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                        <td className="px-5 py-3 font-semibold text-gray-800">{row.city}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <StatusIcon count={row.questions} />
                            <span className={row.questions > 0 ? "text-gray-800 font-medium" : "text-red-600 font-medium"}>{row.questions}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <StatusIcon count={row.feeRules} />
                            <span className={row.feeRules > 0 ? "text-gray-800 font-medium" : "text-red-600 font-medium"}>{row.feeRules}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <StatusIcon count={row.permitTypes} />
                            <span className={row.permitTypes > 0 ? "text-gray-800 font-medium" : "text-red-600 font-medium"}>{row.permitTypes}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Orphan records */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-2">
                  <StatusIcon count={data.orphanPermitTypes === 0 ? 1 : 0} />
                  <h3 className="font-bold text-gray-800 text-sm">PermitTypes without city_id</h3>
                </div>
                <p className={`text-3xl font-extrabold ${data.orphanPermitTypes > 0 ? "text-red-600" : "text-green-600"}`}>
                  {data.orphanPermitTypes}
                </p>
                <p className="text-xs text-gray-500 mt-1">{data.orphanPermitTypes === 0 ? "All permit types are city-assigned ✓" : "These should be assigned to a city"}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-2">
                  <StatusIcon count={data.orphanFeeRules === 0 ? 1 : 0} />
                  <h3 className="font-bold text-gray-800 text-sm">FeeRules without city_id</h3>
                </div>
                <p className={`text-3xl font-extrabold ${data.orphanFeeRules > 0 ? "text-red-600" : "text-green-600"}`}>
                  {data.orphanFeeRules}
                </p>
                <p className="text-xs text-gray-500 mt-1">{data.orphanFeeRules === 0 ? "All fee rules are city-assigned ✓" : "These should be assigned to a city"}</p>
              </div>
            </div>

          </div>
        ) : null}
      </div>
    </div>
  );
}