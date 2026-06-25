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

/**
 * Returns the current user merged with app fields stored in user_metadata
 * (role, city_name, full_name), or null if signed out.
 * Replaces base44.auth.me().
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
    city_name: meta.city_name || null,
  };
}

/** Updates app fields on the current user's metadata. Replaces base44.auth.updateMe(). */
export async function updateCurrentUser(data) {
  const { data: { user }, error } = await supabase.auth.updateUser({ data });
  if (error) throw error;
  return user;
}

/** Sends the user to the sign-in page. Replaces base44.auth.redirectToLogin(). */
export function redirectToLogin() {
  window.location.href = "/login";
}

/** Resolves true if a session exists. Replaces base44.auth.isAuthenticated(). */
export async function isAuthenticated() {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
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