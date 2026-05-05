import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Role } from "@/lib/roles";

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

type Session = { access_token: string; user: UserProfile };

type AuthContextType = {
  session: Session | null;
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
};

const USERS: Array<UserProfile & { password: string }> = [
  { id: "1", user_id: "1", full_name: "Admin User", email: "admin@diskdiff.local", role: "Admin", department: "IT", active_status: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), password: "password123" },
  { id: "2", user_id: "2", full_name: "Consultant", email: "consultant@diskdiff.local", role: "Consultant Microbiologist", department: "Microbiology", active_status: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), password: "password123" },
  { id: "3", user_id: "3", full_name: "MLS User", email: "mls@diskdiff.local", role: "Medical Laboratory Scientist", department: "Microbiology", active_status: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), password: "password123" },
  { id: "4", user_id: "4", full_name: "Quality Officer", email: "quality@diskdiff.local", role: "Quality Officer", department: "Quality", active_status: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), password: "password123" },
  { id: "5", user_id: "5", full_name: "Viewer", email: "viewer@diskdiff.local", role: "Viewer", department: "External", active_status: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), password: "password123" },
];

const SESSION_KEY = "diskdiff.session";
const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) setSession(JSON.parse(raw));
    setLoading(false);
  }, []);

  const value = useMemo<AuthContextType>(() => ({
    session,
    user: session?.user ?? null,
    loading,
    signIn: async (email, password) => {
      const found = USERS.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
      if (!found || !found.active_status) return { error: "Invalid credentials or inactive account." };
      const next: Session = { access_token: crypto.randomUUID(), user: found };
      setSession(next);
      if (typeof window !== "undefined") localStorage.setItem(SESSION_KEY, JSON.stringify(next));
      return {};
    },
    signOut: async () => {
      setSession(null);
      if (typeof window !== "undefined") localStorage.removeItem(SESSION_KEY);
    },
  }), [session, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
