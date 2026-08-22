import { useAuth } from "@/lib/auth";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f8f9ff" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: "3px solid #e0e0e0", borderTopColor: "#003466", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <div style={{ color: "#6b7280", fontSize: 14 }}>Loading OpenPermit...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    window.location.replace("/login");
    return null;
  }

  return children;
}