import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, DollarSign, Trash2, TrendingUp, TrendingDown, CheckCircle2, Clock, AlertCircle } from "lucide-react";

const CATEGORIES = ["permit_fee", "materials", "labor", "contractor", "inspection", "design", "other"];
const STATUSES = ["pending", "approved", "paid", "disputed"];

const CAT_COLORS = {
  permit_fee: "bg-blue-100 text-blue-700",
  materials:  "bg-orange-100 text-orange-700",
  labor:      "bg-purple-100 text-purple-700",
  contractor: "bg-indigo-100 text-indigo-700",
  inspection: "bg-yellow-100 text-yellow-700",
  design:     "bg-pink-100 text-pink-700",
  other:      "bg-gray-100 text-gray-600",
};

const STATUS_ICONS = {
  pending:  <Clock className="w-3.5 h-3.5 text-yellow-500" />,
  approved: <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />,
  paid:     <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />,
  disputed: <AlertCircle className="w-3.5 h-3.5 text-red-500" />,
};

const EMPTY_FORM = { category: "materials", description: "", vendor_name: "", estimated_amount: "", actual_amount: "", status: "pending", due_date: "", notes: "" };

export default function ProjectBudgetTab({ project }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: items = [] } = useQuery({
    queryKey: ["budget", project.id],
    queryFn: () => base44.entities.ProjectBudgetItem.filter({ project_id: project.id }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ProjectBudgetItem.create({ ...data, project_id: project.id }),
    onSuccess: () => { qc.invalidateQueries(["budget", project.id]); setShowForm(false); setForm(EMPTY_FORM); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProjectBudgetItem.delete(id),
    onSuccess: () => qc.invalidateQueries(["budget", project.id]),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => base44.entities.ProjectBudgetItem.update(id, { status }),
    onSuccess: () => qc.invalidateQueries(["budget", project.id]),
  });

  const totalEstimated = items.reduce((s, i) => s + (i.estimated_amount || 0), 0);
  const totalActual    = items.reduce((s, i) => s + (i.actual_amount || 0), 0);
  const totalPaid      = items.filter(i => i.status === "paid").reduce((s, i) => s + (i.actual_amount || i.estimated_amount || 0), 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...form,
      estimated_amount: form.estimated_amount ? parseFloat(form.estimated_amount) : null,
      actual_amount: form.actual_amount ? parseFloat(form.actual_amount) : null,
    };
    createMutation.mutate(data);
  };

  return (
    <div>
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
          <p className="text-xs text-blue-500 font-medium mb-1">Estimated Total</p>
          <p className="text-xl font-bold text-blue-700">${totalEstimated.toLocaleString()}</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
          <p className="text-xs text-amber-500 font-medium mb-1">Actual / Invoiced</p>
          <p className="text-xl font-bold text-amber-700">${totalActual.toLocaleString()}</p>
          {totalActual > totalEstimated && (
            <div className="flex items-center justify-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3 text-red-500" />
              <span className="text-xs text-red-500">Over by ${(totalActual - totalEstimated).toLocaleString()}</span>
            </div>
          )}
          {totalActual < totalEstimated && totalActual > 0 && (
            <div className="flex items-center justify-center gap-1 mt-1">
              <TrendingDown className="w-3 h-3 text-green-500" />
              <span className="text-xs text-green-500">Under by ${(totalEstimated - totalActual).toLocaleString()}</span>
            </div>
          )}
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
          <p className="text-xs text-green-500 font-medium mb-1">Total Paid</p>
          <p className="text-xl font-bold text-green-700">${totalPaid.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">Budget Items</h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700 gap-1">
          <Plus className="w-3.5 h-3.5" /> Add Item
        </Button>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Category</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Status</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <Input placeholder="Description *" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} required />
          <Input placeholder="Vendor / Contractor name" value={form.vendor_name} onChange={e => setForm(p => ({ ...p, vendor_name: e.target.value }))} />
          <div className="grid sm:grid-cols-2 gap-3">
            <Input type="number" placeholder="Estimated amount ($)" value={form.estimated_amount} onChange={e => setForm(p => ({ ...p, estimated_amount: e.target.value }))} />
            <Input type="number" placeholder="Actual amount ($)" value={form.actual_amount} onChange={e => setForm(p => ({ ...p, actual_amount: e.target.value }))} />
          </div>
          <Input type="date" placeholder="Due date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} />
          <div className="flex gap-2">
            <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700">Save Item</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {/* Items list */}
      {items.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No budget items yet. Add permits, materials, labor costs, and more.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3 hover:border-gray-200 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CAT_COLORS[item.category]}`}>
                    {item.category?.replace(/_/g, " ")}
                  </span>
                  <div className="flex items-center gap-1">
                    {STATUS_ICONS[item.status]}
                    <select
                      className="text-xs text-gray-500 bg-transparent border-0 cursor-pointer focus:outline-none p-0"
                      value={item.status}
                      onChange={e => updateStatus.mutate({ id: item.id, status: e.target.value })}
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-800 truncate">{item.description}</p>
                {item.vendor_name && <p className="text-xs text-gray-400">{item.vendor_name}</p>}
                {item.due_date && <p className="text-xs text-gray-400">Due: {item.due_date}</p>}
              </div>
              <div className="text-right flex-shrink-0">
                {item.actual_amount ? (
                  <p className="text-sm font-bold text-gray-800">${Number(item.actual_amount).toLocaleString()}</p>
                ) : item.estimated_amount ? (
                  <p className="text-sm font-medium text-gray-400">~${Number(item.estimated_amount).toLocaleString()}</p>
                ) : null}
                {item.actual_amount && item.estimated_amount && (
                  <p className={`text-xs ${item.actual_amount > item.estimated_amount ? "text-red-500" : "text-green-500"}`}>
                    {item.actual_amount > item.estimated_amount ? "+" : ""}
                    ${(item.actual_amount - item.estimated_amount).toLocaleString()} vs est.
                  </p>
                )}
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
                onClick={() => deleteMutation.mutate(item.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}