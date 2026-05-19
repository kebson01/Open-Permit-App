import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, AlertTriangle, FileText, Upload, Loader2, ExternalLink, Zap } from "lucide-react";
import { useGuideQuestions } from "./useGuideQuestions";

// Document checklist per permit type
const DOCUMENT_CHECKLISTS = {
  "Roofing — Full Replacement": [
    { document_type: "drawings", label: "Roofing Plans / Drawings", description: "Two sets of signed and sealed plans by a licensed Florida engineer or architect.", is_required: true, city_system_field: "Attachments > Plans" },
    { document_type: "product_approval", label: "Florida Product Approval (NOA)", description: "Current NOA for the roofing material from floridabuilding.org.", is_required: true, city_system_field: "Attachments > NOA" },
    { document_type: "contractor_license", label: "Contractor License Certificate", description: "Copy of the contractor's valid Florida state license.", is_required: true, city_system_field: "Attachments > License" },
    { document_type: "insurance_certificate", label: "Certificate of Insurance", description: "Current general liability and workers' comp insurance certificate.", is_required: true, city_system_field: "Attachments > Insurance" },
    { document_type: "notarized_form", label: "Notice of Commencement (if > $2,500)", description: "Must be recorded at Broward County Records before work begins.", is_required: false, city_system_field: "Attachments > NOC" },
    { document_type: "survey", label: "Survey", description: "Boundary survey of the property (may be waived for simple re-roofs).", is_required: false, city_system_field: "Attachments > Survey" },
  ],
  "HVAC / A/C Replacement": [
    { document_type: "contractor_license", label: "Contractor License Certificate", description: "Copy of the contractor's valid Florida state license.", is_required: true, city_system_field: "Attachments > License" },
    { document_type: "insurance_certificate", label: "Certificate of Insurance", description: "Current general liability and workers' comp certificate.", is_required: true, city_system_field: "Attachments > Insurance" },
    { document_type: "product_approval", label: "Equipment Product Approval / Spec Sheet", description: "Manufacturer spec sheet for the HVAC unit.", is_required: true, city_system_field: "Attachments > Equipment Spec" },
    { document_type: "energy_calc", label: "Manual J Energy Calculation (if required)", description: "Required for full system replacements increasing capacity.", is_required: false, city_system_field: "Attachments > Energy Calc" },
    { document_type: "notarized_form", label: "Notice of Commencement (if > $15,000)", description: "Must be recorded at Broward County Records if job value exceeds $15,000.", is_required: false, city_system_field: "Attachments > NOC" },
  ],
  "Window Replacement": [
    { document_type: "product_approval", label: "Impact Window Florida NOA", description: "Current Notice of Acceptance for each window model being installed.", is_required: true, city_system_field: "Attachments > NOA" },
    { document_type: "drawings", label: "Window Schedule / Plans", description: "Elevation drawings showing window locations and dimensions.", is_required: true, city_system_field: "Attachments > Plans" },
    { document_type: "contractor_license", label: "Contractor License Certificate", description: "Copy of contractor's valid Florida license.", is_required: true, city_system_field: "Attachments > License" },
    { document_type: "insurance_certificate", label: "Certificate of Insurance", description: "Current insurance certificate.", is_required: true, city_system_field: "Attachments > Insurance" },
  ],
};

function getDefaultDocuments() {
  return [
    { document_type: "drawings", label: "Site Plan / Drawings", description: "Plans or drawings for the proposed work.", is_required: true, city_system_field: "Attachments > Plans" },
    { document_type: "contractor_license", label: "Contractor License Certificate", description: "Copy of valid Florida contractor license.", is_required: false, city_system_field: "Attachments > License" },
    { document_type: "insurance_certificate", label: "Certificate of Insurance", description: "Current liability and workers' comp certificate.", is_required: false, city_system_field: "Attachments > Insurance" },
    { document_type: "notarized_form", label: "Notice of Commencement (if required)", description: "Required for job values over $2,500 in Weston.", is_required: false, city_system_field: "Attachments > NOC" },
  ];
}

