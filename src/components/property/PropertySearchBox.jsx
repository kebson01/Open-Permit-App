import { useState } from "react";
import { Search, Loader2, Building2, MapPin, CheckCircle2 } from "lucide-react";
import { searchProperties } from "@/lib/searchProperties";

const FONTS = { b: "'Plus Jakarta Sans', system-ui, sans-serif" };

export default function PropertySearchBox({ onSelect, placeholder, cityFilter }) {
  const [searchInput, setSearchInput] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [selected, setSelected] = useState(null);

  const handleSearch = () => searchProperties(searchInput, setResults, setIsLoading, setErrorMsg);

  const handleSelect = (p) => {
    setSelected(p);
    setResults([]);
    setSearchInput("");
    onSelect(p);
  };

  const handleClear = () => {
    setSelected(null);
    setResults([]);
    setSearchInput("");
    setErrorMsg("");
  };

  if (selected) {
    return (
      <div className="rounded-xl border p-4 bg-white" style={{ borderColor: "#C3C5D7" }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2 min-w-0">
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-sm leading-snug">{selected.full_address}</p>
              <p className="text-xs text-gray-500 mt-0.5">Owner: {selected.owner_name || "—"}</p>
              <p className="text-xs font-mono text-gray-400 mt-0.5">Folio: {selected.folio_number}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {[
                  selected.year_built ? `${selected.year_built} built` : null,
                  selected.total_sqft ? `${parseInt(selected.total_sqft).toLocaleString()} sq ft` : null,
                  (selected.beds || selected.baths) ? `${selected.beds || "—"} bed / ${selected.baths || "—"} bath` : null,
                  selected.homestead_flag === "Y" ? "Homestead: Yes" : selected.homestead_flag === "N" ? "Homestead: No" : null,
                ].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-xs text-gray-400">{selected.city_name}</span>
            <button onClick={handleClear} className="text-xs text-blue-600 font-semibold underline mt-1">Clear</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            value={searchInput}
            onChange={e => { setSearchInput(e.target.value); setErrorMsg(""); }}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder={placeholder || "Search by address, folio number, or owner name..."}
            className="flex-1 bg-transparent text-sm focus:outline-none text-gray-800"
            style={{ fontFamily: FONTS.b }}
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={isLoading}
          className="px-4 py-2.5 rounded-xl text-white font-bold text-sm flex items-center gap-2 disabled:opacity-60 transition-opacity hover:opacity-90"
          style={{ background: "#004ac6" }}
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </button>
      </div>

      {errorMsg && (
        <p className="mt-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2" style={{ fontFamily: FONTS.b }}>
          {errorMsg}
        </p>
      )}

      {results.length > 0 && (
        <div className="mt-2 space-y-1 max-h-56 overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-md">
          {results.map((p, i) => (
            <button
              key={p.folio_number || i}
              onClick={() => handleSelect(p)}
              className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0"
              style={{ fontFamily: FONTS.b }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  <Building2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">{p.full_address || p.folio_number}</p>
                    {p.owner_name && <p className="text-xs text-gray-500 mt-0.5">{p.owner_name}</p>}
                    <p className="text-xs font-mono text-gray-400 mt-0.5">{p.folio_number}</p>
                  </div>
                </div>
                {p.city_name && (
                  <span className="text-xs text-gray-400 shrink-0 mt-0.5">{p.city_name}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}