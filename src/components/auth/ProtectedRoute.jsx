import { useAuth } from "@/lib/auth";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      // Redirect to platform login, come back after
      base44.auth.redirectToLogin(window.location.href);
    }
  }, [user, loading]);

  if (loading || (!user && !loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#FAF8FF" }}>
        <Loader2 className="w-6 h-6 animate-spin text-[#004ac6]" />
      </div>
    );
  }

  return children;
}