import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import {
  CheckCircle2, XCircle, AlertTriangle, Info,
  Phone, ExternalLink, RefreshCw, Save, Loader2,
  ChevronDown, ChevronUp, ArrowRight
} from "lucide-react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const CITIES = ["Weston", "Hollywood", "Coral Springs", "Cooper City", "Fort Lauderdale", "Sunrise"];

const CITY_CONTACTS = {
  'Weston':          { phone: '(954) 385-2600', address: '17200 Royal Palm Blvd, Weston, FL 33326',           portal: 'https://www.westonfl.org/Permits',               hours: 'Mon–Fri, 8:00 AM – 4:30 PM' },
  'Hollywood':       { phone: '(954) 967-4500', address: '2600 Hollywood Blvd, Hollywood, FL 33020',           portal: 'https://www.hollywoodfl.org/permits',             hours: 'Mon–Fri, 8:00 AM – 4:30 PM' },
  'Coral Springs':   { phone: '(954) 344-1000', address: '9551 W. Sample Rd, Coral Springs, FL 33065',         portal: 'https://www.coralsprings.org/permits',            hours: 'Mon–Fri, 8:00 AM – 4:30 PM' },
  'Cooper City':     { phone: '(954) 434-4300', address: '9090 SW 50th Pl, Cooper City, FL 33328',             portal: 'https://www.coopercityfl.org/permits',            hours: 'Mon–Fri, 8:00 AM – 4:30 PM' },
  'Fort Lauderdale': { phone: '(954) 828-5900', address: '700 NW 19th Ave, Fort Lauderdale, FL 33311',         portal: 'https://lauderbuild.fortlauderdale.gov',          hours: 'Mon–Fri, 8:00 AM – 4:30 PM' },
  'Sunrise':         { phone: '(954) 746-3440', address: '10770 W. Oakland Park Blvd, Sunrise, FL 33351',      portal: 'https://www.sunrisefl.gov/permits',               hours: 'Mon–Fri, 8:00 AM – 4:30 PM' },
};

const FEES = {
  'Weston': {
    hvac:               { label: 'Flat fee: $205.04 + Tech/Admin: $127.00', total: 332.04 },
    water_heater:       { label: 'Flat fee: $205.04 + Tech/Admin: $127.00', total: 332.04 },
    fence_gate:         { label: 'Base: $205.04 + per linear ft + Tech/Admin: $127.00', total: null },
    pool_spa:           { label: 'Flat fee: $1,145.83 + Tech/Admin: $127.00', total: 1272.83 },
    generator:          { label: 'Flat fee: $350.00 + Tech/Admin: $127.00', total: 477.00 },
    solar:              { label: 'Base: $119.11 + 1.55% of job value + Tech/Admin: $127.00', total: null },
    roof:               { label: 'Base: $119.11 + 1.55% of job value + Tech/Admin: $127.00', total: null },
    windows_doors:      { label: 'Base: $119.11 + 1.55% of job value + Tech/Admin: $127.00', total: null },
    hurricane_shutters: { label: 'Base: $115.79 + per opening + Tech/Admin: $127.00', total: null },
    room_addition:      { label: 'Base: $119.11 + 1.55% of job value + Tech/Admin: $127.00', total: null },
  },
  'Hollywood': {
    hvac:               { label: 'Base: $100.00 + 2.20% of value + Tech/Admin: $50.00', total: null },
    water_heater:       { label: 'Base: $100.00 + Tech/Admin: $50.00', total: 150.00 },
    roof:               { label: 'Base: $100.00 + 2.20% of job value + Tech/Admin: $50.00', total: null },
    pool_spa:           { label: 'Base: $100.00 + 2.20% of value + Tech/Admin: $50.00', total: null },
    generator:          { label: 'Base: $100.00 + 2.20% of value + Tech/Admin: $50.00', total: null },
    solar:              { label: 'Base: $100.00 + 2.20% of value + Tech/Admin: $50.00', total: null },
    windows_doors:      { label: 'Base: $100.00 + 2.20% of value + Tech/Admin: $50.00', total: null },
    hurricane_shutters: { label: 'Base: $100.00 + 2.20% of value + Tech/Admin: $50.00', total: null },
    room_addition:      { label: 'Base: $100.00 + 2.20% of value + Tech/Admin: $50.00', total: null },
    fence_gate:         { label: 'Base: $100.00 + 2.20% of value + Tech/Admin: $50.00', total: null },
  },
  'Coral Springs': {
    hvac:               { label: 'Base: $54.55 + 0.14% of value + Tech/Admin: $54.55', total: null },
    water_heater:       { label: 'Base: $54.55 + 0.15% of value + Tech/Admin: $54.55', total: null },
    roof:               { label: 'Base: $54.55 + 2.80% of job value + Tech/Admin: $54.55', total: null },
    pool_spa:           { label: 'Base: $54.55 + 4.80% of value + Tech/Admin: $54.55', total: null },
    solar:              { label: 'Base: $54.55 + 0.31% of value + Tech/Admin: $54.55', total: null },
    windows_doors:      { label: 'Base: $54.55 + 2.80% of value + Tech/Admin: $54.55', total: null },
    hurricane_shutters: { label: 'Base: $54.55 + 2.80% of value + Tech/Admin: $54.55', total: null },
    room_addition:      { label: 'Base: $54.55 + 5.30% of value + Tech/Admin: $54.55', total: null },
    fence_gate:         { label: 'Base: $54.55 + 2.80% of value + Tech/Admin: $54.55', total: null },
  },
  'Cooper City': {
    hvac:               { label: 'Base: $125.00 + 1.85% of value + Tech/Admin: $50.00', total: null },
    water_heater:       { label: 'Base: $125.00 + 1.85% of value + Tech/Admin: $50.00', total: null },
    roof:               { label: 'Base: $125.00 + 1.85% of job value + Tech/Admin: $50.00', total: null },
    pool_spa:           { label: 'Base: $125.00 + 1.85% of value + Tech/Admin: $50.00', total: null },
    generator:          { label: 'Base: $125.00 + 1.85% of value + Tech/Admin: $50.00', total: null },
    solar:              { label: 'Base: $125.00 + 1.85% of value + Tech/Admin: $50.00', total: null },
    windows_doors:      { label: 'Base: $125.00 + 1.85% of value + Tech/Admin: $50.00', total: null },
    hurricane_shutters: { label: 'Base: $125.00 + 1.85% of value + Tech/Admin: $50.00', total: null },
    room_addition:      { label: 'Base: $125.00 + 1.85% of value + Tech/Admin: $50.00', total: null },
    fence_gate:         { label: 'Base: $125.00 + 1.85% of value + Tech/Admin: $50.00', total: null },
  },
  'Fort Lauderdale': {
    hvac:               { label: 'Base: $125.00 + 1.85% of value + Tech/Admin: $50.00', total: null },
    water_heater:       { label: 'Base: $125.00 + 1.85% of value + Tech/Admin: $50.00', total: null },
    roof:               { label: 'Base: $125.00 + 1.85% of job value + Tech/Admin: $50.00', total: null },
    pool_spa:           { label: 'Base: $125.00 + 1.85% of value + Tech/Admin: $50.00', total: null },
    generator:          { label: 'Base: $125.00 + 1.85% of value + Tech/Admin: $50.00', total: null },
    solar:              { label: 'Base: $125.00 + 1.85% of value + Tech/Admin: $50.00', total: null },
    windows_doors:      { label: 'Base: $125.00 + 1.85% of value + Tech/Admin: $50.00', total: null },
    hurricane_shutters: { label: 'Base: $125.00 + 1.85% of value + Tech/Admin: $50.00', total: null },
    room_addition:      { label: 'Base: $125.00 + 1.85% of value + Tech/Admin: $50.00', total: null },
    fence_gate:         { label: 'Base: $125.00 + 1.85% of value + Tech/Admin: $50.00', total: null },
  },
  'Sunrise': {
    hvac:               { label: 'Flat: $208.45 + Tech/Admin: $80.18', total: 288.63 },
    water_heater:       { label: 'Flat: $208.45 + Tech/Admin: $80.18', total: 288.63 },
    roof:               { label: 'Flat: $416.91 + Tech/Admin: $80.18', total: 497.09 },
    pool_spa:           { label: 'Structural: $310.01 + Electrical: $726.92 + Plumbing: $416.91 + Tech: $80.18', total: 1614.20 },
    generator:          { label: 'Flat: $416.91 + Tech/Admin: $80.18', total: 497.09 },
    solar:              { label: 'Flat: $416.91 + Tech/Admin: $80.18', total: 497.09 },
    windows_doors:      { label: 'Flat: $310.01 + Tech/Admin: $80.18', total: 390.19 },
    hurricane_shutters: { label: 'Flat: $310.01 + Tech/Admin: $80.18', total: 390.19 },
    room_addition:      { label: 'Base: $208.46 + 4.40% of value + Tech/Admin: $80.18', total: null },
    fence_gate:         { label: 'Flat: $208.45 + Tech/Admin: $80.18', total: 288.63 },
  },
};

