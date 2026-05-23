import { useState } from "react";
import { Search, Loader2, Building2, MapPin } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

const FONTS = { b: "'Plus Jakarta Sans', system-ui, sans-serif" };

export default function PropertySearchBox({ onSelect, placeholder, cityFilter }) {
  const [searchInput, setSearchInput] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSearch() {
    const query = searchInput.trim();
    if (!query || query.length < 3) {
      setErrorMsg("Please enter at least 3 characters");
      return;
    }
    setIsLoading(true);
    setErrorMsg("");
    setResults([]);

    try {
      const { data, error } = await supabase.rpc("search_properties", { search_query: query });
      if (error) throw error;
      if (!data || data.length === 0) {
        setErrorMsg("No properties found. Try a different address, folio number, or owner name.");
        return;
      }
      setResults(data);
    } catch (err) {
      setErrorMsg("Search unavailable. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
              onClick={() => { onSelect(p); setResults([]); setSearchInput(""); }}
              className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0"
              style={{ fontFamily: FONTS.b }}
            >
              <div className="flex items-start gap-2">
                <Building2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{p.full_address || p.folio_number}</p>
                  {p.owner_name && <p className="text-xs text-gray-500 mt-0.5">{p.owner_name}</p>}
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400 font-mono">{p.folio_number}</span>
                    {p.city_name && <span className="text-xs text-gray-400">· {p.city_name}{p.zip_code ? ` ${p.zip_code}` : ""}</span>}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}