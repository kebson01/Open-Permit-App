import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Home, MapPin, User, DollarSign, Calendar, Building2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PropertyCard from "@/components/property/PropertyCard.jsx";
import PropertyDetail from "@/components/property/PropertyDetail.jsx";

export default function PropertyGuide() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    setSelected(null);

    // Strip city/state/zip suffixes (everything after a comma)
    const cleaned = query.trim().toUpperCase().split(",")[0].trim();

    // Try folio first (all digits, no spaces)
    if (/^\d+$/.test(cleaned)) {
      const props = await base44.entities.Property.filter({ FOLIO_NUMBER: cleaned }, "-updated_date", 20);
      setResults(props);
      setLoading(false);
      return;
    }

    const DIRECTIONS = ["N","S","E","W","NW","NE","SW","SE","NORTH","SOUTH","EAST","WEST"];
    const STREET_TYPES = ["RD","DR","AVE","ST","BLVD","LN","CT","PL","WAY","TER","CIR","PKWY","HWY","PATH","WALK","SQ","LOOP","TERR","TRAIL","TR"];

    const parts = cleaned.split(/\s+/);
    const streetNum = /^\d+/.test(parts[0]) ? parts[0] : null;

    // Remove street number, leading direction, trailing street type to isolate street name
    let remaining = streetNum ? parts.slice(1) : parts;
    if (remaining.length && DIRECTIONS.includes(remaining[0])) remaining = remaining.slice(1);
    const lastWord = remaining[remaining.length - 1];
    const hasType = STREET_TYPES.includes(lastWord);
    const streetName = hasType ? remaining.slice(0, -1).join(" ") : remaining.join(" ");
    const streetDir = parts.length > 1 && DIRECTIONS.includes(parts[streetNum ? 1 : 0])
      ? parts[streetNum ? 1 : 0] : null;

    let props = [];

    // 1. Number + direction + name
    if (streetNum && streetDir && streetName) {
      props = await base44.entities.Property.filter(
        { SITUS_STREET_NUMBER: streetNum, SITUS_STREET_DIRECTION: streetDir, SITUS_STREET_NAME: streetName },
        "-updated_date", 20
      );
    }

    // 2. Number + name (no direction)
    if (!props.length && streetNum && streetName) {
      props = await base44.entities.Property.filter(
        { SITUS_STREET_NUMBER: streetNum, SITUS_STREET_NAME: streetName },
        "-updated_date", 20
      );
    }

    // 3. Just street name
    if (!props.length && streetName) {
      props = await base44.entities.Property.filter(
        { SITUS_STREET_NAME: streetName },
        "-updated_date", 50
      );
    }

    // 4. Fallback: full cleaned string as street name
    if (!props.length) {
      props = await base44.entities.Property.filter(
        { SITUS_STREET_NAME: cleaned },
        "-updated_date", 50
      );
    }

    setResults(props);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="gradient-primary py-10 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Building2 className="w-7 h-7 text-blue-300" />
            <h1 className="text-3xl font-bold text-white">Property Guide</h1>
          </div>
          <p className="text-blue-200 mb-6">Search any Broward County property by address or folio number</p>

          {/* Search Bar */}
          <div className="flex gap-2 bg-white rounded-xl p-2 shadow-lg">
            <div className="flex-1 flex items-center gap-2 px-3">
              <Search className="w-5 h-5 text-gray-400 shrink-0" />
              <Input
                className="border-0 shadow-none focus-visible:ring-0 text-base p-0"
                placeholder="e.g. 654 Nandina Dr  or  514204012090"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && search()}
              />
            </div>
            <Button onClick={search} disabled={loading} className="px-6 gradient-primary">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
            </Button>
          </div>
          <p className="text-blue-300 text-xs mt-3">Search by folio number, street name, or full address</p>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {selected ? (
          <PropertyDetail property={selected} onBack={() => setSelected(null)} />
        ) : (
          <>
            {searched && !loading && (
              <p className="text-sm text-gray-500 mb-4">
                {results.length === 0
                  ? "No properties found. Try a different address or folio number."
                  : `${results.length} propert${results.length === 1 ? "y" : "ies"} found`}
              </p>
            )}
            <div className="grid gap-4">
              {results.map((prop) => (
                <PropertyCard key={prop.id} property={prop} onClick={() => setSelected(prop)} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}