const CITY_RULES = {
  'Weston': [
    { text: 'Fences of ANY height require a building permit', type: 'required', source: 'Weston Code of Ordinances' },
    { text: 'Accessory structures ≥ 100 sq ft require a permit', type: 'required', source: 'Weston Building Dept' },
    { text: 'Structures under 100 sq ft with no utilities are exempt', type: 'exempt', source: 'FBC-R R105.2' },
    { text: 'Cosmetic work (paint, flooring, tile, countertops) is exempt', type: 'exempt', source: 'FBC-R R105.2' },
  ],
  'Hollywood': [
    { text: 'Fences may require a permit — verify with building department', type: 'verify', source: 'Hollywood Building Dept' },
    { text: 'Accessory structures under 150 sq ft with no utilities are generally exempt', type: 'exempt', source: 'FBC-R R105.2' },
    { text: 'Cosmetic work is exempt', type: 'exempt', source: 'FBC-R R105.2' },
  ],
  'Coral Springs': [
    { text: 'Fences require a permit regardless of height', type: 'required', source: 'Coral Springs Ordinances' },
    { text: 'Accessory structures ≥ 100 sq ft require a permit', type: 'required', source: 'Coral Springs Building Dept' },
    { text: 'Cosmetic work is exempt', type: 'exempt', source: 'FBC-R R105.2' },
  ],
  'Cooper City': [
    { text: 'Fences require a permit', type: 'required', source: 'Cooper City Ordinances' },
    { text: 'All permit applications must be notarized before submission', type: 'note', source: 'Cooper City Building Dept' },
    { text: 'Accessory structures under 150 sq ft with no utilities are generally exempt', type: 'exempt', source: 'FBC-R R105.2' },
  ],
  'Fort Lauderdale': [
    { text: 'Verify all work through LauderBuild at lauderbuild.fortlauderdale.gov', type: 'note', source: 'LauderBuild' },
    { text: 'Fort Lauderdale uses the Accela permit system — an account is required', type: 'note', source: 'LauderBuild' },
  ],
  'Sunrise': [
    { text: 'Fences may require a permit — verify with building department', type: 'verify', source: 'Sunrise Building Dept' },
    { text: 'Accessory structures under 150 sq ft with no utilities are generally exempt', type: 'exempt', source: 'FBC-R R105.2' },
  ],
};

const WORK_RULES = {
  hvac:               { title: 'All HVAC replacements require a mechanical permit — no exceptions', body: 'Florida Building Code FBC-R M1401.1 requires a mechanical permit for all HVAC system installations and replacements. This applies regardless of whether it is a like-for-like replacement. A Notice of Commencement (NOC) is also required if the job value exceeds $15,000.', code: 'FBC-R M1401.1' },
  water_heater:       { title: 'All water heater replacements require a plumbing permit — including tankless', body: 'Florida Building Code FBC-R P2801.1 requires a permit for all water heater installations. Many homeowners are surprised by this — it applies to every type: electric, gas, and tankless. The inspection verifies proper installation, T&P relief valve, and expansion tank if needed.', code: 'FBC-R P2801.1' },
  electrical:         { title: 'New circuits, panel upgrades, and service changes require an electrical permit', body: 'Florida Building Code FBC-R E3401.1 requires permits for all new electrical wiring, panel upgrades, and service changes. Replacing an outlet or switch on an existing circuit may be exempt, but any new wiring is not.', code: 'FBC-R E3401.1' },
  roof:               { title: 'Full roof replacements require a building permit and inspection', body: 'All Broward County cities require a permit for full roof replacement. This includes a required dry-in inspection and final inspection. Florida Product Approval (NOA) documentation is required for all roofing materials.', code: 'FBC-R R105.1' },
  solar:              { title: 'Solar panel systems require both an electrical permit and a structural permit', body: 'Solar installations require a building permit (structural) and an electrical permit. All panels must have a Florida Product Approval. FPL utility interconnection approval is also required before final inspection.', code: 'FBC-R R105.1' },
  generator:          { title: 'Standby generators require an electrical permit and may require a gas permit', body: 'All standby generator installations require an electrical permit. If connected to natural gas or propane, a separate gas piping permit is required. Generators must meet setback requirements from property lines and openings.', code: 'FBC-R M1401.1' },
  pool_spa:           { title: 'All pools over 24 inches deep require a permit and a safety barrier', body: 'Florida law (FS 515.25) requires a permit for all residential swimming pools. A pool safety barrier must be installed before final inspection. Pool permits include structural, electrical, plumbing, and mechanical sub-permits.', code: 'FS 515.25' },
  hurricane_shutters: { title: 'All hurricane protection installations require a permit', body: 'Broward County and all its cities require permits for all hurricane protection. All products must have a Florida Product Approval (NOA). A final inspection is required to verify proper installation.', code: 'FBC-R R105.1' },
  room_addition:      { title: 'Room additions and structural changes always require permits', body: 'Any expansion of living space requires a building permit. Room additions typically require: building, electrical, plumbing (if applicable), and mechanical sub-permits. Engineered plans signed and sealed by a Florida licensed engineer are required.', code: 'FBC-R R105.1' },
  windows_doors:      { title: 'Impact-rated windows and doors require a permit and Florida Product Approval', body: 'All window and door replacements with impact-rated products require a building permit. A Florida Product Approval (NOA) must be submitted with the application. A final inspection verifies proper installation.', code: 'FBC-R R105.1' },
  fence_gate:         { title: 'Your city requires a permit for fence installations', body: 'While Florida Building Code (FBC-R R105.2) may exempt fences under 6 ft at the state level, your city (as the Authority Having Jurisdiction) requires a permit for all fence installations. The city can and does set stricter requirements than the state code.', code: 'FBC-R R105.2 (AHJ override)' },
  shed_pergola:       { title: 'A permit is required for accessory structures this size in your city', body: 'While Florida Building Code exempts detached accessory structures under 150 sq ft with no utilities, your city requires permits for structures at or above 100 sq ft. This is a common city-specific requirement in Broward County.', code: 'FBC-R R105.2 (AHJ override)' },
};

