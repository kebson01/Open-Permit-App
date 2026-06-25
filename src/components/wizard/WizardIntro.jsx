import { useState } from "react";
import { invokeLLM } from "@/lib/ai";
import { Sparkles, Loader2, ArrowRight, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

const EXAMPLES = [
  "Build a 6-foot wood privacy fence in my backyard",
  "Replace my roof with new shingles",
  "Add a bedroom and bathroom to my home",
  "Install a new HVAC system",
  "Build an inground pool",
  "Remodel my kitchen (no structural changes)",
  "Replace my water heater",
  "Install a generator",
];

export default function WizardIntro({ onNext }) {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleNext = async () => {
    const text = description.trim();
    if (text.length < 10) {
      setError("Please describe your project in a bit more detail.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const result = await invokeLLM({
        prompt: `A homeowner or contractor described their construction/renovation project as: "${text}"

Analyze this and return a JSON object with:
- category: one of [roofing, electrical, plumbing, mechanical_hvac, structural_addition, remodel_interior, new_construction, pool_spa, fence, demolition, generator, solar, flooring, window_door, driveway_paving, landscaping, other]
- work_type: one of [new, replacement, repair, addition, alteration]
- property_type_guess: one of [residential, commercial, unknown]
- summary: a 1-sentence plain-English summary of what they want to do
- key_questions: array of 4-6 specific follow-up questions needed to determine exact permit requirements (each question should be an object with: id, question, type ["select","number","boolean","text"], options if select)

Be practical and focused on what a building department would need to know.`,
        response_json_schema: {
          type: "object",
          properties: {
            category: { type: "string" },
            work_type: { type: "string" },
            property_type_guess: { type: "string" },
            summary: { type: "string" },
            key_questions: { type: "array", items: { type: "object" } }
          }
        }
      });
      onNext({ description: text, aiParsed: result });
    } catch {
      setError("Could not analyze your description. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)" }}>
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">What are you planning to build or change?</h2>
        <p className="text-gray-500">Describe your project in plain language — we'll guide you through the permit process step by step.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Describe your project</label>
        <textarea
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 resize-none transition-colors"
          rows={4}
          placeholder="e.g. I want to build a 6-foot wooden privacy fence along the back of my property..."
          value={description}
          onChange={e => { setDescription(e.target.value); setError(""); }}
          onKeyDown={e => { if (e.key === "Enter" && e.metaKey) handleNext(); }}
        />
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

        <Button
          onClick={handleNext}
          disabled={loading || description.trim().length < 5}
          className="w-full mt-4 gap-2 text-white"
          style={{ background: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)" }}
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing your project...</> : <><ArrowRight className="w-4 h-4" /> Continue</>}
        </Button>
      </div>

      <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-blue-800">Common examples</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map(ex => (
            <button
              key={ex}
              onClick={() => setDescription(ex)}
              className="text-xs px-3 py-1.5 bg-white border border-blue-200 text-blue-700 rounded-full hover:bg-blue-100 transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}