/**
 * StatCard — single KPI tile.
 *
 * tone: "default" | "success" | "warning" | "danger"
 */
const TONE_VALUE = {
  default: "text-action",
  success: "text-success",
  warning: "text-warning",
  danger:  "text-danger",
};

export default function StatCard({ label, value, sub, tone = "default" }) {
  return (
    <div className="bg-white rounded-card border border-line shadow-card p-5">
      <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-3xl font-extrabold leading-none ${TONE_VALUE[tone] ?? TONE_VALUE.default}`}>{value}</p>
      {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
    </div>
  );
}