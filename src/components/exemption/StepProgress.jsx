export default function StepProgress({ current, total }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
      {Array.from({ length: total }, (_, i) => i + 1).map(n => (
        <div key={n} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif",
            background: n < current ? "#003466" : n === current ? "#003466" : "#f0f0f0",
            color: n <= current ? "white" : "#9ca3af",
            border: n === current ? "3px solid #93c5fd" : "none",
            boxSizing: "border-box",
          }}>{n < current ? "✓" : n}</div>
          {n < total && <div style={{ width: 32, height: 2, background: n < current ? "#003466" : "#e0e0e0", borderRadius: 1 }} />}
        </div>
      ))}
      <span style={{ marginLeft: 6, fontSize: 12, color: "#6b7280", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 }}>
        Step {current} of {total}
      </span>
    </div>
  );
}