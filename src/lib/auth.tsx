import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ALL_ROLES, ROLES, type Role } from "@/lib/roles";

type UserProfile = {
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

type AuthContextType = {
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
};

const SESSION_KEY = "diskdiff.dev.session";
const DEV_PASSWORD = "password123";

// TEMPORARY DEVELOPMENT AUTH ONLY: replace with Supabase Auth integration.
const DEMO_USERS: UserProfile[] = [
  { id: "1", user_id: "1", full_name: "Admin User", email: "admin@diskdiff.local", role: ROLES.ADMIN, department: "Microbiology", active_status: true, created_at: new Date(0).toISOString(), updated_at: new Date(0).toISOString() },
  { id: "2", user_id: "2", full_name: "Consultant User", email: "consultant@diskdiff.local", role: ROLES.CONSULTANT_MICROBIOLOGIST, department: "Microbiology", active_status: true, created_at: new Date(0).toISOString(), updated_at: new Date(0).toISOString() },
  { id: "3", user_id: "3", full_name: "MLS User", email: "mls@diskdiff.local", role: ROLES.MEDICAL_LABORATORY_SCIENTIST, department: "Microbiology", active_status: true, created_at: new Date(0).toISOString(), updated_at: new Date(0).toISOString() },
  { id: "4", user_id: "4", full_name: "Quality User", email: "quality@diskdiff.local", role: ROLES.QUALITY_OFFICER, department: "Quality", active_status: true, created_at: new Date(0).toISOString(), updated_at: new Date(0).toISOString() },
  { id: "5", user_id: "5", full_name: "Viewer User", email: "viewer@diskdiff.local", role: ROLES.VIEWER, department: "Laboratory", active_status: true, created_at: new Date(0).toISOString(), updated_at: new Date(0).toISOString() },
];

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return setLoading(false);
    const parsed = JSON.parse(raw) as UserProfile;
    if (ALL_ROLES.includes(parsed.role)) setUser(parsed);
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    const normalized = email.trim().toLowerCase();
    const found = DEMO_USERS.find((u) => u.email === normalized);
    if (!found || password !== DEV_PASSWORD) throw new Error("Invalid email or password");
    const next = { ...found, updated_at: new Date().toISOString() };
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    setUser(next);
  };

  const signOut = () => {
    window.localStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  const value = useMemo(() => ({ user, loading, signIn, signOut }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
