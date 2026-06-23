/**
 * Base44 native auth helpers — global auth state
 * Import { useAuth } in components that need current user
 */
import { createContext, useContext, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

export const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function useAuthProvider() {
  const [user, setUser] = useState(undefined); // undefined = still loading

  useEffect(() => {
    base44.auth.me()
      .then((u) => setUser(u))
      .catch(() => setUser(null));
  }, []);

  const signOut = async () => {
    await base44.auth.logout();
  };

  const displayName = user?.full_name || user?.email?.split("@")[0] || "";
  const firstName = displayName.split(" ")[0];
  const initial = displayName[0]?.toUpperCase() || "U";

  return { user, signOut, loading: user === undefined, displayName, firstName, initial };
}