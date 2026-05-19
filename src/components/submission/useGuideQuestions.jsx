/**
 * Loads CityApplicationQuestions for a given guide,
 * merges with existing SubmissionAnswers,
 * and applies prefill logic (App Mode only).
 */
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { buildPrefillMap } from "./usePrefill";

const WESTON_QUESTION_BANK = {
  "Roofing — Full Replacement": [
    { section: "Property Information", question_key: "property_address", question_text: "What is the property address?", input_type: "address", is_required: true, display_order: 1, prefill_from: "property.full_address", target_system_field: "Property Address", target_system_section: "Property" },
    { section: "Property Information", question_key: "folio_number", question_text: "BCPA Folio Number", input_type: "text", is_required: true, display_order: 2, prefill_from: "property.FOLIO_NUMBER", target_system_field: "Parcel / Folio Number", target_system_section: "Property" },
    { section: "Property Information", question_key: "owner_name", question_text: "Property Owner's Full Name", input_type: "text", is_required: true, display_order: 3, prefill_from: "property.NAME_LINE_1", target_system_field: "Owner Name", target_system_section: "Property" },
    { section: "Property Information", question_key: "is_homestead", question_text: "Is the property homestead-exempt?", input_type: "boolean", is_required: false, display_order: 4, prefill_from: "property.HOMESTEAD_FLAG", target_system_field: "Homestead", target_system_section: "Property" },
    { section: "Project Details", question_key: "job_value", question_text: "Total estimated job value (labor + materials)?", input_type: "number", is_required: true, display_order: 5, prefill_from: "project.estimated_cost", target_system_field: "Job Value ($)", target_system_section: "Job Details" },
    { section: "Project Details", question_key: "roof_area_sqft", question_text: "Total roof area to be replaced (sq ft)?", input_type: "number", is_required: true, display_order: 6, target_system_field: "Roof Area (SF)", target_system_section: "Job Details" },
    { section: "Project Details", question_key: "roof_material", question_text: "New roofing material type?", input_type: "select", is_required: true, display_order: 7, options: JSON.stringify(["Asphalt Shingles","Tile (Concrete)","Tile (Clay)","Metal","Modified Bitumen","Flat / Built-Up"]), target_system_field: "Roof Type", target_system_section: "Job Details" },
    { section: "Project Details", question_key: "noa_number", question_text: "Florida Product Approval (NOA) Number for new roofing material?", input_type: "text", is_required: true, display_order: 8, target_system_field: "NOA Number", target_system_section: "Job Details" },
    { section: "Contractor Information", question_key: "contractor_name", question_text: "Licensed Contractor Company Name", input_type: "text", is_required: true, display_order: 9, prefill_from: "contractor.company_name", target_system_field: "Contractor Name", target_system_section: "Contractor" },
    { section: "Contractor Information", question_key: "contractor_license", question_text: "Contractor State License Number", input_type: "text", is_required: true, display_order: 10, prefill_from: "contractor.license_number", target_system_field: "License Number", target_system_section: "Contractor" },
    { section: "Contractor Information", question_key: "contractor_phone", question_text: "Contractor Phone Number", input_type: "text", is_required: true, display_order: 11, prefill_from: "contractor.phone", target_system_field: "Contractor Phone", target_system_section: "Contractor" },
    { section: "Notices", question_key: "noc_required", question_text: "Is a Notice of Commencement (NOC) required?", input_type: "boolean", is_required: false, display_order: 12, target_system_field: "NOC Required", target_system_section: "Notices" },
  ],
  "HVAC / A/C Replacement": [
    { section: "Property Information", question_key: "property_address", question_text: "Property Address", input_type: "address", is_required: true, display_order: 1, prefill_from: "property.full_address", target_system_field: "Property Address", target_system_section: "Property" },
    { section: "Property Information", question_key: "folio_number", question_text: "BCPA Folio Number", input_type: "text", is_required: true, display_order: 2, prefill_from: "property.FOLIO_NUMBER", target_system_field: "Parcel / Folio Number", target_system_section: "Property" },
    { section: "Property Information", question_key: "owner_name", question_text: "Property Owner's Full Name", input_type: "text", is_required: true, display_order: 3, prefill_from: "property.NAME_LINE_1", target_system_field: "Owner Name", target_system_section: "Property" },
    { section: "Project Details", question_key: "job_value", question_text: "Total estimated job value ($)?", input_type: "number", is_required: true, display_order: 4, prefill_from: "project.estimated_cost", target_system_field: "Job Value ($)", target_system_section: "Job Details" },
    { section: "Project Details", question_key: "system_type", question_text: "Type of HVAC system?", input_type: "select", is_required: true, display_order: 5, options: JSON.stringify(["Split System","Package Unit","Mini-Split","Heat Pump","Air Handler Only","Condenser Only"]), target_system_field: "Equipment Type", target_system_section: "Job Details" },
    { section: "Project Details", question_key: "system_tons", question_text: "System capacity (tons)?", input_type: "number", is_required: true, display_order: 6, target_system_field: "Tonnage", target_system_section: "Job Details" },
    { section: "Project Details", question_key: "model_number", question_text: "Equipment Model Number", input_type: "text", is_required: true, display_order: 7, target_system_field: "Model Number", target_system_section: "Job Details" },
    { section: "Contractor Information", question_key: "contractor_name", question_text: "Licensed Contractor Name", input_type: "text", is_required: true, display_order: 8, prefill_from: "contractor.company_name", target_system_field: "Contractor Name", target_system_section: "Contractor" },
    { section: "Contractor Information", question_key: "contractor_license", question_text: "Contractor License Number", input_type: "text", is_required: true, display_order: 9, prefill_from: "contractor.license_number", target_system_field: "License Number", target_system_section: "Contractor" },
  ],
  "Window Replacement": [
    { section: "Property Information", question_key: "property_address", question_text: "Property Address", input_type: "address", is_required: true, display_order: 1, prefill_from: "property.full_address", target_system_field: "Property Address", target_system_section: "Property" },
    { section: "Property Information", question_key: "folio_number", question_text: "BCPA Folio Number", input_type: "text", is_required: true, display_order: 2, prefill_from: "property.FOLIO_NUMBER", target_system_field: "Parcel / Folio Number", target_system_section: "Property" },
    { section: "Property Information", question_key: "owner_name", question_text: "Property Owner's Full Name", input_type: "text", is_required: true, display_order: 3, prefill_from: "property.NAME_LINE_1", target_system_field: "Owner Name", target_system_section: "Property" },
    { section: "Project Details", question_key: "job_value", question_text: "Total job value ($)?", input_type: "number", is_required: true, display_order: 4, prefill_from: "project.estimated_cost", target_system_field: "Job Value ($)", target_system_section: "Job Details" },
    { section: "Project Details", question_key: "window_count", question_text: "Number of windows being replaced?", input_type: "number", is_required: true, display_order: 5, target_system_field: "Number of Openings", target_system_section: "Job Details" },
    { section: "Project Details", question_key: "noa_number", question_text: "Impact Window Florida Product Approval (NOA) Number", input_type: "text", is_required: true, display_order: 6, target_system_field: "NOA Number", target_system_section: "Job Details" },
    { section: "Contractor Information", question_key: "contractor_name", question_text: "Licensed Contractor Name", input_type: "text", is_required: true, display_order: 7, prefill_from: "contractor.company_name", target_system_field: "Contractor Name", target_system_section: "Contractor" },
    { section: "Contractor Information", question_key: "contractor_license", question_text: "Contractor License Number", input_type: "text", is_required: true, display_order: 8, prefill_from: "contractor.license_number", target_system_field: "License Number", target_system_section: "Contractor" },
  ],
  "Screen Enclosure": [
    { section: "Property Information", question_key: "property_address", question_text: "Property Address", input_type: "address", is_required: true, display_order: 1, prefill_from: "property.full_address", target_system_field: "Property Address", target_system_section: "Property" },
    { section: "Property Information", question_key: "folio_number", question_text: "BCPA Folio Number", input_type: "text", is_required: true, display_order: 2, prefill_from: "property.FOLIO_NUMBER", target_system_field: "Parcel / Folio Number", target_system_section: "Property" },
    { section: "Property Information", question_key: "owner_name", question_text: "Property Owner's Full Name", input_type: "text", is_required: true, display_order: 3, prefill_from: "property.NAME_LINE_1", target_system_field: "Owner Name", target_system_section: "Property" },
    { section: "Project Details", question_key: "job_value", question_text: "Total estimated job value ($)?", input_type: "number", is_required: true, display_order: 4, prefill_from: "project.estimated_cost", target_system_field: "Job Value ($)", target_system_section: "Job Details" },
    { section: "Project Details", question_key: "scope_of_work", question_text: "Describe the enclosure (size, type, attachment method)", input_type: "text", is_required: true, display_order: 5, target_system_field: "Description of Work", target_system_section: "Job Details" },
    { section: "Contractor Information", question_key: "contractor_name", question_text: "Licensed Contractor Name", input_type: "text", is_required: true, display_order: 6, prefill_from: "contractor.company_name", target_system_field: "Contractor Name", target_system_section: "Contractor" },
    { section: "Contractor Information", question_key: "contractor_license", question_text: "Contractor License Number", input_type: "text", is_required: true, display_order: 7, prefill_from: "contractor.license_number", target_system_field: "License Number", target_system_section: "Contractor" },
    { section: "Notices", question_key: "noc_required", question_text: "Is a Notice of Commencement (NOC) required?", input_type: "boolean", is_required: false, display_order: 8, target_system_field: "NOC Required", target_system_section: "Notices" },
  ],
  "New Pool": [
    { section: "Property Information", question_key: "property_address", question_text: "Property Address", input_type: "address", is_required: true, display_order: 1, prefill_from: "property.full_address", target_system_field: "Property Address", target_system_section: "Property" },
    { section: "Property Information", question_key: "folio_number", question_text: "BCPA Folio Number", input_type: "text", is_required: true, display_order: 2, prefill_from: "property.FOLIO_NUMBER", target_system_field: "Parcel / Folio Number", target_system_section: "Property" },
    { section: "Property Information", question_key: "owner_name", question_text: "Property Owner's Full Name", input_type: "text", is_required: true, display_order: 3, prefill_from: "property.NAME_LINE_1", target_system_field: "Owner Name", target_system_section: "Property" },
    { section: "Project Details", question_key: "job_value", question_text: "Total estimated construction cost ($)?", input_type: "number", is_required: true, display_order: 4, prefill_from: "project.estimated_cost", target_system_field: "Job Value ($)", target_system_section: "Job Details" },
    { section: "Project Details", question_key: "scope_of_work", question_text: "Pool type and dimensions (e.g. 15x30 gunite with spa)", input_type: "text", is_required: true, display_order: 5, target_system_field: "Description of Work", target_system_section: "Job Details" },
    { section: "Project Details", question_key: "noc_required", question_text: "Will a Notice of Commencement be recorded?", input_type: "boolean", is_required: true, display_order: 6, target_system_field: "NOC Required", target_system_section: "Notices" },
    { section: "Contractor Information", question_key: "contractor_name", question_text: "Licensed Pool Contractor Name", input_type: "text", is_required: true, display_order: 7, prefill_from: "contractor.company_name", target_system_field: "Contractor Name", target_system_section: "Contractor" },
    { section: "Contractor Information", question_key: "contractor_license", question_text: "Contractor License Number (CPC...)", input_type: "text", is_required: true, display_order: 8, prefill_from: "contractor.license_number", target_system_field: "License Number", target_system_section: "Contractor" },
  ],
};

