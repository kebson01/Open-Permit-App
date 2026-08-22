import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as db from "@/lib/db";
import { Plus, Search, Pencil, Trash2, ExternalLink, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CATEGORIES = [
  { value: "zoning", label: "Zoning" },
  { value: "building", label: "Building" },
  { value: "fire_safety", label: "Fire Safety" },
  { value: "electrical", label: "Electrical" },
  { value: "plumbing", label: "Plumbing" },
  { value: "environmental", label: "Environmental" },
  { value: "administrative", label: "Administrative" },
  { value: "land_use", label: "Land Use" },
  { value: "subdivision", label: "Subdivision" },
  { value: "signs", label: "Signs" },
  { value: "other", label: "Other" },
];

const CATEGORY_COLORS = {
  zoning: "bg-purple-100 text-purple-700",
  building: "bg-blue-100 text-blue-700",
  fire_safety: "bg-red-100 text-red-700",
  electrical: "bg-yellow-100 text-yellow-700",
  plumbing: "bg-cyan-100 text-cyan-700",
  environmental: "bg-green-100 text-green-700",
  administrative: "bg-gray-100 text-gray-700",
  land_use: "bg-orange-100 text-orange-700",
  subdivision: "bg-indigo-100 text-indigo-700",
  signs: "bg-pink-100 text-pink-700",
  other: "bg-slate-100 text-slate-700",
};

const EMPTY_FORM = {
  chapter_number: "",
  chapter_title: "",
  section_number: "",
  section_title: "",
  category: "building",
  content: "",
  effective_date: "",
  last_amended: "",
  ordinance_number: "",
  reference_url: "",
  tags: "",
  is_active: true,
};

function OrdinanceForm({ cityId, cityName, initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, city_id: cityId, city_name: cityName });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Chapter Number</label>
          <Input value={form.chapter_number} onChange={e => set("chapter_number", e.target.value)} placeholder="e.g. Chapter 12" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Chapter Title *</label>
          <Input required value={form.chapter_title} onChange={e => set("chapter_title", e.target.value)} placeholder="e.g. Zoning Regulations" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Section Number</label>
          <Input value={form.section_number} onChange={e => set("section_number", e.target.value)} placeholder="e.g. 12-5" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Section Title *</label>
          <Input required value={form.section_title} onChange={e => set("section_title", e.target.value)} placeholder="e.g. Setback Requirements" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Category *</label>
          <select
            required
            value={form.category}
            onChange={e => set("category", e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          >
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Ordinance Number</label>
          <Input value={form.ordinance_number} onChange={e => set("ordinance_number", e.target.value)} placeholder="e.g. Ord. No. 2024-15" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Effective Date</label>
          <Input type="date" value={form.effective_date} onChange={e => set("effective_date", e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Last Amended</label>
          <Input type="date" value={form.last_amended} onChange={e => set("last_amended", e.target.value)} />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">Content / Summary</label>
        <textarea
          value={form.content}
          onChange={e => set("content", e.target.value)}
          rows={4}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40"
          placeholder="Full text or summary of this ordinance section..."
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Reference URL</label>
          <Input value={form.reference_url} onChange={e => set("reference_url", e.target.value)} placeholder="https://library.municode.com/..." />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Tags (comma-separated)</label>
          <Input value={form.tags} onChange={e => set("tags", e.target.value)} placeholder="setback, residential, height" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="isActive" checked={form.is_active} onChange={e => set("is_active", e.target.checked)} className="rounded" />
        <label htmlFor="isActive" className="text-sm text-gray-700">Currently in effect</label>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="gradient-primary text-white">Save Ordinance</Button>
      </div>
    </form>
  );
}

export default function CodeOfOrdinancesPanel({ city }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: ordinances = [], isLoading } = useQuery({
    queryKey: ["ordinances", city.id],
    queryFn: () => db.CodeOfOrdinance.filter({ city_id: city.id }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["ordinances", city.id] });

  const createMut = useMutation({
    mutationFn: d => db.CodeOfOrdinance.create(d),
    onSuccess: () => { invalidate(); setShowForm(false); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...d }) => db.CodeOfOrdinance.update(id, d),
    onSuccess: () => { invalidate(); setEditing(null); },
  });

  const deleteMut = useMutation({
    mutationFn: id => db.CodeOfOrdinance.delete(id),
    onSuccess: invalidate,
  });

  const filtered = ordinances.filter(o => {
    const matchCat = filterCat === "all" || o.category === filterCat;
    const matchSearch = !search ||
      [o.section_title, o.chapter_title, o.section_number, o.chapter_number, o.content, o.tags]
        .join(" ").toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-1 min-w-0">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              className="pl-9"
              placeholder="Search ordinances..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            value={filterCat}
            onChange={e => setFilterCat(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <Button onClick={() => { setShowForm(true); setEditing(null); }} className="gradient-primary text-white gap-2">
          <Plus className="w-4 h-4" /> Add Ordinance
        </Button>
      </div>

      {showForm && !editing && (
        <OrdinanceForm
          cityId={city.id}
          cityName={city.name}
          onSave={d => createMut.mutate(d)}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-10 text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-400">No ordinances found.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Section</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Ordinance #</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Effective</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(o => (
                <React.Fragment key={o.id}>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {o.chapter_number && <span className="block">{o.chapter_number}</span>}
                      {o.section_number && <span className="text-blue-600">{o.section_number}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{o.section_title}</p>
                      <p className="text-xs text-gray-400">{o.chapter_title}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[o.category] || CATEGORY_COLORS.other}`}>
                        {CATEGORIES.find(c => c.value === o.category)?.label || o.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{o.ordinance_number || "—"}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{o.effective_date || "—"}</td>
                    <td className="px-4 py-3">
                      {o.is_active !== false
                        ? <span className="flex items-center gap-1 text-xs text-green-600"><Check className="w-3 h-3" />Active</span>
                        : <span className="text-xs text-gray-400">Inactive</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        {o.reference_url && (
                          <a href={o.reference_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="icon" className="w-7 h-7"><ExternalLink className="w-3.5 h-3.5" /></Button>
                          </a>
                        )}
                        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setEditing(o)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-7 h-7 text-red-400 hover:text-red-600" onClick={() => deleteMut.mutate(o.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {editing?.id === o.id && (
                    <tr>
                      <td colSpan={7} className="px-4 py-3">
                        <OrdinanceForm
                          cityId={city.id}
                          cityName={city.name}
                          initial={editing}
                          onSave={d => updateMut.mutate({ id: editing.id, ...d })}
                          onCancel={() => setEditing(null)}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}