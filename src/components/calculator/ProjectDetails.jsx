import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COST_BASED = [
  "Building/Structure (Custom)", "Sprinkler System", "Fire Alarm System",
  "Fire Pump", "Smoke Control System", "Tenant Improvements"
];
const SQFT_BASED = ["Roofing"];
const UNIT_BASED = ["Hurricane Shutters", "Garage Door", "Windows"];
const LINEAR_BASED = ["Fence/Gate"];

export default function ProjectDetails({ selectedPermit, details, setDetails }) {
  if (!selectedPermit) return null;

  const needsCost = COST_BASED.includes(selectedPermit);
  const needsSqft = SQFT_BASED.includes(selectedPermit);
  const needsUnits = UNIT_BASED.includes(selectedPermit);
  const needsLinear = LINEAR_BASED.includes(selectedPermit);

  return (
    <div className="mt-8">
      <h3 className="text-lg font-bold text-gray-800 mb-1">Step 2: Project Details</h3>
      <p className="text-sm text-gray-500 mb-4">Provide details to calculate your estimated fee</p>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        {needsCost && (
          <div>
            <Label className="text-sm font-medium text-gray-700">Estimated Construction Cost ($)</Label>
            <Input
              type="number"
              min="0"
              placeholder="e.g. 50000"
              value={details.constructionCost || ""}
              onChange={e => setDetails({ ...details, constructionCost: parseFloat(e.target.value) || 0 })}
              className="mt-1.5 rounded-xl"
            />
          </div>
        )}

        {needsSqft && (
          <div>
            <Label className="text-sm font-medium text-gray-700">Square Footage</Label>
            <Input
              type="number"
              min="0"
              placeholder="e.g. 2000"
              value={details.squareFeet || ""}
              onChange={e => setDetails({ ...details, squareFeet: parseFloat(e.target.value) || 0 })}
              className="mt-1.5 rounded-xl"
            />
            <div className="mt-3">
              <Label className="text-sm font-medium text-gray-700">Roof Type</Label>
              <Select
                value={details.roofType || "shingle"}
                onValueChange={v => setDetails({ ...details, roofType: v })}
              >
                <SelectTrigger className="mt-1.5 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shingle">Shingle</SelectItem>
                  <SelectItem value="tile">Tile</SelectItem>
                  <SelectItem value="metal">Metal</SelectItem>
                  <SelectItem value="flat">Flat/Built-Up</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {needsUnits && (
          <div>
            <Label className="text-sm font-medium text-gray-700">Number of Openings/Units</Label>
            <Input
              type="number"
              min="1"
              placeholder="e.g. 5"
              value={details.units || ""}
              onChange={e => setDetails({ ...details, units: parseInt(e.target.value) || 0 })}
              className="mt-1.5 rounded-xl"
            />
          </div>
        )}

        {needsLinear && (
          <div>
            <Label className="text-sm font-medium text-gray-700">Linear Feet</Label>
            <Input
              type="number"
              min="0"
              placeholder="e.g. 150"
              value={details.linearFeet || ""}
              onChange={e => setDetails({ ...details, linearFeet: parseFloat(e.target.value) || 0 })}
              className="mt-1.5 rounded-xl"
            />
          </div>
        )}

        {/* Common fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">Project Type</Label>
            <Select
              value={details.projectType || "new"}
              onValueChange={v => setDetails({ ...details, projectType: v })}
            >
              <SelectTrigger className="mt-1.5 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New Installation</SelectItem>
                <SelectItem value="alteration">Alteration/Repair</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Property Type</Label>
            <Select
              value={details.propertyType || "single_family"}
              onValueChange={v => setDetails({ ...details, propertyType: v })}
            >
              <SelectTrigger className="mt-1.5 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single_family">Single Family</SelectItem>
                <SelectItem value="multi_family">Multi-Family</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}