function getDefaultQuestions() {
  return [
    { section: "Property Information", question_key: "property_address", question_text: "Property Address", input_type: "address", is_required: true, display_order: 1, prefill_from: "property.full_address", target_system_field: "Property Address", target_system_section: "Property" },
    { section: "Property Information", question_key: "folio_number", question_text: "BCPA Folio Number", input_type: "text", is_required: true, display_order: 2, prefill_from: "property.FOLIO_NUMBER", target_system_field: "Parcel / Folio Number", target_system_section: "Property" },
    { section: "Property Information", question_key: "owner_name", question_text: "Property Owner's Full Name", input_type: "text", is_required: true, display_order: 3, prefill_from: "property.NAME_LINE_1", target_system_field: "Owner Name", target_system_section: "Property" },
    { section: "Project Details", question_key: "job_value", question_text: "Total estimated job value (labor + materials)?", input_type: "number", is_required: true, display_order: 4, prefill_from: "project.estimated_cost", target_system_field: "Job Value ($)", target_system_section: "Job Details" },
    { section: "Project Details", question_key: "scope_of_work", question_text: "Describe the scope of work", input_type: "text", is_required: true, display_order: 5, prefill_from: "project.description", target_system_field: "Description of Work", target_system_section: "Job Details" },
    { section: "Contractor Information", question_key: "contractor_name", question_text: "Licensed Contractor Name (if applicable)", input_type: "text", is_required: false, display_order: 6, prefill_from: "contractor.company_name", target_system_field: "Contractor Name", target_system_section: "Contractor" },
    { section: "Contractor Information", question_key: "contractor_license", question_text: "Contractor License Number", input_type: "text", is_required: false, display_order: 7, prefill_from: "contractor.license_number", target_system_field: "License Number", target_system_section: "Contractor" },
    { section: "Notices", question_key: "noc_required", question_text: "Is a Notice of Commencement (NOC) required? (Job value > $2,500)", input_type: "boolean", is_required: false, display_order: 8, target_system_field: "NOC Required", target_system_section: "Notices" },
  ];
}

