import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";

// ─── DATA ────────────────────────────────────────────────────────────────────

const CITY_CONTACTS = {
  'Weston': { phone: '(954) 385-2600', address: '17200 Royal Palm Blvd, Weston, FL 33326', portal: 'https://www.westonfl.org/Permits', hours: 'Mon–Fri, 8:00 AM – 4:30 PM' },
  'Hollywood': { phone: '(954) 967-4500', address: '2600 Hollywood Blvd, Hollywood, FL 33020', portal: 'https://www.hollywoodfl.org/permits', hours: 'Mon–Fri, 8:00 AM – 4:30 PM' },
  'Coral Springs': { phone: '(954) 344-1000', address: '9551 W. Sample Rd, Coral Springs, FL 33065', portal: 'https://www.coralsprings.org/permits', hours: 'Mon–Fri, 8:00 AM – 4:30 PM' },
  'Cooper City': { phone: '(954) 434-4300', address: '9090 SW 50th Pl, Cooper City, FL 33328', portal: 'https://www.coopercityfl.org/permits', hours: 'Mon–Fri, 8:00 AM – 4:30 PM' },
  'Fort Lauderdale': { phone: '(954) 828-5900', address: '700 NW 19th Ave, Fort Lauderdale, FL 33311', portal: 'https://lauderbuild.fortlauderdale.gov', hours: 'Mon–Fri, 8:00 AM – 4:30 PM' },
  'Sunrise': { phone: '(954) 746-3440', address: '10770 W. Oakland Park Blvd, Sunrise, FL 33351', portal: 'https://www.sunrisefl.gov/permits', hours: 'Mon–Fri, 8:00 AM – 4:30 PM' },
};

