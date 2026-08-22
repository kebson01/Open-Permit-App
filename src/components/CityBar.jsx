import { useEffect, useState } from "react";
import { MapPin, ChevronDown } from "lucide-react";
import { useCities } from "@/hooks/useCities";
import { resolveCity, rememberCity } from "@/lib/permitTypes";
import { C, F, T } from "@/lib/theme";

/**
 * The city every answer on screen is scoped to.
 *
 * Permit rules differ by municipality, and the app already remembers a choice
 * in sessionStorage — but nothing displayed it, so a reader had no way to tell
 * whether they were looking at Weston's rules or their own. An unlabelled
 * answer to a question that has 22 different correct answers is worse than no
 * answer, so this sits at the top of every page that shows city-specific
 * information.
 *
 * Changing it here changes it everywhere, because it writes through the same
 * rememberCity() the guide and fee calculator read.
 */
export default function CityBar({ value, onChange, sticky = true }) {
  const { cities, loading } = useCities();
  const [city, setCity] = useState(() => value || resolveCity());

  useEffect(() => { if (value && value !== city) setCity(value); }, [value]);   // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (name) => {
    setCity(name);
    rememberCity(name);
    onChange?.(name);
  };

  return (
    <div
      className={sticky ? "sticky top-16 z-20" : ""}
      style={{
        background: C.surface,
        borderBottom: `1px solid ${C.line}`,
      }}
    >
      <div className="mx-auto flex max-w-[720px] items-center gap-2 px-4 py-2.5">
        <MapPin className="h-4 w-4 shrink-0" style={{ color: C.brand }} aria-hidden="true" />

        <span style={{ color: C.muted, fontFamily: F.body, fontSize: T.small }}>
          Showing rules for
        </span>

        {/* A native select is deliberate: on a phone it opens the OS picker,
            which is faster to use one-handed than any custom menu. */}
        <div className="relative min-w-0 flex-1">
          <label htmlFor="citybar-select" className="sr-only">Choose your city</label>
          <select
            id="citybar-select"
            value={city}
            onChange={(e) => pick(e.target.value)}
            disabled={loading}
            className="w-full cursor-pointer appearance-none bg-transparent pr-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              color: C.ink,
              fontFamily: F.head,
              fontSize: T.small,
              fontWeight: 700,
              borderRadius: 4,
            }}
          >
            {/* The remembered city may not be in the list yet while it loads. */}
            {!cities.some(c => c.name === city) && <option value={city}>{city}</option>}
            {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
            style={{ color: C.faint }}
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}
