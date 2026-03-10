import { useState } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PropertySearchBar({ onSearch, loading }) {
  const [address, setAddress] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (address.trim()) onSearch(address.trim());
  };

  const EXAMPLES = [
    "123 Main St, Weston, FL",
    "456 Palm Ave, Coral Springs, FL",
    "789 Oak Blvd, Fort Lauderdale, FL",
  ];

  return (
    <div className="bg-[#1d3461] rounded-2xl p-6 shadow-xl">
      <h2 className="text-white text-xl font-bold mb-1 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-blue-300" />
        Property Owner's Guide
      </h2>
      <p className="text-blue-200 text-sm mb-4">
        Enter any Broward County address to see what you can build based on your zoning, setbacks &amp; flood zone.
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. 123 Main St, Weston, FL"
            className="pl-9 bg-white text-gray-800 h-11"
            disabled={loading}
          />
        </div>
        <Button
          type="submit"
          disabled={loading || !address.trim()}
          className="h-11 px-6 bg-blue-500 hover:bg-blue-600 text-white font-semibold"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Look Up"}
        </Button>
      </form>
      <div className="flex flex-wrap gap-2 mt-3">
        <span className="text-xs text-blue-300">Try:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => { setAddress(ex); onSearch(ex); }}
            className="text-xs text-blue-200 hover:text-white underline"
            disabled={loading}
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}