const FAQS = [
  { q: 'Do I need a permit to replace my AC unit?', a: 'Yes — always. HVAC replacement requires a mechanical permit in all Florida cities. No exceptions. A Notice of Commencement is also required if job value exceeds $15,000.' },
  { q: 'Do I need a permit to replace my water heater?', a: 'Yes — always. A plumbing permit is required for all water heater replacements in Florida, including tankless water heaters. This surprises many homeowners.' },
  { q: 'Is painting my house exterior exempt?', a: 'Yes. Exterior and interior painting is exempt under FBC-R R105.2. However, if the project involves stucco repair or structural patching, a permit may be required for that portion of the work.' },
  { q: 'Does HB 837 mean I never need a permit under $2,500?', a: 'No. HB 837 provides a possible exemption for some residential work under $2,500, but it does NOT apply to electrical, plumbing, mechanical, or structural work. HVAC and water heater replacements always require permits.' },
  { q: 'Do I need a permit for a small shed?', a: 'Under Florida Building Code, detached accessory structures under 150 sq ft with no utilities may be exempt. However, Weston and Coral Springs require permits for sheds 100 sq ft and over. Always verify with your city.' },
  { q: 'Can I pull my own permit as a homeowner?', a: 'Yes. Under Florida Statute 489.103(7), homeowners can pull permits for their primary residence without a contractor license. You must personally appear at the building department and sign an Owner-Builder Disclosure Statement.' },
];

const INITIAL_ANSWERS = {
  city: '', propertyType: '', workType: '',
  fenceHeight: '', fenceMaterial: '', fenceOnFront: '',
  shedSqft: '', shedHasUtilities: '', shedPrefab: '',
  roofWorkType: '', hasStructuralChanges: '', hasNewElectrical: '',
  isLikeForLike: '', waterHeaterType: '',
  isImpactRated: '', numberOfOpenings: '',
  poolDepthInches: '', poolIsPrefab: '',
  hasStructuralRepair: '', hasNewWiring: '',
  projectCost: '', isPrimaryResidence: '',
};

// ─── CALCULATION ──────────────────────────────────────────────────────────────

function calculateResult(answers) {
  const { city, propertyType, workType, fenceHeight, shedSqft, shedHasUtilities,
    roofWorkType, hasStructuralChanges, hasNewElectrical, isImpactRated,
    poolDepthInches, poolIsPrefab, hasStructuralRepair, hasNewWiring,
    projectCost, isPrimaryResidence } = answers;

  const cost       = parseFloat(projectCost) || 0;
  const fenceH     = parseFloat(fenceHeight) || 0;
  const shedSF     = parseFloat(shedSqft) || 0;
  const poolDepth  = parseFloat(poolDepthInches) || 0;
  const strictFenceCities = ['Weston', 'Coral Springs', 'Cooper City'];
  const strictShedCities  = ['Weston', 'Coral Springs'];

  if (workType === 'painting_cosmetic' && hasStructuralChanges === 'No' && hasNewElectrical === 'No')
    return { result: 'exempt', reason: 'Painting, flooring, tile, countertops, and cabinet work are exempt under FBC-R R105.2. No structural changes or new utilities are involved.', code: 'FBC-R R105.2' };

  if (workType === 'minor_repairs' && hasStructuralRepair === 'No' && hasNewWiring === 'No')
    return { result: 'exempt', reason: 'Minor repairs such as replacing faucets, toilets, outlets/switches on existing circuits, and patching walls are exempt under FBC-R R105.2.', code: 'FBC-R R105.2' };

  if (workType === 'landscaping')
    return { result: 'exempt', reason: 'General landscaping, lawn maintenance, and irrigation repairs (not new systems) are exempt from building permits.', code: 'FBC-R R105.2' };

  if (workType === 'shed_pergola' && shedSF < 100 && shedHasUtilities === 'No')
    return { result: 'exempt', reason: `A detached accessory structure under 100 sq ft with no utilities is exempt in ${city} and under Florida Building Code.`, code: 'FBC-R R105.2' };

  if (workType === 'pool_spa' && poolDepth < 24 && poolIsPrefab === 'Yes')
    return { result: 'exempt', reason: 'Pre-fabricated pools less than 24 inches deep are exempt under FBC-R R105.2.', code: 'FBC-R R105.2' };

  if (workType === 'fence_gate' && !strictFenceCities.includes(city) && fenceH <= 6 && city !== 'Fort Lauderdale')
    return { result: 'likely_exempt', reason: `Fences 6 feet or under may be exempt under FBC-R R105.2 in ${city}. However, verify with the building department before installing.`, code: 'FBC-R R105.2' };

  const hb837ExcludedTypes = ['hvac', 'water_heater', 'electrical', 'pool_spa', 'solar', 'generator', 'room_addition', 'structural'];
  if (cost > 0 && cost < 2500 && propertyType === 'single_family' && !hb837ExcludedTypes.includes(workType))
    return { result: 'likely_exempt', reason: 'Florida HB 837 (effective July 1, 2024) may exempt residential projects under $2,500 for single-family homes. This does NOT apply to electrical, plumbing, mechanical, or structural work. Always verify with your city before starting.', code: 'HB 837 / FS 553.79' };

  if (workType === 'fence_gate' && (strictFenceCities.includes(city) || city === 'Fort Lauderdale'))
    return { result: 'may_need_permit', reason: `While Florida Building Code may exempt fences under 6 ft, ${city} requires a permit for fence installations regardless of height.`, city_rule: true };

  if (workType === 'shed_pergola' && shedSF >= 100 && shedSF < 150 && !strictShedCities.includes(city) && shedHasUtilities === 'No')
    return { result: 'may_need_permit', reason: 'A shed between 100–150 sq ft may be exempt under Florida Building Code, but your city may require a permit. Verify before building.', city_rule: true };

  if (workType === 'shed_pergola' && shedSF >= 100 && strictShedCities.includes(city))
    return { result: 'permit_required', reason: `${city} requires a permit for accessory structures 100 sq ft or larger.`, ruleKey: 'shed_pergola' };

  if (workType === 'roof' && roofWorkType === 'partial_repair')
    return { result: 'may_need_permit', reason: 'Partial roof repairs may be exempt if they cover less than 25% of the total roof area. However, if the repair involves structural components or replaces more than 25%, a permit is required. Verify with your building department.', city_rule: false };

  if (workType === 'windows_doors' && isImpactRated === 'No')
    return { result: 'may_need_permit', reason: 'Non-impact window replacement may not require a permit in some cities. However, most Broward County cities require permits for all window/door replacements. Verify with your building department.', city_rule: false };

  if (workType === 'hvac')               return { result: 'permit_required', ruleKey: 'hvac' };
  if (workType === 'water_heater')       return { result: 'permit_required', ruleKey: 'water_heater' };
  if (workType === 'electrical')         return { result: 'permit_required', ruleKey: 'electrical' };
  if (workType === 'solar')              return { result: 'permit_required', ruleKey: 'solar' };
  if (workType === 'generator')          return { result: 'permit_required', ruleKey: 'generator' };
  if (workType === 'pool_spa')           return { result: 'permit_required', ruleKey: 'pool_spa' };
  if (workType === 'hurricane_shutters') return { result: 'permit_required', ruleKey: 'hurricane_shutters' };
  if (workType === 'room_addition')      return { result: 'permit_required', ruleKey: 'room_addition' };
  if (workType === 'roof' && roofWorkType !== 'partial_repair')
    return { result: 'permit_required', ruleKey: 'roof' };
  if (workType === 'windows_doors' && isImpactRated === 'Yes')
    return { result: 'permit_required', ruleKey: 'windows_doors' };
  if (workType === 'fence_gate' && fenceH > 6)
    return { result: 'permit_required', ruleKey: 'fence_gate', reason: 'Fences over 6 feet require a permit in all Florida cities.' };
  if (workType === 'shed_pergola' && shedHasUtilities === 'Yes')
    return { result: 'permit_required', ruleKey: 'shed_pergola', reason: 'Any accessory structure with electrical or plumbing connections requires a permit.' };
  if (workType === 'shed_pergola' && shedSF >= 150)
    return { result: 'permit_required', ruleKey: 'shed_pergola', reason: 'Accessory structures 150 sq ft or larger require a permit in all Florida cities.' };

  return { result: 'may_need_permit', reason: 'We could not determine a clear answer based on your responses. Please verify with your local building department.', city_rule: false };
}

