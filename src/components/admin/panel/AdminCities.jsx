import { useState, useEffect } from "react";
import { Pencil, ExternalLink, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SB_URL = "https://gbknnjidqpmjrwlooluw.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdia25uamlkcXBtanJ3bG9vbHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NTQzNDIsImV4cCI6MjA5MDIzMDM0Mn0.qwDACgXe3hesxBRQOzP53Hdc44z_UOka1_uYQScyi68";
const SB_HEADERS = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" };

const FEE_STATUS_STYLES = {
  Verified:   { bg: "bg-green-100",  text: "text-green-700" },
  Stale:      { bg: "bg-yellow-100", text: "text-yellow-700" },
  Pending:    { bg: "bg-red-100",    text: "text-red-700" },
  "County BD":{ bg: "bg-slate-100",  text: "text-slate-600" },
};

const SERVICES = ["permit_types", "fee_calculator", "property_search"];

function StatusBadge({ status }) {
  const style = FEE_STATUS_STYLES[status] || FEE_STATUS_STYLES["County BD"];
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>{status || "County BD"}</span>;
}

function EditModal({ city, feeRuleCount, onClose, onSaved }) {
  const [form, setForm] = useState({
    building_department_phone: city.building_department_phone || "",
    building_department_address: city.building_department_address || "",
    portal_url: city.portal_url || "",
    fee_source: city.fee_source || "",
    enabled_services: city.enabled_services || [],
  });
  const [saving, setSaving] = useState(false);

  const toggleService = (svc) => {
    const current = form.enabled_services;
    setForm(f => ({ ...f, enabled_services: current.includes(svc) ? current.filter(s => s !== svc) : [...current, svc] }));
  };

  const handleSave = async () => {
    setSaving(true);
    await fetch(`${SB_URL}/rest/v1/cities?id=eq.${city.id}`, {
      method: "PATCH",
      headers: { ...SB_HEADERS, Prefer: "return=minimal" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-slate-800">{city.name}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Building Dept Phone</label>
            <Input value={form.building_department_phone} onChange={e => setForm(f => ({ ...f, building_department_phone: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Building Dept Address</label>
            <Input value={form.building_department_address} onChange={e => setForm(f => ({ ...f, building_department_address: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Portal URL</label>
            <Input value={form.portal_url} onChange={e => setForm(f => ({ ...f, portal_url: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Fee Source</label>
            <Input value={form.fee_source} onChange={e => setForm(f => ({ ...f, fee_source: e.target.value }))} placeholder="e.g. FY2025 Fee Schedule PDF" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-2">Enabled Services</label>
            <div className="space-y-2">
              {SERVICES.map(svc => (
                <label key={svc} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(form.enabled_services || []).includes(svc)}
                    onChange={() => toggleService(svc)}
                    className="rounded"
                  />
                  <span className="text-sm text-slate-700">{svc.replace(/_/g, " ")}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminCities() {
  const [cities, setCities] = useState([]);
  const [feeRuleCounts, setFeeRuleCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    const [citiesRes, feesRes] = await Promise.all([
      fetch(`${SB_URL}/rest/v1/cities?select=id,name,slug,building_department_phone,portal_url,fee_source,building_department_address,enabled_services,fee_status&order=name.asc`, { headers: SB_HEADERS }),
      fetch(`${SB_URL}/rest/v1/fee_rules?select=city_name`, { headers: SB_HEADERS }),
    ]);
    const citiesData = await citiesRes.json();
    const feesData = await feesRes.json();

    const counts = {};
    if (Array.isArray(feesData)) {
      feesData.forEach(r => { counts[r.city_name] = (counts[r.city_name] || 0) + 1; });
    }
    setCities(Array.isArray(citiesData) ? citiesData : []);
    setFeeRuleCounts(counts);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="flex items-center gap-2 text-slate-500 py-12 justify-center"><Loader2 className="w-5 h-5 animate-spin" /> Loading cities...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Cities</h2>
          <p className="text-sm text-slate-500 mt-0.5">{cities.length} cities in Broward County</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["City", "Phone", "Portal", "Fee Status", "Fee Rules", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cities.map(city => (
                <tr key={city.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{city.name}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{city.building_department_phone || "—"}</td>
                  <td className="px-4 py-3">
                    {city.portal_url ? (
                      <a href={city.portal_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline text-xs">
                        <ExternalLink className="w-3 h-3" /> Portal
                      </a>
                    ) : <span className="text-slate-300 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={city.fee_status} /></td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${feeRuleCounts[city.name] > 0 ? "text-green-600" : "text-red-400"}`}>
                      {feeRuleCounts[city.name] || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="outline" onClick={() => setEditing(city)} className="h-7 text-xs">
                      <Pencil className="w-3 h-3 mr-1" /> Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <EditModal
          city={editing}
          feeRuleCount={feeRuleCounts[editing.name] || 0}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}