import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Shield, Phone, Globe, MapPin, CheckCircle, Loader2, Search, Building2, ChevronRight } from "lucide-react";
import RequestServicesModal from "@/components/providers/RequestServicesModal";

const CITIES = ["Weston", "Hollywood", "Coral Springs", "Cooper City", "Fort Lauderdale"];
const SERVICES = [
  "Plan Review",
  "Structural Inspection",
  "Electrical Inspection",
  "Mechanical Inspection",
  "Threshold Building Inspection",
];

const PRIMARY = "#004ac6";
const TEAL = "#006a61";

export default function ProviderDirectory() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [requestTarget, setRequestTarget] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
    });
    // Load all on mount
    fetchProviders();
  }, []);

  const fetchProviders = async (city, service) => {
    setLoading(true);
    try {
      let query = supabase.from("private_provider_firms").select("*").eq("status", "active");
      if (city) query = query.contains("cities", [city]);
      if (service) query = query.contains("services_offered", [service]);
      if (searchQuery) query = query.ilike("firm_name", `%${searchQuery}%`);
      const { data, error } = await query.order("firm_name");
      if (error) throw error;
      setProviders(data || []);
    } catch {
      setProviders([]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  const handleSearch = () => fetchProviders(selectedCity, selectedService);

  const handleRequestServices = (provider) => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    setRequestTarget(provider);
  };

  return (
    <div className="min-h-screen" style={{ background: "#f8f9ff" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #004ac6 0%, #003399 100%)", padding: "48px 24px 40px" }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-white opacity-80" />
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Florida Statute 553.791
            </span>
          </div>
          <h1 style={{ color: "white", fontSize: 32, fontWeight: 800, fontFamily: "'Manrope', sans-serif", marginBottom: 10 }}>
            Licensed Private Providers
          </h1>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 16, maxWidth: 580, lineHeight: 1.6, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Speed up your permit with a Florida Statute 553.791 certified private provider. Plan reviews in <strong style={{ color: "white" }}>10–16 business days</strong>.
          </p>

          {/* Info banner */}
          <div style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 12, padding: "12px 16px", marginTop: 20, maxWidth: 640 }}>
            <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, lineHeight: 1.6, fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0 }}>
              <strong style={{ color: "white" }}>ℹ️ What is a private provider?</strong> Licensed professionals who perform plan reviews and inspections as an alternative to the city building department. Using a private provider does not bypass city permit requirements.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: "white", borderBottom: "1px solid #e8eaf0", padding: "16px 24px" }}>
        <div className="max-w-5xl mx-auto flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
            <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>City</label>
            <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)}
              style={{ border: "1px solid #e0e4f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#191B23", background: "white", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <option value="">All Cities</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
            <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Service</label>
            <select value={selectedService} onChange={e => setSelectedService(e.target.value)}
              style={{ border: "1px solid #e0e4f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#191B23", background: "white", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <option value="">All Services</option>
              {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
            <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Firm Name</label>
            <div style={{ display: "flex", alignItems: "center", border: "1px solid #e0e4f0", borderRadius: 8, padding: "0 12px", background: "white" }}>
              <Search className="w-4 h-4" style={{ color: "#9ca3af", flexShrink: 0 }} />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder="Search by firm name..."
                style={{ flex: 1, border: "none", outline: "none", padding: "9px 8px", fontSize: 13, color: "#191B23", fontFamily: "'Plus Jakarta Sans', sans-serif", background: "transparent" }} />
            </div>
          </div>
          <button onClick={handleSearch}
            style={{ background: PRIMARY, color: "white", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", flexShrink: 0 }}>
            Find Providers
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
            <Loader2 className="w-7 h-7 animate-spin" style={{ color: PRIMARY }} />
          </div>
        ) : providers.length === 0 && searched ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <Building2 className="w-12 h-12 mx-auto mb-4" style={{ color: "#d1d5db" }} />
            <p style={{ fontSize: 16, fontWeight: 600, color: "#374151", fontFamily: "'Manrope', sans-serif" }}>No providers found</p>
            <p style={{ fontSize: 14, color: "#9ca3af", marginTop: 6, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              No providers found for your search. Check back soon — providers are being added regularly.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {providers.map(provider => (
              <ProviderCard key={provider.id} provider={provider} onRequest={handleRequestServices} isLoggedIn={!!currentUser} />
            ))}
          </div>
        )}

        {/* CTA for providers */}
        <div style={{ background: "white", border: "1px solid #e8eaf0", borderRadius: 16, padding: "32px", marginTop: 48, textAlign: "center", boxShadow: "0 1px 4px rgba(15,23,42,0.06)" }}>
          <Shield className="w-10 h-10 mx-auto mb-3" style={{ color: TEAL }} />
          <h3 style={{ fontSize: 20, fontWeight: 800, color: "#191B23", fontFamily: "'Manrope', sans-serif", marginBottom: 8 }}>
            Are you a licensed private provider?
          </h3>
          <p style={{ fontSize: 14, color: "#6b7280", fontFamily: "'Plus Jakarta Sans', sans-serif", maxWidth: 460, margin: "0 auto 20px" }}>
            Register your firm on Open Permit to connect with homeowners and contractors in South Florida.
          </p>
          <Link to="/provider-register"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, background: TEAL, color: "white", padding: "10px 22px", borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: "none", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
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

function ProviderCard({ provider, onRequest, isLoggedIn }) {
  const cities = Array.isArray(provider.cities) ? provider.cities : [];
  const services = Array.isArray(provider.services_offered) ? provider.services_offered : [];

  return (
    <div style={{ background: "white", border: "1px solid #e8eaf0", borderRadius: 16, padding: "24px", boxShadow: "0 1px 4px rgba(15,23,42,0.06)", display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 style={{ fontSize: 17, fontWeight: 800, color: "#191B23", fontFamily: "'Manrope', sans-serif", lineHeight: 1.3 }}>{provider.firm_name}</h3>
          <div className="flex gap-1.5 flex-shrink-0">
            {provider.fl_statute_certified && (
              <span style={{ background: "#ecfdf5", color: "#065f46", border: "1px solid #a7f3d0", borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", whiteSpace: "nowrap" }}>
                ✓ FL 553.791
              </span>
            )}
            {provider.verified && (
              <span style={{ background: "#f0fdfa", color: "#0d6efd", border: "1px solid #99f6e4", borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Verified
              </span>
            )}
          </div>
        </div>
        {provider.license_number && (
          <p style={{ fontFamily: "monospace", fontSize: 11, color: "#9ca3af", margin: 0 }}>License: {provider.license_number}</p>
        )}
      </div>

      {/* Contact */}
      <div className="flex flex-col gap-1.5">
        {provider.phone && (
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5" style={{ color: "#9ca3af", flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: "#374151", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{provider.phone}</span>
          </div>
        )}
        {provider.website && (
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5" style={{ color: "#9ca3af", flexShrink: 0 }} />
            <a href={provider.website.startsWith("http") ? provider.website : `https://${provider.website}`}
              target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 13, color: "#004ac6", fontFamily: "'Plus Jakarta Sans', sans-serif", textDecoration: "none" }}>
              {provider.website.replace(/^https?:\/\//, "")}
            </a>
          </div>
        )}
      </div>

      {/* Cities */}
      {cities.length > 0 && (
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Cities Served</p>
          <div className="flex flex-wrap gap-1.5">
            {cities.map(c => (
              <span key={c} style={{ background: "#f0f4ff", color: "#004ac6", border: "1px solid #dbeafe", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{c}</span>
            ))}
          </div>
        </div>
      )}

      {/* Services */}
      {services.length > 0 && (
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Services</p>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 3 }}>
            {services.map(s => (
              <li key={s} className="flex items-center gap-1.5">
                <CheckCircle className="w-3 h-3" style={{ color: "#006a61", flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#374151", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button onClick={() => onRequest(provider)}
        style={{ marginTop: "auto", background: "#004ac6", color: "white", border: "none", borderRadius: 10, padding: "10px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        Request Services
      </button>
    </div>
  );
}