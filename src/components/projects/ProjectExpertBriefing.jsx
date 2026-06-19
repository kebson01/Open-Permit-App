import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import * as db from "@/lib/db";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2, Sparkles, FileText, DollarSign, CheckSquare,
  AlertTriangle, ChevronDown, ChevronUp, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProjectExpertBriefing({ project }) {
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({ docs: true, fees: true, checklist: true, advice: true });

  const { data: feeRules = [] } = useQuery({
    queryKey: ["fee_rules", project.city_id],
    queryFn: () => db.FeeRule.filter({ city_id: project.city_id }),
    enabled: !!project.city_id,
  });

  const { data: permitTypes = [] } = useQuery({
    queryKey: ["permit_types", project.city_id],
    queryFn: () => db.PermitType.filter({ city_id: project.city_id }),
    enabled: !!project.city_id,
  });

  const { data: surcharges = [] } = useQuery({
    queryKey: ["surcharges", project.city_id],
    queryFn: () => db.CitySurcharge.filter({ city_id: project.city_id }),
    enabled: !!project.city_id,
  });

  useEffect(() => {
    if (feeRules !== undefined && permitTypes !== undefined) {
      runBriefing();
    }
  }, [project.id, feeRules.length, permitTypes.length]);

  const runBriefing = async () => {
    setLoading(true);
    setBriefing(null);

    const feeRulesText = feeRules.slice(0, 25).map(r =>
      `${r.permit_name} (${r.category}): calc=${r.calc_type}, flat=$${r.flat_fee || 0}, base=$${r.base_fee || 0}, rate=${r.rate_percentage || 0}%`
    ).join("\n");

    const permitTypesText = permitTypes.slice(0, 15).map(p =>
      `${p.name} (${p.category}): docs=[${(p.documents_needed || []).join(", ")}], requirements=[${(p.typical_requirements || []).join(", ")}], timeline=${p.typical_timeline || "varies"}`
    ).join("\n");

    const surcharge = surcharges[0];
    const surchargeText = surcharge
      ? `Tech/Admin fee: $${surcharge.technology_admin || 0}/permit, Board of Rules: $${surcharge.board_of_rules_rate || 0}/$1000`
      : "";

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert building permit consultant for ${project.city_name}, Florida (Broward County). 
A user has started a project and needs your expert guidance. Analyze their project and provide a complete briefing.

PROJECT DETAILS:
- Project Name: ${project.name}
- Type: ${project.project_type?.replace(/_/g, " ")}
- City: ${project.city_name}
- Property Address: ${project.property_address || "not provided"}
- Estimated Construction Cost: ${project.estimated_cost ? "$" + Number(project.estimated_cost).toLocaleString() : "not provided"}
- Square Footage: ${project.square_footage || "not provided"}
- Description: ${project.description || "none"}

CITY FEE SCHEDULE (${project.city_name}):
${feeRulesText || "No fee rules on file — use typical Broward County rates."}
${surchargeText}

CITY PERMIT TYPES ON FILE:
${permitTypesText || "No permit types on file — use standard Broward County requirements."}

Provide a thorough expert briefing with:
1. Which permits are required for this project type
2. Estimated permit fees (itemized breakdown based on the fee schedule above)
3. Documents the applicant needs to prepare
4. Step-by-step permit process checklist
5. Expert advice, warnings, and tips specific to this city and project type
6. Typical timeline from application to approval

Be specific, practical, and act as if you are a knowledgeable permit expediter who knows ${project.city_name}'s building department well.`,
      response_json_schema: {
        type: "object",
        properties: {
          permits_required: {
            type: "array",
            items: { type: "object", properties: { permit_name: { type: "string" }, reason: { type: "string" } } }
          },
          fee_estimate: {
            type: "object",
            properties: {
              total: { type: "number" },
              line_items: {
                type: "array",
                items: { type: "object", properties: { label: { type: "string" }, amount: { type: "number" }, note: { type: "string" } } }
              },
              disclaimer: { type: "string" }
            }
          },
          documents_required: {
            type: "array",
            items: { type: "object", properties: { document: { type: "string" }, notes: { type: "string" } } }
          },
          process_checklist: {
            type: "array",
            items: { type: "object", properties: { step: { type: "string" }, description: { type: "string" } } }
          },
          expert_advice: { type: "string" },
          warnings: { type: "array", items: { type: "string" } },
          typical_timeline: { type: "string" }
        }
      }
    });

    setBriefing(response);
    setLoading(false);
  };

  const toggle = (section) => setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-blue-600 animate-pulse" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-gray-800">Analyzing your project...</p>
          <p className="text-sm text-gray-400 mt-1">Pulling permit requirements, fees, and expert advice for {project.city_name}</p>
        </div>
        <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (!briefing) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-gray-800">Expert Permit Briefing</span>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{project.city_name}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={runBriefing} className="gap-1.5 text-gray-400 hover:text-gray-700">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      {/* Timeline badge */}
      {briefing.typical_timeline && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-sm text-blue-800">
          ⏱ <strong>Typical Timeline:</strong> {briefing.typical_timeline}
        </div>
      )}

      {/* Warnings */}
      {briefing.warnings?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1.5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-800">Important Heads-Up</span>
          </div>
          {briefing.warnings.map((w, i) => (
            <p key={i} className="text-sm text-amber-700 flex items-start gap-2">
              <span className="text-amber-400 mt-0.5">•</span> {w}
            </p>
          ))}
        </div>
      )}

      {/* Permits Required */}
      {briefing.permits_required?.length > 0 && (
        <Section
          title="Permits Required"
          icon={<CheckSquare className="w-4 h-4 text-green-600" />}
          expanded={expandedSections.checklist}
          onToggle={() => toggle("checklist")}
          badge={briefing.permits_required.length}
        >
          <div className="space-y-2">
            {briefing.permits_required.map((p, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-700 text-xs font-bold">{i + 1}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{p.permit_name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{p.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Fee Estimate */}
      {briefing.fee_estimate && (
        <Section
          title="Fee Estimate"
          icon={<DollarSign className="w-4 h-4 text-blue-600" />}
          expanded={expandedSections.fees}
          onToggle={() => toggle("fees")}
          badge={briefing.fee_estimate.total ? `$${Number(briefing.fee_estimate.total).toLocaleString()}` : null}
          badgeColor="blue"
        >
          <div className="space-y-2 mb-3">
            {briefing.fee_estimate.line_items?.map((item, i) => (
              <div key={i} className="flex items-start justify-between gap-3 py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{item.label}</p>
                  {item.note && <p className="text-xs text-gray-400 mt-0.5">{item.note}</p>}
                </div>
                <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">${Number(item.amount || 0).toLocaleString()}</span>
              </div>
            ))}
            {briefing.fee_estimate.total && (
              <div className="flex justify-between pt-2">
                <span className="font-bold text-gray-900">Total Estimated</span>
                <span className="font-bold text-blue-700 text-lg">${Number(briefing.fee_estimate.total).toLocaleString()}</span>
              </div>
            )}
          </div>
          {briefing.fee_estimate.disclaimer && (
            <p className="text-xs text-gray-400 italic">{briefing.fee_estimate.disclaimer}</p>
          )}
        </Section>
      )}

      {/* Documents Required */}
      {briefing.documents_required?.length > 0 && (
        <Section
          title="Documents Required"
          icon={<FileText className="w-4 h-4 text-purple-600" />}
          expanded={expandedSections.docs}
          onToggle={() => toggle("docs")}
          badge={briefing.documents_required.length}
          badgeColor="purple"
        >
          <div className="space-y-2">
            {briefing.documents_required.map((doc, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                <FileText className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-800">{doc.document}</p>
                  {doc.notes && <p className="text-xs text-gray-500 mt-0.5">{doc.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Step-by-Step Process */}
      {briefing.process_checklist?.length > 0 && (
        <Section
          title="Step-by-Step Process"
          icon={<CheckSquare className="w-4 h-4 text-indigo-600" />}
          expanded={expandedSections.advice}
          onToggle={() => toggle("advice")}
        >
          <div className="space-y-3">
            {briefing.process_checklist.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{step.step}</p>
                  {step.description && <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Expert Advice */}
      {briefing.expert_advice && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-800">Expert Advice</span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{briefing.expert_advice}</p>
        </div>
      )}
    </div>
  );
}

function Section({ title, icon, expanded, onToggle, badge, badgeColor = "gray", children }) {
  const badgeClasses = {
    gray: "bg-gray-100 text-gray-600",
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
    green: "bg-green-100 text-green-700",
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-semibold text-gray-800">{title}</span>
          {badge !== null && badge !== undefined && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeClasses[badgeColor]}`}>{badge}</span>
          )}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {expanded && <div className="px-4 py-3">{children}</div>}
    </div>
  );
}