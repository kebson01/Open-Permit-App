import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, XCircle, MinusCircle } from "lucide-react";

const SB_URL = "https://gbknnjidqpmjrwlooluw.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdia25uamlkcXBtanJ3bG9vbHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NTQzNDIsImV4cCI6MjA5MDIzMDM0Mn0.qwDACgXe3hesxBRQOzP53Hdc44z_UOka1_uYQScyi68";
const SB_HEADERS = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };

function CountBadge({ count, required = false }) {
  if (count > 0) return (
    <span className="flex items-center gap-1 text-green-700 font-semibold text-sm">
      <CheckCircle2 className="w-3.5 h-3.5" /> {count}
    </span>
  );
  if (required) return (
    <span className="flex items-center gap-1 text-red-500 font-semibold text-sm">
      <XCircle className="w-3.5 h-3.5" /> 0
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-slate-400 text-sm">
      <MinusCircle className="w-3.5 h-3.5" /> 0
    </span>
  );
}

export default function AdminDataStatus() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [citiesRes, feesRes, zoningRes, ordinancesRes] = await Promise.all([
        fetch(`${SB_URL}/rest/v1/cities?select=name,fee_source,building_department_phone&order=name.asc`, { headers: SB_HEADERS }),
        fetch(`${SB_URL}/rest/v1/fee_rules?select=city_name`, { headers: SB_HEADERS }),
        fetch(`${SB_URL}/rest/v1/zoning_rules?select=city_name`, { headers: SB_HEADERS }),
        fetch(`${SB_URL}/rest/v1/city_ordinance_sections?select=city_name`, { headers: SB_HEADERS }),
      ]);

      const [cities, fees, zoning, ordinances] = await Promise.all([
        citiesRes.json(), feesRes.json(), zoningRes.json(), ordinancesRes.json(),
      ]);

      const count = (arr, name) => Array.isArray(arr) ? arr.filter(r => r.city_name === name).length : 0;

      const rows = Array.isArray(cities) ? cities.map(city => ({
        name: city.name,
        fee_source: city.fee_source,
        feeCount: count(fees, city.name),
        zoningCount: count(zoning, city.name),
        ordinanceCount: count(ordinances, city.name),
      })) : [];

      setData(rows);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex items-center gap-2 text-slate-500 py-12 justify-center"><Loader2 className="w-5 h-5 animate-spin" /> Loading data status...</div>;

  const totalFees = data.reduce((s, r) => s + (r.feeCount > 0 ? 1 : 0), 0);
  const totalZoning = data.reduce((s, r) => s + (r.zoningCount > 0 ? 1 : 0), 0);
  const totalOrdinances = data.reduce((s, r) => s + (r.ordinanceCount > 0 ? 1 : 0), 0);

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-bold text-slate-800">Data Status</h2>
        <p className="text-sm text-slate-500 mt-0.5">Coverage across all {data.length} cities</p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Cities with Fee Rules", count: totalFees, total: data.length, color: "blue" },
          { label: "Cities with Zoning", count: totalZoning, total: data.length, color: "purple" },
          { label: "Cities with Ordinances", count: totalOrdinances, total: data.length, color: "green" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-2xl font-extrabold text-slate-800">{s.count}<span className="text-slate-300 text-lg font-normal">/{s.total}</span></p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(s.count / s.total) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* City grid */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["City", "Fee Rules", "Zoning Rules", "Ordinances", "Fee Source"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map(row => (
                <tr key={row.name} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{row.name}</td>
                  <td className="px-4 py-3"><CountBadge count={row.feeCount} required /></td>
                  <td className="px-4 py-3"><CountBadge count={row.zoningCount} /></td>
                  <td className="px-4 py-3"><CountBadge count={row.ordinanceCount} /></td>
                  <td className="px-4 py-3 text-xs text-slate-400 max-w-[200px]">
                    <span className="block truncate">{row.fee_source || "—"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}