export default function PreparationPhase({ guide, currentUser, onComplete, onUpdate }) {
  const { questions, answers, loading } = useGuideQuestions(guide, currentUser);
  const [documents, setDocuments] = useState([]);
  const [docStatuses, setDocStatuses] = useState({}); // { [label]: 'not_started' | 'ready' }
  const [proceeding, setProceeding] = useState(false);

  useEffect(() => {
    const docList = DOCUMENT_CHECKLISTS[guide.permit_type_name] || getDefaultDocuments();
    setDocuments(docList);
    // Load existing doc records
    base44.entities.SubmissionDocument.filter({ guide_id: guide.id }).then(existing => {
      const statusMap = {};
      (existing || []).forEach(d => { statusMap[d.label] = d.status; });
      setDocStatuses(statusMap);
    }).catch(() => {});
  }, [guide.id]);

  // Group answers by section
  const sections = [];
  questions.forEach(q => { if (!sections.includes(q.section)) sections.push(q.section); });

  // Check for missing required answers
  const missingRequired = questions.filter(q => {
    if (!q.is_required) return false;
    const ans = answers[q.question_key];
    return !ans?.answer_value || ans.answer_value.trim() === "";
  });

  const requiredDocs = documents.filter(d => d.is_required);
  const allRequiredDocsReady = requiredDocs.every(d => docStatuses[d.label] === "ready");
  const canProceed = missingRequired.length === 0;

  const toggleDocStatus = async (doc) => {
    const next = docStatuses[doc.label] === "ready" ? "not_started" : "ready";
    setDocStatuses(prev => ({ ...prev, [doc.label]: next }));
    // Persist
    const existing = await base44.entities.SubmissionDocument.filter({ guide_id: guide.id, label: doc.label });
    if (existing?.length > 0) {
      await base44.entities.SubmissionDocument.update(existing[0].id, { status: next });
    } else {
      await base44.entities.SubmissionDocument.create({ ...doc, guide_id: guide.id, status: next });
    }
  };

  const handleProceed = async () => {
    if (!canProceed) return;
    setProceeding(true);
    // Build field mapping snapshot for guided submission
    const fieldMap = {};
    questions.forEach(q => {
      if (q.target_system_field && answers[q.question_key]?.answer_value) {
        fieldMap[q.target_system_field] = {
          value: answers[q.question_key].answer_value,
          section: q.target_system_section || "General",
          question_key: q.question_key,
          was_prefilled: answers[q.question_key].was_prefilled,
        };
      }
    });
    const updated = await base44.entities.SubmissionGuide.update(guide.id, {
      phase: "guided_submission",
      overall_status: "ready_to_submit",
      ready_date: new Date().toISOString().slice(0, 10),
      field_mapping_snapshot: JSON.stringify(fieldMap),
    });
    setProceeding(false);
    onComplete(updated);
  };

  if (loading) return <div className="text-center py-12"><Loader2 className="w-5 h-5 animate-spin mx-auto text-blue-500" /></div>;

  return (
    <div className="space-y-5">
      {/* Missing required fields warning */}
      {missingRequired.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
          <p className="font-bold text-red-700 text-sm flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4" /> {missingRequired.length} required field{missingRequired.length > 1 ? "s" : ""} missing
          </p>
          <ul className="space-y-0.5">
            {missingRequired.map(q => (
              <li key={q.question_key} className="text-xs text-red-600">• {q.question_text}</li>
            ))}
          </ul>
          <p className="text-xs text-red-500 mt-2">Go back to the Application phase to complete these fields.</p>
        </div>
      )}

      {/* Answers review */}
      {sections.map(section => {
        const sectionQs = questions.filter(q => q.section === section);
        return (
          <div key={section} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2" style={{ background: "#F0F7FF" }}>
              <h3 className="font-bold text-sm" style={{ color: "#022A5B" }}>{section}</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {sectionQs.map(q => {
                const ans = answers[q.question_key];
                const val = ans?.answer_value;
                const missing = q.is_required && (!val || val.trim() === "");
                return (
                  <div key={q.question_key} className={`px-4 py-3 flex items-start justify-between gap-3 ${missing ? "bg-red-50" : ""}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">{q.question_text}</p>
                      <p className={`text-sm font-semibold mt-0.5 ${missing ? "text-red-500" : "text-gray-900"}`}>
                        {missing ? "— Not answered —" : (val === "true" ? "Yes" : val === "false" ? "No" : val)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {ans?.was_prefilled && !ans?.was_edited && (
                        <span className="flex items-center gap-1 text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                          <Zap className="w-3 h-3" /> Auto
                        </span>
                      )}
                      {missing
                        ? <AlertTriangle className="w-4 h-4 text-red-400" />
                        : <CheckCircle2 className="w-4 h-4 text-green-500" />
                      }
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Document checklist */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2" style={{ background: "#F0F7FF" }}>
          <FileText className="w-4 h-4" style={{ color: "#025799" }} />
          <h3 className="font-bold text-sm" style={{ color: "#022A5B" }}>Required Documents</h3>
          <span className="ml-auto text-xs text-gray-400">Check when ready</span>
        </div>
        <div className="divide-y divide-gray-50">
          {documents.map(doc => {
            const isReady = docStatuses[doc.label] === "ready";
            return (
              <div key={doc.label} className="px-4 py-3">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleDocStatus(doc)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                      isReady ? "bg-green-500 border-green-500" : "border-gray-300 hover:border-blue-400"
                    }`}
                  >
                    {isReady && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </button>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${isReady ? "text-gray-400 line-through" : "text-gray-800"}`}>
                      {doc.label}
                      {doc.is_required && <span className="text-red-500 ml-1">*</span>}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{doc.description}</p>
                    {doc.city_system_field && (
                      <p className="text-xs text-blue-500 mt-0.5">Upload in: {doc.city_system_field}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Portal link */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3">
        <ExternalLink className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-800">City of Weston Permit Portal</p>
          <p className="text-xs text-blue-600 mt-0.5">You'll submit your application at:</p>
          <a href="https://www.westonfl.org/Permits" target="_blank" rel="noopener noreferrer"
            className="text-xs font-mono text-blue-700 hover:underline">westonfl.org/Permits</a>
        </div>
      </div>

      <button
        onClick={handleProceed}
        disabled={!canProceed || proceeding}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50 transition-opacity hover:opacity-90"
        style={{ background: "#022A5B" }}
      >
        {proceeding ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Continue to Guided Submission →
      </button>
    </div>
  );
}