import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { CheckSquare, Square, Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ProjectPermitChecklist({ project, onUpdate }) {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState("");

  const { data: permitTypes = [], isLoading } = useQuery({
    queryKey: ["permit_types", project.city_id],
    queryFn: () => base44.entities.PermitType.filter({ city_id: project.city_id }),
    enabled: !!project.city_id,
  });

  useEffect(() => {
    if (project.permit_checklist) {
      try { setItems(JSON.parse(project.permit_checklist)); } catch { setItems([]); }
    }
  }, [project.permit_checklist]);

  const save = async (updated) => {
    setItems(updated);
    await base44.entities.Project.update(project.id, { permit_checklist: JSON.stringify(updated) });
    onUpdate && onUpdate({ ...project, permit_checklist: JSON.stringify(updated) });
  };

  const toggle = (idx) => {
    const updated = items.map((item, i) => i === idx ? { ...item, checked: !item.checked } : item);
    save(updated);
  };

  const remove = (idx) => {
    save(items.filter((_, i) => i !== idx));
  };

  const addItem = () => {
    if (!newItem.trim()) return;
    save([...items, { label: newItem.trim(), checked: false }]);
    setNewItem("");
  };

  const addFromPermitType = (pt) => {
    const alreadyAdded = items.some(i => i.label === pt.name);
    if (alreadyAdded) return;
    save([...items, { label: pt.name, checked: false, category: pt.category }]);
  };

  const done = items.filter(i => i.checked).length;

  return (
    <div>
      {/* Progress */}
      {items.length > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{done} of {items.length} completed</span>
            <span>{Math.round((done / items.length) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-2 bg-green-500 rounded-full transition-all"
              style={{ width: `${items.length ? (done / items.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Checklist */}
      <div className="space-y-2 mb-4">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2.5">
            <button onClick={() => toggle(idx)} className="flex-shrink-0">
              {item.checked
                ? <CheckSquare className="w-4 h-4 text-green-600" />
                : <Square className="w-4 h-4 text-gray-400" />}
            </button>
            <span className={`flex-1 text-sm ${item.checked ? "line-through text-gray-400" : "text-gray-700"}`}>
              {item.label}
            </span>
            {item.category && (
              <span className="text-xs text-gray-400 bg-white border border-gray-200 px-1.5 py-0.5 rounded">
                {item.category}
              </span>
            )}
            <button onClick={() => remove(idx)} className="text-gray-300 hover:text-red-400">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {items.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">No checklist items yet. Add items below or from permit types.</p>
        )}
      </div>

      {/* Add custom item */}
      <div className="flex gap-2 mb-5">
        <Input
          placeholder="Add checklist item..."
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addItem()}
          className="text-sm"
        />
        <Button onClick={addItem} size="sm" variant="outline">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Suggested from permit types */}
      {permitTypes.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Add from {project.city_name} permit types
          </p>
          <div className="flex flex-wrap gap-2">
            {permitTypes.map(pt => {
              const added = items.some(i => i.label === pt.name);
              return (
                <button
                  key={pt.id}
                  onClick={() => addFromPermitType(pt)}
                  disabled={added}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    added
                      ? "bg-green-50 border-green-200 text-green-600 cursor-default"
                      : "bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600"
                  }`}
                >
                  {added ? "✓ " : "+ "}{pt.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}