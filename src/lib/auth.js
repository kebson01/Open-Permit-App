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
    // getSession handles OAuth redirect hash fragments correctly
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);

      if (event === "SIGNED_IN" && session) {
        supabase.rpc("claim_guest_guides", {
          p_email: session.user.email,
          p_user_id: session.user.id,
        }).catch(() => {});

        const path = window.location.pathname;
        if (path === "/login" || path === "/auth/login" || path === "/signup" || path === "/auth/signup") {
          window.location.replace("/");
        }
      }

      if (event === "SIGNED_OUT") {
        window.location.replace("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";
  const firstName = displayName.split(" ")[0];
  const initial = displayName[0]?.toUpperCase() || "U";

  return { user, signOut, loading: user === undefined, displayName, firstName, initial };
}