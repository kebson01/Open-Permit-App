import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, CheckCircle2, Home, Wrench, Shield } from "lucide-react";

const PRIMARY = "#1A56DB";

const ROLES = [
  { key: "homeowner", icon: Home, label: "Homeowner", sub: "Managing my own property" },
  { key: "contractor", icon: Wrench, label: "Contractor", sub: "Licensed contractor" },
  { key: "private_provider", icon: Shield, label: "Private Provider", sub: "FL Statute 553.791" },
];

export default function AuthSignUp() {
  const navigate = useNavigate();
  const [role, setRole] = useState("homeowner");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    const meta = {
      full_name: fullName,
      role,
      ...(role === "contractor" ? { company_name: companyName, license_number: licenseNumber } : {}),
    };
    const { error: err } = await supabase.auth.signUp({ email, password, options: { data: meta } });
    setLoading(false);
    if (err) { setError(err.message); } else { setDone(true); }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#F5F6FA" }}>
        <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mx-auto border-4 border-teal-200">
            <CheckCircle2 className="w-8 h-8 text-teal-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Check your email</h2>
          <p className="text-sm text-gray-500">
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
          </p>
          <Link to="/login" className="block w-full py-3 rounded-xl text-white font-bold text-sm text-center"
            style={{ background: PRIMARY, textDecoration: "none" }}>
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: "#F5F6FA" }}>
      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="text-center mb-6">
          <img
            src="https://media.base44.com/images/public/69ac5571087590fc03d44b73/b44f9c52a_icon-master.png"
            alt="Open Permit"
            className="h-20 w-20 object-contain mx-auto mb-3"
          />
          <Link to="/" className="font-extrabold text-xl tracking-tight" style={{ fontFamily: "'Manrope', system-ui, sans-serif", color: PRIMARY, textDecoration: "none" }}>
            OpenPermit
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-sm text-gray-400 mt-1">Start managing permits today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">I am a</label>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map(r => {
                const Icon = r.icon;
                const active = role === r.key;
                return (
                  <button key={r.key} type="button" onClick={() => setRole(r.key)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all ${active ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                    <Icon className={`w-5 h-5 ${active ? "text-blue-600" : "text-gray-400"}`} />
                    <span className={`text-xs font-semibold leading-tight ${active ? "text-blue-700" : "text-gray-600"}`}>{r.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
              placeholder="Jane Smith"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
          </div>

          {role === "contractor" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
                  placeholder="Your business name"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                <input type="text" value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)}
                  placeholder="State license number"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
              </div>
            </>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: PRIMARY }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0" }}>
          <div style={{ flex: 1, height: 1, background: "#e0e0e0" }} />
          <span style={{ fontSize: 13, color: "#6b7280" }}>or</span>
          <div style={{ flex: 1, height: 1, background: "#e0e0e0" }} />
        </div>

        {/* Google Button */}
        <button
          onClick={async () => {
            const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin + "/", queryParams: { access_type: "offline", prompt: "consent" } } });
            if (error) setError(error.message);
          }}
          style={{ background: "white", border: "1px solid #dadce0", borderRadius: 8, padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%", cursor: "pointer", fontSize: 14, fontWeight: 500, color: "#3c4043" }}
          onMouseEnter={e => { e.currentTarget.style.background = "#f8f9fa"; e.currentTarget.style.borderColor = "#c6c6c6"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "white"; e.currentTarget.style.borderColor = "#dadce0"; }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/><path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/></svg>
          Continue with Google
        </button>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold" style={{ color: PRIMARY, textDecoration: "none" }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}