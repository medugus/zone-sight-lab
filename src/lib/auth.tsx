import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ROLES, type Role } from "@/lib/roles";

// TEMPORARY DEVELOPMENT AUTH ONLY. REPLACE WITH SUPABASE AUTH BEFORE PRODUCTION.
export type UserProfile = {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: Role;
  department: string;
  active_status: boolean;
  created_at: string;
  updated_at: string;
};

type AuthContextValue = {
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AUTH_KEY = "diskdiff.auth.user";
const now = new Date().toISOString();
const DEV_USERS: Array<UserProfile & { password: string }> = [
  { id: "1", user_id: "11111111-1111-1111-1111-111111111111", full_name: "Admin User", email: "admin@diskdiff.local", role: ROLES.ADMIN, department: "Microbiology", active_status: true, created_at: now, updated_at: now, password: "password123" },
  { id: "2", user_id: "22222222-2222-2222-2222-222222222222", full_name: "Consultant Microbiologist", email: "consultant@diskdiff.local", role: ROLES.CONSULTANT_MICROBIOLOGIST, department: "Microbiology", active_status: true, created_at: now, updated_at: now, password: "password123" },
  { id: "3", user_id: "33333333-3333-3333-3333-333333333333", full_name: "MLS User", email: "mls@diskdiff.local", role: ROLES.MEDICAL_LABORATORY_SCIENTIST, department: "Microbiology", active_status: true, created_at: now, updated_at: now, password: "password123" },
  { id: "4", user_id: "44444444-4444-4444-4444-444444444444", full_name: "Quality Officer", email: "quality@diskdiff.local", role: ROLES.QUALITY_OFFICER, department: "Quality", active_status: true, created_at: now, updated_at: now, password: "password123" },
  { id: "5", user_id: "55555555-5555-5555-5555-555555555555", full_name: "Viewer User", email: "viewer@diskdiff.local", role: ROLES.VIEWER, department: "Microbiology", active_status: true, created_at: now, updated_at: now, password: "password123" },
];

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(AUTH_KEY) : null;
    if (stored) setUser(JSON.parse(stored) as UserProfile);
    setLoading(false);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    signIn: async (email, password) => {
      const found = DEV_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
      if (!found) return { error: "Invalid email or password" };
      const { password: _pw, ...profile } = found;
      setUser(profile);
      if (typeof window !== "undefined") window.localStorage.setItem(AUTH_KEY, JSON.stringify(profile));
      return { error: null };
    },
    signOut: async () => {
      setUser(null);
      if (typeof window !== "undefined") window.localStorage.removeItem(AUTH_KEY);
    },
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
