import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, CheckCircle2 } from "lucide-react";

const PRIMARY = "#003466";
const FONTS = {
  h: "'Manrope', system-ui, sans-serif",
  b: "'Plus Jakarta Sans', system-ui, sans-serif",
};

export default function ForgotPassword() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError("Please enter your email."); return; }
    setLoading(true); setError("");
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#FAF8FF" }}>
      <div className="w-full max-w-[420px] bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-6">
        <div className="text-center">
          <img
            src="/icon-master.png"
            alt="Open Permit"
            className="h-20 w-20 object-contain mx-auto mb-2"
          />
          <Link to="/" className="block no-underline">
            <span className="font-extrabold text-xl" style={{ fontFamily: FONTS.h, color: PRIMARY }}>OpenPermit</span>
          </Link>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-teal-50 border-4 border-teal-200 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-teal-500" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900" style={{ fontFamily: FONTS.h }}>Check your email</h1>
            <p className="text-gray-500 text-sm" style={{ fontFamily: FONTS.b }}>
              We sent a password reset link to <strong>{email}</strong>.
            </p>
            <Link to="/login"
              className="inline-block px-6 py-2.5 rounded-xl text-white font-bold text-sm no-underline hover:opacity-90"
              style={{ background: PRIMARY, fontFamily: FONTS.b }}>
              Back to Login
            </Link>
          </div>
        ) : (
          <>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900" style={{ fontFamily: FONTS.h }}>Reset your password</h1>
              <p className="text-gray-500 text-sm mt-1" style={{ fontFamily: FONTS.b }}>Enter your email to receive a reset link.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5" style={{ fontFamily: FONTS.b }}>Email address</label>
                <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(""); }}
                  placeholder="you@email.com"
                  className="w-full border border-[#dde4eb] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#003466]"
                  style={{ fontFamily: FONTS.b }} autoComplete="email" />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2" style={{ fontFamily: FONTS.b }}>{error}</p>
              )}

              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 hover:opacity-90"
                style={{ background: PRIMARY, fontFamily: FONTS.b }}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Reset Link"}
              </button>
            </form>

            <p className="text-center text-sm" style={{ fontFamily: FONTS.b, color: "#6B7280" }}>
              <Link to="/login" className="font-semibold no-underline" style={{ color: PRIMARY }}>← Back to Login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}