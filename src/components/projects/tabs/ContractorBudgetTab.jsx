import { useState } from "react";
import * as db from "@/lib/db";
import { Plus, Trash2, DollarSign, Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const CATEGORIES = ["permit_fee", "labor", "materials", "inspection", "design", "contractor", "other"];
const CATEGORY_LABELS = {
  permit_fee: "Permit Fees", labor: "Labor", materials: "Materials",
  inspection: "Inspection", design: "Design/Architecture",
  contractor: "Contractor", other: "Other",
};

export default function ContractorBudgetTab({ project }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ description: "", category: "labor", estimated_amount: "", actual_amount: "", status: "pending", vendor_name: "" });
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: items = [] } = useQuery({
    queryKey: ["budget", project.id],
    queryFn: () => db.ProjectBudgetItem.filter({ project_id: project.id }),
  });

  const totalEst = items.reduce((s, i) => s + (parseFloat(i.estimated_amount) || 0), 0);
  const totalAct = items.reduce((s, i) => s + (parseFloat(i.actual_amount) || 0), 0);
  const budget = parseFloat(project.estimated_cost) || 0;
  const margin = budget > 0 ? ((budget - totalAct) / budget * 100).toFixed(1) : null;

  const addItem = async (e) => {
    e.preventDefault();
    setSaving(true);
    await db.ProjectBudgetItem.create({
      ...form,
      project_id: project.id,
      estimated_amount: parseFloat(form.estimated_amount) || 0,
      actual_amount: form.actual_amount ? parseFloat(form.actual_amount) : null,
    });
    queryClient.invalidateQueries({ queryKey: ["budget", project.id] });
    setForm({ description: "", category: "labor", estimated_amount: "", actual_amount: "", status: "pending", vendor_name: "" });
    setShowAdd(false);
    setSaving(false);
  };

  const deleteItem = async (id) => {
    await db.ProjectBudgetItem.delete(id);
    queryClient.invalidateQueries({ queryKey: ["budget", project.id] });
  };

  const markPaid = async (item) => {
    await db.ProjectBudgetItem.update(item.id, { status: "paid" });
    queryClient.invalidateQueries({ queryKey: ["budget", project.id] });
  };

  const STATUS_STYLES = { pending: "bg-gray-100 text-gray-600", approved: "bg-blue-100 text-blue-700", paid: "bg-green-100 text-green-700", disputed: "bg-red-100 text-red-700" };

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-xs text-gray-400 mb-1">Estimated</p>
          <p className="text-lg font-bold text-gray-900">${totalEst.toLocaleString()}</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-xs text-gray-400 mb-1">Actual</p>
          <p className="text-lg font-bold text-gray-900">${totalAct.toLocaleString()}</p>
        </div>
        <div className={`text-center p-3 rounded-xl border ${margin !== null ? (parseFloat(margin) >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200") : "bg-gray-50 border-gray-200"}`}>
          <p className="text-xs text-gray-400 mb-1">Margin</p>
          <p className={`text-lg font-bold ${margin !== null ? (parseFloat(margin) >= 0 ? "text-green-700" : "text-red-700") : "text-gray-500"}`}>
            {margin !== null ? `${margin}%` : "—"}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-900 text-sm">Line items</h3>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1 text-xs font-semibold text-white px-3 py-1.5 rounded-xl"
          style={{ background: "#3B82F6" }}
        >
          <Plus className="w-3.5 h-3.5" /> Add item
        </button>
      </div>

      {showAdd && (
        <form onSubmit={addItem} className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input required placeholder="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className="col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-400" />
            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-400">
              {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
            </select>
            <input placeholder="Vendor" value={form.vendor_name} onChange={e => setForm(p => ({ ...p, vendor_name: e.target.value }))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-400" />
            <div className="relative">
              <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input required type="number" placeholder="Estimated" value={form.estimated_amount} onChange={e => setForm(p => ({ ...p, estimated_amount: e.target.value }))}
                className="w-full pl-6 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-400" />
            </div>
            <div className="relative">
              <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input type="number" placeholder="Actual (optional)" value={form.actual_amount} onChange={e => setForm(p => ({ ...p, actual_amount: e.target.value }))}
                className="w-full pl-6 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="px-4 py-1.5 text-xs font-semibold text-white rounded-lg disabled:opacity-60" style={{ background: "#3B82F6" }}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Add"}
            </button>
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600">Cancel</button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <div className="text-center py-8 space-y-2">
          <p className="text-gray-500 text-sm font-medium">No budget items added yet.</p>
          <button onClick={() => setShowAdd(true)} className="text-xs text-white px-4 py-2 rounded-xl font-semibold" style={{ background: "#3B82F6" }}>
            Add a cost item
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.description}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${STATUS_STYLES[item.status] || STATUS_STYLES.pending}`}>{item.status}</span>
                </div>
                <p className="text-xs text-gray-400">{CATEGORY_LABELS[item.category]} {item.vendor_name ? `· ${item.vendor_name}` : ""}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-gray-900">${parseFloat(item.estimated_amount || 0).toLocaleString()}</p>
                {item.actual_amount && <p className="text-xs text-gray-400">Actual: ${parseFloat(item.actual_amount).toLocaleString()}</p>}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {item.status !== "paid" && (
                  <button onClick={() => markPaid(item)} className="text-xs text-green-600 bg-green-50 hover:bg-green-100 px-2 py-1 rounded-lg transition-colors">Paid</button>
                )}
                <button onClick={() => deleteItem(item.id)} className="text-gray-300 hover:text-red-400 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}