const PRIMARY = "#004ac6";

function YesNo({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {["Yes", "No"].map(v => (
        <button key={v} onClick={() => onChange(v)}
          style={{ flex: 1, padding: "9px", borderRadius: 8, border: `2px solid ${value === v ? PRIMARY : "#e0e4f0"}`, background: value === v ? "#eff6ff" : "white", fontWeight: 700, fontSize: 13, color: value === v ? PRIMARY : "#374151", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {v}
        </button>
      ))}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 8 }}>{label}</label>
      {children}
    </div>
  );
}

const inp = { width: "100%", border: "1px solid #e0e4f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#191B23", fontFamily: "'Plus Jakarta Sans', sans-serif", outline: "none", boxSizing: "border-box" };

function WorkTypeFields({ answers, setAnswer }) {
  const wt = answers.workType;

  if (wt === "painting_cosmetic") return (
    <>
      <Field label="Does the work involve any structural changes (moving walls, altering structure)?">
        <YesNo value={answers.structuralChanges} onChange={v => setAnswer("structuralChanges", v)} />
      </Field>
      <Field label="Will new electrical or plumbing be added?">
        <YesNo value={answers.newElecPlumbing} onChange={v => setAnswer("newElecPlumbing", v)} />
      </Field>
    </>
  );

  if (wt === "fence_gate") return (
    <>
      <Field label="What is the fence height in feet?">
        <input type="number" value={answers.fenceHeight} onChange={e => setAnswer("fenceHeight", e.target.value)} placeholder="e.g. 6" style={inp} />
      </Field>
      <Field label="What material is the fence?">
        <select value={answers.fenceMaterial} onChange={e => setAnswer("fenceMaterial", e.target.value)} style={inp}>
          <option value="">Select material</option>
          {["Wood", "Aluminum", "Vinyl", "Chain Link", "Masonry", "Other"].map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </Field>
      <Field label="Is the fence on the front of the property?">
        <YesNo value={answers.fenceFront} onChange={v => setAnswer("fenceFront", v)} />
      </Field>
    </>
  );

  if (wt === "shed_pergola") return (
    <>
      <Field label="What is the footprint size in square feet?">
        <input type="number" value={answers.shedSqft} onChange={e => setAnswer("shedSqft", e.target.value)} placeholder="e.g. 80" style={inp} />
      </Field>
      <Field label="Will it have electricity or plumbing?">
        <YesNo value={answers.shedElectricity} onChange={v => setAnswer("shedElectricity", v)} />
      </Field>
      <Field label="Is it pre-fabricated or custom built?">
        <select value={answers.shedPrefab} onChange={e => setAnswer("shedPrefab", e.target.value)} style={inp}>
          <option value="">Select</option>
          <option value="Pre-fab">Pre-fabricated</option>
          <option value="Custom">Custom built</option>
        </select>
      </Field>
    </>
  );

  if (wt === "roof") return (
    <>
      <Field label="What type of roof work?">
        <select value={answers.roofWorkType} onChange={e => setAnswer("roofWorkType", e.target.value)} style={inp}>
          <option value="">Select</option>
          <option value="full_replacement">Full replacement</option>
          <option value="partial_repair">Partial repair</option>
          <option value="minor_repair">Minor repair (under 25% of roof)</option>
        </select>
      </Field>
      <Field label="Estimated cost ($)">
        <input type="number" value={answers.projectCost} onChange={e => setAnswer("projectCost", e.target.value)} placeholder="e.g. 12000" style={inp} />
      </Field>
    </>
  );

  if (wt === "hvac") return (
    <>
      <Field label="Is this a like-for-like replacement (same location, same capacity)?">
        <YesNo value={answers.hvacLikeForLike} onChange={v => setAnswer("hvacLikeForLike", v)} />
      </Field>
      <Field label="Estimated cost ($)">
        <input type="number" value={answers.projectCost} onChange={e => setAnswer("projectCost", e.target.value)} placeholder="e.g. 6000" style={inp} />
      </Field>
    </>
  );

  if (wt === "water_heater") return (
    <>
      <Field label="What type of water heater?">
        <select value={answers.waterHeaterType} onChange={e => setAnswer("waterHeaterType", e.target.value)} style={inp}>
          <option value="">Select</option>
          {["Electric Tank", "Gas Tank", "Tankless", "Heat Pump"].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </Field>
      <Field label="Is this a like-for-like replacement?">
        <YesNo value={answers.waterHeaterLikeForLike} onChange={v => setAnswer("waterHeaterLikeForLike", v)} />
      </Field>
    </>
  );

  if (wt === "windows_doors") return (
    <>
      <Field label="Are the new units impact-rated (hurricane)?">
        <YesNo value={answers.windowsImpact} onChange={v => setAnswer("windowsImpact", v)} />
      </Field>
      <Field label="How many openings?">
        <input type="number" value={answers.windowsCount} onChange={e => setAnswer("windowsCount", e.target.value)} placeholder="e.g. 4" style={inp} />
      </Field>
    </>
  );

  if (wt === "pool_spa") return (
    <>
      <Field label="What is the maximum depth in inches?">
        <input type="number" value={answers.poolDepth} onChange={e => setAnswer("poolDepth", e.target.value)} placeholder="e.g. 18" style={inp} />
      </Field>
      <Field label="Is this a pre-fabricated above-ground pool?">
        <YesNo value={answers.poolPrefab} onChange={v => setAnswer("poolPrefab", v)} />
      </Field>
    </>
  );

  if (wt === "minor_repairs") return (
    <>
      <Field label="Does the repair involve any structural components?">
        <YesNo value={answers.minorStructural} onChange={v => setAnswer("minorStructural", v)} />
      </Field>
      <Field label="Does it involve new electrical wiring or plumbing rough-in?">
        <YesNo value={answers.minorNewWiring} onChange={v => setAnswer("minorNewWiring", v)} />
      </Field>
    </>
  );

  return null;
}

export default function Step3Details({ answers, setAnswer, onNext, onBack }) {
  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: "#191B23", fontFamily: "'Manrope', sans-serif", marginBottom: 6 }}>Tell us more about the project</h2>
      <p style={{ fontSize: 13, color: "#6b7280", fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 22 }}>These details help us give you the most accurate answer.</p>

      <WorkTypeFields answers={answers} setAnswer={setAnswer} />

      {/* Common bottom fields */}
      {answers.workType !== "roof" && answers.workType !== "hvac" && (
        <Field label="Estimated project cost ($)">
          <input type="number" value={answers.projectCost} onChange={e => setAnswer("projectCost", e.target.value)} placeholder="e.g. 5000" style={inp} />
        </Field>
      )}
      <Field label="Is this your primary residence (homestead)?">
        <YesNo value={answers.isPrimaryResidence} onChange={v => setAnswer("isPrimaryResidence", v)} />
      </Field>

      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button onClick={onBack} style={{ flex: 1, background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 12, padding: "12px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>← Back</button>
        <button onClick={onNext}
          style={{ flex: 2, background: PRIMARY, color: "white", border: "none", borderRadius: 12, padding: "12px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Check Eligibility →
        </button>
      </div>
    </div>
  );
}