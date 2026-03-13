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

    const q = query.trim().toUpperCase();

    // Try folio first (exact)
    let props = await base44.entities.Property.filter({ FOLIO_NUMBER: q }, "-updated_date", 20);

    // If no folio match, try street name
    if (!props.length) {
      props = await base44.entities.Property.filter({ SITUS_STREET_NAME: q }, "-updated_date", 50);
    }

    // Try partial street number + name combo
    if (!props.length && q.includes(" ")) {
      const parts = q.split(" ");
      const streetTypes = ["RD","DR","AVE","ST","BLVD","LN","CT","PL","WAY","TER","CIR","PL","PKWY","HWY","PATH","WALK","SQ","LOOP"];
      const lastWord = parts[parts.length - 1];
      const hasStreetType = streetTypes.includes(lastWord);

      // Try with number + full street name (minus street type if present)
      const streetNameParts = parts.slice(1);
      const streetName = hasStreetType
        ? streetNameParts.slice(0, -1).join(" ")
        : streetNameParts.join(" ");

      props = await base44.entities.Property.filter(
        { SITUS_STREET_NUMBER: parts[0], SITUS_STREET_NAME: streetName },
        "-updated_date", 20
      );

      // Also try without street number (just street name minus type)
      if (!props.length && hasStreetType) {
        props = await base44.entities.Property.filter(
          { SITUS_STREET_NAME: streetName },
          "-updated_date", 50
        );
      }
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