// ─── SMALL SHARED COMPONENTS ─────────────────────────────────────────────────

const P = "Plus Jakarta Sans, system-ui, sans-serif";
const M = "Manrope, system-ui, sans-serif";

function SelectCard({ selected, onClick, children, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl border-2 p-4 transition-all cursor-pointer ${
        selected
          ? "border-[#1A56DB] bg-[#EBF5FF]"
          : "border-[#E8EAF0] bg-white hover:border-[#1A56DB]/40 hover:bg-[#F8FAFF]"
      } ${className}`}
    >
      {children}
    </button>
  );
}

function YesNo({ value, onChange }) {
  return (
    <div className="flex gap-3 mt-2">
      {["Yes", "No"].map(opt => (
        <button key={opt} onClick={() => onChange(opt)}
          className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
            value === opt ? "border-[#1A56DB] bg-[#EBF5FF] text-[#1A56DB]" : "border-[#E8EAF0] bg-white text-[#434654] hover:border-[#1A56DB]/40"
          }`} style={{ fontFamily: P }}>
          {opt}
        </button>
      ))}
    </div>
  );
}

function Label({ children }) {
  return <p className="text-sm font-bold text-[#191B23] mb-1" style={{ fontFamily: P }}>{children}</p>;
}

function StepProgress({ step }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {[1, 2, 3].map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
            step > s ? "bg-[#059669] text-white" : step === s ? "bg-[#1A56DB] text-white" : "bg-[#E8EAF0] text-[#9CA3AF]"
          }`} style={{ fontFamily: M }}>
            {step > s ? "✓" : s}
          </div>
          <span className={`text-xs font-semibold hidden sm:block ${step === s ? "text-[#1A56DB]" : "text-[#9CA3AF]"}`} style={{ fontFamily: P }}>
            {["City & Property", "Work Type", "Details"][i]}
          </span>
          {i < 2 && <div className={`flex-1 h-0.5 w-8 ${step > s + 1 ? "bg-[#059669]" : step > s ? "bg-[#1A56DB]" : "bg-[#E8EAF0]"}`} />}
        </div>
      ))}
    </div>
  );
}

function ContinueBtn({ onClick, disabled, label = "Continue →" }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="w-full py-3.5 rounded-xl font-bold text-base text-white transition-all"
      style={{ background: disabled ? "#C3C5D7" : "#1A56DB", fontFamily: P, cursor: disabled ? "not-allowed" : "pointer" }}>
      {label}
    </button>
  );
}

function CityContactCard({ city }) {
  const info = CITY_CONTACTS[city];
  if (!info) return null;
  return (
    <div className="bg-white rounded-2xl border border-[#E8EAF0] p-5 shadow-sm">
      <p className="text-sm font-bold text-[#191B23] mb-3" style={{ fontFamily: M }}>{city} Building Department</p>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-[#1A56DB] shrink-0" />
          <a href={`tel:${info.phone}`} className="text-sm font-bold text-[#1A56DB] hover:underline" style={{ fontFamily: P }}>{info.phone}</a>
        </div>
        <p className="text-xs text-[#6B7280] pl-6" style={{ fontFamily: P }}>{info.address}</p>
        <p className="text-xs text-[#6B7280] pl-6" style={{ fontFamily: P }}>Hours: {info.hours}</p>
        <div className="flex gap-2 pt-1">
          <a href={`tel:${info.phone}`}
            className="flex-1 text-center text-xs font-bold py-2 rounded-lg border border-[#DBEAFE] bg-[#EFF6FF] text-[#1A56DB] hover:bg-[#DBEAFE] transition-colors"
            style={{ fontFamily: P, textDecoration: "none" }}>
            📞 Call to Verify
          </a>
          <a href={info.portal} target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1 text-xs font-bold py-2 rounded-lg border border-[#E8EAF0] bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB] transition-colors"
            style={{ fontFamily: P, textDecoration: "none" }}>
            <ExternalLink className="w-3 h-3" /> Permit Portal
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── STEP 1 ───────────────────────────────────────────────────────────────────

function Step1({ answers, setAnswers, onNext }) {
  const { city, propertyType } = answers;
  const canContinue = city && propertyType;

  const propTypes = [
    { val: "single_family", label: "🏠 Single-Family Home" },
    { val: "condo_townhouse", label: "🏢 Condo or Townhouse" },
    { val: "commercial", label: "🏭 Commercial" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Label>Which city is your property in?</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {CITIES.map(c => (
            <button key={c} onClick={() => setAnswers(a => ({ ...a, city: c }))}
              className={`px-4 py-2 rounded-full text-sm font-bold border-2 transition-all ${
                city === c ? "border-[#1A56DB] bg-[#1A56DB] text-white" : "border-[#E8EAF0] bg-white text-[#434654] hover:border-[#1A56DB]/40"
              }`} style={{ fontFamily: P }}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label>What type of property?</Label>
        <div className="space-y-2 mt-2">
          {propTypes.map(pt => (
            <SelectCard key={pt.val} selected={propertyType === pt.val} onClick={() => setAnswers(a => ({ ...a, propertyType: pt.val }))}>
              <span className="text-sm font-bold text-[#191B23]" style={{ fontFamily: P }}>{pt.label}</span>
            </SelectCard>
          ))}
        </div>
      </div>
      <ContinueBtn onClick={onNext} disabled={!canContinue} />
    </div>
  );
}

// ─── STEP 2 ───────────────────────────────────────────────────────────────────

const WORK_TYPES = [
  { group: "Usually Exempt", color: "#059669", bg: "#ECFDF5", items: [
    { val: "painting_cosmetic", label: "🎨 Painting & Cosmetic" },
    { val: "minor_repairs",     label: "🔧 Minor Repairs" },
    { val: "landscaping",       label: "🌿 Landscaping" },
  ]},
  { group: "Depends on Details", color: "#D97706", bg: "#FFFBEB", items: [
    { val: "fence_gate",    label: "🚧 Fence / Gate" },
    { val: "shed_pergola",  label: "🏚 Shed / Pergola" },
    { val: "awning_sunshade", label: "☂️ Awning / Sunshade" },
  ]},
  { group: "Permit Almost Always Required", color: "#DC2626", bg: "#FEF2F2", items: [
    { val: "roof",               label: "🏠 Roof" },
    { val: "windows_doors",      label: "🪟 Windows & Doors" },
    { val: "hvac",               label: "❄️ HVAC / A/C" },
    { val: "water_heater",       label: "🔥 Water Heater" },
    { val: "electrical",         label: "⚡ Electrical" },
    { val: "pool_spa",           label: "🏊 Pool / Spa" },
    { val: "solar",              label: "☀️ Solar Panels" },
    { val: "generator",          label: "🔋 Generator" },
    { val: "hurricane_shutters", label: "🌀 Hurricane Shutters" },
    { val: "room_addition",      label: "🏗 Room Addition" },
  ]},
];

function Step2({ answers, setAnswers, onNext, onBack }) {
  const { workType } = answers;
  return (
    <div className="space-y-6">
      {WORK_TYPES.map(group => (
        <div key={group.group}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: group.bg, color: group.color, fontFamily: P }}>
              {group.group}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {group.items.map(item => (
              <SelectCard key={item.val} selected={workType === item.val}
                onClick={() => setAnswers(a => ({ ...a, workType: item.val }))}>
                <span className="text-sm font-semibold text-[#191B23]" style={{ fontFamily: P }}>{item.label}</span>
              </SelectCard>
            ))}
          </div>
        </div>
      ))}
      <div className="flex gap-3">
        <button onClick={onBack} className="px-5 py-3 rounded-xl border-2 border-[#E8EAF0] text-sm font-bold text-[#434654] hover:bg-gray-50" style={{ fontFamily: P }}>← Back</button>
        <div className="flex-1"><ContinueBtn onClick={onNext} disabled={!workType} /></div>
      </div>
    </div>
  );
}

// ─── STEP 3 ───────────────────────────────────────────────────────────────────

function Step3({ answers, setAnswers, onSubmit, onBack }) {
  const { workType } = answers;
  const set = (key, val) => setAnswers(a => ({ ...a, [key]: val }));

  const roofOpts = [
    { val: "full_replacement", label: "Full replacement" },
    { val: "partial_repair", label: "Partial repair / patch" },
  ];

  return (
    <div className="space-y-5">
      {/* Work-type specific questions */}
      {workType === "painting_cosmetic" && (
        <>
          <div><Label>Any structural changes involved?</Label><YesNo value={answers.hasStructuralChanges} onChange={v => set("hasStructuralChanges", v)} /></div>
          <div><Label>Any new electrical work?</Label><YesNo value={answers.hasNewElectrical} onChange={v => set("hasNewElectrical", v)} /></div>
        </>
      )}
      {workType === "minor_repairs" && (
        <>
          <div><Label>Any structural repairs?</Label><YesNo value={answers.hasStructuralRepair} onChange={v => set("hasStructuralRepair", v)} /></div>
          <div><Label>Any new wiring?</Label><YesNo value={answers.hasNewWiring} onChange={v => set("hasNewWiring", v)} /></div>
        </>
      )}
      {workType === "fence_gate" && (
        <>
          <div>
            <Label>Fence height (in feet)</Label>
            <input type="number" value={answers.fenceHeight} onChange={e => set("fenceHeight", e.target.value)}
              placeholder="e.g. 6" className="w-full mt-1 px-4 py-2.5 rounded-xl border-2 border-[#E8EAF0] text-sm outline-none focus:border-[#1A56DB]" style={{ fontFamily: P }} />
          </div>
          <div><Label>Is the fence on the front of the property?</Label><YesNo value={answers.fenceOnFront} onChange={v => set("fenceOnFront", v)} /></div>
        </>
      )}
      {workType === "shed_pergola" && (
        <>
          <div>
            <Label>Approximate size (sq ft)</Label>
            <input type="number" value={answers.shedSqft} onChange={e => set("shedSqft", e.target.value)}
              placeholder="e.g. 120" className="w-full mt-1 px-4 py-2.5 rounded-xl border-2 border-[#E8EAF0] text-sm outline-none focus:border-[#1A56DB]" style={{ fontFamily: P }} />
          </div>
          <div><Label>Will it have electrical or plumbing?</Label><YesNo value={answers.shedHasUtilities} onChange={v => set("shedHasUtilities", v)} /></div>
          <div><Label>Is it a prefab kit structure?</Label><YesNo value={answers.shedPrefab} onChange={v => set("shedPrefab", v)} /></div>
        </>
      )}
      {workType === "roof" && (
        <div>
          <Label>What type of roof work?</Label>
          <div className="space-y-2 mt-2">
            {roofOpts.map(o => (
              <SelectCard key={o.val} selected={answers.roofWorkType === o.val} onClick={() => set("roofWorkType", o.val)}>
                <span className="text-sm font-semibold" style={{ fontFamily: P }}>{o.label}</span>
              </SelectCard>
            ))}
          </div>
        </div>
      )}
      {workType === "windows_doors" && (
        <>
          <div><Label>Are the windows/doors impact-rated?</Label><YesNo value={answers.isImpactRated} onChange={v => set("isImpactRated", v)} /></div>
          <div>
            <Label>How many openings? (optional)</Label>
            <input type="number" value={answers.numberOfOpenings} onChange={e => set("numberOfOpenings", e.target.value)}
              placeholder="e.g. 4" className="w-full mt-1 px-4 py-2.5 rounded-xl border-2 border-[#E8EAF0] text-sm outline-none focus:border-[#1A56DB]" style={{ fontFamily: P }} />
          </div>
        </>
      )}
      {workType === "pool_spa" && (
        <>
          <div>
            <Label>Pool depth (in inches)</Label>
            <input type="number" value={answers.poolDepthInches} onChange={e => set("poolDepthInches", e.target.value)}
              placeholder="e.g. 60" className="w-full mt-1 px-4 py-2.5 rounded-xl border-2 border-[#E8EAF0] text-sm outline-none focus:border-[#1A56DB]" style={{ fontFamily: P }} />
          </div>
          <div><Label>Is it a prefab/above-ground pool?</Label><YesNo value={answers.poolIsPrefab} onChange={v => set("poolIsPrefab", v)} /></div>
        </>
      )}
      {workType === "water_heater" && (
        <div>
          <Label>Water heater type</Label>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {["Electric", "Gas", "Tankless"].map(t => (
              <button key={t} onClick={() => set("waterHeaterType", t.toLowerCase())}
                className={`py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
                  answers.waterHeaterType === t.toLowerCase() ? "border-[#1A56DB] bg-[#EBF5FF] text-[#1A56DB]" : "border-[#E8EAF0] bg-white text-[#434654]"
                }`} style={{ fontFamily: P }}>{t}</button>
            ))}
          </div>
        </div>
      )}
      {/* Always-shown common fields */}
      <div>
        <Label>Estimated project cost ($)</Label>
        <input type="number" value={answers.projectCost} onChange={e => set("projectCost", e.target.value)}
          placeholder="e.g. 5000" className="w-full mt-1 px-4 py-2.5 rounded-xl border-2 border-[#E8EAF0] text-sm outline-none focus:border-[#1A56DB]" style={{ fontFamily: P }} />
      </div>
      <div><Label>Is this your primary homestead?</Label><YesNo value={answers.isPrimaryResidence} onChange={v => set("isPrimaryResidence", v)} /></div>

      <div className="flex gap-3">
        <button onClick={onBack} className="px-5 py-3 rounded-xl border-2 border-[#E8EAF0] text-sm font-bold text-[#434654] hover:bg-gray-50" style={{ fontFamily: P }}>← Back</button>
        <div className="flex-1"><ContinueBtn onClick={onSubmit} label="Check Now →" /></div>
      </div>
    </div>
  );
}

// ─── RESULT COMPONENTS ────────────────────────────────────────────────────────

function ResultExempt({ answers, resultObj, onReset, currentUser, onSave, saved, saving }) {
  const city = answers.city;
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-[#059669] bg-[#ECFDF5] p-6">
        <div className="flex items-start gap-4">
          <CheckCircle2 className="w-10 h-10 text-[#059669] shrink-0 mt-0.5" />
          <div>
            <h2 className="text-xl font-extrabold text-[#065F46] mb-2" style={{ fontFamily: M }}>Good news — a permit is likely NOT required</h2>
            <p className="text-sm text-[#374151] leading-relaxed mb-3" style={{ fontFamily: P }}>{resultObj.reason}</p>
            <span className="inline-block bg-black/10 rounded-full px-3 py-1 text-xs font-bold text-[#374151] font-mono">📋 {resultObj.code}</span>
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-[#FCD34D] bg-[#FFFBEB] p-4">
        <p className="text-sm text-[#92400E]" style={{ fontFamily: P }}>
          <strong>⚠️ Note:</strong> Even exempt work must comply with building codes. HOA approval may still be required. Verify with your city before starting work.
        </p>
      </div>
      <CityContactCard city={city} />
      <div className="flex gap-3">
        <button onClick={onReset} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-[#E8EAF0] text-sm font-bold text-[#374151] hover:bg-gray-50" style={{ fontFamily: P }}>
          <RefreshCw className="w-4 h-4" /> Check Another
        </button>
        {currentUser && !saved && (
          <button onClick={onSave} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-[#DBEAFE] bg-[#EFF6FF] text-sm font-bold text-[#1A56DB] hover:bg-[#DBEAFE]" style={{ fontFamily: P }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Result
          </button>
        )}
        {saved && <p className="flex-1 text-center text-sm font-bold text-[#059669] py-3">✓ Saved!</p>}
      </div>
    </div>
  );
}

function ResultLikelyExempt({ answers, resultObj, onReset, currentUser, onSave, saved, saving }) {
  const city = answers.city;
  const contact = CITY_CONTACTS[city];
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-[#0D9488] bg-[#F0FDFA] p-6">
        <div className="flex items-start gap-4">
          <CheckCircle2 className="w-10 h-10 text-[#0D9488] shrink-0 mt-0.5" />
          <div>
            <h2 className="text-xl font-extrabold text-[#134E4A] mb-2" style={{ fontFamily: M }}>This project may qualify for an exemption</h2>
            <p className="text-sm text-[#374151] leading-relaxed mb-3" style={{ fontFamily: P }}>{resultObj.reason}</p>
            <span className="inline-block bg-black/10 rounded-full px-3 py-1 text-xs font-bold text-[#374151] font-mono">📋 {resultObj.code}</span>
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-[#0D9488]/30 bg-[#F0FDFA] p-4">
        <p className="text-sm text-[#134E4A] font-semibold mb-1" style={{ fontFamily: P }}>ℹ️ About HB 837</p>
        <p className="text-sm text-[#374151]" style={{ fontFamily: P }}>HB 837 (effective July 1, 2024) exempts some residential work under $2,500. <strong>Important:</strong> this does NOT cover electrical, plumbing, mechanical, or structural work.</p>
      </div>
      <div className="rounded-xl border border-[#FCD34D] bg-[#FFFBEB] p-4">
        <p className="text-sm text-[#92400E]" style={{ fontFamily: P }}>⚠️ Always verify with your city building department before starting work.</p>
      </div>
      <CityContactCard city={city} />
      <div className="flex flex-col gap-2">
        {contact && (
          <a href={`tel:${contact.phone}`}
            className="w-full text-center py-3 rounded-xl font-bold text-sm border-2 border-[#0D9488] text-[#0D9488] hover:bg-[#F0FDFA]"
            style={{ fontFamily: P, textDecoration: "none" }}>📞 Call to Verify</a>
        )}
        <Link to="/ApplyForPermit"
          className="w-full text-center py-3 rounded-xl font-bold text-sm text-white"
          style={{ background: "#1A56DB", fontFamily: P, textDecoration: "none" }}>
          Start Application Anyway →
        </Link>
        <button onClick={onReset} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-[#E8EAF0] text-sm font-bold text-[#374151] hover:bg-gray-50" style={{ fontFamily: P }}>
          <RefreshCw className="w-4 h-4" /> Check Another
        </button>
      </div>
    </div>
  );
}

function ResultMayNeed({ answers, resultObj, onReset, currentUser, onSave, saved, saving }) {
  const city = answers.city;
  const contact = CITY_CONTACTS[city];
  const cityRules = CITY_RULES[city] || [];
  const ruleBadge = { required: { bg: "#FEF2F2", color: "#DC2626", icon: "✗" }, exempt: { bg: "#ECFDF5", color: "#059669", icon: "✓" }, verify: { bg: "#FFFBEB", color: "#D97706", icon: "⚠" }, note: { bg: "#EFF6FF", color: "#1A56DB", icon: "ℹ" } };

  const showTable = resultObj.city_rule && (answers.workType === "fence_gate" || answers.workType === "shed_pergola");

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-[#D97706] bg-[#FFFBEB] p-6">
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-10 h-10 text-[#D97706] shrink-0 mt-0.5" />
          <div>
            <h2 className="text-xl font-extrabold text-[#92400E] mb-2" style={{ fontFamily: M }}>It depends — verify before you start</h2>
            <p className="text-sm text-[#374151] leading-relaxed" style={{ fontFamily: P }}>{resultObj.reason}</p>
          </div>
        </div>
      </div>

      {showTable && (
        <div className="rounded-xl border border-[#E8EAF0] bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F3F4F6]">
                <th className="text-left px-4 py-2.5 font-bold text-[#191B23]" style={{ fontFamily: P }}> </th>
                <th className="text-left px-4 py-2.5 font-bold text-[#374151]" style={{ fontFamily: P }}>Florida Building Code</th>
                <th className="text-left px-4 py-2.5 font-bold text-[#374151]" style={{ fontFamily: P }}>{city}</th>
              </tr>
            </thead>
            <tbody>
              {answers.workType === "fence_gate" && (
                <tr className="border-t border-[#E8EAF0]">
                  <td className="px-4 py-3 font-semibold text-[#434654]" style={{ fontFamily: P }}>Fences ≤ 6 ft</td>
                  <td className="px-4 py-3 text-[#059669] font-bold" style={{ fontFamily: P }}>✓ Exempt under R105.2</td>
                  <td className="px-4 py-3 text-[#DC2626] font-bold" style={{ fontFamily: P }}>✗ Permit Required</td>
                </tr>
              )}
              {answers.workType === "shed_pergola" && (
                <tr className="border-t border-[#E8EAF0]">
                  <td className="px-4 py-3 font-semibold text-[#434654]" style={{ fontFamily: P }}>Sheds 100–149 sq ft</td>
                  <td className="px-4 py-3 text-[#059669] font-bold" style={{ fontFamily: P }}>✓ May be exempt (no utilities)</td>
                  <td className="px-4 py-3 text-[#D97706] font-bold" style={{ fontFamily: P }}>⚠ Verify with city</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {cityRules.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E8EAF0] p-4 space-y-2">
          <p className="text-sm font-bold text-[#191B23] mb-3" style={{ fontFamily: M }}>{city} — Local Rules</p>
          {cityRules.map((rule, i) => {
            const b = ruleBadge[rule.type] || ruleBadge.note;
            return (
              <div key={i} className="flex items-start gap-2">
                <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: b.bg, color: b.color }}>{b.icon}</span>
                <div>
                  <p className="text-sm text-[#374151]" style={{ fontFamily: P }}>{rule.text}</p>
                  {rule.source && <p className="text-xs text-[#9CA3AF]" style={{ fontFamily: P }}>{rule.source}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-xl border border-[#FCD34D] bg-[#FFFBEB] p-4">
        <p className="text-sm font-bold text-[#92400E] mb-2" style={{ fontFamily: P }}>What happens if you skip and you're wrong?</p>
        <ul className="space-y-1">
          {["🚫 Double permit fees — 100% penalty applied when discovered", "🛑 Stop-work order — all work halts immediately", "🔨 Required demolition — may need to uncover completed work", "🏠 Difficulty selling — must be disclosed and permitted before sale", "💰 Insurance denied — damage from unpermitted work excluded"].map((c, i) => (
            <li key={i} className="text-xs text-[#92400E]" style={{ fontFamily: P }}>{c}</li>
          ))}
        </ul>
      </div>

      <CityContactCard city={city} />

      <div className="flex flex-col gap-2">
        {contact && (
          <a href={`tel:${contact.phone}`}
            className="w-full text-center py-3 rounded-xl font-bold text-sm border-2 border-[#D97706] text-[#D97706] hover:bg-[#FFFBEB]"
            style={{ fontFamily: P, textDecoration: "none" }}>📞 Call to Verify</a>
        )}
        <Link to="/ApplyForPermit"
          className="w-full text-center py-3 rounded-xl font-bold text-sm text-white"
          style={{ background: "#1A56DB", fontFamily: P, textDecoration: "none" }}>
          Start Application Anyway →
        </Link>
        <button onClick={onReset} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-[#E8EAF0] text-sm font-bold text-[#374151] hover:bg-gray-50" style={{ fontFamily: P }}>
          <RefreshCw className="w-4 h-4" /> Check Another
        </button>
      </div>
    </div>
  );
}

function ResultPermitRequired({ answers, resultObj, onReset, currentUser, onSave, saved, saving }) {
  const city = answers.city;
  const contact = CITY_CONTACTS[city];
  const rule = WORK_RULES[resultObj.ruleKey] || {};
  const feeInfo = FEES[city]?.[answers.workType];
  const ownerBuilder = answers.propertyType === "single_family" && answers.isPrimaryResidence === "Yes";

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-[#DC2626] bg-[#FEF2F2] p-6">
        <div className="flex items-start gap-4">
          <XCircle className="w-10 h-10 text-[#DC2626] shrink-0 mt-0.5" />
          <div>
            <h2 className="text-xl font-extrabold text-[#7F1D1D] mb-2" style={{ fontFamily: M }}>A permit IS required for this work</h2>
            <p className="text-sm font-bold text-[#374151]" style={{ fontFamily: P }}>{resultObj.reason || rule.title}</p>
          </div>
        </div>
      </div>

      {rule.body && (
        <div className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold font-mono bg-[#1A56DB] text-white px-2 py-0.5 rounded">📖 {rule.code}</span>
          </div>
          <p className="text-sm text-[#1E40AF]" style={{ fontFamily: P }}>{rule.body}</p>
        </div>
      )}

      {feeInfo && (
        <div className="bg-white rounded-2xl border-l-4 border-l-[#1A56DB] border border-[#E8EAF0] p-5">
          <p className="text-sm font-bold text-[#191B23] mb-2" style={{ fontFamily: M }}>Estimated Fee in {city}</p>
          <p className="text-sm text-[#434654] mb-2" style={{ fontFamily: P }}>{feeInfo.label}</p>
          {feeInfo.total ? (
            <p className="text-lg font-extrabold text-[#1A56DB]" style={{ fontFamily: M }}>Estimated Total: ${feeInfo.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
          ) : (
            <p className="text-sm text-[#6B7280]" style={{ fontFamily: P }}>Final fee is percentage-based — varies by job value.</p>
          )}
          <Link to="/FeeCalculator" className="inline-flex items-center gap-1 text-xs font-bold text-[#1A56DB] mt-2 hover:underline" style={{ fontFamily: P, textDecoration: "none" }}>
            Get an exact estimate <ArrowRight className="w-3 h-3" />
          </Link>
          <p className="text-xs text-[#9CA3AF] mt-2" style={{ fontFamily: P }}>Estimates based on current fee schedules. Final fees set at submission.</p>
        </div>
      )}

      <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-4">
        <p className="text-sm font-bold text-[#7F1D1D] mb-2" style={{ fontFamily: P }}>What happens if you skip the permit?</p>
        <ul className="space-y-1">
          {[
            "🚫 Double fees — 100% penalty when discovered",
            "🛑 Stop-work order — all work halts immediately",
            "🔨 Required demolition — may need to uncover completed work",
            "🏠 Cannot sell your home — must be disclosed and permitted before sale",
            "💰 Insurance denied — damage from unpermitted work excluded",
            "⚖️ Legal liability — homeowner bears full responsibility",
          ].map((c, i) => (
            <li key={i} className="text-xs text-[#7F1D1D]" style={{ fontFamily: P }}>{c}</li>
          ))}
        </ul>
      </div>

      {ownerBuilder && (
        <div className="rounded-xl border border-[#0D9488]/30 bg-[#F0FDFA] p-4">
          <p className="text-sm font-bold text-[#134E4A] mb-1" style={{ fontFamily: P }}>💡 You may be able to pull your own permit</p>
          <p className="text-sm text-[#374151]" style={{ fontFamily: P }}>Under Florida Statute 489.103(7), owners of single-family primary residences can act as their own contractor. You must personally appear at the building department and sign an Owner-Builder Disclosure Statement.</p>
        </div>
      )}

      <CityContactCard city={city} />

      <Link to="/ApplyForPermit"
        className="w-full block text-center py-4 rounded-xl font-bold text-base text-white"
        style={{ background: "#1A56DB", fontFamily: P, textDecoration: "none" }}>
        Start My Permit Application →
      </Link>

      <div className="flex gap-3">
        <Link to="/FeeCalculator"
          className="flex-1 text-center py-3 rounded-xl font-bold text-sm border-2 border-[#E8EAF0] text-[#374151] hover:bg-gray-50"
          style={{ fontFamily: P, textDecoration: "none" }}>
          Calculate Exact Fee
        </Link>
        <button onClick={onReset} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-[#E8EAF0] text-sm font-bold text-[#374151] hover:bg-gray-50" style={{ fontFamily: P }}>
          <RefreshCw className="w-4 h-4" /> Check Another
        </button>
      </div>

      {currentUser && !saved && (
        <button onClick={onSave} disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-[#DBEAFE] bg-[#EFF6FF] text-sm font-bold text-[#1A56DB] hover:bg-[#DBEAFE]"
          style={{ fontFamily: P }}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Result
        </button>
      )}
      {saved && <p className="text-center text-sm font-bold text-[#059669]">✓ Saved!</p>}
    </div>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

function FAQ() {
  const [open, setOpen] = useState(null);
  return (
    <div className="mt-10">
      <h2 className="text-lg font-extrabold text-[#191B23] mb-4" style={{ fontFamily: M }}>Common Questions</h2>
      <div className="space-y-2">
        {FAQS.map((faq, i) => (
          <div key={i} className="bg-white rounded-xl border border-[#E8EAF0] overflow-hidden">
            <button onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#F8FAFF] transition-colors"
              style={{ fontFamily: P }}>
              <span className="text-sm font-bold text-[#191B23] pr-4">{faq.q}</span>
              {open === i ? <ChevronUp className="w-4 h-4 text-[#6B7280] shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#6B7280] shrink-0" />}
            </button>
            {open === i && (
              <div className="px-5 pb-4 border-t border-[#E8EAF0]">
                <p className="text-sm text-[#374151] leading-relaxed pt-3" style={{ fontFamily: P }}>{faq.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function ExemptionCheckerV2() {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState(INITIAL_ANSWERS);
  const [resultObj, setResultObj] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Get current user
  useState(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUser(data?.user || null));
  });

  const handleSubmit = () => {
    const res = calculateResult(answers);
    setResultObj(res);
    setStep(4);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReset = () => {
    setAnswers(INITIAL_ANSWERS);
    setResultObj(null);
    setSaved(false);
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = async () => {
    if (!currentUser || !resultObj) return;
    setSaving(true);
    await supabase.from("exemption_checks").insert({
      user_email: currentUser.email,
      city_name: answers.city,
      property_type: answers.propertyType,
      work_type: answers.workType,
      project_cost: parseFloat(answers.projectCost) || null,
      answers: JSON.stringify(answers),
      result: resultObj.result,
      result_reason: resultObj.reason || WORK_RULES[resultObj.ruleKey]?.title || "",
    });
    setSaving(false);
    setSaved(true);
  };

  const resultProps = { answers, resultObj, onReset: handleReset, currentUser, onSave: handleSave, saved, saving };

  const stepTitles = { 1: "City & Property Type", 2: "Type of Work", 3: "Project Details" };

  return (
    <div className="min-h-screen" style={{ background: "#F8F9FF" }}>
      {/* Header */}
      <div style={{ background: "#1A56DB" }} className="py-10 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-4">
            <span className="text-white text-xs font-bold" style={{ fontFamily: P }}>🔍 Free Tool</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2" style={{ fontFamily: M }}>Permit Exemption Checker</h1>
          <p className="text-blue-100 text-sm" style={{ fontFamily: P }}>Find out if your project requires a building permit — based on Florida law and your city's rules</p>
        </div>
      </div>

      {/* Card */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-[#E8EAF0] p-6 sm:p-8">
          {step < 4 && (
            <>
              <StepProgress step={step} />
              <h2 className="text-base font-extrabold text-[#191B23] mb-5" style={{ fontFamily: M }}>{stepTitles[step]}</h2>
            </>
          )}
          {step === 4 && resultObj && (
            <div className="mb-2">
              <p className="text-xs font-bold text-[#9CA3AF] mb-4 uppercase tracking-wide" style={{ fontFamily: P }}>Your Result</p>
            </div>
          )}

          {step === 1 && <Step1 answers={answers} setAnswers={setAnswers} onNext={() => setStep(2)} />}
          {step === 2 && <Step2 answers={answers} setAnswers={setAnswers} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
          {step === 3 && <Step3 answers={answers} setAnswers={setAnswers} onSubmit={handleSubmit} onBack={() => setStep(2)} />}
          {step === 4 && resultObj && (
            <>
              {resultObj.result === "exempt"         && <ResultExempt {...resultProps} />}
              {resultObj.result === "likely_exempt"  && <ResultLikelyExempt {...resultProps} />}
              {resultObj.result === "may_need_permit"  && <ResultMayNeed {...resultProps} />}
              {resultObj.result === "permit_required"  && <ResultPermitRequired {...resultProps} />}
            </>
          )}
        </div>

        {/* Disclaimer */}
        <div className="mt-4 px-2">
          <p className="text-xs text-[#9CA3AF] text-center leading-relaxed" style={{ fontFamily: P }}>
            This tool is for informational purposes only and does not constitute legal or engineering advice. Always verify with your local building department before starting work. Rules change — this tool reflects our best understanding of current Florida and city regulations.
          </p>
        </div>

        <FAQ />
      </div>
    </div>
  );
}