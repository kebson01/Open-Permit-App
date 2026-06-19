import { useState } from "react";
import * as db from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckSquare, Square, Plus, Trash2, Loader2 } from "lucide-react";

export default function ProjectChecklist({ project, onUpdated }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(project.permit_checklist || "[]"); } catch { return []; }
  });
  const [newItem, setNewItem] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async (updated) => {
    setSaving(true);
    const p = await db.Project.update(project.id, {
      permit_checklist: JSON.stringify(updated),
    });
    onUpdated(p);
    setSaving(false);
  };

  const toggle = (idx) => {
    const updated = items.map((it, i) => i === idx ? { ...it, checked: !it.checked } : it);
    setItems(updated);
    save(updated);
  };

  const add = () => {
    if (!newItem.trim()) return;
    const updated = [...items, { label: newItem.trim(), checked: false }];
    setItems(updated);
    setNewItem("");
    save(updated);
  };

  const remove = (idx) => {
    const updated = items.filter((_, i) => i !== idx);
    setItems(updated);
    save(updated);
  };

  const done = items.filter(i => i.checked).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">Permit Checklist</h3>
        <span className="text-xs text-gray-400">{done}/{items.length} done {saving && <Loader2 className="inline w-3 h-3 animate-spin ml-1" />}</span>
      </div>

      {items.length > 0 && (
        <div className="space-y-2 mb-3">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 group">
              <button onClick={() => toggle(idx)} className="flex-shrink-0">
                {item.checked
                  ? <CheckSquare className="w-4 h-4 text-green-600" />
                  : <Square className="w-4 h-4 text-gray-300" />}
              </button>
              <span className={`flex-1 text-sm ${item.checked ? "line-through text-gray-400" : "text-gray-700"}`}>
                {item.label}
              </span>
              <button onClick={() => remove(idx)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          placeholder="Add checklist item..."
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => e.key === "Enter" && add()}
          className="text-sm"
        />
        <Button size="sm" variant="outline" onClick={add} disabled={!newItem.trim()}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}