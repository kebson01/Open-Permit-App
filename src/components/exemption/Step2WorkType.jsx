import {
  Paintbrush, Wrench, Trees, Fence, Package, Sun, Home, Square,
  Snowflake, Flame, Zap, Waves, SunMedium, Shield, PlusSquare, Building2
} from "lucide-react";

const PRIMARY = "#004ac6";

const WORK_GROUPS = [
  {
    label: "Usually Exempt",
    color: "#059669",
    items: [
      { key: "painting_cosmetic", label: "Painting & Cosmetic", desc: "Interior/exterior paint, flooring, carpet, tile, countertops, cabinets", Icon: Paintbrush },
      { key: "minor_repairs", label: "Minor Repairs", desc: "Fixing existing fixtures, patching walls, replacing faucets", Icon: Wrench },
      { key: "landscaping", label: "Landscaping", desc: "Lawn, plants, irrigation (not structures)", Icon: Trees },
    ],
  },
  {
    label: "Depends on Details",
    color: "#d97706",
    items: [
      { key: "fence_gate", label: "Fence / Gate", desc: "New or replacement fence", Icon: Fence },
      { key: "shed_pergola", label: "Shed / Pergola", desc: "Detached accessory structures", Icon: Package },
      { key: "awning_sunshade", label: "Awning / Sunshade", desc: "Window awnings, shade structures", Icon: Sun },
    ],
  },
  {
    label: "Almost Always Requires Permit",
    color: "#b91c1c",
    items: [
      { key: "roof", label: "Roof", desc: "Repair, replacement, or new roof", Icon: Home },
      { key: "windows_doors", label: "Windows / Doors", desc: "Replacing windows or exterior doors", Icon: Square },
      { key: "hvac", label: "HVAC / A/C", desc: "Air conditioning, heat pump, air handler", Icon: Snowflake },
      { key: "water_heater", label: "Water Heater", desc: "Tank or tankless water heater replacement", Icon: Flame },
      { key: "electrical", label: "Electrical", desc: "Panels, new circuits, service upgrades", Icon: Zap },
      { key: "pool_spa", label: "Pool / Spa", desc: "New or existing pool work", Icon: Waves },
      { key: "solar", label: "Solar Panels", desc: "Photovoltaic solar installation", Icon: SunMedium },
      { key: "generator", label: "Generator", desc: "Standby or portable generator", Icon: Zap },
      { key: "hurricane_shutters", label: "Hurricane Shutters", desc: "Impact shutters, accordion, roll-down", Icon: Shield },
      { key: "room_addition", label: "Room Addition", desc: "Expanding living space", Icon: PlusSquare },
      { key: "structural", label: "Structural / Foundation", desc: "Structural repairs or changes", Icon: Building2 },
    ],
  },
];

export default function Step2WorkType({ answers, setAnswer, onNext, onBack }) {
  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: "#191B23", fontFamily: "'Manrope', sans-serif", marginBottom: 6 }}>What type of work are you planning?</h2>
      <p style={{ fontSize: 13, color: "#6b7280", fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 20 }}>Select the option that best describes your project.</p>

      {WORK_GROUPS.map(group => (
        <div key={group.label} style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: group.color }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: group.color, fontFamily: "'Plus Jakarta Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.05em" }}>{group.label}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
            {group.items.map(({ key, label, desc, Icon: Ic }) => {
              const sel = answers.workType === key;
              return (
                <button key={key} onClick={() => setAnswer("workType", key)}
                  style={{ padding: "12px 10px", borderRadius: 12, border: `2px solid ${sel ? PRIMARY : "#e0e4f0"}`, background: sel ? "#eff6ff" : "white", cursor: "pointer", textAlign: "left", transition: "all 0.15s", display: "flex", flexDirection: "column", gap: 6 }}>
                  <Ic className="w-5 h-5" style={{ color: sel ? PRIMARY : "#9ca3af" }} />
                  <p style={{ fontSize: 12, fontWeight: 700, color: sel ? PRIMARY : "#374151", fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0, lineHeight: 1.3 }}>{label}</p>
                  <p style={{ fontSize: 10, color: "#9ca3af", fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0, lineHeight: 1.4 }}>{desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button onClick={onBack} style={{ flex: 1, background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 12, padding: "12px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>← Back</button>
        <button onClick={onNext} disabled={!answers.workType}
          style={{ flex: 2, background: answers.workType ? PRIMARY : "#e0e4f0", color: answers.workType ? "white" : "#9ca3af", border: "none", borderRadius: 12, padding: "12px", fontWeight: 700, fontSize: 14, cursor: answers.workType ? "pointer" : "not-allowed", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Next →
        </button>
      </div>
    </div>
  );
}