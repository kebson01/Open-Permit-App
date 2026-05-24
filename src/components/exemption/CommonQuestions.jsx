import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const QA = [
  {
    q: "Do I need a permit to replace my AC unit?",
    a: "Yes. HVAC replacement always requires a mechanical permit in all Broward County cities. No exceptions. The only question is whether it also needs a Notice of Commencement (NOC) — required if job value exceeds $15,000.",
  },
  {
    q: "Do I need a permit to replace my water heater?",
    a: "Yes. A plumbing permit is required for all water heater replacements in Florida — including tankless water heaters. This is one of the most misunderstood rules.",
  },
  {
    q: "Is painting my house exempt?",
    a: "Yes. Exterior and interior painting is exempt under FBC-R R105.2. However, if the painting involves stucco repair or structural patching, a permit may be required for the repair work itself.",
  },
  {
    q: "Does HB 837 mean I never need a permit under $2,500?",
    a: "No. HB 837 provides a possible exemption for certain residential work under $2,500, but it explicitly does NOT cover electrical, plumbing, mechanical, or structural work. HVAC, water heaters, and electrical panels always require permits regardless of cost.",
  },
  {
    q: "Do I need a permit for a small shed?",
    a: "Under Florida Building Code, detached accessory structures under 150 sq ft with no utilities are exempt. However, Weston and Coral Springs require permits for sheds 100 sq ft and larger. Always check with your city first.",
  },
  {
    q: "Can I do my own permit work as a homeowner?",
    a: "Yes — under Florida's owner-builder exemption (FS 489.103), a homeowner can pull their own permit for their primary residence without a contractor license. However, you must personally appear and sign an affidavit at the building department.",
  },
];

export default function CommonQuestions() {
  const [open, setOpen] = useState(null);
  return (
    <div style={{ marginTop: 32 }}>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: "#191B23", fontFamily: "'Manrope', sans-serif", marginBottom: 14 }}>Common Questions</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {QA.map((item, i) => (
          <div key={i} style={{ background: "white", border: "1px solid #e8eaf0", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(15,23,42,0.04)" }}>
            <button onClick={() => setOpen(open === i ? null : i)}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 18px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#191B23", fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.4 }}>{item.q}</span>
              {open === i ? <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: "#9ca3af" }} /> : <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: "#9ca3af" }} />}
            </button>
            {open === i && (
              <div style={{ padding: "0 18px 16px", borderTop: "1px solid #f0f0f0" }}>
                <p style={{ fontSize: 13, color: "#374151", fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.7, margin: "12px 0 0" }}>{item.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}