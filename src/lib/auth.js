/**
 * Supabase Auth helpers — global auth state
 * Import { useAuth } in components that need current user
 */
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function useAuthProvider() {
  const [user, setUser] = useState(undefined); // undefined = still loading

  useEffect(() => {
    // Initial load
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user ?? null);
    });

    // Subscribe to changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  // Helper: display name from supabase user
  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";
  const firstName = displayName.split(" ")[0];
  const initial = displayName[0]?.toUpperCase() || "U";

  return { user, signOut, loading: user === undefined, displayName, firstName, initial };
}