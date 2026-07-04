import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export type AppRole = "admin" | "officer" | "viewer";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setTimeout(() => loadRole(s.user.id), 0);
      } else {
        setRole(null);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) loadRole(data.session.user.id);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function loadRole(uid: string) {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid).order("role");
    const roles = (data ?? []).map((r) => r.role as AppRole);
    if (roles.includes("admin")) setRole("admin");
    else if (roles.includes("officer")) setRole("officer");
    else if (roles.includes("viewer")) setRole("viewer");
    else setRole(null);
  }

  return { session, user, role, loading, isStaff: role === "admin" || role === "officer", isAdmin: role === "admin" };
}
