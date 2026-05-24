import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";

const PRIMARY = "#1A56DB";

export default function AuthSignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#F5F6FA" }}>
      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="text-center mb-6">
          <Link to="/" className="font-extrabold text-xl tracking-tight" style={{ fontFamily: "'Manrope', system-ui, sans-serif", color: PRIMARY, textDecoration: "none" }}>
            OpenPermit
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-sm text-gray-400 mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <Link to="/forgot-password" className="text-xs font-medium" style={{ color: PRIMARY, textDecoration: "none" }}>
                Forgot password?
              </Link>
            </div>
            <input
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: PRIMARY }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
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
            const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin + "/" } });
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
          Don't have an account?{" "}
          <Link to="/signup" className="font-semibold" style={{ color: PRIMARY, textDecoration: "none" }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}