import React from "react";
import { Calculator } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const INPUT_META = {
  constructionCost: {
    label: "Estimated Construction / Project Cost ($)",
    placeholder: "e.g. 50000",
    type: "number",
    hint: "The total estimated cost of labor and materials for your project. If you're unsure, get a contractor quote first.",
  },
  squareFeet: {
    label: "Square Footage",
    placeholder: "e.g. 2500",
    type: "number",
    hint: "The total area affected by your project in square feet. For a room addition, measure length × width.",
  },
  linearFeet: {
    label: "Linear Feet",
    placeholder: "e.g. 150",
    type: "number",
    hint: "The total length of the item being installed, such as a fence or sidewalk.",
  },
  units: {
    label: "Number of Units / Doors",
    placeholder: "e.g. 2",
    type: "number",
    hint: "How many units, doors, or openings",
  },
  floors: {
    label: "Number of Floors",
    placeholder: "e.g. 2",
    type: "number",
    hint: "Number of floors (for multi-story demolition)",
  },
  openings: {
    label: "Number of Openings",
    placeholder: "e.g. 8",
    type: "number",
    hint: "Total number of window/door openings",
  },
  sprinklerHeads: {
    label: "Number of Sprinkler Heads",
    placeholder: "e.g. 24",
    type: "number",
    hint: "Total number of sprinkler heads in the system",
  },
  alarmDevices: {
    label: "Number of Alarm Devices",
    placeholder: "e.g. 20",
    type: "number",
    hint: "Total number of alarm devices (detectors, pulls, etc.)",
  },
};

export default function ProjectDetailsV2({ permit, details, setDetails, onCalculate }) {
  if (!permit) return null;

  // Gracefully handle permits missing fee configuration
  if (!permit.calcType && !permit.feeConfig) {
    return (
      <div className="mt-6 bg-amber-50 rounded-2xl border border-amber-200 p-5 flex items-start gap-3">
        <span className="text-amber-500 text-lg mt-0.5">ℹ️</span>
        <p className="text-sm text-amber-800">
          Fee information coming soon for this permit type. Please contact the Weston Building Department for current fee details.
        </p>
      </div>
    );
  }

  const inputs = permit.inputs || [];

  if (inputs.length === 0) {
    return (
      <div className="mt-6 bg-blue-50 rounded-2xl border border-blue-100 p-5">
        <p className="text-sm text-gray-600 mb-4">
          This is a <strong>flat-rate permit</strong>. No additional project details are needed.
        </p>
        <Button onClick={onCalculate} className="text-white rounded-xl h-11 font-semibold shadow-md w-full sm:w-auto" style={{ background: "linear-gradient(135deg, #0D2B5E 0%, #0F3575 100%)" }}>
          <Calculator className="w-4 h-4 mr-2" />
          Calculate Fee
        </Button>
      </div>
    );
  }

  const canCalculate = inputs.every(key => {
    const val = details[key];
    return val !== undefined && val !== "" && val > 0;
  });

  return (
    <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-800 mb-1">Step 2: Project Details</h3>
      <div className="flex items-center gap-2 mb-5 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
        <span className="text-amber-600 text-sm">💡</span>
        <p className="text-xs text-amber-800">Not sure about your numbers? Estimates are fine — you can refine them later.</p>
      </div>

      <div className="space-y-5">
        {inputs.map(key => {
          const meta = INPUT_META[key] || { label: key, placeholder: "", type: "number" };
          return (
            <div key={key}>
              <Label className="text-sm font-medium text-gray-700">{meta.label}</Label>
              {meta.hint && <p className="text-xs text-gray-400 mt-0.5 mb-1.5">{meta.hint}</p>}
              <Input
                type={meta.type}
                min="0"
                placeholder={meta.placeholder}
                value={details[key] || ""}
                onChange={e => setDetails({ ...details, [key]: parseFloat(e.target.value) || 0 })}
                className="rounded-xl"
              />
            </div>
          );
        })}
      </div>

      <div className="mt-6 sticky bottom-4">
        <Button
          onClick={onCalculate}
          disabled={!canCalculate}
          className="w-full text-white rounded-xl h-12 text-base font-semibold shadow-xl disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #0D2B5E 0%, #0F3575 100%)" }}
        >
          <Calculator className="w-5 h-5 mr-2" />
          Calculate Estimated Fee
        </Button>
      </div>
    </div>
  );
}