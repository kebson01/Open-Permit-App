import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#FAF8FF" }}>
        <Loader2 className="w-6 h-6 animate-spin text-[#004ac6]" />
      </div>
    );
  }

  if (!user) {
    window.location.href = "/login";
    return null;
  }

  return children;
}