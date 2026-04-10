import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type UserRole = "admin" | "capability_lead_am";

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  capability_lead_am: "Capability Lead / Account Manager",
};

export function getRoleLabel(role: UserRole): string {
  return ROLE_LABELS[role] ?? role;
}

interface AuthContextType {
  currentUser: AppUser | null;
  currentRole: UserRole;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  signup: (email: string, password: string, name: string) => Promise<string | null>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewAsRole, setViewAsRole] = useState<UserRole | null>(null);

  const isAuthenticated = !!appUser;
  const currentRole = viewAsRole ?? appUser?.role ?? "admin";

  const fetchProfile = async (user: User) => {
    // Get profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // Get role
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const role = (roles?.[0]?.role as UserRole) ?? "admin";

    const appU: AppUser = {
      id: user.id,
      email: profile?.email || user.email || "",
      name: profile?.name || user.user_metadata?.name || "",
      role,
    };
    setAppUser(appU);
    return appU;
  };

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setAuthUser(session.user);
        // Use setTimeout to avoid Supabase deadlock
        setTimeout(async () => {
          await fetchProfile(session.user);
          setLoading(false);
        }, 0);
      } else {
        setAuthUser(null);
        setAppUser(null);
        setLoading(false);
      }
    });

    // Then check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setAuthUser(session.user);
        fetchProfile(session.user).then(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;
    return null;
  };

  const signup = async (email: string, password: string, name: string): Promise<string | null> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) return error.message;
    return null;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setViewAsRole(null);
  };

  const switchRole = (role: UserRole) => {
    if (appUser?.role === "admin") {
      setViewAsRole(role);
    }
  };

  const refreshProfile = async () => {
    if (authUser) await fetchProfile(authUser);
  };

  return (
    <AuthContext.Provider value={{
      currentUser: appUser,
      currentRole,
      isAuthenticated,
      loading,
      login,
      logout,
      signup,
      switchRole,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
