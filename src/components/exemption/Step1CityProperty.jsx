import { Home, Building2, Store } from "lucide-react";

const PRIMARY = "#004ac6";
const CITIES = ["Weston", "Hollywood", "Coral Springs", "Cooper City", "Fort Lauderdale", "Sunrise"];
const PROPERTY_TYPES = [
  { key: "single_family", label: "Single-Family Home", desc: "Detached residential home", Ic: Home },
  { key: "condo_townhouse", label: "Condo / Townhouse", desc: "Attached or multi-family unit", Ic: Building2 },
  { key: "commercial", label: "Commercial", desc: "Business or non-residential", Ic: Store },
];

export default function Step1CityProperty({ answers, setAnswer, onNext }) {
  const ready = answers.city && answers.propertyType;
  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: "#191B23", fontFamily: "'Manrope', sans-serif", marginBottom: 6 }}>Tell us about your property</h2>
      <p style={{ fontSize: 13, color: "#6b7280", fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 24 }}>We'll tailor the results to your city's specific rules.</p>

      {/* City */}
      <label style={labelSt}>Which city is your property in?</label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 24 }} className="sm:grid-cols-3">
        {CITIES.map(c => (
          <button key={c} onClick={() => setAnswer("city", c)}
            style={{ padding: "10px 8px", borderRadius: 10, border: `2px solid ${answers.city === c ? PRIMARY : "#e0e4f0"}`, background: answers.city === c ? "#eff6ff" : "white", fontWeight: 700, fontSize: 13, color: answers.city === c ? PRIMARY : "#374151", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all 0.15s" }}>
            {c}
          </button>
        ))}
      </div>

      {/* Property type */}
      <label style={labelSt}>What type of property is this?</label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 28 }}>
        {PROPERTY_TYPES.map(({ key, label, desc, Ic }) => (
          <button key={key} onClick={() => setAnswer("propertyType", key)}
            style={{ padding: "16px 12px", borderRadius: 12, border: `2px solid ${answers.propertyType === key ? PRIMARY : "#e0e4f0"}`, background: answers.propertyType === key ? "#eff6ff" : "white", cursor: "pointer", textAlign: "center", transition: "all 0.15s" }}>
            <Ic className="w-6 h-6 mx-auto mb-2" style={{ color: answers.propertyType === key ? PRIMARY : "#9ca3af" }} />
            <p style={{ fontSize: 13, fontWeight: 700, color: answers.propertyType === key ? PRIMARY : "#374151", fontFamily: "'Plus Jakarta Sans', sans-serif", margin: "0 0 3px" }}>{label}</p>
            <p style={{ fontSize: 10, color: "#9ca3af", fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0 }}>{desc}</p>
          </button>
        ))}
      </div>

      <button onClick={onNext} disabled={!ready}
        style={{ width: "100%", background: ready ? PRIMARY : "#e0e4f0", color: ready ? "white" : "#9ca3af", border: "none", borderRadius: 12, padding: "13px", fontWeight: 700, fontSize: 15, cursor: ready ? "pointer" : "not-allowed", fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all 0.15s" }}>
        Next →
      </button>
    </div>
  );
}

const labelSt = { display: "block", fontSize: 13, fontWeight: 700, color: "#374151", fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 10 };