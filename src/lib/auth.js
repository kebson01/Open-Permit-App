/**
 * Supabase Auth helpers.
 *
 * The public app has no accounts — auth exists only so the unlinked /admin
 * pages that maintain permit data can be gated. Keep this small.
 */
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

/**
 * Returns the current user merged with app fields stored in user_metadata
 * (role, full_name), or null if signed out.
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const meta = user.user_metadata || {};
  return {
    ...meta,
    id: user.id,
    email: user.email,
    full_name: meta.full_name || user.email?.split("@")[0] || "",
    role: meta.role || "user",
  };
}

export function useAuthProvider() {
  const [user, setUser] = useState(undefined); // undefined = still loading

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);

      if (event === "SIGNED_IN" && session && window.location.pathname === "/login") {
        window.location.replace("/admin");
      }
      if (event === "SIGNED_OUT") {
        window.location.replace("/");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, signOut, loading: user === undefined };
}
