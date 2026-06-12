import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import {
  Shield, Phone, Globe, MapPin, Loader2, Search,
  Building2, ChevronRight, HardHat, Users, ExternalLink
} from "lucide-react";
import RequestServicesModal from "@/components/providers/RequestServicesModal";

const CITIES = ["Weston", "Hollywood", "Coral Springs", "Cooper City", "Fort Lauderdale"];

const CATEGORIES = [
  "Roofing",
  "HVAC / A/C",
  "Plumbing / Gas",
  "Pool & Spa",
  "Solar",
  "General / Building",
  "Specialty / Openings",
  "Site / Driveway / Utility",
  "Irrigation",
  "Electrical",
  "Alarm",
  "Engineering / Design",
  "Architecture",
];

const TYPE_TABS = [
  { label: "All", value: null },
  { label: "Contractors", value: "contractor" },
  { label: "Private Providers", value: "private_provider" },
];

const STATUS_STYLES = {
  active:        { bg: "#ecfdf5", color: "#065f46", border: "#a7f3d0", label: "Active" },
  expiring_soon: { bg: "#fffbeb", color: "#92400e", border: "#fcd34d", label: "Expiring Soon" },
  expired:       { bg: "#fef2f2", color: "#991b1b", border: "#fca5a5", label: "Expired" },
};

const PRIMARY = "#004ac6";
const TEAL    = "#006a61";
const FF      = "'Plus Jakarta Sans', sans-serif";
const HEADING = "'Manrope', sans-serif";

