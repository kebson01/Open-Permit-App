import { X } from "lucide-react";
import { base44 } from "@/api/base44Client";

// This modal redirects to Base44's built-in login page.
// It does NOT use Supabase auth.
export default function AuthModal({ onClose }) {
  const handleLogin = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <img
            src="https://media.base44.com/images/public/69ac5571087590fc03d44b73/15cefa1cd_image_d3d70f9d.png"
            alt="OpenPermit"
            className="h-8 w-auto"
          />
          {onClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <h2 className="text-lg font-bold text-gray-900 mb-1">Sign in to your account</h2>
        <p className="text-sm text-gray-500 mb-6">Access your permit projects and saved checklists.</p>

        <button
          onClick={handleLogin}
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "#3B82F6" }}
        >
          Sign In / Create Account →
        </button>

        <p className="text-center text-xs text-gray-400 mt-4">
          You'll be redirected to our secure login page.
        </p>
      </div>
    </div>
  );
}