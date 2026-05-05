import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Role =
  | "Admin"
  | "Consultant Microbiologist"
  | "Medical Laboratory Scientist"
  | "Quality Officer"
  | "Viewer";

export const ALL_ROLES: Role[] = [
  "Admin",
  "Consultant Microbiologist",
  "Medical Laboratory Scientist",
  "Quality Officer",
  "Viewer",
];

const KEY = "diskdiff.role";

type Ctx = { role: Role; setRole: (r: Role) => void };
const RoleContext = createContext<Ctx | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>("Medical Laboratory Scientist");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(KEY) as Role | null;
    if (stored && ALL_ROLES.includes(stored)) setRoleState(stored);
  }, []);

  const setRole = (r: Role) => {
    setRoleState(r);
    if (typeof window !== "undefined") window.localStorage.setItem(KEY, r);
  };

  return <RoleContext.Provider value={{ role, setRole }}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) return { role: "Viewer" as Role, setRole: () => {} };
  return ctx;
}