export default function ProviderDirectory() {
  const [results, setResults]         = useState([]);
  const [loading, setLoading]         = useState(false);
  const [searched, setSearched]       = useState(false);
  const [searchQuery, setSearchQuery]     = useState("");
  const [typeFilter, setTypeFilter]       = useState(null);      // null | 'contractor' | 'private_provider'
  const [category, setCategory]           = useState("");
  const [statewideOnly, setStatewideOnly] = useState(false);
  const [currentUser, setCurrentUser]     = useState(null);
  const [requestTarget, setRequestTarget] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
    });
    fetchProfessionals();
  }, []);

  const fetchProfessionals = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("search_professionals", {
        p_query:          searchQuery    || null,
        p_type:           typeFilter     || null,
        p_category:       category       || null,
        p_active_only:    true,
        p_statewide_only: statewideOnly,
        p_limit:          200,
      });
      if (error) throw error;
      setResults(data || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  const handleSearch = () => fetchProfessionals();

  const handleRequestServices = (professional) => {
    if (!currentUser) { navigate("/login"); return; }
    setRequestTarget(professional);
  };

  return (
    <div className="min-h-screen" style={{ background: "#f8f9ff" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #004ac6 0%, #003399 100%)", padding: "48px 24px 40px" }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-white opacity-80" />
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: FF }}>
              Licensed Contractors &amp; Private Providers
            </span>
          </div>
          <h1 style={{ color: "white", fontSize: 32, fontWeight: 800, fontFamily: HEADING, marginBottom: 10 }}>
            Find a Professional
          </h1>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 16, maxWidth: 580, lineHeight: 1.6, fontFamily: FF }}>
            Search Florida-licensed contractors and FL 553.791-certified private providers in one place.
          </p>

          <div style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 12, padding: "12px 16px", marginTop: 20, maxWidth: 640 }}>
            <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, lineHeight: 1.6, fontFamily: FF, margin: 0 }}>
              <strong style={{ color: "white" }}>
                <Shield className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                Private providers (FL 553.791)
              </strong>{" "}
              are licensed professionals who perform plan reviews and inspections statewide as an alternative to the city building department.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: "white", borderBottom: "1px solid #e8eaf0", padding: "16px 24px" }}>
        <div className="max-w-5xl mx-auto space-y-3">
          {/* Type toggle */}
          <div className="flex gap-2 flex-wrap">
            {TYPE_TABS.map(tab => (
              <button key={String(tab.value)} onClick={() => setTypeFilter(tab.value)}
                style={{
                  padding: "7px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  fontFamily: FF, border: "1px solid",
                  background: typeFilter === tab.value ? PRIMARY : "white",
                  color:      typeFilter === tab.value ? "white"  : "#374151",
                  borderColor: typeFilter === tab.value ? PRIMARY : "#e0e4f0",
                  transition: "all 0.15s",
                }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Statewide filter */}
          <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}>
            <div onClick={() => setStatewideOnly(v => !v)}
              style={{
                width: 36, height: 20, borderRadius: 10, background: statewideOnly ? "#059669" : "#d1d5db",
                position: "relative", transition: "background 0.2s", flexShrink: 0, cursor: "pointer",
              }}>
              <div style={{
                position: "absolute", top: 2, left: statewideOnly ? 18 : 2,
                width: 16, height: 16, borderRadius: "50%", background: "white",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left 0.2s",
              }} />
            </div>
            <span style={{ fontSize: 13, color: "#374151", fontFamily: FF, fontWeight: 500 }}>
              Only show pros that can work anywhere in Florida
            </span>
          </label>

          {/* Search row */}
          <div className="flex flex-wrap gap-3 items-end">
            {/* Search box */}
            <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
              <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: FF }}>Name / Business</label>
              <div style={{ display: "flex", alignItems: "center", border: "1px solid #e0e4f0", borderRadius: 8, padding: "0 12px", background: "white" }}>
                <Search className="w-4 h-4" style={{ color: "#9ca3af", flexShrink: 0 }} />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSearch()}
                  placeholder="Search by name or business..."
                  style={{ flex: 1, border: "none", outline: "none", padding: "9px 8px", fontSize: 13, color: "#191B23", fontFamily: FF, background: "transparent" }}
                />
              </div>
            </div>

            {/* Category */}
            <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
              <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: FF }}>Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                style={{ border: "1px solid #e0e4f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#191B23", background: "white", fontFamily: FF }}>
                <option value="">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* City — informational only */}
            <div className="flex flex-col gap-1 min-w-[140px]">
              <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: FF }}>
                City <span style={{ fontSize: 9, fontWeight: 400, color: "#9ca3af" }}>(informational)</span>
              </label>
              <select style={{ border: "1px solid #e0e4f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#9ca3af", background: "white", fontFamily: FF }}>
                <option value="">All Cities</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <button onClick={handleSearch}
              style={{ background: PRIMARY, color: "white", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: FF, flexShrink: 0 }}>
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {!loading && searched && results.length > 0 && (
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16, fontFamily: FF }}>
            Showing <strong>{results.length}</strong> professional{results.length !== 1 ? "s" : ""} statewide
          </p>
        )}

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
            <Loader2 className="w-7 h-7 animate-spin" style={{ color: PRIMARY }} />
          </div>
        ) : results.length === 0 && searched ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <Building2 className="w-12 h-12 mx-auto mb-4" style={{ color: "#d1d5db" }} />
            <p style={{ fontSize: 16, fontWeight: 600, color: "#374151", fontFamily: HEADING }}>No professionals found</p>
            <p style={{ fontSize: 14, color: "#9ca3af", marginTop: 6, fontFamily: FF }}>
              Try adjusting your search or category filter.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {results.map((prof, i) => (
              <ProfessionalCard key={prof.id ?? i} professional={prof} onRequest={handleRequestServices} />
            ))}
          </div>
        )}

        {/* Footer note */}
        {searched && results.length > 0 && (
          <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 24, marginBottom: 0, fontFamily: FF, lineHeight: 1.6 }}>
            ℹ️ Open Permit verifies license currency from state records. Tapping <strong>Find contact</strong> or <strong>View on Maps</strong> opens a Google search so you can locate current contact details directly.
          </p>
        )}

        {/* CTA */}
        <div style={{ background: "white", border: "1px solid #e8eaf0", borderRadius: 16, padding: "32px", marginTop: 48, textAlign: "center", boxShadow: "0 1px 4px rgba(15,23,42,0.06)" }}>
          <Shield className="w-10 h-10 mx-auto mb-3" style={{ color: TEAL }} />
          <h3 style={{ fontSize: 20, fontWeight: 800, color: "#191B23", fontFamily: HEADING, marginBottom: 8 }}>
            Are you a licensed private provider?
          </h3>
          <p style={{ fontSize: 14, color: "#6b7280", fontFamily: FF, maxWidth: 460, margin: "0 auto 20px" }}>
            Register your firm on Open Permit to connect with homeowners and contractors in South Florida.
          </p>
          <Link to="/provider-register"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, background: TEAL, color: "white", padding: "10px 22px", borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: "none", fontFamily: FF }}>
            Register Your Firm <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {requestTarget && (
        <RequestServicesModal
          provider={requestTarget}
          currentUser={currentUser}
          onClose={() => setRequestTarget(null)}
        />
      )}
    </div>
  );
}