export function useGuideQuestions(guide, currentUser, mode = "app") {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [prefillMap, setPrefillMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!guide) return;
    // Web mode: no currentUser needed
    if (mode === "web" || currentUser) load();
  }, [guide?.id, currentUser?.email, mode]);

  const load = async () => {
    setLoading(true);

    // 1. Load questions
    let dbQuestions = [];
    try {
      dbQuestions = await base44.entities.CityApplicationQuestion.filter({
        city_name: guide.city_name,
        permit_type_name: guide.permit_type_name,
      }, "display_order");
    } catch {}

    let qs = dbQuestions.length > 0
      ? dbQuestions
      : (WESTON_QUESTION_BANK[guide.permit_type_name] || getDefaultQuestions());
    qs = [...qs].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    setQuestions(qs);

    // 2. Prefill map — only in app mode
    let pmap = {};
    if (mode === "app" && currentUser) {
      pmap = await buildPrefillMap(guide, currentUser);
    }
    setPrefillMap(pmap);

    // 3. Load existing answers
    let existingAnswers = [];
    try {
      existingAnswers = await base44.entities.SubmissionAnswer.filter({ guide_id: guide.id });
    } catch {}
    const aMap = {};
    existingAnswers.forEach(a => { aMap[a.question_key] = a; });

    // 4. Apply prefill for unanswered questions (app mode only)
    if (mode === "app") {
      qs.forEach(q => {
        if (!aMap[q.question_key] && q.prefill_from && pmap[q.prefill_from]) {
          aMap[q.question_key] = {
            _pending: true,
            guide_id: guide.id,
            question_key: q.question_key,
            question_text: q.question_text,
            answer_value: pmap[q.prefill_from],
            was_prefilled: true,
            prefill_source: q.prefill_from,
            was_edited: false,
          };
        }
      });
    }

    setAnswers(aMap);
    setLoading(false);
  };

  return { questions, answers, setAnswers, prefillMap, loading, reload: load };
}