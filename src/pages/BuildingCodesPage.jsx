import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Search, BookOpen, Loader2, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

const CATEGORIES = ["All", "building", "zoning", "electrical", "plumbing", "fire_safety", "administrative", "environmental", "other"];
const CATEGORY_LABELS = { All: "All", building: "Building", zoning: "Zoning", electrical: "Electrical", plumbing: "Plumbing", fire_safety: "Fire Safety", administrative: "Administrative", environmental: "Environmental", other: "Other" };
const CATEGORY_STYLES = {
  building:       { bg: "#eff6ff", color: "#1e40af" },
  zoning:         { bg: "#f5f3ff", color: "#6d28d9" },
  electrical:     { bg: "#fffbeb", color: "#92400e" },
  plumbing:       { bg: "#f0fdfa", color: "#065f46" },
  fire_safety:    { bg: "#fef2f2", color: "#b91c1c" },
  administrative: { bg: "#f3f4f6", color: "#374151" },
  environmental:  { bg: "#ecfdf5", color: "#047857" },
  other:          { bg: "#f9fafb", color: "#6b7280" },
};

export default function BuildingCodesPage() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [results, setResults] = useState([]);
  const [popular, setPopular] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    supabase.from("weston_code_of_ordinances")
      .select("id,section_number,section_title,chapter_number,chapter_title,category")
      .eq("is_active", true).limit(6).then(({ data }) => setPopular(data || []));
  }, []);

  const handleSearch = async () => {
    if (!query.trim() && selectedCategory === "All") return;
    setLoading(true); setHasSearched(true); setExpanded({});
    let q = supabase.from("weston_code_of_ordinances")
      .select("id,section_number,section_title,chapter_number,chapter_title,category,content,reference_url")
      .eq("is_active", true).limit(20);

    if (query.trim()) {
      q = q.or(`content.ilike.%${query}%,section_title.ilike.%${query}%,chapter_title.ilike.%${query}%,section_number.ilike.%${query}%`);
    }
    if (selectedCategory !== "All") q = q.eq("category", selectedCategory);

    const { data } = await q;
    setResults(data || []);
    setLoading(false);
  };

  const toggleExpand = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  return (
    <div style={{ background: "#f8f9ff", minHeight: "100vh", paddingBottom: 48 }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #191B23 0%, #2d2f3d 100%)", padding: "44px 24px 36px" }}>
        <div className="max-w-4xl mx-auto">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <BookOpen className="w-5 h-5" style={{ color: "rgba(255,255,255,0.6)" }} />
            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Code of Ordinances</span>
          </div>
          <h1 style={{ color: "white", fontSize: 30, fontWeight: 800, fontFamily: "'Manrope', sans-serif", marginBottom: 8 }}>Building Codes & Ordinances</h1>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif", maxWidth: 520 }}>
            Search Weston's Code of Ordinances — covering zoning, building, electrical, plumbing, and more.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Search bar */}
        <div style={{ background: "white", border: "1px solid #e8eaf0", borderRadius: 16, padding: "20px", marginBottom: 24, boxShadow: "0 1px 4px rgba(15,23,42,0.06)" }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", border: "1px solid #e0e4f0", borderRadius: 10, padding: "0 14px", background: "white" }}>
              <Search className="w-4 h-4" style={{ color: "#9ca3af", flexShrink: 0 }} />
              <input value={query} onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder="Search by keyword, chapter, or section number..."
                style={{ flex: 1, border: "none", outline: "none", padding: "11px 10px", fontSize: 14, color: "#191B23", fontFamily: "'Plus Jakarta Sans', sans-serif", background: "transparent" }} />
            </div>
            <button onClick={handleSearch}
              style={{ background: "#004ac6", color: "white", border: "none", borderRadius: 10, padding: "11px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", flexShrink: 0 }}>
              Search
            </button>
          </div>
          {/* Category pills */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setSelectedCategory(c)}
                style={{ padding: "5px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 12, transition: "all 0.15s", background: selectedCategory === c ? "#004ac6" : "#f3f4f6", color: selectedCategory === c ? "white" : "#374151" }}>
                {CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
            <Loader2 className="w-7 h-7 animate-spin" style={{ color: "#004ac6" }} />
          </div>
        ) : hasSearched ? (
          results.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 24px", background: "white", borderRadius: 14, border: "1px solid #e8eaf0" }}>
              <BookOpen className="w-10 h-10 mx-auto mb-3" style={{ color: "#d1d5db" }} />
              <p style={{ fontSize: 15, fontWeight: 700, color: "#374151", fontFamily: "'Manrope', sans-serif" }}>No results found</p>
              <p style={{ fontSize: 13, color: "#9ca3af", fontFamily: "'Plus Jakarta Sans', sans-serif", marginTop: 6 }}>Try different keywords.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ fontSize: 13, color: "#6b7280", fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 4 }}>{results.length} result{results.length !== 1 ? "s" : ""} found</p>
              {results.map(r => <CodeCard key={r.id} item={r} expanded={!!expanded[r.id]} onToggle={() => toggleExpand(r.id)} />)}
            </div>
          )
        ) : (
          /* Default: popular sections */
          popular.length > 0 && (
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "#191B23", fontFamily: "'Manrope', sans-serif", marginBottom: 14 }}>Popular Sections</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {popular.map(r => (
                  <div key={r.id} style={{ background: "white", border: "1px solid #e8eaf0", borderRadius: 14, padding: "18px 20px", boxShadow: "0 1px 4px rgba(15,23,42,0.04)" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div>
                        {r.section_number && <span style={{ fontFamily: "monospace", fontSize: 10, color: "#9ca3af", display: "block", marginBottom: 3 }}>{r.section_number}</span>}
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#191B23", fontFamily: "'Manrope', sans-serif", margin: "0 0 3px" }}>{r.section_title}</p>
                        <p style={{ fontSize: 11, color: "#9ca3af", fontFamily: "'Plus Jakarta Sans', sans-serif", margin: "0 0 8px" }}>
                          {r.chapter_number ? `Chapter ${r.chapter_number}` : ""}{r.chapter_title ? ` — ${r.chapter_title}` : ""}
                        </p>
                        {r.category && (
                          <CategoryBadge category={r.category} />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        )}

        {/* CTA */}
        <div style={{ marginTop: 40, background: "white", border: "1px solid #e8eaf0", borderRadius: 16, padding: "28px", textAlign: "center", boxShadow: "0 1px 4px rgba(15,23,42,0.06)" }}>
          <p style={{ fontSize: 14, color: "#374151", fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 16 }}>
            Need help interpreting a code section? Ask our AI assistant.
          </p>
          <Link to="/"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#004ac6", color: "white", padding: "10px 22px", borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: "none", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Ask our AI assistant →
          </Link>
        </div>
      </div>
    </div>
  );
}

function CodeCard({ item, expanded, onToggle }) {
  const catStyle = CATEGORY_STYLES[item.category] || CATEGORY_STYLES.other;
  const preview = item.content ? item.content.slice(0, 200) : "";

  return (
    <div style={{ background: "white", border: "1px solid #e8eaf0", borderRadius: 14, padding: "18px 20px", boxShadow: "0 1px 4px rgba(15,23,42,0.04)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            {item.chapter_number && (
              <span style={{ background: "#f0f4ff", color: "#004ac6", borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Ch. {item.chapter_number}</span>
            )}
            {item.section_number && (
              <span style={{ fontFamily: "monospace", fontSize: 11, color: "#9ca3af" }}>{item.section_number}</span>
            )}
            <CategoryBadge category={item.category} />
          </div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#191B23", fontFamily: "'Manrope', sans-serif", margin: "0 0 3px" }}>{item.section_title}</h3>
          {item.chapter_title && (
            <p style={{ fontSize: 11, color: "#9ca3af", fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0 }}>
              {item.chapter_title}
            </p>
          )}
        </div>
        {item.reference_url && (
          <a href={item.reference_url} target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 4, color: "#004ac6", fontSize: 11, fontWeight: 600, textDecoration: "none", fontFamily: "'Plus Jakarta Sans', sans-serif", flexShrink: 0 }}>
            <ExternalLink className="w-3 h-3" /> Full Code
          </a>
        )}
      </div>

      {item.content && (
        <div style={{ marginTop: 8 }}>
          <p style={{ fontSize: 12, color: "#6b7280", fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.6, margin: 0 }}>
            {expanded ? item.content : `${preview}${item.content.length > 200 ? "..." : ""}`}
          </p>
          {item.content.length > 200 && (
            <button onClick={onToggle}
              style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", color: "#004ac6", fontSize: 12, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif", padding: "6px 0 0", marginTop: 4 }}>
              {expanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Show more</>}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function CategoryBadge({ category }) {
  const st = CATEGORY_STYLES[category] || CATEGORY_STYLES.other;
  return (
    <span style={{ background: st.bg, color: st.color, borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {CATEGORY_LABELS[category] || category}
    </span>
  );
}