function ProfessionalCard({ professional, onRequest }) {
  const isPrivateProvider = professional.professional_type === "private_provider";
  const statusStyle = STATUS_STYLES[professional.status] || STATUS_STYLES.active;
  const location = [professional.city, professional.state].filter(Boolean).join(", ");

  // Service-area badge
  const statewide = professional.operates_statewide;
  const serviceAreaNote = professional.service_area_note || (
    statewide
      ? "Operates statewide — can work in any Florida city, including your area"
      : "County/local registration — confirm authorization with your city building department"
  );

  // Deep-link helpers
  const q = encodeURIComponent;
  const mapsUrl        = `https://www.google.com/maps/search/?api=1&query=${q([professional.name, professional.city].filter(Boolean).join(" "))}`;
  const webSearchUrl   = `https://www.bing.com/search?q=${q([professional.name, professional.city, professional.category, "contact phone"].filter(Boolean).join(" "))}`;
  const bizName        = professional.secondary || (isPrivateProvider ? professional.name : null);
  const sunbizUrl      = bizName ? `https://www.bing.com/search?q=${q(bizName + " sunbiz Florida")}` : null;

  return (
    <div style={{ background: "white", border: "1px solid #e8eaf0", borderRadius: 16, padding: "20px 24px", boxShadow: "0 1px 4px rgba(15,23,42,0.06)", display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Top row: type label + status badge */}
      <div className="flex items-center justify-between gap-2">
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          background: isPrivateProvider ? "#f0fdf4" : "#eff6ff",
          color:      isPrivateProvider ? "#166534"  : "#1e40af",
          border:     `1px solid ${isPrivateProvider ? "#bbf7d0" : "#bfdbfe"}`,
          borderRadius: 20, padding: "2px 10px", fontSize: 10, fontWeight: 700, fontFamily: FF,
        }}>
          {isPrivateProvider
            ? <><Shield className="w-2.5 h-2.5" /> Private Provider</>
            : <><HardHat className="w-2.5 h-2.5" /> Contractor</>}
        </span>
        <span style={{
          background: statusStyle.bg, color: statusStyle.color,
          border: `1px solid ${statusStyle.border}`,
          borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 700, fontFamily: FF,
        }}>
          {statusStyle.label}
        </span>
      </div>

      {/* Name */}
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: "#191B23", fontFamily: HEADING, lineHeight: 1.3, margin: 0 }}>
          {professional.name}
        </h3>
        {professional.secondary && (
          <p style={{ fontSize: 12, color: "#6b7280", margin: "3px 0 0", fontFamily: FF }}>{professional.secondary}</p>
        )}
        {professional.license_number && (
          <p style={{ fontFamily: "monospace", fontSize: 10, color: "#9ca3af", margin: "3px 0 0" }}>
            Lic: {professional.license_number}
          </p>
        )}
        {!isPrivateProvider && professional.expiration_date && (
          <p style={{ fontSize: 11, color: "#6b7280", margin: "3px 0 0", fontFamily: FF }}>
            <span style={{ fontWeight: 600 }}>License expires:</span> {professional.expiration_date}
          </p>
        )}
      </div>

      {/* Category + location */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {professional.category && (
          <span style={{ fontSize: 12, color: "#374151", fontFamily: FF, display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: PRIMARY, display: "inline-block" }} />
            {professional.category}
          </span>
        )}
        {location && (
          <span style={{ fontSize: 12, color: "#6b7280", fontFamily: FF, display: "flex", alignItems: "center", gap: 3 }}>
            <MapPin className="w-3 h-3" /> {location}
          </span>
        )}
      </div>

      {/* Service-area badge */}
      <div title={serviceAreaNote} style={{
        display: "inline-flex", alignItems: "center", gap: 5, alignSelf: "flex-start",
        background: statewide ? "#f0fdf4" : "#fffbeb",
        color:      statewide ? "#166534" : "#92400e",
        border:     `1px solid ${statewide ? "#bbf7d0" : "#fcd34d"}`,
        borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 700, fontFamily: FF, cursor: "default",
      }}>
        {statewide ? "✓ Works in your area" : "⚠ Local — verify with city"}
        <span style={{ fontSize: 10, fontWeight: 400, color: statewide ? "#166534" : "#92400e", opacity: 0.8 }}>
          ({statewide ? "statewide" : "local"})
        </span>
      </div>
      <p style={{ fontSize: 10, color: "#9ca3af", margin: "-6px 0 0", fontFamily: FF, lineHeight: 1.5 }}>
        {serviceAreaNote}
      </p>

      {/* Contact */}
      <div className="flex flex-col gap-1">
        {professional.phone && (
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5" style={{ color: "#9ca3af", flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "#374151", fontFamily: FF }}>{professional.phone}</span>
          </div>
        )}
        {professional.website && (
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5" style={{ color: "#9ca3af", flexShrink: 0 }} />
            <a href={professional.website.startsWith("http") ? professional.website : `https://${professional.website}`}
              target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 12, color: PRIMARY, fontFamily: FF, textDecoration: "none" }}>
              {professional.website.replace(/^https?:\/\//, "")}
            </a>
          </div>
        )}
      </div>

      {isPrivateProvider && (
        <div style={{ fontSize: 10, color: "#059669", fontFamily: FF, fontWeight: 600 }}>
          ✓ FL Statute 553.791 Certified
        </div>
      )}

      {/* Deep-link buttons */}
      <div className="flex flex-wrap gap-2" style={{ marginTop: 4 }}>
        <button onClick={() => window.open(mapsUrl, '_blank', 'noopener,noreferrer')}
          style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 600, fontFamily: FF, cursor: "pointer" }}>
          <MapPin className="w-3 h-3" /> Find on Google Maps
        </button>
        <button onClick={() => window.open(webSearchUrl, '_blank', 'noopener,noreferrer')}
          style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 600, fontFamily: FF, cursor: "pointer" }}>
          <Search className="w-3 h-3" /> Web search
        </button>
        {sunbizUrl && (
          <button onClick={() => window.open(sunbizUrl, '_blank', 'noopener,noreferrer')}
            style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 600, fontFamily: FF, cursor: "pointer" }}>
            <ExternalLink className="w-3 h-3" /> Business record
          </button>
        )}
      </div>

      <button onClick={() => onRequest(professional)}
        style={{ marginTop: "auto", background: PRIMARY, color: "white", border: "none", borderRadius: 10, padding: "9px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: FF }}>
        Contact Professional
      </button>
    </div>
  );
}