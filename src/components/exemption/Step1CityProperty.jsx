import { Home, Building2, Store } from "lucide-react";
import { useCities } from "@/hooks/useCities";
import { rememberCity } from "@/lib/permitTypes";
import { C, F, T } from "@/lib/theme";

/**
 * Step 1 — which city, and what kind of property.
 *
 * This offered a hardcoded list of six cities while the app covers 22, so
 * anyone in the other sixteen could not complete the checker at all. The list
 * now comes from the same `cities` table everything else reads, and a choice
 * made here is remembered app-wide like any other.
 *
 * A select rather than a grid of buttons: 22 tap targets is a wall, and on a
 * phone the native picker is faster than scrolling one.
 */
const PROPERTY_TYPES = [
  { key: "single_family",   label: "Single-Family Home", desc: "Detached residential home",   Ic: Home },
  { key: "condo_townhouse", label: "Condo / Townhouse",  desc: "Attached or multi-family unit", Ic: Building2 },
  { key: "commercial",      label: "Commercial",         desc: "Business or non-residential", Ic: Store },
];

export default function Step1CityProperty({ answers, setAnswer, onNext }) {
  const { cities, loading } = useCities();
  const ready = answers.city && answers.propertyType;

  const pickCity = (name) => {
    setAnswer("city", name);
    rememberCity(name);
  };

  return (
    <div>
      <h2 style={{ fontSize: T.lead, fontWeight: 800, color: C.ink, fontFamily: F.head, marginBottom: 6 }}>
        Tell us about your property
      </h2>
      <p style={{ fontSize: T.small, color: C.muted, fontFamily: F.body, marginBottom: 22 }}>
        We&rsquo;ll tailor the results to your city&rsquo;s specific rules.
      </p>

      <label htmlFor="exemption-city" style={labelSt}>Which city is your property in?</label>
      <select
        id="exemption-city"
        value={answers.city}
        onChange={(e) => pickCity(e.target.value)}
        disabled={loading}
        style={{
          width: "100%",
          padding: "12px 12px",
          borderRadius: 10,
          border: `1px solid ${C.line}`,
          background: C.surface,
          color: answers.city ? C.ink : C.faint,
          fontFamily: F.body,
          fontSize: T.body,
          fontWeight: 600,
          marginBottom: 22,
        }}
      >
        <option value="">{loading ? "Loading cities…" : "Choose your city"}</option>
        {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
      </select>

      <label style={labelSt}>What type of property is this?</label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 26 }}>
        {PROPERTY_TYPES.map(({ key, label, desc, Ic }) => {
          const on = answers.propertyType === key;
          return (
            <button
              key={key}
              onClick={() => setAnswer("propertyType", key)}
              aria-pressed={on}
              style={{
                padding: "16px 10px",
                borderRadius: 12,
                border: `1.5px solid ${on ? C.brand : C.line}`,
                background: on ? C.brandSoft : C.surface,
                cursor: "pointer",
                textAlign: "center",
                transition: "all 0.15s",
              }}
            >
              <Ic className="mx-auto mb-2 h-6 w-6" style={{ color: on ? C.brand : C.faint }} aria-hidden="true" />
              <p style={{ fontSize: T.small, fontWeight: 700, color: on ? C.brand : C.ink, fontFamily: F.body, margin: "0 0 3px" }}>
                {label}
              </p>
              <p style={{ fontSize: 10, color: C.faint, fontFamily: F.body, margin: 0 }}>{desc}</p>
            </button>
          );
        })}
      </div>

      <button
        onClick={onNext}
        disabled={!ready}
        style={{
          width: "100%",
          background: ready ? C.brand : C.line,
          color: ready ? "#fff" : C.faint,
          border: "none",
          borderRadius: 10,
          padding: "13px",
          fontWeight: 700,
          fontSize: T.body,
          cursor: ready ? "pointer" : "not-allowed",
          fontFamily: F.head,
          transition: "all 0.15s",
        }}
      >
        Next
      </button>
    </div>
  );
}

const labelSt = {
  display: "block",
  fontSize: T.small,
  fontWeight: 700,
  color: C.ink,
  fontFamily: F.head,
  marginBottom: 10,
};
