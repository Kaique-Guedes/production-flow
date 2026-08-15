import type { Session, User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import type { AppRole, Etapa } from "@/lib/pcp/constants";

interface AuthState {
  loading: boolean;
  session: Session | null;
  user: User | null;
  fullName: string;
  roles: AppRole[];
  isPlanner: boolean;
  isAdmin: boolean;
  canWork: (etapa: Etapa) => boolean;
  refreshRoles: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(true);

  const loadContext = useCallback(async (current: Session | null) => {
    if (!current?.user) {
      setRoles([]);
      setFullName("");
      return;
    }
    const userId = current.user.id;
    const metaName =
      (current.user.user_metadata?.["full_name"] as string | undefined) ??
      current.user.email ??
      "Usuário";

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle();

    if (!profile) {
      await supabase.from("profiles").insert({ id: userId, full_name: metaName });
      setFullName(metaName);
    } else {
      setFullName(profile.full_name || metaName);
    }

    const { data: roleRows } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    setRoles(((roleRows ?? []) as { role: AppRole }[]).map((r) => r.role));
  }, []);

  useEffect(() => {
    let active = true;

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (!active) return;
      setSession(next);
      if (event === "SIGNED_OUT") {
        setRoles([]);
        setFullName("");
      }
    });

    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setSession(data.session);
      await loadContext(data.session);
      setLoading(false);
    })();

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadContext]);

  const userId = session?.user?.id;
  useEffect(() => {
    if (!userId) return;
    void loadContext(session);
  }, [userId, session, loadContext]);

  const refreshRoles = useCallback(async () => {
    await loadContext(session);
  }, [loadContext, session]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setRoles([]);
  }, []);

  const value = useMemo<AuthState>(() => {
    const isAdmin = roles.includes("administrador");
    return {
      loading,
      session,
      user: session?.user ?? null,
      fullName,
      roles,
      isAdmin,
      isPlanner: isAdmin || roles.includes("planejamento"),
      canWork: (etapa: Etapa) =>
        isAdmin || (etapa !== "concluido" && roles.includes(etapa as AppRole)),
      refreshRoles,
      signOut,
    };
  }, [loading, session, fullName, roles, refreshRoles, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