const FEES = {
  'Weston': {
    hvac: { label: 'Flat fee: $205.04 + Tech/Admin: $127.00', total: 332.04 },
    water_heater: { label: 'Flat fee: $205.04 + Tech/Admin: $127.00', total: 332.04 },
    fence_gate: { label: 'Base: $205.04 + per linear ft + Tech/Admin: $127.00', total: null },
    pool_spa: { label: 'Flat fee: $1,145.83 + Tech/Admin: $127.00', total: 1272.83 },
    generator: { label: 'Flat fee: $350.00 + Tech/Admin: $127.00', total: 477.00 },
    solar: { label: 'Base: $119.11 + 1.55% of job value + Tech/Admin: $127.00', total: null },
    roof: { label: 'Base: $119.11 + 1.55% of job value + Tech/Admin: $127.00', total: null },
    windows_doors: { label: 'Base: $119.11 + 1.55% of job value + Tech/Admin: $127.00', total: null },
    hurricane_shutters: { label: 'Base: $115.79 + per opening + Tech/Admin: $127.00', total: null },
    room_addition: { label: 'Base: $119.11 + 1.55% of job value + Tech/Admin: $127.00', total: null },
  },
  'Hollywood': {
    hvac: { label: 'Base: $100.00 + 2.20% of value + Tech/Admin: $50.00', total: null },
    water_heater: { label: 'Base: $100.00 + Tech/Admin: $50.00', total: 150.00 },
    roof: { label: 'Base: $100.00 + 2.20% of job value + Tech/Admin: $50.00', total: null },
    pool_spa: { label: 'Base: $100.00 + 2.20% of value + Tech/Admin: $50.00', total: null },
    generator: { label: 'Base: $100.00 + 2.20% of value + Tech/Admin: $50.00', total: null },
    solar: { label: 'Base: $100.00 + 2.20% of value + Tech/Admin: $50.00', total: null },
    windows_doors: { label: 'Base: $100.00 + 2.20% of value + Tech/Admin: $50.00', total: null },
    hurricane_shutters: { label: 'Base: $100.00 + 2.20% of value + Tech/Admin: $50.00', total: null },
    room_addition: { label: 'Base: $100.00 + 2.20% of value + Tech/Admin: $50.00', total: null },
    fence_gate: { label: 'Base: $100.00 + 2.20% of value + Tech/Admin: $50.00', total: null },
  },
  'Coral Springs': {
    hvac: { label: 'Base: $54.55 + 0.14% of value + Tech/Admin: $54.55', total: null },
    water_heater: { label: 'Base: $54.55 + 0.15% of value + Tech/Admin: $54.55', total: null },
    roof: { label: 'Base: $54.55 + 2.80% of job value + Tech/Admin: $54.55', total: null },
    pool_spa: { label: 'Base: $54.55 + 4.80% of value + Tech/Admin: $54.55', total: null },
    solar: { label: 'Base: $54.55 + 0.31% of value + Tech/Admin: $54.55', total: null },
    windows_doors: { label: 'Base: $54.55 + 2.80% of value + Tech/Admin: $54.55', total: null },
    hurricane_shutters: { label: 'Base: $54.55 + 2.80% of value + Tech/Admin: $54.55', total: null },
    room_addition: { label: 'Base: $54.55 + 5.30% of value + Tech/Admin: $54.55', total: null },
    fence_gate: { label: 'Base: $54.55 + 2.80% of value + Tech/Admin: $54.55', total: null },
  },
  'Cooper City': {
    hvac: { label: 'Base: $125.00 + 1.85% of value + Tech/Admin: $50.00', total: null },
    water_heater: { label: 'Base: $125.00 + 1.85% of value + Tech/Admin: $50.00', total: null },
    roof: { label: 'Base: $125.00 + 1.85% of job value + Tech/Admin: $50.00', total: null },
    pool_spa: { label: 'Base: $125.00 + 1.85% of value + Tech/Admin: $50.00', total: null },
    generator: { label: 'Base: $125.00 + 1.85% of value + Tech/Admin: $50.00', total: null },
    solar: { label: 'Base: $125.00 + 1.85% of value + Tech/Admin: $50.00', total: null },
    windows_doors: { label: 'Base: $125.00 + 1.85% of value + Tech/Admin: $50.00', total: null },
    hurricane_shutters: { label: 'Base: $125.00 + 1.85% of value + Tech/Admin: $50.00', total: null },
    room_addition: { label: 'Base: $125.00 + 1.85% of value + Tech/Admin: $50.00', total: null },
    fence_gate: { label: 'Base: $125.00 + 1.85% of value + Tech/Admin: $50.00', total: null },
  },
  'Fort Lauderdale': {
    hvac: { label: 'Base: $125.00 + 1.85% of value + Tech/Admin: $50.00', total: null },
    water_heater: { label: 'Base: $125.00 + 1.85% of value + Tech/Admin: $50.00', total: null },
    roof: { label: 'Base: $125.00 + 1.85% of job value + Tech/Admin: $50.00', total: null },
    pool_spa: { label: 'Base: $125.00 + 1.85% of value + Tech/Admin: $50.00', total: null },
    generator: { label: 'Base: $125.00 + 1.85% of value + Tech/Admin: $50.00', total: null },
    solar: { label: 'Base: $125.00 + 1.85% of value + Tech/Admin: $50.00', total: null },
    windows_doors: { label: 'Base: $125.00 + 1.85% of value + Tech/Admin: $50.00', total: null },
    hurricane_shutters: { label: 'Base: $125.00 + 1.85% of value + Tech/Admin: $50.00', total: null },
    room_addition: { label: 'Base: $125.00 + 1.85% of value + Tech/Admin: $50.00', total: null },
    fence_gate: { label: 'Base: $125.00 + 1.85% of value + Tech/Admin: $50.00', total: null },
  },
  'Sunrise': {
    hvac: { label: 'Flat: $208.45 + Tech/Admin: $80.18', total: 288.63 },
    water_heater: { label: 'Flat: $208.45 + Tech/Admin: $80.18', total: 288.63 },
    roof: { label: 'Flat: $416.91 + Tech/Admin: $80.18', total: 497.09 },
    pool_spa: { label: 'Structural: $310.01 + Electrical: $726.92 + Plumbing: $416.91 + Tech: $80.18', total: 1614.20 },
    generator: { label: 'Flat: $416.91 + Tech/Admin: $80.18', total: 497.09 },
    solar: { label: 'Flat: $416.91 + Tech/Admin: $80.18', total: 497.09 },
    windows_doors: { label: 'Flat: $310.01 + Tech/Admin: $80.18', total: 390.19 },
    hurricane_shutters: { label: 'Flat: $310.01 + Tech/Admin: $80.18', total: 390.19 },
    room_addition: { label: 'Base: $208.46 + 4.40% of value + Tech/Admin: $80.18', total: null },
    fence_gate: { label: 'Flat: $208.45 + Tech/Admin: $80.18', total: 288.63 },
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
  hvac: {
    title: 'All HVAC replacements require a mechanical permit — no exceptions',
    body: 'Florida Building Code FBC-R M1401.1 requires a mechanical permit for all HVAC system installations and replacements. This applies regardless of whether it is a like-for-like replacement. A Notice of Commencement (NOC) is also required if the job value exceeds $15,000.',
    code: 'FBC-R M1401.1',
  },
  water_heater: {
    title: 'All water heater replacements require a plumbing permit — including tankless',
    body: 'Florida Building Code FBC-R P2801.1 requires a permit for all water heater installations. Many homeowners are surprised by this — it applies to every type: electric, gas, and tankless. The inspection verifies proper installation, T&P relief valve, and expansion tank if needed.',
    code: 'FBC-R P2801.1',
  },
  electrical: {
    title: 'New circuits, panel upgrades, and service changes require an electrical permit',
    body: 'Florida Building Code FBC-R E3401.1 requires permits for all new electrical wiring, panel upgrades, and service changes. Replacing an outlet or switch on an existing circuit may be exempt, but any new wiring is not.',
    code: 'FBC-R E3401.1',
  },
  roof: {
    title: 'Full roof replacements require a building permit and inspection',
    body: 'All Broward County cities require a permit for full roof replacement. This includes a required dry-in inspection and final inspection. Florida Product Approval (NOA) documentation is required for all roofing materials.',
    code: 'FBC-R R105.1',
  },
  solar: {
    title: 'Solar panel systems require both an electrical permit and a structural permit',
    body: 'Solar installations require a building permit (structural) and an electrical permit. All panels must have a Florida Product Approval. FPL utility interconnection approval is also required before final inspection.',
    code: 'FBC-R R105.1',
  },
  generator: {
    title: 'Standby generators require an electrical permit and may require a gas permit',
    body: 'All standby generator installations require an electrical permit. If connected to natural gas or propane, a separate gas piping permit is required. Generators must meet setback requirements from property lines and openings.',
    code: 'FBC-R M1401.1',
  },
  pool_spa: {
    title: 'All pools over 24 inches deep require a permit and a safety barrier',
    body: 'Florida law (FS 515.25) requires a permit for all residential swimming pools. A pool safety barrier must be installed before final inspection. Pool permits include structural, electrical, plumbing, and mechanical sub-permits.',
    code: 'FS 515.25',
  },
  hurricane_shutters: {
    title: 'All hurricane protection installations require a permit',
    body: 'Broward County and all its cities require permits for all hurricane protection. All products must have a Florida Product Approval (NOA). A final inspection is required to verify proper installation.',
    code: 'FBC-R R105.1',
  },
  room_addition: {
    title: 'Room additions and structural changes always require permits',
    body: 'Any expansion of living space requires a building permit. Room additions typically require: building, electrical, plumbing (if applicable), and mechanical sub-permits. Engineered plans signed and sealed by a Florida licensed engineer are required.',
    code: 'FBC-R R105.1',
  },
  windows_doors: {
    title: 'Impact-rated windows and doors require a permit and Florida Product Approval',
    body: 'All window and door replacements with impact-rated products require a building permit. A Florida Product Approval (NOA) must be submitted with the application. A final inspection verifies proper installation.',
    code: 'FBC-R R105.1',
  },
  fence_gate: {
    title: 'Your city requires a permit for fence installations',
    body: 'While Florida Building Code (FBC-R R105.2) may exempt fences under 6 ft at the state level, your city (as the Authority Having Jurisdiction) requires a permit for all fence installations. The city can and does set stricter requirements than the state code.',
    code: 'FBC-R R105.2 (AHJ override)',
  },
  shed_pergola: {
    title: 'A permit is required for accessory structures this size in your city',
    body: 'While Florida Building Code exempts detached accessory structures under 150 sq ft with no utilities, your city requires permits for structures at or above 100 sq ft. This is a common city-specific requirement in Broward County.',
    code: 'FBC-R R105.2 (AHJ override)',
  },
};

// ─── CALCULATE RESULT ────────────────────────────────────────────────────────

function calculateResult(answers) {
  const {
    city, propertyType, workType, fenceHeight, shedSqft, shedHasUtilities,
    roofWorkType, hasStructuralChanges, hasNewElectrical, isImpactRated,
    poolDepthInches, poolIsPrefab, hasStructuralRepair, hasNewWiring,
    projectCost, isPrimaryResidence,
  } = answers;

  const cost = parseFloat(projectCost) || 0;
  const fenceH = parseFloat(fenceHeight) || 0;
  const shedSF = parseFloat(shedSqft) || 0;
  const poolDepth = parseFloat(poolDepthInches) || 0;
  const strictFenceCities = ['Weston', 'Coral Springs', 'Cooper City'];
  const strictShedCities = ['Weston', 'Coral Springs'];

  // EXEMPT
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

  // The HB 837 catch-all was removed — see lib/exemptionLogic.js. The bill it
  // cited is Florida's tort-reform act, not a permit statute.

  // MAY NEED PERMIT
  if (workType === 'fence_gate' && (strictFenceCities.includes(city) || city === 'Fort Lauderdale'))
    return { result: 'may_need_permit', reason: `While Florida Building Code may exempt fences under 6 ft, ${city} requires a permit for fence installations regardless of height.`, city_rule: true };

  if (workType === 'shed_pergola' && shedSF >= 100 && shedSF < 150 && !strictShedCities.includes(city) && shedHasUtilities === 'No')
    return { result: 'may_need_permit', reason: `A shed between 100–150 sq ft may be exempt under Florida Building Code, but your city may require a permit. Verify before building.`, city_rule: true };

  if (workType === 'shed_pergola' && shedSF >= 100 && strictShedCities.includes(city))
    return { result: 'permit_required', reason: `${city} requires a permit for accessory structures 100 sq ft or larger.`, ruleKey: 'shed_pergola' };

  if (workType === 'roof' && roofWorkType === 'partial_repair')
    return { result: 'may_need_permit', reason: 'Partial roof repairs may be exempt if they cover less than 25% of the total roof area. However, if the repair involves structural components or replaces more than 25%, a permit is required. Verify with your building department.', city_rule: false };

  if (workType === 'windows_doors' && isImpactRated === 'No')
    return { result: 'may_need_permit', reason: 'Non-impact window replacement may not require a permit in some cities. However, most Broward County cities require permits for all window/door replacements. Verify with your building department.', city_rule: false };

  // PERMIT REQUIRED
  if (workType === 'hvac') return { result: 'permit_required', ruleKey: 'hvac' };
  if (workType === 'water_heater') return { result: 'permit_required', ruleKey: 'water_heater' };
  if (workType === 'electrical') return { result: 'permit_required', ruleKey: 'electrical' };
  if (workType === 'solar') return { result: 'permit_required', ruleKey: 'solar' };
  if (workType === 'generator') return { result: 'permit_required', ruleKey: 'generator' };
  if (workType === 'pool_spa') return { result: 'permit_required', ruleKey: 'pool_spa' };
  if (workType === 'hurricane_shutters') return { result: 'permit_required', ruleKey: 'hurricane_shutters' };
  if (workType === 'room_addition') return { result: 'permit_required', ruleKey: 'room_addition' };
  if (workType === 'roof' && roofWorkType !== 'partial_repair') return { result: 'permit_required', ruleKey: 'roof' };
  if (workType === 'windows_doors' && isImpactRated === 'Yes') return { result: 'permit_required', ruleKey: 'windows_doors' };
  if (workType === 'fence_gate' && fenceH > 6) return { result: 'permit_required', ruleKey: 'fence_gate', reason: 'Fences over 6 feet require a permit in all Florida cities.' };
  if (workType === 'shed_pergola' && shedHasUtilities === 'Yes') return { result: 'permit_required', ruleKey: 'shed_pergola', reason: 'Any accessory structure with electrical or plumbing connections requires a permit.' };
  if (workType === 'shed_pergola' && shedSF >= 150) return { result: 'permit_required', ruleKey: 'shed_pergola', reason: 'Accessory structures 150 sq ft or larger require a permit in all Florida cities.' };

  return { result: 'may_need_permit', reason: 'We could not determine a clear answer based on your responses. Please verify with your local building department.', city_rule: false };
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function Step4Result({ answers, currentUser, onReset }) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const resultObj = calculateResult(answers);
  const { result, reason, code, ruleKey, city_rule } = resultObj;

  const contact = CITY_CONTACTS[answers.city] || {};

  function CityContact() {
    return (
      <div style={{ background: '#f8f9ff', border: '1px solid #e0e4f0', borderRadius: 10, padding: 14, marginBottom: 8 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: '#0d1c2e', marginBottom: 6 }}>{answers.city} Building Department</div>
        <div style={{ fontSize: 13, color: '#374151', marginBottom: 3 }}>📞 <a href={`tel:${contact.phone}`} style={{ color: '#004ac6' }}>{contact.phone}</a></div>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 3 }}>📍 {contact.address}</div>
        <div style={{ fontSize: 12, marginBottom: 3 }}>🌐 <a href={contact.portal} target="_blank" rel="noopener noreferrer" style={{ color: '#004ac6' }}>{contact.portal}</a></div>
        <div style={{ fontSize: 12, color: '#6b7280' }}>🕐 {contact.hours}</div>
      </div>
    );
  }

  async function handleSave() {
    if (!currentUser) return;
    setSaving(true);
    await supabase.from('exemption_checks').insert({
      user_email: currentUser.email,
      city_name: answers.city,
      property_type: answers.propertyType,
      work_type: answers.workType,
      project_cost: parseFloat(answers.projectCost) || null,
      answers: answers,
      result: result,
      result_reason: reason || (WORK_RULES[ruleKey] || {}).title,
    });
    setSaving(false);
    setSaved(true);
  }

  // ── EXEMPT ────────────────────────────────────────────────────────────────
  if (result === 'exempt') {
    return (
      <div>
        <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 16, padding: 24, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 44, height: 44, background: '#16a34a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 22, flexShrink: 0 }}>✓</div>
            <div>
              <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 20, fontWeight: 700, color: '#15803d' }}>Good news — a permit is likely NOT required</div>
              <div style={{ fontSize: 13, color: '#166534', marginTop: 4, lineHeight: 1.6 }}>{reason}</div>
              {code && <span style={{ display: 'inline-block', marginTop: 8, background: '#dcfce7', border: '1px solid #86efac', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700, color: '#15803d', fontFamily: 'monospace' }}>📋 {code}</span>}
            </div>
          </div>
          <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: 10, padding: 12, fontSize: 13, color: '#854d0e' }}>
            ⚠ Even exempt work must comply with building codes. HOA approval may still be required. Always verify with your city before starting work.
          </div>
        </div>
        <CityContact />
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button onClick={onReset} style={{ flex: 1, background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, padding: '10px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>↩ Check Another Project</button>
          {currentUser && !saved && (
            <button onClick={handleSave} disabled={saving} style={{ flex: 1, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
              {saving ? 'Saving…' : '💾 Save Result'}
            </button>
          )}
          {saved && <div style={{ flex: 1, textAlign: 'center', fontSize: 13, color: '#16a34a', padding: '10px 0' }}>✓ Saved!</div>}
        </div>
      </div>
    );
  }

  // ── LIKELY EXEMPT ─────────────────────────────────────────────────────────
  if (result === 'likely_exempt') {
    return (
      <div>
        <div style={{ background: '#f0fdfa', border: '1.5px solid #5eead4', borderRadius: 16, padding: 24, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 44, height: 44, background: '#0d9488', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 22, flexShrink: 0 }}>✓</div>
            <div>
              <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 20, fontWeight: 700, color: '#0f766e' }}>This project may qualify for an exemption</div>
              <div style={{ fontSize: 13, color: '#115e59', marginTop: 4, lineHeight: 1.6 }}>{reason}</div>
              {code && <span style={{ display: 'inline-block', marginTop: 8, background: '#ccfbf1', border: '1px solid #5eead4', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700, color: '#0f766e', fontFamily: 'monospace' }}>📋 {code}</span>}
            </div>
          </div>
          <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: 10, padding: 12, fontSize: 13, color: '#854d0e' }}>
            ⚠ Always verify with your city building department before starting. Exemptions do not override HOA rules or deed restrictions.
          </div>
        </div>
        <CityContact />
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <a href={`tel:${contact.phone}`} style={{ flex: 1, minWidth: 140, background: '#004ac6', color: 'white', borderRadius: 8, padding: '10px 16px', textAlign: 'center', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>📞 Call to Verify</a>
          <button onClick={() => navigate('/PermitGuide')} style={{ flex: 1, minWidth: 140, background: 'white', border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>See Permit Requirements</button>
          <button onClick={onReset} style={{ flex: 1, minWidth: 140, background: 'transparent', border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 16px', fontSize: 13, cursor: 'pointer', color: '#6b7280' }}>Check Another</button>
        </div>
      </div>
    );
  }

  // ── MAY NEED PERMIT ───────────────────────────────────────────────────────
  if (result === 'may_need_permit') {
    const cityRules = CITY_RULES[answers.city] || [];
    return (
      <div>
        <div style={{ background: '#fffbeb', border: '1.5px solid #fbbf24', borderRadius: 16, padding: 24, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 44, height: 44, background: '#d97706', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 22, flexShrink: 0 }}>⚠</div>
            <div>
              <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 20, fontWeight: 700, color: '#92400e' }}>It depends — verify before you start</div>
              <div style={{ fontSize: 13, color: '#78350f', marginTop: 4, lineHeight: 1.6 }}>{reason}</div>
            </div>
          </div>

          {/* City-specific rules */}
          {cityRules.length > 0 && (
            <div style={{ background: 'white', borderRadius: 10, border: '1px solid #fde68a', padding: 16, marginBottom: 12 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#92400e', marginBottom: 8 }}>{answers.city} — Specific Requirements</div>
              {cityRules.map((rule, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 0', borderTop: i > 0 ? '1px solid #fef3c7' : 'none' }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 999, flexShrink: 0,
                    background: rule.type === 'required' ? '#fee2e2' : rule.type === 'exempt' ? '#dcfce7' : rule.type === 'note' ? '#dbeafe' : '#fef9c3',
                    color: rule.type === 'required' ? '#dc2626' : rule.type === 'exempt' ? '#16a34a' : rule.type === 'note' ? '#1d4ed8' : '#d97706',
                  }}>
                    {rule.type === 'required' ? '✗ Required' : rule.type === 'exempt' ? '✓ Exempt' : rule.type === 'note' ? 'ℹ Note' : '⚠ Verify'}
                  </span>
                  <span style={{ fontSize: 13, color: '#44403c' }}>{rule.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* Consequences */}
          <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: 12, marginBottom: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: '#9a3412', marginBottom: 6 }}>If you skip the permit and one IS required:</div>
            {['🚫 Double permit fees (100% penalty)', '🛑 Stop-work order until permit obtained', '🔨 May need to expose completed work for inspection', '🏠 Cannot sell home until work is properly permitted', '💰 Insurance may not cover damage from unpermitted work'].map((c, i) => (
              <div key={i} style={{ fontSize: 13, color: '#9a3412', padding: '2px 0' }}>{c}</div>
            ))}
          </div>
        </div>

        <CityContact />

        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <a href={`tel:${contact.phone}`} style={{ flex: 1, minWidth: 140, background: '#004ac6', color: 'white', borderRadius: 8, padding: '10px 16px', textAlign: 'center', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>📞 Call to Verify</a>
          <button onClick={() => navigate('/PermitGuide')} style={{ flex: 1, minWidth: 140, background: 'white', border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>See Permit Requirements</button>
          <button onClick={onReset} style={{ flex: 1, minWidth: 140, background: 'transparent', border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 16px', fontSize: 13, cursor: 'pointer', color: '#6b7280' }}>Check Another</button>
        </div>
      </div>
    );
  }

  // ── PERMIT REQUIRED ───────────────────────────────────────────────────────
  const rule = WORK_RULES[ruleKey] || {};
  const feeKey = ruleKey || answers.workType;
  const fee = (FEES[answers.city] || {})[feeKey];

  return (
    <div>
      {/* Header card */}
      <div style={{ background: '#fff1f2', border: '1.5px solid #fca5a5', borderRadius: 16, padding: 24, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
          <div style={{ width: 44, height: 44, background: '#dc2626', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 22, flexShrink: 0 }}>✗</div>
          <div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 20, fontWeight: 700, color: '#991b1b' }}>A permit IS required for this work</div>
            <div style={{ fontSize: 13, color: '#7f1d1d', marginTop: 4, lineHeight: 1.6 }}>{rule.title || reason}</div>
          </div>
        </div>
        {rule.code && (
          <div style={{ background: '#eff6ff', borderRadius: 8, padding: 12, fontSize: 13, color: '#1e40af', lineHeight: 1.6 }}>
            <span style={{ fontFamily: 'monospace', background: '#dbeafe', padding: '2px 6px', borderRadius: 4, marginRight: 8, fontSize: 11 }}>{rule.code}</span>
            {rule.body}
          </div>
        )}
      </div>

      {/* Fee estimate */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderLeft: '4px solid #004ac6', borderRadius: 10, padding: 16, marginBottom: 12 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: '#0d1c2e', marginBottom: 6 }}>Estimated Fee — {answers.city}</div>
        {fee ? (
          <div>
            <div style={{ fontSize: 13, color: '#374151' }}>{fee.label}</div>
            {fee.total && <div style={{ fontSize: 18, fontWeight: 700, color: '#004ac6', marginTop: 4 }}>Estimated: ${fee.total.toFixed(2)}</div>}
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>Estimate only. Final fees determined at submission.</div>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: '#6b7280' }}>
            Use our <button onClick={() => navigate('/FeeCalculator')} style={{ color: '#004ac6', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, textDecoration: 'underline', padding: 0 }}>Fee Calculator</button> for an exact estimate.
          </div>
        )}
      </div>

      {/* Consequences */}
      <div style={{ background: '#fff1f2', border: '1px solid #fecaca', borderRadius: 10, padding: 16, marginBottom: 12 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: '#991b1b', marginBottom: 8 }}>What happens if you skip the permit?</div>
        {[
          '🚫 Double fees — 100% penalty when discovered',
          '🛑 Stop-work order — all work halts immediately',
          '🔨 May be required to demolish or expose completed work',
          '🏠 Cannot sell your home until work is permitted',
          '💰 Insurance may deny claims from unpermitted work',
          '⚖️ Full legal liability if unpermitted work causes injury',
        ].map((c, i) => (
          <div key={i} style={{ fontSize: 13, color: '#7f1d1d', padding: '3px 0' }}>{c}</div>
        ))}
      </div>

      {/* Owner-builder */}
      {answers.propertyType === 'single_family' && answers.isPrimaryResidence === 'Yes' && (
        <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 10, padding: 16, marginBottom: 12 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: '#0f766e', marginBottom: 4 }}>💡 Owner-Builder Option</div>
          <div style={{ fontSize: 13, color: '#115e59', lineHeight: 1.6 }}>As a homeowner, you may be able to pull your own permit without a licensed contractor under Florida Statute 489.103(7). You must personally appear at the building department and sign an Owner-Builder Disclosure Statement.</div>
        </div>
      )}

      <CityContact />

      {/* CTAs */}
      <div style={{ marginTop: 16 }}>
        <button onClick={() => navigate('/PermitGuide')} style={{ width: '100%', background: '#004ac6', color: 'white', border: 'none', borderRadius: 10, padding: '14px 24px', fontFamily: 'Manrope, sans-serif', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 8 }}>
          Start My Permit Application →
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate('/FeeCalculator')} style={{ flex: 1, background: 'white', border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 16px', fontSize: 13, cursor: 'pointer', color: '#374151' }}>Calculate Exact Fee</button>
          <button onClick={onReset} style={{ flex: 1, background: 'transparent', border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 16px', fontSize: 13, cursor: 'pointer', color: '#6b7280' }}>Check Another</button>
        </div>
        {currentUser && !saved && (
          <button onClick={handleSave} disabled={saving} style={{ width: '100%', marginTop: 8, background: '#f8f9ff', border: '1px solid #e0e4f0', borderRadius: 8, padding: '10px 16px', fontSize: 13, cursor: 'pointer', color: '#374151' }}>
            {saving ? 'Saving…' : '💾 Save Result'}
          </button>
        )}
        {saved && <div style={{ textAlign: 'center', fontSize: 13, color: '#16a34a', marginTop: 8 }}>✓ Result saved!</div>}
      </div>
    </div>
  );
}